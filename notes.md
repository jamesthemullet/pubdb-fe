# Perf Improver Notes — pubdb-fe

## Repo Overview
- Next.js 15 + React 19, TypeScript, Biome linter
- Vitest for unit tests, Playwright for e2e
- Test suite: 25 files, 172 tests (as of 2026-04-10)

## Performance Notes
- `useCountries` hook: module-level cache (merged to main)
- `useBeerTypes` hook: module-level cache (merged to main)
- `/api/pubs`: caching added (60s revalidate + Cache-Control) on branch perf-assist/pubs-api-cache
- `/api/beer-types`: keeps `cache: "no-store"` (forwardAuth=true — per-user)
- pubs/page.tsx fetches with `limit=10000` — all pubs client-side, no pagination
- pubs.tsx (legacy component) only referenced in its own test

## Optimization Backlog (prioritized)
1. ~~`useCountries` module-level cache~~ (DONE - merged)
2. ~~`useBeerTypes` module-level cache~~ (DONE - merged)
3. ~~Add cache to `/api/pubs` route~~ (DONE - branch perf-assist/pubs-api-cache, push pending)
4. Pubs list: `limit=10000` — server-side filtering/pagination would reduce payload
5. `pubs.tsx` vs `pubs/page.tsx` consolidation could reduce bundle
6. No performance benchmarks or Lighthouse CI — consider adding
