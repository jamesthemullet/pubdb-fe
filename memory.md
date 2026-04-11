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
- Labels in forms often lack for/id association — use container.querySelector('input[name="x"]')
- HTML5 required validation runs in jsdom — fill ALL required fields before clicking submit
- setTimeout-based redirects (e.g. window.location.href after 500ms) hard to test without fake timers; test side effects instead (localStorage, dispatchEvent, success message)
- Dashboard: loading state not reliably testable — useEffect([isAuthenticated]) fires with isAuthenticated=false on mount, calls setLoading(false) early; by the time authenticated fetch runs, loading=false
- Dashboard: forgotKeyError bug — error set but only rendered when forgotKeyTarget matches keyPrefix; early return (empty email) sets error but not target, so error never shown

## Last Run Tasks
- 2026-04-11: Task 3 (implement tests for dashboard.tsx), Task 7 (activity summary)
- 2026-04-10: Task 3 (implement tests for success/page.tsx), Task 7 (activity summary)
- 2026-04-09: Task 3 (implement tests for register/login page), Task 7 (activity summary)
- 2026-04-08: Task 1 (commands), Task 3 (implement tests), Task 7 (activity summary)

## Completed Work
- PR: [Test Improver] Add tests for Dashboard component
  - Branch: test-assist/dashboard-tests
  - 25 new tests (208 → 233)
  - dashboard.tsx: 0% → ~80%+ coverage
  - Bug found: forgotKeyError not rendered when email missing (forgotKeyTarget not set on early return)
  - Run: https://github.com/jamesthemullet/pubdb-fe/actions/runs/24270960530
- PR: [Test Improver] Add tests for success/page.tsx (payment verification)
  - Branch: test-assist/success-page-tests
  - 32 new tests (172 → 204)
  - success/page.tsx: 0% → ~85%+ stmts, billing day formatting fully covered
  - Run: https://github.com/jamesthemullet/pubdb-fe/actions/runs/24221130336
- PR: [Test Improver] Add tests for forgot-password, reset-password, and pubs list pages
  - Branch: test-assist/auth-and-pubs-pages-c6645726406cc200
  - 32 new tests (116 → 148)
  - NOTE: branch pushed but PR couldn't be created (Actions permissions); user needs to create PR from branch
- PR: [Test Improver] Add tests for register/login page
  - Branch: test-assist/register-login-page
  - 15 new tests (116 → 131)
  - register/page.tsx: 0% → 89.83% stmts, 78.72% branch, 100% funcs
  - NOTE: same permissions issue may apply

## Testing Backlog (prioritised by value)
1. **`pubs/[id]/page.tsx`** (1435 lines, 0%) — largest untested file, complex pub detail/edit page. High value but high complexity.
2. **`features/dashboard/dashboard.tsx`** — DONE (25 tests, branch: test-assist/dashboard-tests)
3. **`success/page.tsx`** — DONE (branch: test-assist/success-page-tests)
4. **`register/page.tsx`** — DONE (89.83% stmts)
5. **`reset-password/page.tsx`** — DONE (branch, not merged)
6. **`forgot-password/page.tsx`** — DONE (branch, not merged)
7. **`pubs/page.tsx`** — DONE (branch, not merged)
8. **`pricing.tsx`** (574 lines, 0%) — pricing tiers display (lower value, mostly static)
9. **`profile/page.tsx`** (15 lines) — thin wrapper around Dashboard, low value alone

## Backlog Cursor
Next run: pubs/[id]/page.tsx (complex, worth careful approach - may need multiple runs)
Or: features/pricing/pricing.tsx if [id]/page.tsx is too complex for one run
