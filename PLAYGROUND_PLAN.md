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

**Final auth mechanism (backend now supports this properly):** the
public `/api/v1/*` endpoints strictly require `X-API-Key` — forwarding
the user's Bearer session alone (an earlier attempt) 401s against the
real backend, since Bearer and API-key auth are separate mechanisms
there. A shared `TESTING_API_KEY` was considered and rejected — it
doesn't belong in a customer-facing feature and shouldn't be relied on
elsewhere either (follow-up needed for `beer-types`/`leaderboard`/`pubs`,
which currently do use it).

The backend now exposes `POST /auth/keys/:keyPrefix/playground-token`
(Bearer-authenticated, ownership-checked, 30/hour/IP rate limited) which
mints a short-lived (5 minute) scoped token — `pgt_<jwt>` — carrying that
key's tier/permissions/quota. `src/app/api/playground/pubs/route.ts`:
1. Forwards the user's Bearer token to mint a playground token for the
   selected `keyPrefix`.
2. Uses the returned `token` as `X-API-Key` on the real
   `GET /api/v1/pubs` call.
3. Returns that response to the client.

The raw permanent key secret never leaves the backend, and the token
itself is scoped, short-lived, and burns the *real* key's rate limit
(handled backend-side, not duplicated here) — the key picker in the UI
now genuinely selects which key's quota/tier a request uses.
- Errors from token minting pass straight through: 401 (no/bad session),
  404 (key not found or not owned — deliberately not distinguished, to
  avoid leaking which prefixes exist), 429 (mint rate limit).
- Render response as pretty-printed JSON, plus status code and latency.

## Stage 4 — Remaining endpoints + query param inputs (PR 4)

Done. Extended to `/pubs/:id`, `/pubs/near` (lat/lng/radius inputs),
`/beer-types`, `/contributors/leaderboard`, `/stats`.

- Backend proxying is now generic: `src/app/api/playground/utils/playgroundProxyHandler.ts`
  holds the shared token-mint-then-forward logic (previously duplicated
  in the Stage 3 `pubs/route.ts`); each endpoint route
  (`pubs/route.ts`, `pubs/[id]/route.ts`, `pubs/near/route.ts`,
  `beer-types/route.ts`, `leaderboard/route.ts`, `stats/route.ts`) just
  supplies a function that builds its upstream path from the forwarded
  query params.
- Frontend is a data-driven form-builder: each `ENDPOINTS` entry declares
  optional `pathParams`/`queryParams` (name, label, required, placeholder).
  Endpoints with no params send immediately on "Try it"; endpoints with
  params expand an inline form ("Configure →" / "Send request →") instead
  of having bespoke per-endpoint JSX.
- Response panel now shows the resolved request line (method + public
  path) and has two copy actions: "Copy as curl" (reconstructs the public
  `https://api.thepubdb.com/...` URL with a `X-API-Key: $PUBDB_KEY`
  placeholder header, not the actual scoped token) and the existing
  JSON-body copy.

## Stage 5 — Polish (PR 5)

Done.

- Request history: last 5 requests kept in page state, shown behind a
  "Show history (n)" toggle; clicking a past entry re-displays it in the
  main result panel (no re-fetch).
- Rate-limit awareness: `playgroundProxyHandler.ts` now forwards
  `X-RateLimit-Remaining`/`-Limit`/`-Reset` from the upstream response as
  response headers (not baked into the JSON body, so it doesn't change
  the shape callers already depend on). The result panel shows
  "`remaining/limit left`" when present.
- Key masking: already covered since Stage 2 — the UI only ever receives
  `keyPrefix` from the backend (e.g. `pk_dev_ab12`) and displays it as
  `{keyPrefix}····`; the full secret is never fetched to mask in the
  first place.

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
raw key or a shared testing key — it mints a short-lived, scoped token
server-side via the backend's `playground-token` endpoint and uses that
for the real request (see the Stage 3 section above).
