# my-hubs — Database Security & Quality Audit

**Version:** 1.0 — Brownfield Discovery
**Author:** Dara (Data Engineer Agent)
**Date:** 2026-05-07
**Scope:** Full (RLS + Schema + Security Best Practices)
**Method:** Static analysis — JPA entity inspection (live DB not required for discovery)
**Database:** `erp_pessoal` @ `localhost:5432` (PostgreSQL 16, Docker Compose)

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-05-07 | 1.0 | Initial full security audit — Brownfield Discovery Phase 2 | Dara (@data-engineer) |

---

## Audit Summary

| Category | Total Issues | Critical | High | Medium | Low |
|----------|-------------|----------|------|--------|-----|
| RLS Coverage | 6 | **6** | 0 | 0 | 0 |
| Schema Design | 18 | **2** | 8 | 6 | 2 |
| Security Best Practices | 5 | **2** | 2 | 1 | 0 |
| **TOTAL** | **29** | **10** | **10** | **7** | **2** |

**Overall Risk Score: CRITICAL** — Project is not production-safe for multi-user deployment.

---

## Pass 1: RLS Coverage Audit

### Summary

```
=== RLS Coverage Audit (Static Analysis) ===

 tablename              | rls_status   | policies
────────────────────────┼──────────────┼──────────
 tb_fuel_records        | ❌ DISABLED  | null
 tb_gym_exercises       | ❌ DISABLED  | null
 tb_gym_supplements     | ❌ DISABLED  | null
 tb_gym_workouts        | ❌ DISABLED  | null
 tb_routine_tasks       | ❌ DISABLED  | null
 tb_workspace_notes     | ❌ DISABLED  | null

=== RLS Summary ===

 total_tables | rls_enabled | rls_disabled
──────────────┼─────────────┼──────────────
            6 |           0 |            6

=== Tables Without RLS (Security Risk) ===
 tb_fuel_records
 tb_gym_exercises
 tb_gym_supplements
 tb_gym_workouts
 tb_routine_tasks
 tb_workspace_notes
```

### Findings

| ID | Table | Severity | Finding |
|----|-------|----------|---------|
| RLS-001 | `tb_gym_workouts` | **CRITICAL** | RLS disabled — any authenticated user can read/write all workout splits |
| RLS-002 | `tb_gym_exercises` | **CRITICAL** | RLS disabled — full exercise history globally readable/writable |
| RLS-003 | `tb_gym_supplements` | **CRITICAL** | RLS disabled — global singleton, no user isolation |
| RLS-004 | `tb_fuel_records` | **CRITICAL** | RLS disabled — all fuel records globally exposed |
| RLS-005 | `tb_routine_tasks` | **CRITICAL** | RLS disabled — all task lists globally exposed |
| RLS-006 | `tb_workspace_notes` | **CRITICAL** | RLS disabled — global singleton note, no user isolation |

### RLS Remediation SQL (Supabase — post-migration)

> **Prerequisite:** `user_id UUID NOT NULL` must be added to all tables before RLS can be applied. RLS policies referencing `auth.uid()` require Supabase Auth to be active.

```sql
-- Enable RLS on all gym tables
ALTER TABLE tb_gym_workouts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE tb_gym_exercises    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tb_gym_supplements  ENABLE ROW LEVEL SECURITY;
ALTER TABLE tb_fuel_records     ENABLE ROW LEVEL SECURITY;
ALTER TABLE tb_routine_tasks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tb_workspace_notes  ENABLE ROW LEVEL SECURITY;

-- KISS Policies: users access only their own rows
-- tb_gym_workouts
CREATE POLICY "Users manage own workouts"
    ON tb_gym_workouts FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- tb_gym_exercises
CREATE POLICY "Users manage own exercises"
    ON tb_gym_exercises FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- tb_gym_supplements (redesigned with user_id PK)
CREATE POLICY "Users manage own supplement goals"
    ON tb_gym_supplements FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- tb_fuel_records
CREATE POLICY "Users manage own fuel records"
    ON tb_fuel_records FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- tb_routine_tasks
CREATE POLICY "Users manage own tasks"
    ON tb_routine_tasks FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- tb_workspace_notes (redesigned with user_id PK)
CREATE POLICY "Users manage own notes"
    ON tb_workspace_notes FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
```

**Validation queries:**
```sql
-- Test: authenticated user should only see their rows
SET LOCAL request.jwt.claims = '{"sub": "user-uuid-here"}';
SELECT * FROM tb_gym_workouts; -- Should return only this user's workouts

-- Test: unauthenticated request should return 0 rows
RESET request.jwt.claims;
SELECT * FROM tb_gym_workouts; -- Should return 0 rows
```

---

## Pass 2: Schema Design Quality Audit

### 2.1 Primary Keys

