using backend.Application.Auth.GetMe;
using backend.Application.Common;
using backend.Domain.Entities;
using backend.tests.TestHelpers;
using Xunit;

namespace backend.tests.Auth;

public class GetMeQueryHandlerTests
{
    // Requesting the profile of an existing user should return their public info.
    [Fact]
    public async Task Handle_ExistingUser_ReturnsUserInfo()
    {
        // Arrange
        using var dbContext = TestDbContextFactory.Create();
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "user@example.com",
            PasswordHash = "irrelevant-hash",
            CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        };
        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync();

        var handler = new GetMeQueryHandler(dbContext);
        var query = new GetMeQuery(user.Id);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(user.Id, result.Value!.Id);
        Assert.Equal(user.Email, result.Value.Email);
        Assert.Equal(user.CreatedAt, result.Value.CreatedAt);
    }

    // Requesting a profile for a user id that doesn't exist should return NotFound.
    [Fact]
    public async Task Handle_UnknownUser_ReturnsNotFound()
    {
        // Arrange
        using var dbContext = TestDbContextFactory.Create();
        var handler = new GetMeQueryHandler(dbContext);
        var query = new GetMeQuery(Guid.NewGuid());

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal(ResultErrorType.NotFound, result.ErrorType);
    }
}
