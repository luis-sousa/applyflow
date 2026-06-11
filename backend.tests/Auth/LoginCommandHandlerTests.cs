using backend.Application.Auth.Login;
using backend.Application.Common;
using backend.Domain.Entities;
using backend.tests.TestHelpers;
using Xunit;

namespace backend.tests.Auth;

public class LoginCommandHandlerTests
{
    private static User CreateUser(string email, string password) => new()
    {
        Id = Guid.NewGuid(),
        Email = email,
        PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
        CreatedAt = DateTime.UtcNow
    };

    // A user logging in with the correct (normalized) email and password should receive a token.
    [Fact]
    public async Task Handle_ValidCredentials_ReturnsToken()
    {
        // Arrange
        using var dbContext = TestDbContextFactory.Create();
        var user = CreateUser("user@example.com", "CorrectPassword1");
        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync();

        var jwtTokenGenerator = new FakeJwtTokenGenerator();
        var handler = new LoginCommandHandler(dbContext, jwtTokenGenerator);
        var command = new LoginCommand("User@Example.com", "CorrectPassword1");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(FakeJwtTokenGenerator.FakeToken, result.Value!.Token);
        Assert.Equal(user.Id, result.Value.UserId);
        Assert.Same(user, jwtTokenGenerator.LastUser);
    }

    [Theory]
    [InlineData("", "Password123")]
    [InlineData("user@example.com", "")]
    public async Task Handle_MissingEmailOrPassword_ReturnsValidationError(string email, string password)
    {
        // Arrange
        using var dbContext = TestDbContextFactory.Create();
        var jwtTokenGenerator = new FakeJwtTokenGenerator();
        var handler = new LoginCommandHandler(dbContext, jwtTokenGenerator);
        var command = new LoginCommand(email, password);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal(ResultErrorType.Validation, result.ErrorType);
    }

    // Logging in with an email that doesn't exist must fail with Unauthorized, not NotFound,
    // to avoid leaking which emails are registered.
    [Fact]
    public async Task Handle_UnknownEmail_ReturnsUnauthorized()
    {
        // Arrange
        using var dbContext = TestDbContextFactory.Create();
        var jwtTokenGenerator = new FakeJwtTokenGenerator();
        var handler = new LoginCommandHandler(dbContext, jwtTokenGenerator);
        var command = new LoginCommand("nobody@example.com", "WhateverPassword1");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal(ResultErrorType.Unauthorized, result.ErrorType);
    }

    // A correct email but wrong password must also fail with Unauthorized.
    [Fact]
    public async Task Handle_WrongPassword_ReturnsUnauthorized()
    {
        // Arrange
        using var dbContext = TestDbContextFactory.Create();
        var user = CreateUser("user@example.com", "CorrectPassword1");
        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync();

        var jwtTokenGenerator = new FakeJwtTokenGenerator();
        var handler = new LoginCommandHandler(dbContext, jwtTokenGenerator);
        var command = new LoginCommand("user@example.com", "WrongPassword1");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal(ResultErrorType.Unauthorized, result.ErrorType);
        Assert.Null(jwtTokenGenerator.LastUser); // token must never be issued for failed logins
    }
}
