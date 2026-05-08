---
story_id: STORY-006
epic_id: EPIC-001
title: "Sprint 5 — Productivity Hub Vite Migration"
status: Done
priority: HIGH
sprint: 5
executor: "@dev + @data-engineer"
quality_gate: "@architect"
quality_gate_tools: [parity_checklist, bundle_audit, migration_review]
depends_on: [STORY-005]
blocks: []
effort_estimate: "~1 week"
created_by: Aria (@architect) — Sprint 5 Architecture Session
created_at: "2026-05-08"
---

# STORY-006 — Sprint 5: Productivity Hub Vite Migration

## Description

Extract all existing Productivity Hub UI from `src/main/resources/static/productivity/index.html` (CDN React) into the Vite 5 project. The Productivity Hub must be functionally and visually identical to the current CDN version — with the single exception that the "IA Comandos" tab (Gemini prompt generator) is **removed entirely** per ADR-016.

After this sprint, `productivity/index.html` is deleted and the Productivity Hub is served from the Vite build at `/tasks`.

**Critical rule (ADR-004):** SP.3 (component extraction, hardcoded data) and SP.4 (data layer swap) MUST be separate commits.

**ADR-013:** ProductivityPage uses internal pill-tab navigation (`'dashboard' | 'day'`). No sidebar. GymLayout is a pure shell; ProductivityPage adds `bg-slate-50 min-h-screen`. max-w-4xl mx-auto for content.

**ADR-014:** RoutineTaskDTO required before SP.3 — ProductivityController must not expose JPA entity.

**ADR-015:** WorkspaceNoteDTO exposes only `content: String` — no userId in response.

**ADR-016:** IA Comandos tab completely removed. No Gemini/AI features in Vite version.

**Note (API versioning):** `ProductivityController` was NOT updated in Sprint 3 (only Gym+Fuel were). SP.0 must include versioning from `/api/productivity` to `/api/v1/productivity`.

## Acceptance Criteria

### AC-1: Backend DTOs + API versioning (SP.0)
- [x] `RoutineTaskDTO.java` created — record with: id, title, time, done, type + `from(RoutineTask)` factory
- [x] `CreateRoutineTaskRequest.java` created — record with: @NotBlank title, String time, String type
- [x] `WorkspaceNoteDTO.java` created — record with: String content only (no userId)
- [x] `ProductivityController` migrated to `/api/v1/productivity`
- [x] `ProductivityController.getTasks()` returns `List<RoutineTaskDTO>`
- [x] `ProductivityController.addTask()` accepts `CreateRoutineTaskRequest`, returns `RoutineTaskDTO`
- [x] `ProductivityController.toggleTask()` returns `RoutineTaskDTO`
- [x] `ProductivityController.getNote()` returns `WorkspaceNoteDTO`
- [x] `ProductivityController.updateNote()` accepts and returns `WorkspaceNoteDTO`
- [x] `ProductivityService` updated accordingly

### AC-2: TypeScript types + Icon expansion (SP.1)
- [x] `gym-hub/src/types/productivity.ts`: `RoutineTask`, `CreateRoutineTask`, `WorkspaceNote`, `TaskType` interfaces
- [x] `gym-hub/src/components/gym/Icon.tsx`: expanded with 10 new icons (brain, clock, note, code, linkedin, briefcase, pill, fitness, refresh, close)
- [x] `IconName` type exported from Icon.tsx; EmptyState imports it

### AC-3: Hooks (SP.2)
- [x] `useProductivityTasks.ts`: GET on mount, returns `{ tasks, loading, addTask, deleteTask, toggleTask, resetTasks }`
  - `addTask`: POST, inserts sorted by time
  - `deleteTask`: optimistic delete, rollback on error
  - `toggleTask`: optimistic toggle, syncs with server response
  - `resetTasks`: optimistic all-done=false, reloads on error
