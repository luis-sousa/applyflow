# Research: Job Application Tracker

## Unknowns / Clarifications

- Authentication storage: user requested JWT in localStorage; consider security tradeoffs. Decision: JWT in localStorage for MVP; note XSS risk and recommend mitigation in production (HttpOnly refresh tokens or secure cookie flows).
- Drag-and-drop UX specifics: optimistic updates required; research suggests using DnD-Kit with optimistic UI and rollback on failure.
- Data retention and history: default to retaining full history unless user requests deletion; add future requirement for export/backup.

## Research Tasks

- Research best practices for JWT storage and refresh strategies in SPA (notes: localStorage vs HttpOnly cookies).
- Research DnD libraries (dnd-kit, react-beautiful-dnd) and patterns for optimistic updates and rollback.
- Research EF Core migrations patterns and Postgres transactional migration best practices for a modular monolith.

## Decisions

- Authentication: Use JWT stored in localStorage for MVP with clear TODO to migrate to refresh-token pattern on production.
- Drag-and-drop: Use `dnd-kit` for Kanban interactions; implement optimistic UI updates and rollback on server failure.
- Data model: follow simple relational model with User -> Applications; store status as enum.

## Alternatives Considered

- Using HttpOnly cookies for tokens: more secure against XSS, but adds CSRF considerations and more backend complexity. Marked as production recommendation.
- Server-side sessions: simpler token handling but reduces scalability and conflicts with stateless JWT goal.
