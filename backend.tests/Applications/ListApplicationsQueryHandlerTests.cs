using backend.Application.Applications.List;
using backend.Domain.Entities;
using backend.tests.TestHelpers;
using Xunit;

namespace backend.tests.Applications;

public class ListApplicationsQueryHandlerTests
{
    private static JobApplication CreateApplication(Guid userId, string title, DateTime appliedDate) => new()
    {
        Id = Guid.NewGuid(),
        Title = title,
        CompanyName = "Some Company",
        Status = ApplicationStatus.Applied,
        AppliedDate = appliedDate,
        UserId = userId
    };

    // Only applications belonging to the requesting user should be returned.
    [Fact]
    public async Task Handle_ReturnsOnlyApplicationsForRequestingUser()
    {
        // Arrange
        using var dbContext = TestDbContextFactory.Create();
        var userId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();

        dbContext.JobApplications.AddRange(
            CreateApplication(userId, "My App 1", new DateTime(2026, 1, 1)),
            CreateApplication(userId, "My App 2", new DateTime(2026, 2, 1)),
            CreateApplication(otherUserId, "Someone Else's App", new DateTime(2026, 3, 1)));
        await dbContext.SaveChangesAsync();

        var handler = new ListApplicationsQueryHandler(dbContext);
        var query = new ListApplicationsQuery(userId);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(2, result.Value!.Count);
        Assert.All(result.Value, a => Assert.NotEqual("Someone Else's App", a.Title));
    }

    // Results should be ordered by applied date, most recent first.
    [Fact]
    public async Task Handle_OrdersResultsByAppliedDateDescending()
    {
        // Arrange
        using var dbContext = TestDbContextFactory.Create();
        var userId = Guid.NewGuid();

        dbContext.JobApplications.AddRange(
            CreateApplication(userId, "Oldest", new DateTime(2026, 1, 1)),
            CreateApplication(userId, "Newest", new DateTime(2026, 3, 1)),
            CreateApplication(userId, "Middle", new DateTime(2026, 2, 1)));
        await dbContext.SaveChangesAsync();

        var handler = new ListApplicationsQueryHandler(dbContext);
        var query = new ListApplicationsQuery(userId);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(new[] { "Newest", "Middle", "Oldest" }, result.Value!.Select(a => a.Title));
    }

    // A user with no applications should get an empty (not null) list.
    [Fact]
    public async Task Handle_NoApplications_ReturnsEmptyList()
    {
        // Arrange
        using var dbContext = TestDbContextFactory.Create();
        var handler = new ListApplicationsQueryHandler(dbContext);
        var query = new ListApplicationsQuery(Guid.NewGuid());

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Empty(result.Value!);
    }
}
