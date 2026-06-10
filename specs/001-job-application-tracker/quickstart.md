# Quickstart: Validate Job Application Tracker (Design Validation)

## Purpose
Provide a quick validation guide to exercise the core feature flows end-to-end against a running implementation.

## Prerequisites
- A running backend instance (ASP.NET Core) with the database migrated
- A running frontend instance (React) configured to talk to the backend API
- A test user account with credentials created via `/api/auth/register`

## Basic Validation Steps
1. Register or login as a test user via `/api/auth/register` or `/api/auth/login`.
2. Create 3 sample applications via `POST /api/applications` with varied statuses.
3. Confirm `GET /api/applications` returns the created items.
4. Visit `/kanban` on the frontend and drag a card from `Applied` to `Interviewing`. Confirm the UI updates and `PATCH /api/applications/{id}/status` reflects the change.
5. Check `/dashboard` to confirm totals and distribution by status match the created items and the moved card.

## Expected Outcomes
- All created applications are returned by the list endpoint.
- Status changes are persisted and visible across list, board, and dashboard views.

## Troubleshooting
- If tokens are rejected, ensure JWT configuration and clocks are synchronized.
- If status updates fail, check optimistic UI rollback logic and server validation errors.
