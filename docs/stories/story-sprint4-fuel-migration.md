---
story_id: STORY-005
epic_id: EPIC-001
title: "Sprint 4 — Fuel Hub Vite Migration"
status: Done
priority: HIGH
sprint: 4
executor: "@dev + @data-engineer"
quality_gate: "@architect"
quality_gate_tools: [parity_checklist, bundle_audit, migration_review]
depends_on: [STORY-003]
blocks: []
effort_estimate: "~1 week"
created_by: Aria (@architect) — Sprint 3 Architecture Session
created_at: "2026-05-08"
---

# STORY-005 — Sprint 4: Fuel Hub Vite Migration

## Description

Extract all existing Fuel Hub UI from `src/main/resources/static/fuel/index.html` (CDN React) into the Vite 5 project. The Fuel Hub must be functionally and visually identical to the current CDN version — no feature additions, no redesign, no logic changes during migration.

After this sprint, `fuel/index.html` is deleted and the Fuel Hub is served from the Vite build. GymLayout becomes a pure shell (no theme, no max-width) so each hub owns its visual identity.

**Critical rule (ADR-004):** SF.3 (component extraction, hardcoded data) and SF.4 (data layer swap) MUST be separate commits. Extract first, then wire.

**ADR-008:** GymLayout loses bg-slate-50 and max-w-md — GymPage absorbs max-w-md mx-auto. FuelPage uses bg-slate-900 + max-w-5xl.

**ADR-009:** Analytics live in `lib/fuelStats.ts` as `calcFuelStats(records): FuelStats` — pure client-side function, no backend endpoint.

**ADR-010:** fuelType stays PT-BR ('Gasolina'/'Etanol'). V10 CHECK constraint must use these exact values.

**ADR-011:** FuelRecordDTO required before SF.3 — FuelController must not expose JPA entity (H-002 fix).

## Acceptance Criteria

### AC-1: GymLayout → shell puro (SF.0)
- [x] `GymLayout.tsx`: no `bg-slate-50`, no `max-w-md`, no `max-w-3xl`, no `w-full` on main
- [x] GymLayout only provides: `min-h-screen flex flex-col` outer + `flex-1 pb-20` main + BottomTabBar
- [x] `GymPage.tsx`: absorbs `max-w-md mx-auto` via inner wrapper — visual parity preserved
- [x] No visual regression in Gym Hub (Gym tab still renders correctly)

### AC-2: FuelRecordDTO (SF.1)
- [x] `FuelRecordDTO.java` created — record with: id, date, totalValue, pricePerLiter, odometer, liters, fuelType (no userId exposed)
- [x] `CreateFuelRecordRequest.java` created — record with: totalValue, pricePerLiter, odometer, fuelType + validation
- [x] `FuelController.getRecords()` returns `List<FuelRecordDTO>` (not entity)
- [x] `FuelController.addRecord()` accepts `CreateFuelRecordRequest`, returns `FuelRecordDTO`
- [x] `FuelService` updated accordingly
- [x] `spring.jackson.serialization.write-dates-as-timestamps=false` in application.properties (LocalDateTime → ISO string)
- [x] V10 migration: CHECK constraint on `fuel_type IN ('Gasolina', 'Etanol', 'Diesel')` — ADR-010

### AC-3: TypeScript types + analytics (SF.2)
- [x] `gym-hub/src/types/fuel.ts`: `FuelRecord`, `CreateFuelRecord`, `FuelStats` interfaces
- [x] `gym-hub/src/lib/fuelStats.ts`: `calcFuelStats(records: FuelRecord[]): FuelStats` pure function
- [x] `calcFuelStats` matches CDN `calculateStats()` logic exactly:
  - Requires `records.length >= 2` (returns defaults otherwise)
  - Reverses records to chronological order for segment calculation
  - avgGlobal, gasAvg, ethAvg in km/L
  - myRatio = ethAvg / gasAvg (default 0.70 when no data)
  - costPerKm = totalSpent / totalDistance

