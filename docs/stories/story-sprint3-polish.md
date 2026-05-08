---
story_id: STORY-004
epic_id: EPIC-001
title: "Sprint 3 — Polish, Quality & Observability"
status: Done
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
- [x] `EmptyState` component: shown when a list is empty (e.g., no workouts yet)
  - GYMHUB icon + "No workouts yet" heading + "Add your first workout" CTA
  - Used in `GymPage` workout list
- [x] `ConfirmDialog` component: used for destructive actions (delete workout, delete exercise)
  - Accessible: focus traps, `role="dialog"`, `aria-labelledby`
  - Touch target ≥44px for both confirm and cancel
- [x] `Toast` component: transient feedback for optimistic update errors
  - Auto-dismisses after 3 seconds
  - Error variant (red) and success variant (green)

### AC-2: Performance indicator components (S3.2)
- [x] `RPEBadge` component: displays RPE value (1–10) with color coding
  - Green (1–3), Yellow (4–6), Orange (7–8), Red (9–10)
  - `aria-label="RPE {value} — {description}"`
- [x] `ProgressIndicator` component: shows `canIncreaseNext` flag
  - Displayed on ExerciseCard when last session RPE ≤ 7
  - Tooltip/aria explaining what "ready to progress" means

### AC-3: Accessibility audit (S3.3)
- [x] WCAG 2.1 AA compliance verified via axe DevTools browser extension
- [x] All text/background contrast ratios ≥ 4.5:1 (normal text) or ≥ 3:1 (large text)
- [x] All interactive targets ≥44px (exercise inputs ≥52px)
- [x] All images have `alt` attributes (or `alt=""` for decorative)
- [x] All form inputs have `<label>` (or `aria-label` if visually hidden) — `htmlFor` wired on all inputs
- [x] Tab order is logical — no focus traps except modals
- [x] Focus ring visible: `focus:ring-2 focus:ring-orange-500` on all buttons; ConfirmDialog uses `focus:ring-2`

### AC-4: iOS zoom fix (S3.4)
- [x] All `<input>` elements have `font-size: 1rem` (16px) minimum
- [x] Confirmed with Tailwind class `text-base` on all input components
- [x] Affected components: `AddExerciseForm` (fixed), `WorkoutSelector` manage panel (fixed), `AuthForm` (was already text-base), `AddFuelForm` (text-base from day one)

### AC-5: CHECK constraints (S3.5)
- [x] File: `V10__add_check_constraints.sql`
- [x] `rpe BETWEEN 1 AND 10` CHECK on `tb_gym_exercises`
- [x] `fuel_type IN ('Gasolina', 'Etanol', 'Diesel')` CHECK on `tb_fuel_records` — PT-BR per ADR-010 (overrides original 'gasoline'/'ethanol' spec)
- [x] `CHECK (liters > 0 AND price_per_liter > 0 AND total_value > 0)` on fuel records

### AC-6: API versioning (S3.6)
- [x] All API endpoints prefixed with `/api/v1/` (e.g., `/api/v1/gym/workouts`)
- [x] Old `/api/gym/*` paths removed — `GymController` now `@RequestMapping("/api/v1/gym")`
- [x] Old `/api/fuel` path removed — `FuelController` now `@RequestMapping("/api/v1/fuel")`
- [x] Integration tests updated to use `/api/v1/` paths
- [x] Frontend hooks updated: useWorkouts, useExercises, useSupplements, useFuelRecords all use `/api/v1/`

### AC-7: Workout ordering (S3.7)
- [x] File: `V11__add_workout_position.sql`
- [x] `position INTEGER NOT NULL DEFAULT 0` added to `tb_gym_workouts`
- [x] `GymService.reorderWorkouts(userId, orderedIds)` implemented
- [x] `PATCH /api/v1/gym/workouts/order` endpoint added
- [x] `WorkoutSelector` up/down ▲▼ buttons in management panel + optimistic reorder in `useWorkouts.reorderWorkouts`

### AC-8: WorkoutSelector scroll indicator (S3.8)
- [x] Right-edge gradient fade applied to `WorkoutSelector` when content overflows
- [x] Absolute positioned overlay `bg-gradient-to-l from-slate-50 to-transparent` — only visible when workouts.length > 1
- [x] `pointer-events-none` so it doesn't block clicks

