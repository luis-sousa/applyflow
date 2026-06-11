using backend.Application.Common;
using backend.Domain.Entities;
using backend.Infrastructure;
using MediatR;

namespace backend.Application.Applications.Create;

public sealed record CreateApplicationCommand(
    Guid UserId,
    string Title,
    string CompanyName,
    string Status,
    DateTime AppliedDate,
    string? Notes) : IRequest<Result<ApplicationResponse>>;

public sealed class CreateApplicationCommandHandler : IRequestHandler<CreateApplicationCommand, Result<ApplicationResponse>>
{
    private readonly ApplyFlowDbContext _dbContext;

    public CreateApplicationCommandHandler(ApplyFlowDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Result<ApplicationResponse>> Handle(CreateApplicationCommand request, CancellationToken cancellationToken)
    {
        if (!Enum.TryParse<ApplicationStatus>(request.Status, out var status))
        {
            return Result<ApplicationResponse>.Failure(ResultErrorType.Validation, "Invalid status value");
        }

        var application = new JobApplication
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            CompanyName = request.CompanyName,
            Status = status,
            AppliedDate = request.AppliedDate,
            Notes = request.Notes,
            UserId = request.UserId
        };

        _dbContext.JobApplications.Add(application);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result<ApplicationResponse>.Success(application.ToResponse());
    }
}
