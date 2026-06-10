using backend.Domain.Entities;
using backend.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace backend.Api;

public static class AuthEndpoints
{
    public static WebApplication MapAuthEndpoints(this WebApplication app)
    {
        app.MapPost("/api/auth/register", async (
            ApplyFlowDbContext dbContext,
            IConfiguration configuration,
            AuthRequest request) =>
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            {
                return Results.BadRequest(new { Error = "Email and password are required." });
            }

            var normalizedEmail = request.Email.Trim().ToLowerInvariant();
            if (await dbContext.Users.AnyAsync(u => u.Email == normalizedEmail))
            {
                return Results.Conflict(new { Error = "Email is already registered." });
            }

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = normalizedEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                CreatedAt = DateTime.UtcNow
            };

            dbContext.Users.Add(user);
            await dbContext.SaveChangesAsync();

            var token = CreateJwtToken(user, configuration);
            return Results.Created($"/api/auth/users/{user.Id}", new AuthResponse(token, user.Id, user.Email, user.CreatedAt));
        })
        .WithName("Register")
        .WithTags("Auth");

        app.MapPost("/api/auth/login", async (
            ApplyFlowDbContext dbContext,
            IConfiguration configuration,
            AuthRequest request) =>
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            {
                return Results.BadRequest(new { Error = "Email and password are required." });
            }

            var normalizedEmail = request.Email.Trim().ToLowerInvariant();
            var user = await dbContext.Users.SingleOrDefaultAsync(u => u.Email == normalizedEmail);
            if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return Results.Unauthorized();
            }

            var token = CreateJwtToken(user, configuration);
            return Results.Ok(new AuthResponse(token, user.Id, user.Email, user.CreatedAt));
        })
        .WithName("Login")
        .WithTags("Auth");

        app.MapGet("/api/auth/me", [Authorize] async (
            ClaimsPrincipal userPrincipal,
            ApplyFlowDbContext dbContext) =>
        {
            var userId = userPrincipal.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? userPrincipal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
            if (string.IsNullOrWhiteSpace(userId) || !Guid.TryParse(userId, out var parsedUserId))
            {
                return Results.Unauthorized();
            }

            var user = await dbContext.Users.FindAsync(parsedUserId);
            if (user is null)
            {
                return Results.NotFound(new { Error = "User not found." });
            }

            return Results.Ok(new UserInfoResponse(user.Id, user.Email, user.CreatedAt));
        })
        .WithName("Me")
        .WithTags("Auth");

        return app;
    }

    private static string CreateJwtToken(User user, IConfiguration configuration)
    {
        var jwtSecret = configuration["JwtSettings:Secret"] ?? "ReplaceWithSecureSecretInProduction";
        var issuer = configuration["JwtSettings:Issuer"] ?? "ApplyFlow";
        var audience = configuration["JwtSettings:Audience"] ?? "ApplyFlowUsers";

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

public sealed record AuthRequest
{
    public required string Email { get; init; }
    public required string Password { get; init; }
}

public sealed record AuthResponse(string Token, Guid UserId, string Email, DateTime CreatedAt);

public sealed record UserInfoResponse(Guid Id, string Email, DateTime CreatedAt);
