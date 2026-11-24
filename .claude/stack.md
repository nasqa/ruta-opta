# Tech stack brief

stack-fingerprint: 0940dd52ce97
updated: 2026-11-23

Installed: next 16.4.6, react 19.3.0, @mantine/core 9.8.2, @nasqa/trama-react 0.1.1, @nasqa/trama-theme-opta (dist in node_modules), next-intl 4.15.3, typescript 6.0.3 (pinned 6.0.x), eslint 9.39.5, stylelint 18.1.0. Also node:test, Playwright, Lighthouse CI. Node 24. CI: actions/checkout, setup-node, upload-artifact v7.

## Next.js 16.4.6: images
- **Use:** `getImageProps()` from `next/image` and render a plain `<img {...props}>` in the Server Component. No client `Image`.
- **Patterns:** above the fold use `loading="eager"` or `fetchPriority="high"`. With art direction (several `<source>`/`<picture>`), `fetchPriority="high"` on the `<img>`; `preload` and `loading="eager"` would load both images.
- **Avoid:** `priority` (deprecated in 16 in favour of `preload`). The docs advise `loading="eager"` / `fetchPriority="high"` over `preload` in most cases, and never `preload` alongside `loading` or `fetchPriority`.
- **Hosting:** Netlify serves `next/image` through its Image CDN via the OpenNext adapter with no config (given by Santiago; not re-verified here).
- **Sources:** `node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md` (`preload`, `priority`, `getImageProps`, art direction sections; changelog row v16.0.0).

## Mantine 9.8.2 in React Server Components
- **Fact:** every `@mantine/core` component file starts with `"use client"` (checked in `esm/components/Button/Button.mjs`, `Title/Title.mjs`). A Server Component page may render them, but only with serialisable props: no `renderRoot`, no function props, no callback children.
- **Compound parts:** `Popover.Target` etc. fail in server files; use the flat export (`PopoverTarget`) or put the file behind `'use client'`.
- **Polymorphic:** `component="a" href="..."` retypes the props to the element's. A string `component` is safe from a server page; a component reference is not (see the next-intl fact).
- **Title:** `order` picks the element (h1-h6, default 1) and its theme size; `size` changes only font size (and line height only between h1-h6 sizes). Choose `order` for semantics, `size` for visual override. Trama keys letter-spacing off `order`.
- **Sources:** Context7 `/mantinedev/mantine/9.0.0` (guides/next, help q/server-components, core/title, guides/polymorphic), 2026-11-23; installed `@mantine/core/esm`.

## VERIFIED in this repo 2026-11-23: `Button component={Link}` breaks the build
`<Button component={Link} href="/">` with next-intl's `Link` from `createNavigation` (`src/i18n/navigation.ts`), rendered from a Server Component page, FAILS `next build`:
`Error: Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server".` (prerender of /es/confirmed).
Use `<Button component="a" href={getPathname({ locale, href })}>` instead (string component, plain `<a>`; no client navigation, which is fine for these pages).

