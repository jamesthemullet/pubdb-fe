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
- 2026-04-13: Task 3 (implement tests for pubs/[id]/page.tsx — recreated, 34 tests, 209→243 total), Task 7 (activity summary)
- 2026-04-12: Task 3 (implement tests for pubs/[id]/page.tsx), Task 7 (activity summary — safeoutputs unavailable)
- 2026-04-11: Task 3 (implement tests for dashboard.tsx), Task 7 (activity summary)
- 2026-04-10: Task 3 (implement tests for success/page.tsx), Task 7 (activity summary)
- 2026-04-09: Task 3 (implement tests for register/login page), Task 7 (activity summary)
- 2026-04-08: Task 1 (commands), Task 3 (implement tests), Task 7 (activity summary)

## Completed Work
- PR: [Test Improver] Add tests for pubs/[id]/page.tsx (pub detail page)
  - Branch: test-assist/pub-detail-page-tests
  - 34 new tests (209 → 243 total)
  - Covers: loading states, pub display, EditButton auth states, edit mode, save success/error, validation, beer garden CRUD, opening hours rendering
  - Run: https://github.com/jamesthemullet/pubdb-fe/actions/runs/24321089345
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

## Testing Notes (additions)
- pubs/[id]/page.tsx: next/image must be mocked (`vi.mock("next/image", ...)`) → biome lint/performance/noImgElement — suppress with biome-ignore
- pubs/[id]/page.tsx: Two "Cancel" and two "Save" buttons exist in edit mode (top and bottom groups) — use getAllByRole
- pubs/[id]/page.tsx: Save button is disabled (not just hidden) when required fields are empty — isSaveDisabled computed
- pubs/[id]/page.tsx: phone input handles validation in onChange directly (not via handleFieldChange) — invalid chars set error but don't update field value
- pubs/[id]/page.tsx: delete success redirects via window.location.href — not easily testable; test error path instead

## Testing Backlog (prioritised by value)
1. **`pubs/[id]/page.tsx`** — DONE (branch: test-assist/pub-detail-page-tests, 78.43% stmts)
2. **`features/dashboard/dashboard.tsx`** — DONE (25 tests, branch: test-assist/dashboard-tests)
3. **`success/page.tsx`** — DONE (branch: test-assist/success-page-tests)
4. **`register/page.tsx`** — DONE (89.83% stmts)
5. **`reset-password/page.tsx`** — DONE (branch, not merged)
6. **`forgot-password/page.tsx`** — DONE (branch, not merged)
7. **`pubs/page.tsx`** — DONE (branch, not merged)
8. **`pricing.tsx`** (574 lines) — pricing tiers display (lower value, mostly static). Some spec exists already.
9. **`profile/page.tsx`** (15 lines) — thin wrapper around Dashboard, low value alone

## Backlog Cursor
Next run: Task 4 (check if any open Test Improver PRs have CI failures to fix)
Then: Consider new targets — add-pub/page.tsx (form-heavy, high value), or Task 6 (test infrastructure)
No remaining high-value untested pages identified; most coverage done
