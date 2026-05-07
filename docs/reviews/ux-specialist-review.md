# UX Specialist Review — Brownfield Discovery Phase 6

**Version:** 1.0  
**Author:** Uma (UX Design Expert Agent)  
**Date:** 2026-05-07  
**Reviewer:** @ux-design-expert  
**Documents Reviewed:**
- `docs/frontend/frontend-spec.md` (Phase 3 — Uma)
- `docs/prd/technical-debt-DRAFT.md` (Phase 4 — Aria)
- `docs/reviews/db-specialist-review.md` (Phase 5 — Dara)

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-05-07 | 1.0 | UX specialist review — Brownfield Discovery Phase 6 | Uma (@ux-design-expert) |

---

## Overall Verdict

**APPROVED WITH CONDITIONS**

The `frontend-spec.md` and consolidated PRD are sound. The component architecture, design token system, migration path, and sprint allocation are all correct. Four conditions must be addressed before implementation — two are UX continuity gaps in the sprint plan, one is an auth flow implementation detail that affects first-run user experience, and one is a critical interaction missing from the parity test checklist.

---

## Validation Responses — Aria's 4 Questions

### Q1: Does Sprint 1 / Sprint 2 split make UX sense?

**Status: APPROVED WITH MINOR CORRECTION**

The split is architecturally sound but creates a **UX continuity gap in Sprint 1**: auth works, but the Gym route renders nothing useful. A user who logs in successfully sees a blank `/gym` page — not even a loading state.

**Current Sprint 1 state:**
```
Login → ✓ Supabase auth → /gym route → ??? (GymPage.tsx not built yet)
```

**The fix (low effort):** Sprint 1 should include a `GymPage` placeholder — not the full exercise list, just a skeleton layout with the correct background, header, and content area. This:
1. Proves the auth-to-protected-route flow end-to-end
2. Gives the developer a visual confirmation that JWT propagation works
3. Prevents the "white screen after login" regression when Sprint 2 lands the real component

**Recommended Sprint 1 addition (S1.16):**
```tsx
// GymPage.tsx — Sprint 1 placeholder (replaced in Sprint 2)
export default function GymPage() {
  const { user } = useSupabaseAuth()
  return (
    <GymLayout>
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <Loader2 className="animate-spin mb-3" />
        <p className="text-sm">Gym Hub is coming in Sprint 2</p>
        <p className="text-xs mt-1">{user?.email}</p>
      </div>
    </GymLayout>
  )
}
```

This is ~10 lines and unblocks end-to-end auth validation.

**Zero-logic copy timing:** The frontend spec says component extraction (Step 2 — pure JSX → .tsx copy) should happen in Sprint 2. This is correct. Mixing extraction with Sprint 1's auth scaffolding would create a diff that's hard to review and risks accidentally coupling the Supabase hook changes with the CDN-parity work. Keep them separate.

---

### Q2: Are 52px touch targets consistent with glass card height constraints?

**Status: APPROVED — with one layout clarification**

The 52px minimum on exercise inputs is correct and does not conflict with the glass card layout. Verification:

**Card height calculation (with 52px inputs):**

```
ExerciseCard internal layout:
  ┌──────────────────────────────────┐
  │  p-4 (16px top)                  │
  │  Exercise name   ─── ~28px       │
  │  gap-2           ─── 8px         │
  │  [Weight] [Reps] ─── 52px        │  ← min-h-[52px] inputs
  │  gap-2           ─── 8px         │
  │  RPE badge row   ─── 28px        │
  │  p-4 (16px bottom)               │
  └──────────────────────────────────┘
  Total: 16 + 28 + 8 + 52 + 8 + 28 + 16 = 156px per card
```

**Screen real estate (iPhone 14, 844px):**
```
Top safe area:     ~50px
Header:            56px
WorkoutSelector:   56px
Available content: 844 - 50 - 56 - 56 - 64 (bottom nav) = 618px
Cards visible:     618 / (156 + 12 gap) = ~3.7 cards
```

3–4 cards visible before scrolling is the right density for a workout log. Users see enough to confirm their workout structure without feeling cramped.

**One layout clarification:** The `min-h-[52px]` applies to inputs only — NOT to the card. The card height must be `h-auto` (intrinsic) so it doesn't collapse on cards with optional fields (RPE, `canIncreaseNext` badge). Confirm `ExerciseCard` uses `flex flex-col` with no fixed height on the outer container.

**Mid-workout note:** 52px is correct specifically because users are logging with one hand between sets. The extra 8px over the standard 44px minimum significantly reduces missed taps on weight fields when hands are sweaty or shaking.

