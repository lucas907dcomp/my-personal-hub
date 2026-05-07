# My-Hubs — Technical Debt Assessment (DRAFT)

**Version:** 0.1 DRAFT — Pending Specialist Review  
**Author:** Aria (Architect Agent) — Phase 4 Consolidation  
**Date:** 2026-05-07  
**Audience:** Senior / Tech Lead  
**Status:** DRAFT — Awaiting DB Review (Phase 5), UX Review (Phase 6), QA Gate (Phase 7)

**Source Documents:**
- Phase 1: `docs/architecture/system-architecture.md` (Aria)
- Phase 2: `docs/database/SCHEMA.md` + `DB-AUDIT.md` (Dara)
- Phase 3: `docs/frontend/frontend-spec.md` (Uma)

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-05-07 | 0.1 | Initial consolidation — Brownfield Discovery Phase 4 | Aria (@architect) |

---

## 1. Executive Summary

**My-Hubs** is a personal ERP monolith at a strategic inflection point. What began as a single-user local utility is becoming a **multi-tenant production SaaS** — with the Gym Hub module as the first externally-deployed product for real users (friends of the developer).

**The core finding is stark: this system cannot safely onboard a second user today.**

All three discovery agents independently arrived at the same root cause: **the entire data model assumes a single global user**. There is no identity, no isolation, no authentication, and no authorization — at any layer (database, backend, or frontend).

This document consolidates 44 discrete technical debt items across architecture, database, and frontend — organized into a prioritized remediation roadmap across 4 sprints.

### Discovery Scorecard

| Domain | Issues | CRITICAL | HIGH | MEDIUM | LOW |
|---|---|---|---|---|---|
| Architecture / Backend | 20 | 4 | 6 | 7 | 3 |
| Database | 14 | 4 | 6 | 4 | 2 |  
| Frontend | 6 | 2 | 2 | 2 | 0 |
| **TOTAL (deduplicated)** | **34** | **7** | **10** | **11** | **5** |

> Note: Raw findings across all agents totaled 55 items; 21 were deduplicated (same issue reported from multiple perspectives — e.g., missing `user_id` appears in architecture, DB audit, and frontend spec).

### The Single Blocker

Before any other work has value, one thing must be true: **each user must own their own data**. Until that is true, deploying to multiple users means:

- User A can read, modify, and delete User B's workouts
- The supplement tracker shows a global row shared by all users
- Deleting a workout deletes it for everyone

This is not a performance issue or a technical debt item to schedule. **It is a launch prerequisite.**

---

## 2. Strategic Context

### 2.1 Project Classification

| Dimension | Current State | Target State |
|---|---|---|
| Users | 1 (developer) | 2–10 (friends + developer) |
| Deployment | Local (Docker) | Cloud (Supabase + hosting TBD) |
| Authentication | None | Supabase Auth (email + password) |
| Data isolation | Global singleton | Per-user (RLS-enforced) |
| Frontend toolchain | CDN SPA (React 18 / Babel) | Vite 5 + React 18 (proper build) |
| Schema management | `ddl-auto=update` (implicit) | Flyway migrations (explicit, versioned) |
| Test coverage | ~0% (smoke test only) | Integration tests for auth-critical paths |

### 2.2 Architectural Choice: Supabase (Confirmed)

**Decision recorded (ADR-003):** Supabase over Firebase.

All three discovery agents corroborate this decision:

- **Aria (Architecture):** Supabase preserves Spring Boot + JPA investment; Firebase would require full ORM replacement
- **Dara (Database):** PostgreSQL RLS is the most reliable multi-tenancy enforcement available; moves security to the DB layer where it cannot be bypassed by application bugs
- **Uma (Frontend):** `@supabase/supabase-js` integrates with the existing React fetch pattern; Supabase Auth produces standard JWTs; no Firebase SDK lock-in

**No other cloud choice is architecturally viable without a significantly larger scope.**

### 2.3 Frontend Migration Scope (Confirmed)

**Decision recorded (ADR-004):** Extraction, not redesign.

`gym/index.html` is already a React 18 SPA. The SaaS Premium visual language (glass morphism, gym-gradient, Inter font) is established and proven. The migration is:

1. Copy existing JSX components into a Vite project
2. Replace `fetch()` calls with Supabase hooks
3. Add 2 new screens (Login, Signup)
4. Validate parity → delete `gym/index.html`

This is **not** a redesign project. Attempting to redesign while migrating doubles scope and risk.

---

## 3. Consolidated Technical Debt Registry

> Items are deduplicated across all three source documents. Cross-references are provided for traceability.  
> Severity: **CRITICAL** = launch blocker | **HIGH** = sprint 1 prerequisite | **MEDIUM** = sprint 2 | **LOW** = sprint 3+

### 3.1 CRITICAL — Launch Blockers (Must resolve before multi-user deploy)

| ID | Layer | Title | Source | Impact |
|---|---|---|---|---|
| **C-001** | DB / Backend / Frontend | No `user_id` on any entity — zero multi-tenant data isolation | TD-001, RLS-001–006 | All users share all data |
| **C-002** | DB | Singleton pattern `id=1` (`SupplementGoal`, `WorkspaceNote`) | TD-002, SCH-001, SCH-002 | Second user `INSERT` fails with duplicate key |
| **C-003** | Backend | No authentication layer — zero identity enforcement | TD-004 | Any HTTP client can access/modify any data |
| **C-004** | Backend / DB | Hardcoded credentials in `application.properties` and `docker-compose.yml` | TD-003, SEC-001, SEC-002 | Password visible in source code, blocks cloud deploy |
| **C-005** | DB | `ddl-auto=update` with no migration management | TD-008, SEC-003 | Adding `user_id NOT NULL` will fail boot with existing rows |
| **C-006** | Frontend | Auth screens missing (Login, Signup) | FE-001 | No entry point for multi-user auth flow |
| **C-007** | DB | RLS disabled on all 6 tables | RLS-001–006 | DB-level data isolation absent even after `user_id` added |

**Detail: C-001 — Multi-Tenancy Gap**

This is the root cause behind C-001, C-003, C-006, and C-007. The full blast radius:

```
Without user_id:
  GET /api/gym/workouts      → returns ALL users' workouts
  GET /api/gym/exercises     → returns ALL users' exercises
  GET /api/gym/supplements   → returns global singleton
  GET /api/fuel/records      → returns ALL users' fuel records
  GET /api/productivity/tasks → returns ALL users' tasks
  GET /api/productivity/note  → returns global singleton

With user_id + RLS (target):
  All queries above → automatically filtered by auth.uid()
  Application code adds zero extra WHERE clauses
  Security is enforced at the database level (cannot be bypassed)
```

**Detail: C-005 — Migration Risk**

```
DANGER SEQUENCE with ddl-auto=update:
  1. Developer adds userId UUID NOT NULL to Workout.java
  2. Application boots against a DB with existing rows
  3. Hibernate executes: ALTER TABLE tb_gym_workouts ADD COLUMN user_id UUID NOT NULL
  4. PostgreSQL rejects: ERROR: column "user_id" contains null values
  5. Application fails to start in production
  
SAFE SEQUENCE (with Flyway):
  1. Developer writes V3__add_user_id.sql with DEFAULT for backfill
  2. Flyway applies migration before Hibernate validates schema
  3. Boot succeeds
  4. ddl-auto=validate confirms schema matches entities
```

---

### 3.2 HIGH — Sprint 1 Prerequisites

