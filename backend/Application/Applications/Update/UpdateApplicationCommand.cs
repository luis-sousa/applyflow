using backend.Application.Common;
using backend.Domain.Entities;
using backend.Infrastructure;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace backend.Application.Applications.Update;

public sealed record UpdateApplicationCommand(
    Guid UserId,
    Guid ApplicationId,
    string? Title,
    string? CompanyName,
    string? Status,
    DateTime? AppliedDate,
    string? Notes) : IRequest<Result<ApplicationResponse>>;

public sealed class UpdateApplicationCommandHandler : IRequestHandler<UpdateApplicationCommand, Result<ApplicationResponse>>
{
    private readonly ApplyFlowDbContext _dbContext;

    public UpdateApplicationCommandHandler(ApplyFlowDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Result<ApplicationResponse>> Handle(UpdateApplicationCommand request, CancellationToken cancellationToken)
    {
        var application = await _dbContext.JobApplications
            .FirstOrDefaultAsync(a => a.Id == request.ApplicationId && a.UserId == request.UserId, cancellationToken);

        if (application is null)
        {
            return Result<ApplicationResponse>.Failure(ResultErrorType.NotFound, "Application not found.");
        }

        if (!string.IsNullOrEmpty(request.Title))
            application.Title = request.Title;
        if (!string.IsNullOrEmpty(request.CompanyName))
            application.CompanyName = request.CompanyName;
        if (!string.IsNullOrEmpty(request.Status))
        {
            if (Enum.TryParse<ApplicationStatus>(request.Status, out var status))
                application.Status = status;
            else
                return Result<ApplicationResponse>.Failure(ResultErrorType.Validation, "Invalid status value");
        }
        if (request.AppliedDate.HasValue)
            application.AppliedDate = request.AppliedDate.Value;
        if (request.Notes != null)
            application.Notes = request.Notes;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result<ApplicationResponse>.Success(application.ToResponse());
    }
}
