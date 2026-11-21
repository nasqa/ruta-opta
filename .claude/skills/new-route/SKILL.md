---
name: new-route
description: Add a route to apps/landing (page, its components, its messages). Use for any new page or route segment.
---

# New route

1. Create the folder under `apps/landing/src/app/[locale]/(site)/<route>/` with a `page.tsx` that is a Server Component with semantic HTML. Copy the shape of the smoke page.
2. Put what only this route uses in `_components/` next to the page. Do not create `shared/` or `modules/` files for it.
3. Add a `<Namespace>` to `messages/es.json` and render every visible string with `getTranslations`. No literal text in JSX.
4. Add the same namespace to `messages/en.json` with `translate-namespace`. An English namespace is complete or absent.
5. Interactive parts go in their own `'use client'` file under `_components/`. An island is needed for handlers, state, compound components (for example `Menu.Item`) or client-side `useTranslations`. A Mantine component without handlers renders directly from the page.
6. Wrap the island in `NextIntlClientProvider` passing only the namespaces it uses.
7. Style with a CSS module that reads theme variables only. Colors, lengths, font families, durations and z-index come from the theme.
8. Set `alternates.languages` (es, en, x-default via `getPathname`) in the page metadata. Links come from `@/i18n/navigation`.
9. Run `npm run check`. Read any `boundaries/*` message and follow it.
