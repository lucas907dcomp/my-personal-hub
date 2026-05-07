# My-Hubs — Technical Debt Assessment (FINAL)

**Version:** 1.0 FINAL  
**Author:** Aria (Architect Agent) — Phase 8 Final Assessment  
**Date:** 2026-05-07  
**Audience:** Senior / Tech Lead  
**Status:** FINAL — QA Gate APPROVED (Phase 7)

**Brownfield Discovery Provenance:**
- Phase 1: `docs/architecture/system-architecture.md` (Aria)
- Phase 2: `docs/database/SCHEMA.md` + `DB-AUDIT.md` (Dara)
- Phase 3: `docs/frontend/frontend-spec.md` (Uma)
- Phase 4: `docs/prd/technical-debt-DRAFT.md` (Aria — consolidated draft)
- Phase 5: `docs/reviews/db-specialist-review.md` (Dara — APPROVED WITH CONDITIONS)
- Phase 6: `docs/reviews/ux-specialist-review.md` (Uma — APPROVED WITH CONDITIONS)
- Phase 7: `docs/reviews/qa-review.md` (Quinn — APPROVED)

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-05-07 | 1.0 | Final assessment — incorporates DB (7), UX (5), QA (9) specialist corrections | Aria (@architect) |

---

## 1. Executive Summary

**My-Hubs** is a personal ERP monolith at a strategic inflection point. What began as a single-user local utility is becoming a **multi-tenant production SaaS** — with the Gym Hub module as the first externally-deployed product for real users.

**The core finding is unchanged and stark: this system cannot safely onboard a second user today.**

The entire data model assumes a single global user. There is no identity, no isolation, no authentication, and no authorization at any layer. Three specialist agents and a QA gate have validated this assessment across 7 phases of brownfield discovery.

### Discovery Scorecard (Final — Deduplicated)

| Domain | Issues | CRITICAL | HIGH | MEDIUM | LOW |
|---|---|---|---|---|---|
| Architecture / Backend | 20 | 4 | 6 | 7 | 3 |
| Database (+ specialist review) | 21 | 4 | 8 | 6 | 3 |
| Frontend (+ specialist review) | 11 | 2 | 4 | 4 | 1 |
| Cross-cutting (QA-identified) | 4 | 0 | 2 | 2 | 0 |
| **TOTAL (deduplicated)** | **43** | **7** | **12** | **14** | **6** |

> 9 additional items added vs the DRAFT (DB-R-004, UX-R-001/003 promoted; QA-GAP-001/002 new).

### The Single Blocker

**Every user shares every piece of data today.** Until that changes, deploying to multiple users means User A can read, modify, and delete User B's workouts. This is not a performance issue. It is a launch prerequisite. Nothing else ships until C-001 through C-007 are resolved.

---

## 2. Strategic Context

### 2.1 Project Classification

| Dimension | Current State | Target State |
|---|---|---|
| Users | 1 (developer) | 2–10 (friends + developer) |
| Deployment | Local (Docker) | Cloud (Supabase + TBD host) |
| Authentication | None | Supabase Auth (email + password) |
| Data isolation | Global singleton | Per-user (RLS + service-role filtering) |
| Frontend toolchain | CDN SPA (React 18 / Babel) | Vite 5 + React 18 |
| Schema management | `ddl-auto=update` | Flyway V1–V7 (explicit, versioned) |
| Test coverage | ~0% (smoke test only) | Integration tests for auth-critical paths |

### 2.2 Architecture Decision: Supabase (ADR-003, Confirmed)

Supabase over Firebase — confirmed across all discovery phases. Spring Boot + JPA connects natively to Supabase via PostgreSQL JDBC. RLS provides DB-level multi-tenancy. Supabase Auth produces standard JWTs compatible with Spring Security.

**Critical clarification (DB-R-001 — Dara):** Spring Boot connects as the Postgres `service_role`, which bypasses RLS entirely. This is **by design** — it means:

