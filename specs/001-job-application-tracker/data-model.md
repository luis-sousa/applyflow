# Data Model: Job Application Tracker

## Entities

### User
- `Id` (GUID)
- `Email` (string)
- `PasswordHash` (string)
- `CreatedAt` (datetime)

### JobApplication
- `Id` (GUID)
- `Title` (string)
- `CompanyName` (string)
- `Status` (enum: Applied, Interviewing, Offered, Accepted, Rejected)
- `AppliedDate` (date)
- `Notes` (text, optional)
- `UserId` (GUID) — foreign key to `User`

## Relationships
- One `User` has many `JobApplication` records.

## Validation Rules
- `Title` and `CompanyName` are required and non-empty.
- `AppliedDate` must be a valid date not in the future.
- `Status` must be one of the allowed enum values.

## State Transitions
- Allowed status transitions (recommended):
  - `Applied` → `Interviewing` | `Rejected` | `Offer`
  - `Interviewing` → `Offer` | `Rejected`
  - `Offer` → `Accepted` | `Rejected`
  - `Accepted` and `Rejected` are terminal states

## Persistence Notes
- Use integer-backed enum mapping in EF Core for `Status`.
- Index `UserId` on `JobApplication` and consider a composite index on `(UserId, Status)` for common queries.
