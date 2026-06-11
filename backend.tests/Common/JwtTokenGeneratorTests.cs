using backend.Application.Common;
using backend.Domain.Entities;
using backend.Infrastructure.Auth;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Xunit;

namespace backend.tests.Common;

public class JwtTokenGeneratorTests
{
    private static JwtTokenGenerator CreateGenerator(JwtSettings settings) =>
        new(Options.Create(settings));

    // The generated token must encode the user's id and email, and use the configured issuer/audience.
    [Fact]
    public void GenerateToken_ValidUser_ReturnsTokenWithExpectedClaimsAndMetadata()
    {
        // Arrange
        var settings = new JwtSettings
        {
            Secret = "super-secret-test-key-that-is-long-enough",
            Issuer = "ApplyFlow.Tests",
            Audience = "ApplyFlow.Tests.Users"
        };
        var generator = CreateGenerator(settings);
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "user@example.com",
            PasswordHash = "irrelevant-hash",
            CreatedAt = DateTime.UtcNow
        };

        // Act
        var token = generator.GenerateToken(user);

        // Assert
        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);
        Assert.Equal(settings.Issuer, jwt.Issuer);
        Assert.Equal(settings.Audience, jwt.Audiences.Single());
        Assert.Equal(user.Id.ToString(), jwt.Claims.Single(c => c.Type == ClaimTypes.NameIdentifier).Value);
        Assert.Equal(user.Email, jwt.Claims.Single(c => c.Type == ClaimTypes.Email).Value);
        Assert.Equal(user.Id.ToString(), jwt.Claims.Single(c => c.Type == JwtRegisteredClaimNames.Sub).Value);
        Assert.True(jwt.ValidTo > DateTime.UtcNow);
    }

    // The token must be signed with the configured secret, so it validates successfully against it
    // and fails validation against a different secret.
    [Fact]
    public void GenerateToken_TokenIsSignedWithConfiguredSecret()
    {
        // Arrange
        var settings = new JwtSettings
        {
            Secret = "super-secret-test-key-that-is-long-enough",
            Issuer = "ApplyFlow.Tests",
            Audience = "ApplyFlow.Tests.Users"
        };
        var generator = CreateGenerator(settings);
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "user@example.com",
            PasswordHash = "irrelevant-hash",
            CreatedAt = DateTime.UtcNow
        };
        var token = generator.GenerateToken(user);
        var handler = new JwtSecurityTokenHandler();

        var validationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = settings.Issuer,
            ValidateAudience = true,
            ValidAudience = settings.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(settings.Secret))
        };

        // Act & Assert: validates successfully with the correct key
        handler.ValidateToken(token, validationParameters, out _);

        // Act & Assert: fails validation with a different key
        var wrongKeyParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = settings.Issuer,
            ValidateAudience = true,
            ValidAudience = settings.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("a-completely-different-secret-key"))
        };
        Assert.Throws<SecurityTokenSignatureKeyNotFoundException>(
            () => handler.ValidateToken(token, wrongKeyParameters, out _));
    }
}