---

### Q3: Parity test checklist for CDN → Vite validation (Sprint 2 S2.5)

**Status: DEFINED — Required before deleting gym/index.html**

This checklist did not exist in the PRD. It must be completed by a human tester (the developer) before Step 7 (deletion of `gym/index.html`). Run both versions side-by-side (CDN on port 8080, Vite on port 5173).

---

**GYM HUB PARITY CHECKLIST — CDN vs Vite**

**Section A — Data Loading**
- [ ] A1: Workouts load on page mount (all splits visible as tabs)
- [ ] A2: Exercises load for the default-selected workout split
- [ ] A3: Exercises load correctly when switching workout tabs
- [ ] A4: Supplement goals load (whey + creatine toggle state matches DB)
- [ ] A5: Empty state renders correctly when user has no workouts
- [ ] A6: Page renders correctly when a workout has 0 exercises

**Section B — Optimistic Updates (Critical)**
- [ ] B1: Changing weight field — value updates instantly on keypress (no lag)
- [ ] B2: Background save fires on blur (check Network tab: PUT request to Supabase)
- [ ] B3: Changing reps field — same instant update + background save
- [ ] B4: RPE change — instant update + background save
- [ ] B5: Network error during save — UI rolls back to previous value + error toast shows
- [ ] B6: Multiple rapid edits (tab through weight → reps → RPE) — all saves complete, no race condition

**Section C — Workout Management**
- [ ] C1: Create new workout — tab appears immediately after save
- [ ] C2: New workout name validated — cannot submit empty name
- [ ] C3: Switch workout tab — exercise list updates to correct workout's exercises
- [ ] C4: Delete workout — confirmation dialog appears
- [ ] C5: Confirm delete — workout tab removed, exercises deleted (no orphans)
- [ ] C6: Cancel delete — nothing changes

**Section D — Exercise Management**
- [ ] D1: Tap "Add Exercise" — sheet slides up from bottom
- [ ] D2: All fields present (name, weight, reps, RPE)
- [ ] D3: Submit with all fields — exercise appears in list immediately
- [ ] D4: Submit with empty name — validation error shown, no save
- [ ] D5: Delete exercise — exercise removed from list
- [ ] D6: `canIncreaseNext` toggle — badge updates immediately

**Section E — Supplement Tracker**
- [ ] E1: Whey toggle — changes state immediately, saves to DB
- [ ] E2: Creatine toggle — same
- [ ] E3: Toggle off — state reverts correctly
- [ ] E4: Page reload — toggle state persists (reads from DB, not local state)

**Section F — Visual Parity**
- [ ] F1: Background color matches (slate-950)
- [ ] F2: Glass card appearance matches (blur, border opacity)
- [ ] F3: gym-gradient applied correctly to header and buttons
- [ ] F4: Inter font renders (not fallback sans-serif)
- [ ] F5: RPE badge colors correct (green/yellow/red by value)
- [ ] F6: `canIncreaseNext` emerald badge renders
- [ ] F7: Bottom padding sufficient (content not hidden behind future bottom nav)

**Section G — Mobile Behaviour**
- [ ] G1: Numeric keyboard opens on weight field (iOS + Android)
- [ ] G2: Text keyboard opens on exercise name field
- [ ] G3: Horizontal scroll works in WorkoutSelector if >3 tabs
- [ ] G4: No horizontal overflow on main content area
- [ ] G5: Page does not zoom on input focus (iOS: `font-size >= 16px` on inputs)

**Section H — Performance**
- [ ] H1: Lighthouse Performance score ≥ 80 on mobile simulation
- [ ] H2: Initial JS bundle ≤ 200KB gzipped (check Network tab)
- [ ] H3: CSS ≤ 8KB gzipped (Tailwind purged)
- [ ] H4: No `@babel/standalone` in Network requests
- [ ] H5: No `cdn.tailwindcss.com` in Network requests
- [ ] H6: LCP ≤ 2.5s on simulated 4G (Chrome DevTools → Network throttling)

**PASS CRITERIA:** All Section A–G items checked. Section H minimum: H1–H5 checked. H6 is a target, not a blocker.

**DELETION GATE:** `gym/index.html` may only be deleted after this checklist is 100% complete.

---

### Q4: Is BottomTabBar correctly placed in Sprint 2?

**Status: APPROVED — with one Sprint 1 addition**

BottomTabBar in Sprint 2 is correct. Gym Hub is functional without cross-module navigation — users can log in, manage workouts, and log exercises entirely within `/gym`. The bottom nav is additive.

