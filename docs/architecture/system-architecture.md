# My-Hubs — Brownfield System Architecture Document

**Version:** 1.0 — Initial Discovery
**Author:** Aria (Architect Agent)
**Date:** 2026-05-07
**Audience:** Senior/Tech Lead
**Scope:** Comprehensive current-state analysis with focus on Gym Hub + Cloud Migration readiness

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-05-07 | 1.0 | Initial brownfield discovery — Brownfield Discovery Workflow Phase 1 | Aria (@architect) |

---

## 1. Executive Summary

**My-Hubs** is a personal ERP monolith (Fuel, Productivity, Gym modules) currently executing a **strategic inflection**: transitioning from a single-user local application into a **multi-tenant, production-grade SaaS** — with **Gym Hub** as the first externally-deployed product.

The immediate architectural challenge is the **multi-tenancy gap**: the entire data model is single-tenant by design, with no user identity, no data isolation, and no authentication layer. Every module assumes a single global user.

**Key architectural finding:** The Gym Hub frontend is not "plain HTML" — it is a **React 18 SPA** (CDN-transpiled JSX + Tailwind CDN) embedded inside Spring Boot static resources. The React migration is 50% done; what remains is extracting it into a proper build toolchain (Vite + npm).

---

## 2. Current System Architecture

### 2.1 Architecture Style

```
┌─────────────────────────────────────────────────────────────┐
│                     Spring Boot Monolith                     │
│                  (Single JVM Process)                        │
│                                                              │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │  Fuel    │  │ Productivity │  │     Gym Hub  ◄──── │──── Priority
│  │  Module  │  │   Module     │  │     Module         │    │
│  └──────────┘  └──────────────┘  └────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           Spring Data JPA (Hibernate ORM)           │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │     WebController (Static File Router — Forwarding) │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────────────────────────┬──────────────────────────────┘
                               │ JDBC
                               ▼
              ┌─────────────────────────┐
              │  PostgreSQL 16          │
              │  (Docker Compose local) │
              │  Database: erp_pessoal  │
              └─────────────────────────┘
```

### 2.2 Tech Stack (Verified)

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Language | Java | 25 | Preview features not used |
| Framework | Spring Boot | 3.5.13 | Web + Data JPA + Validation |
| Build | Maven | (wrapper) | `mvnw` / `mvnw.cmd` |
| ORM | Hibernate via Spring Data JPA | (Spring Boot managed) | `ddl-auto=update` ⚠️ |
| DB | PostgreSQL | 16-alpine (Docker) | Local only |
| DB Driver | `org.postgresql` | (Boot managed) | |
| Boilerplate | Lombok | (Boot managed) | `@Data`, `@RequiredArgsConstructor` |
| Frontend (Gym) | React | 18 (CDN UMD) | No build step, Babel transpilation in-browser |
| Styling (Gym) | Tailwind CSS | CDN | No purge/optimization |
| Font | Inter | Google Fonts | |
| Validation | `spring-boot-starter-validation` | (imported) | Not used in any controller |
| Testing | JUnit 5 + Spring Boot Test | (Boot managed) | Zero coverage |

### 2.3 Repository Structure (Actual)