1. Spring Boot enforces `user_id` filtering at the repository level (application-layer security)
2. RLS policies serve as **defense-in-depth** for direct PostgREST / Supabase JS SDK access
3. `FORCE ROW LEVEL SECURITY` + anon deny policies ensure no direct DB access can bypass isolation

This dual-enforcement pattern (app layer + DB layer) is stronger than either alone.

### 2.3 Frontend Migration (ADR-004, Confirmed)

Extraction, not redesign. `gym/index.html` is already React 18. The 7-step zero-regression migration path is correct. Do not refactor and migrate simultaneously.

---

## 3. Consolidated Technical Debt Registry

> Severity: **CRITICAL** = launch blocker | **HIGH** = Sprint 1 prerequisite | **MEDIUM** = Sprint 2 | **LOW** = Sprint 3+

### 3.1 CRITICAL — Launch Blockers

| ID | Layer | Title | Source |
|---|---|---|---|
| **C-001** | DB / Backend / Frontend | No `user_id` — zero multi-tenant data isolation | TD-001, RLS-001–006 |
| **C-002** | DB | Singleton `id=1` (`SupplementGoal`, `WorkspaceNote`) — second user INSERT fails | TD-002, SCH-001/002 |
| **C-003** | Backend | No authentication layer — zero identity enforcement | TD-004 |
| **C-004** | Backend / DB | Hardcoded credentials in `application.properties` + `docker-compose.yml` | TD-003, SEC-001/002 |
| **C-005** | DB | `ddl-auto=update` with no migration versioning — boot fails on `user_id NOT NULL` | TD-008, SEC-003 |
| **C-006** | Frontend | Auth screens missing (Login, Signup) | FE-001 |
| **C-007** | DB | RLS disabled on all 6 tables | RLS-001–006 |

### 3.2 HIGH — Sprint Prerequisites

| ID | Layer | Title | Source |
|---|---|---|---|
| **H-001** | Backend | No Service layer — repos injected directly into controllers | TD-005 |
| **H-002** | Backend | No DTO layer — JPA entities exposed in API responses | TD-007 |
| **H-003** | DB | `Exercise.workoutId` — logical FK, no constraint, no index | TD-006, FK-001 |
| **H-004** | Backend | No input validation despite `starter-validation` imported | TD-009 |
| **H-005** | Frontend | React + Tailwind via CDN — ~4MB initial load, runtime JSX transpilation | TD-010 |
| **H-006** | DB | Missing `NOT NULL` on 10 required business fields | DB-AUDIT §2.2 |
| **H-007** | DB | No audit timestamps (`created_at`, `updated_at`) on any table | DB-AUDIT §2.4 |
| **H-008** | DB | `FLOAT8` for monetary values — precision errors in financial calculations | SCH-003 |
| **H-009** | Backend | `@CrossOrigin("*")` on `FuelController` — inconsistent CORS | TD-014, SEC-005 |
| **H-010** | DB | No migration versioning (Flyway) — schema history unauditable | SEC-004 |
| **H-011** | DB | Missing `user_id` indexes — sequential scan on every tenant-scoped query | DB-R-004 |
| **H-012** | Frontend | Auth session flash — returning users briefly see login page on restore | UX-R-001 |
| **H-013** | Frontend | Supabase Auth `redirectTo` URL not configured — email verification links break | UX-R-003 |

### 3.3 MEDIUM — Sprint 2

