using backend.Application.Common;
using backend.Domain.Entities;

namespace backend.tests.TestHelpers;

// Test double for IJwtTokenGenerator that avoids signing real tokens.
// Records the last user it was asked to generate a token for, so tests can assert on it.
public sealed class FakeJwtTokenGenerator : IJwtTokenGenerator
{
    public const string FakeToken = "fake-jwt-token";

    public User? LastUser { get; private set; }

    public string GenerateToken(User user)
    {
        LastUser = user;
        return FakeToken;
    }
}
