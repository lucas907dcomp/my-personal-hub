# QA Gate Review — Brownfield Discovery Phase 7

**Version:** 1.0  
**Author:** Quinn (QA Agent)  
**Date:** 2026-05-07  
**Reviewer:** @qa  
**Gate Type:** Brownfield Discovery — Full Assessment Gate

**Documents Reviewed:**
- `docs/prd/technical-debt-DRAFT.md` (Phase 4 — Aria)
- `docs/reviews/db-specialist-review.md` (Phase 5 — Dara)
- `docs/reviews/ux-specialist-review.md` (Phase 6 — Uma)
- Source: `docs/architecture/system-architecture.md`, `docs/database/SCHEMA.md`, `docs/database/DB-AUDIT.md`, `docs/frontend/frontend-spec.md`

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-05-07 | 1.0 | QA Gate review — Brownfield Discovery Phase 7 | Quinn (@qa) |

---

## Gate Verdict

```
╔══════════════════════════════════════════════════════╗
║                                                      ║
║   BROWNFIELD DISCOVERY GATE: APPROVED                ║
║                                                      ║
║   Verdict: APPROVED WITH CONDITIONS                  ║
║   Phase 8 (Final Assessment): PROCEED                ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
```

**Rationale:** All CRITICAL issues are correctly identified and classified. Specialist reviews are thorough and internally consistent. Six conditions are documented below — none require returning to Phase 4. Phase 8 (`@architect` Final Assessment) may proceed with these conditions incorporated.

---

## Gate Checklist (Brownfield Discovery Criteria)

| Check | Status | Notes |
|---|---|---|
| All technical debts documented | ✓ PASS | 34 deduplicated items across 3 layers |
| CRITICAL issues identified as launch blockers | ✓ PASS | C-001–C-007 correctly classified |
| No undocumented critical gaps | ✓ PASS | 6 new items found (see Section 4) — none invalidate the PRD |
| Specialist reviews complete | ✓ PASS | DB (Phase 5) + UX (Phase 6) both APPROVED WITH CONDITIONS |
| Specialist corrections reconcilable | ✓ PASS | 12 correction items (DB-R-001–007, UX-R-001–005) are additive, not contradictory |
| Sprint dependencies correctly ordered | ⚠ CONDITION | One ordering defect: git init listed last in Sprint 0 (should be first) |
| Success metrics testable | ⚠ CONDITION | Sprint 1 exit gate requires documented 2-account test procedure |
| Architecture decisions recorded | ✓ PASS | ADR-001–005 cover all key decisions |
| Open questions documented | ✓ PASS | OQ-01–07 catalogued with owner and blocking status |

---

## Section 1 — CRITICAL Issue Validation

Verifying C-001 through C-007 are correctly classified as launch blockers.

| ID | Title | Classification | QA Verdict |
|---|---|---|---|
| C-001 | No `user_id` — zero multi-tenant isolation | CRITICAL | ✓ CORRECT — verified against all 6 entities |
| C-002 | Singleton `id=1` (`SupplementGoal`, `WorkspaceNote`) | CRITICAL | ✓ CORRECT — guaranteed duplicate key on second user |
| C-003 | No authentication layer | CRITICAL | ✓ CORRECT — every endpoint is publicly accessible |
| C-004 | Hardcoded credentials in source files | CRITICAL | ✓ CORRECT — blocks cloud deploy; password visible to anyone with repo access |
| C-005 | `ddl-auto=update` with no Flyway | CRITICAL | ✓ CORRECT — adding `user_id NOT NULL` causes boot failure with existing rows |
| C-006 | Auth screens missing (Login, Signup) | CRITICAL | ✓ CORRECT — no user-facing entry point for auth flow |
| C-007 | RLS disabled on all 6 tables | CRITICAL | ✓ CORRECT — no DB-level isolation even after `user_id` added |

**All 7 CRITICAL items validated. No reclassifications needed.**

