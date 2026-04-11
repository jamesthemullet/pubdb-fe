# AGENTS.md

This file provides guidance for AI agents (GitHub Copilot, Perf Improver, etc.) working in this repository.

## Project Overview

`pubdb-fe` is a Next.js 15 frontend application (TypeScript/React 19) for a pub database.
Key technologies: Next.js 15 (App Router), React 19, TypeScript, Biome (lint/format), Vitest (unit tests), Playwright (e2e tests).

## Repository Layout

```
src/
  app/           # Next.js App Router pages and API routes
  hooks/         # Custom React hooks
  constants/     # Shared constants (e.g., pub form field definitions)
  lib/           # Utility libraries
  types/         # TypeScript type definitions
e2e/             # Playwright end-to-end tests
```

## Commands

All commands use **yarn** (v1):

| Purpose              | Command                      |
|----------------------|------------------------------|
| Install dependencies | `yarn install`               |
| Development server   | `yarn dev`                   |
| Production build     | `yarn build`                 |
| Unit tests           | `yarn test`                  |
| Test coverage        | `yarn test:coverage`         |
| Type check           | `yarn ts-check`              |
| Lint (check only)    | `yarn lint`                  |
| Lint + auto-fix      | `yarn lint:fix`              |
| E2E tests            | `yarn test:e2e`              |

> **Important**: `yarn.lock` is a protected file — do not modify it directly. If dependency changes are needed, open a discussion issue first.

## Code Conventions

- **Formatter/linter**: Biome (`biome.json`). Always run `yarn lint:fix` after making code changes.
- **Tests**: Vitest with Testing Library. Test files are co-located: `*.spec.ts(x)` next to the source file.
- **TypeScript**: Strict mode. Run `yarn ts-check` to verify types.
- **Style**: Follow existing patterns in the file you are editing. Do not introduce new dependencies without maintainer approval.

## Pre-PR Checklist

Before creating or updating any pull request:

1. `yarn build` — must succeed with no errors
2. `yarn lint:fix` — fix all lint/format issues
3. `yarn ts-check` — no TypeScript errors
4. `yarn test` — all unit tests must pass
5. Do **not** include generated files (e.g. `.next/`, coverage reports) in commits

## Agentic Workflow Notes

### Required Secrets

The agentic workflows (Daily Perf Improver, Daily Test Improver, etc.) require the following
repository secrets to be correctly configured:

| Secret | Purpose | Required Permissions |
|--------|---------|----------------------|
| `COPILOT_GITHUB_TOKEN` | Authenticates the Copilot CLI with GitHub | Must have access to the GitHub Copilot API (`https://api.github.com/copilot/mcp_registry`). Two conditions are both required: (1) the token owner must have an active GitHub Copilot subscription, and (2) for classic PATs the token must include the `copilot` scope; for fine-grained PATs, Copilot-specific permissions must be granted. |
| `GH_AW_GITHUB_TOKEN` | Token used by the MCP gateway to call GitHub APIs | Needs `repo`, `issues`, `pull_requests` read/write scopes |
| `GH_AW_CI_TRIGGER_TOKEN` | Triggers CI on created PRs | `workflow` scope |

### Known Failure Mode: MCP Servers Blocked

**Symptom**: "No Safe Outputs Generated" — the agent job succeeds but produces no outputs.

**Root Cause**: The Copilot CLI fetches an MCP registry policy from
`https://api.github.com/copilot/mcp_registry` at startup. If this request returns **401 Unauthorized**,
the CLI blocks *all* non-default MCP servers (including `safeoutputs` and `github`) as a security
measure. Without these servers, the agent cannot call any safe-output tools (`create_pull_request`,
`create_issue`, `noop`, etc.), resulting in zero safe outputs.

**Fix**: Regenerate the `COPILOT_GITHUB_TOKEN` secret using a personal access token from a GitHub
account that has an active Copilot subscription. Both of the following conditions must be met:
- **Classic PAT**: include the `copilot` scope when generating the token.
- **Fine-grained PAT**: grant Copilot-specific read permissions when generating the token.

Update the secret in **Settings → Secrets and variables → Actions**.

### Performance Notes

- The app uses Next.js App Router with server components where possible.
- No benchmarking or profiling tooling is currently configured.
- Build times and Vitest run times are the primary measurable performance indicators available in CI.
