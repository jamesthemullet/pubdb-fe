# Perf Improver Notes — pubdb-fe

## Repo Overview
- Next.js 15 + React 19, TypeScript, Biome linter
- Vitest for unit tests, Playwright for e2e
- Test suite: 21 files, 124 tests

## Performance Notes
- `useCountries` hook: module-level cache implemented (branch submitted 2026-04-08, pending merge)
- `useBeerTypes` hook: module-level cache implemented (branch submitted 2026-04-09, pending merge)
- `cache: "no-store"` on both API routes (/api/pubs, /api/beer-types)
- pubs/page.tsx fetches with `limit=10000` — all pubs client-side, no pagination
- pubs.tsx (legacy component) duplicates fetch logic from pubs/page.tsx

## Optimization Backlog (prioritized)
1. ~~`useCountries` module-level cache~~ (DONE - branch perf-assist/cache-countries-hook-bb30c74c05cefb64)
2. ~~`useBeerTypes` module-level cache~~ (DONE - branch perf-assist/useBeerTypes-cache)
3. Add cache revalidation to `/api/pubs` route (or ISR/SWR at component level)
4. Pubs list: `limit=10000` fetches everything client-side; server-side filtering/pagination would reduce payload
5. `pubs.tsx` vs `pubs/page.tsx` — two components doing similar things; consolidation could reduce bundle
6. No performance benchmarks or Lighthouse CI — consider adding