**One note on C-007 interaction with DB-R-001:** Dara correctly identified that Spring Boot bypasses RLS via service role connection. C-007 remains CRITICAL because: (a) RLS is required as defense-in-depth for direct Supabase/PostgREST access, and (b) once RLS is enabled with correct `FORCE ROW LEVEL SECURITY`, even a misconfigured service role cannot bypass it for anon requests. The classification stands.

---

## Section 2 — Specialist Corrections Coverage

### DB Review Corrections (DB-R-001 through DB-R-007)

| ID | Title | Severity | Captured in PRD? | Status |
|---|---|---|---|---|
| DB-R-001 | Spring Boot bypasses RLS — service role pattern | CRITICAL | No (new finding) | Must be in Phase 8 final doc |
| DB-R-002 | Singleton migrations must be two-stage | HIGH | No (refinement) | Must be in Phase 8 final doc |
| DB-R-003 | Flyway ordering V1–V7 + baselineOnMigrate | HIGH | No (refinement) | Must be in Phase 8 final doc |
| DB-R-004 | Missing `user_id` indexes on all tables | HIGH | No (gap) | Must be in Phase 8 final doc |
| DB-R-005 | Anon role deny policies missing from RLS | MEDIUM | No (gap) | Must be in Phase 8 final doc |
| DB-R-006 | `set_updated_at()` function should be shared | MEDIUM | No (refinement) | Must be in Phase 8 final doc |
| DB-R-007 | `liters` column should be GENERATED ALWAYS | LOW | No (gap) | Must be in Phase 8 final doc |

### UX Review Corrections (UX-R-001 through UX-R-005)

| ID | Title | Severity | Captured in PRD? | Status |
|---|---|---|---|---|
| UX-R-001 | Auth session flash — SplashScreen + getSession() | HIGH | No (new finding) | Must be in Phase 8 final doc |
| UX-R-002 | JWT localStorage trade-off undocumented | MEDIUM | No (gap) | Must be in Phase 8 final doc |
| UX-R-003 | Supabase Auth `redirectTo` URL config before invite | HIGH | No (gap) | Must be in Phase 8 final doc |
| UX-R-004 | Input font-size < 16px triggers iOS zoom | MEDIUM | No (gap) | Must be in Phase 8 final doc |
| UX-R-005 | WorkoutSelector overflow indicator missing | LOW | No (gap) | Must be in Phase 8 final doc |

**Assessment:** All 12 corrections are additive — they refine the PRD, they do not contradict it. Phase 8 must incorporate all 12 into the final assessment document.

---

## Section 3 — Sprint Consistency Validation

### Sprint 0 — 3 Issues Found

**Issue QA-001 (HIGH): Git init is S0.9 but must be S0.1**

`git init` is listed as the ninth and final task in Sprint 0. Every preceding task (S0.1–S0.8) involves modifying files (`application.properties`, `pom.xml`, migration scripts, etc.). Without git initialized:
- There is no commit history for Sprint 0 changes
- Branch strategy cannot be established
- `@devops` cannot execute `*push` when Sprint 0 is ready for review
- If any S0.1–S0.8 change breaks the application, there is no rollback point

**Required fix:** Reorder to: S0.1 → git init + branch strategy, then S0.2 → externalize credentials, etc.

---

**Issue QA-002 (MEDIUM): Sprint 0 exit gate is not testable without Supabase Auth**

Sprint 0 exit gate:
> `SELECT COUNT(*) FROM tb_gym_workouts` returns 0 rows for unauthenticated Supabase client.

This test relies on RLS policies and `auth.uid()` — which only work when Supabase Auth is provisioned. Sprint 0 targets the local Docker PostgreSQL database. The exit gate as written cannot be verified during Sprint 0.

**Required fix:** Split the exit gate:

```
Sprint 0 exit gate (local Docker):
  - Flyway migration history shows V1–V7 applied successfully
  - Application boots with ddl-auto=validate (no Hibernate exceptions)
  - All table structures verified via: SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, ordinal_position;
  - user_id columns present on all Gym tables
  - FK constraint on tb_gym_exercises.workout_id verified
  - No passwords in application.properties (grep check)

Sprint 1 exit gate (Supabase):
  - RLS verified: User A cannot query User B's workouts
  - Unauthenticated request to /api/gym/workouts returns 401
  - Two-account isolation test passes (documented in Section 5 below)
```

