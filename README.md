# PubDB Frontend

A Next.js web app for browsing and managing a database of pubs. Users can search pubs, view details (opening hours, amenities, beer garden info), add new pubs, and edit existing entries.

## Tech stack

- **Next.js 15** with TypeScript
- **Vitest** + Testing Library for unit tests
- **Playwright** for end-to-end tests
- **Biome** for linting and formatting

## Getting started

```bash
yarn install
yarn dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---|---|
| `yarn dev` | Start dev server |
| `yarn build` | Production build |
| `yarn test` | Run unit tests |
| `yarn test:coverage` | Unit tests with coverage |
| `yarn test:e2e` | Run Playwright e2e tests |
| `yarn test:e2e:ui` | Playwright with interactive UI |
| `yarn lint` | Check for lint errors |
| `yarn lint:fix` | Auto-fix lint errors |
| `yarn ts-check` | TypeScript type check |
