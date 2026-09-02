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

Roadmap items are scored against what actually grows and deepens engagement with a pub database
app. Covers more than new features:

- **Findability** — making pubs easier to discover: search filters (amenities, beer garden),
  related/nearby pubs, browsing by area.
- **SEO** — individual pub pages, structured data.
- **Improving what already exists** — search, pub detail view, and add/edit are all real and
  live; extending them is often cheaper than a new feature.

## Grounding the roadmap in the real app

- `README.md` — stated features: search pubs, view details, add new pubs, edit existing entries.
- `AUDIT.md` if present — don't duplicate known bugs/gaps as roadmap features.
- `package.json` — Next.js 15, React 19, `@vercel/analytics`; no auth/database package here —
  data presumably comes from the `pubdbapi` backend over HTTP; confirm in `src/lib/` before
  assuming any client-side persistence exists.
- `src/app/` (routes), `src/hooks/`, `src/lib/`, `src/types/`, `src/constants/` — real structure
  to extend.

## Output format

Plain markdown. Write directly to `ROADMAP.md` at the repo root, overwriting the previous
version — leave `PLAYGROUND_PLAN.md` untouched, it's a separate document. Structure: intro + 4
goal-tag lenses (Acquisition/Engagement/Retention/Fun) → PR-sequence explainer → Now/Next/Later
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