**One Sprint 1 addition required:** The `GymLayout` template component (which wraps the bottom nav space) should be built in Sprint 1, even as a stub. This ensures:
1. The GymPage placeholder (recommended in Q1) has the correct padding and background
2. The auth-protected route renders the right shell layout
3. Sprint 2's component extraction immediately has the correct layout wrapper to slot into

```tsx
// components/layout/GymLayout.tsx — Sprint 1 stub
export function GymLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950">
      <main className="max-w-md mx-auto px-4 pb-[calc(64px+env(safe-area-inset-bottom))]">
        {children}
      </main>
      {/* BottomTabBar slot — populated in Sprint 2 */}
    </div>
  )
}
```

This is a 10-line stub. BottomTabBar itself (the navigation component with active states and tab icons) lands in Sprint 2 as planned.

---

## Additional Findings

### UX-R-001: Auth Session Persistence — Flash of Unauthenticated State (HIGH)

**Not in frontend spec or PRD.** Requires Sprint 1 implementation.

When a returning user opens the app, Supabase JS SDK restores the session from localStorage asynchronously. During the async restore (~100–300ms), the auth state is `null`, causing:
- React Router redirects to `/login` (auth guard fires)
- Session loads → redirects back to `/gym`
- User sees a flash of the login page on every app open

This is a well-known SPA auth pattern bug. Fix in Sprint 1:

```tsx
// App.tsx — Sprint 1
export default function App() {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <SplashScreen /> // ← prevents flash

  return (
    <Routes>
      <Route path="/login" element={!session ? <LoginPage /> : <Navigate to="/gym" />} />
      <Route path="/gym" element={session ? <GymPage /> : <Navigate to="/login" />} />
    </Routes>
  )
}
```

`SplashScreen` is a dead-simple full-screen dark background with the GYMHUB wordmark — takes < 1 hour to build. Prevents the jarring login flash on every app open.

---

### UX-R-002: JWT Storage — localStorage vs httpOnly Cookie (MEDIUM)

Dara's DB review recommends httpOnly cookies for JWT storage. From the UX and implementation perspective:

**Supabase JS SDK default:** localStorage. Session persists across browser restarts. Vulnerable to XSS (if an XSS attack runs, it can read the JWT).

**httpOnly cookie:** Requires a server-side session endpoint to set the cookie. Spring Boot would need to receive the Supabase JWT from the frontend, validate it, and set a `Set-Cookie` header. This adds backend complexity.

**Recommendation for this project:** Use **localStorage** (Supabase SDK default). Rationale:
- This is a personal app for close friends, not banking/health data
- XSS risk is minimal in a controlled Vite/React app with no user-generated HTML rendering
- The additional backend complexity of httpOnly cookies is not justified at this scale
- Spring Boot validates the JWT on every request regardless — compromise of the JWT grants API access only, not Spring Boot server access

**Action:** Document this decision explicitly in `frontend-spec.md` as a security trade-off note. Revisit if the app ever handles sensitive health data or expands to unknown users.

---

### UX-R-003: Supabase Auth redirectTo Configuration (HIGH)

**Affects Sprint 1 completion criteria.** Not in PRD.

When a new user signs up with email+password, Supabase sends a verification email with a confirmation link. That link's `redirectTo` URL must point to the production frontend domain — not localhost.

If this is not set before any user is invited:
- User clicks email link → redirected to `http://localhost:5173/gym` → fails to open on their device

**Required:** Supabase Auth > URL Configuration > `Site URL` and `Redirect URLs` must be set before sending any invites. This depends on OQ-01 (deploy target). **OQ-01 must be resolved before Sprint 1 ends.**

Add to Sprint 1 exit gate:
- [ ] Supabase Auth `Site URL` configured to production domain (or localhost for developer self-testing)
- [ ] `Redirect URLs` includes `http://localhost:5173/**` (dev) and production URL

---

### UX-R-004: Input Font Size — iOS Zoom Prevention (MEDIUM)

**Missing from accessibility spec in frontend-spec.md.**

iOS Safari automatically zooms the viewport when a user taps an input with `font-size < 16px`. This is a known mobile UX anti-pattern that breaks the layout for the duration of the session.

The current token `Body: Inter 500 · 0.875rem` (14px) on inputs triggers this zoom.

**Fix:** Apply `text-base` (16px) specifically to input elements while keeping body text at 14px elsewhere:

```tsx
// Input atom — correct sizing
<input
  className="text-base min-h-[52px] bg-slate-800 ..."  // text-base = 16px → no iOS zoom
  inputMode="decimal"
  ...
/>
```