```
my-hubs/
├── pom.xml                                    # Maven POM — Spring Boot 3.5.13, Java 25
├── docker-compose.yml                         # PostgreSQL 16 (local dev only)
├── mvnw / mvnw.cmd                            # Maven wrapper
├── src/
│   ├── main/
│   │   ├── java/com/lucas/erp/
│   │   │   ├── MyHubsApplication.java         # Entry point — @SpringBootApplication
│   │   │   ├── WebController.java             # Static file router (forward:/module/index.html)
│   │   │   ├── fuel/
│   │   │   │   ├── FuelRecord.java            # Entity — tb_fuel_records
│   │   │   │   ├── FuelController.java        # REST — /api/fuel (has @CrossOrigin(*) ⚠️)
│   │   │   │   └── FuelRepository.java        # JpaRepository<FuelRecord, UUID>
│   │   │   ├── productivity/
│   │   │   │   ├── RoutineTask.java           # Entity — tb_routine_tasks
│   │   │   │   ├── WorkspaceNote.java         # Entity — tb_workspace_notes (singleton id=1) ⚠️
│   │   │   │   ├── ProductivityController.java # REST — /api/productivity
│   │   │   │   ├── TaskRepository.java        # Custom: findAllByOrderByTimeAsc
│   │   │   │   └── NoteRepository.java        # JpaRepository<WorkspaceNote, Integer>
│   │   │   └── gym/
│   │   │       ├── Workout.java               # Entity — tb_gym_workouts (no userId) ⚠️
│   │   │       ├── Exercise.java              # Entity — tb_gym_exercises (logical FK) ⚠️
│   │   │       ├── SupplementGoal.java        # Entity — tb_gym_supplements (singleton) ⚠️
│   │   │       ├── GymController.java         # REST — /api/gym (no service layer) ⚠️
│   │   │       ├── WorkoutRepository.java     # JpaRepository<Workout, UUID>
│   │   │       ├── ExerciseRepository.java    # Custom: findByWorkoutId, deleteByWorkoutId
│   │   │       └── SupplementRepository.java  # JpaRepository<SupplementGoal, Integer>
│   │   └── resources/
│   │       ├── application.properties         # DB config (hardcoded creds) ⚠️
│   │       └── static/
│   │           ├── fuel/index.html            # Vanilla HTML
│   │           ├── productivity/index.html    # Vanilla HTML
│   │           └── gym/index.html             # React 18 SPA (CDN) — already React! ✅
│   └── test/
│       └── java/com/lucas/my_hubs/
│           └── MyHubsApplicationTests.java    # contextLoads() only ⚠️
└── docs/
    └── architecture/
        └── system-architecture.md            # This document
```

---

## 3. Module Analysis

### 3.1 Gym Module — Primary Focus

#### 3.1.1 Domain Model

```
Workout                    Exercise
─────────────────          ─────────────────────────────────
id: UUID (PK)              id: UUID (PK)
name: String               workoutId: UUID   ← logical FK (plain field, not @ManyToOne)
                           name: String
                           weight: Double
                           reps: String      ← flexible format: "3x10", "12", etc.
                           rpe: Integer      ← Rate of Perceived Exertion (1-10)
                           canIncreaseNext: Boolean

SupplementGoal             (Singleton — id=1, globally shared)
─────────────────────────
id: Integer = 1  ← hardcoded singleton
whey: Boolean
creatina: Boolean
```

**Critical design issues for multi-tenancy:**
- No `userId` field on any entity
- `SupplementGoal` with `id=1` is a global singleton — architecturally incompatible with multi-user
- `workoutId` on `Exercise` is a plain UUID field instead of `@ManyToOne(fetch = LAZY)` — this bypasses JPA relationship management and relies on manual cascade in the controller

#### 3.1.2 API Surface

| Method | Path | Description | Issues |
|--------|------|-------------|--------|
| `GET` | `/api/gym/workouts` | List all workouts | Returns ALL workouts (no user filter) |
| `POST` | `/api/gym/workouts` | Create workout | No validation, entity exposed directly |
| `DELETE` | `/api/gym/workouts/{id}` | Delete workout + exercises | Manual cascade via `@Transactional` |
| `GET` | `/api/gym/exercises` | List ALL exercises | Returns exercises for ALL users/workouts |
| `POST` | `/api/gym/exercises` | Create exercise | No validation |
| `PUT` | `/api/gym/exercises/{id}` | Update exercise | Partial update done manually (no PATCH) |
| `DELETE` | `/api/gym/exercises/{id}` | Delete exercise | |
| `GET` | `/api/gym/supplements` | Get supplement goals | Returns global singleton |
| `PUT` | `/api/gym/supplements` | Update supplement goals | Overwrites global singleton |

#### 3.1.3 Frontend Architecture (Gym Hub)

**Important discovery:** `gym/index.html` is a full React 18 SPA with Tailwind, already exhibiting SaaS Premium UI patterns:
- Glass morphism effects (`backdrop-filter: blur`)
- Inter font, tight tracking, uppercase labels
- Optimistic update pattern (local state → blur → background save)
- Custom SVG icon system
- Responsive with `max-w-md / lg:max-w-3xl`

**Current CDN setup (dev-mode equivalent):**
```html
<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>  <!-- Runtime JSX transpilation -->
<script src="https://cdn.tailwindcss.com"></script>
```

**Architectural consequence:** This is functionally a dev-mode setup deployed to production. `@babel/standalone` transpiles JSX at runtime in the browser — significant performance penalty on initial load. Tailwind CDN delivers the full 3MB stylesheet, not a purged subset.

**What works well:**
- Optimistic update pattern (handleLocalChange + onBlur → saveExerciseToDb) is correctly implemented
- Modular state (workouts, exercises, supplements are independent)
- Progressive UI (shows empty states, single workout guard)

