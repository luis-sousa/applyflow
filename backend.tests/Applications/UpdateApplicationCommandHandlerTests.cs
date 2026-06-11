using backend.Application.Applications.Update;
using backend.Application.Common;
using backend.Domain.Entities;
using backend.tests.TestHelpers;
using Xunit;

namespace backend.tests.Applications;

public class UpdateApplicationCommandHandlerTests
{
    private static JobApplication CreateApplication(Guid userId) => new()
    {
        Id = Guid.NewGuid(),
        Title = "Backend Engineer",
        CompanyName = "Acme Corp",
        Status = ApplicationStatus.Applied,
        AppliedDate = new DateTime(2026, 1, 1),
        Notes = "Original notes",
        UserId = userId
    };

    // Updating an existing application owned by the user should persist all supplied changes.
    [Fact]
    public async Task Handle_ValidUpdate_PersistsAllChanges()
    {
        // Arrange
        using var dbContext = TestDbContextFactory.Create();
        var userId = Guid.NewGuid();
        var application = CreateApplication(userId);
        dbContext.JobApplications.Add(application);
        await dbContext.SaveChangesAsync();

        var handler = new UpdateApplicationCommandHandler(dbContext);
        var newAppliedDate = new DateTime(2026, 2, 1);
        var command = new UpdateApplicationCommand(
            UserId: userId,
            ApplicationId: application.Id,
            Title: "Senior Backend Engineer",
            CompanyName: "Acme Corp Updated",
            Status: nameof(ApplicationStatus.Interviewing),
            AppliedDate: newAppliedDate,
            Notes: "Updated notes");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal("Senior Backend Engineer", result.Value!.Title);
        Assert.Equal("Acme Corp Updated", result.Value.CompanyName);
        Assert.Equal(nameof(ApplicationStatus.Interviewing), result.Value.Status);
        Assert.Equal(newAppliedDate, result.Value.AppliedDate);
        Assert.Equal("Updated notes", result.Value.Notes);
    }

    // Only the status field should change when only the status is supplied (drag-and-drop scenario).
    [Fact]
    public async Task Handle_PartialUpdateWithOnlyStatus_LeavesOtherFieldsUnchanged()
    {
        // Arrange
        using var dbContext = TestDbContextFactory.Create();
        var userId = Guid.NewGuid();
        var application = CreateApplication(userId);
        dbContext.JobApplications.Add(application);
        await dbContext.SaveChangesAsync();

        var handler = new UpdateApplicationCommandHandler(dbContext);
        var command = new UpdateApplicationCommand(
            UserId: userId,
            ApplicationId: application.Id,
            Title: null,
            CompanyName: null,
            Status: nameof(ApplicationStatus.Offered),
            AppliedDate: null,
            Notes: null);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(nameof(ApplicationStatus.Offered), result.Value!.Status);
        Assert.Equal("Backend Engineer", result.Value.Title); // unchanged
        Assert.Equal("Acme Corp", result.Value.CompanyName); // unchanged
        Assert.Equal("Original notes", result.Value.Notes); // unchanged
    }

    // An invalid status string must be rejected without modifying the entity.
    [Fact]
    public async Task Handle_InvalidStatus_ReturnsValidationErrorAndDoesNotPersist()
    {
        // Arrange
        using var dbContext = TestDbContextFactory.Create();
        var userId = Guid.NewGuid();
        var application = CreateApplication(userId);
        dbContext.JobApplications.Add(application);
        await dbContext.SaveChangesAsync();

        var handler = new UpdateApplicationCommandHandler(dbContext);
        var command = new UpdateApplicationCommand(
            UserId: userId,
            ApplicationId: application.Id,
            Title: null,
            CompanyName: null,
            Status: "NotARealStatus",
            AppliedDate: null,
            Notes: null);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal(ResultErrorType.Validation, result.ErrorType);

        var unchanged = await dbContext.JobApplications.FindAsync(application.Id);
        Assert.Equal(ApplicationStatus.Applied, unchanged!.Status); // status was not touched
    }

    // Updating an application that doesn't exist must return NotFound.
    [Fact]
    public async Task Handle_UnknownApplicationId_ReturnsNotFound()
    {
        // Arrange
        using var dbContext = TestDbContextFactory.Create();
        var handler = new UpdateApplicationCommandHandler(dbContext);
        var command = new UpdateApplicationCommand(
            UserId: Guid.NewGuid(),
            ApplicationId: Guid.NewGuid(),
            Title: "New Title",
            CompanyName: null,
            Status: null,
            AppliedDate: null,
            Notes: null);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal(ResultErrorType.NotFound, result.ErrorType);
    }

    // A user must not be able to update another user's application.
    [Fact]
    public async Task Handle_ApplicationOwnedByDifferentUser_ReturnsNotFound()
    {
        // Arrange
        using var dbContext = TestDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var attackerId = Guid.NewGuid();
        var application = CreateApplication(ownerId);
        dbContext.JobApplications.Add(application);
        await dbContext.SaveChangesAsync();

        var handler = new UpdateApplicationCommandHandler(dbContext);
        var command = new UpdateApplicationCommand(
            UserId: attackerId,
            ApplicationId: application.Id,
            Title: "Hacked Title",
            CompanyName: null,
            Status: null,
            AppliedDate: null,
            Notes: null);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal(ResultErrorType.NotFound, result.ErrorType);

        var unchanged = await dbContext.JobApplications.FindAsync(application.Id);
        Assert.Equal("Backend Engineer", unchanged!.Title); // unchanged
    }
}
