---
name: accessibility
description: Incremental accessibility improvement. Each invocation picks one category, finds the single clearest instance of an accessibility issue, fixes it, and raises a PR.
version: 2.0.0
---

# Accessibility Skill

You are running an incremental accessibility improvement session for Pub DB — a Next.js 15 / React 19 / TypeScript app.

## Stack

- Next.js 15 App Router — routes under `src/app/`, shared UI under `src/app/components/`, feature components under `src/app/features/`
- React 19 with functional components and hooks
- CSS Modules for styling (co-located `.module.css` per component)
- Custom hooks in `src/hooks/`
- Shared utilities in `src/lib/`
- API layer: Next.js route handlers in `src/app/api/` proxy to the backend REST API

## What to do each invocation

### Step 1 — Pick a category

Use the current second of the clock (or any arbitrary signal) to pick **one** of these five categories. Vary the selection — do not always pick the same one:

1. **ARIA & roles** — missing `role="progressbar"` + values, missing `aria-expanded`/`aria-controls` on disclosure widgets, missing `aria-live` / `role="alert"` on dynamically injected content, incorrect `aria-hidden` usage
2. **Forms** — inputs without associated `<label>`, error messages not linked via `aria-describedby`, required fields without `aria-required` or `required`, validation errors with no live announcement
3. **Keyboard navigation** — `outline: none` without a visible replacement focus style, interactive elements unreachable by keyboard, missing `Escape` handler on dialogs/dropdowns, focus not trapped in modals
4. **Semantic HTML** — non-semantic `<div>`/`<span>` where a semantic element is appropriate, heading hierarchy gaps, active nav items missing `aria-current="page"`, landmark misuse
5. **Images & icons** — `<img>` missing `alt`, meaningful SVGs missing `aria-label` or `<title>`, decorative SVGs missing `aria-hidden="true"`

### Step 2 — Find the best candidate

Read the relevant source files under `src/`. Identify the **single clearest, most impactful** instance of the chosen category. Prefer issues that:
- Are in shared components used across many pages
- Have an unambiguous, self-contained fix
- Won't require changes across many files

If all known issues in the chosen category are already fixed, pick the next most impactful finding from any other category.

### Step 3 — Fix it

Make the fix. Keep scope tight — one issue, one or two files. Do not refactor beyond what is needed to address the specific finding.

After fixing, run `yarn ts-check` to confirm no new type errors were introduced.

### Step 4 — Create a PR

1. Create a new branch from `main` named `a11y/<category-slug>-<short-description>` (e.g. `a11y/aria-progress-bar`, `a11y/forms-aria-describedby`, `a11y/keyboard-focus-outline`).
2. Stage only the files you changed and commit with a message following this pattern:
   ```
   fix(a11y): <what was fixed> (<WCAG criterion>)
   ```
3. Push the branch and open a PR against `main` using `gh pr create`. Use this body template:

   ```
   ## Accessibility improvement

   **Category:** <chosen category name>
   **WCAG criterion:** <e.g. 4.1.2 Name, Role, Value (Level A)>
   **File:** <path:line>
   **Issue:** <one sentence describing the problem and its impact on assistive technology users>
   **Fix:** <what was changed and why>

   ---
   **Next suggestion:** <the next candidate worth tackling, with file path>

   🤖 Generated with [Claude Code](https://claude.com/claude-code)
   ```

4. Return the PR URL to the user.

## Known issues backlog (as of 2026-06-05)

Use this as a starting point each run — check whether items are still present before acting on them, and add new ones you discover:

- **ARIA & roles:** Plan usage progress bar (`src/app/components/sidebar/sidebar.tsx:145`) — needs `role="progressbar"` + `aria-valuenow/min/max`
- **ARIA & roles:** Auth success message (`src/app/components/auth-gate/AuthGate.tsx:151`) — needs `role="alert"` or `aria-live`
- **ARIA & roles:** Add-pub error summary (`src/app/add-pub/page.tsx:541`) — needs `role="alert"`
- **Forms:** `FieldErrorList` errors not linked to inputs via `aria-describedby` (`src/app/components/pub-form/FieldErrorList.tsx`)
- **Semantic HTML:** Active nav links missing `aria-current="page"` (`src/app/components/sidebar/sidebar.tsx:89,108`)
- **Keyboard navigation:** `outline: none` without sufficient replacement in `src/app/add-pub/page.module.css`, `src/app/pubs/page.module.css`, `src/app/settings/page.module.css`, `src/app/pubs/[id]/components/PubEditView.module.css`

## Known project patterns

- **Styling:** CSS Modules — every component has a co-located `.module.css` file.
- **Auth:** JWT token in `localStorage` under key `"token"`. Auth helpers in `src/lib/auth.ts`.
- **Sidebar nav:** Uses `<aside>` + `<nav aria-label="...">`. Burger button has `aria-label` and `aria-expanded`. Overlay has `aria-hidden="true"`. Skip link present in root layout.
- **Forms:** `FieldErrorList` renders per-field validation errors. `PubCoreIdentityFields` and `PubAmenitiesFields` use the shared `Input` and `Dropdown` components.
- **WCAG target:** Aim for WCAG 2.1 Level AA. Flag Level A violations as highest priority.
