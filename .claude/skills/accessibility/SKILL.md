---
name: accessibility
description: Audits the Next.js / React app for accessibility issues, then creates GitHub issues — minor findings are grouped into one issue, significant findings each get their own issue. No issues are created if nothing worth improving is found.
version: 1.0.0
---

# Accessibility Skill

You are running an accessibility audit session for Pub DB — a Next.js 15 / React 19 / TypeScript app.

## Stack

- Next.js 15 App Router — routes under `src/app/`, shared UI under `src/app/components/`, feature components under `src/app/features/`
- React 19 with functional components and hooks
- CSS Modules for styling (co-located `.module.css` per component)
- Custom hooks in `src/hooks/`
- Shared utilities in `src/lib/`
- API layer: Next.js route handlers in `src/app/api/` proxy to the backend REST API

## What to do each invocation

### Step 1 — Audit the codebase

Read the source files under `src/`. Audit across all of these accessibility categories simultaneously:

**Semantic HTML & landmarks**
- Non-semantic elements (`<div>`, `<span>`) used where a semantic element (`<button>`, `<nav>`, `<main>`, `<header>`, `<section>`, `<article>`, `<aside>`) would be appropriate
- Missing or misused landmark roles (`main`, `navigation`, `banner`, `contentinfo`, `complementary`)
- Heading hierarchy gaps (e.g. jumping from `<h1>` to `<h3>`, using `<p>` or styled `<div>` as section headings instead of `<h2>`–`<h6>`)
- Interactive elements that are not natively focusable (`<div onClick>`, `<span onClick>`) — these need `role="button"` and `tabIndex={0}`

**ARIA**
- Missing `aria-label` / `aria-labelledby` on icon-only buttons, SVG icons used as interactive elements, or inputs without a visible label
- `aria-hidden="true"` applied incorrectly (e.g. on focusable elements, or on containers that contain focusable children)
- `aria-expanded`, `aria-controls`, `aria-haspopup` missing on disclosure widgets (dropdowns, accordions, modals)
- Progress bars or meters without `role="progressbar"` and `aria-valuenow` / `aria-valuemin` / `aria-valuemax`
- `aria-live` regions missing for dynamically injected content (toast messages, async fetch results, error summaries)

**Keyboard navigation**
- Focus not trapped in modal dialogs or overlapping panels when they are open
- Missing `Escape` key handler on dialogs, drawers, or dropdowns
- Tab order that does not match the visual reading order
- Missing skip-navigation link (`<a href="#main-content">Skip to content</a>`) before the primary nav
- Interactive elements that cannot be activated with `Enter` or `Space`

**Forms**
- `<input>`, `<textarea>`, or `<select>` without an associated `<label>` (via `htmlFor` / `id`, `aria-label`, or `aria-labelledby`)
- Error messages not programmatically associated with their input (`aria-describedby`)
- Required fields not indicated accessibly (`aria-required="true"` or `required` attribute)
- Form validation errors announced only visually (no `role="alert"` or `aria-live` region)

**Images & media**
- `<img>` tags missing `alt` attribute, or `alt=""` used on non-decorative images
- SVG icons that convey meaning but lack `aria-label` or `<title>` (decorative SVGs should have `aria-hidden="true"`)
- Background images used to convey content (CSS `background-image` on elements that represent meaningful images)

**Color & contrast** *(static analysis only — flag patterns, do not compute ratios)*
- Text rendered as placeholder-only (no visible label) — placeholders disappear on input and have low contrast in most browsers
- Disabled-state elements that convey no visual feedback beyond reduced opacity (may be invisible to low-vision users)
- Focus outlines removed via `outline: none` / `outline: 0` in CSS without a replacement focus indicator

**Announced state & live regions**
- Loading spinners or skeleton states with no screen-reader announcement
- Success / error toasts or banners injected into the DOM without `role="alert"` or `aria-live`
- Route changes in the SPA not announcing the new page title to screen readers

### Step 2 — Classify findings

For each finding, decide its severity:

