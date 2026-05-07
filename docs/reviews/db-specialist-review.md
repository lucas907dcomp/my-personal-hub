# DB Specialist Review — Brownfield Discovery Phase 5

**Version:** 1.0  
**Author:** Dara (Data Engineer Agent)  
**Date:** 2026-05-07  
**Reviewer:** @data-engineer  
**Documents Reviewed:**
- `docs/database/SCHEMA.md` (Phase 2 — Dara)
- `docs/database/DB-AUDIT.md` (Phase 2 — Dara)
- `docs/prd/technical-debt-DRAFT.md` (Phase 4 — Aria)

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-05-07 | 1.0 | DB specialist review — Brownfield Discovery Phase 5 | Dara (@data-engineer) |

---

## Overall Verdict

**APPROVED WITH CONDITIONS**

The consolidated PRD (`technical-debt-DRAFT.md`) is architecturally sound. The sprint sequence, issue prioritization, and Supabase decision are all correct. However, 4 specific items require correction before implementation begins — one of which is a **CRITICAL architectural gap** that, if missed, would cause the RLS security model to silently fail in production.

---

## Validation Responses — Aria's 5 Questions

### Q1: Is RLS remediation SQL in DB-AUDIT.md production-ready for Supabase?

**Status: NEEDS CORRECTION — Critical gap found**

The SQL in `DB-AUDIT.md` is syntactically correct but has a **critical operational gap**: it assumes the Supabase client-side SDK sets the JWT auth context. Spring Boot connects via JDBC — not the Supabase SDK. This means `auth.uid()` in RLS policies **returns NULL for all Spring Boot queries**.

**The gap:**

```sql
-- This policy assumes auth.uid() is populated by request JWT context
CREATE POLICY "Users manage own workouts"
    ON tb_gym_workouts FOR ALL
    USING (auth.uid() = user_id)         -- auth.uid() = NULL for JDBC connections
    WITH CHECK (auth.uid() = user_id);   -- BLOCKS all writes from Spring Boot
```

When Spring Boot connects to Supabase PostgreSQL via JDBC (using the `DATABASE_URL` connection string), it authenticates as the Postgres `postgres` role — not as a JWT-authenticated Supabase user. `auth.uid()` returns NULL, causing:
- **USING clause returning false** → all reads return 0 rows (silently, no error)
- **WITH CHECK failing** → all writes rejected with `NEW ROW VIOLATES ROW LEVEL SECURITY`

**Correct pattern for Spring Boot + Supabase:**

There are two valid approaches. I recommend **Option A** for this project:

**Option A: Service Role bypasses RLS — App enforces `user_id` at query level (Recommended)**

```sql
-- Spring Boot connects with service_role key → bypasses RLS
-- RLS remains as defense-in-depth for direct PostgREST/Supabase client access
-- Spring Boot enforces user_id isolation in repository queries

-- Supabase connection string for Spring Boot (application.properties):
-- spring.datasource.url=jdbc:postgresql://db.[project-ref].supabase.co:5432/postgres
-- spring.datasource.username=postgres
-- spring.datasource.password=${SUPABASE_DB_PASSWORD}

-- RLS policies remain for PostgREST / Supabase JS SDK access:
ALTER TABLE tb_gym_workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own workouts"
    ON tb_gym_workouts FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Also force RLS for table owner:
ALTER TABLE tb_gym_workouts FORCE ROW LEVEL SECURITY;
```

```java
// Spring Boot enforces isolation at repository level
// WorkoutRepository.java
@Query("SELECT w FROM Workout w WHERE w.userId = :userId")
List<Workout> findByUserId(@Param("userId") UUID userId);

// GymService.java — userId comes from JWT sub claim via Spring Security
public List<WorkoutDTO> getWorkouts(UUID userId) {
    return workoutRepository.findByUserId(userId);
}
```

**Option B: Per-request JWT context via JDBC (More complex)**

