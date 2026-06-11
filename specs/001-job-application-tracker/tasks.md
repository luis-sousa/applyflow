# Implementation Tasks: Job Application Tracker

**Feature**: Job Application Tracker
**Spec**: specs/001-job-application-tracker/spec.md

## Phase 1 — Setup

- [x] T001 Initialize repository structure and create root README (`/README.md`)
- [x] T002 Create Docker Compose and Postgres dev manifest (`/docker-compose.yml`)
- [x] T003 Create backend project scaffold (ASP.NET Core solution and project) (`/backend/`)
- [x] T004 Create frontend scaffold (React + TypeScript app) (`/frontend/`)

## Phase 2 — Foundational (blocking prerequisites)

- [x] T005 [US1] Create `User` entity and EF Core migration in backend project (`/backend/Domain/Entities/User.cs`)
- [x] T006 [US1] Implement authentication endpoints and JWT handling (`/backend/Presentation/AuthEndpoints.cs`, `/backend/Application/Auth/`, `/backend/Infrastructure/Auth/JwtTokenGenerator.cs`)
- [x] T007 [US1] Add database context, connection configuration, and initial migration (`/backend/Infrastructure/ApplyFlowDbContext.cs`, `/backend/Migrations/`)
- [x] T008 [ ] Configure Dockerized Postgres and ensure migrations run in CI/dev (`/docker-compose.yml`)
- [x] T009 [ ] Add basic CI pipeline stub to run build and migrations (`/.github/workflows/ci.yml`)

## Phase 3 — User Story 1 (P1): Personal job search dashboard

- [x] T010 [US1] Implement `JobApplication` entity and EF Core migration (`/backend/Domain/Entities/JobApplication.cs`)
- [ ] T011 [US1] Implement `GET /api/dashboard/summary` endpoint and handler — not implemented as a separate endpoint; status distribution is currently derived client-side from `GET /api/applications`
- [ ] T012 [US1] Implement backend dashboard query (counts by status) — pending; same gap as T011 (no dedicated summary query)
- [x] T013 [US1] Create dashboard/board UI (`/frontend/src/Dashboard.tsx`) — implemented as a single combined view (not a separate `/pages/dashboard` route); shows per-status column counts
- [ ] T014 [US1] Wire frontend to `/api/dashboard/summary` and display totals and status distribution — partial: per-status counts shown via board columns, but no dedicated summary endpoint/total-applications widget yet

## Phase 4 — User Story 2 (P2): Centralized list and application management

- [x] T015 [US2] Implement CRUD endpoints for applications (`/backend/Presentation/ApplicationEndpoints.cs`, `/backend/Application/Applications/`)
- [x] T016 [US2] Implement Application list query and per-user scoping in backend (`/backend/Application/Applications/List/ListApplicationsQuery.cs`)
- [x] T017 [US2] Implement create/update/delete handlers and validation rules (`/backend/Application/Applications/Create/`, `/backend/Application/Applications/Update/`, `/backend/Application/Applications/Delete/`)
- [x] T018 [US2] Create frontend list/board view and application form (`/frontend/src/Dashboard.tsx`) — implemented as a combined list+form+board view (not separate `/pages/applications` routes)
- [x] T019 [US2] Implement frontend-side filtering by status and company and wire to API (`/frontend/src/Dashboard.tsx`) — combinable status and company-name filters applied client-side

## Phase 5 — User Story 3 (P3): Kanban board with drag-and-drop

