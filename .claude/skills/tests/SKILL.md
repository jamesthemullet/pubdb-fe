---
name: tests
description: This skill should be used when the user types "/tests", asks to "improve test coverage", "add a test", "write tests", or asks about "what tests are missing". It analyses the current unit and e2e test suites, decides which type of improvement is most valuable, and writes one incremental test. E2e tests must cover real functionality flows — not just visible UI state, which is a unit test concern.
version: 1.0.0
---

# Tests Skill

Incrementally improve test coverage for this repo by adding one well-chosen test.

## Decision Framework

### Choose e2e when:
- A complete user flow involves multiple pages or real navigation
- The test requires verifying that multiple components work together end-to-end (e.g. filling a form, submitting it, and seeing the result)
- The behaviour can only be verified by exercising the real browser environment (localStorage, route transitions, real fetch calls being intercepted)
- There is no e2e coverage at all for a feature that has meaningful user interaction

### Choose unit when:
- The logic is self-contained (a utility, hook, component, or API route handler)
- The test would duplicate an existing e2e flow without adding new confidence
- Edge-case or error-path coverage is missing for a function that already has a happy-path test
- A component renders conditional states that are not exercised by existing tests

**E2e tests must cover functionality, not just presence.** Asserting that a button is visible is a unit test concern. E2e tests should assert that clicking the button actually does something — data is saved, navigation occurs, an error is shown, state changes.

## Process

1. **Audit existing tests** — read the file tree under `src/**/*.spec.{ts,tsx}` and `e2e/tests/*.spec.ts` to understand what is already covered.

2. **Audit source code** — read the main source files under `src/` to identify features and logic paths.

3. **Identify the single most valuable gap** using this priority order:
   a. An entire user flow with no e2e coverage (highest value)
   b. A complex source file (>100 lines) with no unit test at all
   c. A meaningful functional gap in an existing e2e spec (e.g. the edit flow is not exercised, only the display)
   d. A utility/hook with untested edge cases or error paths
   e. If no justifiable improvement exists, report that clearly and stop.

4. **Write the test** following the patterns below.

5. **Run the relevant test suite** to confirm the new test passes:
   - Unit: `yarn test --run <path-to-spec>`
   - E2e: `yarn test:e2e <path-to-spec>` (requires the dev server to be running)

6. **Report** what was added, why it was chosen, and what gap it closes.

## Patterns

### Unit test (Vitest + React Testing Library)

Follow existing specs under `src/`. Key conventions:
- File: alongside the source file, e.g. `src/app/features/foo/foo.spec.tsx`
- Mock external fetch calls with `vi.stubGlobal('fetch', ...)` or `vi.fn()`
- Use `render`, `screen`, `fireEvent`/`userEvent` from `@testing-library/react`
- Assert on user-visible outcomes, not implementation details

### E2e test (Playwright)

Follow existing specs under `e2e/tests/`. Key conventions:
- Import helpers from `../fixtures/auth` (`makeFakeJwt`, `setAuthToken`, `mockDashboardEndpoint`)
- Mock the backend API at port 4000 using `page.route()` with URL predicates like `(url: URL) => url.port === "4000" && url.pathname === "/pubs/42"`
- Mock secondary APIs (countries at `restcountries.com`, beer types at `/api/beer-types`) via a `silenceSecondaryAPIs` helper when they are not under test
- Authenticate by calling `setAuthToken(page, 'test@example.com')` before `page.goto()`
- Assert on **functional outcomes**: data submitted, navigation triggered, state updated — not just element visibility

## Repo-specific context

- Unit test runner: `yarn test` (Vitest, jsdom environment)
- E2e runner: `yarn test:e2e` (Playwright, baseURL http://localhost:3000, auto-starts `yarn dev`)
- Backend API runs on port 4000; intercept with `page.route()`
- Auth token stored in `localStorage` under key `"token"` as a JWT
- User tiers: `"HOBBY"`, `"PRO"`, `"ADMIN"` — affects what UI is shown (e.g. delete button is admin-only)
- Opening hours feature: `src/app/features/opening-hours/` — editor, display, and Google paste parser
- The most complex page (`/pubs/[id]`, `src/app/pubs/[id]/page.tsx`) has e2e display coverage but **no unit tests** and the edit flow is not exercised in e2e