```sql
-- Requires a wrapper function or SET LOCAL per transaction
-- Not recommended for this scale — adds connection overhead

-- Example: SET LOCAL in every transaction (complex, error-prone)
BEGIN;
SET LOCAL request.jwt.claims = '{"sub": "user-uuid-here", "role": "authenticated"}';
SELECT * FROM tb_gym_workouts; -- auth.uid() now works
COMMIT;
```

**Verdict on Q1:** RLS policies in `DB-AUDIT.md` are **correct for PostgREST/client access** but require `FORCE ROW LEVEL SECURITY` addition. Spring Boot must use Option A (service role + repository-level `userId` filtering). The current Spring Boot architecture already has `GymController` calling repositories directly — the userId enforcement must live in the Service layer (which is Sprint 1 work, aligned with H-001 remediation).

**Required correction to `DB-AUDIT.md`:**
- Add `ALTER TABLE ... FORCE ROW LEVEL SECURITY` to all RLS remediation SQL
- Add `TO authenticated` role qualifier to all policies
- Add a note clarifying that Spring Boot service role connection bypasses RLS by design

---

### Q2: Is the SupplementGoal singleton redesign migration SQL correct?

**Status: NEEDS CORRECTION — Ordering and FK dependency issue**

The PRD describes migrating `SupplementGoal` (`id=1`) to `user_id UUID PK`. The migration is structurally correct but has a dependency problem.

**The problem:**

```sql
-- What the PRD implies for V3 migration:
ALTER TABLE tb_gym_supplements DROP COLUMN id;
ALTER TABLE tb_gym_supplements ADD COLUMN user_id UUID NOT NULL PRIMARY KEY;
ALTER TABLE tb_gym_supplements ADD CONSTRAINT fk_supplements_user
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

`auth.users` is a Supabase-managed table that only exists after Supabase Auth is provisioned. Flyway migration V3 will **fail if run against the local Docker PostgreSQL** (which has no `auth` schema) and will fail against a fresh Supabase project before auth is configured.

**Correct migration sequence:**

```sql
-- V3__redesign_supplement_singleton.sql
-- Safe for both local Docker and Supabase environments

BEGIN;

-- Step 1: Add user_id column with nullable first (for backfill)
ALTER TABLE tb_gym_supplements
    ADD COLUMN user_id UUID;

-- Step 2: Backfill existing singleton row (safe no-op if no rows exist)
-- In production, replace '00000000-0000-0000-0000-000000000001' with the real owner UUID
-- This should be set via environment variable or applied as a separate seed migration
UPDATE tb_gym_supplements
    SET user_id = current_setting('app.owner_user_id', true)::uuid
    WHERE id = 1
    AND current_setting('app.owner_user_id', true) IS NOT NULL;

-- Step 3: Delete rows without user_id (handles local dev reset)
DELETE FROM tb_gym_supplements WHERE user_id IS NULL;

-- Step 4: Add NOT NULL constraint
ALTER TABLE tb_gym_supplements
    ALTER COLUMN user_id SET NOT NULL;

-- Step 5: Drop old PK
ALTER TABLE tb_gym_supplements DROP CONSTRAINT pk_gym_supplements;
ALTER TABLE tb_gym_supplements DROP COLUMN id;

-- Step 6: Add new PK on user_id
ALTER TABLE tb_gym_supplements
    ADD CONSTRAINT pk_gym_supplements PRIMARY KEY (user_id);

-- Step 7: FK to auth.users is added in a SEPARATE migration (V3b) AFTER Supabase Auth is live
-- Do NOT add it here — it will fail in local Docker environment

COMMIT;
```

```sql
-- V3b__supplement_add_fk_auth_users.sql
-- Run ONLY against Supabase (not local Docker)
-- Requires: Supabase project provisioned, Auth enabled

ALTER TABLE tb_gym_supplements
    ADD CONSTRAINT fk_supplements_user
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