This applies to: weight inputs, reps inputs, RPE inputs, exercise name input, auth form inputs.

**Add to `frontend-spec.md` Section 7.9** (Input Handling) and to the `Input` atom spec in Section 5.

---

### UX-R-005: Workout Tab Overflow — Missing Scroll Indicator (LOW)

The frontend spec defines WorkoutSelector as `snap-x scroll` when tabs overflow. But there is no visual indicator that the tab bar is scrollable — users won't know to swipe left if they have 4+ workout splits.

**Fix:** Add a right-edge gradient fade when overflow is detected:

```tsx
// WorkoutSelector — overflow indicator
<div className="relative">
  <div className="flex overflow-x-auto snap-x scrollbar-hide" ref={scrollRef}>
    {workouts.map(w => <WorkoutTab key={w.id} ... />)}
  </div>
  {hasOverflow && (
    <div className="absolute right-0 top-0 h-full w-8
                    bg-gradient-to-l from-slate-900 to-transparent
                    pointer-events-none" />
  )}
</div>
```

This is a P2 polish item but should be documented as a known gap before Sprint 3.

---

## Sprint Plan Corrections

### Sprint 1 — Additions

| # | Addition | Reason | Effort |
|---|---|---|---|
| S1.16 | `GymPage.tsx` placeholder (skeleton layout) | Proves auth-to-protected-route flow end-to-end | 30 min |
| S1.17 | `GymLayout.tsx` stub (shell with correct padding) | Needed for placeholder; Sprint 2 extension | 30 min |
| S1.18 | `SplashScreen` component + auth loading state | Prevents login flash on session restore | 1h |
| S1.19 | Supabase Auth `Site URL` + `Redirect URLs` configuration | Required before any user invite | 15 min |
| S1.20 | Document JWT storage decision (localStorage) in frontend-spec.md | Security trade-off transparency | 15 min |

**Sprint 1 revised exit gate additions:**
- [ ] No login-page flash on page reload (returning user goes straight to `/gym`)
- [ ] Supabase Auth `Site URL` configured (unblocks OQ-01 dependency)

### Sprint 2 — Parity Test Checklist Added

Sprint 2 task S2.5 (`*validate parity*`) must use the checklist defined in Q3 above. Update the PRD to reference `docs/reviews/ux-specialist-review.md#parity-checklist` for the full checklist.

Add to Sprint 2 exit gate:
- [ ] All parity checklist sections A–G: 100% checked
- [ ] Section H (performance): H1–H5 checked
- [ ] `gym/index.html` deletion only after gate passes

### Sprint 3 — Additions

| # | Addition | Source |
|---|---|---|
| S3.8 | Add workout tab overflow gradient indicator | UX-R-005 |
| S3.9 | Audit all input `font-size` for iOS zoom prevention | UX-R-004 |

---

## Issue Register Delta

| ID | Severity | Finding | Sprint |
|---|---|---|---|
| UX-R-001 | HIGH | Flash of unauthenticated state on session restore — fix with SplashScreen + `getSession()` | Sprint 1 |
| UX-R-002 | MEDIUM | JWT localStorage vs httpOnly cookie trade-off — document explicitly | Sprint 1 |
| UX-R-003 | HIGH | Supabase Auth `redirectTo` URL must be configured before any user invite | Sprint 1 |
| UX-R-004 | MEDIUM | Input `font-size < 16px` triggers iOS viewport zoom | Sprint 3 |
| UX-R-005 | LOW | WorkoutSelector overflow has no visual scroll indicator | Sprint 3 |

---

## Final Verdict

| Question | Status |
|---|---|
| Q1: Sprint split UX-valid? | **APPROVED** — add GymPage placeholder to Sprint 1 |
| Q2: 52px targets consistent with cards? | **APPROVED** — confirmed compatible; clarify `h-auto` on card |
| Q3: Parity test checklist? | **DEFINED** — 41-item checklist across 8 sections |
| Q4: BottomTabBar in Sprint 2? | **APPROVED** — add GymLayout stub to Sprint 1 |

**Overall: APPROVED WITH CONDITIONS.** All 5 new items (UX-R-001 through UX-R-005) should be reflected in the final assessment. UX-R-001 and UX-R-003 are Sprint 1 items and should be added to the implementation checklist before any user is invited.

The frontend-spec.md itself is complete and accurate. No changes to the component architecture, design tokens, migration path, or accessibility spec are needed.

---

*Review generated as part of Brownfield Discovery Phase 6.*  
*Next: Phase 7 — @qa QA Gate review → Phase 8 — @architect Final Assessment*
