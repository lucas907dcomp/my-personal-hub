---
story_id: STORY-002
epic_id: EPIC-001
title: "Sprint 1 — Authentication + Backend Refactor"
status: Ready
priority: CRITICAL
sprint: 1
executor: "@dev"
quality_gate: "@architect"
quality_gate_tools: [security_review, integration_tests, auth_flow_validation, architecture_review]
depends_on: [STORY-001]
blocks: [STORY-003]
effort_estimate: "~2–3 weeks"
created_by: Morgan (@pm) — Brownfield Discovery Phase 10
created_at: "2026-05-07"
---

# STORY-002 — Sprint 1: Authentication + Backend Refactor

## Description

Introduce authentication and user-scoped data access to My-Hubs. After this sprint, the app requires login, every API request carries a JWT, and every data query is filtered to the requesting user's identity. This is the first sprint that can safely accept real users.

This sprint also scaffolds the Vite 5 frontend build system, builds the login/signup screens, and introduces the foundational React Router + protected route structure.

**Prerequisite:** STORY-001 exit gate must pass completely before this sprint begins.

**Issues resolved:** C-001 (enforcement), C-003, C-006, H-001, H-002, H-003 (JPA migration), H-004, H-005 (scaffold), H-012, H-013, M-001, M-002, M-014

## Open Questions — Must Be Answered First

Before Sprint 1 planning is finalized, Lucas must resolve:

| OQ | Question | Affects |
|----|----------|---------|
| OQ-01 | Frontend deploy target (Vercel/Netlify vs Spring Boot static) | Supabase `site_url`, CORS config, Vite base URL |
| OQ-02 | Supabase region | Database provisioning |
| OQ-03 | Auth providers — email+password only, or also Google OAuth? | Login screen scope, Supabase provider config |
| OQ-07 | Spring Boot backend hosting | CORS allowed origins, deployment config |

## Acceptance Criteria

### AC-1: Service layer extracted (S1.1)
- [ ] `GymService` extracted from `GymController` — controllers contain only HTTP mapping logic
- [ ] All business logic lives in `GymService`
- [ ] `@Autowired` of repository removed from controller

### AC-2: DTO layer added (S1.2)
- [ ] `WorkoutDTO`, `ExerciseDTO`, `SupplementDTO` created
- [ ] Controllers return DTOs — JPA entities never exposed directly in responses
- [ ] MapStruct or manual mapping (no Lombok on DTOs to avoid circular issues)

### AC-3: Exercise JPA relationship migrated (S1.3)
- [ ] `Exercise.workoutId` field removed
- [ ] `@ManyToOne(fetch = FetchType.LAZY)` + `@JoinColumn(name = "workout_id")` added
- [ ] `@OneToMany(mappedBy = "workout", cascade = CascadeType.ALL, orphanRemoval = true)` on `Workout`

### AC-4: Input validation added (S1.4)
- [ ] `@Valid` on all controller method parameters
- [ ] `@NotNull`, `@NotBlank`, `@Size`, `@Positive` constraint annotations on entity/DTO fields
- [ ] `starter-validation` already imported — just needs annotations

### AC-5: Global exception handler (S1.5)
- [ ] `@ControllerAdvice` class created
- [ ] Returns `ProblemDetail` (RFC 9457) — Spring 6 native, no custom error POJO needed
- [ ] Handles: `MethodArgumentNotValidException` (400), `EntityNotFoundException` (404), generic `Exception` (500)
- [ ] No stack traces in response body

### AC-6: Spring Security + JWT (S1.6/S1.7/S1.8)
- [ ] `spring-boot-starter-security` + `spring-security-oauth2-resource-server` in `pom.xml`
- [ ] `JwtAuthFilter` extracts `sub` claim from Supabase JWT → `UUID userId` in `SecurityContext`
- [ ] `SecurityConfig` protects all `/api/**` — no endpoint accessible without valid JWT
- [ ] `OPTIONS` requests permitted (CORS preflight)
- [ ] Supabase JWKS URI configured: `spring.security.oauth2.resourceserver.jwt.jwk-set-uri`

### AC-7: Repository-level userId filtering (S1.9)
- [ ] Every repository method that returns data uses `findByUserId(UUID userId)` — never `findAll()`
- [ ] `@AuthenticationPrincipal UUID userId` injected at controller, passed to service, used in repository
- [ ] `GymController` + `GymService` updated for all Gym endpoints
- [ ] `FuelController` + `FuelService` updated for all Fuel endpoints
- [ ] `TaskController` + `TaskService` updated for all Task endpoints
- [ ] ADR-006 pattern in effect: service role + application-layer filtering