**What needs migration to proper build toolchain:**
- Move to Vite + React + Tailwind (PostCSS) for production builds
- Extract `fetch` calls to a service/API layer (currently inline)
- Add error boundaries and loading states
- Add auth context provider

#### 3.1.4 Layer Architecture Violations

The Gym module violates the golden rule of strict layer decoupling:

```
Current (VIOLATION):
Controller ──────────────────────► Repository
GymController injects WorkoutRepository, ExerciseRepository, SupplementRepository directly

Required (TARGET):
Controller ──► Service ──► Repository
GymController ──► GymService ──► WorkoutRepository
                            └──► ExerciseRepository
                            └──► SupplementRepository
```

Business logic currently in controller:
- Manual cascade delete: `exerciseRepository.deleteByWorkoutId(id)` called from controller
- Partial update logic: null-check fields manually in controller
- Singleton upsert: `supplementRepository.findById(1).orElse(new SupplementGoal())` in controller

### 3.2 Fuel Module

**Status:** Stable, not priority.

**Key entity:** `FuelRecord` — fuel fill-up tracker with `totalValue`, `pricePerLiter`, `liters`, `odometer`, `fuelType`, `date`.

**Business logic:** Liters calculated server-side from `totalValue / pricePerLiter` (correct — backend owns this rule).

**Issue:** `@CrossOrigin(origins = "*")` hardcoded on the controller — different CORS strategy from other modules.

### 3.3 Productivity Module

**Status:** Stable, not priority.

**Key entities:**
- `RoutineTask` — daily routine items with `title`, `time`, `done`, `type`
- `WorkspaceNote` — singleton scratchpad (`id=1` hardcoded)

**Pattern issues:**
- Same singleton anti-pattern as `SupplementGoal` — incompatible with multi-tenancy
- `toggleTask` fetches by ID and inverts `done` — simple and correct for single-user

---

## 4. Technical Debt Inventory

### 4.1 CRITICAL — Blocks Multi-Tenant Migration

| ID | Location | Description | Impact |
|----|----------|-------------|--------|
| TD-001 | All entities | No `userId` field anywhere — zero multi-tenant data isolation | Blocks production launch with multiple users |
| TD-002 | `SupplementGoal`, `WorkspaceNote` | Singleton pattern (`id=1`) — architecturally incompatible with multi-tenancy | Full redesign required |
| TD-003 | `application.properties` | Hardcoded DB credentials (`lucas123`) | Security risk, blocks cloud deploy |
| TD-004 | All modules | No authentication or authorization layer | Anyone can access/modify any data |

### 4.2 HIGH — Structural/Architectural

| ID | Location | Description | Impact |
|----|----------|-------------|--------|
| TD-005 | `GymController`, `FuelController`, `ProductivityController` | Repositories injected directly into controllers — no Service layer | Violates layering rule, untestable, no transactional boundary control |
| TD-006 | `Exercise.workoutId` | Plain UUID field instead of `@ManyToOne` JPA relationship | Manual cascade, no referential integrity at ORM level |
| TD-007 | All controllers | Entities exposed directly in API (no DTOs) | Tight coupling between persistence model and API contract |
| TD-008 | `application.properties` | `spring.jpa.hibernate.ddl-auto=update` | Dangerous for production — schema changes are implicit and unversioned |
| TD-009 | All controllers | No `@Valid` / `@NotNull` validation despite `spring-boot-starter-validation` being imported | Invalid data reaches persistence layer |
| TD-010 | `gym/index.html` | React via CDN + Babel Standalone (runtime JSX transpilation) | ~3MB Tailwind, runtime transpilation cost, no code splitting, no tree-shaking |

### 4.3 MEDIUM — Maintainability/Operations

| ID | Location | Description | Impact |
|----|----------|-------------|--------|
| TD-011 | `GymController` | No error handling — `orElseThrow()` returns `500` with stack trace | Poor API contracts, no structured error responses |
| TD-012 | All modules | Zero test coverage (only smoke test) | No regression safety net for refactoring |
| TD-013 | All modules | No API versioning (`/api/gym` not `/api/v1/gym`) | Breaking changes will break clients silently |
| TD-014 | `FuelController` | `@CrossOrigin(origins = "*")` inconsistent with other modules | Unpredictable CORS behavior, security risk |
| TD-015 | All modules | No logging strategy (no SLF4J/Logback usage in any class) | No observability in production |
| TD-016 | All modules | No Spring Boot Actuator | No health/metrics endpoint |
| TD-017 | `GymController` | `getAllExercises()` returns all exercises without filter | O(n) payload grows unbounded as users add exercises |