```
=== Tables Without Primary Keys ===
(0 rows) ✓ — All tables have primary keys
```

All 6 tables have PKs. However, two use `INTEGER` with hardcoded value `1`:
- `tb_gym_supplements.id = 1` — singleton anti-pattern
- `tb_workspace_notes.id = 1` — singleton anti-pattern

### 2.2 Missing NOT NULL on Required Fields

```
=== Missing NOT NULL on Critical Columns ===

 table_name           | column_name       | data_type | issue
──────────────────────┼───────────────────┼───────────┼──────────────────────────────────
 tb_gym_exercises     | workout_id        | uuid      | FK-like column should be NOT NULL
 tb_gym_exercises     | name              | varchar   | Required business field
 tb_gym_exercises     | weight            | float8    | Required business field
 tb_gym_exercises     | reps              | varchar   | Required business field
 tb_gym_workouts      | name              | varchar   | Required business field
 tb_fuel_records      | total_value       | float8    | Required business field
 tb_fuel_records      | price_per_liter   | float8    | Required business field
 tb_fuel_records      | fuel_type         | varchar   | Required business field
 tb_routine_tasks     | title             | varchar   | Required business field
 tb_routine_tasks     | time              | varchar   | Required business field
```

### 2.3 Missing Foreign Key Constraints

```
=== Missing FK Constraints ===

 table_name       | column_name | target_table      | severity
──────────────────┼─────────────┼───────────────────┼──────────
 tb_gym_exercises | workout_id  | tb_gym_workouts   | HIGH
```

The `workout_id` column in `tb_gym_exercises` has **no database-level FK constraint**. Orphaned exercise rows are only prevented by application-level logic in `GymController.deleteWorkout()` — a fragile approach that will fail silently on direct DB access, bulk operations, or future refactors.

**Remediation:**
```sql
-- Add proper FK constraint (requires workout_id to be NOT NULL first)
ALTER TABLE tb_gym_exercises
    ALTER COLUMN workout_id SET NOT NULL;

ALTER TABLE tb_gym_exercises
    ADD CONSTRAINT fk_exercises_workout
    FOREIGN KEY (workout_id)
    REFERENCES tb_gym_workouts(id)
    ON DELETE CASCADE;  -- Replaces manual cascade in GymController
```

### 2.4 Missing Audit Timestamps

```
=== Missing Audit Timestamps ===

 tablename              | created_at  | updated_at
────────────────────────┼─────────────┼────────────
 tb_gym_workouts        | ❌ MISSING  | ❌ MISSING
 tb_gym_exercises       | ❌ MISSING  | ❌ MISSING
 tb_gym_supplements     | ❌ MISSING  | ❌ MISSING
 tb_fuel_records        | ❌ MISSING  | ❌ MISSING  (has domain 'date' but not audit timestamps)
 tb_routine_tasks       | ❌ MISSING  | ❌ MISSING
 tb_workspace_notes     | ❌ MISSING  | ❌ MISSING

6/6 tables missing both created_at and updated_at.
```

No table in the schema tracks when records were created or last modified. This blocks:
- Sync strategies (pagination by `updated_at`)
- Audit trails
- Soft-delete patterns (`deleted_at`)
- Cache invalidation

**Remediation template:**
```sql
ALTER TABLE tb_gym_workouts
    ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_gym_workouts_updated_at
    BEFORE UPDATE ON tb_gym_workouts
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Repeat for all tables
```

### 2.5 Missing Indexes on Foreign Keys

```
=== Missing Indexes on FK Columns ===

 table_name       | column_name | suggested_index
──────────────────┼─────────────┼───────────────────────────────────────────────────
 tb_gym_exercises | workout_id  | CREATE INDEX idx_gym_exercises_workout_id
                               |     ON tb_gym_exercises(workout_id);
```

No index on `workout_id` means every `SELECT * FROM tb_gym_exercises WHERE workout_id = ?` performs a **sequential scan**. At scale (users with hundreds of exercises), this degrades linearly.

**Remediation:**
```sql
CREATE INDEX idx_gym_exercises_workout_id ON tb_gym_exercises(workout_id);
```

### 2.6 Additional Schema Issues