| ID | Layer | Title | Source |
|---|---|---|---|
| **M-001** | Backend | No error handling — `orElseThrow()` returns `500` with stack trace | TD-011 |
| **M-002** | Backend | Zero test coverage (contextLoads only) | TD-012 |
| **M-003** | Backend | No API versioning (`/api/gym` not `/api/v1/gym`) | TD-013 |
| **M-004** | Backend | No logging strategy (no SLF4J usage) | TD-015 |
| **M-005** | Backend | No Spring Boot Actuator | TD-016 |
| **M-006** | Backend | `getAllExercises()` returns unbounded global result | TD-017 |
| **M-007** | DB | `time` column stored as `VARCHAR("HH:MM")` — not `TIME` type | SCH-005 |
| **M-008** | DB | `task.type` + `fuel_type` unconstrained `VARCHAR` | SCH-006/007 |
| **M-009** | DB | Generic `VARCHAR(255)` — no domain-aware column sizing | SCH-008 |
| **M-010** | DB | Anon role deny policies missing from RLS spec | DB-R-005 |
| **M-011** | DB | `set_updated_at()` function created per-table instead of shared | DB-R-006 |
| **M-012** | Backend | HikariCP pool not sized for Supabase free tier (60-conn limit) | QA-GAP-001 |
| **M-013** | Backend | No migration rollback scripts for V2–V7 | QA-GAP-002 |
| **M-014** | Frontend | JWT localStorage trade-off undocumented | UX-R-002 |
| **M-015** | Frontend | Input `font-size < 16px` triggers iOS viewport zoom | UX-R-004 |
| **M-016** | Backend | CORS config missing production domain env var placeholder | QA-GAP-004 |

### 3.4 LOW — Sprint 3+

| ID | Layer | Title | Source |
|---|---|---|---|
| **L-001** | Backend | `Exercise.reps` as `String` ("3x10") — not normalized | TD-018, SCH-004 |
| **L-002** | Backend | No workout ordering field — `findAll()` order is non-deterministic | TD-019 |
| **L-003** | Backend | No production deployment configuration | TD-020 |
| **L-004** | DB | RPE no `CHECK (rpe BETWEEN 1 AND 10)` | SCH-009 |
| **L-005** | DB | No positive value `CHECK` on fuel/exercise numeric fields | SCH-010 |
| **L-006** | DB | `liters` computed column should use `GENERATED ALWAYS AS` | DB-R-007 |
| **L-007** | Frontend | WorkoutSelector overflow has no visual scroll indicator | UX-R-005 |
| **L-008** | Backend / Frontend | No error monitoring (Sentry or equivalent) for production | QA-GAP-003 |

### 3.5 Future Domain Gap

**Missing concept: Workout Session / History**

Current model tracks workout templates (splits + exercises). No concept of a training session — users cannot view performance history or track progression over time. This is a feature gap, not a safety issue.

Recommended future entity: `tb_gym_sessions (id, user_id, workout_id, performed_at, notes, created_at)`. Scope for Sprint 3 or post-launch backlog — pure addition, zero risk to existing data.

---

## 4. Architecture Decision Records

### ADR-001: Logical FK for Exercise.workoutId — Superseded

**Status:** Superseded → migrate to `@ManyToOne(fetch=LAZY)` with `ON DELETE CASCADE` in Sprint 1 (H-003)

### ADR-002: Singleton Pattern for SupplementGoal + WorkspaceNote — Superseded

**Status:** Superseded → redesign with `user_id UUID` as primary key in Sprint 0

### ADR-003: Supabase over Firebase — Confirmed

**Status:** Confirmed by all 3 specialist agents + QA gate  
**Rationale:** PostgreSQL native compatibility, RLS-based multi-tenancy, Spring Boot JPA zero-redesign path, standard JWT for Spring Security

### ADR-004: Frontend Migration — Extraction, Not Redesign — Confirmed

**Status:** Confirmed  
**Rationale:** Existing SaaS Premium visual language is production-ready. 7-step zero-regression path. Do not mix file extraction with data layer changes.

### ADR-005: No External Component Library — Confirmed

**Status:** Confirmed  
**Rationale:** Custom glass morphism aesthetic — overriding shadcn/radix defaults costs more than building from Tailwind utilities

### ADR-006: Spring Boot Service Role + Repository-Level userId Filtering — New