### 4.4 LOW — Future Quality

| ID | Location | Description | Impact |
|----|----------|-------------|--------|
| TD-018 | `Exercise.reps` | String type for reps (e.g., "3x10") — not normalized | Makes analytics/progression tracking difficult |
| TD-019 | `Workout` | No ordering field — `findAll()` returns in insertion order (non-deterministic) | UI sort instability |
| TD-020 | Docker Compose | No production deployment configuration | Cannot deploy to cloud without additional work |

---

## 5. Integration Points & External Dependencies

### 5.1 Current

| Integration | Type | Details |
|-------------|------|---------|
| PostgreSQL 16 | JDBC/JPA | `jdbc:postgresql://localhost:5432/erp_pessoal` — local Docker only |
| Google Fonts (Inter) | CDN | `fonts.googleapis.com` — loaded in gym/index.html |
| React 18 UMD | CDN | `unpkg.com` — runtime JSX via Babel standalone |
| Tailwind CSS | CDN | `cdn.tailwindcss.com` — full unoptimized stylesheet |

### 5.2 Planned (Cloud Migration)

| Integration | Candidate | Purpose |
|-------------|-----------|---------|
| Cloud DB + Auth | Supabase OR Firebase | Persistence, authentication, multi-tenancy |
| Hosting | TBD | Spring Boot backend deployment |

---

## 6. Enhancement Impact Analysis — Cloud Persistence Migration

**Objective:** Migrate Gym Hub persistence to cloud (Supabase/Postgres OR Firebase) to support:
1. User authentication (login)
2. Multi-tenant data isolation (each user sees only their data)
3. Individual workout session tracking

### 6.1 Architecture Decision: Supabase vs Firebase

This is the most consequential decision in the roadmap.

#### Supabase (PostgreSQL + PostgREST + Supabase Auth)

**Pros:**
- Keeps PostgreSQL — zero schema migration risk, JPA entities reusable
- Spring Boot + JDBC/JPA connects natively to Supabase via standard PostgreSQL URL
- Row Level Security (RLS) provides DB-level multi-tenancy enforcement
- Supabase Auth generates standard JWTs compatible with Spring Security
- Open source, self-hostable (no vendor lock-in)
- Relational model fits current Workout → Exercise relationship perfectly

**Cons:**
- RLS adds complexity to queries — must configure policies per table
- Supabase free tier has connection limits (use PgBouncer)
- Slightly more backend code (Spring Security JWT filter)

**Migration path:** Additive — add `userId` columns, configure RLS, add Spring Security JWT filter. No schema redesign.

#### Firebase (Firestore + Firebase Auth)

**Pros:**
- Firebase Auth is battle-tested, excellent mobile/React SDKs
- Realtime updates out-of-the-box (useful for future features)
- Generous free tier (Spark plan)

**Cons:**
- **Firestore is NoSQL** — current JPA entities cannot map to it. Requires full ORM replacement.
- Spring Boot + Firestore = Firebase Admin SDK (no JPA, no Hibernate) — major backend refactoring
- Alternatively: move all persistence to frontend (React + Firestore SDK) — bypasses backend entirely, but loses validation and business logic layer
- More expensive at scale (Firestore charges per read/write)
- Vendor lock-in (no self-hosting)

**Migration path:** Disruptive — requires replacing the entire persistence layer.

#### Recommendation (Architectural)

**Supabase is the architecturally sound choice** for this project:
- Preserves Spring Boot + JPA investment
- RLS provides production-grade multi-tenancy with a single JWT user context
- No ORM redesign required
- SQL migrations via Supabase CLI (`supabase migration`) solves TD-008

The only scenario where Firebase wins is if the strategic direction is to eventually **move all logic to the frontend** (React + Firebase SDK, backend becomes thin), but the stated architectural principle of strict layer decoupling contradicts that.

### 6.2 Files Requiring Modification (Supabase Path)

**Backend — breaking changes required:**

