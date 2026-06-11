using backend.Application.Common;
using backend.Infrastructure;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace backend.Application.Applications.List;

public sealed record ListApplicationsQuery(Guid UserId) : IRequest<Result<List<ApplicationResponse>>>;

public sealed class ListApplicationsQueryHandler : IRequestHandler<ListApplicationsQuery, Result<List<ApplicationResponse>>>
{
    private readonly ApplyFlowDbContext _dbContext;

    public ListApplicationsQueryHandler(ApplyFlowDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Result<List<ApplicationResponse>>> Handle(ListApplicationsQuery request, CancellationToken cancellationToken)
    {
        var applications = await _dbContext.JobApplications
            .Where(a => a.UserId == request.UserId)
            .OrderByDescending(a => a.AppliedDate)
            .ToListAsync(cancellationToken);

        return Result<List<ApplicationResponse>>.Success(applications.Select(a => a.ToResponse()).ToList());
    }
}