- [x] T020 [US3] Implement status update endpoint and handler — covered by `PATCH /api/applications/{id}` accepting a `status` field (`/backend/Presentation/ApplicationEndpoints.cs`, `/backend/Application/Applications/Update/UpdateApplicationCommand.cs`)
- [x] T021 [US3] Add update support in backend transaction handling and validation (status enum validation, per-user scoping) (`/backend/Application/Applications/Update/UpdateApplicationCommand.cs`)
- [x] T022 [US3] Create board view with Kanban columns using `dnd-kit` (`/frontend/src/Dashboard.tsx`) — implemented as part of the combined dashboard view (not a separate `/kanban` route)
- [x] T023 [US3] Implement drag-and-drop handlers that call `PATCH /api/applications/{id}` and refresh state (`/frontend/src/Dashboard.tsx`) — refetches after update; no optimistic UI/rollback yet
- [x] T024 [US3] Ensure board state syncs with list and dashboard views — trivially satisfied since list, board, and dashboard counts share the same `applications` state in `/frontend/src/Dashboard.tsx`

## Final Phase — Polish & Cross-Cutting Concerns

- [x] T025 [ ] Add authentication-protected route wrapper and frontend session restore (`/frontend/src/auth.tsx`, `/frontend/src/App.tsx`) — `AuthProvider` restores the session from a stored token via `getMe`, and `App.tsx` only renders `Dashboard` when a user is authenticated
- [ ] T026 [ ] Add tests for core backend flows: auth, application CRUD, status updates (`/backend/tests/`) — deferred to end of implementation
- [x] T027 [ ] Add README quickstart and run instructions (`/README.md`)

## Dependencies & Execution Order

- Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Final Phase
- Parallel opportunities: T010/T011/T012 (backend dashboard pieces) can be worked in parallel with T015/T016 (applications endpoints) where backend team splits responsibilities. Frontend pages (T013/T018/T022) can be developed in parallel once APIs are defined.

## Counts & MVP Suggestion

- Total tasks: 27
- Tasks per story: US1: 5 (T010–T014), US2: 5 (T015–T019), US3: 5 (T020–T024)
- Suggested MVP scope: Complete Phase 1, Phase 2, and User Story 1 (Dashboard + authentication + core models) to validate core flows.

## Implementation Strategy

- Deliver in vertical slices per story. Start with authentication and data model (Phase 2), then implement dashboard (US1) as the MVP.
- Use feature branches per user story and require tests and CI for merges.

## Notes

- File paths use suggested project layout; adjust to actual repository layout when implementing.
- Tests tasks are included as placeholders — expand into specific unit/integration tests during implementation.

## Backend Architecture (as of 2026-06-11)

The backend was restructured into a vertical-slice architecture using CQRS with MediatR:

- `/backend/Presentation/` — thin minimal-API endpoint mappings (`AuthEndpoints.cs`, `ApplicationEndpoints.cs`). Endpoints extract the authenticated user, dispatch a MediatR command/query via `ISender`, and map the resulting `Result<T>` to an HTTP response (`ToErrorResult()` for failures).
- `/backend/Application/Common/` — shared CQRS building blocks: `Result<T>`/`ResultErrorType` (handler outcome type), `ResultExtensions.ToErrorResult()` (maps failures to `IResult`), `JwtSettings` (options), `IJwtTokenGenerator`.
- `/backend/Application/Auth/` — one folder per auth use case: `Register/RegisterCommand.cs`, `Login/LoginCommand.cs`, `GetMe/GetMeQuery.cs`, plus shared `AuthResponse.cs` (response records).
- `/backend/Application/Applications/` — one folder per application use case: `Create/`, `List/`, `Get/`, `Update/`, `Delete/`, each containing an `IRequest<Result<T>>` command/query and its `IRequestHandler`, plus shared `ApplicationResponse.cs` (response record + `ToResponse()` mapping extension).
- `/backend/Infrastructure/Auth/JwtTokenGenerator.cs` — implements `IJwtTokenGenerator` using `IOptions<JwtSettings>`.
- `/backend/Program.cs` — registers MediatR (`AddMediatR`), binds `JwtSettings`, and registers `IJwtTokenGenerator`.
- `ApplicationStatus` enum remains in `/backend/Domain/Entities/JobApplication.cs` (unchanged, so `backend.tests/DomainTests.cs` continues to pass unmodified).