| File | Change | Type |
|------|--------|------|
| `Workout.java` | Add `userId: UUID` field, add index | Schema breaking |
| `Exercise.java` | Add `userId: UUID` field, change `workoutId` to `@ManyToOne` | Schema breaking |
| `SupplementGoal.java` | Replace singleton (`id=1`) with `userId: UUID` primary key | Full redesign |
| `GymController.java` | Extract to `GymService`, add `@AuthenticationPrincipal` user context | Structural refactor |
| `WorkoutRepository.java` | Add `findByUserId(UUID userId)` queries | Additive |
| `ExerciseRepository.java` | Add userId-scoped queries | Additive |
| `SupplementRepository.java` | Change PK type from Integer to UUID | Breaking |
| `application.properties` | Replace hardcoded creds with env vars, point to Supabase URL | Config change |
| `pom.xml` | Add `spring-boot-starter-security`, JWT library (e.g., `jjwt` or `spring-security-oauth2-resource-server`) | New dependencies |

**New files required:**

| File | Purpose |
|------|---------|
| `src/main/java/com/lucas/erp/gym/GymService.java` | Service layer (extract from controller) |
| `src/main/java/com/lucas/erp/security/SecurityConfig.java` | Spring Security configuration |
| `src/main/java/com/lucas/erp/security/JwtAuthFilter.java` | JWT extraction from `Authorization: Bearer` header |
| `src/main/java/com/lucas/erp/gym/dto/WorkoutDTO.java` | API contract (decouple entity from response) |
| `src/main/java/com/lucas/erp/gym/dto/ExerciseDTO.java` | API contract |
| `src/main/resources/db/migration/` | Flyway or Supabase CLI migration files |

**Frontend (gym/index.html → React app):**

| Change | Details |
|--------|---------|
| Extract to Vite project | `npm create vite@latest gym-hub -- --template react` |
| Add `@supabase/supabase-js` | Auth SDK + realtime |
| Add Auth context | Login/logout flow, JWT storage (httpOnly cookie or memory) |
| Update `fetch` calls | Add `Authorization: Bearer {token}` header |
| Add loading/error states | Currently missing — required for production UX |

### 6.3 New Architecture Post-Migration (Target)

```
┌─────────────────────────────────────────────────────────┐
│                    React SPA (Vite)                      │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Supabase Auth SDK (client-side login flow)     │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │  API Client (fetch + JWT header injection)      │    │
│  └─────────────────────────────────────────────────┘    │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS + JWT Bearer
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Spring Boot API                            │
│  ┌──────────────────────────────────────────────┐       │
│  │  Spring Security (JWT Filter)                │       │
│  │  Extracts userId from JWT sub claim          │       │
│  └──────────────────────────────────────────────┘       │
│  ┌──────────────────────────────────────────────┐       │
│  │  GymController → GymService → Repositories  │       │
│  │  All queries scoped by userId                │       │
│  └──────────────────────────────────────────────┘       │
└────────────────────┬────────────────────────────────────┘
                     │ JDBC/SSL
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Supabase PostgreSQL                        │
│  ┌──────────────────────────────────────────────┐       │
│  │  Row Level Security (RLS) Policies           │       │
│  │  auth.uid() = userId on all gym tables       │       │
│  └──────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

---

## 7. Non-Functional Requirements Assessment (Current State)

| NFR | Current State | Gap |
|-----|--------------|-----|
| **Multi-tenancy** | Not implemented | Full implementation required |
| **Authentication** | None | Spring Security + JWT required |
| **Authorization** | None | RLS + @PreAuthorize required |
| **Scalability** | Single instance, no connection pooling config | HikariCP tuning + PgBouncer for Supabase |
| **Observability** | None | Spring Boot Actuator + structured logging |
| **Schema versioning** | `ddl-auto=update` | Flyway/Liquibase or Supabase CLI migrations |
| **Input validation** | None despite `starter-validation` imported | `@Valid` + constraint annotations |
| **Error handling** | None — stack traces to client | `@ControllerAdvice` + `ProblemDetail` (RFC 9457) |
| **API contract** | Entities exposed directly | DTO layer required |
| **Testing** | Smoke test only | Unit + integration test suite |
| **Security (credentials)** | Hardcoded in properties file | Environment variables + Secrets Manager |
| **CORS** | Inconsistent (`*` on Fuel, config on others) | Centralized `CorsConfigurationSource` bean |

---

## 8. Development & Operations

### 8.1 Local Development

```bash
# Prerequisites
# - Java 25 JDK
# - Docker Desktop
# - Maven (or use mvnw)

# Start database
docker-compose up -d

# Run application
./mvnw spring-boot:run
# or: ./mvnw.cmd spring-boot:run (Windows)

