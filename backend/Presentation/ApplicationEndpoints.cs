using backend.Application.Applications.Create;
using backend.Application.Applications.Delete;
using backend.Application.Applications.Get;
using backend.Application.Applications.List;
using backend.Application.Applications.Update;
using backend.Application.Common;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace backend.Presentation;

public static class ApplicationEndpoints
{
    public static WebApplication MapApplicationEndpoints(this WebApplication app)
    {
        app.MapPost("/api/applications", [Authorize] async (
            ClaimsPrincipal userPrincipal,
            ISender sender,
            CreateApplicationRequest request) =>
        {
            var userId = ExtractUserId(userPrincipal);
            if (userId == Guid.Empty)
                return Results.Unauthorized();

            var result = await sender.Send(new CreateApplicationCommand(
                userId, request.Title, request.CompanyName, request.Status, request.AppliedDate, request.Notes));

            if (!result.IsSuccess)
                return result.ToErrorResult();

            return Results.Created($"/api/applications/{result.Value!.Id}", result.Value);
        })
        .WithName("CreateApplication")
        .WithTags("Applications");

        app.MapGet("/api/applications", [Authorize] async (
            ClaimsPrincipal userPrincipal,
            ISender sender) =>
        {
            var userId = ExtractUserId(userPrincipal);
            if (userId == Guid.Empty)
                return Results.Unauthorized();

            var result = await sender.Send(new ListApplicationsQuery(userId));
            return result.IsSuccess ? Results.Ok(result.Value) : result.ToErrorResult();
        })
        .WithName("ListApplications")
        .WithTags("Applications");

        app.MapGet("/api/applications/{id}", [Authorize] async (
            Guid id,
            ClaimsPrincipal userPrincipal,
            ISender sender) =>
        {
            var userId = ExtractUserId(userPrincipal);
            if (userId == Guid.Empty)
                return Results.Unauthorized();

            var result = await sender.Send(new GetApplicationQuery(userId, id));
            return result.IsSuccess ? Results.Ok(result.Value) : result.ToErrorResult();
        })
        .WithName("GetApplication")
        .WithTags("Applications");

        app.MapPatch("/api/applications/{id}", [Authorize] async (
            Guid id,
            ClaimsPrincipal userPrincipal,
            ISender sender,
            UpdateApplicationRequest request) =>
        {
            var userId = ExtractUserId(userPrincipal);
            if (userId == Guid.Empty)
                return Results.Unauthorized();

            var result = await sender.Send(new UpdateApplicationCommand(
                userId, id, request.Title, request.CompanyName, request.Status, request.AppliedDate, request.Notes));

            return result.IsSuccess ? Results.Ok(result.Value) : result.ToErrorResult();
        })
        .WithName("UpdateApplication")
        .WithTags("Applications");

        app.MapDelete("/api/applications/{id}", [Authorize] async (
            Guid id,
            ClaimsPrincipal userPrincipal,
            ISender sender) =>
        {
            var userId = ExtractUserId(userPrincipal);
            if (userId == Guid.Empty)
                return Results.Unauthorized();

            var result = await sender.Send(new DeleteApplicationCommand(userId, id));
            return result.IsSuccess ? Results.NoContent() : result.ToErrorResult();
        })
        .WithName("DeleteApplication")
        .WithTags("Applications");

        return app;
    }

    private static Guid ExtractUserId(ClaimsPrincipal userPrincipal)
    {
        var userId = userPrincipal.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? userPrincipal.FindFirst("sub")?.Value;

        if (string.IsNullOrWhiteSpace(userId) || !Guid.TryParse(userId, out var parsedUserId))
            return Guid.Empty;

        return parsedUserId;
    }
}

public sealed record CreateApplicationRequest
{
    public required string Title { get; init; }
    public required string CompanyName { get; init; }
    public required string Status { get; init; }
    public required DateTime AppliedDate { get; init; }
    public string? Notes { get; init; }
}

public sealed record UpdateApplicationRequest
{
    public string? Title { get; init; }
    public string? CompanyName { get; init; }
    public string? Status { get; init; }
    public DateTime? AppliedDate { get; init; }
    public string? Notes { get; init; }
}