## Trama: `@nasqa/trama-react` 0.1.1 and `@nasqa/trama-theme-opta`
- **Exports (react):** `TramaProvider` (client), `Scope` (client), `makeTheme`, `resolver`, `HEADINGS`, `MONOSPACE`, types `TramaTheme`, `Palette`, `Density`, `ThemeLabels`, `Motion`, `ColorName`. CSS: `@nasqa/trama-react/scopes.css`, `/system.css`. Theme: `theme` from `@nasqa/trama-theme-opta`.
- **Style import order:** `@mantine/core/styles.layer.css`, theme `tokens.css`, `type.css`, `fonts.css`, then `@nasqa/trama-react/scopes.css`, `system.css`.
- **Mode:** tokens switch on `data-theme` (`light`|`dark`) and `data-contrast="more"` on `<html>`, not on Mantine's colour scheme. Render them on the server and keep `colorScheme` in agreement. `Scope` sets `data-theme`/`data-contrast`/`data-territory` on a `div` and portals overlays into itself.
- **Mantine extensions** (`dist/src/theme.js`, `Component.extend`):
  - `Title`: h1-h6 map to type styles `display-lg`, `display-md`, `heading-lg`, `heading-md`, `heading-sm`, `title`; font-family `--font-family-display`, weight bold, `text-wrap: balance`; letter-spacing `var(--text-<style>-letter-spacing)` chosen by `order`.
  - `Text`: `size="xs"` gets caption weight and letter-spacing. Sizes xs..xl map to caption, body-sm, body-md, body-lg, heading-sm.
  - `Button`: size by density (touch lg, comfortable md, compact sm), `fw` label weight, heights `--control-height-{sm,md,lg}`, label font from `--text-label-*`, corner `round(nearest, shape-k * height, 1px)` unless `radius` passed.
  - `Card`: padding `var(--space-inset-container)`, radius `var(--card-border-radius)`.
  - `Stack`: gap `var(--space-group)`. `Group`: gap `var(--space-inline)`.
  - Also themed: inputs (size by density), Select, SegmentedControl, NavLink, Tabs, Checkbox, Radio, Switch, Badge (light, pill), Progress, Menu, Popover, Tooltip, Modal, Drawer, Burger, Accordion, Collapse, Spoiler, Notification(s), Table. Theme-level: primaryColor `action`, `respectReducedMotion: false` (Trama does its own R1 reduced motion), `defaultRadius: 'md'`, `activeClassName: ''` (pressed is a colour state, not movement), spacing xs..xl = `--space-2..--space-6`, radius xs/sm `--shape-item`, md `--shape-container`, lg `--shape-overlay`, xl `--radius-full`.
- **Token source:** `@nasqa/trama-theme-opta/dist`: `tokens.css` (all variables, light default on `:root`, mode/contrast/territory overrides), `type.css` (`.t-*`), `fonts.css`, `tokens.json`, `tokens.resolved.json`, `tokens.resolver.json` plus `light|dark|light-hc|dark-hc.tokens.json` (DTCG 2025.10), `fonts/*.woff2`. Mantine colour variables alias Tier 2 tokens in the bridge (`--mantine-color-<name>-0..9`, `--trama-on-<name>`, `--trama-border-<name>`); colour names: action, accent, territory, red, yellow, green, blue, gray, dark (intents action, accent, territory, danger, warning, success, info, neutral).
- **Text classes (`type.css`):** `.t-display-xl`, `.t-display-lg`, `.t-display-md`, `.t-heading-lg`, `.t-heading-md`, `.t-heading-sm`, `.t-title`, `.t-body-lg`, `.t-body-md`, `.t-body-sm`, `.t-label`, `.t-caption`, `.t-overline` (uppercase). Per style, variables `--text-<style>-{font-family,font-size,line-height,font-weight,letter-spacing}`.
- **Tokens present in `tokens.css`:**
  - space: `--space-1..9`, `--space-group`, `--space-inline`, `--space-inline-tight`, `--space-inset-container`, `--space-inset-overlay`, `--space-inset-page`, `--space-related`, `--space-section`.
  - font: `--font-family-body`, `--font-family-display`, `--font-size-{xs,sm,md,lg,xl,2xl..6xl}`, `--font-weight-{regular,medium,semibold,bold}`, `--font-rule-display-min-size`. Fonts: Comfortaa Variable (display) and Inter Variable (body), each with a size-adjusted Arial fallback face.
  - shape/size: `--shape-item`, `--shape-container`, `--shape-overlay`, `--shape-k`, `--radius-full`, `--control-height-{sm,md,lg}`, `--border-width-hairline`, `--border-width-state`.
  - motion: `--motion-effect` 0.1s, `--motion-easing-enter` cubic-bezier(0,0,0.2,1), `--motion-travel` 8px, `--motion-brand-duration` 0.5s, `--motion-brand-easing` cubic-bezier(0.16,1,0.3,1). Under `prefers-reduced-motion: reduce`: `--motion-travel: 0px`, `--motion-brand-duration: 0.1s` (others unchanged). No `--motion-*` duration scale beyond these; spatial enter/exit durations live in the theme's `Motion` object, not CSS variables.
  - colour: `--color-{action,accent,danger,info,success,warning,territory}-<step>` (e.g. action: `bg`, `bg-subtle`, `border`, `border-hover`, `el`, `el-hover`, `el-active`, `line`, `on-solid`, `solid`, `solid-hover`, `text`, `text-low`), `--color-neutral-{solid,solid-hover,on-solid,...}`, `--color-text-{primary,secondary}`, `--color-border-{subtle,interactive,focus}`, `--color-focus-ring`, `--color-surface-{canvas,subtle,element,element-hover,element-active,raised,overlay}`, `--color-arc-1..5`.
  - No z-index tokens found in `tokens.css` or `system.css`; do not invent any.