**Status:** New — confirmed in Phase 5 (Dara)  
**Context:** Spring Boot connects to Supabase via JDBC using the Postgres service role, which bypasses RLS. `auth.uid()` returns NULL for JDBC connections.  
**Decision:** Spring Boot uses service role + enforces `user_id = :userId` filtering at every repository query. RLS policies remain as defense-in-depth for direct PostgREST and Supabase JS SDK access. `FORCE ROW LEVEL SECURITY` + anon deny policies prevent bypass via any direct DB access.  
**Consequence:** `@AuthenticationPrincipal UUID userId` is injected at the controller, passed to the service, and used in every repository query. Never `findAll()` — always `findByUserId(userId)`.

### ADR-007: JWT Storage — localStorage (Accepted Risk) — New

**Status:** New — confirmed in Phase 6 (Uma)  
**Context:** Supabase JS SDK defaults to localStorage for JWT persistence. httpOnly cookies would require server-side session infrastructure.  
**Decision:** Use localStorage (Supabase default) for this project scope.  
**Rationale:** Personal app for close friends, no sensitive health data, XSS surface controlled in Vite/React build. Additional httpOnly infrastructure is not justified at this scale.  
**Review trigger:** Revisit if app handles health/financial data or expands to unknown public users.

---

## 5. Risk Matrix

| Risk | Probability | Impact | Severity | Mitigation |
|---|---|---|---|---|
| Data leak at multi-user launch | CERTAIN without fix | CRITICAL | 🔴 | C-001–C-007 required before any invite |
| Boot failure adding `user_id NOT NULL` | HIGH — `ddl-auto=update` active | HIGH | 🔴 | C-005 + Flyway V1 baseline before any entity change |
| Duplicate key on second user signup | CERTAIN — singleton schema | CRITICAL | 🔴 | C-002 redesign in Sprint 0 |
| Credential in source code leaks | LOW — not public yet | HIGH | 🟠 | C-004 immediate; rotate docker password |
| Session flash breaks first impression | HIGH — SPA pattern bug | MEDIUM | 🟠 | H-012 fixed in Sprint 1 with SplashScreen |
| Email verification links fail on mobile | HIGH — localhost URL | HIGH | 🟠 | H-013 fixed in Sprint 1 before any invite |
| Orphaned exercises on workout delete | MEDIUM — manual cascade | MEDIUM | 🟡 | H-003 FK + cascade in Sprint 0/1 |
| Frontend 4MB load fails 3G mobile | HIGH — CDN unoptimized | MEDIUM | 🟠 | H-005 Vite migration Sprint 1–2 |
| DB pool exhausted on Supabase free | LOW at 10 users | MEDIUM | 🟡 | M-012 HikariCP sizing Sprint 0 |
| No observability when users encounter bugs | CERTAIN | MEDIUM | 🟡 | L-008 Sentry Sprint 3 |

---

## 6. Implementation Roadmap (Final — All Corrections Incorporated)

### Sprint 0 — Security & Schema Foundations

**Gate: Must complete 100% before inviting any user.**  
**Prerequisite: Take DB snapshot first.**

```bash
# Before starting Sprint 0
docker exec db-erp-pessoal pg_dump -U postgres erp_pessoal > backup-pre-sprint0-$(date +%Y%m%d).sql
```

