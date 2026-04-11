# Perf Improver Notes — pubdb-fe

## Repo Overview
- Next.js 15 + React 19, TypeScript, Biome linter
- Vitest for unit tests, Playwright for e2e
- Test suite: 29 files, 208 tests (as of 2026-04-11)

## Performance Notes
- `useCountries` hook: module-level cache (merged to main)
- `useBeerTypes` hook: module-level cache (merged to main)
- `/api/pubs`: caching added (60s revalidate + Cache-Control) — committed on branch perf-assist/pubs-api-cache, push pending (safeoutputs unavailable)
- `/api/beer-types`: keeps `cache: "no-store"` (forwardAuth=true — per-user)
- pubs/page.tsx fetches with `limit=10000` — all pubs client-side, no pagination
- pubs.tsx (legacy component) only referenced in its own test

## Measurement Infrastructure Notes
- No performance benchmarks or Lighthouse CI configured
- CI: unit tests (vitest), lint (biome), ts-check, e2e (playwright)
- No bundle size tracking
- Key gap: no performance regression detection in CI

## Optimization Backlog (prioritized)
1. ~~`useCountries` module-level cache~~ (DONE - merged)
2. ~~`useBeerTypes` module-level cache~~ (DONE - merged)
3. ~~Add cache to `/api/pubs` route + 300ms debounce~~ (COMMITTED - branch perf-assist/pubs-api-cache, push pending again due to safeoutputs unavailability)
4. Pubs list: `limit=10000` — server-side filtering/pagination would reduce payload
5. `pubs.tsx` vs `pubs/page.tsx` consolidation could reduce bundle
6. No performance benchmarks or Lighthouse CI — consider adding

## Known Limitation
- safeoutputs MCP tools are unavailable in this run environment
- perf-assist/pubs-api-cache branch changes are committed locally but CANNOT be pushed
- NEXT RUN: Must push the branch and create PR (changes will be lost if environment resets)