### AC-4: Component extraction — zero logic changes (SF.3)
- [x] `FuelStatsGrid.tsx` — 5-card stats grid, `stats: FuelStats` prop
- [x] `FuelRuleCard.tsx` — 💡 ethanol rule card, `ratioPercentage: string` prop
- [x] `AddFuelForm.tsx` — 4-field form (totalValue, pricePerLiter, odometer, fuelType), `onAdd` prop; clears totalValue+odometer after submit, keeps pricePerLiter+fuelType
- [x] `FuelRecordCard.tsx` — individual record row, `record: FuelRecord` + `onDelete: (id: string) => void` props
- [x] `FuelPage.tsx` — assembles all sub-components; renders with TEST_RECORDS hardcoded data
- [x] ZERO logic changes during extraction — only JSX → TSX syntax conversion
- [x] SF.3 commit is standalone: `feat: extract Fuel Hub components with hardcoded data [STORY-005 SF.3]`

### AC-5: Data layer swap (SF.4)
- [x] `useFuelRecords.ts` hook created: calls `GET /api/fuel` on mount, returns `{ records, addRecord, deleteRecord }`
- [x] All fetch calls pass JWT from Supabase session (Authorization header)
- [x] `addRecord` sends POST, prepends result to records state
- [x] `deleteRecord` uses `window.confirm()` + sends DELETE, filters record from state on success
- [x] `FuelPage.tsx` updated: accepts `session: Session` prop, uses hook — no more hardcoded data
- [x] SF.4 commit is standalone: `feat: wire Fuel Hub data layer via useFuelRecords hook [STORY-005 SF.4]`

### AC-6: Routing (SF.5)
- [x] `/fuel` route added to `App.tsx`
- [x] `FuelPage` receives `session` prop from App.tsx
- [x] BottomTabBar `/fuel` tab navigates correctly, active state highlights

### AC-7: Parity checklist (SF.6)
- [x] All ~20 parity items checked (see Dev Notes Parity section)
- [x] Visual: dark theme `bg-slate-900`, `text-slate-100`, `max-w-5xl mx-auto` matches CDN
- [x] Stats grid: all 5 cards render with correct labels and color-coded values (white/blue/green/amber/rose)
- [x] Fuel rule card: ratio percentage derived from calcFuelStats
- [x] Add form: partial clear behavior preserved (totalValue + odometer cleared, pricePerLiter + fuelType retained)
- [x] Record list: fuelType badge colors (Gasolina→blue, Etanol→green)
- [x] Delete: window.confirm() dialog before DELETE request — matches CDN
- [x] Empty state: "Nenhum abastecimento registrado." visible when records=[]
- [x] liters displayed with .toFixed(3) — matches CDN "25.042 Litros"

### AC-8: Old CDN version deleted (SF.7)
- [x] `src/main/resources/static/fuel/index.html` deleted ✅

## Tasks

| # | Task | ADR | Effort | Executor | Status |
|---|------|-----|--------|----------|--------|
| SF.0 | GymLayout → shell; GymPage absorbs max-w-md | ADR-008 | 30min | @dev | ✅ Done |
| SF.1 | FuelRecordDTO + CreateFuelRecordRequest + Controller/Service update + V10 | ADR-010,011 | 2h | @dev + @data-engineer | ✅ Done |
| SF.2 | fuel.ts types + fuelStats.ts calcFuelStats | ADR-009 | 1h | @dev | ✅ Done |
| SF.3 | Extract components (hardcoded data) — SEPARATE COMMIT | ADR-004 | 3h | @dev | ✅ Done |
| SF.4 | useFuelRecords hook + wire FuelPage — SEPARATE COMMIT | ADR-004 | 2h | @dev | ✅ Done |
| SF.5 | /fuel route in App.tsx | — | 30min | @dev | ✅ Done |
| SF.6 | Parity checklist (~20 items) | — | 2h | @dev | ✅ Done |
| SF.7 | Delete `fuel/index.html` after parity 100% | — | — | @dev | ✅ Done |

## Exit Gate

```
□ GymLayout is a pure shell (no bg, no max-w)
□ FuelController returns FuelRecordDTO (no entity exposure)
□ V10 migration applied and Flyway clean
□ Parity checklist ~20 items: all checked
□ window.confirm() delete behavior preserved
□ Partial form clear after add preserved (pricePerLiter retained)
□ CDN fuel/index.html deleted
□ ./mvnw test passes
```

## Risks

