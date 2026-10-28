# Product Roadmap — PubDB

The core loop already works: search, view a pub's details, add or edit an entry. What's missing
is anything that helps a user discover more pubs once they've found one they like, and structured
data so search engines can index individual pub pages. Everything below is scored against four
jobs:

- **Acquisition** — brings new visitors in
- **Engagement** — deepens a single visit
- **Retention** — earns a repeat visit
- **Fun** — no metric, just delight

Every feature is broken into a **PR sequence** — each step small enough for a human to review in
about 15 minutes. Genuinely atomic changes are left as one PR. Tick a step off once its PR merges. Features needing a `pubdbapi`
change are noted as such — coordinate with that repo's own roadmap rather than treating it as a
frontend-only PR.

## Now (ship in weeks — reuses existing infra)

### 1. Search filters — *Engagement*
Filter search results by amenity (beer garden, dog-friendly, etc.) rather than only free-text
search.

- [x] Filter UI controls added to the existing search page.
- [x] Wire the filters into the existing search request/query params, assuming the `pubdbapi`
  search endpoint already accepts amenity filters — **verify this first**; if it doesn't, this
  step depends on a `pubdbapi` change, not a `pubdb-fe` one.

### 2. Pub structured data — *Acquisition, SEO*
LocalBusiness structured data on each pub's detail page so search engines can show opening
hours/ratings directly.

- [x] **One PR.** A single JSON-LD block added to the pub detail page from fields already fetched.

### 3. Nearby pubs — *Engagement, Retention*
On a pub's detail page, show a few nearby pubs so a visit doesn't dead-end after one entry.

- [x] A distance-sorting pure function (client-side, given the current pub + a list) + tests,
  assuming the `pubdbapi` pub records already carry lat/long — **verify this first**.
- [x] Component rendering the nearby-pubs list on the pub detail page.

## Next (this quarter — depends on `pubdbapi`)

### 4. Save/favourite a pub — *Retention*
Let a user bookmark pubs to come back to — needs persistence, which doesn't exist on the
frontend today.

- [ ] **Depends on `pubdbapi`:** a favourites/bookmarks endpoint scoped to a user — out of scope
  for this repo's PRs; coordinate via `pubdbapi`'s own roadmap.
- [ ] Once available: a "save" button on pub cards/detail pages wired to it.
- [ ] A "my saved pubs" page.

### 5. City & amenity landing pages — *Acquisition, SEO*
Server-rendered, indexable pages such as `/pubs/in/manchester` and
`/pubs/in/manchester/dog-friendly`, built entirely from existing pub data. These target the
searches people actually make ("dog-friendly pubs in Leeds", "craft beer pubs in Bristol") and
grow automatically as the database grows — content that needs no writing. Today `/pubs` is a
client component that fetches in the browser, so none of its results are indexable, and
individual pub pages aren't in `sitemap.ts` either.

- [ ] **Depends on `pubdbapi` — verify first:** the pubs endpoint can filter by `city` (amenity
  filters via `amenities[key]=true` already exist), and there's a way to list cities with pub
  counts. If either is missing, that's a `pubdbapi` change, not a `pubdb-fe` one.
- [ ] A pure `citySlug` helper (`"Newcastle upon Tyne"` ↔ `newcastle-upon-tyne`) + an amenity
  key ↔ URL slug map built from `PUB_AMENITY_FIELDS` (`isDogFriendly` ↔ `dog-friendly`) + tests.
- [ ] `/pubs/in/[city]` server-rendered page: heading, intro line with the pub count, list of pub
  cards linking to `/pubs/[id]`, `generateMetadata` with a unique title/description, and a
  404 for unknown or empty cities.
- [ ] `/pubs/in/[city]/[amenity]` page reusing the city page's components, filtered by one amenity.
  Only render (and only link to) combinations with at least ~3 pubs, to avoid thin pages.
- [ ] `ItemList` JSON-LD on both page types, alongside the existing per-pub `pubJsonLd`.
- [ ] Add the city/amenity pages — and individual pub pages — to `sitemap.ts`, generated from the
  city-list endpoint. Split into a sitemap index if it passes Next's per-file limit.
- [ ] Internal links: "More pubs in {city}" on the pub detail page, and a "Browse by city" section
  on the homepage, so crawlers and visitors can reach the new pages.

### 6. Admin user dashboard — *Internal tooling*
An admin-only `/admin` area that shows who has signed up and how they use the API: who never made
a request, who tried it and left, and who keeps hitting their tier's rate limit and is ready for an
upgrade. Today this takes hand-written SQL. `AuthContext` already exposes `isAdmin`. The
API enforces admin access with a 403, so the frontend guard only keeps non-admins from seeing an
empty page.

- [ ] **Depends on `pubdbapi`:** `GET /admin/users` (summary list plus `totals` and an engagement
  label per user) and `GET /admin/users/:id` (per-user detail). These are planned in that repo's
  roadmap as "Admin user dashboard". Don't start the steps below until they ship.
- [ ] `src/app/admin/layout.tsx` guard: redirect to `/` unless `isAdmin`, with `noindex` metadata,
  and keep `/admin` out of `sitemap.ts` and `robots.ts`. Spec tests cover admin, non-admin and
  logged out.
- [ ] `/admin` users page: four summary tiles (users, sign-ups in the last 7 days, active in the last
  7 days, rate-limited in the last 30 days), then a sortable, paginated users table with an
  engagement badge per row (`never-started` / `tried-and-left` / `active` / `hitting-limits`) and a
  filter by badge. Spec tests cover rendering, sorting and the empty state.
- [ ] `/admin/users/[id]` detail page: profile, keys, a breakdown table by endpoint and status code,
  and a 30-day daily-requests chart. Spec tests.
- [ ] Add an "Admin" link to the sidebar (`src/app/components/sidebar/sidebar.tsx`), shown only when
  `isAdmin`. Add an e2e test: an admin can open `/admin` and drill into a user; a non-admin is
  redirected.

---
*PubDB — product roadmap, 2 September 2026 (admin dashboard added 26 October 2026)*