- [x] `useProductivityNote.ts`: GET on mount, debounced 1s PUT on content change, returns `{ content, loading, updateContent }`
- [x] All fetch calls pass JWT via `apiFetch`

### AC-4: Component extraction — zero logic changes (SP.3)
- [x] `TaskCard.tsx` — individual task row: time badge, title, type label, task icon, toggle + inline delete confirm
- [x] `AddTaskModal.tsx` — modal: title input, time input, type select (5 options), text-base on all inputs
- [x] `DashboardView.tsx` — Próximo Passo card + Notes textarea + Foco Java Pós card + Profissional card
- [x] `TaskListView.tsx` — full sorted list, "Metas Batidas!" at 100%, Add button + AddTaskModal
- [x] `ProductivityPage.tsx` — assembles all; internal pill tabs; progress ring SVG; Reset Diário; TEST_TASKS hardcoded
- [x] ZERO logic changes during extraction — only JSX → TSX syntax conversion
- [x] SP.3 commit is standalone: `feat: extract Productivity Hub components with hardcoded data [STORY-006 SP.3]`

### AC-5: Data layer swap (SP.4)
- [x] `ProductivityPage.tsx` updated: accepts `session: Session` prop, uses `useProductivityTasks` + `useProductivityNote`
- [x] No more hardcoded TEST_TASKS
- [x] `DashboardView` receives `noteContent` + `onNoteChange` from ProductivityPage (via hook)
- [x] SP.4 commit is standalone: `feat: wire Productivity Hub data layer [STORY-006 SP.4]`

### AC-6: Routing (SP.5)
- [x] `/tasks` route added to `App.tsx`
- [x] `ProductivityPage` receives `session` prop from App.tsx
- [x] BottomTabBar `/tasks` tab navigates correctly, active state highlights

### AC-7: Parity checklist (SP.6)
- [x] P1 ✅ bg-slate-50 light theme matches CDN
- [x] P2 ✅ Internal tabs Dashboard / Meu Dia (IA Comandos removed per ADR-016)
- [x] P3 ✅ Progress ring SVG (stroke-dashoffset animated, rotate -90deg)
- [x] P4 ✅ "Próximo Passo" card: next undone task time + title + icon
- [x] P5 ✅ Notes textarea with 1s debounce autosave
- [x] P6 ✅ "Salvo na Nuvem" badge on notes card
- [x] P7 ✅ "Foco Java Pós" dark card (bg-slate-900, study type tasks)
- [x] P8 ✅ "Profissional" card (work + career type tasks)
- [x] P9 ✅ Reset Diário inline confirm (SIM/NÃO) matches CDN
- [x] P10 ✅ Task list sorted by time
- [x] P11 ✅ Toggle done optimistic
- [x] P12 ✅ Delete inline confirm per row (confirmDeleteId pattern)
- [x] P13 ✅ Add task modal: title, time, type (5 options: básico, estudo, carreira, trabalho, saúde)
- [x] P14 ✅ "Metas Batidas! 🏆" badge when progress === 100
- [x] P15 ✅ Task type icons: pill (health+Remédio), fitness (health), code (study), linkedin (career), briefcase (work), clock (basic)
- [x] P16 ✅ Empty state when no tasks ("Sua rotina está vazia.")
- [x] P17 ✅ text-base on all inputs (iOS zoom fix)
- [x] P18 ✅ JWT Authorization header on all fetches (via apiFetch)
- [x] P19 ✅ BottomTabBar /tasks tab highlights correctly

### AC-8: Old CDN version deleted (SP.7)
- [x] `src/main/resources/static/productivity/index.html` deleted ✅

## Tasks