### AC-8: Vite 5 scaffold (S1.10/S1.11)
- [ ] `npm create vite@latest gym-hub -- --template react-ts` in project root
- [ ] Tailwind CSS configured with custom design tokens from `docs/frontend/frontend-spec.md`
- [ ] `tailwind.config.js` includes: `gym-gradient`, `slate` palette, glass morphism utility classes
- [ ] Dev server runs: `npm run dev` → `http://localhost:5173`

### AC-9: Supabase client integrated (S1.12)
- [ ] `@supabase/supabase-js` installed
- [ ] `src/lib/supabaseClient.ts` singleton created
- [ ] `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local`

### AC-10: Auth screens built (S1.13)
- [ ] `LoginPage` component with email + password form
- [ ] `SignupPage` component with email + password + confirm password
- [ ] `AuthForm` organism shared between Login and Signup
- [ ] All inputs use `text-base` (16px) — no iOS Safari viewport zoom (M-015)
- [ ] Error messages displayed inline (wrong credentials, email already in use)

### AC-11: Routing + protected route (S1.14)
- [ ] React Router v6 installed and configured
- [ ] `ProtectedRoute` component: redirects to `/login` if no active session
- [ ] Routes: `/login`, `/signup`, `/gym` (protected)

### AC-12: SplashScreen — no auth flash (S1.15)
- [ ] `SplashScreen` component: dark background + GYMHUB wordmark + subtle spinner
- [ ] `App.tsx` follows the exact pattern from `docs/prd/technical-debt-assessment.md §6 Sprint 1`:
  ```tsx
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session); setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])
  if (loading) return <SplashScreen />
  ```
- [ ] Reload as authenticated user → SplashScreen shows briefly → GymPage renders (no login flash)

### AC-13: GymLayout + GymPage stubs (S1.16/S1.17)
- [ ] `GymLayout.tsx`: dark background (`bg-slate-950`), correct padding, BottomTabBar slot empty
- [ ] `GymPage.tsx`: skeleton layout proving auth-to-route flow — workout card placeholders, no data
- [ ] Accessible from `/gym` after login

### AC-14: Supabase Auth URLs configured (S1.18)
- [ ] Supabase project provisioned in the region from OQ-02
- [ ] `Site URL` set to actual deploy URL (from OQ-01)
- [ ] `Redirect URLs` includes both localhost:5173 and production URL
- [ ] Email verification template tested on mobile — link opens in app, not browser
- [ ] This step must be done BEFORE sending any invitation to a real user

### AC-15: JWT trade-off documented (S1.19)
- [ ] `docs/frontend/frontend-spec.md` Section 9 (Open Questions) updated with ADR-007 resolution:
  - JWT stored in localStorage (Supabase default)
  - Accepted risk for personal app scope
  - Revisit trigger: if app handles health/financial data or expands to public users

### AC-16: Integration tests (S1.20)
- [ ] `testcontainers-postgresql` in `pom.xml` (test scope)
- [ ] `spring-security-test` in `pom.xml` (test scope)
- [ ] All 6 minimum test cases implemented (from `docs/prd/technical-debt-assessment.md §6 Sprint 1`):
  - T1: GET /api/gym/workouts with valid JWT → 200, only requesting user's data
  - T2: GET /api/gym/workouts without JWT → 401
  - T3: GET /api/gym/workouts with different user's JWT → 200, empty array
  - T4: POST /api/gym/workouts with valid JWT → 201, workout.userId == JWT sub
  - T5: DELETE /api/gym/workouts/{other-user-workout-id} → 404
  - T6: GET /api/gym/supplements with valid JWT → 200, only user's supplement row
- [ ] `./mvnw test` passes

### AC-17: V7 migration applied to Supabase (S1.21)
- [ ] `V7__add_auth_user_fk.sql`: FK from `tb_gym_workouts.user_id` → `auth.users(id)`
- [ ] Applied ONLY against Supabase instance — NOT in local Docker (no `auth` schema)
- [ ] RLS policies verified working against Supabase (not local Docker)

## Tasks

