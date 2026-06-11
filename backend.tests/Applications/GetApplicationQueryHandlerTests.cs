using backend.Application.Applications.Get;
using backend.Application.Common;
using backend.Domain.Entities;
using backend.tests.TestHelpers;
using Xunit;

namespace backend.tests.Applications;

public class GetApplicationQueryHandlerTests
{
    private static JobApplication CreateApplication(Guid userId) => new()
    {
        Id = Guid.NewGuid(),
        Title = "Backend Engineer",
        CompanyName = "Acme Corp",
        Status = ApplicationStatus.Applied,
        AppliedDate = new DateTime(2026, 1, 1),
        UserId = userId
    };

    // Fetching an application that exists and belongs to the requesting user should succeed.
    [Fact]
    public async Task Handle_ExistingApplicationOwnedByUser_ReturnsApplication()
    {
        // Arrange
        using var dbContext = TestDbContextFactory.Create();
        var userId = Guid.NewGuid();
        var application = CreateApplication(userId);
        dbContext.JobApplications.Add(application);
        await dbContext.SaveChangesAsync();

        var handler = new GetApplicationQueryHandler(dbContext);
        var query = new GetApplicationQuery(userId, application.Id);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(application.Id, result.Value!.Id);
        Assert.Equal(application.Title, result.Value.Title);
    }

    // An application id that doesn't exist at all must return NotFound.
    [Fact]
    public async Task Handle_UnknownApplicationId_ReturnsNotFound()
    {
        // Arrange
        using var dbContext = TestDbContextFactory.Create();
        var handler = new GetApplicationQueryHandler(dbContext);
        var query = new GetApplicationQuery(Guid.NewGuid(), Guid.NewGuid());

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal(ResultErrorType.NotFound, result.ErrorType);
    }

    // An application that exists but belongs to a different user must also return NotFound,
    // so users cannot probe for the existence of other users' data.
    [Fact]
    public async Task Handle_ApplicationOwnedByDifferentUser_ReturnsNotFound()
    {
        // Arrange
        using var dbContext = TestDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var requestingUserId = Guid.NewGuid();
        var application = CreateApplication(ownerId);
        dbContext.JobApplications.Add(application);
        await dbContext.SaveChangesAsync();

        var handler = new GetApplicationQueryHandler(dbContext);
        var query = new GetApplicationQuery(requestingUserId, application.Id);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal(ResultErrorType.NotFound, result.ErrorType);
    }
}
