# My-Hubs — Technical Debt Report

**Prepared by:** Atlas (Analyst Agent) — Phase 9 Executive Awareness Report  
**Date:** 2026-05-07  
**Audience:** Project Owner (Lucas)  
**Source:** `docs/prd/technical-debt-assessment.md` (FINAL — 7 discovery phases, QA-approved)

---

## What This Report Is

This report translates the findings of a full technical audit of My-Hubs into plain language.

The audit was conducted over 8 phases by four specialist agents: system architecture, database design, UX/frontend, and quality assurance. The result is a concrete remediation plan that takes the app from a personal single-user tool to a system that can safely serve multiple users.

---

## The One-Sentence Finding

**My-Hubs works perfectly for you today. It cannot safely serve a second user tomorrow.**

Every piece of data in the system — workouts, exercises, supplement goals, fuel records, tasks — belongs to a single global pool. There is no concept of "this is Lucas's data" versus "this is a friend's data." If a second user were invited today, they would see all of your data, and you would see all of theirs.

This is not a minor bug. It is a structural characteristic of how the system was originally built — and it is entirely fixable with a planned, methodical approach.

---

## Current State vs Target State

| What It Is Today | What It Needs to Become |
|---|---|
| Personal tool for one person | Shared app for 2–10 people (friends + you) |
| No login — anyone with access can see everything | Secure login (email + password) via Supabase Auth |
| Data shared globally | Each user sees only their own data |
| Runs only on your local machine | Deployed to the internet (cloud) |
| Database structure managed automatically | Database changes tracked, versioned, and reversible |
| React app loads 4MB of libraries from the internet | Optimized app (~200KB) built and deployed properly |

---

## Why This Matters Now

You are at an inflection point. The Gym Hub module is ready to be shared with real users. But sharing it in its current state would be a data privacy incident waiting to happen — not because of a coding error, but because the data model was never designed for multiple users.

The good news: the core application logic is solid. The gym features work. The data model just needs user identity added to it. This is well-understood engineering with a clear, low-risk execution path.

---

## Risk Summary

The three highest risks if the system goes to multiple users without remediation:

| Risk | What Happens | Likelihood |
|---|---|---|
| **Data exposure** | User B can read and modify User A's workouts, exercises, and supplement goals | Certain — happens on first login |
| **Data collision** | Second user trying to set a supplement goal crashes the app — only one goal can exist system-wide | Certain — happens immediately |
| **Credentials in source code** | Database passwords are stored in the code files — if the code becomes public, the database is exposed | Currently low risk (private repo), but must be fixed before cloud deployment |

---

## The Remediation Plan — 4 Sprints

The full audit produced a 4-sprint plan. Each sprint has clear entry and exit conditions. Nothing moves to the next sprint until the current sprint's exit gate passes.

**Estimated total:** ~8–10 weeks of focused part-time development.

---

### Sprint 0 — Security & Schema Foundations
**Goal:** Make the database safe to use with multiple users.  
**Duration:** ~2 weeks  
**Nothing ships to users until this sprint is complete.**

**What gets done:**
- Git version control initialized (before anything else)
- Database passwords moved out of code files into a secure configuration
- Database schema changes tracked and versioned (so changes can be reviewed and rolled back)
- User identity (`user_id`) added to all data tables — workouts, exercises, fuel records, tasks, and notes
- The supplement goal table redesigned so each user can have their own (removing the "only one goal can exist" limitation)
- Database access rules (Row Level Security) enabled on all tables — the database itself enforces that users can only touch their own data
- Database backup taken before any changes begin

**What you will have at the end:**  
A database that knows who owns what, with version-controlled migrations you can roll back if anything goes wrong. The app still does not have a login screen yet — that is Sprint 1.

---

### Sprint 1 — Authentication + Backend Refactor
**Goal:** Make the app require login and correctly enforce data ownership.  
**Duration:** ~2–3 weeks  
**This sprint delivers the first version that can be safely shared.**

**What gets done:**
- Login and signup screens built
- Every API endpoint protected — requests without a valid login token are rejected
- Backend updated so every data query is filtered by the requesting user's identity
- Vite build system set up (replacing the current CDN-based approach — this makes the app faster and proper to deploy)
- A splash screen added to prevent a brief flash of the login page when a logged-in user refreshes
- Supabase Auth configured so email verification links work on mobile
- Integration tests written to verify that user data isolation works correctly

**What you will have at the end:**  
A working login system. You and a friend can each create accounts and see only their own data. The Gym Hub is functional but not yet visually complete in the new build system — that is Sprint 2.

---

### Sprint 2 — Gym Hub MVP Parity
**Goal:** The Gym Hub in the new build system looks and behaves identically to the current version.  
**Duration:** ~2 weeks

**What gets done:**
- All existing gym screens (workout selector, exercise cards, supplement tracker) migrated to the new build system
- Data connections updated to use the authenticated user's identity
- The app now loads in ~200KB instead of ~4MB
- Old CDN version (`gym/index.html`) deleted after a 41-item visual parity checklist passes
- Database data type fixes (monetary values stored with proper precision)

**What you will have at the end:**  
The Gym Hub is fully functional in the new stack, fast to load, and ready for real users. Fuel and Productivity hubs remain on the old stack until a separate decision is made.

---