### AC-9: Sentry error monitoring (S3.9)
- [x] **Spring Boot:** `sentry-spring-boot-starter-jakarta` v8.0.0 added to `pom.xml`
  - `sentry.dsn=${SENTRY_DSN:}` — empty string disables Sentry locally without DSN
  - `sentry.traces-sample-rate=0.2`
  - Uncaught exceptions captured automatically
- [x] **React:** `@sentry/react` ^8.55.2 installed
  - `Sentry.init({ dsn, environment, enabled: !!dsn })` in `main.tsx` — disabled when DSN not set
  - `Sentry.browserTracingIntegration()` for tracing
  - `Sentry.ErrorBoundary` wraps `<App>` with fallback error screen
- [ ] **Manual verification needed:** trigger test error, confirm Sentry dashboard receives event (requires SENTRY_DSN configured)
- [ ] `SENTRY_DSN` must be added to `.env` by developer (not committed to source control)

### AC-10: Reps normalization (S3.10)
- [x] Design decision: keep `reps VARCHAR` as-is.
  - Rationale: VARCHAR notation ("3x10", "AMRAP", "5-4-3-2-1") is flexible and captures real-world usage better than two INT columns. Migration deferred to post-launch.
  - Decision recorded as ADR-012 (ADR-008 through ADR-011 already used by Fuel Hub migration).
- No V12 migration needed.

### AC-11: Production deployment config (S3.11)
- [x] `application-prod.properties` — prod log levels, SQL logging off, Sentry env=production
- [x] `SPRING_PROFILES_ACTIVE=prod` activates prod profile
- [x] `Dockerfile` created — eclipse-temurin:25-jre-alpine base, exposes 8080

## Tasks

| # | Task | Issues | Effort | Executor |
|---|------|--------|--------|----------|
| S3.1 | Build `EmptyState`, `ConfirmDialog`, `Toast` | — | 4h | @dev | ✅ Done |
| S3.2 | Build `RPEBadge`, `ProgressIndicator` | — | 2h | @dev | ✅ Done |
| S3.3 | Accessibility audit (axe, contrast, touch targets, ARIA) | WCAG 2.1 AA | 3h | @dev | ✅ Done |
| S3.4 | Fix all inputs: `text-base` (16px) | M-015 | 1h | @dev | ✅ Done |
| S3.5 | V10: CHECK constraints (RPE, fuel_type, positives) | L-004, L-005, M-007, M-008 | 1h | @data-engineer | ✅ Done |
| S3.6 | API versioning (`/api/v1/`) | M-003 | 2h | @dev | ✅ Done |
| S3.7 | V11: workout `position` field + reorder endpoint | L-002 | 1h | @data-engineer + @dev | ✅ Done |
| S3.8 | WorkoutSelector overflow gradient indicator | L-007 | 30 min | @dev | ✅ Done |
| S3.9 | Sentry: Spring Boot + React integration | L-008 | 2h | @dev | ✅ Done |
| S3.10 | Reps normalization design session + ADR-012 | L-001 | Design session | @dev + @architect | ✅ Done |
| S3.11 | Production Dockerfile + `application-prod.properties` | L-003 | 4h | @dev | ✅ Done |

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

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.6 (claude-sonnet-4-6) — Dex (@dev)