| ID | Layer | Title | Source | Impact |
|---|---|---|---|---|
| **H-001** | Backend | No Service layer — repositories injected directly into controllers | TD-005 | Untestable, no transactional boundary, business logic in HTTP layer |
| **H-002** | Backend | No DTO layer — JPA entities exposed directly in API responses | TD-007 | Persistence model coupled to API contract; breaks on entity changes |
| **H-003** | DB | `Exercise.workoutId` — logical FK only, no DB constraint, no index | TD-006, FK-001 | Orphaned exercises on direct DB ops; sequential scan on every exercise load |
| **H-004** | Backend | No input validation despite `spring-boot-starter-validation` present | TD-009 | Invalid/null data reaches the persistence layer |
| **H-005** | Frontend | React 18 + Tailwind via CDN — ~4MB initial load, runtime JSX transpilation | TD-010, FE-002 | Unacceptable performance on mobile (gym environment), no code splitting |
| **H-006** | DB | Missing `NOT NULL` on required business fields (10 columns across 4 tables) | DB-AUDIT Pass 2.2 | Corrupt data can be silently persisted |
| **H-007** | DB | No audit timestamps (`created_at`, `updated_at`) on any table | DB-AUDIT Pass 2.4 | No sync strategy, no audit trail, no cache invalidation basis |
| **H-008** | DB | `FLOAT8` for monetary values (`total_value`, `price_per_liter`) | SCH-003 | Floating-point precision errors in financial calculations |
| **H-009** | Backend | CORS wildcard `@CrossOrigin(origins = "*")` on `FuelController` | TD-014, SEC-005 | Inconsistent security posture; overrides global CORS config |
| **H-010** | DB | No schema migration versioning (Flyway/Supabase CLI) | SEC-004 | Schema history unauditable; no rollback capability |

**Detail: H-001 / H-002 — Layer Violations**

```
Current (VIOLATION):
  HTTP Request
      ↓
  GymController                        ← Business logic HERE
      ├─ workoutRepository.findAll()   ← Direct repo call
      ├─ exerciseRepository.deleteByWorkoutId(id)  ← Cascade in HTTP layer
      └─ supplementRepository.findById(1).orElse(new SupplementGoal())

Required (TARGET):
  HTTP Request
      ↓
  GymController    ← HTTP only: deserialize, validate, serialize
      ↓
  GymService       ← Business logic, transactions, cascade
      ↓
  WorkoutRepository / ExerciseRepository / SupplementRepository
```

The consequence for multi-tenancy: `@AuthenticationPrincipal` can only be cleanly injected at the controller level, then passed to the service. Without a service layer, the `userId` propagation chain breaks.

---

### 3.3 MEDIUM — Sprint 2

| ID | Layer | Title | Source |
|---|---|---|---|
| **M-001** | Backend | No error handling — `orElseThrow()` returns `500` with stack trace | TD-011 |
| **M-002** | Backend | Zero test coverage (contextLoads only) | TD-012 |
| **M-003** | Backend | No API versioning (`/api/gym` not `/api/v1/gym`) | TD-013 |
| **M-004** | Backend | No logging strategy (no SLF4J usage) | TD-015 |
| **M-005** | Backend | No Spring Boot Actuator | TD-016 |
| **M-006** | Backend | `getAllExercises()` returns unbounded global result set | TD-017 |
| **M-007** | DB | `time` column stored as `VARCHAR("HH:MM")` — not `TIME` type | SCH-005 |
| **M-008** | DB | `type` (tasks) and `fuel_type` (fuel) unconstrained `VARCHAR` | SCH-006, SCH-007 |
| **M-009** | DB | Generic `VARCHAR(255)` — no domain-aware column sizing | SCH-008 |
| **M-010** | Frontend | No `prefers-reduced-motion` support | FE-003 |
| **M-011** | Frontend | Inter font via Google CDN — no `font-display: swap` fallback | FE-004 |

---

### 3.4 LOW — Sprint 3+

| ID | Layer | Title | Source |
|---|---|---|---|
| **L-001** | Backend | `Exercise.reps` as `String` ("3x10") — not normalized | TD-018, SCH-004 |
| **L-002** | Backend | No workout ordering field — `findAll()` order is insertion-dependent | TD-019 |
| **L-003** | Backend | No production deployment configuration | TD-020 |
| **L-004** | DB | RPE value has no `CHECK (rpe BETWEEN 1 AND 10)` constraint | SCH-009 |
| **L-005** | DB | No positive value `CHECK` constraints on fuel/exercise numeric fields | SCH-010 |

---

### 3.5 Future Domain Gap (Not in Current Scope — Document for Planning)

**Missing: Workout Session / History Model**

All three discovery agents noted this independently. The current model tracks **workout templates** (named splits with exercise configurations), but has **no concept of a training session**. A user cannot:

- View performance history (what weight did I lift last Tuesday?)
- Track progression (has my bench press increased over the last 4 weeks?)
- Compare sessions (rest interval, total volume per session)