| # | Task | Issues | Effort |
|---|---|---|---|
| **S0.1** | `git init` + establish branch strategy (main/develop) | — | 30 min |
| **S0.2** | Externalize credentials to `.env` + update `.gitignore` | C-004 | 30 min |
| **S0.3** | Switch `ddl-auto=update` → `validate` | C-005 | 15 min |
| **S0.4** | Add Flyway to `pom.xml` + configure `baselineOnMigrate=true` + HikariCP pool sizing | H-010, M-012 | 1h |
| **S0.5** | Generate V1 baseline via `pg_dump --schema-only` from live Docker DB | H-010 | 30 min |
| **S0.6** | Write V2: clean orphaned exercises + add FK + `NOT NULL` + index on `workout_id` | H-003 | 1h |
| **S0.7** | Write V3: add `user_id` + `created_at` + `updated_at` to `tb_gym_workouts` + `tb_gym_exercises` | C-001, H-007, H-011 | 2h |
| **S0.8** | Write V4: add `user_id` + timestamps to `tb_fuel_records` + `tb_routine_tasks` | C-001, H-007, H-011 | 1h |
| **S0.9** | Write V5: redesign `tb_gym_supplements` (drop `id=1`, add `user_id UUID PK`) — schema only | C-002 | 2h |
| **S0.10** | Write V6: redesign `tb_workspace_notes` (drop `id=1`, add `user_id UUID PK`) — schema only | C-002 | 1h |
| **S0.11** | `*dry-run` all migrations against local Docker DB | — | 30 min |
| **S0.12** | Apply V1–V6 migrations + verify with `*smoke-test` | — | 1h |
| **S0.13** | Enable RLS on all 6 tables + `FORCE ROW LEVEL SECURITY` + `TO authenticated` policies + anon deny policies | C-007, M-010 | 3h |
| **S0.14** | Write rollback scripts for V2–V6 | M-013 | 1h |
| **S0.15** | Centralize CORS config — remove `@CrossOrigin(*)`, add production domain env var | H-009, M-016 | 45 min |

> **Flyway migration ordering:** V1 (baseline) → V2 (FK/index) → V3 (gym user_id) → V4 (fuel/tasks user_id) → V5 (supplement redesign) → V6 (workspace redesign) → **V7 (FK to `auth.users`)** written but applied Supabase-only after Auth is live

> **`shared_updated_at` function:** Create once in V3, reuse in V4–V6 — do not create per-table

**Sprint 0 Exit Gate (Local Docker — no Supabase required):**
```sql
-- All migrations applied
SELECT version, description, success FROM flyway_schema_history ORDER BY installed_rank;
-- Expected: V1–V6 with success=true

-- Application boots without Hibernate exceptions (ddl-auto=validate)
-- ./mvnw spring-boot:run → no "Schema-validation: missing column" errors

-- user_id present on gym tables
SELECT column_name FROM information_schema.columns
WHERE table_name = 'tb_gym_workouts' AND column_name = 'user_id';
-- Expected: 1 row

-- FK constraint exists
SELECT constraint_name FROM information_schema.table_constraints
WHERE table_name = 'tb_gym_exercises' AND constraint_type = 'FOREIGN KEY';
-- Expected: fk_exercises_workout

-- No credentials in application.properties
-- grep -r "lucas123" src/main/resources/ → 0 results
```

---

### Sprint 1 — Authentication + Structural Refactor

**Scope:** Backend service layer + JWT auth + Vite scaffold + Auth screens + integration tests