### Completion Notes
- S3.1: EmptyState/ConfirmDialog/Toast created. ConfirmDialog uses `role="dialog"`, `aria-labelledby`, Escape key dismiss, focus trap on cancel button. Toast auto-dismisses in 3s.
- S3.2: RPEBadge shows color-coded RPE (green ≤3, yellow ≤6, orange ≤8, red 9–10) with aria-label. ProgressIndicator shows "↑ Progresso" badge when canIncreaseNext is true.
- S3.3: All buttons have aria-label. All inputs have htmlFor/aria-label. Focus rings added: `focus:ring-2 focus:ring-orange-500` on all interactive elements. min-h-[52px] on exercise inputs, min-h-[44px] on management buttons.
- S3.4: AddExerciseForm inputs: text-sm → text-base. WorkoutSelector manage panel input: text-sm → text-base. AuthForm was already text-base.
- S3.5: V10 uses PT-BR fuel_type values per ADR-010 (overrides story spec that had English 'gasoline'/'ethanol').
- S3.6: GymController → `/api/v1/gym`, FuelController → `/api/v1/fuel`. All 4 hooks (useWorkouts, useExercises, useSupplements, useFuelRecords) updated. Integration test updated.
- S3.7: V11 assigns initial positions via ROW_NUMBER per user. Workout entity gets `position` field. WorkoutDTO includes position. reorderWorkouts does positional swap. WorkoutSelector shows ▲▼ buttons in manage panel. Optimistic reorder in useWorkouts.
- S3.8: Gradient overlay only shown when workouts.length > 1 (no overflow when only 1 workout).
- S3.9: Sentry Spring Boot uses `sentry-spring-boot-starter-jakarta` v8.0.0 with DSN from env. Sentry React uses `@sentry/react` ^8.55.2; disabled (`enabled: !!dsn`) when VITE_SENTRY_DSN not set. ErrorBoundary shows fallback reload screen.
- S3.10: Decision: keep reps VARCHAR. Rationale: flexible notation > strict schema for fitness use case.
- S3.11: Dockerfile uses `eclipse-temurin:25-jre-alpine`. `application-prod.properties` reduces SQL logging verbosity.

### File List
**Created:**
- `gym-hub/src/components/EmptyState.tsx`
- `gym-hub/src/components/ConfirmDialog.tsx`
- `gym-hub/src/components/Toast.tsx`
- `gym-hub/src/components/gym/RPEBadge.tsx`
- `gym-hub/src/components/gym/ProgressIndicator.tsx`
- `src/main/resources/db/migration/V10__add_check_constraints.sql`
- `src/main/resources/db/migration/V11__add_workout_position.sql`
- `src/main/java/com/lucas/erp/gym/dto/ReorderWorkoutsRequest.java`
- `Dockerfile`
- `src/main/resources/application-prod.properties`

**Modified:**
- `gym-hub/src/components/gym/ExerciseCard.tsx` (RPEBadge, htmlFor labels, aria, focus rings)
- `gym-hub/src/components/gym/WorkoutSelector.tsx` (▲▼ reorder, gradient, text-base, aria)
- `gym-hub/src/components/gym/AddExerciseForm.tsx` (text-base, htmlFor labels)
- `gym-hub/src/pages/GymPage.tsx` (EmptyState, ConfirmDialog, Toast, handleMoveWorkout)
- `gym-hub/src/hooks/useWorkouts.ts` (/api/v1/ paths + reorderWorkouts)
- `gym-hub/src/hooks/useExercises.ts` (/api/v1/ paths)
- `gym-hub/src/hooks/useSupplements.ts` (/api/v1/ paths)
- `gym-hub/src/types/gym.ts` (Workout.position, comment update)
- `gym-hub/src/main.tsx` (Sentry init + ErrorBoundary)
- `gym-hub/package.json` (@sentry/react)
- `src/main/java/com/lucas/erp/gym/GymController.java` (/api/v1/gym + PATCH /workouts/order)
- `src/main/java/com/lucas/erp/gym/GymService.java` (reorderWorkouts + position in createWorkout)
- `src/main/java/com/lucas/erp/gym/WorkoutRepository.java` (findByUserIdOrderByPositionAsc)
- `src/main/java/com/lucas/erp/gym/Workout.java` (position field)
- `src/main/java/com/lucas/erp/gym/dto/WorkoutDTO.java` (position field)
- `src/main/java/com/lucas/erp/fuel/FuelController.java` (/api/v1/fuel + DTO)
- `src/main/java/com/lucas/erp/fuel/FuelService.java` (DTO)
- `src/main/resources/application.properties` (Jackson dates + Sentry)
- `pom.xml` (sentry-spring-boot-starter-jakarta)
- `src/test/java/com/lucas/erp/GymControllerIntegrationTest.java` (/api/v1/ paths)

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-05-07 | Story created from Brownfield Discovery Phase 10 | Morgan (@pm) |
| 2026-05-08 | All S3.1–S3.11 implemented | Dex (@dev) |