- **Fonts:** package README says preload `fonts/comfortaa-latin-wght-normal.woff2` and `fonts/inter-latin-opsz-normal.woff2` with `react-dom` `preload(href, { as: 'font', type: 'font/woff2' })` (React adds `crossorigin`); file names are API.
- **Sources:** `node_modules/@nasqa/trama-react/{README.md,dist/src/theme.js,motion.js,Scope.js,dist/generated/mantine-bridge.js}`, `node_modules/@nasqa/trama-theme-opta/{README.md,dist/tokens.css,type.css,fonts.css}`.

## next-intl 4.15.3
- **Routing here:** locales es/en, `localePrefix: 'always'`, `localeDetection: false`, `alternateLinks: false`, localised `pathnames`. Navigation APIs come from `createNavigation(routing)` in `@/i18n/navigation`.
- **Link:** `<Link href={{ pathname: '/x', query: { a: 'b' } }} locale="en">` works in Server Components; `locale` switches language and sets `hreflang` on the anchor. The href always carries the locale prefix when `locale` is given. (Types: `BaseLink.d.ts` has `locale?: Locale`.)
- **Cookie:** the `NEXT_LOCALE` cookie is synced when a locale-prefixed path is visited (the docs' reason a `locale` Link keeps the prefix). `localeDetection: false` ignores both `accept-language` and the cookie for resolving the locale; `localeCookie: false` disables the cookie. Not exercised in this repo.
- **getPathname:** `getPathname({ locale, href })` returns the localised, prefixed path string; `href` may be `{ pathname, query, params }`. Never prepend the locale by hand.
- **hasLocale:** `hasLocale(routing.locales, value)` from `next-intl` narrows to a `Locale`; use it in request config and `notFound()` when false.
- **Sources:** Context7 `/amannn/next-intl` (routing/navigation, routing/configuration, setup), 2026-11-23; installed `next-intl/dist/types`.

## Email clients (caniemail.com, for the newsletter templates)
- **SVG** (`/features/image-svg/`, tested 2026-09-16): not usable in Outlook; Gmail renders it rasterised to PNG (note 2). Use PNG. (The fetched page lost its per-client icons; the Outlook Windows result is taken from the brief given, not re-read.)
- **`@font-face`** (`/features/css-at-font-face/`, tested 2023-12-19): Apple Mail supported; Gmail partial or unsupported; Outlook Windows declares but ignores remote fonts (note 4 and 5: falls back to Times New Roman, set `mso-generic-font-family`). Treat web fonts as Apple-only; always give a system stack.
- **`color-scheme` meta** (`/features/html-meta-color-scheme/`, tested 2026-09-16): Apple Mail. CORRECTION to the older rule: since Sept 2026 Gmail (iOS, Android) partially honours it, only `content="light only"`, and only for Google accounts (note 1; emailmarkup.org/en/blog/2026/gmail-app-dark-mode-update/). Outlook: no. Apple Mail reads the meta as "no dark mode"; add `:root { color-scheme: light dark; }` if you ship your own dark styles.
- **Dark mode auto-inversion** (Litmus guide, support chart Feb 2025; learn.better.email dark-mode guide): full invert (including dark and table backgrounds, no targeting): Gmail app iOS, Outlook 2021/365 Windows, Windows Mail. Partial invert: Gmail app Android, Outlook.com, Outlook iOS/Android apps (the Outlook ones expose `[data-ogsc]`/`[data-ogsb]`). Apple Mail: no change unless you add dark styles. Images are never inverted. Prefer mid-tone brand colours and test both.
- **`max-width`** (`/features/css-max-width/`): the page's per-client icons were lost in fetch, so Outlook's lack of support is NOT re-verified here; it is the well-known Word-engine behaviour. Wrap content in `<!--[if mso]><table width="600">...</table><![endif]-->` with a 600 px width, and keep `max-width:600px` for everyone else.
