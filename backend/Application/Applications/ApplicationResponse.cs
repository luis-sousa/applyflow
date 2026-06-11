using backend.Domain.Entities;

namespace backend.Application.Applications;

public sealed record ApplicationResponse(
    Guid Id,
    string Title,
    string CompanyName,
    string Status,
    DateTime AppliedDate,
    string? Notes
);

public static class JobApplicationMappingExtensions
{
    public static ApplicationResponse ToResponse(this JobApplication application) => new(
        application.Id,
        application.Title,
        application.CompanyName,
        application.Status.ToString(),
        application.AppliedDate,
        application.Notes
    );
}