| # | Task | Issues | Effort |
|---|---|---|---|
| S1.1 | Extract `GymService` from `GymController` | H-001 | 4h |
| S1.2 | Add DTO layer for Gym API (`WorkoutDTO`, `ExerciseDTO`, `SupplementDTO`) | H-002 | 3h |
| S1.3 | Migrate `Exercise.workoutId` → `@ManyToOne(fetch=LAZY)` with `@JoinColumn` | H-003 | 2h |
| S1.4 | Add `@Valid` + constraint annotations to all controllers | H-004 | 2h |
| S1.5 | Add `@ControllerAdvice` global exception handler (`ProblemDetail` RFC 9457) | M-001 | 3h |
| S1.6 | Add `spring-boot-starter-security` + `spring-security-oauth2-resource-server` | C-003 | 30 min |
| S1.7 | Write `JwtAuthFilter` — extracts `sub` claim from Supabase JWT → `userId` in SecurityContext | C-003 | 4h |
| S1.8 | Write `SecurityConfig` — protect all `/api/**` endpoints | C-003 | 2h |
| S1.9 | Update all Gym repository queries: `findByUserId(userId)` everywhere | C-001, ADR-006 | 2h |
| S1.10 | Scaffold Vite 5 project | H-005 | 1h |
| S1.11 | Configure Tailwind + design tokens in `tailwind.config.js` | H-005 | 2h |
| S1.12 | Integrate `@supabase/supabase-js` — `supabaseClient.ts` singleton | C-006 | 1h |
| S1.13 | Build `LoginPage` + `SignupPage` (AuthForm organism) | C-006 | 4h |
| S1.14 | Add React Router + `ProtectedRoute` wrapper (auth guard) | C-006 | 2h |
| **S1.15** | **`SplashScreen` component + auth loading state in `App.tsx`** | H-012 | 1h |
| **S1.16** | **`GymLayout.tsx` stub (correct padding, dark bg — BottomTabBar slot empty)** | — | 30 min |
| **S1.17** | **`GymPage.tsx` placeholder (skeleton layout proving auth-to-route flow)** | — | 30 min |
| **S1.18** | **Configure Supabase Auth `Site URL` + `Redirect URLs` before any invite** | H-013 | 15 min |
| **S1.19** | Document JWT localStorage decision in `frontend-spec.md` | M-014 | 15 min |
| S1.20 | Write integration tests for auth-protected Gym endpoints | M-002 | 4h |
| S1.21 | Provision Supabase project + apply V7 migration (FK to `auth.users`) | — | 2h |

**Integration Test Spec (S1.20):**
```java
// Framework: @SpringBootTest + MockMvc + Testcontainers (PostgreSQL 16-alpine)
// JWT: Spring Security test support — .with(jwt().jwt(j -> j.subject("user-uuid")))

// Required test cases (minimum):
// T1: GET /api/gym/workouts with valid JWT → 200, returns only requesting user's workouts
// T2: GET /api/gym/workouts without JWT → 401
// T3: GET /api/gym/workouts with different user's JWT → 200, empty array (not 403)
// T4: POST /api/gym/workouts with valid JWT → 201, workout.userId == JWT sub
// T5: DELETE /api/gym/workouts/{other-user-workout-id} → 404 (user isolation, not 403)
// T6: GET /api/gym/supplements with valid JWT → 200, returns only user's supplement row
```

**Auth Session Flash Fix (S1.15):**
```tsx
// App.tsx — prevents login page flash on session restore
export default function App() {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <SplashScreen />   // ← dark bg + GYMHUB wordmark, prevents flash

  return (
    <Routes>
      <Route path="/login" element={!session ? <LoginPage /> : <Navigate to="/gym" />} />
      <Route path="/gym"   element={session  ? <GymPage />  : <Navigate to="/login" />} />
    </Routes>
  )
}
```

**Sprint 1 Exit Gate:**
```
□ GET /api/gym/workouts without Authorization header → 401
□ Application boots against Supabase PostgreSQL (not local Docker)
□ No login-page flash on reload for authenticated user
□ Two-account isolation test (procedure below) passes
□ Supabase Auth Site URL configured (email links work on mobile)
□ Vite dev server runs at localhost:5173, renders GymPage placeholder

Two-Account Isolation Test:
  1. Signup user-A (test-a@example.com), login, create workout "Treino A", add 2 exercises
  2. Signup user-B (test-b@example.com), login, create workout "Treino B", add 2 exercises
  3. As user-B: GET /api/gym/workouts → must NOT contain "Treino A"
  4. As user-B: DELETE /api/gym/workouts/{user-A-workout-id} → must return 404
  5. As user-A: GET /api/gym/workouts → must NOT contain "Treino B"
  Cleanup: Delete both test accounts from Supabase Auth dashboard
```

---

### Sprint 2 — Gym Hub MVP Parity

**Scope:** Extract CDN React → Vite; feature parity with `gym/index.html`

