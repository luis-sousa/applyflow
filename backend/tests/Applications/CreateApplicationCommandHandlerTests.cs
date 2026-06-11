using backend.Application.Applications.Create;
using backend.Application.Common;
using backend.Domain.Entities;
using backend.tests.TestHelpers;
using Xunit;

namespace backend.tests.Applications;

public class CreateApplicationCommandHandlerTests
{
    // Creating an application with valid data should persist it scoped to the requesting user.
    [Fact]
    public async Task Handle_ValidCommand_PersistsApplicationForUser()
    {
        // Arrange
        using var dbContext = TestDbContextFactory.Create();
        var userId = Guid.NewGuid();
        var handler = new CreateApplicationCommandHandler(dbContext);
        var appliedDate = new DateTime(2026, 6, 1, 0, 0, 0, DateTimeKind.Utc);
        var command = new CreateApplicationCommand(
            UserId: userId,
            Title: "Backend Engineer",
            CompanyName: "Acme Corp",
            Status: nameof(ApplicationStatus.Applied),
            AppliedDate: appliedDate,
            Notes: "Referred by a friend");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal("Backend Engineer", result.Value!.Title);
        Assert.Equal("Acme Corp", result.Value.CompanyName);
        Assert.Equal(nameof(ApplicationStatus.Applied), result.Value.Status);
        Assert.Equal(appliedDate, result.Value.AppliedDate);
        Assert.Equal("Referred by a friend", result.Value.Notes);

        var stored = Assert.Single(dbContext.JobApplications);
        Assert.Equal(userId, stored.UserId);
        Assert.Equal(result.Value.Id, stored.Id);
    }

    // An invalid status string must be rejected before anything is saved.
    [Fact]
    public async Task Handle_InvalidStatus_ReturnsValidationErrorAndDoesNotPersist()
    {
        // Arrange
        using var dbContext = TestDbContextFactory.Create();
        var handler = new CreateApplicationCommandHandler(dbContext);
        var command = new CreateApplicationCommand(
            UserId: Guid.NewGuid(),
            Title: "Backend Engineer",
            CompanyName: "Acme Corp",
            Status: "NotARealStatus",
            AppliedDate: DateTime.UtcNow,
            Notes: null);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal(ResultErrorType.Validation, result.ErrorType);
        Assert.Empty(dbContext.JobApplications);
    }

    // Notes are optional and should be stored as null when not provided.
    [Fact]
    public async Task Handle_WithoutNotes_PersistsNullNotes()
    {
        // Arrange
        using var dbContext = TestDbContextFactory.Create();
        var handler = new CreateApplicationCommandHandler(dbContext);
        var command = new CreateApplicationCommand(
            UserId: Guid.NewGuid(),
            Title: "QA Engineer",
            CompanyName: "Beta Inc",
            Status: nameof(ApplicationStatus.Applied),
            AppliedDate: DateTime.UtcNow,
            Notes: null);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Null(result.Value!.Notes);
    }
}
