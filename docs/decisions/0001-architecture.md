# 0001. Code architecture for ruta-opta

Status: accepted. Supporting report: internal report "Frontend architecture in the agentic era" (estudio-lab).

## Decision

Thin routes with colocation, domain modules, and packages at the second consumer, all enforced by tools.

- A file is born next to the route that uses it (`app/**/_components`).
- It moves to `src/modules/<domain>` when a second route needs it.
- It moves to `packages/<domain>` when the second app needs it.
- Moving code to `shared/` or `packages/` needs Santiago's approval.

Modules expose up to three entry points (`index.ts`, `server.ts`, `actions.ts`) and never import each other. Pages are Server Components. A Mantine component without handlers may render from a server page; one with handlers, state or compound parts goes in a `'use client'` island. Shared UI is Trama.

Enforcement: strict TypeScript 6, ESLint with `eslint-plugin-boundaries`, Stylelint for theme-only CSS, `server-only` with `next build`, axe in the browser, Lighthouse budgets in CI, and dependency-cruiser from the first package or the second app. Agent feedback runs in three rings: editor hooks, pre-commit `lint-staged`, and CI.

## Why not FSD

- On a landing it reduces to routes plus `shared`, with renamed layers, re-exports and double `index` files.
- Its linter, Steiger, is in beta, has no monorepo guide, and its spec changed four times in 2026 without a version bump.
- Reopen it if `apps/platform` grows to many reused flows and several people. It can adopt FSD inside that app without touching the landing.

## Promotion rules

1. Route to module: a second route needs the code. Ask Santiago first.
2. Module to package: the second app needs it. Ask Santiago first. Packages are just-in-time (`exports` to TypeScript source, version `"*"`, `@ruta-opta/*`).
3. Never promote speculatively. The first route and the first module are written and reviewed with extra care, because agents copy the pattern next to them.

## i18n

- next-intl with `es` and `en`, locale prefix always, and `src/i18n/` as its own boundaries element.
- Spanish is the source of the message types. An English namespace is complete or does not exist, and a test checks it.
- A page exists only in the locales that have its namespace: an untranslated page has no English version, and its `/en` URL answers the localized 404.
- Navigation comes from `@/i18n/navigation`; lint forbids `next/link` and `next/navigation` elsewhere.
- Visible text comes from messages. Dates and numbers are formatted with next-intl.
- Each page declares hreflang for the locales it exists in. A page in every locale also declares `x-default`, the unprefixed path where the proxy negotiates the locale. The client provider receives only the namespaces its islands use.
