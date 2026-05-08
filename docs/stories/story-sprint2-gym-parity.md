---
story_id: STORY-003
epic_id: EPIC-001
title: "Sprint 2 — Gym Hub MVP Parity"
status: Ready
priority: HIGH
sprint: 2
executor: "@dev + @data-engineer"
quality_gate: "@architect"
quality_gate_tools: [parity_checklist, bundle_audit, migration_review, ui_review]
depends_on: [STORY-002]
blocks: [STORY-004]
effort_estimate: "~2 weeks"
created_by: Morgan (@pm) — Brownfield Discovery Phase 10
created_at: "2026-05-07"
---

# STORY-003 — Sprint 2: Gym Hub MVP Parity

## Description

Extract all existing Gym Hub UI from `gym/index.html` (CDN React) into the Vite 5 project scaffolded in Sprint 1. The Gym Hub must be functionally and visually identical to the current CDN version — no feature additions, no redesign, no logic changes during migration.

After this sprint, `gym/index.html` is deleted and the Gym Hub is served exclusively from the Vite build. Initial load drops from ~4MB to ≤200KB gzipped.

**Prerequisite:** STORY-002 exit gate must pass completely before this sprint begins.

**Critical rule:** S2.1 (file copy) and S2.2 (data layer swap) must NEVER be combined into the same commit. Copy first, then swap.

**Issues resolved:** H-005, H-006, H-007, H-008, M-003 (partial), M-005, M-006, M-011

## Acceptance Criteria

### AC-1: Component extraction — pure file copy (S2.1)
- [x] All JSX components from `gym/index.html` extracted to `.tsx` files:
  - `ExerciseCard.tsx`
  - `WorkoutSelector.tsx`
  - `SupplementTracker.tsx`
  - `AddExerciseForm.tsx`
- [x] ZERO logic changes during extraction — only syntax conversion (JSX → TSX, `className` preserved, no hook rewrites)
- [x] Components render with hardcoded test data — not connected to backend yet
- [ ] Visual inspection confirms pixel-identical rendering to CDN version

### AC-2: Data layer swap (S2.2)
- [x] Custom hooks created: `useWorkouts()`, `useExercises(session)`, `useSupplements()`
- [x] Hooks call Spring Boot API via `fetch()` with JWT from Supabase session
- [x] All `fetch()` calls use `supabaseClient` session token for Authorization header
- [x] Components receive data via hooks — no direct fetch inside JSX

### AC-3: Optimistic updates preserved (S2.3)
- [x] Optimistic update pattern implemented in hook layer:
  ```ts
  // 1. setState(optimisticValue) immediately
  // 2. await api.update(payload)
  // 3. on error: setState(previousValue) — rollback
  ```
- [ ] Parity checklist item B5 (optimistic rollback test) passes:
  - Simulate network error during exercise update → UI reverts to previous value

### AC-4: BottomTabBar built (S2.4)
- [x] `BottomTabBar.tsx` component built
- [x] Wired to React Router — active tab highlights correctly
- [x] Tabs: Gym, Fuel (placeholder), Tasks (placeholder)
- [x] Touch target ≥52px per tab item
- [x] `GymLayout.tsx` BottomTabBar slot filled (was empty in Sprint 1)

### AC-5: Parity checklist passes (S2.5)
- [ ] All 41 items from `docs/reviews/ux-specialist-review.md` parity checklist executed
- [ ] Sections A–G: 100% (data loading, optimistic updates, workout management, exercise management, supplement tracker, visual parity, mobile behaviour)
- [ ] Section H (performance): H1–H5 checked (H6 target, not blocker)
- [ ] Checklist results documented in this story under Dev Notes

### AC-6: Bundle audit passes (S2.6)
- [x] `npm run build` completes without errors
- [x] Initial JS bundle ≤200KB gzipped — app chunk: 6KB gz, total JS: ~130KB gz
- [x] CSS ≤8KB gzipped — 4.13KB gz
- [ ] No `@babel/standalone` in Network tab (verify in browser)
- [ ] No `cdn.tailwindcss.com` in Network tab (verify in browser)
- [x] `manualChunks` configured in `vite.config.ts`:
  ```ts
  manualChunks: {
    'react-vendor': ['react', 'react-dom', 'react-router-dom'],
    'supabase': ['@supabase/supabase-js'],
  }
  ```

