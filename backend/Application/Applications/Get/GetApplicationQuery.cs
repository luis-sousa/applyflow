using backend.Application.Common;
using backend.Infrastructure;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace backend.Application.Applications.Get;

public sealed record GetApplicationQuery(Guid UserId, Guid ApplicationId) : IRequest<Result<ApplicationResponse>>;

public sealed class GetApplicationQueryHandler : IRequestHandler<GetApplicationQuery, Result<ApplicationResponse>>
{
    private readonly ApplyFlowDbContext _dbContext;

    public GetApplicationQueryHandler(ApplyFlowDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Result<ApplicationResponse>> Handle(GetApplicationQuery request, CancellationToken cancellationToken)
    {
        var application = await _dbContext.JobApplications
            .FirstOrDefaultAsync(a => a.Id == request.ApplicationId && a.UserId == request.UserId, cancellationToken);

        if (application is null)
        {
            return Result<ApplicationResponse>.Failure(ResultErrorType.NotFound, "Application not found.");
        }

        return Result<ApplicationResponse>.Success(application.ToResponse());
    }
}