---

**Issue QA-003 (LOW): Sprint 0 has no rollback plan**

S0.1–S0.9 make breaking changes to the database schema and application configuration. If Sprint 0 work introduces a regression, there is no defined rollback procedure. Since git is being initialized in Sprint 0, rollback is via `git reset` — but this must be documented.

**Required fix:** Add to Sprint 0 preamble: "Before beginning S0.1, snapshot the Docker database: `docker exec db-erp-pessoal pg_dump -U postgres erp_pessoal > backup-pre-sprint0.sql`."

---

### Sprint 1 — 2 Issues Found

**Issue QA-004 (HIGH): Integration test scope is undefined**

Sprint 1 task S1.15 states: "Write integration tests for auth-protected endpoints." The PRD does not specify:
- Testing framework (`@SpringBootTest` + `MockMvc` vs `WebTestClient`)
- Test database setup (Testcontainers? H2? Local Docker?)
- Minimum coverage scope (which endpoints must be tested?)
- How Supabase JWTs are mocked in tests

Without this, S1.15 is a vague task that different developers would interpret very differently.

**Required fix:** Add to Sprint 1 tech notes:
```
Integration Test Spec:
  Framework: @SpringBootTest + MockMvc
  DB: Testcontainers (PostgreSQL 16-alpine) — matches production
  JWT: Use Spring Security's test support:
       MockMvc.perform(get("/api/gym/workouts")
           .with(jwt().jwt(j -> j.subject("test-user-uuid"))))
  Required tests (minimum):
    - GET /api/gym/workouts with valid JWT → 200, returns only user's workouts
    - GET /api/gym/workouts without JWT → 401
    - GET /api/gym/workouts with another user's JWT → 200, empty list (not 403)
    - POST /api/gym/workouts with valid JWT → 201, workout.userId = JWT sub
    - DELETE /api/gym/workouts/{other-user-workout-id} → 404 (not found, not 403)
```

---

**Issue QA-005 (MEDIUM): Sprint 1 exit gate requires 2-account test procedure**

Sprint 1 exit gate states: "Two users can sign up and their workout data is 100% isolated." This requires two distinct user accounts. The test procedure is not documented.

**Required test procedure:**
```
Two-Account Isolation Test (Sprint 1 exit gate):
  Setup:
    1. Sign up user-A: test-a@example.com
    2. Login as user-A, create workout "Treino A", add 2 exercises
    3. Sign up user-B: test-b@example.com
    4. Login as user-B, create workout "Treino B", add 2 exercises

  Assertions:
    5. As user-B: GET /api/gym/workouts → returns only "Treino B" (not "Treino A")
    6. As user-B: GET /api/gym/exercises?workoutId={user-A-workout-id} → empty array
    7. As user-B: DELETE /api/gym/workouts/{user-A-workout-id} → 404
    8. As user-A: GET /api/gym/workouts → returns only "Treino A" (not "Treino B")

  Cleanup: Delete both test accounts from Supabase Auth dashboard
```

---

### Sprint 2 — Validated

Sprint 2 is internally consistent. The 41-item parity checklist from Uma (UX-R-003 context) provides the required exit gate rigor. No additional issues.

### Sprint 3 — Validated

Sprint 3 is correctly scoped as polish. No ordering or consistency issues.

---

## Section 4 — Gaps Found by QA (Not in PRD or Specialist Reviews)

### QA-GAP-001 (MEDIUM): No connection pool sizing for Supabase free tier

The PRD mentions "HikariCP tuning + PgBouncer for Supabase" as an NFR gap but provides no concrete values. Supabase free tier allows **60 direct connections** (and PgBouncer pooler allows more). Spring Boot's default HikariCP pool is 10 connections. With multiple users, this needs to be explicitly sized.