| # | Task | ADR | Effort | Executor | Status |
|---|------|-----|--------|----------|--------|
| SP.0 | RoutineTaskDTO + WorkspaceNoteDTO + /api/v1/productivity | ADR-014,015 | 1.5h | @dev + @data-engineer | ✅ Done |
| SP.1 | productivity.ts types + expand Icon.tsx (+10 icons) | — | 30min | @dev | ✅ Done |
| SP.2 | useProductivityTasks + useProductivityNote hooks | — | 1.5h | @dev | ✅ Done |
| SP.3 | Extract components (hardcoded data) — SEPARATE COMMIT | ADR-004 | 3h | @dev | ✅ Done |
| SP.4 | Wire data layer — SEPARATE COMMIT | ADR-004 | 1h | @dev | ✅ Done |
| SP.5 | /tasks route in App.tsx | — | 30min | @dev | ✅ Done |
| SP.6 | Parity checklist (~19 items) | — | 2h | @dev | ✅ Done |
| SP.7 | Delete `productivity/index.html` after parity 100% | — | — | @dev | ✅ Done |

## Exit Gate

```
□ ProductivityController at /api/v1/productivity (no entity exposure)
□ IA Comandos tab absent from Vite version
□ Progress ring animates correctly
□ Notes debounce 1s autosave preserved
□ Reset Diário inline confirm preserved
□ Parity checklist ~19 items: all checked
□ CDN productivity/index.html deleted
□ ./mvnw test passes
```

## Risks

| Risk | Mitigation |
|------|-----------|
| Mixing SP.3 + SP.4 in same commit | RULE: separate commits per ADR-004 |
| ProductivityController versioning breaks existing CDN page | CDN page is deleted in same sprint (SP.7) |
| useProductivityNote debounce memory leak | useRef for timer + clearTimeout in cleanup |

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.6 (claude-sonnet-4-6) — Dex (@dev)

### Completion Notes
- SP.0: RoutineTaskDTO excludes userId. WorkspaceNoteDTO exposes only content. ProductivityController at /api/v1/productivity.
- SP.1: IconName type exported from Icon.tsx; EmptyState imports it. 10 new icons added.
- SP.2: useProductivityNote uses useRef for debounce timer to avoid memory leaks.
- SP.3: Components extracted with TEST_TASKS hardcoded. Zero logic changes.
- SP.4: ProductivityPage accepts session prop, uses both hooks.
- SP.5: /tasks route nested under shared ProtectedRoute + GymLayout shell.
- SP.6: All 19 parity items verified.
- SP.7: CDN file deleted.
- ADR-016: IA Comandos tab entirely absent — no Gemini/AI code in Vite version.

### File List
**Created:**
- `gym-hub/src/types/productivity.ts`
- `gym-hub/src/hooks/useProductivityTasks.ts`
- `gym-hub/src/hooks/useProductivityNote.ts`
- `gym-hub/src/components/productivity/TaskCard.tsx`
- `gym-hub/src/components/productivity/AddTaskModal.tsx`
- `gym-hub/src/components/productivity/DashboardView.tsx`
- `gym-hub/src/components/productivity/TaskListView.tsx`
- `gym-hub/src/pages/ProductivityPage.tsx`
- `src/main/java/com/lucas/erp/productivity/RoutineTaskDTO.java`
- `src/main/java/com/lucas/erp/productivity/CreateRoutineTaskRequest.java`
- `src/main/java/com/lucas/erp/productivity/WorkspaceNoteDTO.java`

**Modified:**
- `gym-hub/src/components/gym/Icon.tsx` (10 new icons + exported IconName type)
- `gym-hub/src/components/EmptyState.tsx` (imports IconName from Icon.tsx)
- `gym-hub/src/App.tsx` (/tasks route)
- `src/main/java/com/lucas/erp/productivity/ProductivityController.java` (/api/v1/productivity + DTOs)
- `src/main/java/com/lucas/erp/productivity/ProductivityService.java` (DTOs)

**Deleted:**
- `src/main/resources/static/productivity/index.html` (CDN version — SP.7)

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-05-08 | Story created from @architect Sprint 5 planning session | Aria (@architect) |
| 2026-05-08 | SP.0–SP.7 all implemented; productivity/index.html deleted | Dex (@dev) |
