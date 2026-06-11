using backend.Application.Auth.Register;
using backend.Application.Common;
using backend.Domain.Entities;
using backend.tests.TestHelpers;
using Xunit;

namespace backend.tests.Auth;

public class RegisterCommandHandlerTests
{
    // A new user with a valid email/password should be persisted, hashed, and returned with a JWT.
    [Fact]
    public async Task Handle_ValidNewUser_CreatesUserAndReturnsToken()
    {
        // Arrange
        using var dbContext = TestDbContextFactory.Create();
        var jwtTokenGenerator = new FakeJwtTokenGenerator();
        var handler = new RegisterCommandHandler(dbContext, jwtTokenGenerator);
        var command = new RegisterCommand("New.User@Example.com", "P@ssw0rd!");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(FakeJwtTokenGenerator.FakeToken, result.Value!.Token);
        Assert.Equal("new.user@example.com", result.Value.Email);

        var storedUser = await dbContext.Users.FindAsync(result.Value.UserId);
        Assert.NotNull(storedUser);
        Assert.Equal("new.user@example.com", storedUser!.Email);
        Assert.NotEqual("P@ssw0rd!", storedUser.PasswordHash); // password must be hashed, not stored as-is
        Assert.True(BCrypt.Net.BCrypt.Verify("P@ssw0rd!", storedUser.PasswordHash));
    }

    // Email should be normalized (trimmed and lower-cased) before being stored and compared.
    [Fact]
    public async Task Handle_EmailWithWhitespaceAndMixedCase_IsNormalized()
    {
        // Arrange
        using var dbContext = TestDbContextFactory.Create();
        var jwtTokenGenerator = new FakeJwtTokenGenerator();
        var handler = new RegisterCommandHandler(dbContext, jwtTokenGenerator);
        var command = new RegisterCommand("  Mixed.Case@Example.COM  ", "Password123");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal("mixed.case@example.com", result.Value!.Email);
    }

    [Theory]
    [InlineData("", "Password123")]
    [InlineData("   ", "Password123")]
    [InlineData("user@example.com", "")]
    [InlineData("user@example.com", "   ")]
    public async Task Handle_MissingEmailOrPassword_ReturnsValidationError(string email, string password)
    {
        // Arrange
        using var dbContext = TestDbContextFactory.Create();
        var jwtTokenGenerator = new FakeJwtTokenGenerator();
        var handler = new RegisterCommandHandler(dbContext, jwtTokenGenerator);
        var command = new RegisterCommand(email, password);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal(ResultErrorType.Validation, result.ErrorType);
        Assert.Empty(dbContext.Users); // nothing should have been persisted
    }

    // Registering with an email that already exists (case-insensitively) must be rejected as a conflict.
    [Fact]
    public async Task Handle_EmailAlreadyRegistered_ReturnsConflict()
    {
        // Arrange
        using var dbContext = TestDbContextFactory.Create();
        dbContext.Users.Add(new User
        {
            Id = Guid.NewGuid(),
            Email = "existing@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("OriginalPassword"),
            CreatedAt = DateTime.UtcNow
        });
        await dbContext.SaveChangesAsync();

        var jwtTokenGenerator = new FakeJwtTokenGenerator();
        var handler = new RegisterCommandHandler(dbContext, jwtTokenGenerator);
        var command = new RegisterCommand("Existing@Example.com", "AnotherPassword");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal(ResultErrorType.Conflict, result.ErrorType);
        Assert.Single(dbContext.Users); // no duplicate user was added
    }
}