**Same pattern applies to `WorkspaceNote` (V4).**

**Verdict on Q2:** Split singleton redesign migrations into two stages — schema restructure (safe for local) and FK-to-auth-users (Supabase-only). The same two-stage pattern applies to ALL tables that will reference `auth.users`. This is a standard Supabase migration pattern.

---

### Q3: Is WorkoutSession a Sprint 0 blocker or Sprint 3 item?

**Status: CONFIRMED — Sprint 3 or later (not a blocker)**

`WorkoutSession` is not required for the core multi-tenancy launch. Reasoning:

1. The current product lets users manage workout templates (splits with exercises). Users can launch with this functionality without session history.
2. Adding `tb_gym_sessions` post-launch is a **pure addition** — no existing tables are modified. Zero migration risk to live data.
3. The business value (workout history, progression tracking) is a Phase 2 feature, not a safety requirement.

**One caveat:** If the frontend team commits to building a "session log" UX in Sprint 3, the schema must be ready before that sprint. Coordinate with Uma. The proposed schema in `DB-AUDIT.md` is correct — validate it when the session tracking feature is scoped.

**Recommendation:** Add `tb_gym_sessions` to the Sprint 3 scope as a tracked item, not Sprint 0.

---

### Q4: Is NUMERIC(10,2) migration safe for existing FLOAT8 data in tb_fuel_records?

**Status: CONDITIONALLY SAFE — Requires round-trip validation**

A direct `ALTER COLUMN type` cast from `FLOAT8` to `NUMERIC(10,2)` is **technically safe** in PostgreSQL but may introduce rounding on existing values.

**Risk analysis:**

```sql
-- What PostgreSQL does internally:
-- FLOAT8 value: 4.789999999999... (IEEE 754 representation of 4.79)
-- NUMERIC(10,2): 4.79 ✓ (rounds correctly in most cases)
-- FLOAT8 value: 149.99999999... (can happen with fuel price calculations)
-- NUMERIC(10,2): 150.00 ✗ (data change — though mathematically close)
```

For fuel fill-up amounts in BRL at the scale of a personal tracker (typical values R$50–R$500), this rounding risk is **acceptable** — the difference is sub-cent. However, the migration must not lose data.

**Recommended approach:**

```sql
-- V_fuel_numeric.sql — safe FLOAT8 → NUMERIC migration
BEGIN;

-- Step 1: Add new columns alongside existing ones
ALTER TABLE tb_fuel_records
    ADD COLUMN total_value_n   NUMERIC(10,2),
    ADD COLUMN price_per_liter_n NUMERIC(10,2);

-- Step 2: Populate with explicit rounding (transparent about what happened)
UPDATE tb_fuel_records SET
    total_value_n     = ROUND(total_value::numeric, 2),
    price_per_liter_n = ROUND(price_per_liter::numeric, 2);

-- Step 3: Verify no rows have NULL in new columns
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM tb_fuel_records WHERE total_value_n IS NULL AND total_value IS NOT NULL) THEN
        RAISE EXCEPTION 'Migration failed: NULL values found in total_value_n';
    END IF;
END $$;

-- Step 4: Drop old columns, rename new
ALTER TABLE tb_fuel_records DROP COLUMN total_value;
ALTER TABLE tb_fuel_records DROP COLUMN price_per_liter;
ALTER TABLE tb_fuel_records RENAME COLUMN total_value_n TO total_value;
ALTER TABLE tb_fuel_records RENAME COLUMN price_per_liter_n TO price_per_liter;

-- Step 5: Add NOT NULL if confirmed safe
ALTER TABLE tb_fuel_records ALTER COLUMN total_value SET NOT NULL;
ALTER TABLE tb_fuel_records ALTER COLUMN price_per_liter SET NOT NULL;

COMMIT;
```