### AC-7: Old CDN version deleted (S2.7)
- [ ] `gym/index.html` deleted — ONLY after parity checklist Sections A–G are 100% complete
- [ ] Deletion is a standalone commit: `chore: remove CDN gym/index.html after parity verified`
- [ ] No references to `gym/index.html` remain in any source file

### AC-8: NUMERIC monetary migration (S2.8)
- [ ] File: `V8__fix_monetary_types.sql`
- [ ] `tb_fuel_records` monetary columns migrated to `NUMERIC(10,2)` via column-parallel approach:
  - Add new column with correct type
  - Copy data with CAST
  - Drop old column
  - Rename new column
- [ ] `liters` column evaluated for `GENERATED ALWAYS AS (total_value / price_per_liter) STORED`

### AC-9: NOT NULL constraints (S2.9)
- [ ] File: `V9__add_not_null.sql`
- [ ] All remaining required business fields have `NOT NULL` constraints added
- [ ] Only fields with existing data — no constraint added where existing rows have NULL values without a valid default

### AC-10: Shared trigger function and timestamps (S2.10)
- [ ] `shared_set_updated_at()` trigger applied to ALL tables that don't have it yet
- [ ] `updated_at` auto-updates on every row modification
- [ ] Single function definition — not duplicated per table (M-011 fix confirmed)

### AC-11: Spring Boot Actuator (S2.11)
- [x] `spring-boot-starter-actuator` in `pom.xml`
- [x] `/actuator/health` endpoint accessible (no auth required for health)
- [x] `/actuator/metrics` endpoint secured (requires auth)
- [x] `management.endpoints.web.exposure.include=health,metrics` in `application.properties`

### AC-12: Structured logging (S2.12)
- [x] SLF4J + Logback configured (via Spring Boot autoconfigure)
- [x] `GymService` uses `@Slf4j` (Lombok) — logs at all key operations
- [x] Request ID added to MDC in `MdcRequestFilter` — all log lines for a request share `requestId`
- [x] No `System.out.println` in service layer

### AC-13: getAllExercises scoped (S2.13)
- [x] `getAllExercises()` replaced with `getExercisesPage(userId, Pageable)` + optional pagination (?page, ?size)
- [x] No endpoint returns unbounded global dataset (max size=200 cap enforced)

## Tasks

| # | Task | Issues | Effort | Executor |
|---|------|--------|--------|----------|
| # | Task | Issues | Effort | Executor | Status |
|---|------|--------|--------|----------|--------|
| S2.1 | Copy JSX → `.tsx` (zero logic changes) | H-005 | 4h | @dev | ✅ Done |
| S2.2 | Replace `fetch()` → Supabase hooks (`useWorkouts`, `useExercises`, `useSupplements`) | — | 6h | @dev | ✅ Done |
| S2.3 | Preserve optimistic update pattern in hook layer | — | 2h | @dev | ✅ Done |
| S2.4 | Build `BottomTabBar` component + React Router wiring | — | 2h | @dev | ✅ Done |
| S2.5 | Execute parity checklist (41 items — `docs/reviews/ux-specialist-review.md`) | — | 3h | @dev | ⏳ Pending visual |
| S2.6 | Bundle audit: ≤200KB gzipped JS, ≤8KB CSS, no CDN scripts | H-005 | 1h | @dev | ✅ Done |
| S2.7 | Delete `gym/index.html` after parity 100% | — | — | @dev | ⏳ After S2.5 |
| S2.8 | V8: `NUMERIC(10,2)` for `tb_fuel_records` monetary columns | H-008 | 2h | @data-engineer | ⏳ Pending |
| S2.9 | V9: `NOT NULL` constraints on remaining required fields | H-006 | 1h | @data-engineer | ⏳ Pending |
| S2.10 | Shared `set_updated_at()` trigger on all remaining tables | H-007, M-011 | 2h | @data-engineer | ⏳ Pending |
| S2.11 | Spring Boot Actuator + `/actuator/health` | M-005 | 1h | @dev | ✅ Done |
| S2.12 | SLF4J structured logging in `GymService` + MDC request ID | M-004 | 2h | @dev | ✅ Done |
| S2.13 | Fix `getAllExercises()` → `findByUserId(userId)` + pagination | M-006 | 1h | @dev | ✅ Done |

