---
name: full-audit
description: Run a full audit of the PubDB site (pubdb-fe frontend + pub-api backend) covering test coverage (unit + e2e gaps), accessibility, performance, SEO, responsive/UX, security, and code quality (strict typing, duplication, bad patterns, dead code). Appends new findings to a persistent AUDIT.md checklist in the repo (existing checked-off items are preserved). Use when the user asks to audit, review the health of, or find improvements for the whole site — not for reviewing a single PR/diff (use /code-review for that).
---

# Full site audit

Produces a holistic health report for the PubDB app: `pubdb-fe` (Next.js/React/TypeScript
frontend, deployed on Vercel) + `pub-api` (Express/Prisma/PostgreSQL backend). This is NOT a
PR/diff review — lint (Biome), type-check, unit tests, e2e (frontend), and dead-export checks
(`knip`) are already enforced as CI gates on every PR in both repos (see each repo's
`.github/workflows/`), so **do not re-check whether the app lints/type-checks/builds/passes
CI — it already does**. This audit looks at things no single PR's gates catch: coverage gaps in
files nobody has recently touched, e2e flows that exist in code but were never actually walked
end-to-end against a real running app, cross-cutting site quality (a11y, perf, SEO, security,
UX), and code quality that a passing type-check/lint doesn't guarantee (e.g. `any` and unsafe
casts still compile cleanly, `knip` doesn't catch duplicated logic — see the code quality
category).

Both repos live side by side on disk: from `pubdb-fe`, the backend is at `../pub-api`; from
`pub-api`, the frontend is at `../pubdb-fe`. `pubdb-fe` talks to `pub-api` over the API base URL
configured via `pub-api`'s `.env` (`FRONTEND_URL`/`API_BASE_URL`, defaults
`http://localhost:3000` and `http://localhost:4000`), plus the frontend's own `/api/*` Next.js
route handlers, several of which proxy to the backend rather than calling it directly from the
browser (see `pubdb-fe/src/app/api/playground/utils/playgroundProxyHandler.ts` for the pattern).

## When to run this

User asks to "audit the site", "find ways to improve pubdb", "do a full review of the app", or
similar whole-app requests covering either or both repos. If they ask about a single PR or the
current diff, use `/code-review` instead.

## Output

