namespace backend.Domain.Entities;

public enum ApplicationStatus
{
    Applied,
    Interviewing,
    Offered,
    Accepted,
    Rejected
}

public class JobApplication
{
    public Guid Id { get; set; }
    public string Title { get; set; } = null!;
    public string CompanyName { get; set; } = null!;
    public ApplicationStatus Status { get; set; }
    public DateTime AppliedDate { get; set; }
    public string? Notes { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
}