| # | Task | Issues | Effort |
|---|---|---|---|
| S2.1 | Copy JSX components → `.tsx` (ExerciseCard, WorkoutSelector, SupplementTracker, AddExerciseForm) — zero logic changes | H-005 | 4h |
| S2.2 | Replace `fetch()` → Supabase hooks (`useWorkouts`, `useExercises`, `useSupplements`) | — | 6h |
| S2.3 | Preserve optimistic update pattern in hook layer (`useState` → async sync → rollback on error) | — | 2h |
| S2.4 | Build `BottomTabBar` component + wire to React Router | — | 2h |
| S2.5 | Execute parity test checklist (41 items — Sections A–H; see `docs/reviews/ux-specialist-review.md`) | — | 3h |
| S2.6 | Bundle audit: `≤200KB` gzipped JS, `≤8KB` CSS, no CDN scripts in Network | H-005 | 1h |
| S2.7 | Delete `gym/index.html` after parity checklist 100% passes | — | — |
| S2.8 | `NUMERIC(10,2)` migration for `tb_fuel_records` monetary columns (column-parallel approach) | H-008 | 2h |
| S2.9 | `NOT NULL` constraints migration for required business fields | H-006 | 1h |
| S2.10 | Shared `set_updated_at()` function + triggers on all tables | H-007, M-011 | 2h |
| S2.11 | Spring Boot Actuator + `/actuator/health` + `/actuator/metrics` | M-005 | 1h |
| S2.12 | SLF4J structured logging in `GymService` + request ID MDC | M-004 | 2h |
| S2.13 | Fix `getAllExercises()` → `findByUserId(userId)` + pagination | M-006 | 1h |

> **S2.1 is a pure file copy — zero logic changes. S2.2 is the data layer swap. Never combine.**

**Sprint 2 Exit Gate:**
```
□ gym/index.html deleted
□ Parity checklist Sections A–G: all 41 items checked
□ Parity checklist Section H: H1–H5 checked (H6 target, not blocker)
□ Vite bundle: JS ≤200KB gzipped, CSS ≤8KB gzipped
□ @babel/standalone absent from Network requests
□ cdn.tailwindcss.com absent from Network requests
```

---

### Sprint 3 — Polish, Quality & Observability

| # | Task | Issues | Effort |
|---|---|---|---|
| S3.1 | Build `EmptyState`, `ConfirmDialog`, `Toast` components | — | 4h |
| S3.2 | Build `RPEBadge`, `ProgressIndicator` (`canIncreaseNext`) | — | 2h |
| S3.3 | Accessibility audit (contrast, touch targets, ARIA labels) | WCAG 2.1 AA | 3h |
| S3.4 | Fix all input `font-size` → `text-base` (16px) for iOS zoom prevention | M-015 | 1h |
| S3.5 | Add CHECK constraints: `rpe`, `fuel_type`, `task.type`, positive values | L-004/005, M-007/008 | 1h |
| S3.6 | Add API versioning (`/api/v1/`) | M-003 | 2h |
| S3.7 | Workout `position` field + ordering migration | L-002 | 1h |
| S3.8 | WorkoutSelector overflow gradient indicator | L-007 | 30 min |
| **S3.9** | **Sentry integration: Spring Boot (sentry-spring-boot-starter) + React (Sentry.init)** | L-008 | 2h |
| S3.10 | Evaluate `reps` normalization (`sets` + `reps_per_set INT`) | L-001 | Design session |
| S3.11 | `tb_gym_sessions` table + domain model (if workout history is Sprint 3 scope) | Future gap | 4h |

**Sprint 3 Exit Gate:**
```
□ WCAG 2.1 AA contrast ratios verified on all text/background pairs
□ All interactive targets ≥44px (exercise inputs ≥52px)
□ LCP < 2.5s on simulated 4G (Chrome DevTools Lighthouse)
□ Sentry receiving events from both Spring Boot and React
□ No iOS viewport zoom on input focus (test on Safari)
```

---

## 7. Open Questions

