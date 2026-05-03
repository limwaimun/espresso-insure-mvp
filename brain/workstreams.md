# Workstreams

> The Brain rotates evenly across these 4 workstreams. Each tick is assigned ONE active workstream by tick index modulo 4. Brain proposals must come from the active workstream — UNLESS the active workstream has nothing pressing AND a security or token-drain anomaly is detected.
>
> If no work is genuinely needed in the assigned workstream, Brain returns [] and rotation moves on next tick. No busywork.

---

## Workstream 0 — Marketing site (espresso.insure)

**Goal:** Convert IFAs visiting espresso.insure into trial signups via /api/trial.

**Done-criteria:** Marketing site converting at least X% of qualified visitors. Copy reflects current product reality (verify against code). Page load fast on mobile. SEO basics in place.

**In scope:** Landing page copy, hero/features sections, pricing page, blog, SEO metadata, Open Graph tags, page speed, conversion tracking.

**Out of scope:** Pricing strategy itself (Wayne's call), brand identity changes.

---

## Workstream 1 — FA app (Espresso product)

**Goal:** IFA users get measurable time savings from using the app every week. Existing refactoring backlog is closed.

**Done-criteria:** All known-broken or hidden features either exposed correctly in UI or removed. No "shadow features". Refactor backlog at zero. Onboarding flow gets new IFA to first client imported in one session.

**In scope:** Dashboard pages, client/policy/holding flows, import flows, claim flow (the "Create claim" button is a known gap), onboarding, billing UI, IFA-facing copy.

**Out of scope:** Any change to data ownership/auth model without explicit approval. Adding new tables without explicit approval.

**Known refactor/UI backlog (verify each before working):**
- "Create claim" button missing from UI. The claim-update route exists; claim creation flow either unbuilt or hidden.

---

## Workstream 2 — AI agents

**Goal:** Each agent (Maya, Relay, Scout, Sage, Compass, Atlas, Lens, Harvester, WhatsApp webhook) delivers weekly value and is hardened against abuse. New agents added when there is clear IFA demand.

**Done-criteria:** Every agent has its prompt under version control with eval cases. Every agent invocation has a per-IFA rate limit and structured logs. Token-drain attacks detected and contained. New agent additions (e.g. medical agent) follow the same security pattern from day one.

**In scope:** Agent prompt improvements, eval cases, new agent scaffolding, rate limiting, observability on agent calls, agent-routing logic.

**Out of scope:** Changing the auth model for agent endpoints without approval.

---

## Workstream 3 — Admin dashboard

**Goal:** Wayne can see app and agent usage at a glance. Anomalies surface before they become problems.

**Done-criteria:** Daily active IFAs, agent invocation counts per agent, error rates per route, token spend per IFA, top-N expensive callers — all visible in one dashboard. Alerts fire for anomalies.

**In scope:** Admin-only dashboard pages, metrics aggregation queries, alerting, internal-only routes, observability tooling.

**Out of scope:** Exposing this data to IFAs themselves. PII display in admin must follow least-privilege.

---

## Cross-cutting: security and token-drain protection

Standing concern across all workstreams. EVERY tick, the Brain checks the security probe in system_state. If anomalies are present, the Brain may propose security work in addition to or instead of the rotated workstream.

**Auto-approval rules for security work:**
- Logging/metrics additions on AI/auth endpoints (no behavior change) → auto-approve.
- Rate limit changes, route hardening, auth changes → ALWAYS human-gated.
- New API key rotation, secret changes → ALWAYS human-gated.
