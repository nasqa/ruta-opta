# ruta-opta

Product monorepo (npm workspaces) for Ruta Opta. The first app is the Next.js landing page.

## Layout

- `apps/landing`: the Next.js 16 landing page.
- `packages/`: empty until a second app needs to share code.

## Requirements

- Node 24 (see `.nvmrc`).
- `NASQA_PACKAGES_TOKEN` exported in your shell: `.npmrc` reads it to install `@nasqa/*` packages from GitHub Packages.

## Scripts

Run from the repo root:

- `npm run check`: typecheck, lint and unit tests.
- `npm run typecheck`: typecheck every workspace.
- `npm run lint`: ESLint and Stylelint.
- `npm test`: unit tests (`node --test tests/`).
- `npm run e2e`: end-to-end tests in every workspace that defines them.
- `npm run build`: build every workspace.
