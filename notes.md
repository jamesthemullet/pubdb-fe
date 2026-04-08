# Perf Improver Notes — pubdb-fe

## Repo Overview
- Next.js 15 + React 19, TypeScript, Biome linter
- Vitest for unit tests, Playwright for e2e
- Test suite: 20 files, 117 tests

## Performance Notes
- `useCountries` hook: now cached at module level (first run fix)
- `cache: "no-store"` on both API routes (/api/pubs, /api/beer-types)
- pubs/page.tsx fetches with `limit=10000` — all pubs client-side, no pagination
- pubs.tsx (legacy component) duplicates fetch logic from pubs/page.tsx

## Optimization Backlog (prioritized)
1. ~~`useCountries` module-level cache~~ (DONE - PR submitted 2026-04-08)
2. Add cache revalidation to `/api/beer-types` route (static-ish data, `cache: "no-store"` is wasteful)
3. Add cache revalidation to `/api/pubs` route (or move to ISR/SWR)
4. Pubs list: `limit=10000` fetches everything client-side; server-side filtering/pagination would reduce payload
5. `pubs.tsx` vs `pubs/page.tsx` — two components doing similar things; consolidation could reduce bundle
6. No performance benchmarks or Lighthouse CI — consider adding
