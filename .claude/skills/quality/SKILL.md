---
name: quality
description: Incremental code quality improvement. Each invocation picks one category, finds the single clearest instance of a quality issue, fixes it, and reports what was done and what to tackle next.
version: 1.0.0
---

# Quality Skill

You are running an incremental code quality improvement session for this Next.js 15 / React 19 / TypeScript project.

## Stack

- TypeScript strict mode (`tsconfig.json`)
- React 19 with functional components and hooks
- Next.js 15 App Router — routes live under `src/app/`, shared UI under `src/app/components/`, feature components under `src/app/features/`
- CSS Modules for styling (inline `style=` props are a pattern to flag)
- Custom hooks in `src/hooks/`
- Shared utilities in `src/lib/`
- Type definitions in `src/types/`
- Constants in `src/constants/`
- Biome for linting (`biome.json`)

## What to do each invocation

### Step 1 — Pick a category

Use the current second of the clock (or any arbitrary signal) to pick **one** of these four categories. Vary the selection — do not always pick the same one:

1. **Strict typing** — look for: explicit `any`, unsafe `as Type` casts, missing return type annotations on exported functions, non-null assertions (`!`) that could be replaced with proper guards, props typed as `object` or `{}`
2. **Code duplication** — look for: repeated logic blocks across components, identical conditional rendering patterns, values inlined 3+ times that should be a named constant in `src/constants/`
3. **Bad patterns** — look for: `useEffect` with missing or overly broad dependency arrays, state mutation instead of returning new values, magic numbers/strings, inline `style=` props where a CSS Module class should be used, business logic in page/route components that belongs in a hook or `src/lib/`
4. **Dead code** — look for: exported symbols not imported anywhere in the project, commented-out code blocks left in files, unused imports

### Step 2 — Find the best candidate

Read the relevant source files under `src/`. Identify the **single clearest, most impactful** instance of the chosen category. Prefer issues that:
- Are in frequently-used files (shared components, heavily-linked hooks, `src/lib/`)
- Have an unambiguous fix
- Won't require changes across many files

### Step 3 — Fix it

Make the fix. Keep scope tight — one issue, one or two files. Do not refactor beyond what is needed to address the specific finding.

After fixing, run `yarn ts-check` to confirm no new type errors were introduced.

### Step 4 — Create a PR

1. Create a new branch from `main` named `quality/<category-slug>-<short-description>` (e.g. `quality/dead-code-unused-export`, `quality/typing-missing-return-type`).
2. Stage only the files you changed and commit with a message following this pattern:
   ```
   chore(quality): <what was fixed> (<category>)
   ```
3. Push the branch and open a PR against `main` using `gh pr create`. Use this body template:

   ```
   ## Quality improvement

   **Category:** <chosen category name>
   **File:** <path:line>
   **Issue:** <one sentence describing the problem>
   **Fix:** <what was changed and why>

   ---
   **Next suggestion:** <the next candidate worth tackling in this category, with file path>

   🤖 Generated with [Claude Code](https://claude.com/claude-code)
   ```

4. Return the PR URL to the user.

## Known project patterns

- **Styling:** CSS Modules — every component has a co-located `.module.css` file. Flag inline `style=` props as a quality issue.
- **Hooks:** Custom hooks live in `src/hooks/`. If a component has non-trivial fetch logic or derived state spanning 15+ lines, consider whether it belongs in a hook.
- **API calls:** Fetch calls go through Next.js API routes under `src/app/api/`. Direct calls to the backend from client components are a smell.
- **Auth:** JWT token stored in `localStorage` under key `"token"`. Auth helpers live in `src/lib/auth.ts`.
- **Error handling:** Error utilities live in `src/lib/errors.ts`. Ad-hoc string comparisons for error messages in components are a smell.
- **Constants:** Named constants belong in `src/constants/`. Magic strings (e.g. repeated route paths, tier names `"HOBBY"` / `"PRO"` / `"ADMIN"`) inlined across files are a duplication smell.
- **App Router conventions:** Page components (`page.tsx`) should be thin — data fetching logic and complex state belong in hooks or server actions, not in the page component body.
- **No global state library:** There is no Redux/Zustand/Context store. Prop drilling across more than 2 levels in a feature directory is a smell — extract a hook or co-locate state closer to the leaf.
- **Biome:** Run `yarn lint` to check for linter violations. Do not flag issues that Biome already enforces (formatting, import order) — focus on semantic quality.
- **No knip.json:** Dead code detection is manual — scan for exported symbols that are never imported.
