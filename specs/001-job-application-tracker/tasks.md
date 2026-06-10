# Implementation Tasks: Job Application Tracker

**Feature**: Job Application Tracker
**Spec**: specs/001-job-application-tracker/spec.md

## Phase 1 — Setup

- [x] T001 Initialize repository structure and create root README (`/README.md`)
- [x] T002 Create Docker Compose and Postgres dev manifest (`/docker-compose.yml`)
- [x] T003 Create backend project scaffold (ASP.NET Core solution and project) (`/backend/`)
- [x] T004 Create frontend scaffold (React + TypeScript app) (`/frontend/`)

## Phase 2 — Foundational (blocking prerequisites)

- [ ] T005 [US1] Create `User` entity and EF Core migration in backend project (`/backend/Domain/Entities/User.cs`)
- [ ] T006 [US1] Implement authentication endpoints and JWT handling (`/backend/Controllers/AuthController.cs`)
- [ ] T007 [US1] Add database context, connection configuration, and initial migration (`/backend/Infrastructure/ApplyFlowDbContext.cs`)
- [x] T008 [ ] Configure Dockerized Postgres and ensure migrations run in CI/dev (`/docker-compose.yml`)
- [x] T009 [ ] Add basic CI pipeline stub to run build and migrations (`/.github/workflows/ci.yml`)

## Phase 3 — User Story 1 (P1): Personal job search dashboard

- [ ] T010 [US1] Implement `JobApplication` entity and EF Core migration (`/backend/Domain/Entities/JobApplication.cs`)
- [ ] T011 [US1] Implement `GET /api/dashboard/summary` endpoint and handler (`/backend/Api/Controllers/DashboardController.cs`)
- [ ] T012 [US1] Implement backend dashboard query (counts by status) (`/backend/Application/Dashboard/GetSummaryQuery.cs`)
- [ ] T013 [US1] Create frontend `/dashboard` page and dashboard UI components (`/frontend/src/pages/dashboard/Dashboard.tsx`)
- [ ] T014 [US1] Wire frontend to `/api/dashboard/summary` and display totals and status distribution (`/frontend/src/services/dashboardService.ts`)

## Phase 4 — User Story 2 (P2): Centralized list and application management

- [ ] T015 [US2] Implement CRUD endpoints for applications (`/backend/Api/Controllers/ApplicationsController.cs`)
- [ ] T016 [US2] Implement Application list query and per-user scoping in backend (`/backend/Application/Applications/Queries/GetApplicationsQuery.cs`)
- [ ] T017 [US2] Implement create/update/delete handlers and validation rules (`/backend/Application/Applications/Commands/*.cs`)
- [ ] T018 [US2] Create frontend `/applications` list page and application form pages (`/frontend/src/pages/applications/ApplicationsList.tsx`, `/frontend/src/pages/applications/ApplicationForm.tsx`)
- [ ] T019 [US2] Implement frontend-side filtering by status and company and wire to API (`/frontend/src/hooks/useApplications.ts`)

## Phase 5 — User Story 3 (P3): Kanban board with drag-and-drop

- [ ] T020 [US3] Implement `PATCH /api/applications/{id}/status` endpoint and handler (`/backend/Api/Controllers/ApplicationsController.cs`)
- [ ] T021 [US3] Add optimistic update support in backend transaction handling and validation (`/backend/Application/Applications/Commands/UpdateStatusCommand.cs`)
- [ ] T022 [US3] Create frontend `/kanban` page and Kanban components using `dnd-kit` (`/frontend/src/pages/kanban/Kanban.tsx`, `/frontend/src/components/KanbanColumn.tsx`)
- [ ] T023 [US3] Implement drag-and-drop handlers that call `PATCH /api/applications/{id}/status` with optimistic UI and rollback (`/frontend/src/services/applicationsService.ts`)
- [ ] T024 [US3] Ensure board state syncs with list and dashboard views (frontend cache invalidation or refetch) (`/frontend/src/lib/queryClient.ts`)

## Final Phase — Polish & Cross-Cutting Concerns

- [ ] T025 [ ] Add authentication-protected route wrapper and frontend session restore (`/frontend/src/components/ProtectedRoute.tsx`)
- [ ] T026 [ ] Add tests for core backend flows: auth, application CRUD, status updates (`/backend/tests/`)
- [ ] T027 [ ] Add README quickstart and run instructions (`/README.md`)

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
