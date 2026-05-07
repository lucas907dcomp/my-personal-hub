---
story_id: STORY-004
epic_id: EPIC-001
title: "Sprint 3 — Polish, Quality & Observability"
status: Ready
priority: MEDIUM
sprint: 3
executor: "@dev"
quality_gate: "@qa"
quality_gate_tools: [accessibility_audit, performance_audit, sentry_verification, constraint_validation]
depends_on: [STORY-003]
blocks: []
effort_estimate: "~2 weeks"
created_by: Morgan (@pm) — Brownfield Discovery Phase 10
created_at: "2026-05-07"
---

# STORY-004 — Sprint 3: Polish, Quality & Observability

## Description

Production-grade finishing for the Gym Hub. After this sprint, the app meets WCAG 2.1 AA accessibility standards, loads in under 2.5 seconds on 4G, surfaces errors via Sentry, and is ready to be confidently shared beyond initial close-circle testing.

**Prerequisite:** STORY-003 exit gate must pass completely before this sprint begins.

**Issues resolved:** L-001 (design session), L-002, L-003, L-004, L-005, L-006, L-007, L-008, M-003, M-007, M-008, M-009, M-015

## Acceptance Criteria

### AC-1: Missing UI components (S3.1)
- [ ] `EmptyState` component: shown when a list is empty (e.g., no workouts yet)
  - GYMHUB icon + "No workouts yet" heading + "Add your first workout" CTA
  - Used in `GymPage` workout list
- [ ] `ConfirmDialog` component: used for destructive actions (delete workout, delete exercise)
  - Accessible: focus traps, `role="dialog"`, `aria-labelledby`
  - Touch target ≥44px for both confirm and cancel
- [ ] `Toast` component: transient feedback for optimistic update errors
  - Auto-dismisses after 3 seconds
  - Error variant (red) and success variant (green)

### AC-2: Performance indicator components (S3.2)
- [ ] `RPEBadge` component: displays RPE value (1–10) with color coding
  - Green (1–3), Yellow (4–6), Orange (7–8), Red (9–10)
  - `aria-label="RPE {value} — {description}"`
- [ ] `ProgressIndicator` component: shows `canIncreaseNext` flag
  - Displayed on ExerciseCard when last session RPE ≤ 7
  - Tooltip/aria explaining what "ready to progress" means

### AC-3: Accessibility audit (S3.3)
- [ ] WCAG 2.1 AA compliance verified via axe DevTools browser extension
- [ ] All text/background contrast ratios ≥ 4.5:1 (normal text) or ≥ 3:1 (large text)
- [ ] All interactive targets ≥44px (exercise inputs ≥52px)
- [ ] All images have `alt` attributes (or `alt=""` for decorative)
- [ ] All form inputs have `<label>` (or `aria-label` if visually hidden)
- [ ] Tab order is logical — no focus traps except modals
- [ ] Focus ring visible: `ring-2 ring-orange-500` on all focusable elements

### AC-4: iOS zoom fix (S3.4)
- [ ] All `<input>` elements have `font-size: 1rem` (16px) minimum
- [ ] Confirmed with Tailwind class `text-base` on all input components
- [ ] Tested on iOS Safari (or simulator): no viewport zoom on input focus
- [ ] Affected components: `AddExerciseForm`, `AuthForm`, any filter inputs

### AC-5: CHECK constraints (S3.5)
- [ ] File: `V10__add_check_constraints.sql`
- [ ] `rpe BETWEEN 1 AND 10` CHECK on `tb_gym_exercises`
- [ ] `fuel_type IN ('gasoline', 'ethanol', 'diesel')` CHECK on `tb_fuel_records` (or enum equivalent)
- [ ] `task.type` constrained to valid values
- [ ] `CHECK (liters > 0 AND price_per_liter > 0 AND total_value > 0)` on fuel records
- [ ] `CHECK (reps > 0 AND sets > 0)` on gym exercises

### AC-6: API versioning (S3.6)
- [ ] All API endpoints prefixed with `/api/v1/` (e.g., `/api/v1/gym/workouts`)
- [ ] Old `/api/gym/*` paths removed (not redirected — no external consumers to support)
- [ ] Integration tests updated to use `/api/v1/` paths
- [ ] Frontend hooks updated to call `/api/v1/` paths

### AC-7: Workout ordering (S3.7)
- [ ] File: `V11__add_workout_position.sql`
- [ ] `position INTEGER NOT NULL DEFAULT 0` added to `tb_gym_workouts`
- [ ] `GymService.reorderWorkouts(userId, orderedIds)` endpoint added
- [ ] `WorkoutSelector` drag-to-reorder or up/down controls (design decision at implementation time)

