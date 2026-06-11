using backend.Application.Common;
using Microsoft.AspNetCore.Http;
using Xunit;

namespace backend.tests.Common;

public class ResultExtensionsTests
{
    // A Validation failure must map to a 400 Bad Request carrying the error message.
    [Fact]
    public void ToErrorResult_ValidationError_ReturnsBadRequest()
    {
        // Arrange
        var result = Result<string>.Failure(ResultErrorType.Validation, "Email is required.");

        // Act
        var httpResult = result.ToErrorResult();

        // Assert
        var statusCodeResult = Assert.IsAssignableFrom<IStatusCodeHttpResult>(httpResult);
        Assert.Equal(StatusCodes.Status400BadRequest, statusCodeResult.StatusCode);
    }

    // A NotFound failure must map to a bare 404 with no body.
    [Fact]
    public void ToErrorResult_NotFoundError_ReturnsNotFound()
    {
        // Arrange
        var result = Result<string>.Failure(ResultErrorType.NotFound, "Application not found.");

        // Act
        var httpResult = result.ToErrorResult();

        // Assert
        var statusCodeResult = Assert.IsAssignableFrom<IStatusCodeHttpResult>(httpResult);
        Assert.Equal(StatusCodes.Status404NotFound, statusCodeResult.StatusCode);
    }

    // A Conflict failure must map to a 409 Conflict carrying the error message.
    [Fact]
    public void ToErrorResult_ConflictError_ReturnsConflict()
    {
        // Arrange
        var result = Result<string>.Failure(ResultErrorType.Conflict, "Email is already registered.");

        // Act
        var httpResult = result.ToErrorResult();

        // Assert
        var statusCodeResult = Assert.IsAssignableFrom<IStatusCodeHttpResult>(httpResult);
        Assert.Equal(StatusCodes.Status409Conflict, statusCodeResult.StatusCode);
    }

    // An Unauthorized failure must map to a bare 401 with no body, avoiding leaking details.
    [Fact]
    public void ToErrorResult_UnauthorizedError_ReturnsUnauthorized()
    {
        // Arrange
        var result = Result<string>.Failure(ResultErrorType.Unauthorized, "Invalid email or password.");

        // Act
        var httpResult = result.ToErrorResult();

        // Assert
        var statusCodeResult = Assert.IsAssignableFrom<IStatusCodeHttpResult>(httpResult);
        Assert.Equal(StatusCodes.Status401Unauthorized, statusCodeResult.StatusCode);
    }

    // Any unexpected error type should fall back to a generic Problem (500) response.
    [Fact]
    public void ToErrorResult_UnknownErrorType_ReturnsProblem()
    {
        // Arrange
        var result = Result<string>.Failure(ResultErrorType.None, "Something went wrong.");

        // Act
        var httpResult = result.ToErrorResult();

        // Assert
        var statusCodeResult = Assert.IsAssignableFrom<IStatusCodeHttpResult>(httpResult);
        Assert.Equal(StatusCodes.Status500InternalServerError, statusCodeResult.StatusCode);
    }
}