### Sprint 3 — Polish, Quality & Observability
**Goal:** Production-grade reliability and user experience finishing.  
**Duration:** ~2 weeks

**What gets done:**
- Accessibility compliance (WCAG 2.1 AA) — proper contrast, touch targets, keyboard navigation
- iOS Safari keyboard zoom fix (input font sizes)
- Workout ordering field added
- Error monitoring (Sentry) integrated for both backend and frontend — when something breaks in production, you will know about it
- API versioning added (`/api/v1/`) for future compatibility
- Performance audit: page load under 2.5 seconds on a 4G mobile connection

**What you will have at the end:**  
A production-quality app you can confidently share with friends, with visibility into errors and performance.

---

## Sprint Timeline Summary

| Sprint | Focus | Estimated Duration | Users Can Be Invited? |
|---|---|---|---|
| **Sprint 0** | Security & Schema | ~2 weeks | No |
| **Sprint 1** | Authentication | ~2–3 weeks | **Yes — after Sprint 1 exit gate** |
| **Sprint 2** | Gym Hub Parity | ~2 weeks | Yes |
| **Sprint 3** | Polish & Observability | ~2 weeks | Yes |

---

## Issue Count by Priority

These are the 43 issues identified across the full audit:

| Priority | Count | Meaning |
|---|---|---|
| **CRITICAL** | 7 | System cannot be safely shared until these are resolved — Sprint 0/1 |
| **HIGH** | 12 | Must be addressed before inviting users — Sprint 0/1 |
| **MEDIUM** | 14 | Important quality improvements — Sprint 1/2 |
| **LOW** | 6 | Polish and nice-to-haves — Sprint 3+ |
| **Future** | 1 | Workout history tracking — not required for launch |

The 7 CRITICAL items all come back to the same root cause: no user identity in the system. Fixing C-001 (add `user_id` to data tables) and C-007 (enable database access rules) resolves the core exposure. The remaining critical items are the necessary steps to enable those two.

---

## Four Questions You Must Answer Before Sprint 1

These decisions cannot be made by the development team — they depend on your goals and preferences. Sprint 1 planning is blocked until all four are resolved.

| # | Question | Why It Matters |
|---|---|---|
| **OQ-01** | Where will the Gym Hub frontend be hosted? (e.g., Vercel, Netlify, or same server as backend) | Affects how the login and email verification links are configured |
| **OQ-02** | Which Supabase region? (São Paulo is recommended for a Brazilian user base) | Database location affects response time for all users |
| **OQ-03** | Login method: email + password only, or also Google login? | Determines scope of the login screen and what needs to be configured |
| **OQ-07** | Where will the Spring Boot backend be hosted? (e.g., Railway, Render, Fly.io) | Needed to configure CORS and finalize Sprint 1 deployment |

---

## What the Architecture Will Look Like After Remediation

**Today:** Local Java app + local database + CDN-loaded React app (all on your machine)

**After Sprint 1:**
```
User's browser → Supabase Auth (login) → Vite React app → Spring Boot API → Supabase PostgreSQL
```
- Every request carries a signed login token
- Backend verifies the token and filters all data to the requesting user
- Database has a second layer of defense via Row Level Security

**After Sprint 2:** The full Gym Hub is live in the new stack, CDN version gone, bundle ~200KB.

**After Sprint 3:** Production-grade monitoring, accessibility compliance, and performance targets met.

---

## Technology Decisions Already Made

These decisions were validated across all discovery phases and do not need to be revisited:

| Decision | What Was Chosen | Why |
|---|---|---|
| Cloud database | **Supabase** (over Firebase) | Works natively with the existing Java/PostgreSQL setup — no redesign needed |
| Frontend build system | **Vite 5** (over keeping CDN approach) | Correct tooling for a production app; enables proper deployments and optimized bundles |
| Design system | **Custom** (over component libraries) | The existing glass-morphism gym aesthetic would require more work to override a library than to keep the custom approach |
| JWT storage | **Browser localStorage** | Accepted risk for this app's scale and user base — documented and can be revisited if the app grows significantly |
| Spring Boot data access | **Service role + app-layer filtering** | Spring Boot connects to Supabase as a service account that bypasses Row Level Security — the app code itself must enforce user filtering, with RLS as a backup layer |

---

## Scope Boundaries

**In scope for this remediation:**
- Gym Hub module — full production readiness
- Security and schema foundations apply to all modules (Fuel, Productivity, Gym)
- Authentication applies to all modules

**Not in scope (separate decision):**
- Fuel Hub and Productivity Hub feature migration to Vite
- Workout session history (future feature)
- Progressive Web App (installable on home screen)
- Public access or user self-registration beyond invited friends

---

## Summary

My-Hubs is a well-built personal tool that needs one foundational change to become a shared app: every piece of data needs to know who it belongs to. That change has been fully planned, sequenced, and validated. The path is clear, the risks are understood, and the first sprint that can safely accept new users is Sprint 1 — approximately 4–5 weeks from the start of Sprint 0.

The Gym Hub will be the first externally deployed module. Once Sprint 1 exits, you can invite the first user.

---

*Executive Awareness Report — Brownfield Discovery Phase 9.*  
*Source: `docs/prd/technical-debt-assessment.md` (FINAL, 2026-05-07)*  
*Next: Phase 10 — @pm Epic + Stories (execution planning)*
