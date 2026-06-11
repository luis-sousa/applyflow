using backend.Application.Common;
using backend.Domain.Entities;
using backend.Infrastructure;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace backend.Application.Auth.Register;

public sealed record RegisterCommand(string Email, string Password) : IRequest<Result<AuthResponse>>;

public sealed class RegisterCommandHandler : IRequestHandler<RegisterCommand, Result<AuthResponse>>
{
    private readonly ApplyFlowDbContext _dbContext;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public RegisterCommandHandler(ApplyFlowDbContext dbContext, IJwtTokenGenerator jwtTokenGenerator)
    {
        _dbContext = dbContext;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    public async Task<Result<AuthResponse>> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return Result<AuthResponse>.Failure(ResultErrorType.Validation, "Email and password are required.");
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        if (await _dbContext.Users.AnyAsync(u => u.Email == normalizedEmail, cancellationToken))
        {
            return Result<AuthResponse>.Failure(ResultErrorType.Conflict, "Email is already registered.");
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = normalizedEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync(cancellationToken);

        var token = _jwtTokenGenerator.GenerateToken(user);
        return Result<AuthResponse>.Success(new AuthResponse(token, user.Id, user.Email, user.CreatedAt));
    }
}
