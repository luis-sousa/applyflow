# API Contracts: Job Application Tracker

## Auth
### POST /api/auth/register
Request: { email, password }
Response: { id, email, createdAt }

### POST /api/auth/login
Request: { email, password }
Response: { token }

### GET /api/auth/me
Request: Authorization: Bearer <token>
Response: { id, email }

## Applications
### GET /api/applications
Request: Authorization: Bearer <token>
Response: [{ id, title, companyName, status, appliedDate, notes }]

### GET /api/applications/{id}
Request: Authorization: Bearer <token>
Response: { id, title, companyName, status, appliedDate, notes }

### POST /api/applications
Request: { title, companyName, appliedDate, notes, status }
Response: { id, ... }

### PUT /api/applications/{id}
Request: { title, companyName, appliedDate, notes, status }
Response: { id, ... }

### DELETE /api/applications/{id}
Request: Authorization: Bearer <token>
Response: 204 No Content

### PATCH /api/applications/{id}/status
Request: { status }
Response: { id, status }

## Dashboard
### GET /api/dashboard/summary
Request: Authorization: Bearer <token>
Response: { totalApplications, countsByStatus: { applied, interviewing, offered, accepted, rejected } }

## Notes
- All endpoints are user-scoped; the server must always validate that requested resources belong to the authenticated user.
- Error responses should follow a consistent shape: { code, message, details? }