# Access modules
# http://localhost:8080/gym
# http://localhost:8080/fuel
# http://localhost:8080/productivity
```

### 8.2 Known Gotchas & Constraints

1. **`ddl-auto=update` is running in production context:** Any entity field change silently alters the schema. Adding `userId` to `Workout` will `ALTER TABLE` automatically on next boot — safe in dev, dangerous with real user data.

2. **Singleton entities block user creation:** `SupplementGoal` with `id=1` means `INSERT` will fail with a duplicate key if a second user attempts to initialize their supplements. Must be redesigned as `userId`-keyed before onboarding any second user.

3. **`Exercise.workoutId` is not enforced by the DB:** Because it's a plain UUID column (not a proper FK), deleting a `Workout` without calling `deleteByWorkoutId` first leaves orphaned `Exercise` rows. This is currently handled in `GymController.deleteWorkout()` via manual `@Transactional` — fragile.

4. **React CDN in gym/index.html loads ~4MB on first paint:** `@babel/standalone` (1.2MB gzipped) + Tailwind CDN (~3MB) + React UMD. On mobile connections this is significant. Vite build produces <200KB for equivalent functionality.

5. **CORS config in `application.properties` only allows `localhost:5173` and `127.0.0.1:5500`:** The React app at `/gym` makes API calls to `/api/gym/*` — same-origin, no CORS needed. However, if the frontend is extracted to a separate deployment (Vercel/Netlify), this config must be updated to include the production domain.

6. **No git repository initialized:** `git init` required before any branch-based development workflow can begin.

### 8.3 Running Tests

```bash
./mvnw test
# Currently runs only: contextLoads() — verifies Spring context boots
```

---

## 9. Architectural Decisions Record (ADR)

### ADR-001: Logical FK vs JPA Relationship for Exercise.workoutId

**Status:** Existing decision (undocumented)
**Context:** `Exercise.workoutId` is a `UUID` field, not a `@ManyToOne` JPA relationship.
**Decision:** Logical FK used to keep front-end pattern simple.
**Consequence:** Manual cascade delete in controller; no `@OneToMany(cascade = ALL)` on `Workout`; no Hibernate lazy loading.
**Recommendation:** Migrate to proper `@ManyToOne(fetch = LAZY)` with `@JoinColumn` in the Service layer extraction story. This enables proper cascade and repository-level queries.

### ADR-002: Singleton Pattern for SupplementGoal and WorkspaceNote

**Status:** Existing decision (undocumented) — must be superseded
**Context:** Single-user MVP — only one user exists, so `id=1` is sufficient.
**Decision:** Fixed primary key eliminates upsert complexity.
**Consequence:** Architecturally incompatible with multi-tenancy. Must be redesigned before any second user is onboarded.
**Recommendation:** Replace with `userId: UUID` as primary key. Migration: `INSERT INTO tb_gym_supplements (user_id, whey, creatina) SELECT '{existing_user_uuid}', whey, creatina FROM tb_gym_supplements WHERE id = 1`.

---

## 10. Recommended Action Sequence

Based on this analysis, the recommended sequence to safely evolve to production:

**Sprint 0 (Pre-requisites):**
1. `git init` + establish branch strategy (main/develop/feature)
2. Switch `ddl-auto` to `validate` (or `none`) + introduce Flyway
3. Externalize credentials to environment variables

**Sprint 1 (Structural Refactor — Gym Module):**
4. Extract `GymService` from `GymController` (TD-005)
5. Add DTO layer for Gym API (TD-007)
6. Fix `Exercise.workoutId` → `@ManyToOne` (TD-006)
7. Add `@Valid` + constraint annotations (TD-009)
8. Add `@ControllerAdvice` global exception handler (TD-011)

**Sprint 2 (Cloud Migration — Gym Hub):**
9. Provision Supabase project (DB + Auth)
10. Add `userId` to all Gym entities + migration script
11. Redesign `SupplementGoal` (replace singleton)
12. Configure Spring Security + JWT filter for Supabase JWTs
13. Write integration tests for auth-protected endpoints

**Sprint 3 (Frontend Migration — Gym Hub):**
14. Extract `gym/index.html` to Vite + React project
15. Integrate `@supabase/supabase-js` Auth
16. Add auth context, login/signup screens
17. Update API client to inject JWT headers

---

*This document reflects the system state as of 2026-05-07. Generated as part of Brownfield Discovery Phase 1.*
*Next: @data-engineer for schema audit (Phase 2) → @ux-design-expert for frontend spec (Phase 3)*
