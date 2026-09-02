---
name: full-audit-api
description: Run a focused audit of the pub-api backend only (Express/Prisma/PostgreSQL) covering test coverage (unit + integration gaps), performance, security, and code quality (strict typing, duplication, bad patterns, dead code). Appends new findings to a persistent AUDIT.md checklist in the pub-api repo root (existing checked-off items are preserved). Use when the user asks to audit just pub-api / this backend repo / "this repo" while working in pub-api — not the whole PubDB site (use `full-audit` for that) and not a single PR/diff (use /code-review for that).
---

# pub-api-only audit

Produces a focused health report for **just** the `pub-api` backend (Express/Prisma/
PostgreSQL). This is the backend-only counterpart to the `full-audit` skill, which covers the
whole PubDB site (`pubdb-fe` + `pub-api`) and writes to a shared `pubdb-fe/AUDIT.md`. Use this
skill instead when the user is working in `pub-api` and asks for an audit of "this repo" /
"just the backend" / "pub-api only" — not the whole site.

This is NOT a PR/diff review — lint (Biome), type-check, unit tests, and dead-export checks
(`knip`) are already enforced as CI gates on every PR (see `.github/workflows/`), so **do not
re-check whether the code lints/type-checks/builds/passes CI — it already does**. This audit
looks at things no single PR's gates catch: coverage gaps in files nobody has recently touched,
request-level test gaps, and code quality that a passing type-check/lint doesn't guarantee (e.g.
`any` and unsafe casts still compile cleanly, `knip` doesn't catch duplicated logic).

There is no frontend/UI in this repo, so accessibility, SEO, and responsive/UX categories from
the full-site skill don't apply here — this skill covers test coverage, performance, security,
and code quality only.

## When to run this

User asks to "audit pub-api", "audit this repo" (while working in `pub-api`), "audit just the
backend", or similar backend-only requests. If they mean the whole site (frontend included),
use `full-audit` instead. If they ask about a single PR or the current diff, use `/code-review`.

## Output

Findings live in a single persistent file at **the `pub-api` repo root: `pub-api/AUDIT.md`**
— separate from `pubdb-fe/AUDIT.md`, which stays the shared full-site report. Do not write
findings from this skill into `pubdb-fe/AUDIT.md`, and do not duplicate findings that are purely
cross-repo/full-site concerns already tracked there (e.g. a frontend a11y issue) — this file is
for pub-api-scoped findings only. This is not a one-off report — it's a living checklist that
accumulates across runs. Each run **appends**, never replaces:

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
    items, dated.
- Add a line to the `## Run log` section at the top with today's date and a one-line summary
  (e.g. "2026-09-02 — 4 new findings (2 security, 2 code quality), 1 item resolved").
- Do not renumber, reorder, or rewrite prose outside the checklists — this file is meant to be
  readable as a diff over time.

Do not modify application code during the audit unless the user explicitly asks you to fix
something after seeing the report — this skill is read-only/diagnostic aside from editing
`AUDIT.md` itself.

### AUDIT.md template (use this structure if the file doesn't exist yet)

```markdown
# pub-api Audit

Living checklist maintained by the `full-audit-api` skill, covering only this repo (`pub-api`).
For the combined site-wide audit (including `pubdb-fe`), see `../pubdb-fe/AUDIT.md`. Findings
are appended, never rewritten; check an item off (`- [x]`) once you've fixed it and it won't be
touched again. Re-running the audit adds new findings to the bottom of each section and leaves
checked items alone.

## Run log

- YYYY-MM-DD — initial audit

## 1. Test coverage — unit and integration gaps

## 2. Performance

## 3. Security

## 4. Code quality
```

## How to run it

Fan out the categories below as parallel forks or a general-purpose subagent per category (they
are independent and read-heavy — keep the raw output out of your main context). Have each one
**report findings back as text**, not write to `AUDIT.md` directly — only you should touch that
file, in a single merge pass at the end, so the dedup/checked-item rules above are applied
consistently in one place.

Check whether a `pub-api` dev server is already running (port 4000) before starting one for
performance/security checks that need a live server; if you start one, stop it when done unless
the user is already running it. It needs a reachable PostgreSQL instance per its `.env`
`DATABASE_URL`.

### 1. Test coverage — unit and integration gaps