This is not a bug — it is a **missing domain concept**. The proposed entity:

```sql
tb_gym_sessions (
    id           UUID PK,
    user_id      UUID NOT NULL → auth.users,
    workout_id   UUID NOT NULL → tb_gym_workouts,
    performed_at TIMESTAMPTZ,
    notes        TEXT,
    created_at   TIMESTAMPTZ
)
```

This domain gap limits the long-term value of the Gym Hub for users who expect a fitness tracker, not just a workout template editor. Recommend including in Epic planning (Phase 10).

---

## 4. Risk Matrix

| Risk | Probability | Impact | Severity | Mitigation |
|---|---|---|---|---|
| Data leak at multi-user launch | **HIGH** — structural issue | **CRITICAL** | 🔴 | C-001 through C-007 must be resolved before launch |
| Boot failure when adding `user_id NOT NULL` | **HIGH** — `ddl-auto=update` active | **HIGH** | 🔴 | Resolve C-005 (Flyway) before any schema change |
| Credential exposure from source code | **MEDIUM** — codebase not yet public | **HIGH** | 🟠 | Resolve C-004 immediately, rotate password |
| Singleton PK conflict at second user onboarding | **CERTAIN** — guaranteed by schema | **CRITICAL** | 🔴 | Resolve C-002 before any user invite |
| Frontend ~4MB load fails on 3G | **HIGH** — CDN React is unoptimized | **MEDIUM** | 🟠 | Resolve H-005 in Sprint 1 alongside auth |
| Orphaned exercise data on workout delete | **MEDIUM** — manual cascade is fragile | **MEDIUM** | 🟡 | Resolve H-003 when adding FK constraint |
| API breaks on entity refactor (no DTOs) | **MEDIUM** — refactoring is planned | **HIGH** | 🟠 | Resolve H-002 before Sprint 2 API changes |
| Application has no observability in production | **CERTAIN** — no logging/actuator | **MEDIUM** | 🟡 | Resolve M-004/M-005 in Sprint 2 |

---

## 5. Architecture Decision Records

### ADR-001: Logical FK for Exercise.workoutId (Existing — Superseded)

**Status:** Superseded  
**Decision:** Plain UUID field instead of `@ManyToOne` JPA relationship  
**Original rationale:** Simplicity for single-user MVP  
**Superseded by:** H-003 remediation — migrate to `@ManyToOne(fetch = LAZY)` with `@JoinColumn` and DB-level `ON DELETE CASCADE`

---

### ADR-002: Singleton Pattern for SupplementGoal and WorkspaceNote (Existing — Superseded)

**Status:** Superseded  
**Decision:** Hardcoded `id=1` PK  
**Original rationale:** Single-user MVP, eliminates upsert complexity  
**Superseded by:** C-002 remediation — replace with `user_id UUID` as primary key

---

### ADR-003: Supabase over Firebase (New — Confirmed)

**Status:** Confirmed  
**Context:** Cloud persistence migration required for multi-tenancy; two candidates evaluated  
**Decision:** Supabase (PostgreSQL + Supabase Auth + RLS)  
**Rationale:**
- Spring Boot + JPA connects natively to Supabase via standard PostgreSQL JDBC URL — zero ORM redesign
- RLS provides DB-level multi-tenancy: security cannot be bypassed by application bugs
- Supabase Auth issues standard JWTs compatible with Spring Security's resource server configuration
- PostgreSQL relational model maps perfectly to existing Workout → Exercise hierarchy
- Open source — no vendor lock-in, self-hostable option

**Firebase rejected because:** Firestore is NoSQL — would require replacing the entire Spring Data JPA layer, or moving all business logic to the React frontend (contradicts the stated principle of strict backend layer decoupling)

**Trade-offs accepted:**
- PgBouncer required on Supabase free tier (connection limit management)
- RLS policies add complexity — must be explicitly tested
- Additional backend code: Spring Security JWT filter for Supabase JWT validation

---

### ADR-004: Frontend Migration Strategy — Extraction, Not Redesign (New — Confirmed)