| ID | Table | Column | Severity | Issue | Recommendation |
|----|-------|--------|----------|-------|----------------|
| SCH-001 | `tb_gym_supplements` | `id` | **CRITICAL** | Singleton `id=1` — incompatible with multi-tenancy | Replace PK with `user_id UUID` |
| SCH-002 | `tb_workspace_notes` | `id` | **CRITICAL** | Singleton `id=1` — incompatible with multi-tenancy | Replace PK with `user_id UUID` |
| SCH-003 | `tb_fuel_records` | `total_value`, `price_per_liter` | HIGH | `FLOAT8` for monetary values — floating point precision errors | Use `NUMERIC(10,2)` |
| SCH-004 | `tb_gym_exercises` | `reps` | HIGH | `VARCHAR` for "3x10" — not normalized, blocks progression analytics | Consider `sets INT, reps_per_set INT` or JSON |
| SCH-005 | `tb_routine_tasks` | `time` | MEDIUM | `VARCHAR` storing "HH:MM" — not `TIME` type | Use `TIME` type or `VARCHAR` with CHECK constraint |
| SCH-006 | `tb_routine_tasks` | `type` | MEDIUM | Unconstrained `VARCHAR` — any string accepted | Add `CHECK (type IN ('health', 'study', 'work', 'other'))` or use DB ENUM |
| SCH-007 | `tb_fuel_records` | `fuel_type` | MEDIUM | Unconstrained `VARCHAR` — any string accepted | Add `CHECK (fuel_type IN ('gasoline', 'ethanol', 'diesel', 'flex'))` |
| SCH-008 | All tables | — | MEDIUM | `VARCHAR(255)` default length for all text — no domain-aware sizing | Review column lengths per business domain |
| SCH-009 | `tb_gym_exercises` | `rpe` | LOW | No `CHECK (rpe BETWEEN 1 AND 10)` — invalid values accepted | Add CHECK constraint |
| SCH-010 | `tb_fuel_records` | `total_value`, `liters` | LOW | No `CHECK (total_value > 0)`, `CHECK (liters > 0)` | Add positive value constraints |

---

## Pass 3: Security Best Practices

### 3.1 Sensitive Column Exposure

```
=== PII / Sensitive Columns ===
(0 rows) ✓ — No password, token, secret, SSN, credit, or api_key columns detected.
```

No sensitive data columns found in current schema. However, the **absence of a `user_id` column** means there is no user data at all — once authentication is added, PII risk assessment must be repeated.

### 3.2 Credential Exposure

| ID | Location | Severity | Finding |
|----|----------|----------|---------|
| SEC-001 | `src/main/resources/application.properties` | **CRITICAL** | Database password `lucas123` hardcoded in version-controlled file |
| SEC-002 | `docker-compose.yml` | **CRITICAL** | Same credentials hardcoded in Docker Compose file |

**Remediation:**
```properties
# application.properties — replace hardcoded values with environment variable references
spring.datasource.url=${DB_URL:jdbc:postgresql://localhost:5432/erp_pessoal}
spring.datasource.username=${DB_USERNAME:postgres}
spring.datasource.password=${DB_PASSWORD}
```

```bash
# .env (gitignored) or OS environment
DB_URL=jdbc:postgresql://localhost:5432/erp_pessoal
DB_USERNAME=postgres
DB_PASSWORD=lucas123

# Add to .gitignore
echo ".env" >> .gitignore
```

### 3.3 Schema Management Risk

| ID | Location | Severity | Finding |
|----|----------|----------|---------|
| SEC-003 | `application.properties` | HIGH | `ddl-auto=update` — Hibernate silently alters production schema on deploy |
| SEC-004 | All modules | HIGH | No migration versioning (Flyway/Liquibase) — schema history is unauditable |

**Risk:** Adding `user_id UUID NOT NULL` to an entity with `ddl-auto=update` will attempt `ALTER TABLE ADD COLUMN user_id NOT NULL` on next boot. With existing rows, PostgreSQL will reject this unless a DEFAULT is provided — causing a **boot failure in production**.

**Remediation:**
```properties
# Step 1: Switch to validate immediately
spring.jpa.hibernate.ddl-auto=validate

# Step 2: Add Flyway
```

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
</dependency>
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-database-postgresql</artifactId>
</dependency>
```

```
src/main/resources/
└── db/
    └── migration/
        ├── V1__initial_schema.sql       ← current schema as baseline
        ├── V2__add_audit_timestamps.sql ← add created_at/updated_at
        └── V3__add_user_id_gym.sql      ← multi-tenancy migration
