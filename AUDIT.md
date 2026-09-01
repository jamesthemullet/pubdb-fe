# Site Audit

Living checklist maintained by the `/full-audit` skill, covering both `pubdb-fe` and `pub-api`.
Findings are appended, never rewritten; check an item off (`- [x]`) once you've fixed it and it
won't be touched again. Re-running the audit adds new findings to the bottom of each section and
leaves checked items alone. `[fe]`/`[api]` tags mark which repo a finding applies to.

## Run log

- 2026-09-01 — initial audit: 55 findings (17 test coverage, 18 accessibility, 2 performance, 9 SEO, 4 responsive/UX, 12 security, 15 code quality — some findings span multiple counts)
- 2026-09-01 — resolved: added unit tests for the untested `POST /api/pubs` handler (test coverage section)

## 1. Test coverage — unit gaps and e2e

- [ ] [fe] `yarn test:coverage` currently fails before producing a coverage report — 140/632 tests throw `TypeError: Cannot read properties of undefined (reading 'clear')` at `localStorage.clear()` in `beforeEach`/`afterEach` across 13 spec files: `src/app/components/auth-gate/AuthGate.spec.tsx`, `src/app/components/sidebar/sidebar.spec.tsx`, `src/app/components/topbar/topbar.spec.tsx`, `src/app/pubs/[id]/page.spec.tsx`, `src/app/add-pub/page.spec.tsx`, `src/app/billing/page.spec.tsx`, `src/app/pubs/page.spec.tsx`, `src/app/register/page.spec.tsx`, `src/app/success/page.spec.tsx`, `src/hooks/useAuth.spec.ts`, `src/hooks/useBeerTypes.spec.ts`, `src/hooks/useContributions.spec.ts`, `src/hooks/useTheme.spec.ts`. Fix this before per-file coverage numbers can be trusted. (found: 2026-09-01)
- [x] [fe] `src/app/api/pubs/route.ts` — the `POST` handler (lines 12-35, backs the add-pub form submission) has zero test coverage; only `GET` is tested in `route.spec.ts`. (found: 2026-09-01) (resolved: 2026-09-01, PR #TBD)
- [ ] [fe] `src/app/api/auth/me/route.ts` — `PATCH` (profile update, lines 12-34) and `DELETE` (account deletion, lines 36-58) handlers are completely untested; only `GET` is covered. (found: 2026-09-01)
- [ ] [fe] `src/app/settings/page.tsx` — Profile tab's save flow (display name/username edits, 409/400/401 error handling, ~lines 200-571) plus the Security, Notifications, API preferences, and Appearance tabs have no tests; `page.spec.tsx` covers only the Danger-zone tab. (found: 2026-09-01)
- [ ] [fe] `src/app/features/dashboard/dashboard.tsx` — the "Your contributions" section (recent-pubs list, expandable per-pub edit-type pills via `toggleEditTypes`, ~lines 1108-1195) has no test coverage. (found: 2026-09-01)
- [ ] [fe] `src/app/playground/page.tsx` has no unit spec at all despite non-trivial state logic (API key selection, endpoint expansion, live-request sending, response/history handling). (found: 2026-09-01)
- [ ] [fe] Add `e2e/tests/opening-hours.spec.ts` covering the opening-hours component on `/pubs/[id]` (open/closed status, today's row highlighted) — currently no e2e coverage. (found: 2026-09-01)
- [ ] [fe] Add `e2e/tests/dashboard-api-keys.spec.ts` covering creating/regenerating an API key from the dashboard — `e2e/tests/profile.spec.ts` only checks basic auth states. (found: 2026-09-01)
- [ ] [fe] Add `e2e/tests/dashboard-usage.spec.ts` covering usage-stats display, tier badge, and the upgrade nudge banner on the dashboard — no current coverage. (found: 2026-09-01)
- [ ] [fe] Add `e2e/tests/billing.spec.ts` covering navigating to `/billing` and initiating Stripe checkout (mocked network) — `src/app/billing/page.tsx` has a unit spec but zero e2e coverage. (found: 2026-09-01)
- [ ] [fe] Add `e2e/tests/leaderboard.spec.ts` exercising `/leaderboard` — `LeaderboardClient.tsx` has a unit spec but no e2e spec. (found: 2026-09-01)
- [ ] [fe] Add `e2e/tests/playground.spec.ts` covering API key selection, expanding an endpoint and sending a live request (mocked `src/app/api/playground/**` proxy response), and viewing the response/history panel — `/playground` has neither unit nor e2e coverage. (found: 2026-09-01)
- [ ] [fe] Add `e2e/tests/account-lifecycle.spec.ts` chaining register → sign in → forgot password → reset password as one flow with mocked API responses — `auth.spec.ts`, `forgot-password.spec.ts`, and `reset-password.spec.ts` each cover their step in isolation only. (found: 2026-09-01)
- [ ] [api] `src/middleware/auth.ts` — `optionalAuthMiddleware` (lines 42-68) has 0% coverage; only `authMiddleware` is exercised, leaving its valid-token and invalid/expired-token branches unverified. (found: 2026-09-01)
- [ ] [api] `src/routes/auth.ts` `DELETE /auth/me` — the Stripe-subscription-cancellation branch (~lines 541-548, entered when the deleting user has an active `stripeSubscriptionId`) is untested. (found: 2026-09-01)
- [ ] [api] `src/routes/payments.ts` `handleInvoicePaymentSucceeded` — the `stripe.subscriptions.retrieve()` failure branch (catch block ~lines 928-935) is untested. (found: 2026-09-01)
- [ ] [api] `src/routes/public.ts` `GET /pubs/:id/history` — the cache-hit branch (line 290) is untested. (found: 2026-09-01)
- [ ] [api] `src/routes/contributors.ts` `GET /leaderboard` — the cache-hit branch (~line 298) is untested. (found: 2026-09-01)
- [ ] [api] `src/routes/pubs.ts` `frontendCors` — the CORS-rejection branch (line 46) has no request-level test verifying disallowed origins are actually blocked. (found: 2026-09-01)

## 2. Accessibility

- [ ] [fe] Sidebar (every authenticated page) — nav section labels "WORKSPACE"/"ACCOUNT" render at 2.53:1 contrast (#555555 on #111111), fails WCAG AA 4.5:1. `src/app/components/sidebar/sidebar.tsx` / `sidebar.module.css`. (found: 2026-09-01)
- [ ] [fe] Sidebar (every page) — pub-count nav badge (e.g. "12.4k") renders at 2.9:1 contrast (#666666 on #1e1e1e), fails AA. `src/app/components/sidebar/sidebar.module.css`. (found: 2026-09-01)
- [ ] [fe] Sidebar (every page) — account chip's avatar-initial and username text fail AA color-contrast. `src/app/components/sidebar/sidebar.module.css`. (found: 2026-09-01)
- [ ] [fe] Home page (`/`) — hero description, "Free tier" CTA note, code-tab labels (curl/node/python/ruby), contribute paragraph, and footer/Terms/Privacy links fail AA color-contrast (axe: 14 nodes on this page). (found: 2026-09-01)
- [ ] [fe] Home page (`/`) — the hero curl-response code panel is a scrollable region that isn't keyboard-focusable, so keyboard-only users cannot scroll its content (axe: scrollable-region-focusable). (found: 2026-09-01)
- [ ] [fe] `/pubs` — the sortable "LOCATION"/name column header's arrow icon has empty text content, giving screen-reader users an unlabeled table-header control (axe: empty-table-header, `.page-module__xJjdpq__thArrow`). (found: 2026-09-01)
- [ ] [fe] `/pubs/[id]` — breadcrumb links, Beers/Hours/Garden/History tab labels, "DETAILS" section label, and "Missing: …" completeness chips fail AA color-contrast. (found: 2026-09-01)
- [ ] [fe] `/pubs/[id]` — details-table row labels (Name/Address/City/Postcode/etc.) in both read and inline-edit view are low contrast. (found: 2026-09-01)
- [ ] [fe] `/pubs/[id]` — the JSON response code panel (`#pub-code-panel`) is a scrollable region with no keyboard access (axe: scrollable-region-focusable, same pattern as the home-page finding above). (found: 2026-09-01)
- [ ] [fe] `/docs` — left-hand table-of-contents links (Quick start, Authentication, Endpoints, Filtering & search, Pagination, Rate limits) fail AA color-contrast. (found: 2026-09-01)
- [ ] [fe] `/playground` — disabled "Configure" buttons for API-key-gated endpoints render pixel-identical to enabled "Try it" buttons, with no visual dimming or `aria-disabled`/tooltip explaining why clicking does nothing. (found: 2026-09-01)
- [ ] [fe] `/register` — subtitle, password-requirements hint, Terms-of-Service links, and "already have an account" switch text fail AA color-contrast (shared `AuthGate` component). (found: 2026-09-01)
- [ ] [fe] `/login` — "Forgot password?" link and "New to Pub DB? Create an account" text fail AA color-contrast. (found: 2026-09-01)
- [ ] [fe] `/forgot-password` — "create an account" link and footer Terms/Privacy links fail AA color-contrast. (found: 2026-09-01)
- [ ] [fe] `/add-pub` — "POST /v1/pubs" endpoint badge, section description text, and "* required" note fail AA color-contrast. (found: 2026-09-01)
- [ ] [fe] `/leaderboard` — "YOUR RANK" stat labels (ADDED/EDITS/TOTAL/STREAK) plus endpoint badge/description text fail AA color-contrast. (found: 2026-09-01)
- [ ] [fe] `/billing` — page description text and payment-method body text fail AA color-contrast. (found: 2026-09-01)
- [ ] [fe] `/settings` — inactive left-nav items (Security, Notifications, API preferences, Appearance) and "Danger zone" label fail AA color-contrast. (found: 2026-09-01)

## 3. Performance

- [ ] [fe] `/profile` (dashboard "API keys & usage" page) — reproducible React "Encountered two children with the same key" error on every load. Root cause: `src/app/features/dashboard/dashboard.tsx` lines 145-159 — `yLabels` built via `[1, 2/3, 1/3, 0].map(f => Math.round(niceMax * f))` collapses to duplicate integers when `niceMax` is small (e.g. an account with a near-empty request-volume chart produces `[1,1,0,0]`), and `<g key={v}>` on line 159 collides, garbling the "Request volume" SVG chart gridlines. (found: 2026-09-01)
- [ ] [fe] Home/global `--text-muted` CSS token in `src/app/globals.css` is defined but bypassed by hardcoded `#555555`/`#666666` values across sidebar and other components — root cause of most of the color-contrast findings in section 2; fixing the token and switching components to use it would resolve many of them in one PR. (found: 2026-09-01)

## 4. SEO / metadata

- [ ] [fe] `public/og-default.png` is referenced by 14 `openGraph.images`/`twitter.images` entries (`src/app/layout.tsx`, `src/app/page.tsx`, `src/app/pubs/layout.tsx`, `src/app/pubs/[id]/layout.tsx`, `src/app/docs/layout.tsx`, `src/app/changelog/layout.tsx`, `src/app/leaderboard/layout.tsx`, `src/app/privacy/layout.tsx`, `src/app/terms/layout.tsx`) but the file does not exist in `public/` (confirmed 404 via curl) — every social share card site-wide is currently broken. (found: 2026-09-01)
- [ ] [fe] `src/app/pubs/layout.tsx` — `openGraph` only sets `title`/`description`, no `images` (Next.js metadata objects are replaced per-route, not deep-merged), so `/pubs` renders no `og:image` at all despite being a publicly indexable route. (found: 2026-09-01)
- [ ] [fe] `src/app/docs/layout.tsx` — `openGraph` and `twitter` both omit `images`, and `twitter.card` is `"summary"` instead of `"summary_large_image"`; `/docs` renders neither `og:image` nor `twitter:image`. (found: 2026-09-01)
- [ ] [fe] `src/app/add-pub/layout.tsx` — `openGraph`/`twitter` omit `images` and `twitter.card` is `"summary"`; `/add-pub` is indexable (no `robots: {index:false}`) but shares with no preview image. (found: 2026-09-01)
- [ ] [fe] `src/app/changelog/layout.tsx` — `openGraph` omits `images` (only `title`/`description` set), so Facebook/LinkedIn/Slack previews for `/changelog` have no image even though `twitter` does. (found: 2026-09-01)
- [ ] [fe] `src/app/leaderboard/layout.tsx` — same gap as changelog: `openGraph` has no `images`, so `/leaderboard` gets no OG preview image despite `twitter` having one. (found: 2026-09-01)
- [ ] [fe] Homepage heading order skips a level: `src/app/page.tsx` renders `<h1>` then `<h2>` "Most pubs are in — but the details aren't.", and the pricing section (`src/app/features/pricing/pricing.tsx` line 609, `<h3 className={styles.tierName}>`) jumps from h2 straight to h3 with no intervening section h2. (found: 2026-09-01)
- [ ] [fe] `src/app/sitemap.ts` lists only static routes (`/`, `/pubs`, `/docs`, `/leaderboard`, `/changelog`, `/privacy`, `/terms`) — individual pub detail pages (`/pubs/[id]`) aren't included despite `src/app/pubs/[id]/layout.tsx` having full per-pub `generateMetadata`; consider adding the most-complete/most-viewed pubs to the sitemap for discovery beyond internal links. (found: 2026-09-01)

## 5. Responsive / UX

- [ ] [fe] `/pubs` — navigating directly to a URL with a search query (e.g. `/pubs?search=crown`) does not populate the search input or filter the list on initial load; shared/bookmarked filtered-search links silently reset to the unfiltered list. (found: 2026-09-01)
- [ ] [fe] `/playground` — with zero API keys provisioned, disabled "Configure" buttons for key-gated endpoints are visually indistinguishable from active "Try it" buttons, a dead-end click with no feedback (UX half of the a11y finding in section 2). (found: 2026-09-01)
- [ ] [fe] `/forgot-password` — uses a visually distinct style (plain sans-serif font, "Email:" label with trailing colon, plain white input) that breaks from the monospace/dark-accented `AuthGate` styling shared by `/login` and `/register` in the same auth flow. (found: 2026-09-01)
- [ ] [fe] `/billing` — the "CURRENT PLAN" card shows the plan the account is actually on (Hobby) tagged with an "INACTIVE" status badge, reading as contradictory since the plan shown is the one actually in use. (found: 2026-09-01)

## 6. Security

- [ ] [api] CORS is wide-open globally: `src/server.ts:30` mounts bare `app.use(cors())`, setting `Access-Control-Allow-Origin: *` for every route including `/auth/*` and `/payments/*`. A stricter origin-checking `frontendCors` exists in `src/routes/pubs.ts:35-48` but is only applied to two routes (`GET /pubs/random` line 218, `GET /pubs/:id` line 259) and the global permissive CORS answers preflights first, making the allowlist effectively dead. Fix: apply `frontendCors` globally or remove the bare `cors()` call. (found: 2026-09-01)
- [ ] [api] `TESTING_API_KEY` is a single shared key used server-side by public content pages (`pubdb-fe/src/app/changelog/page.tsx:8`, `pubdb-fe/src/app/leaderboard/page.tsx:8`, `pubdb-fe/src/app/pubs/[id]/layout.tsx:38`, `pubdb-fe/src/app/api/utils/proxyHandler.ts:11`) with no per-user quota isolation — an acknowledged follow-up item per `pubdb-fe/PLAYGROUND_PLAN.md:47-50`, still outstanding. Not client-bundled (server-side only), so not urgent, but worth a tracked fix. (found: 2026-09-01)
- [ ] [api] `new (Stripe as any)(...)` constructor cast duplicated in two files — `src/routes/auth.ts:545` and `src/routes/payments.ts:34` — likely a stale workaround for an API-version mismatch; worth fixing the underlying type conflict once instead of casting in both places. (found: 2026-09-01)
- [ ] [api] `yarn audit --level high` in pub-api: `deepmerge-ts` (via `prisma > @prisma/config`) has a high-severity stack-exhaustion advisory, patched in `>=8.0.0` — low real-world exploitability here but a trivial bump once `prisma` picks it up. (found: 2026-09-01)
- [ ] [fe] `yarn audit --level high` in pubdb-fe: 4 high-severity transitive advisories via `next` — PostCSS arbitrary file read (patched `>=8.5.12`), PostCSS path traversal (patched `>=8.5.18`), `sharp`/libvips CVEs (patched `>=0.35.0`), `undici` cross-user info disclosure via `jsdom` (patched `>=7.29.0`, likely test-only). Recommend bumping `next` to pick up patched `postcss`/`sharp`. (found: 2026-09-01)

## 7. Code quality

- [ ] [api] Four `as any` casts to read `current_period_end` off the Stripe SDK's `Subscription` type — `src/routes/payments.ts:764-765`, `:881-882`, `:932`. Replace with one typed accessor, e.g. `getCurrentPeriodEnd(sub: Stripe.Subscription): number | undefined`. (found: 2026-09-01)
- [ ] [api] Five `as any` casts writing the `subscriptionStatus` Prisma enum field instead of using the generated `SubscriptionStatus` enum type — `src/routes/payments.ts:321`, `:837`, `:888`, `:908`, `:945` — silently defeats exhaustiveness checking on status values. (found: 2026-09-01)
- [ ] [api] Non-null assertion `req.user!.userId` at `src/routes/auth.ts:919` instead of a proper `AuthenticatedRequest` type guard. (found: 2026-09-01)
- [ ] [api] Non-null assertion `req.apiKey!.id` at `src/routes/public.ts:604` instead of a proper type guard. (found: 2026-09-01)
- [ ] [api] Two non-null assertions (`days!`) in `src/routes/contributors.ts:318-319` inside a `.filter().map()` chain that doesn't narrow across the two closures — restructure to a single `.flatMap`/`for...of` with a real `if (days === null) continue` guard. (found: 2026-09-01)
- [ ] [api] Redundant `req.params.id as string` cast at `src/routes/pubs.ts:260` — Express already types `req.params.id` as `string`. (found: 2026-09-01)
- [ ] [api] Duplicated amenity-query-parsing block, byte-for-byte identical at `src/routes/pubs.ts:146-156` and `:227-239` — extract into one `parseAmenityFilters(query)` helper. (found: 2026-09-01)
- [ ] [api] `60 * 60 * 1000` (ms-per-hour) inlined repeatedly instead of a named constant — `src/routes/auth.ts:46`, `:56`, `:109`, `:728`. (found: 2026-09-01)
- [ ] [api] `24 * 60 * 60 * 1000` (ms-per-day) inlined repeatedly instead of a named constant — `src/routes/contributors.ts:307`, `:318`, `:319`, `:430`. (found: 2026-09-01)
- [ ] [fe] Non-GET proxy routes reimplement the fetch/error/JSON-response pattern `createApiProxyHandler` (`src/app/api/utils/proxyHandler.ts`) already solves for GET — duplicated in `src/app/api/pubs/[id]/route.ts:13-37` (PATCH) and `:39-61` (DELETE), `src/app/api/auth/keys/[id]/route.ts:5-25` (DELETE), `src/app/api/auth/keys/[id]/regenerate/route.ts:5-33` (POST), `src/app/api/auth/me/password/route.ts:5-27` (PATCH). Extend `createApiProxyHandler` to accept `method`/`body`. (found: 2026-09-01)
- [ ] [fe] `buildHeaders` helper duplicated verbatim between `src/app/api/payments/[action]/route.ts:5-9` and `src/app/api/auth/[action]/route.ts:5-9`, plus near-identical GET/POST bodies in both files — fold into the shared proxy helper. (found: 2026-09-01)
- [ ] [fe] Identical static inline `style={{ display: "flex", gap: "0.25em" }}` duplicated at `src/app/features/opening-hours/opening-hours-display.tsx:18` and `:47` — move to the component's CSS module. (found: 2026-09-01)
- [ ] [fe] Static visually-hidden inline style object in `src/app/docs/CopyButton.tsx:23` — a fixed "sr-only" pattern, should be a shared `.srOnly` CSS module class instead of an inline literal. (found: 2026-09-01)
- [ ] [fe] Static inline style `style={{ objectFit: "cover" }}` at `src/app/settings/page.tsx:291` — fully static, no per-instance variation, should move to a CSS module class. (found: 2026-09-01)
- [ ] [fe] Static inline style at `src/app/pubs/[id]/components/PubEditView.tsx:596` (`border`/`borderRadius`/`marginTop`) — fully static, should move to a CSS module class. (found: 2026-09-01)