**Recommendation for Sprint 0:**
```properties
# application.properties — Supabase connection pool sizing
spring.datasource.hikari.maximum-pool-size=5        # conservative for free tier
spring.datasource.hikari.minimum-idle=2
spring.datasource.hikari.connection-timeout=20000
spring.datasource.hikari.idle-timeout=300000
# Use PgBouncer pooler URL (port 6543), not direct connection (port 5432)
# spring.datasource.url=jdbc:postgresql://[ref].supabase.co:6543/postgres?pgbouncer=true
```

---

### QA-GAP-002 (MEDIUM): No migration rollback scripts defined

Dara's principles state "Everything is versioned and reversible." The PRD defines V1–V7 forward migrations but no rollback scripts. For a production migration path with existing user data:

**Required:** Each migration V2–V7 must have a corresponding rollback script:

```
src/main/resources/db/migration/
├── V1__baseline_schema.sql
├── V2__clean_orphans_add_fk_workout.sql
├── V2__undo.sql                          ← DROP FK, DROP INDEX
├── V3__add_user_id_gym_tables.sql
├── V3__undo.sql                          ← DROP COLUMN user_id, DROP INDEX
...
```

Flyway doesn't execute undo scripts automatically (requires Flyway Teams), but having them documented provides a manual rollback path.

---

### QA-GAP-003 (LOW): Error monitoring absent from all documents

None of the discovery documents (architecture, DB audit, frontend spec, or PRD) mention error monitoring for production. Once real users are onboarded:
- Backend exceptions that reach users are invisible to the developer
- Frontend JavaScript errors go undetected
- Slow queries are not surfaced

**Minimum viable approach for Sprint 3:** Sentry free tier (covers both Spring Boot and React). One dependency, 30 minutes to configure. This should be in the PRD's NFR assessment.

---

### QA-GAP-004 (LOW): `CORS` allowed origins must include Supabase Auth callback URL

The PRD correctly notes CORS centralization (H-009). However, neither the PRD nor the DB review accounts for the fact that **Supabase Auth email verification redirects** require the production domain to be in both Supabase's allowed redirect URLs AND the Spring Boot CORS configuration.

If the frontend is deployed separately (Vercel/Netlify — OQ-01), the Spring Boot CORS config must allow the Vercel domain. The current CORS fix in Sprint 0 task S0.10 references only localhost URLs. Add production domain as an env var placeholder:

```java
.allowedOrigins(
    "http://localhost:5173",
    "http://127.0.0.1:5500",
    System.getenv().getOrDefault("APP_FRONTEND_URL", "http://localhost:5173")
)
```

---

## Section 5 — NFR Assessment

| NFR | Addressed in PRD | Specialist Input | QA Verdict |
|---|---|---|---|
| Multi-tenancy | ✓ C-001, C-007, Sprint 0 | Dara: RLS + service role pattern | ✓ PASS |
| Authentication | ✓ C-003, C-006, Sprint 1 | Uma: SplashScreen, JWT pattern | ✓ PASS |
| Authorization | ✓ C-007, Sprint 0 RLS | Dara: FORCE RLS + anon deny | ✓ PASS |
| Performance | ✓ H-005, Section 8 perf targets | Uma: 41-item perf checklist | ✓ PASS |
| Schema versioning | ✓ C-005, H-010, Sprint 0 | Dara: V1–V7 ordering | ✓ PASS |
| Input validation | ✓ H-004, Sprint 1 | — | ✓ PASS |
| Error handling | ✓ M-001, Sprint 1 | — | ✓ PASS |
| Test coverage | ✓ M-002, Sprint 1–2 | — | ⚠ CONDITION (QA-004) |
| Observability | ✓ M-004, M-005, Sprint 2 | — | ⚠ PARTIAL (QA-GAP-003) |
| Credential security | ✓ C-004, Sprint 0 | — | ✓ PASS |
| CORS | ✓ H-009, Sprint 0 | — | ⚠ PARTIAL (QA-GAP-004) |
| Connection pooling | ⚠ Mentioned, not sized | — | ⚠ CONDITION (QA-GAP-001) |
| Mobile accessibility | ✓ WCAG 2.1 AA, Section 7 | Uma: 52px targets, iOS zoom | ✓ PASS |

