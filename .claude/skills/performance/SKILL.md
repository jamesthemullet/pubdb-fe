---
name: performance
description: Audits the Next.js / React app for performance issues, then creates GitHub issues — minor findings are grouped into one issue, significant findings each get their own issue. No issues are created if nothing worth improving is found.
version: 1.0.0
---

# Performance Skill

You are running a performance audit session for Pub DB — a Next.js 15 / React 19 / TypeScript app.

## Stack

- Next.js 15 App Router — routes under `src/app/`, shared UI under `src/app/components/`, feature components under `src/app/features/`
- React 19 with functional components and hooks
- CSS Modules for styling (co-located `.module.css` per component)
- Custom hooks in `src/hooks/`
- Shared utilities in `src/lib/`
- API layer: Next.js route handlers in `src/app/api/` proxy to the backend REST API

## What to do each invocation

### Step 1 — Audit the codebase

Read the source files under `src/`. Audit across all of these performance categories simultaneously:

**Rendering**
- Client components (`"use client"`) that could be Server Components (no hooks, no browser APIs, no event handlers)
- Missing `React.memo` / `useMemo` / `useCallback` on expensive computations or frequently re-rendered components
- Components that re-render on every parent render without good reason (large list items, static subtrees)
- Inline object/array/function literals passed as props (new reference every render)

**Data fetching**
- `useEffect` + `fetch` patterns in client components where a Server Component `async` fetch would be simpler and faster (eliminates client-side waterfall)
- Fetch calls missing `cache` / `revalidate` options in server contexts
- N+1 fetch patterns (fetching child data in a loop without batching)
- Missing `loading.tsx` / `Suspense` boundaries that would allow streaming

**Bundle & assets**
- Large static imports that could be `next/dynamic` lazy-loaded (only load on demand)
- Images not using `next/image` (missing lazy-loading, sizing, format optimisation)
- Fonts loaded via `<link>` instead of `next/font`
- Third-party scripts not using `next/script` with an appropriate `strategy`

**CSS & layout**
- CSS properties that trigger layout (width, height, top, left in animations) instead of `transform`/`opacity`
- Styles applied via JavaScript that could be static CSS Module classes

**State management**
- State stored high up the tree that causes wide subtree re-renders; could be pushed down or extracted to a context
- `localStorage` reads during render without a guard (causes hydration mismatch)

### Step 2 — Classify findings

For each finding, decide its severity:

- **Significant** — likely to have a measurable impact on LCP, INP, bundle size, or time-to-interactive. Examples: a client component that could be a server component, a large un-split bundle, missing `next/image` on above-the-fold images, N+1 fetch, no Suspense on a slow data fetch.
- **Minor** — real but low-impact. Examples: a missing `useCallback` on a non-critical handler, an inline style that avoids layout thrash, a font loaded via `<link>` where `next/font` would help.

If there are **no findings** worth reporting (the app is already in good shape for its size), output this and stop — do **not** create any GitHub issues:

```
## Performance audit

No significant or minor performance issues found. The app is in good shape.
```

### Step 3 — Report

Output this structure:

```
## Performance audit

### Significant findings
<numbered list — each finding: file:line, category, one-sentence description of the problem and its impact>

### Minor findings
<numbered list — each finding: file:line, category, one-sentence description>

### No action needed
<anything you explicitly checked and found to be fine — so the next run doesn't re-examine it>
```

If there are no significant (or no minor) findings, omit that section rather than writing "None."

### Step 4 — Create GitHub issues

**Significant findings:** create one GitHub issue per finding.

```bash
gh issue create \
  --title "perf: <short title>" \
  --label "performance" \
  --body "## Performance issue

**Category:** <category>
**File:** <file:line>
**Problem:** <what the issue is and why it matters for performance>
**Suggested fix:** <concrete change to make, referencing the existing stack patterns>
**Expected impact:** <what metric or experience improves>"
```

**Minor findings:** if there are two or more, group them into a single issue. If there is only one, still create one issue.

```bash
gh issue create \
  --title "perf: minor improvements batch" \
  --label "performance" \
  --body "## Minor performance improvements

These are small wins that individually have low impact but are worth addressing.

<for each finding:>
### <short title> (<file:line>)
**Category:** <category>
**Problem:** <one sentence>
**Suggested fix:** <one sentence>"
```

After creating each issue, output its URL.

If the `performance` label does not exist, create it first:

```bash
gh label create performance --color "e4e669" --description "Performance improvements"
```

## Known project patterns

- **Server vs client boundary:** Files with `"use client"` at the top are client components. Files without it, and all files under `src/app/api/`, are server-side. Audit `"use client"` components carefully — many may not need it.
- **Data fetching:** Client hooks in `src/hooks/` use `useEffect` + `fetch`. These are candidates for Server Component migration on routes that don't need interactivity.
- **Images:** Check `src/app/` for `<img>` tags; they should be `<Image>` from `next/image`.
- **Pagination:** The pub list fetches 50 pubs per page. Ensure list item components are not re-created on every render.
- **Auth:** JWT from `localStorage` — any `localStorage` read at render time needs a `useEffect` or `typeof window !== "undefined"` guard to avoid hydration mismatch.
- **No maps yet:** `lat`/`lng` exist but are unused — if a map is added in future it must be `next/dynamic`-loaded.
- **No global state library:** State is local hook state + `localStorage`. Wide re-renders from state high in the tree are possible.
