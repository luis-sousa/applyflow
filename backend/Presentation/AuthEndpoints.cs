using backend.Application.Auth.GetMe;
using backend.Application.Auth.Login;
using backend.Application.Auth.Register;
using backend.Application.Common;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace backend.Presentation;

public static class AuthEndpoints
{
    public static WebApplication MapAuthEndpoints(this WebApplication app)
    {
        app.MapPost("/api/auth/register", async (ISender sender, AuthRequest request) =>
        {
            var result = await sender.Send(new RegisterCommand(request.Email, request.Password));
            if (!result.IsSuccess)
                return result.ToErrorResult();

            return Results.Created($"/api/auth/users/{result.Value!.UserId}", result.Value);
        })
        .WithName("Register")
        .WithTags("Auth");

        app.MapPost("/api/auth/login", async (ISender sender, AuthRequest request) =>
        {
            var result = await sender.Send(new LoginCommand(request.Email, request.Password));
            return result.IsSuccess ? Results.Ok(result.Value) : result.ToErrorResult();
        })
        .WithName("Login")
        .WithTags("Auth");

        app.MapGet("/api/auth/me", [Authorize] async (ClaimsPrincipal userPrincipal, ISender sender) =>
        {
            var userId = ExtractUserId(userPrincipal);
            if (userId == Guid.Empty)
                return Results.Unauthorized();

            var result = await sender.Send(new GetMeQuery(userId));
            return result.IsSuccess ? Results.Ok(result.Value) : result.ToErrorResult();
        })
        .WithName("Me")
        .WithTags("Auth");

        return app;
    }

    private static Guid ExtractUserId(ClaimsPrincipal userPrincipal)
    {
        var userId = userPrincipal.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? userPrincipal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;

        if (string.IsNullOrWhiteSpace(userId) || !Guid.TryParse(userId, out var parsedUserId))
            return Guid.Empty;

        return parsedUserId;
    }
}

public sealed record AuthRequest
{
    public required string Email { get; init; }
    public required string Password { get; init; }
}
