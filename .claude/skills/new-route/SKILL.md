---
name: new-route
description: Add a route to apps/landing (page, its components, its messages). Use for any new page or route segment.
---

# New route

Most landing pages are Spanish-only; English is for experiences. Decide first whether the page has an English version.

1. Register the route in `apps/landing/src/i18n/routing.ts` under `pathnames`, keyed by its internal path: `'/about-opta': '/about-opta'`. Folder names stay English.
   - Translated slug: give each locale its own path, `'/about-opta': { es: '/conoce-opta', en: '/about-opta' }`. The folder `about-opta/` then serves `/es/conoce-opta` and `/en/about-opta`, and the proxy moves each locale to its own slug.
2. Map the route to its namespace in `namespaces` in `apps/landing/src/i18n/coverage.ts`. Typecheck fails until every pathname has one.
3. Create `apps/landing/src/app/[locale]/(site)/<route>/page.tsx`, a Server Component with semantic HTML. Copy the shape of `(site)/page.tsx`:
   - First line of the component: `if (!localesFor('/<route>').includes(useLocale())) notFound();` (`notFound` from `next/navigation`). A locale without the namespace then gets the localized 404, before any `useTranslations` reads missing messages.
   - `generateMetadata` returns `title: t('metaTitle')` and `alternates: alternates('/<route>')` from `@/i18n/alternates`. The layout's template appends the site name to the title. Home is the exception: its title is the site name, the layout's default.
4. Add the `<Namespace>` to `messages/es.json`, with a `metaTitle`. Render every visible string with `getTranslations` or `useTranslations`. No literal text in JSX.
5. English:
   - Spanish-only page: add nothing to `messages/en.json`. `/en/...` answers the localized 404, and the alternates list only `es`, with no `x-default`, because the proxy could send an English browser to that 404.
   - Translated page: add the same namespace to `messages/en.json` with `translate-namespace`. An English namespace is complete or absent.
6. Add each URL the page has, one per locale with its namespace, to `collect.url` in `apps/landing/lighthouserc.json`. `npm test` fails if one is missing. The e2e derives its axe and console checks from `routing.pathnames` by itself.
7. Put what only this route uses in `_components/` next to the page. Do not create `shared/` or `modules/` files for it.
8. Interactive parts go in their own `'use client'` file under `_components/`. An island is needed for handlers, state, compound components (for example `Menu.Item`) or client-side `useTranslations`. A Mantine component without handlers renders directly from the page.
9. Wrap the island in `NextIntlClientProvider` passing only the namespaces it uses.
10. Style with a CSS module that reads theme variables only. Colors, lengths, font families, durations and z-index come from the theme. Mantine style props take theme keys (`p="md"`), never literals.
11. Links come from `@/i18n/navigation`.
12. Run `npm run check`, then `npm run build -w apps/landing` and `npm run e2e -w apps/landing`. Read any lint message and follow it.

This covers static pages. A dynamic segment (`[slug]`) needs params in `alternates`, its own `generateStaticParams`, the e2e and Lighthouse: ask Santiago first.