**Verdict on Q4:** Safe with the column-parallel approach. **Do not use direct ALTER COLUMN TYPE** — use add/copy/verify/drop/rename sequence to make the migration auditable and reversible.

---

### Q5: Validate Flyway V1–V5 migration ordering

**Status: NEEDS CORRECTION — Three ordering issues found**

**Current proposed ordering:**
```
V1 — Baseline schema
V2 — Add user_id + timestamps to Gym tables
V3 — Redesign SupplementGoal singleton
V4 — Redesign WorkspaceNote singleton
V5 — Add FK + NOT NULL + index on workout_id
```

**Issue 1: V5 must come before V2 (or be part of V2)**

V5 adds `NOT NULL` on `tb_gym_exercises.workout_id`. If V2 runs first and adds `user_id NOT NULL`, then V5 runs and tries to set `workout_id NOT NULL` — any existing exercises without a `workout_id` (orphaned rows) will cause V5 to fail. V5's `NOT NULL` constraint should be validated or cleaned up before or alongside V2.

**Corrected ordering:**

```
V1  — Baseline schema (exact current DDL, establishes Flyway history)
V2  — Clean orphaned data + add FK constraint on workout_id + index
V3  — Add user_id + created_at + updated_at to tb_gym_workouts and tb_gym_exercises
V4  — Add user_id + created_at + updated_at to tb_fuel_records and tb_routine_tasks
V5  — Redesign tb_gym_supplements singleton (two-stage: see Q2)
V6  — Redesign tb_workspace_notes singleton (two-stage: see Q2)
V7  — (Supabase-only) Add FK constraints to auth.users on all redesigned tables
```

**Issue 2: V1 baseline must be generated before switching `ddl-auto` to `validate`**

V1 must exactly reproduce the schema that Hibernate currently manages. The safest approach is:

```bash
# Generate V1 from live database (run while Docker DB is up)
pg_dump --schema-only --no-owner --no-privileges \
  -h localhost -p 5432 -U postgres erp_pessoal \
  > src/main/resources/db/migration/V1__baseline_schema.sql
```

Then switch `ddl-auto=validate`. On next boot, Flyway applies V1 (or skips it as baseline), and Hibernate validates the schema matches entities.

**Issue 3: Baseline migration must use `baselineOnMigrate=true` for existing databases**

Since the database already exists with data, Flyway will refuse to migrate it (it expects an empty `flyway_schema_history` table). The first boot must use:

```properties
# application.properties — first boot only, then remove
spring.flyway.baseline-on-migrate=true
spring.flyway.baseline-version=1
```

Or via `flyway migrate --baselineOnMigrate=true` CLI. Without this, Flyway throws `Found non-empty schema with no schema history table`.

---

## Additional Findings Not in Original Audit

### DB-EXTRA-001: Missing `anon` role deny policy (CRITICAL for Supabase)

Supabase has two access roles: `anon` (unauthenticated) and `authenticated` (has valid JWT). The RLS policies in `DB-AUDIT.md` use `FOR ALL` without specifying a role — this allows `anon` users to attempt reads (they'll get empty results due to `auth.uid() = NULL`, but it's better practice to explicitly deny them).

```sql
-- Add explicit deny for anon role on all tables
-- (prevents information leakage even if policy logic has bugs)
CREATE POLICY "Deny anon access"
    ON tb_gym_workouts FOR ALL TO anon
    USING (false);

-- Repeat for all tables
```

### DB-EXTRA-002: Missing `updated_at` trigger function deduplication

The `DB-AUDIT.md` proposes creating a `set_updated_at()` trigger function for each table. This should be a **single shared function** created once:

```sql
-- V_timestamps.sql — create once, reuse everywhere
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Then for each table:
CREATE TRIGGER trg_tb_gym_workouts_updated_at
    BEFORE UPDATE ON tb_gym_workouts
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
-- (not EXECUTE PROCEDURE — deprecated syntax)
```