## Exit Gate

```
□ gym/index.html deleted (commit exists: "chore: remove CDN gym/index.html after parity verified")
□ Parity checklist Sections A–G: all 41 items checked (documented in Dev Notes)
□ Parity checklist Section H: H1–H5 checked
□ Vite bundle: JS ≤200KB gzipped (Vite bundle analyzer screenshot)
□ CSS ≤8KB gzipped
□ @babel/standalone absent from Network requests
□ cdn.tailwindcss.com absent from Network requests
□ ./mvnw test passes (integration test suite still green)
```

## Quality Gate Checklist

- [ ] @architect reviews S2.1 commit — confirms zero logic changes (diff is only syntax)
- [ ] @architect reviews S2.2 hooks — JWT is properly passed in all fetch calls
- [ ] @architect confirms S2.1 and S2.2 are separate commits (never combined)
- [ ] Parity checklist item B5 (optimistic rollback) explicitly tested and documented
- [ ] Bundle analyzer output reviewed and committed to `docs/qa/`

## Risks

| Risk | Mitigation |
|------|-----------|
| Mixing copy + data layer change in same commit | RULE: S2.1 PR merged BEFORE S2.2 begins |
| V8 column-parallel migration loses precision on existing values | Test with `SELECT SUM(CAST(old_col AS NUMERIC(10,2)) - new_col) FROM tb_fuel_records` — must be 0 |
| Parity checklist B5 (optimistic rollback) hard to test | Use Chrome DevTools Network tab to block the API request, verify UI reverts |

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.6 (claude-sonnet-4-6) — Dex (@dev)

### Completion Notes
- S2.1 and S2.2 are in separate commits as required by the critical rule
- `useExercises` initializes from `GET /api/gym/workouts` (exercises embedded) — avoids a separate `/api/gym/exercises` fetch at startup
- Optimistic rollback uses `committed` useRef to track last-saved state per exercise; `saveExercise` (onBlur) and `toggleIncreaseLoad` both implement full rollback
- Bundle: app chunk 6KB gz / react-vendor 74KB gz / supabase 50KB gz — total ~130KB gz (≤200KB AC)
- `MdcRequestFilter` sets `requestId` in MDC and returns it as `X-Request-Id` response header
- `GET /api/gym/exercises` now returns `Page<ExerciseDTO>` with `?page` + `?size` params (max 200)

### File List
**Created:**
- `gym-hub/src/components/gym/Icon.tsx`
- `gym-hub/src/components/gym/ExerciseCard.tsx`
- `gym-hub/src/components/gym/WorkoutSelector.tsx`
- `gym-hub/src/components/gym/SupplementTracker.tsx`
- `gym-hub/src/components/gym/AddExerciseForm.tsx`
- `gym-hub/src/components/BottomTabBar.tsx`
- `gym-hub/src/hooks/useWorkouts.ts`
- `gym-hub/src/hooks/useExercises.ts`
- `gym-hub/src/hooks/useSupplements.ts`
- `gym-hub/src/lib/api.ts`
- `gym-hub/src/types/gym.ts`
- `src/main/java/com/lucas/erp/config/MdcRequestFilter.java`

**Modified:**
- `gym-hub/src/pages/GymPage.tsx`
- `gym-hub/src/layouts/GymLayout.tsx`
- `gym-hub/src/index.css`
- `gym-hub/index.html`
- `gym-hub/vite.config.ts`
- `src/main/java/com/lucas/erp/gym/GymController.java`
- `src/main/java/com/lucas/erp/gym/GymService.java`
- `src/main/java/com/lucas/erp/gym/ExerciseRepository.java`
- `src/main/java/com/lucas/erp/config/SecurityConfig.java`
- `src/main/resources/application.properties`
- `pom.xml`

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-05-07 | Story created from Brownfield Discovery Phase 10 | Morgan (@pm) |
| 2026-05-08 | S2.1–S2.4, S2.6, S2.11–S2.13 implemented | Dex (@dev) |