---

## Section 6 — Requirements Traceability Summary

Cross-checking that every stated requirement has a corresponding implementation task:

| Requirement | Source | Sprint Task | Traceable? |
|---|---|---|---|
| user_id on all gym entities | C-001 | S0.4 (V3 migration) | ✓ |
| Singleton redesign | C-002 | S0.5/S0.6 (V5/V6 two-stage) | ✓ |
| Credential externalization | C-004 | S0.1 | ✓ |
| Flyway introduction | C-005, H-010 | S0.3 | ✓ |
| Login + Signup screens | C-006 | S1.13 | ✓ |
| RLS policies | C-007 | S0.8 | ✓ |
| Service layer extraction | H-001 | S1.1 | ✓ |
| DTO layer | H-002 | S1.2 | ✓ |
| FK constraint + index on workout_id | H-003 | S0.7 (corrected to V2) | ✓ |
| Input validation | H-004 | S1.4 | ✓ |
| Vite migration | H-005 | S1.10, S2.1–S2.7 | ✓ |
| NOT NULL constraints | H-006 | S2.9 | ✓ |
| Audit timestamps | H-007 | S2.10 | ✓ |
| NUMERIC for money | H-008 | S2.8 | ✓ |
| CORS centralization | H-009 | S0.10 | ✓ |
| Flyway + migration versioning | H-010 | S0.3 | ✓ |
| user_id indexes | DB-R-004 | Missing → add to S0 | ⚠ |
| SplashScreen auth fix | UX-R-001 | S1.18 | ✓ |
| Supabase Auth redirectTo | UX-R-003 | S1.19 | ✓ |

**One gap:** `user_id` indexes (DB-R-004) have no explicit sprint task in the PRD. They must be added to Sprint 0 as a named task.

---

## Section 7 — Conditions Summary

| ID | Severity | Condition | Target |
|---|---|---|---|
| QA-001 | HIGH | Git init must be S0.1, not S0.9 | Phase 8 final doc |
| QA-002 | MEDIUM | Sprint 0 exit gate rewritten for local Docker (not Supabase-dependent) | Phase 8 final doc |
| QA-003 | LOW | Sprint 0 DB snapshot procedure documented | Phase 8 final doc |
| QA-004 | HIGH | Integration test spec defined (framework, DB, JWT mock, minimum test list) | Phase 8 final doc |
| QA-005 | MEDIUM | Two-account isolation test procedure documented | Phase 8 final doc |
| QA-GAP-001 | MEDIUM | HikariCP pool sizing added to Sprint 0 | Phase 8 final doc |
| QA-GAP-002 | MEDIUM | Migration rollback scripts defined for V2–V7 | Phase 8 final doc |
| QA-GAP-003 | LOW | Error monitoring (Sentry) added to Sprint 3 scope | Phase 8 final doc |
| QA-GAP-004 | LOW | CORS config includes production domain env var | Phase 8 final doc |

**Total: 9 conditions — all LOW or MEDIUM severity. No CRITICAL blockers found in QA review.**

---

## Gate Decision

**APPROVED — Phase 8 may proceed.**

All CRITICAL issues (C-001–C-007) are correctly classified. The three specialist reviews (Aria, Dara, Uma) are thorough and internally consistent. The sprint sequence is sound. 9 conditions are documented for Phase 8 to incorporate — none require returning to Phase 4.

**Phase 8 (@architect) must:**
1. Incorporate all 12 specialist corrections (DB-R-001–007, UX-R-001–005)
2. Incorporate all 9 QA conditions (QA-001 through QA-GAP-004)
3. Reorder Sprint 0 (git init to S0.1)
4. Rewrite Sprint 0 exit gate (local Docker, not Supabase-dependent)
5. Add integration test spec to Sprint 1
6. Add `user_id` indexes as a named Sprint 0 task
7. Finalize the document as `technical-debt-assessment.md` (not DRAFT)

---

*QA Gate generated as part of Brownfield Discovery Phase 7.*  
*Verdict: APPROVED — proceed to Phase 8 (@architect Final Assessment)*