**Status:** Confirmed  
**Context:** `gym/index.html` is a React 18 SPA (CDN). Migration to Vite needed for production performance.  
**Decision:** 7-step zero-regression extraction path — convert files, then replace data layer  
**Rationale:**
- Design language (glass morphism, gym-gradient, Inter) is proven and should be preserved
- SaaS Premium aesthetic is already established — no redesign work needed
- Existing JSX component structure maps directly to Atomic Design hierarchy
- Optimistic update pattern (`handleLocalChange` + `onBlur`) is correct and should be preserved

**Constraint:** Steps must not be combined. Step 2 (JSX → .tsx conversion) is a pure file copy with zero logic changes. Step 3 (fetch → Supabase hooks) is the data layer swap. Never do both simultaneously.

---

### ADR-005: No External Component Library (New — Confirmed)

**Status:** Confirmed  
**Context:** Custom glass morphism aesthetic; considered shadcn/radix as component base  
**Decision:** Custom token layer over Tailwind — no external component library  
**Rationale:** The gym-gradient + glass morphism aesthetic would require overriding nearly every visual default in shadcn/radix, producing more override code than building from Tailwind utilities directly. The custom token approach is lower total cost.

---

## 6. Implementation Roadmap

### Sprint 0 — Security & Schema Foundations (1 week, ~16h)

**Gate: Must complete 100% before inviting any user.**

| # | Task | Component | Issues | Effort |
|---|---|---|---|---|
| S0.1 | Externalize DB credentials to `.env` + update `.gitignore` | Backend | C-004 | 30 min |
| S0.2 | Switch `ddl-auto=update` → `validate` | Backend | C-005 | 15 min |
| S0.3 | Add Flyway + write V1 baseline migration | Backend | H-010, C-005 | 3h |
| S0.4 | Add `user_id UUID NOT NULL` + `created_at` + `updated_at` to all Gym tables (migration V2) | DB | C-001, H-007 | 2h |
| S0.5 | Redesign `SupplementGoal` — remove `id=1`, add `user_id UUID PK` (migration V3) | DB | C-002 | 2h |
| S0.6 | Redesign `WorkspaceNote` — remove `id=1`, add `user_id UUID PK` (migration V4) | DB | C-002 | 1h |
| S0.7 | Add FK constraint + `NOT NULL` + index on `tb_gym_exercises.workout_id` (migration V5) | DB | H-003 | 1h |
| S0.8 | Enable RLS on all 6 tables + write `auth.uid() = user_id` policies | DB | C-007 | 3h |
| S0.9 | `git init` + establish branch strategy (main/develop/feature) | Dev ops | — | 30 min |
| S0.10 | Centralize CORS config — remove `@CrossOrigin(*)` from `FuelController` | Backend | H-009 | 30 min |

**Sprint 0 exit gate:** `SELECT COUNT(*) FROM tb_gym_workouts` returns 0 rows for unauthenticated Supabase client. ✓

---

### Sprint 1 — Authentication + Structural Refactor (2 weeks, ~40h)

**Scope:** Backend service layer + JWT auth + Vite scaffold + Auth screens

| # | Task | Component | Issues | Effort |
|---|---|---|---|---|
| S1.1 | Extract `GymService` from `GymController` | Backend | H-001 | 4h |
| S1.2 | Add DTO layer for Gym API (`WorkoutDTO`, `ExerciseDTO`, `SupplementDTO`) | Backend | H-002 | 3h |
| S1.3 | Migrate `Exercise.workoutId` → `@ManyToOne(fetch=LAZY)` with `@JoinColumn` | Backend | H-003 | 2h |
| S1.4 | Add `@Valid` + constraint annotations to all controllers | Backend | H-004 | 2h |
| S1.5 | Add `@ControllerAdvice` global exception handler (`ProblemDetail` RFC 9457) | Backend | M-001 | 3h |
| S1.6 | Add `spring-boot-starter-security` + `spring-security-oauth2-resource-server` to `pom.xml` | Backend | C-003 | 30 min |
| S1.7 | Write `JwtAuthFilter` — extracts `sub` claim from Supabase JWT as `userId` | Backend | C-003 | 4h |
| S1.8 | Write `SecurityConfig` — protect `/api/**` endpoints | Backend | C-003 | 2h |
| S1.9 | Update all Gym repository queries to scope by `userId` | Backend | C-001 | 2h |
| S1.10 | Scaffold Vite 5 project (`npm create vite@latest gym-hub -- --template react`) | Frontend | H-005 | 1h |
| S1.11 | Configure Tailwind + design tokens in `tailwind.config.js` | Frontend | H-005 | 2h |
| S1.12 | Integrate `@supabase/supabase-js` — `supabaseClient.ts` singleton | Frontend | C-006 | 1h |
| S1.13 | Build `LoginPage` + `SignupPage` (AuthForm organism) | Frontend | C-006 | 4h |
| S1.14 | Add React Router + protected route wrapper (auth guard) | Frontend | C-006 | 2h |
| S1.15 | Write integration tests for auth-protected Gym endpoints | Backend | M-002 | 4h |

