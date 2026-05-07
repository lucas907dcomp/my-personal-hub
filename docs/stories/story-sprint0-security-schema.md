---
story_id: STORY-001
epic_id: EPIC-001
title: "Sprint 0 — Security & Schema Foundations"
status: Ready
priority: CRITICAL
sprint: 0
executor: "@dev + @data-engineer"
quality_gate: "@architect"
quality_gate_tools: [migration_review, security_scan, schema_validation, rls_verification]
depends_on: []
blocks: [STORY-002]
effort_estimate: "~2 weeks"
created_by: Morgan (@pm) — Brownfield Discovery Phase 10
created_at: "2026-05-07"
---

# STORY-001 — Sprint 0: Security & Schema Foundations

## Description

Establish the security and schema foundations that make the database safe for multiple users. This sprint is the absolute prerequisite for all other sprints — nothing ships to real users until this exit gate passes.

All tasks must be executed in the order specified. The migration sequence is strict: V1 → V2 → V3 → V4 → V5 → V6. V7 is written but held for Sprint 1 Supabase provisioning.

**Issues resolved:** C-001, C-002, C-004, C-005, C-007, H-003, H-006, H-007, H-009, H-010, H-011, M-010, M-011, M-012, M-013, M-016

## Prerequisite — DB Snapshot

Before starting any task in this sprint:
```bash
docker exec db-erp-pessoal pg_dump -U postgres erp_pessoal > backup-pre-sprint0-$(date +%Y%m%d).sql
```
Verify the file exists and is non-zero before proceeding.

## Acceptance Criteria

### AC-1: Git initialized (S0.1)
- [ ] `git init` executed in project root
- [ ] `.gitignore` includes `.env`, `*.sql` (snapshot backups), `target/`
- [ ] Initial commit created with all current source files
- [ ] Branch strategy documented: `main` (production) / `develop` (integration)

### AC-2: Credentials externalized (S0.2)
- [ ] All database passwords moved from `application.properties` to `.env`
- [ ] All secrets removed from `docker-compose.yml` (use env_file or env vars)
- [ ] `.env` added to `.gitignore`
- [ ] `.env.example` created with placeholder values
- [ ] `grep -r "lucas123" src/main/resources/` → 0 results

### AC-3: ddl-auto switched to validate (S0.3)
- [ ] `spring.jpa.hibernate.ddl-auto=validate` in `application.properties`
- [ ] Application fails to boot (expected — no migrations applied yet)
- [ ] This failure confirms the switch worked correctly

### AC-4: Flyway configured (S0.4)
- [ ] `flyway-core` added to `pom.xml`
- [ ] `spring.flyway.baseline-on-migrate=true` configured
- [ ] HikariCP: `spring.datasource.hikari.maximum-pool-size=5`
- [ ] HikariCP: `spring.datasource.hikari.minimum-idle=2`
- [ ] Use Supabase PgBouncer pooler port 6543 (not 5432) when connecting to Supabase

### AC-5: V1 baseline migration created (S0.5)
- [ ] V1 generated via `pg_dump --schema-only` from live local Docker DB
- [ ] File: `src/main/resources/db/migration/V1__baseline_schema.sql`
- [ ] V1 contains only CREATE TABLE + CREATE INDEX + existing constraints
- [ ] V1 does NOT contain INSERT data or `user_id` columns (those come in V3/V4)
- [ ] Application boots successfully after V1 applied

### AC-6: V2 FK migration (S0.6)
- [ ] File: `src/main/resources/db/migration/V2__add_exercise_fk.sql`
- [ ] Cleanup: DELETE orphaned exercises where `workout_id` references no workout
- [ ] Add FK: `ALTER TABLE tb_gym_exercises ADD CONSTRAINT fk_exercises_workout FOREIGN KEY (workout_id) REFERENCES tb_gym_workouts(id) ON DELETE CASCADE`
- [ ] `NOT NULL` constraints added for all required business fields (H-006 list from DB-AUDIT)
- [ ] Rollback script: `src/main/resources/db/migration/rollback/R2__rollback_exercise_fk.sql`

### AC-7: V3 gym user_id migration (S0.7)
- [ ] File: `src/main/resources/db/migration/V3__add_user_id_gym.sql`
- [ ] `user_id UUID` column added to `tb_gym_workouts` and `tb_gym_exercises`
- [ ] `created_at TIMESTAMPTZ DEFAULT now()` and `updated_at TIMESTAMPTZ DEFAULT now()` added to both tables
- [ ] `shared_set_updated_at()` trigger function created ONCE in this migration (reused in V4+)
- [ ] Index: `CREATE INDEX idx_gym_workouts_user_id ON tb_gym_workouts(user_id)`
- [ ] Index: `CREATE INDEX idx_gym_exercises_user_workout ON tb_gym_exercises(user_id, workout_id)`
- [ ] Rollback script: `R3__rollback_gym_user_id.sql`
- [ ] Note: `user_id` is nullable at this stage (existing rows have no user yet)

### AC-8: V4 fuel+tasks user_id migration (S0.8)
- [ ] File: `V4__add_user_id_fuel_tasks.sql`
- [ ] `user_id UUID`, `created_at`, `updated_at` added to `tb_fuel_records` and `tb_routine_tasks`
- [ ] Index on `tb_fuel_records.user_id`
- [ ] Index on `tb_fuel_records(user_id, date)` composite
- [ ] Reuse `shared_set_updated_at()` trigger (do NOT create per-table)
- [ ] Rollback script: `R4__rollback_fuel_tasks_user_id.sql`

