using backend.Application.Common;
using backend.Infrastructure;
using MediatR;

namespace backend.Application.Auth.GetMe;

public sealed record GetMeQuery(Guid UserId) : IRequest<Result<UserInfoResponse>>;

public sealed class GetMeQueryHandler : IRequestHandler<GetMeQuery, Result<UserInfoResponse>>
{
    private readonly ApplyFlowDbContext _dbContext;

    public GetMeQueryHandler(ApplyFlowDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Result<UserInfoResponse>> Handle(GetMeQuery request, CancellationToken cancellationToken)
    {
        var user = await _dbContext.Users.FindAsync(new object?[] { request.UserId }, cancellationToken);
        if (user is null)
        {
            return Result<UserInfoResponse>.Failure(ResultErrorType.NotFound, "User not found.");
        }

        return Result<UserInfoResponse>.Success(new UserInfoResponse(user.Id, user.Email, user.CreatedAt));
    }
}
