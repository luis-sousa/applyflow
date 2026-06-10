# Implementation Plan: Job Application Tracker

## Technical Approach

This feature is a modern full-stack SaaS-style web application built as a modular monolith with Clean Architecture principles.

### Backend
- ASP.NET Core Web API
- Vertical slice feature grouping for Auth and Applications
- Thin controllers that delegate logic to the Application layer
- EF Core for PostgreSQL data access
- JWT authentication with token validation middleware
- User-scoped data isolation for all protected endpoints

### Frontend
- React + TypeScript SPA
- TailwindCSS + shadcn/ui for UI components
- Axios for HTTP requests with JWT Bearer token authentication
- TanStack Query for server state management
- React Hook Form + Zod for form validation
- dnd-kit for Kanban drag-and-drop

## Architecture Layers

### API Layer
- Controllers
- Authentication middleware
- Request/response mapping

### Application Layer
- Vertical slices per feature
- Commands, Queries, Handlers, Validators

### Domain Layer
- Entities and enums
- Business rules

### Infrastructure Layer
- EF Core + PostgreSQL
- Authentication services
- External integrations

## Core Features
- JWT authentication and registration
- Full CRUD for job applications
- Status lifecycle management
- Dashboard analytics
- Kanban board with drag-and-drop
- Protected routes and frontend session restore

## Project Structure

### Backend
- `/backend/Domain/Entities`
- `/backend/Application/*`
- `/backend/Api/Controllers`
- `/backend/Infrastructure`
- `/backend/tests`

### Frontend
- `/frontend/src/pages`
- `/frontend/src/components`
- `/frontend/src/services`
- `/frontend/src/hooks`
- `/frontend/src/lib`

### Infrastructure
- `docker-compose.yml`
- `.github/workflows/ci.yml`

## Validation
- Use the feature checklist in `specs/001-job-application-tracker/checklists/requirements.md`
- Use quickstart scenarios in `specs/001-job-application-tracker/quickstart.md`
- Implement vertical slices and ensure each user story is independently testable