**Sprint 1 exit gate:** User A cannot see User B's workouts. Auth flow (signup → login → gym page) works end-to-end. ✓

---

### Sprint 2 — Gym Hub MVP Parity (2 weeks, ~32h)

**Scope:** Extract CDN React → Vite; feature parity with `gym/index.html`

| # | Task | Component | Issues | Effort |
|---|---|---|---|---|
| S2.1 | Copy JSX components → `.tsx` (ExerciseCard, WorkoutSelector, SupplementTracker, AddExerciseForm) | Frontend | — | 4h |
| S2.2 | Replace `fetch()` → Supabase hooks (`useWorkouts`, `useExercises`, `useSupplements`) | Frontend | — | 6h |
| S2.3 | Preserve optimistic update pattern in hook layer | Frontend | — | 2h |
| S2.4 | Build `BottomTabBar` component | Frontend | — | 2h |
| S2.5 | Validate feature parity against `gym/index.html` (manual QA checklist) | Frontend | — | 3h |
| S2.6 | Bundle audit — verify `≤200KB` gzipped initial payload | Frontend | H-005 | 1h |
| S2.7 | Delete `gym/index.html` after parity confirmed | Frontend | — | — |
| S2.8 | Add `NUMERIC(10,2)` migration for monetary columns in `tb_fuel_records` | DB | H-008 | 2h |
| S2.9 | Add `NOT NULL` constraints migration for all required business fields | DB | H-006 | 1h |
| S2.10 | Add audit timestamps + `set_updated_at()` trigger to all tables | DB | H-007 | 2h |
| S2.11 | Add Spring Boot Actuator + configure health/metrics endpoints | Backend | M-005 | 1h |
| S2.12 | Add SLF4J structured logging to `GymService` | Backend | M-004 | 2h |
| S2.13 | Fix `getAllExercises()` — scope to authenticated user, paginate | Backend | M-006 | 1h |

**Sprint 2 exit gate:** Gym Hub runs from Vite build. `gym/index.html` deleted. Performance budget verified. ✓

---

### Sprint 3 — Polish & Quality (1 week, ~16h)

| # | Task | Component | Issues | Effort |
|---|---|---|---|---|
| S3.1 | Build `EmptyState`, `ConfirmDialog`, `Toast`/`Snackbar` components | Frontend | — | 4h |
| S3.2 | Build `RPEBadge`, `ProgressIndicator` (`canIncreaseNext`) components | Frontend | — | 2h |
| S3.3 | Accessibility audit (contrast, touch targets, ARIA labels) | Frontend | WCAG 2.1 AA | 3h |
| S3.4 | Add `CHECK` constraints: `rpe`, `fuel_type`, `task.type`, positive values | DB | L-004, L-005, M-007, M-008 | 1h |
| S3.5 | Add API versioning (`/api/v1/`) | Backend | M-003 | 2h |
| S3.6 | Write workout ordering migration + `position` field | DB | L-002 | 1h |
| S3.7 | Evaluate `reps` normalization (`sets + reps_per_set INT`) | Backend/DB | L-001 | Design session |

---

## 7. Open Questions (Requiring Owner Decision)

