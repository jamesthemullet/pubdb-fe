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
about 15 minutes. Genuinely atomic changes are left as one PR. Features needing a `pubdbapi`
change are noted as such — coordinate with that repo's own roadmap rather than treating it as a
frontend-only PR.

## Now (ship in weeks — reuses existing infra)

### 1. Search filters — *Engagement*
Filter search results by amenity (beer garden, dog-friendly, etc.) rather than only free-text
search.

1. Filter UI controls added to the existing search page.
2. Wire the filters into the existing search request/query params, assuming the `pubdbapi`
   search endpoint already accepts amenity filters — **verify this first**; if it doesn't, this
   step depends on a `pubdbapi` change, not a `pubdb-fe` one.

### 2. Pub structured data — *Acquisition, SEO*
LocalBusiness structured data on each pub's detail page so search engines can show opening
hours/ratings directly.

1. **One PR.** A single JSON-LD block added to the pub detail page from fields already fetched.

### 3. Nearby pubs — *Engagement, Retention*
On a pub's detail page, show a few nearby pubs so a visit doesn't dead-end after one entry.

1. A distance-sorting pure function (client-side, given the current pub + a list) + tests,
   assuming the `pubdbapi` pub records already carry lat/long — **verify this first**.
2. Component rendering the nearby-pubs list on the pub detail page.

## Next (this quarter — depends on `pubdbapi`)

### 4. Save/favourite a pub — *Retention*
Let a user bookmark pubs to come back to — needs persistence, which doesn't exist on the
frontend today.

1. **Depends on `pubdbapi`:** a favourites/bookmarks endpoint scoped to a user — out of scope
   for this repo's PRs; coordinate via `pubdbapi`'s own roadmap.
2. Once available: a "save" button on pub cards/detail pages wired to it.
3. A "my saved pubs" page.

---
*PubDB — product roadmap, 2 September 2026*
