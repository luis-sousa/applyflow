using backend.Domain.Entities;

namespace backend.Application.Common;

public interface IJwtTokenGenerator
{
    string GenerateToken(User user);
}