- Run `yarn test:coverage`. Even though CI runs `yarn test` on every PR, that doesn't enforce a
  coverage floor — list files sitting notably low or at 0%, especially older files under
  `src/routes/`, `src/queries/`, `src/middleware/`, and `src/utils/`.
- Check whether the Vitest suite includes request-level tests (via `supertest`, already a
  dependency) against `src/routes/*` for auth, payments/Stripe webhooks, and the
  playground-token minting endpoint, or whether tests are unit-only (mocked Prisma calls). Flag
  routes with only unit-level coverage and no request-level test as a gap, particularly
  `/payments/webhook` and `/auth/keys/:keyPrefix/playground-token` given their security
  sensitivity.

### 2. Performance

- Response time on key endpoints (`/api/v1/pubs`, `/api/v1/pubs/near`, auth) under a simple
  manual check against a running dev server.
- N+1-shaped Prisma queries in `src/queries/` — look for query calls inside loops/`.map()` over
  results from a prior query that could be a single `include`/`select` instead.
- Any unindexed columns used in frequent `WHERE`/`ORDER BY` clauses (check `prisma/schema.prisma`
  against query patterns in `src/queries/`).

### 3. Security

- Auth flow review: JWT handling (`JWT_SECRET`, `PLAYGROUND_TOKEN_SECRET` — confirm they're
  actually distinct in practice, not just in `.env.example` comments), `bcrypt` usage, API-key
  auth vs Bearer-session auth boundaries, CORS config.
- Rate limiting: confirm `express-rate-limit` tiers (Hobby/Developer/Business) and the
  30/hour/IP playground-token mint limit are actually enforced, not just documented.
- Stripe: webhook signature verification (`STRIPE_WEBHOOK_SECRET`) on `/payments/webhook`.
- Dependency vulnerabilities: `yarn audit` (or check Renovate's open PR backlog, already
  configured via `renovate.json`).
- Response headers: `helmet` is already a dependency — confirm it's actually mounted and check
  its configured policy (CSP, HSTS, X-Content-Type-Options) rather than assuming defaults are
  sufficient.

### 4. Code quality

A passing lint/type-check/`knip` run only proves the code compiles cleanly, lints clean, and has
no unused exports — not that it's precisely typed, non-duplicated, or free of bad patterns.
`knip` already catches genuinely dead exports/files, so don't re-report plain "unused export"
findings here unless `knip.json` is suppressing something real.

- **Strict typing** — explicit `any`, unsafe `as Type` casts (especially around Prisma query
  results and `req.body`/`req.query` in route handlers), missing return type annotations on
  exported functions, non-null assertions (`!`) that could be replaced with a proper guard, Zod
  schemas that don't actually constrain a field that later gets used unsafely.
- **Code duplication** — repeated logic across `src/routes/*` (e.g. auth/ownership checks that
  should share a middleware), values inlined 3+ times that should be a named constant (rate
  limits, tier names, token TTLs).
- **Bad patterns** — magic numbers/strings (e.g. hardcoded tier limits, TTLs, HTTP status codes)
  that should be named constants, large inline functions that obscure intent.
- **Dead code** — commented-out code blocks left in files, TODO/FIXME comments with no
  corresponding tracked follow-up, leftover references to abandoned approaches (e.g. check
  `../pubdb-fe/PLAYGROUND_PLAN.md` for anything pub-api-side that was meant to be removed, like a
  rejected shared-key approach still referenced in route handlers).

## Notes

- This is a personal/small project — keep findings proportionate. Don't recommend
  enterprise-scale tooling as a "blocker"; note it as a "nice to have" instead unless it's
  actually broken for a real user.
- Cite every finding with a route, file:line, or reproduction steps — no vague "could be
  improved" entries.
- **Every checklist item must be independently reviewable as one small PR** — same spirit as
  this project's CI (one lint/ts-check/test/knip gate per concern, small diffs). If a finding is
  actually a bundle of unrelated or large changes, split it into several separate `- [ ]` lines,
  each scoped to a single reviewable change. Never write a checklist item a reviewer couldn't
  approve or reject on its own without also weighing in on unrelated changes bundled into it.
- If a finding genuinely spans both repos (e.g. a contract mismatch between what `pub-api`
  returns and what `pubdb-fe` expects), note it here but also flag to the user that it may
  belong in the shared `pubdb-fe/AUDIT.md` too, rather than silently duplicating it there
  yourself.
