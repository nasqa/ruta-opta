# Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** count visits and call-to-action clicks on rutaopta.org with Plausible, cookieless and first-party, without the confirm token or anything we collect reaching the vendor.

**Architecture:** `modules/analytics`: a vendor-free catalog, one vendor file, pure markup and destination-policy files, and a `server-only` entry. Routes pass ready-made attributes to UI modules and client islands. Guards read the rendered HTML.

**Tech Stack:** Next 16.4.6 App Router, React 19, next-intl 4.15.3, TypeScript 6.0.3, node:test, Playwright, Netlify.

**Spec:** `docs/superpowers/specs/2026-11-25-analytics-design.md` (read it and GitHub issue #14).

## Global Constraints

- Everything in the repo is English. Spanish copy only in `apps/landing/messages/es.json`. The brand is "Ruta Opta" or "Ruta OPTA" as already written; never "Opta" alone.
- Test first: watch each new test fail for the expected reason before writing the code.
- No ESLint exceptions, no hand-written hex colours, kebab-case file names, early returns, arrow functions, minimal comments.
- `process.env` is read only in a module's `server.ts` or `src/shared/env.ts`, as a direct member read (`process.env.NAME`), so Next can inline it.
- No new client JavaScript of ours. Nothing under `modules/analytics` is imported by a `'use client'` file; islands receive attribute objects as props.
- `site-shell` and `waitlist` never import `modules/analytics`: the route composes.
- `lighthouserc.json` is never edited.
- Tests never touch real services: e2e on port 3100, `WAITLIST_ADAPTER=fake`, blank `ZOHO_*`; nothing is sent to plausible.io.
- Commits in English, one per task at least, with no attribution lines. Never push to `main`, never merge.
- Read `.claude/stack.md` first; read the installed Next docs before using a Next API.

## The per-site script

`https://plausible.io/js/pa-gVAEa_XsPsebKDIjckNPK.js` (public). Static reading: no `preventDefault`, no `.submit()`, no storage or cookie write (it only reads `localStorage.plausible_ignore`). 2,491 B gzip for the content (`gzip -9n`, 2026-11-25), body only: above the issue's "about 2 KB". Its built-in config can turn on outbound links, file downloads and form submissions from the dashboard, so the init call forces all three off.

## Not in this plan

Setting `ANALYTICS_SCRIPT_SRC` in Netlify: it comes after the owner's approval and the merge (`docs/analytics.md`, "Before the production variable is set").

## Review Focus

1. A language switch on the confirm page builds a new address with the token, then a click sends it as the page URL: it must be stripped. (Task 1)
2. The token under another name or casing (`?T=`, `?token=`, `?utm_token=`, in a fragment): only the exact allowed names survive. (Task 1)
3. Referrers that are not web pages (`android-app://…`), empty, or missing, and events with no props: sanitised or dropped, never a throw that escapes. (Task 1)
4. A redesign that puts a WhatsApp or contact link inside a `<nav>`: it still needs an event. (Task 2)
5. A link that already has CSS-module classes: tagging keeps them, and the goal is still read among many classes. (Task 2)

**The port is a bag of attributes** (`TrackingAttributes`). `site-shell` and each client island declare that shape locally, because they cannot import the module; they spread the bag and join only their own class. Swapping vendor must touch `plausible.ts` and the rewrites only.

---

### Task 1: Vendor adapter

**Files:** Create `apps/landing/src/modules/analytics/plausible.ts`, `tests/analytics-adapter.test.mjs`.

**Interfaces — Produces:**
```ts
export const proxyPaths = { script: '/o/s.js', event: '/o/e' } as const;
export const vendorEventUrl = 'https://plausible.io/api/event';
export type TrackingAttributes = { className?: string; [key: `data-${string}`]: string | undefined };
export const goalAttributes: (goal: string) => TrackingAttributes;             // here: { className: 'plausible-event-name=Ally+Train+WhatsApp' }
export const goalOf: (attributes: Record<string, string>) => string | undefined; // DOM attribute names: class and data-*
export const initSnippet: (options: { host: string; endpoint?: string }) => string;
export const scriptTags: (src: string | undefined, host: string) => { src: string; init: string } | undefined;
```
`initSnippet` returns a **literal string** (never `fn.toString()`), the vendor stub followed by `plausible.init({...})`:
`window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};`
with `outboundLinks:false,fileDownloads:false,formSubmissions:false`, `transformRequest` and, only when given, `endpoint`. Interpolate `host` and `endpoint` with `JSON.stringify`.

`transformRequest(payload)`, all inside `try`, returning `null` (event dropped) on any error: drop unless `location.hostname === host`; `payload.u` keeps only the query names `ref`, `source`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` (exact, case-sensitive) and no fragment; a truthy `payload.r` loses its whole query and fragment; a truthy `payload.p?.url` (resolved against `location.href`, `mailto:` included) loses its query and fragment.

`scriptTags`: empty or undefined → undefined; a first-party path (starts with `/` and resolves to no other host) → `{ src, init }` with `endpoint: proxyPaths.event`; the per-site shape `https://plausible.io/js/pa-<id>.js`, and no other vendor URL (older scripts ignore `init`) → init without `endpoint` (the issue's direct fallback); anything else (including `//host/x`) → undefined.

- [ ] **Step 1: Write `tests/analytics-adapter.test.mjs`.** Evaluate the exact string `initSnippet` returns with `node:vm`: a context whose `window` is itself, with `URL`, `URLSearchParams` and `location: { hostname, href }`; then read `context.plausible.o`. Make a real token with `sealToken` (as `tests/waitlist-use-cases.test.mjs` imports it). Tests: the snippet sets `endpoint` only when given; `u` for `https://www.rutaopta.org/es/confirmar?t=<token>` and `/en/confirm?t=<token>` has no `t=` and no token; allowed names survive with their values and order; `?T=`, `?token=`, `?utm_token=`, `#t=` do not survive; `r` of `…/es/confirmar?t=<token>#x` becomes the bare path; `r` `android-app://com.google.android.gm/` survives; `r` null or absent and `p` absent pass; `p.url` `mailto:info@rutaopta.org?subject=Hi` becomes `mailto:info@rutaopta.org`; `p.url` `https://wa.me/573105874657?text=x` loses its query; no output field of any case above, serialised with `JSON.stringify`, contains the token; host `deploy123--rutaopta.netlify.app` and `rutaopta.org` → `null`; a `u` that is not a URL → `null`. `goalAttributes`/`goalOf` round-trip every goal in `catalog.ts`; `goalOf({ class: 'a b plausible-event-name=Hero+Follow c' })` is `'Hero Follow'`; `goalOf({ class: 'a b' })` and `goalOf({})` are undefined. `scriptTags` for the five input kinds.
- [ ] **Step 2: Run** `node --test tests/analytics-adapter.test.mjs` — expected FAIL, module not found.
- [ ] **Step 3: Implement `plausible.ts`.**
- [ ] **Step 4: Run** the test — PASS; `npm run lint` and `npm run typecheck` pass.
- [ ] **Step 5: Commit** `feat(analytics): the vendor adapter, with a sanitiser that fails closed`.

### Task 2: Port, destination policy, server entry and production gate

**Files:** Create `modules/analytics/{markup.ts,policy.ts,server.ts}`, `tests/analytics-policy.test.mjs`. Modify `modules/analytics/catalog.ts`, `apps/landing/next.config.ts`, `tests/config.test.mjs`.

**Interfaces — Consumes:** Task 1. **Produces:**
```ts
// markup.ts (pure)
export const eventProps: (id: EventId, className?: string) => TrackingAttributes;      // call site's classes first, then the vendor's attributes
export const noEvent: (reason: 'recovery') => TrackingAttributes;                    // { 'data-no-event': 'recovery' }
// Call sites spread the whole bag and never read .className: another vendor may mark elements with data- attributes
// policy.ts (pure, no vendor)
export type PageElement = { href?: string; inNav: boolean; optedOut: boolean; goal?: string };
export const violation: (element: PageElement) => string | undefined;                  // a sentence naming the problem
// server.ts: first line `import 'server-only';`
export { eventProps, noEvent } from './markup';
export { allyRoutes } from './catalog';
export const analyticsScript: () => ReturnType<typeof scriptTags>;                     // host 'www.rutaopta.org', reads process.env.ANALYTICS_SCRIPT_SRC
```
`violation` rules: a rights address (`mailto:privacidad@rutaopta.org`, `mailto:privacy@rutaopta.org`, any query) must have no goal. A link to `https://wa.me/…`, to `mailto:info@rutaopta.org…` or to `https://www.instagram.com/rutaopta…` must have a goal, whatever `inNav` and `optedOut` say. A fragment link to `#lista` or `#allies` (`#x`, `/es#x`, `/en#x`) needs a goal or `optedOut`, unless `inNav`. `optedOut` on anything but those fragment links is a violation. Everything else is free.

`next.config.ts`: add `ANALYTICS_SCRIPT_SRC: context === 'production' ? (process.env.ANALYTICS_SCRIPT_SRC ?? '') : ''` to `env` (never undefined: Next skips undefined, and the runtime environment would answer instead).

- [ ] **Step 1: Write the tests.** `analytics-policy.test.mjs`: one case per rule above, including WhatsApp inside a `<nav>` without a goal (violation) and with `optedOut` (violation); the addresses in `policy.ts` equal `SiteShell.footer.infoEmail`, `footer.instagramUrl`, `Privacy.emailEs`, `Privacy.emailEn` from both message files; `eventProps('footer-whatsapp', 'a b').className` starts with `a b ` and `goalOf({ class: that })` returns `Footer WhatsApp`; `eventProps('hero-follow').className` has no leading space; `noEvent`. In `config.test.mjs`: with `ANALYTICS_SCRIPT_SRC=/o/s.js`, `env.ANALYTICS_SCRIPT_SRC` is `''` for `CONTEXT` undefined, `deploy-preview`, `branch-deploy`, `dev` and the value for `production` (with `WAITLIST_ADAPTER=live`); production without the variable → `''`. Add a test that `server.ts` starts with `import 'server-only';`.
- [ ] **Step 2: Run** `node --test tests/analytics-policy.test.mjs tests/config.test.mjs` — expected FAIL.
- [ ] **Step 3: Implement.** `server.ts` holds no logic (`server-only` throws under plain Node, so tests import the pure files).
- [ ] **Step 4: Run** tests, lint, typecheck — PASS.
- [ ] **Step 5: Commit** `feat(analytics): the port, the destination policy and the production gate`.

### Task 3: Delivery wiring

**Files:** Create `apps/landing/src/app/[locale]/_components/analytics-script.tsx`, `tests/analytics-wiring.test.mjs`. Modify `apps/landing/src/app/[locale]/layout.tsx`, `apps/landing/netlify.toml`, `apps/landing/src/proxy.ts`.

**Interfaces — Consumes:** `analyticsScript()`, `proxyPaths`, `vendorEventUrl`.

`AnalyticsScript` (server component) renders nothing when `analyticsScript()` is undefined, else `<script async src={src} />` and `<script dangerouslySetInnerHTML={{ __html: init }} />`; the layout renders it inside `<head>`. Not `next/script` (it would add client code).

`netlify.toml`, after the existing rules: `from = "/o/e"`, `to = "https://plausible.io/api/event"`, `status = 200`, `force = true`, `headers = { Cookie = "", Referer = "https://www.rutaopta.org/" }` with a comment that overriding an incoming header is not yet verified. The same rule from `/o/s.js` to `https://plausible.io/js/pa-gVAEa_XsPsebKDIjckNPK.js`.

`proxy.ts` matcher, still a literal: `'/((?!api|trpc|_next|_vercel|o/|.*\\..*).*)'`, comment: Netlify runs the proxy before the rewrites.

- [ ] **Step 1: Write `tests/analytics-wiring.test.mjs`:** `new RegExp('^' + config.matcher + '$')` (import `config` from `proxy.ts` as `tests/i18n.test.mjs` imports it) matches `/`, `/es`, `/es/confirmar`, `/privacidad`, `/en/privacy`, `/ofertas`, and does not match `proxyPaths.event` or `proxyPaths.script`; in `netlify.toml` (split on `[[redirects]]`, no new dependency) the block whose `from` is `proxyPaths.event` exists once, with `to` = `vendorEventUrl`, `status = 200`, `force = true`, the block from `proxyPaths.script` has the same `status`, `force` and `headers` and a `to` of the per-site `pa-` shape; every `to` is written as a double-quoted string, and every block whose `to` is on `plausible.io` has a `from` that is one of `proxyPaths`; the layout source renders `<AnalyticsScript />` between `<head>` and `</head>`.
- [ ] **Step 2: Run** — expected FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the test, `tests/i18n.test.mjs`, lint, typecheck — PASS. `npm run build -w apps/landing` passes.
- [ ] **Step 5: Commit** `feat(analytics): the gated script and the first-party event path`.

### Task 4: Tags and the rendered-page guards

**Files:** Create `apps/landing/e2e/analytics.spec.ts`. Modify `(site)/_components/home/{hero.tsx,tourism.tsx,allies.tsx,copy-email.tsx}`, `(site)/layout.tsx`, `modules/site-shell/{site-frame.tsx,index.ts}`, `(site)/page.tsx`, `(site)/_components/waitlist-form.tsx`, `(site)/confirm/page.tsx`, `(site)/confirm/_components/confirm-form.tsx`. (Paths under `apps/landing/src/app/[locale]/` except the module.)

**Interfaces — Consumes:** `eventProps`, `noEvent`, `allyRoutes` from `@/modules/analytics/server` (server files only); `violation`, `goalOf`, `events` in the spec.

Tags: hero primary `hero-follow`, secondary `hero-ally`; tourism link `tourism-follow`; each ally route `ally-${route}-whatsapp` / `-email` (take `allyRoutes` from the module and delete the local list, so a new route without events fails the type check); the "other" cards `ally-other-whatsapp`, `ally-other-email`; `CopyEmail` takes a `tracking` prop (the bag, typed locally) spread on its Button (`copy-email`); the floating button `floating-whatsapp`; the footer WhatsApp, contact e-mail and Instagram links `footer-whatsapp`, `footer-email`, `footer-instagram`. The footer privacy address is never tagged. `SiteFrame` takes a required `tracking` prop with slots `floating`, `whatsapp`, `email`, `instagram`, each the bag typed locally in `site-shell`; it spreads the slot and joins its own class with the slot's. `(site)/layout.tsx` fills them. `noEvent('recovery')` on both "sign up again" links of the confirm page; the island receives it as a prop. The sign-up `<form>` is tagged `signup-submit`: the page passes the bag to `WaitlistForm`, which spreads it on the form. `hero.tsx` will conflict with the branch `fix/hero-copy-and-note`, which is going to merge: change nothing there beyond the import and the two spreads.

- [ ] **Step 1: Write `e2e/analytics.spec.ts`.** *Guard:* visit every `routing.pathnames` page in each locale, plus the confirm page with a valid, an expired and a broken token in both locales (seal tokens as `waitlist.spec.ts` does), the home after a successful sign-up with the fake adapter on `/es` and `/en` (as `waitlist.spec.ts` submits it), and the confirm form's expired answer, with JavaScript on only: seal a token that expires a few seconds after the page loads (`sealToken`'s `now` argument), wait, press confirm, and walk the page that offers to sign up again; do the whole walk with JavaScript on and again with `javaScriptEnabled: false` (the `<noscript>` content). On each page collect every `a[href]` and every other element for which `goalOf` finds a goal, passing it the element's `class` and every `data-*` attribute: `{ href, inNav: closest('nav') !== null, optedOut: hasAttribute('data-no-event'), goal }`. Assert: no `violation`; every goal is an active goal of the catalog; no goal twice on one page; the goals seen across the walk equal all active goals; each goal sits where its catalog entry says (intent, channel, and the written message or subject, none for the footer links; `#lista` and `#allies` links are judged by their section only); the footer and floating-button goals are on every page and state. Report the page and the element in failures. *No production:* walking the same pages, no request goes to `plausible.io` or to a path starting `/o/`; no `script` element has such a source and no inline script contains `plausible.init`; the cookie names are a subset of `['NEXT_LOCALE']`; `localStorage` and `sessionStorage` hold no key containing `plausible`. Abort every request that is not to the test server.
- [ ] **Step 2: Build and run** `npm run build -w apps/landing && npm run e2e -w apps/landing -- analytics.spec.ts` — the guard must FAIL listing the untagged links; the no-production test passes (it pins today's behaviour; say so in the report).
- [ ] **Step 3: Tag.**
- [ ] **Step 4: Build and run the whole e2e suite** — PASS. `npm run check` passes. Run `npm run budget -w apps/landing` (port 3000 free first): report the largest median against the limit in `lighthouserc.json` (199,680 B since PR #17); it must not exceed main's by more than 200 B (no new client code).
- [ ] **Step 5: Commit** `feat(analytics): tag every call to action, and guard the rendered pages`.

### Task 4b: The request-level proof

**Files:** Create `apps/landing/e2e/analytics-requests.spec.ts`, `apps/landing/e2e/vendor/{plausible-site-script.js.txt,README.md}`.

The spec runs a pinned, byte-for-byte copy of the per-site script (the tracker is MIT-licensed; the README carries the notice, the hash and the refresh procedure) on the local build, under the production host name. Its proofs are the design's "Request-level spec", two of them beyond the first design: **dashboard toggle** (the three automatic measurements switched on in the script's built-in config are still not sent; a bare init is the control) and **wrong host** (on `deploy123--rutaopta.netlify.test` nothing reaches the event path).

Safety rules (in full in the design): never `route.fetch`, `page.request`, `context.request`, the `request` fixture or Node's `fetch`, which ignore the browser's resolver rules and would reach the live site; direct connections plus resolver rules that map only the two test hosts; fail closed, with a first navigation to the `.test` host before any live name and the server address of every opened page checked; everything outside the test hosts aborted, and requests to the vendor asserted to be none.

- [ ] **Commit** `test(analytics): the request-level proof on the real tracker`.

### Task 5: Privacy text and consent version

**Files:** Create `tests/privacy-measurement.test.mjs`. Modify `apps/landing/messages/{es,en}.json`, `(site)/privacy/page.tsx`, `modules/waitlist/server.ts`.

The approved copy is in section 1 of `~/Downloads/ruta-opta-analytics-proposal.md` (outside the repository). Copy it **verbatim** in both languages: `intro`, `sections.data.text`, `sections.purpose.text`, a new `sections.measurement` (`title`, `text` holding the two approved paragraphs separated by `\n\n`) placed between `purpose` and `contact` in the JSON, and `sections.processor` (`title` and `text`). In `sections.controller.text` change "OPTA" to "Ruta Opta". On top of section 1 comes the text approved as section 7 of the same file: the privacy address at the end of the controller section, a new `rights` text, a new section `sections.requests` (four paragraphs) after `rights`, and a new `effective` text with the date of publication (25 November 2026) and the yearly reminder. `policyVersion = '2026-11-25-draft'`.

The page adds `'measurement'` and `'requests'` to `sections` in the same positions, and renders one `<p className="t-body-md">` per `\n\n`-separated paragraph of each section's text.

- [ ] **Step 1: Write the test:** in both languages the keys of `Privacy.sections` are, in order, `controller, data, purpose, measurement, contact, processor, rights, requests`; `measurement.text` has exactly two paragraphs, the first names Plausible, the second mentions a cookie (`cookie`); `processor.text` includes `Plausible Insights OÜ`; `requests.text` has four paragraphs, the representative, the language's privacy address and the four business-day terms; `controller.text` ends with that address; `effective` has the year and the yearly reminder; no message in the namespace holds `[`; the serialised `Privacy` namespace has no `OPTA` that is not preceded by `Ruta ` ; `modules/waitlist/server.ts` contains `const policyVersion = '2026-11-25-draft';`.
- [ ] **Step 2: Run** — expected FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm run check`, build, `npm run e2e -w apps/landing -- pages.spec.ts` — PASS.
- [ ] **Step 5: Commit** `feat(privacy): describe the visit measurement and bump the consent version`.

### Task 6: Plan document, rules and records

**Files:** Create `docs/analytics.md`, `tests/analytics-docs.test.mjs`. Modify `.claude/skills/growth-opta/SKILL.md` (rule 8), `AGENTS.md`, `docs/decisions/0003-waitlist-form-posts-to-zoho-campaigns.md`, this plan and the design. Close the guard gaps found in review in `tests/analytics-wiring.test.mjs` (every redirect target double-quoted) and `apps/landing/e2e/analytics.spec.ts` (footer and floating-button goals on every page and state; no subject on the footer e-mail link; the blind spot stated in full).

`docs/analytics.md` follows the spec's "`docs/analytics.md`" and "UTM convention" sections and the issue's weekly tally table. It has a `## Goals` table whose first column is the exact goal name, then the business question and the action it informs; a `## Pageview goals` bullet list of the six paths in backticks; the one-line link builder; KPI definitions; reading rules; the ten-minute weekly review; what each tool can attribute; the redesign playbook; the owner checklist; and "before the production variable is set". Done: the script rewrite, the request-level check and the sign-up form decision (tagged). Still to do, in order: (1) on the deploy preview, GET or HEAD only: the event path does not redirect to `/es…`, the script path serves the vendor script, both confirm pages answer `Referrer-Policy: no-referrer` and the home does not, and no preview page has an analytics script; (2) best effort, whether Netlify overrides `Cookie` and `Referer` on the rewrites, tried with fake values against an echo endpoint: if it does not, keep the proxy and record it; before anything that signs people in shares this domain, either the override is proven or the proxy goes; (3) before publishing, check in Zoho whether anyone is already on the list; (4) after the owner's approval and the merge, set the variable for the Production context only, rebuild, and verify the forwarded visitor IP, no `x-plausible-dropped` and events in the dashboard.

Rule 8, verbatim:
> 8. **No cookie banner, no personal data in analytics.** The only third-party measurement allowed is Plausible: cookieless, nothing stored on the device, served first-party through our own proxy, and never sent anything we collect (names, emails, tokens, form values). It processes the visitor's IP address and user agent to count a day's visitors and stores neither. Measure with counts and UTM-tagged links. No other trackers.

`AGENTS.md`, under "UI": `- Every call to action takes an event from \`modules/analytics\` (see \`docs/analytics.md\`). \`e2e/analytics.spec.ts\` fails on a conversion link without one.`

ADR 0003, under its decisions: `- **Measurement and privacy text (2026-11-25).** The visit measurement and the origin tag ship with the interim policy version \`2026-11-25-draft\`; counsel review follows (owner decision). This replaces issue #14's criterion of a review before the merge. The Netlify variable \`ANALYTICS_SCRIPT_SRC\` turns the measurement off: unset it and rebuild.` Also there: the origin tag's policy version becomes `2026-11-25-draft`, and the owner's answers to the questions meant for counsel are recorded as his.

- [ ] **Step 1: Write the test:** the goal names in the `## Goals` table equal the active goals of `catalog.ts`; the `## Pageview goals` paths equal those derived from `pageGoalRoutes` and `routing`; `SKILL.md` no longer contains `?o=`.
- [ ] **Step 2: Run** — expected FAIL.
- [ ] **Step 3: Write the documents.**
- [ ] **Step 4: Run** `npm run check` — PASS.
- [ ] **Step 5: Commit** `test(analytics): close the guard gaps found in review`, then `docs(analytics): the measurement plan, rule 8 and the records`.

## Running order

One task at a time in this single worktree: `.next`, port 3100 (e2e) and port 3000 (budget) are shared.

## Final verification (controller)

- [ ] Whole-branch review by a fresh reviewer on the most capable model.
- [ ] `npm run check`, build, full e2e, budget.
- [ ] One build, no server, with `CONTEXT=production WAITLIST_ADAPTER=live ANALYTICS_SCRIPT_SRC=/o/s.js` and no keys: the prerendered home holds the async script and the init with the `/o/e` endpoint. Then rebuild normally.
- [ ] Push; on the deploy preview (GET/HEAD only): `/o/e` does not answer with a redirect to `/es…`; `/o/s.js` serves the vendor script; both confirm pages have `Referrer-Policy: no-referrer` and the home does not; no analytics script in any page.
- [ ] Update the PR body and the status file.