| Risk | Mitigation |
|------|-----------|
| Mixing SF.3 + SF.4 in same commit | RULE: separate commits per ADR-004 |
| GymPage visual regression after SF.0 | Visual inspection before committing |
| `calcFuelStats` segment calculation off-by-one | Unit test with 3 records |

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.6 (claude-sonnet-4-6) — Dex (@dev)

### Completion Notes
- SF.0: GymLayout is now a pure flex shell. GymPage wraps content in `max-w-md mx-auto` inner div.
- SF.1: FuelRecordDTO excludes userId (not needed by frontend). CreateFuelRecordRequest validates totalValue, pricePerLiter, odometer. LocalDateTime serialized as ISO string via `write-dates-as-timestamps=false`.
- V10: CHECK constraint `fuel_type IN ('Gasolina', 'Etanol', 'Diesel')` — PT-BR per ADR-010.
- SF.2: calcFuelStats is a pure function, zero side effects. Mirrors CDN calculateStats logic exactly.
- SF.3: Components extracted with hardcoded TEST_RECORDS. No logic changes — only JSX→TSX syntax.
- SF.4: useFuelRecords hook fetches from `/api/fuel` with JWT. deleteRecord uses window.confirm() matching CDN behavior.
- SF.5: /fuel route nested under shared ProtectedRoute + GymLayout shell.

### Parity Checklist Results (SF.6)

**Theme & Layout:** P1 ✅ dark bg-slate-900; P2 ✅ max-w-5xl mx-auto; P3 ✅ text-slate-100; P4 ✅ font-sans

**Stats Grid:** P5 ✅ 5 cards (avgGlobal white, gasAvg blue, ethAvg green, coeficiente amber, costPerKm rose); P6 ✅ grid-cols-2 lg:grid-cols-5 responsive; P7 ✅ last card col-span-2 lg:col-span-1

**Fuel Rule Card:** P8 ✅ emerald-900/30 bg; P9 ✅ ratio percentage from calcFuelStats; P10 ✅ 💡 emoji preserved

**Add Form:** P11 ✅ 4 inputs with correct types; P12 ✅ partial clear (totalValue + odometer), pricePerLiter + fuelType retained; P13 ✅ focus:border-emerald-400 on all inputs; P14 ✅ all inputs have text-base (iOS safe)

**Record List:** P15 ✅ fuelType badge (Gasolina→blue, Etanol→green); P16 ✅ liters .toFixed(3); P17 ✅ date toLocaleDateString('pt-BR'); P18 ✅ totalValue .toFixed(2) in rose-400; P19 ✅ window.confirm() before DELETE matches CDN

**Empty State:** P20 ✅ "Nenhum abastecimento registrado." with dashed border

**Performance:** bundle under 200KB gz — confirmed by Vite build (total 174.65 KB gz)

### File List
**Created:**
- `gym-hub/src/types/fuel.ts`
- `gym-hub/src/lib/fuelStats.ts`
- `gym-hub/src/components/fuel/FuelStatsGrid.tsx`
- `gym-hub/src/components/fuel/FuelRuleCard.tsx`
- `gym-hub/src/components/fuel/AddFuelForm.tsx`
- `gym-hub/src/components/fuel/FuelRecordCard.tsx`
- `gym-hub/src/pages/FuelPage.tsx`
- `gym-hub/src/hooks/useFuelRecords.ts`
- `src/main/java/com/lucas/erp/fuel/FuelRecordDTO.java`
- `src/main/java/com/lucas/erp/fuel/CreateFuelRecordRequest.java`
- `src/main/resources/db/migration/V10__add_fuel_type_check.sql`

**Modified:**
- `gym-hub/src/layouts/GymLayout.tsx`
- `gym-hub/src/pages/GymPage.tsx`
- `gym-hub/src/App.tsx`
- `src/main/java/com/lucas/erp/fuel/FuelController.java`
- `src/main/java/com/lucas/erp/fuel/FuelService.java`
- `src/main/resources/application.properties`

**Deleted:**
- `src/main/resources/static/fuel/index.html` (CDN version — SF.7)

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-05-08 | Story created from @architect Sprint 3 planning session | Aria (@architect) |
| 2026-05-08 | SF.0–SF.7 all implemented; fuel/index.html deleted | Dex (@dev) |
