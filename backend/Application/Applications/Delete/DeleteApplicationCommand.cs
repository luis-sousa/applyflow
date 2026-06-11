using backend.Application.Common;
using backend.Infrastructure;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace backend.Application.Applications.Delete;

public sealed record DeleteApplicationCommand(Guid UserId, Guid ApplicationId) : IRequest<Result<bool>>;

public sealed class DeleteApplicationCommandHandler : IRequestHandler<DeleteApplicationCommand, Result<bool>>
{
    private readonly ApplyFlowDbContext _dbContext;

    public DeleteApplicationCommandHandler(ApplyFlowDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Result<bool>> Handle(DeleteApplicationCommand request, CancellationToken cancellationToken)
    {
        var application = await _dbContext.JobApplications
            .FirstOrDefaultAsync(a => a.Id == request.ApplicationId && a.UserId == request.UserId, cancellationToken);

        if (application is null)
        {
            return Result<bool>.Failure(ResultErrorType.NotFound, "Application not found.");
        }

        _dbContext.JobApplications.Remove(application);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }
}