- **Significant** — blocks or severely impairs a user relying on a keyboard, screen reader, or other assistive technology. Examples: an icon-only button with no accessible name, a form input with no label, a modal that does not trap focus, a skip-navigation link missing from a page with a long nav, a progress bar with no ARIA role or values, a div with an onClick handler but no keyboard support.
- **Minor** — real but lower impact. Examples: a placeholder used as the only label hint, a decorative SVG missing `aria-hidden`, a heading level skipped once, `aria-live` missing on a non-critical status update, a CSS `outline: none` without a custom replacement.

If there are **no findings** worth reporting (the app is already in good shape), output this and stop — do **not** create any GitHub issues:

```
## Accessibility audit

No significant or minor accessibility issues found. The app is in good shape.
```

### Step 3 — Report

Output this structure:

```
## Accessibility audit

### Significant findings
<numbered list — each finding: file:line, WCAG criterion (e.g. 1.1.1, 4.1.2), one-sentence description of the problem and its impact>

### Minor findings
<numbered list — each finding: file:line, WCAG criterion, one-sentence description>

### No action needed
<anything you explicitly checked and found to be fine — so the next run doesn't re-examine it>
```

If there are no significant (or no minor) findings, omit that section rather than writing "None."

### Step 4 — Create GitHub issues

**Significant findings:** create one GitHub issue per finding.

Use the GitHub MCP tools (mcp__github__issue_write) to create issues. Do NOT use the `gh` CLI.

For each significant finding, call mcp__github__issue_write with:
- owner: `jamesthemullet`
- repo: `pubdb-fe`
- title: `a11y: <short title>`
- body including:
  - **WCAG criterion**: e.g. 1.1.1 Non-text Content (Level A)
  - **File**: file:line
  - **Problem**: what the issue is and why it matters for accessibility
  - **Suggested fix**: concrete change referencing the existing stack patterns
  - **Impact**: who is affected and how (screen reader users, keyboard-only users, etc.)
- labels: `["accessibility"]`

**Minor findings:** if there are two or more, group them into a single issue. If there is only one, still create one issue.

Call mcp__github__issue_write with:
- owner: `jamesthemullet`
- repo: `pubdb-fe`
- title: `a11y: minor improvements batch`
- body listing each minor finding with its file, criterion, problem, and fix
- labels: `["accessibility"]`

After creating each issue, output its URL.

If the `accessibility` label does not exist, create it first using mcp__github__issue_write or another appropriate MCP tool. The label color should be `"0075ca"` (GitHub's default blue for accessibility) and description `"Accessibility improvements"`.

## Known project patterns

- **Sidebar nav:** Uses `<aside>` + `<nav aria-label="...">` correctly. The burger button has `aria-label` and `aria-expanded`. Overlay div uses `aria-hidden="true"`. The active nav item is styled but not indicated via `aria-current="page"`.
- **Plan progress bar:** `src/app/components/sidebar/sidebar.tsx` renders a visual progress bar (`planBar` / `planBarFill`) with no `role="progressbar"` or ARIA value attributes — screen readers cannot convey the usage percentage.
- **Section headings in nav:** The `WORKSPACE` and `ACCOUNT` labels are rendered as `<p>` elements, not as semantic headings or elements with `role="heading"`.
- **Forms:** Inputs in pub forms, login, and register pages should each have a programmatically associated `<label>`. Check `src/app/components/input/Input.tsx`, `src/app/components/pub-form/`, and auth pages.
- **Error messages:** `FieldErrorList` in `src/app/components/pub-form/FieldErrorList.tsx` renders validation errors — check whether these are announced live or associated via `aria-describedby`.
- **Icon buttons:** The edit button (`src/app/components/edit-button/`) and any icon-only controls need accessible names.
- **Auth:** Login and register pages (`src/app/register/`, `src/app/login/`) contain forms — verify labels are present and errors are announced.
- **Dropdown:** `src/app/components/dropdown/Dropdown.tsx` — check for `aria-expanded`, `aria-haspopup`, and keyboard support.
- **Images:** Check all `<img>` tags and SVG icons across the codebase for missing or incorrect `alt` / `aria-hidden`.
- **Skip link:** Verify whether a skip-to-content link exists in the root layout.
- **No router announcement:** Next.js App Router does not automatically announce route changes to screen readers — check if a `RouteAnnouncer` or equivalent exists.
- **WCAG target:** Aim for WCAG 2.1 Level AA compliance. Flag Level A violations as significant; Level AA violations that are impactful as significant, others as minor.
