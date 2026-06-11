using backend.Application.Common;
using backend.Infrastructure;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace backend.Application.Auth.Login;

public sealed record LoginCommand(string Email, string Password) : IRequest<Result<AuthResponse>>;

public sealed class LoginCommandHandler : IRequestHandler<LoginCommand, Result<AuthResponse>>
{
    private readonly ApplyFlowDbContext _dbContext;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public LoginCommandHandler(ApplyFlowDbContext dbContext, IJwtTokenGenerator jwtTokenGenerator)
    {
        _dbContext = dbContext;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    public async Task<Result<AuthResponse>> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return Result<AuthResponse>.Failure(ResultErrorType.Validation, "Email and password are required.");
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var user = await _dbContext.Users.SingleOrDefaultAsync(u => u.Email == normalizedEmail, cancellationToken);
        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return Result<AuthResponse>.Failure(ResultErrorType.Unauthorized, "Invalid email or password.");
        }

        var token = _jwtTokenGenerator.GenerateToken(user);
        return Result<AuthResponse>.Success(new AuthResponse(token, user.Id, user.Email, user.CreatedAt));
    }
}