Findings live in a single persistent file at **the `pubdb-fe` repo root: `pubdb-fe/AUDIT.md`**
— by convention this file lives in the frontend repo even though findings cover both repos
(mirror this if running the audit from `pub-api`: still read/write
`../pubdb-fe/AUDIT.md`, don't create a second `AUDIT.md` in `pub-api`). This is not a one-off
report — it's a living checklist that accumulates across runs. Each run **appends**, never
replaces:

- `AUDIT.md` has one `## <n>. <Category>` section per category below, in the same order, each
  containing a flat markdown checklist (`- [ ] finding text (found: YYYY-MM-DD)`).
- **Before writing anything**, read the current `AUDIT.md` in full (create it from the template
  below if it doesn't exist yet).
- For each category, compare this run's findings against what's already listed in that section:
  - If a finding already exists (same issue, same file/route — wording may differ slightly),
    **do not duplicate it**. Leave the existing line untouched.
  - If an existing unchecked item no longer reproduces (verify, don't assume — re-check it),
    check it off and add `(resolved: YYYY-MM-DD, verified during audit)` rather than deleting
    the line, so there's a record.
  - **Never touch a line that's already checked off (`- [x]`)** — those are the user's own
    record of completed work. Leave them exactly as-is, in place.
  - Genuinely new findings get appended to the bottom of that section's list as new `- [ ]`
    items, dated. Prefix each finding with `[fe]` or `[api]` (or both) so it's clear which repo
    it applies to.
- Add a line to the `## Run log` section at the top with today's date and a one-line summary
  (e.g. "2026-08-31 — 4 new findings (2 a11y, 1 security, 1 code quality), 1 item resolved").
- Do not renumber, reorder, or rewrite prose outside the checklists — this file is meant to be
  readable as a diff over time.

Do not modify application code during the audit unless the user explicitly asks you to fix
something after seeing the report — this skill is read-only/diagnostic aside from editing
`AUDIT.md` itself.

### AUDIT.md template (use this structure if the file doesn't exist yet)

```markdown
# Site Audit

Living checklist maintained by the `/full-audit` skill, covering both `pubdb-fe` and `pub-api`.
Findings are appended, never rewritten; check an item off (`- [x]`) once you've fixed it and it
won't be touched again. Re-running the audit adds new findings to the bottom of each section and
leaves checked items alone. `[fe]`/`[api]` tags mark which repo a finding applies to.

## Run log

- YYYY-MM-DD — initial audit

## 1. Test coverage — unit gaps and e2e

## 2. Accessibility

## 3. Performance

## 4. SEO / metadata

## 5. Responsive / UX

## 6. Security

## 7. Code quality
```

## How to run it

Fan out the categories below as parallel forks or a general-purpose subagent per category (they
are independent and read-heavy — keep the raw output out of your main context). Have each one
**report findings back as text**, not write to `AUDIT.md` directly — only you should touch that
file, in a single merge pass at the end, so the dedup/checked-item rules above are applied
consistently in one place. Categories needing the browser (a11y/perf/responsive/e2e-walkthrough)
should run together in one browser-driving pass since they all need the app running.

Before starting, check whether dev servers are already running; if not, start `pub-api`
(`yarn dev`, port 4000, needs a reachable PostgreSQL instance per its `.env` `DATABASE_URL`) and
then `pubdb-fe` (`yarn dev`, port 3000) yourself for the duration of the audit, and stop them
when done unless the user is already running them.

### 1. Test coverage — unit gaps and e2e

- Run `yarn test:coverage` in both `pubdb-fe` and `pub-api`. Even though CI runs `yarn test` on
  every PR, that doesn't enforce a coverage floor — list files sitting notably low or at 0%,
  especially older files under `pub-api/src/routes/`, `pub-api/src/queries/`, and
  `pubdb-fe/src/app/**` route handlers/features that predate current test conventions.
- **E2e coverage (frontend)**: Playwright is already set up and gated in CI (`.github/workflows/
  e2e.yml`, specs under `pubdb-fe/e2e/tests`). List the specs that exist, then walk the app live
  via `claude-in-chrome` to find flows that have **no** spec covering them yet, e.g.:
  - Register → email verification → sign in → forgot/reset password
  - Add a pub (`/add-pub`) and edit an existing pub end-to-end
  - Search/filter pubs, view a pub's details page (`/pubs/[id]`), opening-hours display
  - Dashboard: API key creation, viewing usage/tier, billing/Stripe checkout flow, leaderboard
  - The Playground page (`/playground`): key selection, sending a live request, response/history
    display — this is a proxy-heavy flow (`src/app/api/playground/**`) worth extra scrutiny
  For each gap, recommend a specific new spec file under `e2e/tests/`, not a vague "add more
  e2e coverage" item.
- **Integration coverage (backend)**: check whether `pub-api`'s Vitest suite includes
  request-level tests (via `supertest`, already a dependency) against `src/routes/*` for auth,
  payments/Stripe webhooks, and the playground-token minting endpoint, or whether tests are
  unit-only (mocked Prisma calls). Flag routes with only unit-level coverage and no
  request-level test as a gap, particularly `/payments/webhook` and `/auth/keys/:keyPrefix/
  playground-token` given their security sensitivity.

### 2. Accessibility

- Automated pass per `pubdb-fe` route (axe via browser console injection, or Lighthouse a11y
  score through `claude-in-chrome`)
- Manual: color contrast, focus order/visible focus states, form labels on auth forms
  (`/register`, `/forgot-password`, `/reset-password`), the pub-form component
  (`src/app/components/pub-form`) used for add/edit, and keyboard-only completion of adding a
  pub and using the Playground's endpoint forms

### 3. Performance

- Lighthouse performance score and Core Web Vitals (LCP, CLS, INP) per `pubdb-fe` route,
  particularly `/pubs` (likely list-heavy) and `/leaderboard`
- Next.js build output: bundle size per route, unused JS/CSS, render-blocking resources, image
  weight; note `@vercel/analytics` is already installed — check whether it's actually wired up
  and whether its data (if accessible) surfaces any real-world regressions
- Backend: response time on key endpoints (`/api/v1/pubs`, `/api/v1/pubs/near`, auth) under a
  simple manual check; note any N+1-shaped Prisma queries in `src/queries/`

### 4. SEO / metadata

- Per-route `<title>`/meta description via Next.js metadata API, Open Graph tags, presence of
  `sitemap.xml`/`robots.txt` (check `pubdb-fe/public/` and `src/app/` for `sitemap.ts`/
  `robots.ts`), semantic heading structure on public-facing routes (`/`, `/pubs`, `/docs`,
  `/pubs/[id]`)

### 5. Responsive / UX

- Screenshot each route at ~375px and ~1280px via `claude-in-chrome`, focusing on data-dense
  views (pub list/detail, dashboard, docs/playground with its request/response panels) that are
  easy to get wrong on narrow screens
- Console errors on load/navigation (`read_console_messages`), broken links, dead-end states
  (e.g. zero API keys on the Playground page, empty search results)

### 6. Security

- Auth flow review: JWT handling (`JWT_SECRET`, `PLAYGROUND_TOKEN_SECRET` — confirm they're
  actually distinct in practice, not just in `.env.example` comments), `bcrypt` usage, API-key
  auth vs Bearer-session auth boundaries (see `PLAYGROUND_PLAN.md`'s note that these are
  deliberately separate mechanisms), CORS config in `pub-api`
- Rate limiting: confirm `express-rate-limit` tiers (Hobby/Developer/Business) and the
  30/hour/IP playground-token mint limit are actually enforced, not just documented
- Stripe: webhook signature verification (`STRIPE_WEBHOOK_SECRET`) on `/payments/webhook`, no
  secret keys or raw API keys reachable from client-side `pubdb-fe` code or bundled JS
- Dependency vulnerabilities: `yarn audit` (or check Renovate's open PR backlog, already
  configured via `renovate.json`) in both packages
- Response headers: `helmet` is already a `pub-api` dependency — confirm it's actually mounted
  and check its configured policy (CSP, HSTS, X-Content-Type-Options) rather than assuming
  defaults are sufficient

### 7. Code quality

A passing lint/type-check/`knip` run only proves the code compiles cleanly, lints clean, and has
no unused exports — not that it's precisely typed, non-duplicated, or free of bad patterns.
`knip` already catches genuinely dead exports/files in both repos, so don't re-report plain
"unused export" findings here unless `knip`'s config is suppressing something real (check
`knip.json` in each repo for overly broad ignores).

- **Strict typing** — explicit `any`, unsafe `as Type` casts (especially around Prisma query
  results and `req.body`/`req.query` in `pub-api`'s route handlers, and around fetch responses
  in `pubdb-fe`'s `/api/*` proxies), missing return type annotations on exported functions,
  non-null assertions (`!`) that could be replaced with a proper guard, Zod schemas in `pub-api`
  that don't actually constrain a field that later gets used unsafely.
- **Code duplication** — repeated logic across `pub-api/src/routes/*` (e.g. auth/ownership
  checks that should share a middleware), repeated fetch/proxy patterns across
  `pubdb-fe/src/app/api/*/route.ts` that duplicate what
  `playgroundProxyHandler.ts` already solved for the playground endpoints, values inlined 3+
  times that should be a named constant (rate limits, tier names, token TTLs).
- **Bad patterns** — `useEffect` with missing or overly broad dependency arrays, magic
  numbers/strings (e.g. hardcoded tier limits, TTLs, HTTP status codes) that should be named
  constants, large inline functions that obscure intent, inline `style=` props in `.tsx` files
  that should be CSS modules (the project already uses `page.module.css`-style CSS modules
  elsewhere).
- **Dead code** — commented-out code blocks left in files, TODO/FIXME comments with no
  corresponding tracked follow-up, leftover references to abandoned approaches noted in
  `PLAYGROUND_PLAN.md` (e.g. the rejected shared `TESTING_API_KEY` approach — check whether
  `beer-types`/`leaderboard`/`pubs` route handlers still lean on `TESTING_API_KEY` as flagged as
  a follow-up there, and treat that as a live finding, not resolved, until it's actually gone).

## Notes

- This is a personal/small project — keep findings proportionate. Don't recommend
  enterprise-scale tooling (e.g. a full CI a11y pipeline) as a "blocker"; note it as a "nice to
  have" instead unless it's actually broken for a real user.
- Cite every finding with a route, file:line, or screenshot — no vague "could be improved"
  entries.
- **Every checklist item must be independently reviewable as one small PR** — same spirit as
  this project's CI (one lint/ts-check/test/knip gate per concern, small diffs). If a finding is
  actually a bundle of unrelated or large changes (e.g. "add more e2e coverage", "improve
  accessibility across the app", "harden auth"), split it into several separate `- [ ]` lines,
  each scoped to a single reviewable change (e.g. one line per flow's e2e spec, one line per
  route's a11y fix, one line per auth issue). Never write a checklist item a reviewer couldn't
  approve or reject on its own without also weighing in on unrelated changes bundled into it.