### AC-9: V5 supplement redesign (S0.9)
- [ ] File: `V5__redesign_supplements.sql`
- [ ] `tb_gym_supplements` redesigned: remove `id=1` singleton pattern, add `user_id UUID` as primary key component
- [ ] Schema-only change (data migration handled by application on first login)
- [ ] Rollback script: `R5__rollback_supplements.sql`

### AC-10: V6 workspace notes redesign (S0.10)
- [ ] File: `V6__redesign_workspace_notes.sql`
- [ ] `tb_workspace_notes` redesigned: remove `id=1` singleton pattern, add `user_id UUID`
- [ ] Schema-only change
- [ ] Rollback script: `R6__rollback_workspace_notes.sql`

### AC-11: Migrations applied and verified (S0.11/S0.12)
- [ ] All V1–V6 migrations pass `./mvnw flyway:validate`
- [ ] Application boots successfully with `ddl-auto=validate` — no schema exceptions

### AC-12: RLS enabled (S0.13)
- [ ] `FORCE ROW LEVEL SECURITY` applied to all 6 tables
- [ ] `TO authenticated` policy: `USING (user_id = auth.uid())`
- [ ] Anon deny policy on all tables: `CREATE POLICY "deny_anon" ON <table> FOR ALL TO anon USING (false)`
- [ ] Note: These RLS policies take effect in Supabase. Local Docker has no `auth` schema — RLS cannot be tested locally. Test in Sprint 1 after Supabase provisioning.

### AC-13: CORS centralized (S0.15)
- [ ] `@CrossOrigin("*")` removed from `FuelController`
- [ ] `WebMvcConfigurer` bean created with centralized CORS configuration
- [ ] Production domain read from env var: `APP_FRONTEND_URL` (default: `http://localhost:5173`)

## Tasks

| # | Task | Issues | Effort | Executor |
|---|------|--------|--------|----------|
| S0.1 | `git init` + branch strategy (main/develop) | — | 30 min | @dev |
| S0.2 | Externalize credentials to `.env` + update `.gitignore` | C-004 | 30 min | @dev |
| S0.3 | Switch `ddl-auto=update` → `validate` | C-005 | 15 min | @dev |
| S0.4 | Add Flyway to `pom.xml` + `baselineOnMigrate=true` + HikariCP sizing | H-010, M-012 | 1h | @dev |
| S0.5 | Generate V1 baseline via `pg_dump --schema-only` | H-010 | 30 min | @data-engineer |
| S0.6 | Write V2: orphan cleanup + FK + `NOT NULL` + exercise index | H-003, H-006 | 1h | @data-engineer |
| S0.7 | Write V3: `user_id` + timestamps + shared trigger + indexes (gym tables) | C-001, H-007, H-011 | 2h | @data-engineer |
| S0.8 | Write V4: `user_id` + timestamps + indexes (fuel + tasks tables) | C-001, H-007, H-011 | 1h | @data-engineer |
| S0.9 | Write V5: supplement singleton redesign | C-002 | 2h | @data-engineer |
| S0.10 | Write V6: workspace notes singleton redesign | C-002 | 1h | @data-engineer |
| S0.11 | `flyway:validate` dry-run against local Docker DB | — | 30 min | @dev |
| S0.12 | Apply V1–V6 + boot verification | — | 1h | @dev |
| S0.13 | Enable RLS + `FORCE ROW LEVEL SECURITY` + anon deny policies (6 tables) | C-007, M-010 | 3h | @data-engineer |
| S0.14 | Write rollback scripts V2–V6 | M-013 | 1h | @data-engineer |
| S0.15 | Centralize CORS + production domain env var | H-009, M-016 | 45 min | @dev |

## Exit Gate

All 5 checks must pass before Sprint 1 begins. Run against local Docker PostgreSQL — no Supabase required.

```sql
-- 1. All migrations applied successfully
SELECT version, description, success
FROM flyway_schema_history
ORDER BY installed_rank;
-- Expected: V1–V6 all with success=true

-- 2. user_id present on gym tables
SELECT column_name FROM information_schema.columns
WHERE table_name = 'tb_gym_workouts' AND column_name = 'user_id';
-- Expected: 1 row returned

-- 3. FK constraint exists
SELECT constraint_name FROM information_schema.table_constraints
WHERE table_name = 'tb_gym_exercises' AND constraint_type = 'FOREIGN KEY';
-- Expected: fk_exercises_workout

-- 4. No credentials in source code
-- grep -r "lucas123" src/main/resources/ → 0 results

-- 5. Application boots clean
-- ./mvnw spring-boot:run → no "Schema-validation: missing column" errors in console
```

## Quality Gate Checklist

- [ ] @architect reviews V1–V6 migration SQL before apply (no destructive changes to existing data)
- [ ] @architect validates CORS configuration is correct for target deployment
- [ ] All rollback scripts tested: apply forward, rollback, apply forward again — no errors
- [ ] `grep -r "password\|secret\|lucas123" src/main/resources/` → 0 results

## Risks

| Risk | Mitigation |
|------|-----------|
| `ddl-auto=update` has already auto-applied schema changes since last `pg_dump` | Generate V1 from CURRENT live Docker state, not from source code entity classes |
| V3 `user_id NOT NULL` would fail for existing rows | V3 adds `user_id` as NULLABLE — NOT NULL enforced after first user assignment in Sprint 1 |
| V7 (FK to `auth.users`) fails in local Docker — no `auth` schema | V7 is NOT applied in Sprint 0. Written and held for Sprint 1 Supabase provisioning. |
| RLS policies reference `auth.uid()` which does not exist in local Docker | RLS enabled but not verified locally — verification happens after Sprint 1 Supabase setup |

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-05-07 | Story created from Brownfield Discovery Phase 10 | Morgan (@pm) |
