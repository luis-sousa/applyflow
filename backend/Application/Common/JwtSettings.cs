namespace backend.Application.Common;

public sealed class JwtSettings
{
    public const string SectionName = "JwtSettings";

    public string Secret { get; set; } = "ReplaceWithSecureSecretInProduction";
    public string Issuer { get; set; } = "ApplyFlow";
    public string Audience { get; set; } = "ApplyFlowUsers";
}
