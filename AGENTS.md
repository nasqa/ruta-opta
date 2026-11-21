# ruta-opta

npm workspaces monorepo: `apps/*` (landing now, platform later) and `packages/*` (empty until a second app shares code). Everything in the repo is English. Only `messages/es.json` holds Spanish copy.

## Verify your work

- `npm run typecheck`: `tsc --noEmit` per workspace. TypeScript is pinned to 6.0.x; do not upgrade or install another version.
- `npm run lint`: ESLint (architecture, strict types, text from messages) and Stylelint (theme-only CSS).
- `npm test`: architecture, hooks and messages tests. Runs serially because some tests write into `apps/landing/src`.
- `npm run check`: all of the above. `npm run e2e` and `npm run build` for browser checks and prerendering.
- Hooks run ESLint/Stylelint after every edit and typecheck + lint when you stop. Fix what they print; do not silence them.

## Where code goes

A file is born next to the route that uses it (`app/**/_components`). It moves to `src/modules/<domain>` when a second route needs it, and to `packages/<domain>` when the second app needs it. Moving anything to `shared/` or `packages/` needs Santiago's approval.

- `boundaries/no-unknown-files` means the file sits outside every known place. Apply the rule above; do not add an exception.
- Every `boundaries/*` message says what to import instead. Follow it. Never restructure code just to silence a rule.
- A module has up to three entry points, with named exports and no `export *`:
  - `index.ts`: what the client may use (components, types, schemas);
  - `server.ts`: starts with `import 'server-only'`; queries and DTOs; the only place that reads `process.env`;
  - `actions.ts`: `'use server'`, thin, validates inside.
- Modules do not import each other. Compose them in the route.
- `route.ts` files are adapters: they delegate to the module that owns the domain.
- Procedures: `new-route`, `extract-to-module`, `extract-to-package`, `translate-namespace` in `.claude/skills/`.

## Data layer

- Queries and DTOs live in a module's `server.ts`. Return DTOs, never raw rows or secrets.
- Server actions validate their input inside the action, whatever the form validated.
- Client code never imports `server.ts`. `server-only` plus `next build` is the barrier.

## UI

- Shared UI is Trama (`@nasqa/trama-react`) and Mantine as is. Use `Component.extend`; add a thin wrapper only when needed. No `components/ui`.
- Use Trama's text classes (`.t-{style}`) and territories via `<Scope>` on sections only.
- Pages are Server Components with semantic HTML. Mantine goes in interactive islands only.
- Hand-written colors and lengths are lint errors. Font families, durations and z-index also come from the theme, even where lint cannot see them.
- Names are kebab-case. Lint enforces it.

## i18n

- Visible text comes from `messages/<locale>.json`, never from JSX. Spanish is the source of the types.
- An English namespace is complete or does not exist. `tests/messages.test.mjs` checks it. Use `translate-namespace`.
- Import `Link`, `redirect`, `useRouter`, `usePathname` and `getPathname` from `@/i18n/navigation`, never from `next/link` or `next/navigation`.
- Format dates and numbers with next-intl.

## Dependencies and deploy

- A package must be declared in the `package.json` of each app that imports it. dependency-cruiser's `npm-no-pkg` enforces it, adopted with the first package or the second app.
- Netlify's `ignore` per app lists the app, the root `package.json` and `package-lock.json`. When an app depends on `packages/x`, add that path.
- Lint rules are `error` or `off`, never `warn`.

## More

- Decision record: `docs/decisions/0001-architecture.md`.
- Landing conventions: `apps/landing/AGENTS.md`.