### DB-EXTRA-003: `liters` column in `tb_fuel_records` is a computed value

`FuelRecord.liters` is calculated server-side as `totalValue / pricePerLiter`. Storing a derived value creates an integrity risk — the stored `liters` value can become inconsistent with `total_value` and `price_per_liter` if either is updated without recalculating `liters`.

**Recommendation:** Either:
1. Add a CHECK constraint: `CHECK (ABS(liters - (total_value / price_per_liter)) < 0.001)` — catches inconsistencies at write time
2. Replace stored column with a **generated column** (PostgreSQL 12+):
   ```sql
   liters NUMERIC(8,3) GENERATED ALWAYS AS (total_value / price_per_liter) STORED
   ```
   This makes `liters` permanently consistent. The JPA entity would need `@Column(insertable=false, updatable=false)`.

### DB-EXTRA-004: Index strategy for multi-tenant access patterns

The consolidated PRD covers the `workout_id` index but misses the equally important `user_id` indexes that will be needed on every query post-migration.

**Required indexes for production (add to Sprint 0 migrations):**

```sql
-- user_id indexes — every query will filter by user_id
CREATE INDEX idx_gym_workouts_user_id    ON tb_gym_workouts(user_id);
CREATE INDEX idx_gym_exercises_user_id   ON tb_gym_exercises(user_id);
CREATE INDEX idx_fuel_records_user_id    ON tb_fuel_records(user_id);
CREATE INDEX idx_routine_tasks_user_id   ON tb_routine_tasks(user_id);

-- Composite: user_id + workout_id for exercise queries
CREATE INDEX idx_gym_exercises_user_workout
    ON tb_gym_exercises(user_id, workout_id);

-- Date-range index for fuel analytics
CREATE INDEX idx_fuel_records_user_date
    ON tb_fuel_records(user_id, date DESC);
```

Without these indexes, every `WHERE user_id = ?` query performs a sequential scan. At 10 users with 1000 exercises each, this is already noticeable.

---

## Sprint Roadmap Corrections

### Sprint 0 — Revised Task List

| # | Original | Correction |
|---|---|---|
| S0.4 | Add user_id + timestamps to Gym tables (migration V2) | **Split into V2/V3/V4** per corrected ordering above |
| S0.5 | SupplementGoal redesign (migration V3) | **Two-stage: schema (V5) + FK-to-auth (V7, Supabase-only)** |
| S0.6 | WorkspaceNote redesign (migration V4) | **Same two-stage pattern as V5/V7** |
| S0.7 | FK + index on workout_id (migration V5) | **Move to V2 — run before adding user_id** |
| S0.8 | Enable RLS + auth.uid() policies | **Add `TO authenticated` + `FORCE ROW LEVEL SECURITY` + anon deny policies** |
| S0.NEW | Add user_id indexes on all tables | **Add to Sprint 0 — required for production query performance** |
| S0.NEW | Flyway baseline-on-migrate setup | **Required for first boot on existing DB** |

### Sprint 1 — Correction to Security Model

The `JwtAuthFilter` in S1.7 must extract `userId` from the Supabase JWT `sub` claim and propagate it to the service layer. **Spring Boot does NOT use RLS policies** — it uses the service role connection and enforces `user_id` filtering in repositories. This is Option A from Q1.

The Spring Security filter chain must:
1. Extract JWT from `Authorization: Bearer` header
2. Validate against Supabase JWKS endpoint: `https://[project-ref].supabase.co/rest/v1/auth/keys`
3. Store `sub` claim (UUID string) as `userId` in `SecurityContext`
4. Inject into service methods via `@AuthenticationPrincipal`

---

## Issue Register Delta

Items found in this review that are **not** in the consolidated PRD:

