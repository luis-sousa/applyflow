<!--
Sync Impact Report
- Version change: (template) → 1.0.0
- Modified principles: N/A (initial ratification)
- Added sections:
  - Core Principles: I. Code Quality, II. Testing Standards,
    III. User Experience Consistency, IV. Performance Requirements
  - Quality Gates
  - Development Workflow
  - Governance
- Removed sections: none (template placeholders replaced)
- Templates requiring updates:
  - .specify/templates/plan-template.md ✅ (Constitution Check section is generic and
    references this file by path; aligns without edits)
  - .specify/templates/spec-template.md ✅ (no constitution-specific references)
  - .specify/templates/tasks-template.md ✅ (testing/code-quality task categories already
    present and consistent with principles)
  - .specify/templates/checklist-template.md ✅ (no changes required)
  - .claude/skills/* ✅ (no agent-specific references requiring update)
- Follow-up TODOs: none
-->

# ApplyFlow Constitution

## Core Principles

### I. Code Quality
All code MUST be readable, maintainable, and reviewed before merging.
- Every change MUST pass linting and static analysis with zero new warnings or errors.
- Code MUST follow the project's established style and naming conventions; deviations
  require an inline justification comment.
- Functions and modules MUST have a single, clear responsibility; duplication MUST be
  refactored into shared code only when reused in 3+ places (avoid premature abstraction).
- Pull requests MUST include a description of the change and pass at least one
  independent code review before merge.
- Dead code, commented-out code, and unused dependencies MUST be removed before merge.

**Rationale**: Consistent, reviewed, and lint-clean code reduces defects, eases
onboarding, and keeps the codebase maintainable as ApplyFlow grows.

### II. Testing Standards (NON-NEGOTIABLE)
Automated tests are the primary safety net for ApplyFlow and MUST be written
alongside (or before) implementation.
- New features and bug fixes MUST include automated tests that fail without the
  change and pass with it.
- Unit tests MUST cover core business logic (e.g., application tracking, status
  transitions, data validation). Integration tests MUST cover API contracts,
  database interactions, and cross-module workflows.
- Bug fixes MUST include a regression test that reproduces the original bug.
- The full automated test suite MUST pass before any merge to the main branch;
  flaky tests MUST be fixed or quarantined with a tracked follow-up, not ignored.
- Test code is held to the same readability standard as production code.

**Rationale**: Testing standards prevent regressions, enable confident refactoring,
and ensure ApplyFlow's behavior is verifiable independent of any one developer's
memory of the system.

### III. User Experience Consistency
ApplyFlow MUST present a consistent, predictable experience across all surfaces
(web app, extension, emails, etc.).
- UI components MUST reuse the shared design system/component library; new
  one-off components require explicit justification.
- Interaction patterns (navigation, forms, error messages, confirmations, loading
  and empty states) MUST be consistent across features.
- All user-facing errors MUST be actionable and written in plain language; raw
  system/stack errors MUST NOT be shown to users.
- Accessibility baseline (keyboard navigation, sufficient color contrast, semantic
  markup, ARIA labels where needed) MUST be met for new and changed UI.
- User-facing copy and terminology (e.g., application statuses, button labels)
  MUST be consistent across the product; introduce new terms only via a shared
  glossary update.

**Rationale**: Consistency reduces user confusion and support burden, and builds
trust in a tool that manages users' job-search data.

### IV. Performance Requirements
ApplyFlow MUST remain responsive as data volume and usage grow.
- API endpoints MUST respond within 500ms at the 95th percentile under expected
  load; any endpoint exceeding this MUST be profiled and optimized or explicitly
  justified with a documented tradeoff.
- Pages/views MUST achieve interactive rendering within 2 seconds on a typical
  broadband connection.
- Database queries MUST use appropriate indexes; queries on tables expected to
  grow large (e.g., applications, events) MUST be paginated and avoid N+1 patterns.
- Performance-sensitive changes (new endpoints, queries, or heavy UI views) MUST
  include a basic load/benchmark check before merge, or a documented reason why
  one is not yet feasible.
- Regressions that measurably degrade response time or page load MUST be treated
  as bugs and fixed before release.

**Rationale**: A job-application tool used daily must feel instant; performance
regressions compound as users accumulate applications and history over time.

## Quality Gates

The following gates MUST pass before code is merged to the main branch:
1. Linting and static analysis: zero new errors/warnings.
2. Automated test suite: all tests pass, including new tests for the change.
3. Code review: at least one approval from a reviewer other than the author.
4. Performance check: no measurable regression against the thresholds in
   Principle IV for touched endpoints/views, or a documented exception.
5. UX check: new or changed UI follows the shared design system and accessibility
   baseline in Principle III.

## Development Workflow

- Work proceeds via the spec-kit flow: specify → plan → tasks → implement, with
  this constitution as the binding quality bar for all generated plans and tasks.
- Plans and task lists MUST include explicit testing tasks (Principle II) and,
  where relevant, performance and UX verification tasks (Principles III & IV).
- Any deviation from these principles MUST be documented in the relevant plan's
  "Complexity Tracking" (or equivalent) section with a rationale and, where
  possible, a plan to remove the deviation.

## Governance

This constitution supersedes all other development practices and templates for
ApplyFlow. In case of conflict between this document and a template or guideline,
this constitution wins.

- **Amendments**: Proposed via a documented change (PR) describing the principle
  affected, the rationale, and the impact on existing plans/tasks. Amendments
  require review and approval before merge.
- **Versioning policy**: This constitution follows semantic versioning:
  - MAJOR: Backward-incompatible removal or redefinition of a principle.
  - MINOR: New principle or section added, or materially expanded guidance.
  - PATCH: Clarifications, wording, or typo fixes with no semantic change.
- **Compliance review**: All pull requests and `/speckit.plan` outputs MUST be
  checked against the Quality Gates above. Reviewers MUST flag any violation and
  block merge until resolved or explicitly justified in writing.
- Use `CLAUDE.md` (and equivalent agent guidance files) for day-to-day runtime
  development guidance; this constitution governs the non-negotiable principles
  those files must respect.

**Version**: 1.0.0 | **Ratified**: 2026-06-10 | **Last Amended**: 2026-06-10
