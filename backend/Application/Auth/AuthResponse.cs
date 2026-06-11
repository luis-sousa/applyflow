namespace backend.Application.Auth;

public sealed record AuthResponse(string Token, Guid UserId, string Email, DateTime CreatedAt);

public sealed record UserInfoResponse(Guid Id, string Email, DateTime CreatedAt);