| ID | Severity | Finding | Affects Sprint |
|---|---|---|---|
| DB-R-001 | **CRITICAL** | Spring Boot JDBC bypasses RLS — service role pattern must be explicit in architecture | Sprint 0 + Sprint 1 |
| DB-R-002 | HIGH | Singleton redesign migrations must be two-stage (local vs Supabase FK) | Sprint 0 |
| DB-R-003 | HIGH | Flyway `baselineOnMigrate` required for existing DB; V1–V5 ordering is wrong | Sprint 0 |
| DB-R-004 | HIGH | Missing `user_id` indexes on all tenant-scoped tables | Sprint 0 |
| DB-R-005 | MEDIUM | Anon role deny policies missing from RLS spec | Sprint 0 |
| DB-R-006 | MEDIUM | `set_updated_at()` trigger function should be shared, not per-table | Sprint 0 |
| DB-R-007 | LOW | `liters` computed column should use PostgreSQL GENERATED ALWAYS | Sprint 2 |

---

## Supabase Migration Readiness Checklist — Updated

Supersedes checklist in `DB-AUDIT.md`. Adds findings from this review:

**Prerequisite (before provisioning Supabase):**
- [ ] Credentials externalized to `.env` (SEC-001/002)
- [ ] `ddl-auto=update` → `validate` (SEC-003)
- [ ] Flyway added to `pom.xml`
- [ ] V1 baseline migration generated via `pg_dump` from live Docker DB
- [ ] `spring.flyway.baseline-on-migrate=true` set for first boot
- [ ] Flyway V2–V6 migrations written and `*dry-run` validated

**Supabase project setup:**
- [ ] Supabase project provisioned in correct region (OQ-02: `sa-east-1`)
- [ ] `DATABASE_URL` (service role) set in `.env`
- [ ] Auth configured (email+password; Google OAuth if OQ-03 confirmed)
- [ ] V7 (FK to `auth.users`) applied via Supabase CLI after Auth is enabled

**Spring Boot backend:**
- [ ] `GymService` extracted from `GymController` (H-001)
- [ ] DTO layer added (H-002)
- [ ] `JwtAuthFilter` validates Supabase JWKS endpoint
- [ ] All Gym repository queries include `WHERE user_id = :userId`
- [ ] `@AuthenticationPrincipal` injects userId into service calls
- [ ] Integration tests: unauthenticated request → 401; User A cannot see User B's data

**RLS policies (defense-in-depth for direct Supabase access):**
- [ ] RLS enabled on all 6 tables
- [ ] `FORCE ROW LEVEL SECURITY` applied
- [ ] `TO authenticated` on all allow policies
- [ ] Anon deny policies on all tables
- [ ] RLS validated with `*test-as-user` (Dara command)

---

## Final Verdict

| Question | Status | Action Required |
|---|---|---|
| Q1: RLS SQL production-ready? | **NEEDS CORRECTION** | Add `FORCE RLS` + `TO authenticated` + clarify Spring Boot uses service role |
| Q2: Singleton migration SQL correct? | **NEEDS CORRECTION** | Two-stage migration (local schema + Supabase FK separately) |
| Q3: WorkoutSession — Sprint 0 blocker? | **CONFIRMED** | Sprint 3 or backlog — not a blocker |
| Q4: NUMERIC(10,2) migration safe? | **CONDITIONALLY SAFE** | Use column-parallel approach, not direct ALTER COLUMN TYPE |
| Q5: Flyway V1–V5 ordering correct? | **NEEDS CORRECTION** | Reorder to V1–V7, add baselineOnMigrate, generate V1 from pg_dump |

**Overall: APPROVED WITH CONDITIONS.** The 4 corrected items (DB-R-001 through DB-R-004) must be reflected in the final `technical-debt-assessment.md` before the implementation sprints begin. None of these corrections change the sprint sequencing — they only add precision to Sprint 0 execution details.

---

*Review generated as part of Brownfield Discovery Phase 5.*  
*Next: Phase 6 — @ux-design-expert UX Specialist Review → Phase 7 — @qa QA Gate*