### AC-8: WorkoutSelector scroll indicator (S3.8)
- [ ] Right-edge gradient fade applied to `WorkoutSelector` when content overflows
- [ ] CSS: `after:bg-gradient-to-l after:from-slate-950 after:to-transparent` on scroll container
- [ ] Disappears when scrolled to rightmost item

### AC-9: Sentry error monitoring (S3.9)
- [ ] **Spring Boot:** `sentry-spring-boot-starter` added to `pom.xml`
  - `sentry.dsn` configured via env var `SENTRY_DSN`
  - `sentry.traces-sample-rate=0.2` (20% performance tracing)
  - Uncaught exceptions captured automatically
- [ ] **React:** `@sentry/react` installed
  - `Sentry.init({ dsn, environment })` in `main.tsx`
  - `Sentry.reactRouterV6Instrumentation` for route-change tracing
  - Error boundary wraps `<App>`
- [ ] Verified: trigger a test error in both backend and frontend, confirm events appear in Sentry dashboard
- [ ] `SENTRY_DSN` in `.env` (not committed to source control)

### AC-10: Reps normalization (S3.10)
- [ ] Design session outcome documented: keep `reps VARCHAR` as-is OR migrate to `sets INT + reps_per_set INT`
- [ ] If migration chosen: `V12__normalize_reps.sql` written with data migration script
- [ ] Decision recorded as ADR-008 in `docs/prd/technical-debt-assessment.md`

### AC-11: Production deployment config (S3.11 — optional if S3.10 scope allows)
- [ ] `application-prod.properties` (or env-specific config) for production settings
- [ ] `SPRING_PROFILES_ACTIVE=prod` sets production log level, Sentry, CORS for real domain
- [ ] Dockerfile written for Spring Boot API

## Tasks

| # | Task | Issues | Effort | Executor |
|---|------|--------|--------|----------|
| S3.1 | Build `EmptyState`, `ConfirmDialog`, `Toast` | — | 4h | @dev |
| S3.2 | Build `RPEBadge`, `ProgressIndicator` | — | 2h | @dev |
| S3.3 | Accessibility audit (axe, contrast, touch targets, ARIA) | WCAG 2.1 AA | 3h | @dev |
| S3.4 | Fix all inputs: `text-base` (16px) | M-015 | 1h | @dev |
| S3.5 | V10: CHECK constraints (RPE, fuel_type, task.type, positives) | L-004, L-005, M-007, M-008 | 1h | @data-engineer |
| S3.6 | API versioning (`/api/v1/`) | M-003 | 2h | @dev |
| S3.7 | V11: workout `position` field + reorder endpoint | L-002 | 1h | @data-engineer + @dev |
| S3.8 | WorkoutSelector overflow gradient indicator | L-007 | 30 min | @dev |
| **S3.9** | **Sentry: Spring Boot + React integration** | L-008 | 2h | @dev |
| S3.10 | Reps normalization design session + ADR-008 | L-001 | Design session | @dev + @architect |
| S3.11 | Production Dockerfile + `application-prod.properties` | L-003 | 4h | @dev |

## Exit Gate

```
□ WCAG 2.1 AA: 0 contrast failures (axe DevTools report — 0 violations)
□ All interactive targets ≥44px verified (Chrome DevTools element inspector)
□ LCP < 2.5s on simulated 4G (Chrome DevTools Lighthouse mobile score)
□ Lighthouse Performance ≥80 on mobile simulation
□ Sentry receiving events from both Spring Boot and React (test events visible in dashboard)
□ No iOS viewport zoom on input focus (tested on Safari — real device or iOS simulator)
□ ./mvnw test passes (integration suite still green with /api/v1/ paths)
```

## Quality Gate Checklist

- [ ] @qa runs Lighthouse audit and attaches report to this story
- [ ] @qa runs axe DevTools scan — zero critical violations
- [ ] @qa verifies Sentry test events for both backend and frontend
- [ ] @qa verifies iOS zoom fix on real Safari or iOS simulator
- [ ] ADR-008 (reps normalization decision) documented regardless of outcome

## Future Backlog (Out of Scope for This Epic)

These items were identified during discovery but are out of scope for EPIC-001:

| Item | Description | When |
|------|-------------|------|
| `tb_gym_sessions` | Workout session history + progression tracking | Post-launch backlog |
| Fuel Hub Vite migration | Extract fuel features from any CDN pages | Separate epic |
| Productivity Hub migration | Extract task/note features | Separate epic |
| PWA / installable app | `manifest.json` + service worker | OQ-05 decision |
| Google OAuth | Add OAuth provider | OQ-03 if needed |
| Generic column sizing | Replace generic `VARCHAR(255)` with domain-aware sizes | Low priority |

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-05-07 | Story created from Brownfield Discovery Phase 10 | Morgan (@pm) |
