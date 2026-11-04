---
name: product-roadmap
description: Build or refresh a product roadmap for PubDB (pubdb-fe) — new features, pages, and content, PLUS making existing content easier to find, SEO, and improvements to features/pages that already exist — grounded in what the app already has. Writes a plain markdown ROADMAP.md at the repo root, grouped into Now/Next/Later, with each feature broken into a sequence of ~15-minute-reviewable PR steps. Use when the user asks for a roadmap, growth ideas, "what should we build next", or to update/rescope the existing roadmap. Note: PLAYGROUND_PLAN.md is a separate, existing document — don't confuse the two; this skill owns ROADMAP.md only. This is the frontend half of a two-repo project (backend: `pubdbapi`).
---

# Product roadmap

Produces (or refreshes) **`ROADMAP.md`** at the repo root for `pubdb-fe`: a Next.js 15 (App
Router, TypeScript) frontend for browsing and managing a pub database — search pubs, view details
(opening hours, amenities, beer garden info), add/edit entries. It's the frontend half of a
two-repo project; the backend/API lives in the separate `pubdbapi` repo (also on the roadmap-
rollout list) — treat data/API changes as out of scope here unless the user says otherwise, and
don't assume shared infra/feature-flag systems between the two repos.

## The business model — read this first

PubDB is a **paid API product**. Revenue comes from developers who sign up, get an API key and
buy a subscription tier (see `src/app/billing/`, `src/app/features/pricing/`, the dashboard's
usage/tier/upgrade UI, and `pubdbapi`'s `validateApiKey` / `requireTierAccess`). The public
website exists to sell that API and to grow the dataset the API serves. Pub-goers browsing the
site don't pay. They're only valuable when they improve the data or bring search traffic that
also reaches developers.

Score every roadmap item by how it moves these, in this order:

- **Paid conversion**: a free user upgrades or buys a tier (pricing clarity, upgrade nudges at
  the right moment, tier limits that show their value).
- **Developer sign-ups**: developers find PubDB and create an account ("UK pub data API"
  searches, docs, the playground, coverage showcases, sample requests).
- **Activation**: a new sign-up makes a successful API call quickly (onboarding, first key,
  copy-paste examples, a clear error when something goes wrong).
- **Retention**: paying customers stay and their usage grows (reliability, changelog, new
  fields and endpoints, usage insight).
- **Data quality**: more pubs and more complete records, because the data is the product
  (contribution prompts, edit flows, completeness nudges, contributor recognition).

A feature aimed at pub-goers only earns a place if it clearly feeds one of these, usually data
quality (visitors who fix or add pubs) or developer sign-ups (every consumer-facing page should
also show the API behind it, e.g. "get this data via the API" with the exact request). State
that link in the feature's description. Don't propose consumer features (favourites, social,
fun extras) on engagement grounds alone.

Also covers more than new features:

- **Findability and SEO for developers**: docs, pricing and coverage pages that rank for API
  and dataset searches; structured data.
- **Improving what already exists**: docs, pricing, dashboard, billing, search, pub detail and
  add/edit are all live. Extending them is often cheaper than building something new.

## Grounding the roadmap in the real app

- `README.md` — stated features: search pubs, view details, add new pubs, edit existing entries.
- `AUDIT.md` if present — don't duplicate known bugs/gaps as roadmap features.
- The API-selling surface: `src/app/docs/`, `src/app/features/` (pricing, dashboard),
  `src/app/billing/`, `src/app/register/`, the user dashboard (API keys, usage, tier badges,
  upgrade nudge). Check what exists before proposing it.
- `package.json` — Next.js, React 19, `@vercel/analytics`. Data and auth come from the
  `pubdbapi` backend over HTTP via the route handlers in `src/app/api/`.
- `src/app/` (routes), `src/hooks/`, `src/lib/`, `src/types/`, `src/constants/` — real structure
  to extend.

## Output format

Plain markdown. Write directly to `ROADMAP.md` at the repo root, overwriting the previous
version — leave `PLAYGROUND_PLAN.md` untouched, it's a separate document. Structure: intro + the
5 goal-tag lenses from the business model section (Paid conversion / Developer sign-ups /
Activation / Retention / Data quality) → PR-sequence explainer → Now/Next/Later
sections, each feature as `### N. Name — *Goal tags*` + description + numbered PR-step list →
Mise en place table (if any infra proposed) → footer `*PubDB — product roadmap, <date>*`.

## Breaking a feature into PR steps

Sequence data/logic → UI → wiring, splitting wherever a step could stand alone:

- A pure function (a filter/formatter, an API client helper in `src/lib/`) plus its unit tests
  is its own step.
- New UI is its own step, built against existing or stubbed data.
- A step needing a backend/API change belongs in `pubdbapi`, not here — note it as a dependency
  rather than writing it as a frontend PR step.
- A step needing new written content (pub descriptions, amenity copy) gets a GitHub issue via
  `mcp__github__create_issue` rather than a PR.
- No feature-flag system exists here — don't propose gating behind flags.
- If a feature is small enough that splitting produces nothing independently reviewable, write
  **"One PR."** instead.

## Notes

- Personal/small project — don't propose enterprise-scale features as "Now"/"Next".
- Don't re-propose anything already tracked as an open item in `AUDIT.md`.
- Do not commit, push, or open a PR for `ROADMAP.md` changes unless the user explicitly asks.
