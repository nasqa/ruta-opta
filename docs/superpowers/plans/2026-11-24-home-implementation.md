# Home page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the prelaunch home of rutaopta.org with the approved bilingual home (hero, thesis, three-step method, Turismo Vivo, who is behind it, allies with WhatsApp and email, the existing sign-up form) plus a real SEO base.

**Architecture:** Server Components under `apps/landing/src/app/[locale]/(site)/_components/home/`, composed by `(site)/page.tsx` on top of `ruta-opta-46`'s `site-shell` (header, reveal footer, `SceneBand`). All text comes from the `Prelaunch` namespace in `messages/es.json` and `en.json`. Pure helpers (contact links, structured data, metadata) are tested with `node:test`; page behavior with Playwright.

**Tech Stack:** Next.js 16.4.6, next-intl, Mantine 9 + `@nasqa/trama-react` (Opta theme), Playwright + axe, Lighthouse CI, sharp (already installed with Next) for asset conversion.

**Spec:** `docs/superpowers/specs/2026-11-24-home-design.md` (approved 2026-11-24; Appendix A holds the exact copy). Read `AGENTS.md` and `apps/landing/AGENTS.md` first.

## Global Constraints
- Base: branch `feat/home-landing`, rebased on `feat/brand-flow-and-english` (`8257e9d` at writing). Rebase again before the last task if it moved.
- Trama only: no hex literals, no pills, no territory colour in v1, no new tokens; text classes `.t-*`; buttons via `Button component="a" href={...}` (never `component={Link}`); `Link` from `@/i18n/navigation`.
- Visible text only from `messages/*.json`; Spanish is the source of types; every key in both locales or `tests/messages.test.mjs` fails.
- `<img>` only inside `modules/site-shell/**` (lint); images via `getImageProps`, never `priority`, never a client `Image`. No ESLint exception is added.
- Keep `id="lista"` on the form section (the other session's pages link to `/{locale}#lista`). Do not touch the form module, header, footer, `robots`, `sitemap`, `Privacy`.
- The Lighthouse JS budget in `lighthouserc.json` never goes up (`resource-summary:script:size` max 297984).
- Never write "Opta" alone as a brand; never name the course organizer; no sameAs, rating, phone, email, taxID or SearchAction in JSON-LD.
- Commit after each task; no attribution lines in commit messages.

## Review Focus
1. 320 px and 200 % zoom: no horizontal overflow in Spanish or English (long words: "oportunidades", "transformar", "territorios").
2. Hero image slow or blocked: the space is reserved (CLS <= 0.1) and the text stays readable without it.
3. JavaScript disabled: the whole page renders and the hero button jumps to `#lista`.
4. Contact links: accents, spaces and long text encode correctly; number is digits only; opens in a new tab with `rel="noopener noreferrer"`.
5. Locale integrity: `/en` has every string; each hreflang URL answers 200; canonical is self-referencing per locale; JSON-LD parses and cannot break out of its `<script>`.

---

### Task 1: Messages (Spanish source, English alongside) and their tests

**Files:**
- Modify: `apps/landing/messages/es.json`, `apps/landing/messages/en.json` (namespace `Prelaunch` only)
- Create: `tests/home-messages.test.mjs`

**Interfaces:** Produces these `Prelaunch` keys (copy text verbatim from Spec Appendix A; EN H1 stays as committed, EN lead from Appendix A; `cta`, `listTitle`, `listLead`, `privacyLink` keep their current values):
`metaTitle`, `metaDescription`, `ogAlt`, `title`, `lead`, `cta`; `thesis.title`, `thesis.text`, `thesis.territoriesLabel`, `thesis.territories.{quindio,risaralda,caldas,valle,choco}`; `methodTitle`, `stages.{grow,create,connect}.{name,tagline,text}`; `tourism.title`, `tourism.text`; `who.title`, `who.text`, `who.legalName`, `who.locality`, `who.region`; `allies.title`, `allies.text`, `allies.whatsapp.{label,number,message}`, `allies.email.{label,address,subject}`; `listTitle`, `listLead`, `privacyLink`. Removes `buildingTitle`, `territory`.
Fixed values: `allies.whatsapp.number` = `"573105874657"` and `allies.email.address` = `"info@rutaopta.org"` in both locales; `metaTitle` ES `Ruta Opta · Talento y turismo comunitario en Colombia`, EN `Ruta Opta · Talent and community tourism in Colombia`; territory names in this order: Quindío, Risaralda, Caldas, Valle del Cauca, Chocó; `who.legalName` `Fundación Embajadores de la Paz`, `who.locality` `Armenia`, `who.region` `Quindío`.

- [ ] **Step 1: Write `tests/home-messages.test.mjs`** with tests `five territories in order in both locales`, `legal name in Prelaunch appears in Privacy controller text in both locales` (`es.Privacy.sections.controller.text.includes(es.Prelaunch.who.legalName)`, same for en), `contact constants identical across locales and well formed` (number matches `/^57\d{10}$/`, address matches `/^[^\s@]+@rutaopta\.org$/`), `meta lengths` (`metaTitle` <= 60, `metaDescription` <= 160, both locales), `no Quindío-first line` (no `Prelaunch` string matches `/empezar por el Quindío|starting in Quindío/i`).
- [ ] **Step 2: Run** `npm test` from the repo root. Expected: the new tests FAIL (keys missing), others pass.
- [ ] **Step 3: Edit both message files** to the key list above, Spanish first. If the English controller text does not contain `Fundación Embajadores de la Paz`, stop and tell `ruta-opta-46` (their file).
- [ ] **Step 4: Run** `npm test && npm run lint -w apps/landing`. Expected: PASS (typecheck will flag the old page's removed keys; fixed in Task 6, so run `npm run typecheck` only at Task 6).
- [ ] **Step 5: Commit** `feat(landing): home copy in Spanish and English`.

### Task 2: Contact links helper

**Files:** Create `apps/landing/src/app/[locale]/(site)/_components/home/contact-links.ts`, `tests/home-contact-links.test.mjs`.

**Interfaces:** Produces `whatsappHref(number: string, text: string): string` and `mailtoHref(address: string, subject: string): string`.

- [ ] **Step 1: Write failing tests:** `whatsappHref('573105874657','Hola, quiero conocer Ruta Opta como aliado.')` equals `https://wa.me/573105874657?text=Hola%2C%20quiero%20conocer%20Ruta%20Opta%20como%20aliado.`; accents encode (`ñ` -> `%C3%B1`); a number with `+` or spaces throws `RangeError`; `mailtoHref('info@rutaopta.org','Quiero ser aliado de Ruta Opta')` equals `mailto:info@rutaopta.org?subject=Quiero%20ser%20aliado%20de%20Ruta%20Opta` (spaces as `%20`, never `+`).
- [ ] **Step 2: Run** `npm test` -> FAIL.
- [ ] **Step 3: Implement** both with `encodeURIComponent`; `whatsappHref` validates `/^\d{8,15}$/`.
- [ ] **Step 4: Run** `npm test` -> PASS. **Step 5: Commit** `feat(landing): contact link builders`.

### Task 3: Structured data and metadata helpers

**Files:** Create `.../home/structured-data.ts`, `.../home/metadata.ts`, `tests/home-seo.test.mjs`.

**Interfaces:**
```ts
type OrgInput = { url: string; logo: string; name: string; legalName: string; description: string; locality: string; region: string; areas: string[]; language: 'es' | 'en' };
export const homeJsonLd = (i: OrgInput): { '@context': 'https://schema.org'; '@graph': object[] };
export const jsonLdScript = (data: object): string; // JSON.stringify with '<' escaped as <
type MetaInput = { locale: 'es' | 'en'; title: string; description: string; ogAlt: string; og: { src: string; width: number; height: number }; languages: Record<string, string> };
export const homeMetadata = (i: MetaInput): Metadata; // next's Metadata
```

- [ ] **Step 1: Write failing tests:** the graph has an `Organization` with `@id` `${url}#organization`, `name`, `legalName`, `address` (`addressLocality`, `addressRegion`, `addressCountry: 'CO'`), `areaServed` of five names, `knowsLanguage: ['es','en']`, and a `WebSite` with `inLanguage`; neither object has keys `sameAs`, `aggregateRating`, `review`, `telephone`, `email`, `taxID`, `foundingDate`, `potentialAction`; `jsonLdScript({a:'</script>'})` contains no `<`. `homeMetadata`: `title.absolute` is the input title; `alternates.canonical` equals `languages[locale]` and `alternates.languages` is the input unchanged (keeps `x-default`); `openGraph` has `type: 'website'`, `locale` `es_CO` for es and `en_US` for en, `alternateLocale` the other, one image with the given alt; `twitter.card` is `summary_large_image`.
- [ ] **Step 2: Run** `npm test` -> FAIL. **Step 3: Implement** the three functions (pure, no imports from the app except the `Metadata` type). **Step 4: Run** `npm test` -> PASS. **Step 5: Commit** `feat(landing): home structured data and metadata helpers`.

### Task 4: Art assets and the `SceneBand` hero variant

**Files:**
- Create: `.../(site)/_art/home-hero.webp`, `.../(site)/_art/home-og.jpg`
- Modify: `apps/landing/src/modules/site-shell/scene-band.tsx` (add `'hero'` to `height`), `scene-band.module.css` (`.hero { aspect-ratio: 16 / 9; }`, same at the mobile breakpoint)
- Test: `apps/landing/e2e/home.spec.ts` (started here, extended later)

**Interfaces:** Produces `SceneBand` accepting `height: 'tall' | 'short' | 'strip' | 'hero'`.

- [ ] **Step 1: Build the assets with sharp** from `~/Downloads/opta-illustration-style/landing/authored-spike/sky-empty/A2-base-2-mirrored.png` (empty sky, no sun): `home-hero.webp` at the source size (1280 x 720), quality about 82, target under 300 KB; `home-og.jpg` 1200 x 630, cropped to keep the valley, with `modules/site-shell/assets/sun.svg` rasterized and composited at centre x 80 %, y 20 % of the frame, width 16.1 % (same geometry as `.sun`), JPEG quality about 80, target under 250 KB. Never upscale or redraw the sun. Commit script-free; record the commands in the commit body.
- [ ] **Step 2: Write the failing e2e** in `home.spec.ts`: `/es` hero band has a 16:9 box (`width/height` within 0.02 of 1.778) and exactly one sun image.
- [ ] **Step 3: Implement the variant** (type, class). Keep the top fade mask. **Step 4: Run** the e2e after Task 6 wires it; for now `npm run typecheck`. **Step 5: Commit** `feat(landing): hero art and the SceneBand hero height`.

### Task 5: Home sections

**Files:** Create in `.../(site)/_components/home/`: `hero.tsx`, `thesis.tsx`, `method.tsx`, `tourism.tsx`, `who.tsx`, `allies.tsx`, plus one `*.module.css` each. Test: extend `e2e/home.spec.ts`.

**Interfaces:** Consumes `useTranslations('Prelaunch')`, `SceneBand`, `whatsappHref`, `mailtoHref`, `Link` from `@/i18n/navigation`. Produces default-free named exports `Hero`, `Thesis`, `Method`, `Tourism`, `Who`, `Allies` (no props; each renders one `<section aria-labelledby>`).
Structure: `Hero` = text block (`h1.t-display-md#hero-title`, lead `p.t-body-lg`, `Button component="a" href="#lista"`) above `SceneBand scene={heroArt} height="hero" sun`. `Thesis` = `h2`, paragraph, `<ul aria-label>` of the five names. `Method` = `h2`, `<ol>` of three `li` each with number, `h3`, tagline, text (no art; reserve nothing). `Tourism` = `h2`, paragraph. `Who` = `h2`, paragraph, link to `/privacy` with `privacyLink`. `Allies` = `h2`, paragraph, two `Button component="a"` (WhatsApp `target="_blank" rel="noopener noreferrer"`, email). Surfaces: `--color-surface-raised` cards with the hairline border on Method steps and Who; spacing `--space-section`, `--space-group`, `--space-related`; no hex, no territory colour. The H1 is `t-display-md` so it fits at 320 px.

- [ ] **Step 1: Extend the failing e2e** (`/es` and `/en`): exactly one `h1`; the h2 order is thesis, method, tourism, who, allies, list; three method steps in an `ol`; five territory names in order; hero button `href="#lista"`; WhatsApp `href` starts `https://wa.me/573105874657?text=` and has `rel` containing `noopener`; email `href` starts `mailto:info@rutaopta.org?subject=`.
- [ ] **Step 2: Implement** the six components and styles. **Step 3: Commit** `feat(landing): home sections` (run e2e in Task 6).

### Task 6: Compose the page, metadata, JSON-LD; remove the old hero

**Files:** Modify `(site)/page.tsx`, `(site)/page.module.css`, `e2e/shell.spec.ts`; Delete `(site)/_components/illustration-slot.tsx` and its CSS; Test: `e2e/home.spec.ts`.

**Interfaces:** Consumes everything above. `generateMetadata` reads `Prelaunch` (`metaTitle`, `metaDescription`, `ogAlt`), `alternates('/')` for `languages`, `siteUrl` from `@/shared/env`; renders `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(homeJsonLd(...)) }} />` with `url` = `siteUrl` + the locale path and `logo` = the absolute URL of the horizontal logo asset.

- [ ] **Step 1: Write failing e2e:** `/es` and `/en` have a canonical equal to their own absolute URL, `og:title`, `og:description`, `og:image` (absolute), `og:locale`, `twitter:card`; the JSON-LD script parses and has an `Organization` named `Ruta Opta` with the locale's `legalName`; every `link[rel=alternate][hreflang]` URL answers 200 (use `request.get`); `/es` has `<title>` equal to the ES `metaTitle`.
- [ ] **Step 2: Compose `page.tsx`:** `SiteHeader`, `main` containing `Hero, Thesis, Method, Tourism, Who, Allies`, then the unchanged `#lista` section with `WaitlistForm`. Remove `Scope territory="quindio"` and `IllustrationSlot`. Delete `Prelaunch.buildingTitle`/`territory` usages.
- [ ] **Step 3: Remove the `test.fail` line** (and its comment) for `/` in `e2e/shell.spec.ts`.
- [ ] **Step 4: Run** `npm run check` (root), then `npm run build -w apps/landing && npm run e2e -w apps/landing`. Expected: all green, including the 320 px test and axe in both locales. If any existing test pins old copy, update it to the new copy.
- [ ] **Step 5: Commit** `feat(landing): the new home page`.

### Task 7: Quality gates on real pixels and real conditions

**Files:** Create `apps/landing/e2e/contrast.ts` (helper), extend `e2e/home.spec.ts`.

**Interfaces:** Produces `contrastRatio(a: [number, number, number], b: [number, number, number]): number` (WCAG 2.x relative luminance).

- [ ] **Step 1: Failing tests:** `contrastRatio([0,0,0],[255,255,255])` is 21; the hero `h1` and lead have >= 7:1 against the pixels behind them at widths 375, 768 and 1440 (screenshot the hero with text `color: transparent`, sample the text box area, take the worst pixel, compare with the computed text colour); `javaScriptEnabled: false` context renders the `h1` and the `#lista` anchor works; with the hero image request aborted, the `h1` is visible and `scrollHeight` does not change after load (CLS guard); `/es` and `/en` have no horizontal overflow at 320 px.
- [ ] **Step 2: Run** -> failing where unimplemented. **Step 3: Implement** helper and tests. **Step 4: Run** `npm run e2e -w apps/landing` -> PASS.
- [ ] **Step 5: Measure, do not gate:** `npm run budget -w apps/landing` must pass; then run a mobile Lighthouse (Slow 4G, mid-range phone profile) on `/es` and `/en` with the chrome-devtools tool and write LCP, INP proxy, CLS and total JS into the PR body. Targets: LCP <= 2.5 s, CLS <= 0.1.
- [ ] **Step 6: Commit** `test(landing): contrast, no-JS, blocked-image and overflow checks for the home`.

### Task 8: Final verification and handoff

- [ ] **Step 1:** `git fetch`; if `feat/brand-flow-and-english` moved, `git rebase --onto <new tip> <old tip> feat/home-landing`; re-run `npm run check`, build, e2e, budget.
- [ ] **Step 2:** Open the built site (`npm run start -w apps/landing`) in Chrome at 375, 768 and 1440 px, in ES and EN, and confirm: hero reads at a glance, the five sections in order, the WhatsApp and email buttons open the right target, the form still submits against the fake adapter.
- [ ] **Step 3:** Confirm every `Prelaunch` key is used (`Who` keeps `privacyLink`); delete any that are not, in both locales.
- [ ] **Step 4:** Write the PR description (what, why, gates measured, owner steps: Search Console, merge order). **Do not push or open the PR without Santiago's explicit OK.**
- [ ] **Step 5: Commit** any leftover fixes `chore(landing): final cleanups for the home`.

## Self-review notes
Spec coverage: structure and copy (T1, T5), hero art and layout (T4, T5), SEO metadata, canonical, hreflang, OG, JSON-LD (T3, T6), allies buttons (T2, T5), form unchanged and `#lista` kept (T6), gates and Review Focus (T7), stacking and no-push rule (T8). Not covered on purpose: analytics tool, actor selector, 2K hero, extra scenes (spec non-goals).
