using backend.Application.Applications.Delete;
using backend.Application.Common;
using backend.Domain.Entities;
using backend.tests.TestHelpers;
using Xunit;

namespace backend.tests.Applications;

public class DeleteApplicationCommandHandlerTests
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

    // Deleting an existing application owned by the user should remove it and return success.
    [Fact]
    public async Task Handle_ExistingApplicationOwnedByUser_DeletesAndReturnsTrue()
    {
        // Arrange
        using var dbContext = TestDbContextFactory.Create();
        var userId = Guid.NewGuid();
        var application = CreateApplication(userId);
        dbContext.JobApplications.Add(application);
        await dbContext.SaveChangesAsync();

        var handler = new DeleteApplicationCommandHandler(dbContext);
        var command = new DeleteApplicationCommand(userId, application.Id);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.True(result.Value);
        Assert.Empty(dbContext.JobApplications);
    }

    // Deleting an application id that doesn't exist must return NotFound.
    [Fact]
    public async Task Handle_UnknownApplicationId_ReturnsNotFound()
    {
        // Arrange
        using var dbContext = TestDbContextFactory.Create();
        var handler = new DeleteApplicationCommandHandler(dbContext);
        var command = new DeleteApplicationCommand(Guid.NewGuid(), Guid.NewGuid());

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal(ResultErrorType.NotFound, result.ErrorType);
    }

    // A user must not be able to delete another user's application.
    [Fact]
    public async Task Handle_ApplicationOwnedByDifferentUser_ReturnsNotFoundAndDoesNotDelete()
    {
        // Arrange
        using var dbContext = TestDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var attackerId = Guid.NewGuid();
        var application = CreateApplication(ownerId);
        dbContext.JobApplications.Add(application);
        await dbContext.SaveChangesAsync();

        var handler = new DeleteApplicationCommandHandler(dbContext);
        var command = new DeleteApplicationCommand(attackerId, application.Id);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal(ResultErrorType.NotFound, result.ErrorType);
        Assert.Single(dbContext.JobApplications); // application still exists
    }
}
