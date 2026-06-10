using backend.Domain.Entities;
using backend.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace backend.Api;

public static class ApplicationEndpoints
{
    public static WebApplication MapApplicationEndpoints(this WebApplication app)
    {
        app.MapPost("/api/applications", [Authorize] async (
            ClaimsPrincipal userPrincipal,
            ApplyFlowDbContext dbContext,
            CreateApplicationRequest request) =>
        {
            var userId = ExtractUserId(userPrincipal);
            if (userId == Guid.Empty)
                return Results.Unauthorized();

            if (!Enum.TryParse<ApplicationStatus>(request.Status, out var status))
                return Results.BadRequest(new { error = "Invalid status value" });

            var application = new JobApplication
            {
                Id = Guid.NewGuid(),
                Title = request.Title,
                CompanyName = request.CompanyName,
                Status = status,
                AppliedDate = request.AppliedDate,
                Notes = request.Notes,
                UserId = userId
            };

            dbContext.JobApplications.Add(application);
            await dbContext.SaveChangesAsync();

            return Results.Created($"/api/applications/{application.Id}", 
                MapToResponse(application));
        })
        .WithName("CreateApplication")
        .WithTags("Applications");

        app.MapGet("/api/applications", [Authorize] async (
            ClaimsPrincipal userPrincipal,
            ApplyFlowDbContext dbContext) =>
        {
            var userId = ExtractUserId(userPrincipal);
            if (userId == Guid.Empty)
                return Results.Unauthorized();

            var applications = await dbContext.JobApplications
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.AppliedDate)
                .Select(a => MapToResponse(a))
                .ToListAsync();

            return Results.Ok(applications);
        })
        .WithName("ListApplications")
        .WithTags("Applications");

        app.MapGet("/api/applications/{id}", [Authorize] async (
            Guid id,
            ClaimsPrincipal userPrincipal,
            ApplyFlowDbContext dbContext) =>
        {
            var userId = ExtractUserId(userPrincipal);
            if (userId == Guid.Empty)
                return Results.Unauthorized();

            var application = await dbContext.JobApplications
                .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);

            if (application is null)
                return Results.NotFound();

            return Results.Ok(MapToResponse(application));
        })
        .WithName("GetApplication")
        .WithTags("Applications");

        app.MapPatch("/api/applications/{id}", [Authorize] async (
            Guid id,
            ClaimsPrincipal userPrincipal,
            ApplyFlowDbContext dbContext,
            UpdateApplicationRequest request) =>
        {
            var userId = ExtractUserId(userPrincipal);
            if (userId == Guid.Empty)
                return Results.Unauthorized();

            var application = await dbContext.JobApplications
                .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);

            if (application is null)
                return Results.NotFound();

            if (!string.IsNullOrEmpty(request.Title))
                application.Title = request.Title;
            if (!string.IsNullOrEmpty(request.CompanyName))
                application.CompanyName = request.CompanyName;
            if (!string.IsNullOrEmpty(request.Status))
            {
                if (Enum.TryParse<ApplicationStatus>(request.Status, out var status))
                    application.Status = status;
                else
                    return Results.BadRequest(new { error = "Invalid status value" });
            }
            if (request.AppliedDate.HasValue)
                application.AppliedDate = request.AppliedDate.Value;
            if (request.Notes != null)
                application.Notes = request.Notes;

            await dbContext.SaveChangesAsync();

            return Results.Ok(MapToResponse(application));
        })
        .WithName("UpdateApplication")
        .WithTags("Applications");

        app.MapDelete("/api/applications/{id}", [Authorize] async (
            Guid id,
            ClaimsPrincipal userPrincipal,
            ApplyFlowDbContext dbContext) =>
        {
            var userId = ExtractUserId(userPrincipal);
            if (userId == Guid.Empty)
                return Results.Unauthorized();

            var application = await dbContext.JobApplications
                .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);

            if (application is null)
                return Results.NotFound();

            dbContext.JobApplications.Remove(application);
            await dbContext.SaveChangesAsync();

            return Results.NoContent();
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

    private static ApplicationResponse MapToResponse(JobApplication application)
    {
        return new ApplicationResponse(
            application.Id,
            application.Title,
            application.CompanyName,
            application.Status.ToString(),
            application.AppliedDate,
            application.Notes
        );
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

public sealed record ApplicationResponse(
    Guid Id,
    string Title,
    string CompanyName,
    string Status,
    DateTime AppliedDate,
    string? Notes
);