| # | Question | Owner | Blocking | Affects |
|---|---|---|---|---|
| OQ-01 | Deploy target for Vite frontend | Lucas | ✅ RESOLVED | **Vercel** — Supabase `site_url` = Vercel deploy URL, CORS allows Vercel domain |
| OQ-02 | Supabase project region | Lucas | ✅ RESOLVED | **sa-east-1 (São Paulo)** |
| OQ-03 | Auth providers | Lucas | ✅ RESOLVED | **Email + password only** — no OAuth for now |
| OQ-04 | Workout session history — track per date, or current template state only? | Lucas | No | Sprint 3 scope, `tb_gym_sessions` backlog |
| OQ-05 | PWA target — installable home screen app? | Lucas | No | `manifest.json`, service worker |
| OQ-06 | Fuel Hub + Productivity Hub — parallel migration or Gym-first? | Lucas | No | Epic scope boundary |
| OQ-07 | Target hosting for Spring Boot backend | Lucas | ✅ RESOLVED | **Railway** — CORS allows `*.railway.app` + Vercel domain |

> **OQ-01, OQ-02, OQ-03, OQ-07 resolved 2026-05-07 — Sprint 1 unblocked.**

---

## 8. Success Metrics

### Sprint 0
- [ ] Flyway history: V1–V6 applied, `success=true`
- [ ] App boots with `ddl-auto=validate` — no schema exceptions
- [ ] `user_id` column present on `tb_gym_workouts`, `tb_gym_exercises`, `tb_fuel_records`, `tb_routine_tasks`
- [ ] FK constraint `fk_exercises_workout` exists in `information_schema`
- [ ] `grep -r "lucas123" src/` → 0 results
- [ ] DB snapshot file exists pre-Sprint 0

### Sprint 1
- [ ] `GET /api/gym/workouts` without JWT → 401
- [ ] Two-account isolation test passes (5 assertions — documented above)
- [ ] No login-page flash on reload (SplashScreen active)
- [ ] Email verification link works on mobile (Supabase `site_url` configured)
- [ ] Integration test suite passes (`./mvnw test`)
- [ ] Vite dev server renders `GymPage` placeholder after login

### Sprint 2
- [ ] `gym/index.html` deleted
- [ ] Parity checklist 100% passed
- [ ] Initial JS bundle ≤ 200KB gzipped
- [ ] CSS ≤ 8KB gzipped
- [ ] No CDN scripts in Network

### Sprint 3
- [ ] Lighthouse Performance ≥ 80 (mobile simulation)
- [ ] LCP < 2.5s on 4G throttle
- [ ] WCAG 2.1 AA: 0 contrast failures
- [ ] Sentry captures first real error event from production

---

## 9. Appendix — Specialist Review Summary

### Phase 5: DB Specialist Review (Dara)
**Verdict:** APPROVED WITH CONDITIONS — 7 items  
Key finding: Spring Boot JDBC bypasses RLS (service role) — must enforce `user_id` at repository level.  
Corrections: two-stage singleton migrations, Flyway V1–V7 ordering, user_id indexes, anon deny policies, shared trigger function.

### Phase 6: UX Specialist Review (Uma)
**Verdict:** APPROVED WITH CONDITIONS — 5 items  
Key finding: Auth session flash (SplashScreen fix) + Supabase Auth redirectTo must be set before any user invite.  
Corrections: GymPage placeholder, GymLayout stub, iOS zoom fix, JWT trade-off documentation.

### Phase 7: QA Gate (Quinn)
**Verdict:** APPROVED — 9 conditions  
Key finding: git init must be first Sprint 0 task; Sprint 0 exit gate was Supabase-dependent (rewritten for local Docker); integration test spec required before Sprint 1.  
Additions: HikariCP sizing, migration rollback scripts, two-account isolation test procedure, Sentry monitoring.

---

*Technical Debt Assessment FINAL — Brownfield Discovery complete through Phase 8.*  
*Next: Phase 9 — @analyst Executive Awareness Report → Phase 10 — @pm Epic + Stories*
