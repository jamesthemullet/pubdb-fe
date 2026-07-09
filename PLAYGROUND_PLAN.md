# Playground page — implementation plan

Goal: let a signed-up user pick one of their API keys and try live requests
against the public API (`/pubs`, `/pubs/near`, `/beer-types`,
`/contributors/leaderboard`, `/stats`) from a page in the app, without
needing curl/Postman.

Reuses existing pieces: custom auth (`useAuth`, bearer token), API key
system (`src/app/features/dashboard/dashboard.tsx`), and the doc-page
components (`CodeBlock`, `MethodBadge`, `TypeBadge`, `DocNav`) as a style
reference.

Requests go through a server-side proxy (`src/app/api/playground/route.ts`),
consistent with every other `/api/*` route — the raw key never reaches
the browser. See "Risk notes" at the bottom for why.

## Stage 1 — Skeleton page, gated by auth (PR 1)

- Add `src/app/playground/page.tsx` + `page.module.css`, modeled on
  `src/app/docs/page.tsx` layout (sticky nav, sectioned content).
- Reuse `useAuth` to gate the page: signed-out users see a "Sign up /
  log in to use the Playground" prompt (link to `/register`), signed-in
  users see the real UI.
- No live requests yet — static form shells per endpoint, disabled submit
  buttons.
- Re-add the `/playground` link in `src/app/docs/page.tsx` header actions
  (uncomment/restore, pointing at the new route).

## Stage 2 — API key selection (PR 2)

- Fetch the user's API keys (same call the dashboard uses) and render a
  key picker (dropdown of `name` / `keyPrefix` / `tier`).
- If the user has zero keys, show an inline CTA linking to
  `/profile` (dashboard) to create one — don't duplicate key-creation UI
  here.
- Store the *selected key id/prefix* in page state only — not the raw
  secret — until Stage 3 decides the request path.

## Stage 3 — Wire up one endpoint end-to-end (PR 3)

Pick `GET /pubs` first (simplest, no required params).

**Auth mechanism change from the original plan:** the backend has no way to
look up a raw key secret after creation — `GET /api/auth/dashboard` only
ever returns `keyPrefix`/`name`/`tier`, and the only "re-fetch" path
(`forgot-api-key`) actually rotates/invalidates the key, so it can't be
used for this. Given that, `src/app/api/playground/pubs/route.ts` forwards
the signed-in user's Bearer token instead (`forwardAuth: true,
includeApiKey: false`, mirroring `pubs/route.ts`/`auth/me/route.ts`). The
key picker from Stage 2 is informational — it shows which key/tier the
account is on — rather than literally selecting a distinct secret per
request. Still satisfies the core goal: no raw key ever reaches the
browser.
- Render response as pretty-printed JSON, plus status code and latency.
- Basic error states so far: network error, non-2xx status shown inline.
  429/401-specific messaging can follow once real backend responses are
  observed in Stage 4.

## Stage 4 — Remaining endpoints + query param inputs (PR 4)

- Extend to `/pubs/:id`, `/pubs/near` (lat/lng/radius inputs), `/beer-types`,
  `/contributors/leaderboard`, `/stats`.
- Generic form-builder per endpoint (path params, query params) instead of
  bespoke forms per endpoint, to keep this maintainable.
- Copy-as-curl button next to each response (reuse `CopyButton`).

## Stage 5 — Polish (PR 5, optional/nice-to-have)

- Request history within the session (last N requests, collapsible).
- Rate-limit / tier awareness: show remaining quota if the API returns it
  in headers.
- Mask the key in any UI that displays it (show last 4 chars only).

## Risk notes — why server-side proxy over client-side key

If the raw key were sent to/used from the browser instead:

- Visible in devtools network tab to anyone with access to the machine or
  a browser extension that reads network traffic.
- XSS anywhere on the site could exfiltrate a key sitting in client state
  or localStorage.
- Any future analytics/error-monitoring tool (Sentry, LogRocket, etc.)
  that records requests could capture the key without anyone intending it.
- Screenshots/screen-shares/support tickets are a common accidental-leak
  vector.
- Keys are tier/quota-based, so a leaked key costs the owner real quota,
  not just "read access to public data."

The proxy (Stage 3) avoids all of the above: the client never handles a
raw key at all — it authenticates via the existing Bearer session, and
the server forwards that to the public API (see the auth mechanism note
under Stage 3 above for why this differs from the original per-key
lookup idea).
