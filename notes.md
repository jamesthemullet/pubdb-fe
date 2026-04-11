# Perf Improver Notes — pubdb-fe

## Repo Overview
- Next.js 15 + React 19, TypeScript, Biome linter
- Vitest for unit tests, Playwright for e2e
- Test suite: 29 files, 208 tests (as of 2026-04-11)

## Performance Notes
- `useCountries` hook: module-level cache (merged to main)
- `useBeerTypes` hook: module-level cache (merged to main)
- `/api/pubs`: cacheSeconds=60 + revalidate=60 + Cache-Control header — committed on branch perf-assist/pubs-api-cache; push blocked by missing safeoutputs MCP (3rd consecutive run)
- `/api/beer-types`: keeps `cache: "no-store"` (forwardAuth=true — per-user)
- pubs/page.tsx: debounce increased 100ms->300ms (part of pubs-api-cache branch)
- pubs/page.tsx fetches with `limit=10000` — all pubs client-side, no pagination
- pubs.tsx (legacy component) only referenced in its own test

## Measurement Infrastructure Notes
- No performance benchmarks or Lighthouse CI configured
- CI: unit tests (vitest), lint (biome), ts-check, e2e (playwright)
- No bundle size tracking
- Key gap: no performance regression detection in CI

## Optimization Backlog (prioritized)
1. DONE - `useCountries` module-level cache (merged)
2. DONE - `useBeerTypes` module-level cache (merged)
3. COMMITTED - Add cache to `/api/pubs` route + 300ms debounce (branch perf-assist/pubs-api-cache, push BLOCKED - safeoutputs MCP unavailable 3 consecutive runs)
4. Pubs list: `limit=10000` — server-side filtering/pagination would reduce payload
5. `pubs.tsx` vs `pubs/page.tsx` consolidation could reduce bundle
6. No performance benchmarks or Lighthouse CI — consider adding

## Known Infrastructure Issue
- safeoutputs MCP tools (create_pull_request, create_issue, noop, etc.) are NOT in this agent's tool list
- This has happened in 3 consecutive runs — blocking PR creation
- Branch changes are committed locally but cannot be pushed
- Environment resets between runs, so local commits are lost each time
