using System.Data.Common;
using System.Text.Json;
using backend.Presentation.Middleware;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace backend.tests.Middleware;

// Minimal concrete DbException so we can simulate a database-connectivity failure
// without depending on a real Npgsql exception (which has no public constructor).
file sealed class FakeDbException : DbException
{
    public FakeDbException(string message) : base(message)
    {
    }
}

public class GlobalExceptionHandlerTests
{
    private static (GlobalExceptionHandler handler, DefaultHttpContext httpContext) CreateSut()
    {
        var handler = new GlobalExceptionHandler(NullLogger<GlobalExceptionHandler>.Instance);
        var httpContext = new DefaultHttpContext
        {
            Response = { Body = new MemoryStream() }
        };
        return (handler, httpContext);
    }

    private static async Task<ProblemDetails> ReadProblemDetailsAsync(DefaultHttpContext httpContext)
    {
        httpContext.Response.Body.Seek(0, SeekOrigin.Begin);
        var problemDetails = await JsonSerializer.DeserializeAsync<ProblemDetails>(httpContext.Response.Body);
        return problemDetails!;
    }

    // A database connectivity failure (e.g. Postgres unreachable) should be reported as 503
    // with a friendly, non-leaking message rather than the raw exception/stack trace.
    [Fact]
    public async Task TryHandleAsync_DbException_Returns503WithFriendlyMessage()
    {
        // Arrange
        var (handler, httpContext) = CreateSut();
        var exception = new FakeDbException("Failed to connect to 127.0.0.1:5432");

        // Act
        var handled = await handler.TryHandleAsync(httpContext, exception, CancellationToken.None);

        // Assert
        Assert.True(handled);
        Assert.Equal(StatusCodes.Status503ServiceUnavailable, httpContext.Response.StatusCode);

        var problem = await ReadProblemDetailsAsync(httpContext);
        Assert.Equal(StatusCodes.Status503ServiceUnavailable, problem.Status);
        Assert.DoesNotContain("127.0.0.1", problem.Title); // raw connection details must not leak
    }

    // Any other unhandled exception should be reported as a generic 500 without leaking details.
    [Fact]
    public async Task TryHandleAsync_UnexpectedException_Returns500WithGenericMessage()
    {
        // Arrange
        var (handler, httpContext) = CreateSut();
        var exception = new InvalidOperationException("some internal secret detail");

        // Act
        var handled = await handler.TryHandleAsync(httpContext, exception, CancellationToken.None);

        // Assert
        Assert.True(handled);
        Assert.Equal(StatusCodes.Status500InternalServerError, httpContext.Response.StatusCode);

        var problem = await ReadProblemDetailsAsync(httpContext);
        Assert.Equal(StatusCodes.Status500InternalServerError, problem.Status);
        Assert.DoesNotContain("some internal secret detail", problem.Title);
    }
}
