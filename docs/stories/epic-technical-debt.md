---
epic_id: EPIC-001
title: "Technical Debt Remediation — Multi-Tenant Launch Readiness"
status: Ready
priority: CRITICAL
owner: Lucas
created_by: Morgan (@pm) — Brownfield Discovery Phase 10
created_at: "2026-05-07"
source: docs/prd/technical-debt-assessment.md (FINAL)
executor: "@dev"
quality_gate: "@architect"
quality_gate_tools: [architecture_review, security_scan, migration_review, integration_tests]
---

# EPIC-001 — Technical Debt Remediation: Multi-Tenant Launch Readiness

## Epic Goal

Transform My-Hubs from a single-user local tool into a multi-tenant production SaaS, starting with the Gym Hub module as the first externally deployed product. This epic resolves all 7 CRITICAL launch blockers identified in the Brownfield Discovery and establishes the security, data isolation, and UX foundations required to safely invite real users.

## Business Value

Today, My-Hubs cannot onboard a second user without a data privacy incident — every user shares every piece of data globally. This epic eliminates that blocker and delivers a production-grade Gym Hub that can be shared with friends.

**Target outcome:** A second user can create an account, log in, and see only their own workouts — with zero data leakage to or from other accounts.

## Existing System Context

- **Stack:** Java 25 + Spring Boot 3.5.13 + Maven + Spring Data JPA + Lombok + Vanilla HTML
- **Database:** PostgreSQL 16 via Docker Compose — `erp_pessoal`, 6 tables, no migration versioning
- **Frontend:** React 18 SPA via CDN in `gym/index.html` — Babel runtime transpilation, ~4MB load
- **Current state:** `ddl-auto=update`, no authentication, no user identity, no RLS, credentials in code
- **Target state:** Flyway migrations V1–V7, Supabase Auth JWT, per-user data isolation, Vite 5 build

## Scope

**IN:**
- All 7 CRITICAL items (C-001–C-007)
- All 12 HIGH items (H-001–H-013)
- All 14 MEDIUM items (M-001–M-016) in sprint sequence
- 6 LOW items (L-001–L-008) in Sprint 3
- Gym Hub module only for frontend migration
- Supabase provisioning (cloud)

**OUT:**
- Fuel Hub and Productivity Hub Vite migration (separate decision — see OQ-06)
- Workout session history feature (backlog — `tb_gym_sessions`)
- PWA/installable app (separate decision — see OQ-05)
- Public user self-registration (invite-only for launch)

## Architecture Decisions in Effect

| ADR | Decision | Status |
|-----|----------|--------|
| ADR-003 | Supabase over Firebase | Confirmed |
| ADR-004 | Vite 5 frontend migration — extraction, not redesign | Confirmed |
| ADR-005 | No external component library — custom glass morphism | Confirmed |
| ADR-006 | Spring Boot uses service role + repository-level userId filtering | Confirmed |
| ADR-007 | JWT localStorage — accepted risk for this project scale | Confirmed |

## Open Questions — MUST Resolve Before Sprint 1

| # | Question | Blocking |
|---|----------|---------|
| OQ-01 | Frontend deploy target — Spring Boot static or separate host (Vercel/Netlify)? | YES |
| OQ-02 | Supabase region — `sa-east-1` (São Paulo)? | YES |
| OQ-03 | Auth providers — email+password only or add Google OAuth? | YES |
| OQ-07 | Spring Boot backend hosting target? | YES |

## Stories

| Story | Sprint | Title | Executor | Quality Gate | Priority |
|-------|--------|-------|----------|-------------|---------|
| [STORY-001](story-sprint0-security-schema.md) | Sprint 0 | Security & Schema Foundations | @dev + @data-engineer | @architect | CRITICAL |
| [STORY-002](story-sprint1-auth-backend.md) | Sprint 1 | Authentication + Backend Refactor | @dev | @architect | CRITICAL |
| [STORY-003](story-sprint2-gym-parity.md) | Sprint 2 | Gym Hub MVP Parity | @dev + @data-engineer | @architect | HIGH |
| [STORY-004](story-sprint3-polish.md) | Sprint 3 | Polish, Quality & Observability | @dev | @qa | MEDIUM |

## Dependencies

```
STORY-001 (Sprint 0) → STORY-002 (Sprint 1) → STORY-003 (Sprint 2) → STORY-004 (Sprint 3)
```

Each story is strictly sequential. No story can begin before the previous story's exit gate passes.

## Risk Matrix

| Risk | Mitigation | Story |
|------|-----------|-------|
| `ddl-auto=update` boot failure when adding `user_id NOT NULL` | Switch to `validate` + Flyway V1 baseline FIRST, before any entity change | STORY-001 S0.3/S0.4 |
| DB snapshot lost if migration fails | Take snapshot before Sprint 0 begins | STORY-001 preamble |
| Second user signup crashes (singleton id=1) | Redesign `tb_gym_supplements` + `tb_workspace_notes` in V5/V6 | STORY-001 S0.9/S0.10 |
| JDBC service role bypasses RLS | Repository-level `userId` filtering enforced at every query (ADR-006) | STORY-002 S1.9 |
| Session flash breaks first impression | SplashScreen + `getSession()` async pattern | STORY-002 S1.15 |
| Email verification links fail | Supabase Auth `site_url` + `redirectUrls` configured before any invite | STORY-002 S1.18 |
| V7 FK to `auth.users` fails in local Docker | V7 is Supabase-only — applied after Auth is provisioned, not in local Docker | STORY-001/002 |

## Definition of Done

- [ ] All 7 CRITICAL items resolved (C-001–C-007)
- [ ] All 12 HIGH items resolved (H-001–H-013)
- [ ] Sprint 0 exit gate: 5 SQL verifications passing against local Docker
- [ ] Sprint 1 exit gate: two-account isolation test (5 assertions) passing
- [ ] Sprint 2 exit gate: `gym/index.html` deleted, 41-item parity checklist 100%
- [ ] Sprint 3 exit gate: Lighthouse ≥80 mobile, WCAG AA, Sentry live
- [ ] Integration test suite passing (`./mvnw test`)
- [ ] No credentials in source code (`grep -r "lucas123" src/` → 0 results)

## Effort Estimate

| Sprint | Tasks | Estimated Duration |
|--------|-------|--------------------|
| Sprint 0 | 15 | ~2 weeks |
| Sprint 1 | 21 | ~2–3 weeks |
| Sprint 2 | 13 | ~2 weeks |
| Sprint 3 | 11 | ~2 weeks |
| **Total** | **60** | **~8–10 weeks** |

---

*Epic created by Morgan (@pm) — Brownfield Discovery Phase 10*  
*Source: `docs/prd/technical-debt-assessment.md` FINAL*  
*Next: @sm creates detailed stories from this epic*