| # | Question | Owner | Blocking | Affects |
|---|---|---|---|---|
| OQ-01 | Deploy target for Vite frontend — Spring Boot static or separate host (Vercel/Netlify)? | Lucas | Yes | CORS config, Supabase `site_url`, Sprint 1 planning |
| OQ-02 | Supabase project region — `sa-east-1` (São Paulo) for BR user base? | Lucas | Yes | Latency SLA, Supabase provisioning |
| OQ-03 | Auth strategy — email+password only, or add Google OAuth? | Lucas | Yes | Login screen scope, Supabase Auth provider config |
| OQ-04 | Workout session history — track sessions per date, or current template state only? | Lucas | No | Domain model, `tb_gym_sessions` backlog item |
| OQ-05 | PWA target — installable home screen app? | Lucas | No | `manifest.json`, service worker, Sprint 3 scope |
| OQ-06 | Fuel Hub + Productivity Hub — parallel migration with Gym, or Gym-first? | Lucas | No | Epic scope boundary |
| OQ-07 | Target hosting for Spring Boot backend? | Lucas | Yes | Spring 1 deployment planning |

---

## 8. Success Metrics

### Sprint 0 Completion Criteria
- [ ] `SELECT * FROM tb_gym_workouts` returns 0 rows for unauthenticated Supabase client
- [ ] No passwords in any version-controlled file
- [ ] `mvn spring-boot:run` boots with `ddl-auto=validate` (not update)
- [ ] Flyway migration history table exists with V1–V5 applied

### Sprint 1 Completion Criteria
- [ ] Two users can sign up and their workout data is 100% isolated
- [ ] `GET /api/gym/workouts` returns `401` without `Authorization: Bearer` header
- [ ] Login → Gym page flow completes in under 3 seconds on 4G
- [ ] Integration test suite covers auth-critical endpoints

### Sprint 2 Completion Criteria
- [ ] `gym/index.html` deleted from repository
- [ ] Vite build produces `≤200KB` gzipped initial payload
- [ ] All 5 existing interactions work identically in Vite build vs CDN version
- [ ] Bundle visualizer confirms no Tailwind CSS > 8KB gzipped

### Sprint 3 Completion Criteria
- [ ] WCAG 2.1 AA contrast ratios verified on all text/background combinations
- [ ] All interactive targets ≥44×44px touch surface
- [ ] LCP < 2.5s on simulated 4G mobile (Chrome DevTools)

---

## 9. Validation Notes for Specialist Reviews

### For @data-engineer (Phase 5 — DB Specialist Review)

Priority validation points:
1. Confirm RLS remediation SQL in `DB-AUDIT.md` is production-ready for Supabase
2. Validate the `SupplementGoal` singleton redesign migration SQL — does it correctly migrate existing row to the first user's `user_id`?
3. Review `WorkoutSession` domain gap — is this a Sprint 0 blocker or can it land in Sprint 3?
4. Confirm `NUMERIC(10,2)` migration for `tb_fuel_records` is safe with existing float data
5. Validate Flyway migration ordering (V1–V5) is correct and reversible

### For @ux-design-expert (Phase 6 — UX Specialist Review)

Priority validation points:
1. Confirm Sprint 1 / Sprint 2 split for frontend work — does auth landing before parity make sense for UX continuity?
2. Validate touch target sizes (52px for exercise inputs) — is this consistent with the glass card height constraints?
3. Review the 7-step CDN → Vite migration path for UX regression risk — what is the test checklist for parity validation?
4. Confirm `BottomTabBar` is correctly positioned in Sprint 2 (not Sprint 1) — the Gym page is accessible without it initially

### For @qa (Phase 7 — QA Gate)

Priority validation points:
1. Is the Sprint 0 exit gate (`unauthenticated client returns 0 rows`) testable with Supabase local dev?
2. Are integration test requirements for Sprint 1 achievable in the sprint scope, or should test scope be reduced to happy-path only?
3. Review the `ddl-auto=update → validate` transition — is there a risk of false schema validation failures on first boot?
4. Validate that the Vite parity checklist (Sprint 2 S2.5) covers all user-facing interactions from `gym/index.html`

---

*DRAFT generated as part of Brownfield Discovery Phase 4 — Initial Consolidation.*  
*Pending: Phase 5 (DB Review), Phase 6 (UX Review), Phase 7 (QA Gate) before finalization.*
