# Espresso — Vision, Mission, Objectives

> The Brain reads this every tick. Edit freely. This is the source of truth for what the Brain should and shouldn't propose.

## Vision
The default back-office for every Independent Financial Adviser in Singapore — and eventually Asia.

## Mission
Free IFAs from administrative drag so they can spend more time with clients. Replace the spreadsheet, the PDF folder, and the manual reminder with a single intelligent platform.

## Active workstreams (rotated evenly each tick)
1. **marketing** — espresso.insure marketing site. Conversion to trial, clarity of positioning, IFA trust signals.
2. **fa_app** — espresso-mvp.vercel.app, the IFA-facing product. Includes refactoring backlog and security hardening.
3. **agents** — building new in-product agents (e.g. medical agent) and improving existing ones (Maya, Relay, Scout, Sage, Compass, Atlas, Lens, Harvester, WhatsApp webhook).
4. **admin_dashboard** — internal admin views tracking app usage, agent performance, IFA activity.

## Strategic objectives — current quarter
1. **Trust** — zero data security incidents. Every API route session-verified. Every action audit-trailed.
2. **Activation** — IFAs who sign up reach "first client imported" within their first session.
3. **Agent value** — each in-product agent delivers weekly value the IFA notices and would miss if removed.
4. **Compliance readiness** — documentation, audit trails, and access controls ready for MAS scrutiny on demand.
5. **Cost containment** — Anthropic/infra spend protected from token-drain attacks and runaway agent loops.

## Out of scope
- Direct-to-consumer features
- Insurer-side tools (we are IFA-side only)
- Markets outside Singapore until SG dominance is undeniable
- Mobile native apps until web product is fully matured

## Known backlog (verify before building)
- "Create claim" button missing from UI. Claim-update route exists; creation is unbuilt or hidden.
- **Admin LLM selector**: admin should be able to choose which LLM powers each AI agent via dropdown in admin dashboard. Belongs in `agents` + `admin_dashboard` workstreams. Requires: per-agent model config (DB row or env), admin UI dropdown, runtime model resolver. NOT blocking.
- (Add new items here. Remove when done.)

## Operating principles
- Small, reversible changes beat big launches.
- Verify against code before describing features. Don't assume features that "should" exist actually do.
- High-risk = anything touching policies, holdings, claims, billing, PII, or auth. Always human-gated.
- Brain proposes. Wayne approves substantial work. Elon executes. Verifier confirms.
- When uncertain about priorities or trade-offs, the Brain asks Wayne via a multiple-choice question rather than guessing.

## Agent design principles (read this before proposing any agent work)
- **Small, single-purpose agents.** Each agent owns ONE job and does it well. Resist the temptation to bolt new responsibilities onto existing agents — propose a new agent instead.
- **Minimal task surface per agent.** When proposing changes to an existing agent, prefer trimming its scope over expanding it. If an agent's prompt or responsibilities are growing, that's a signal to split it, not to grow it further.
- **New agents need a clear job spec before being built.** Title, single primary responsibility, inputs, outputs, success criteria. No multi-purpose Swiss army agents.
- **More agents is fine.** Composition beats complexity.
- **Model choice is configurable.** Don't hardcode model names in agent code; route through a per-agent config that the admin can change via dropdown (see backlog). When this exists, prefer it over hardcoded model strings.
