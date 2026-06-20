---
name: security
description: Complete a security review of the pending changes on the current branch
version: 1.0.0
---

# Security Review Skill

You are running a security audit for Pub DB — a Next.js 15 / React 19 / TypeScript app with a REST API backend proxied through Next.js route handlers.

## Stack

- Next.js 15 App Router — routes under `src/app/`, shared UI under `src/app/components/`, feature components under `src/app/features/`
- React 19 with functional components and hooks
- CSS Modules for styling
- Custom hooks in `src/hooks/`
- Shared utilities in `src/lib/`
- API layer: Next.js route handlers in `src/app/api/` proxy to the backend REST API
- Auth: JWT stored in `localStorage` under key `"token"`, helpers in `src/lib/auth.ts`

## What to do each invocation

### Step 1 — Audit the codebase

Read the source files under `src/`. Audit across all of these security categories simultaneously:

**Authentication & authorisation**
- JWT read/written to `localStorage` — check for missing `typeof window !== "undefined"` guards (XSS risk via hydration)
- API route handlers that do not validate the `Authorization` header before acting
- Client-side route protection that could be bypassed (e.g. redirects without server-side enforcement)
- Missing or incorrect CORS headers on API routes

**Input validation & injection**
- User-supplied values passed to `dangerouslySetInnerHTML` or interpolated into raw HTML strings (XSS)
- Query parameters or form values used in `fetch` URLs without encoding (open redirect, SSRF)
- Any `eval`, `new Function`, or dynamic `import()` with user-controlled values
- API route handlers that forward user input to the backend without sanitisation

**Secrets & sensitive data**
- Hardcoded tokens, API keys, or passwords in source files
- Environment variables accessed in client-side code (prefixed `NEXT_PUBLIC_` exposes them to the browser — check if that is intentional)
- Sensitive data logged to the console (`console.log(token)`, `console.log(user)`, etc.)
- Tokens or PII stored in places beyond `localStorage` (e.g. cookies without `HttpOnly`, `sessionStorage`, URL params)

**Dependencies**
- Run `yarn audit` and note any high or critical advisories

**Headers & CSP**
- `next.config.*` missing security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Content-Security-Policy`)
- API responses missing `Cache-Control: no-store` on endpoints returning user-specific data

**Error handling & information disclosure**
- Error responses or `catch` blocks that expose stack traces, internal paths, or database error messages to the client
- API routes returning 500 with raw error objects

### Step 2 — Classify findings

For each finding, decide its severity:

- **Major** — directly exploitable or exposes sensitive data: XSS via `dangerouslySetInnerHTML`, unprotected API routes, hardcoded secrets, high/critical CVEs in dependencies, open redirect.
- **Minor** — defence-in-depth or hardening: missing security headers, console logging of non-critical data, `NEXT_PUBLIC_` variables that are intentionally public but undocumented, low-severity advisories.

If there are **no findings** worth reporting, output this and stop — do **not** create any GitHub issues:

```
## Security audit

No significant security issues found. The app is in good shape.
```

### Step 3 — Report

Output this structure:

```
## Security audit

### Major findings
<numbered list — each finding: file:line, category, one-sentence description of the vulnerability and its impact>

### Minor findings
<numbered list — each finding: file:line, category, one-sentence description>

### Checked and clear
<anything you explicitly checked and found to be fine — so the next run doesn't re-examine it>
```

If there are no major (or no minor) findings, omit that section rather than writing "None."

### Step 4 — Create GitHub issues

**Major findings:** create one GitHub issue per finding.

```bash
gh issue create \
  --title "security: <short title>" \
  --label "security" \
  --body "## Security issue

**Severity:** Major
**Category:** <category>
**File:** <file:line>
**Vulnerability:** <what the issue is and how it could be exploited>
**Suggested fix:** <concrete change to make, referencing the existing stack patterns>
**References:** <OWASP category or CVE if applicable>"
```

**Minor findings:** if there are two or more, group them into a single issue. If there is only one, still create one issue.

```bash
gh issue create \
  --title "security: hardening improvements batch" \
  --label "security" \
  --body "## Minor security hardening

These are defence-in-depth improvements that reduce attack surface without addressing directly exploitable vulnerabilities.

<for each finding:>
### <short title> (<file:line>)
**Category:** <category>
**Issue:** <one sentence>
**Suggested fix:** <one sentence>"
```

After creating each issue, output its URL.

If the `security` label does not exist, create it first:

```bash
gh label create security --color "d93f0b" --description "Security vulnerabilities and hardening"
```

## Known project patterns

- **Auth flow:** JWT is fetched on login and stored in `localStorage`. It is read back and attached as a `Bearer` token on every API call. Any `localStorage` read at render time needs a `useEffect` or `typeof window !== "undefined"` guard.
- **API proxy:** All backend calls go through route handlers in `src/app/api/`. These handlers forward requests to the real API and should validate the token before forwarding.
- **No server-side sessions:** Auth is entirely client-side JWT. There is no `HttpOnly` cookie or server session. This is a known architectural choice — note it if relevant but do not flag it as a bug.
- **Environment variables:** Backend URL stored in a server-only env var. Check that it is not accidentally exposed with `NEXT_PUBLIC_` prefix.
- **No user-generated rich text:** The app uses plain text inputs and dropdowns; `dangerouslySetInnerHTML` should not appear — flag it immediately if found.