| # | Task | Issues | Effort | Executor |
|---|------|--------|--------|----------|
| S1.1 | Extract `GymService` from `GymController` | H-001 | 4h | @dev |
| S1.2 | Add DTO layer (`WorkoutDTO`, `ExerciseDTO`, `SupplementDTO`) | H-002 | 3h | @dev |
| S1.3 | Migrate `Exercise.workoutId` → `@ManyToOne(LAZY)` + `@JoinColumn` | H-003 | 2h | @dev |
| S1.4 | Add `@Valid` + constraint annotations to all controllers | H-004 | 2h | @dev |
| S1.5 | Add `@ControllerAdvice` global exception handler (`ProblemDetail`) | M-001 | 3h | @dev |
| S1.6 | Add `starter-security` + `oauth2-resource-server` to `pom.xml` | C-003 | 30 min | @dev |
| S1.7 | Write `JwtAuthFilter` — Supabase JWT → `userId` in SecurityContext | C-003 | 4h | @dev |
| S1.8 | Write `SecurityConfig` — protect all `/api/**` | C-003 | 2h | @dev |
| S1.9 | Update all repository queries: `findByUserId(userId)` everywhere | C-001, ADR-006 | 2h | @dev |
| S1.10 | Scaffold Vite 5 project | H-005 | 1h | @dev |
| S1.11 | Configure Tailwind + design tokens | H-005 | 2h | @dev |
| S1.12 | Integrate `@supabase/supabase-js` — `supabaseClient.ts` | C-006 | 1h | @dev |
| S1.13 | Build `LoginPage` + `SignupPage` (AuthForm organism) | C-006 | 4h | @dev |
| S1.14 | Add React Router + `ProtectedRoute` | C-006 | 2h | @dev |
| **S1.15** | **SplashScreen + auth loading state in `App.tsx`** | H-012 | 1h | @dev |
| **S1.16** | **`GymLayout.tsx` stub** | — | 30 min | @dev |
| **S1.17** | **`GymPage.tsx` placeholder** | — | 30 min | @dev |
| **S1.18** | **Configure Supabase Auth `Site URL` + `Redirect URLs`** | H-013 | 15 min | @dev |
| **S1.19** | **Document JWT localStorage decision in `frontend-spec.md`** | M-014 | 15 min | @dev |
| S1.20 | Write integration tests (Testcontainers + MockMvc + JWT mock) | M-002 | 4h | @dev |
| S1.21 | Provision Supabase + apply V7 migration (FK to `auth.users`) | — | 2h | @dev + @data-engineer |

## Exit Gate

All 6 checks must pass before Sprint 2 begins.

```
□ GET /api/gym/workouts without Authorization header → 401
□ Application boots against Supabase PostgreSQL (V7 migration applied)
□ No login-page flash on reload for authenticated user (SplashScreen active)
□ Two-account isolation test passes (5 assertions — see below)
□ Supabase Auth Site URL configured — email verification link works on mobile
□ Vite dev server runs at localhost:5173, renders GymPage placeholder after login
□ ./mvnw test passes (all 6 integration test cases)
```

**Two-Account Isolation Test Procedure:**
```
1. Signup user-A (test-a@example.com), login, POST workout "Treino A", add 2 exercises
2. Signup user-B (test-b@example.com), login, POST workout "Treino B", add 2 exercises
3. As user-B: GET /api/gym/workouts → response must NOT contain "Treino A"
4. As user-B: DELETE /api/gym/workouts/{user-A-workout-id} → must return 404
5. As user-A: GET /api/gym/workouts → response must NOT contain "Treino B"
Cleanup: Delete both test accounts from Supabase Auth dashboard
```

## Quality Gate Checklist

- [ ] @architect reviews `SecurityConfig` — no endpoint accidentally left unprotected
- [ ] @architect reviews `JwtAuthFilter` — JWT validation errors return 401 not 500
- [ ] @architect validates `findByUserId` coverage — grep confirms no `findAll()` in service classes
- [ ] Integration test suite covers all 6 minimum cases
- [ ] Two-account isolation test executed manually and documented in this story

## Risks

| Risk | Mitigation |
|------|-----------|
| Supabase JWKS endpoint rate limiting | Cache JWKS locally — Spring Security does this by default |
| V3 `user_id` is nullable — existing data has no user_id | Sprint 1 only: first login assigns `user_id` to orphaned rows via a data migration or admin script |
| OQ-01/02/03/07 unresolved delays Sprint 1 | Lucas must answer these before S1.12, S1.18, and S1.21 |

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-05-07 | Story created from Brownfield Discovery Phase 10 | Morgan (@pm) |