```

### 3.4 CORS Configuration

| ID | Location | Severity | Finding |
|----|----------|----------|---------|
| SEC-005 | `FuelController.java` | MEDIUM | `@CrossOrigin(origins = "*")` — allows any origin on fuel endpoints, inconsistent with other modules |

Other modules rely on `application.properties` CORS config (`localhost:5173`, `127.0.0.1:5500`). `FuelController` overrides this with a wildcard at the controller level.

**Remediation:**
```java
// Remove @CrossOrigin from FuelController
// Configure globally in a WebMvcConfigurer bean

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins(
                "http://localhost:5173",
                "http://127.0.0.1:5500",
                "${APP_FRONTEND_URL}"  // production domain via env var
            )
            .allowedMethods("GET", "POST", "PUT", "DELETE")
            .allowCredentials(true);
    }
}
```

---

## Multi-Tenancy Gap Analysis

This section is specific to the Gym Hub → Production SaaS transition.

### Current State vs Required State

| Dimension | Current State | Required for Production |
|-----------|--------------|------------------------|
| User identity | None — no `user_id` anywhere | `user_id UUID NOT NULL REFERENCES auth.users(id)` on all Gym tables |
| Data isolation | Zero — all data globally shared | RLS policies: `auth.uid() = user_id` |
| Singleton records | `SupplementGoal` (id=1), `WorkspaceNote` (id=1) | Redesign: `user_id` as PK |
| Authentication | None | Supabase Auth → JWT → Spring Security filter |
| Session tracking | Not modeled | No `WorkoutSession` entity — exercise state is static (no session concept) |

### Missing Domain Concept: Workout Session

The current model tracks **workout templates** (named splits with exercises and weights) but has **no session/history concept**. A user cannot look at past performance, track progression over time, or compare sessions.

For the Gym Hub to be production-valuable for real users, a `WorkoutSession` entity is likely needed:

```sql
-- Proposed future table (not in current scope — document for planning)
CREATE TABLE tb_gym_sessions (
    id          UUID        NOT NULL DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL,
    workout_id  UUID        NOT NULL,
    performed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT pk_gym_sessions PRIMARY KEY (id),
    CONSTRAINT fk_sessions_user    FOREIGN KEY (user_id)    REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_sessions_workout FOREIGN KEY (workout_id) REFERENCES tb_gym_workouts(id) ON DELETE RESTRICT
);

CREATE INDEX idx_gym_sessions_user_id ON tb_gym_sessions(user_id);
CREATE INDEX idx_gym_sessions_workout_id ON tb_gym_sessions(workout_id);
CREATE INDEX idx_gym_sessions_performed_at ON tb_gym_sessions(performed_at DESC);
```

---

## Prioritized Remediation Backlog

### Immediate (before onboarding any second user)

| Priority | ID | Action | Effort |
|----------|----|--------|--------|
| P0 | SEC-001/002 | Externalize DB credentials to env vars | 30 min |
| P0 | SEC-003 | Switch `ddl-auto=update` → `validate` | 15 min |
| P0 | SCH-001 | Redesign `tb_gym_supplements` — replace `id=1` with `user_id UUID PK` | 2h |
| P0 | SCH-002 | Redesign `tb_workspace_notes` — replace `id=1` with `user_id UUID PK` | 1h |
| P0 | RLS-001–006 | Add `user_id` to all Gym tables + enable RLS | 4h |

### Sprint 1 (Structural hardening)

| Priority | ID | Action | Effort |
|----------|----|--------|--------|
| P1 | SCH-003 | Change `FLOAT8` → `NUMERIC(10,2)` for monetary columns | 1h + migration |
| P1 | FK-001 | Add FK constraint + `NOT NULL` + index on `tb_gym_exercises.workout_id` | 1h |
| P1 | SEC-003/004 | Introduce Flyway, write V1 baseline migration | 3h |
| P1 | SCH timestamp | Add `created_at`, `updated_at` + triggers to all tables | 2h |
| P1 | NOT NULL | Add `NOT NULL` constraints to required fields | 1h |

### Sprint 2 (Quality & analytics)

| Priority | ID | Action | Effort |
|----------|----|--------|--------|
| P2 | SCH-004 | Normalize `reps` column (evaluate `sets`/`reps_per_set` vs JSON) | Design session |
| P2 | SCH-005–007 | Add `CHECK` constraints for `time`, `type`, `fuel_type` | 1h |
| P2 | SEC-005 | Centralize CORS configuration | 30 min |
| P2 | SCH-009/010 | Add value-range `CHECK` constraints | 30 min |

---

## Supabase Migration Readiness Checklist

Before provisioning a Supabase project and migrating:

- [ ] Credentials externalized to `.env` (SEC-001/002)
- [ ] `ddl-auto` switched to `validate` (SEC-003)
- [ ] Flyway installed and V1 baseline migration written (SEC-004)
- [ ] `user_id` columns added to all Gym entities + JPA annotations updated
- [ ] `SupplementGoal` redesigned (remove `id=1`)
- [ ] `GymService` extracted from `GymController` (architecture prerequisite)
- [ ] DTO layer added (decouple API from JPA entities)
- [ ] Spring Security dependency added to `pom.xml`
- [ ] `JwtAuthFilter` written to extract `sub` claim from Supabase JWT
- [ ] All Gym API endpoints require `Authorization: Bearer <token>`
- [ ] RLS policies drafted and reviewed (see Pass 1 above)
- [ ] Integration tests written for auth-protected endpoints

---

*Audit generated as part of Brownfield Discovery Phase 2.*
*Next: @ux-design-expert for frontend spec (Phase 3) → @architect for consolidation (Phase 4)*
