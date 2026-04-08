# Test Improver Memory — jamesthemullet/pubdb-fe

## Discovered Commands (validated)
- `yarn test` — vitest run (all unit tests)
- `yarn test:coverage` — vitest run --coverage (v8 provider)
- `yarn lint` — biome check . (many pre-existing errors/warnings, not caused by us)
- `yarn build` — next build

## Test Framework
- Vitest + @testing-library/react + jsdom
- @testing-library/jest-dom for matchers
- Patterns: vi.spyOn(globalThis, 'fetch'), waitFor, fireEvent
- next/navigation mocked with vi.mock("next/navigation")
- next/link mocked as plain <a> element

## Testing Notes
- biome warns on `!` non-null assertions in tests — expected, use cast or suppress
- Fake timers (vi.useFakeTimers) break waitFor — use real timers + waitFor instead
- pubs/page.tsx uses 100ms debounce for search — waitFor handles it fine with real timers
- Pre-existing lint: 78 errors + 62 warnings (not our concern)

## Last Run Tasks
- 2026-04-08: Task 1 (commands), Task 3 (implement tests), Task 7 (activity summary)

## Completed Work
- PR: [Test Improver] Add tests for forgot-password, reset-password, and pubs list pages
  - Branch: test-assist/auth-and-pubs-pages
  - 32 new tests (116 → 148)
  - forgot-password: 0% → 100% stmts, 89% branch
  - reset-password: 0% → 100% stmts, 87% branch
  - pubs/page: 0% → 99% stmts, 91% branch

## Testing Backlog (prioritised by value)
1. **`pubs/[id]/page.tsx`** (1469 lines, 0%) — largest untested file, complex pub detail/edit page. High value but high complexity.
2. **`features/dashboard/dashboard.tsx`** (621 lines, 0%) — API key management dashboard
3. **`success/page.tsx`** (257 lines, 0%) — payment success flow with session verification
4. **`register/page.tsx`** (210 lines, 0%) — user registration form
5. **`reset-password/page.tsx`** — ✅ DONE
6. **`forgot-password/page.tsx`** — ✅ DONE  
7. **`pubs/page.tsx`** — ✅ DONE
8. **`pricing.tsx`** (574 lines, 0%) — pricing tiers display (lower value, mostly static)
9. **`profile/page.tsx`** (15 lines) — thin wrapper around Dashboard, low value alone

## Backlog Cursor
Next run: start with pubs/[id]/page.tsx or register/page.tsx
