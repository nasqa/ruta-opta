# Analytics for rutaopta.org: design

Date: 2026-11-25. Spec: GitHub issue #14, which a builder reads too (acceptance criteria, weekly tally table, evidence). This document does not re-scope it; it records how it is built, what changed since the issue was written, and what Santiago decided.

## Intent

Answer four business questions during the course (ends 2026-12-18) and the Instagram launch (from 2026-12-01), with counts that can be trusted, without cookies and without sending personal data to a third party:

1. Which channel deserves the effort: WhatsApp groups, Instagram, QR codes or e-mail?
2. What does Instagram contribute to sign-ups and confirmations?
3. Which ally route or contact link turns clicks into real messages?
4. Where does the funnel leak: visit, call to action, sign-up, confirmation?

The layer must keep working, and keep its history comparable, while the code changes and through a full redesign.

**Non-goals:** funnels, custom properties and the Stats API (Business plan), server-side events, A/B tests, other social profiles, Search Console.

**Failure, even if it technically works:** the confirmation token reaching the vendor; events silently lost in production; a redesign that stops measuring without a red build; a goal that changes meaning; anything sent or counted from outside the production site; a slower sign-up on a weak connection.

## Decisions (Santiago, 2026-11-25)

- **Links:** UTM parameters only. The waitlist reads `utm_source` (it replaces the `?o=` of PR #15, which never shipped). This branch is built on PR #15 and supersedes it; he closes #15. Instagram uses `utm_campaign=lanzamiento-2026-12`; course channels keep `diplomado-2026-11`.
- **Privacy:** one consolidated change, policy version `2026-11-25-draft`, with a paragraph on the language cookie, a section on how to exercise rights, and the controller section naming Ruta Opta.
- **Timing:** ship with that interim text; counsel review follows. This replaces the issue's acceptance criterion "reviewed by counsel before the merge" (owner decision, 2026-11-25). The production variable is the kill switch: unset it and rebuild. Merging still needs his explicit approval of the finished PR.
- **Architecture:** `modules/analytics`, composed by the route.
- **Vendor:** Plausible, as in the issue. He said yes on 2026-11-25, and the account and the per-site script exist.

## Approaches considered

| Approach | Trade-off | Verdict |
|---|---|---|
| `modules/analytics`; routes pass ready-made attributes to UI modules and client islands | A little prop plumbing; UI modules never depend on analytics | **Chosen** |
| `shared/analytics`, imported anywhere | Less plumbing; needs owner approval, breaks "shared knows no domains", couples UI modules to analytics | Rejected |
| A catalog per module, merged by a test | No single source | Rejected |
| Our own click listener over neutral `data-` attributes | Most vendor-neutral; the issue forbids JavaScript of our own | Rejected |

Vendor: Umami is free, but its script holds a tagged same-tab link until its own request settles (static reading of `cloud.umami.is/script.js`), weighs 4,235 B against 2,491 B (gzip, 2026-11-25), and its own FAQ says processing may leave the chosen region.

## Module

```
apps/landing/src/modules/analytics/
  catalog.ts     pure data: events, business questions, retired names, pageview-goal routes
  plausible.ts   the only file that knows the vendor
  markup.ts      pure: the attributes a call site spreads (`eventProps`, `noEvent`)
  policy.ts      pure, no vendor: which elements must, may or must not carry an event
  server.ts      starts with `import 'server-only'`; the one entry point routes import
```

No `index.ts`: nothing here belongs in client JavaScript, and `server-only` plus `next build` enforces it. Client islands (`CopyEmail`, `WaitlistForm`, `ConfirmForm`) and `SiteFrame` receive serialised attribute objects from their server parents, never event ids. `site-shell` declares the shape of the slots it accepts; `(site)/layout.tsx` fills them.

### Port

- `eventProps(id: EventId, className?: string)` returns attributes to spread on the element, keeping the call site's class. It is a set of attributes and not a class string because the fallback vendor in the issue marks elements with `data-` attributes.
- `noEvent(reason)` returns a neutral marker attribute for a route-owned element that leads to a conversion destination and is deliberately not counted. Only reason today: `recovery` (the "sign up again" links on the confirm page).
- `goalOf(attributes)` in the adapter returns the goal name an element carries, from its `class` and `data-*` attributes. Every guard reads markup through it, so the guards are vendor-neutral.

Event attributes render in every build. Only the script is gated.

### Vendor adapter (`plausible.ts`)

- Markup: class `plausible-event-name=Words+Joined+By+Plus`. The click handler looks at most 3 parents up from the clicked node. A tagged link also sends its `href` as the `url` property.
- Snippet: the vendor's `plausible.init` call, written as a **literal string** (not `fn.toString()` of compiled code), with `endpoint`, `transformRequest`, and `outboundLinks`, `fileDownloads` and `formSubmissions` set to `false`. It takes the canonical host as an input.
- Those three automatic measurements are forced off whatever the dashboard says: the options override the per-site script's built-in config, so a toggle there cannot widen what is sent (`formSubmissions` would also report the confirm form).
- Our per-site script is `https://plausible.io/js/pa-gVAEa_XsPsebKDIjckNPK.js` (public). Static reading: no `preventDefault`, no `.submit()`, no storage or cookie write (it only reads `localStorage.plausible_ignore`), and it measures nothing until `init` receives options. It weighs 2,491 B gzip: the content alone (`gzip -9n`, measured 2026-11-25 after the owner switched the three measurements off), body only, before response headers. That is above the issue's "about 2 KB".
- `transformRequest`, failing closed:
  - drop the event if `location.hostname` is not the canonical host (production deploy permalinks are built with `CONTEXT=production`);
  - `u`: keep only `ref`, `source` and `utm_*`, and no fragment;
  - `r`: no query and no fragment (a referrer can be `/confirmar?t=…`);
  - `p.url`: no query and no fragment;
  - any error: drop the event.
- Engagement events reuse the transformed `u` in the tracker source. The request-level spec proves it on the real script.

The confirmation token travels as `?t=`, so a guard that looks for the word "token" proves nothing. Guards assert on the real token value and on `t=`.

### The token and HTTP headers

Cleaning the payload is not enough: the browser also sends headers, and a proxy on our own domain is a same-origin destination, so by default it gets the whole page address in `Referer`.

- **Measured** on a local build before the fix (2026-11-25, Chromium): on `/es/confirmar?t=…` and `/en/confirm?t=…`, 22 to 23 subresource requests per page carried the token, every `async` script among them. React writes async scripts above the page's `no-referrer` meta tag.
- **Fix (built):** `src/proxy.ts` answers the two confirm pages with `Referrer-Policy: no-referrer`, so the policy holds from the first byte and stays with the document through soft navigations. The paths come from `routing`. Only those pages: the waitlist reads `utm_source` from the `Referer`, so a site-wide policy would break attribution. Guards: an e2e on real requests and a unit test of the proxy.
- **Not `headers()` in `next.config.ts`:** it was built that way first and passed locally, but on the deploy preview only `/en/confirm` got the header. `/es/confirmar` did not, nor did the redirect from `/es/confirm`: on Netlify the config headers are matched after next-intl's rewrite (inferred from those three responses). Any header or redirect rule that depends on a localised path must be checked on a deploy preview; `next start` is no proof.
- **Residual, other pages (best effort).** Netlify passes the browser's headers on through a 200 rewrite (its support staff confirm it for cookies). So the vendor can receive a page's non-secret address in `Referer` (UTM parameters, at most an ad click id) and this domain's first-party cookies, today only `NEXT_LOCALE` (`es` or `en`). The two rewrites try to override `Cookie` and `Referer` with the `headers` map in `netlify.toml`; whether Netlify overrides an incoming header is unverified, so check it on a deploy preview against an echo endpoint, with fake values. If it does not, keep the proxy and say so in `docs/analytics.md`.
- **Hard rule for later:** before anything that signs people in shares this domain, either the override is proven or the proxy goes. Otherwise its session cookie reaches the analytics vendor.

### Gate and delivery

- `next.config.ts` inlines `ANALYTICS_SCRIPT_SRC`: the Netlify variable when `CONTEXT === 'production'`, and the empty string otherwise. Never `undefined`: Next skips undefined values, and `/confirm` renders in a Function that would then read the runtime environment.
- Empty: no script. A first-party path: the proxy, with the adapter's event path as `endpoint`. An absolute URL: only the per-site shape, `https://plausible.io/js/pa-<id>.js`, is accepted, as the issue's direct-script fallback (Plausible's older scripts ignore `init`, so the sanitiser would never run). It is used only if the proxy cannot be made to work or cannot be made safe, and documented. Any other value loads no script.
- A production deploy's permalink is also built with `CONTEXT=production`: the script file loads there and sends nothing, because the host check drops every event. Accepted: nothing is counted or sent.
- The root layout renders a plain `<script async src>` and the inline init (not `next/script`, to add no client code of ours).
- `netlify.toml`: two `status = 200`, `force = true` rewrites with neutral paths, `/o/s.js` and `/o/e` (no "analytics", "stats" or "plausible"), both with the `headers` map above. The per-site script URL is public, so it is written there.
- **The proxy matcher in `src/proxy.ts` must exclude those paths.** Netlify runs the Next proxy before the rewrites; the event path has no dot, so next-intl would redirect it and every event would be lost without an error. Next requires the matcher to be a literal, so a test checks it against the adapter's constants.
- A unit test cannot prove Netlify's routing order, so every rule that depends on it is also checked on the deploy preview with `curl`, using GET or HEAD only so that no event reaches the vendor: the event path must not answer with next-intl's redirect.
- In production, verify that the visitor IP is forwarded and that responses carry no `x-plausible-dropped` header.

## What is tagged

23 events and 6 pageview goals, as declared in `catalog.ts`. `Signup Submit` is on the sign-up `<form>`. The tracker source has a compat branch that resubmits a tagged form with `form.submit()`, which would bypass the server action; our per-site script has no such branch, and the request-level spec shows a sign-up completing with the script loaded. The event counts attempts, refused ones included.

Not counted, by rule rather than by list:
- fragment links inside a `<nav>` are navigation (header sections, footer "Explore");
- links to WhatsApp, the contact address or Instagram **always** need an event, inside a `<nav>` too;
- rights-request addresses (privacy e-mails) must **never** carry one;
- `noEvent('recovery')` on the confirm page's "sign up again" links.

The hero is tagged here, so `fix/hero-copy-and-note` (another worktree, not on `main` as of 2026-11-25), which edits `hero.tsx`, the messages and home tests, will have to resolve a conflict there.

## Guards

| Guard | Fails when |
|---|---|
| Catalog unit test | a goal name is reused, renamed or dropped without retiring it; an event answers no question; an ally route lacks its events; a renamed slug changes a pageview goal |
| Adapter unit test, evaluating the exact snippet string | the token could leave in any field; a non-canonical host is not dropped; an error does not drop the event; an automatic measurement is not forced off; a script address other than a first-party path or the per-site vendor URL is accepted |
| Policy and port unit test | a rights address may carry an event; a WhatsApp, contact e-mail or Instagram link may go without one; a section link outside a `<nav>` needs neither an event nor `noEvent`, or `noEvent` excuses anything else; the policy's addresses differ from the messages; tagging loses the call site's classes; `server.ts` stops importing `server-only` |
| Rendered-HTML crawl of every route in `routing.pathnames` in each locale, plus states driven with the fake adapter (confirm valid, expired, invalid, expired after opening; form after "sent"), with JavaScript on and off (closed FAQ panels come from the server HTML) | a WhatsApp, contact e-mail or Instagram link has no event; a `#lista` or `#allies` link outside a `<nav>` has neither an event nor `noEvent`; any other element has `noEvent`; a rights address carries an event; an element carries an unknown goal; a goal sits on the wrong element or link (judged by intent, channel and the written message or subject; the footer links write none); a goal appears twice on a page; a footer or floating-button goal is missing from any page or state; an active event appears on no page. Blind spot: a `#lista` or `#allies` link is judged only by its section, so a swap of `Hero Follow` and `Tourism Follow` passes, and so does an extra one of those, or an extra `Hero Ally`, on another link to the same section, on a page that does not carry that goal already |
| Request-level spec | see below |
| Wiring contract | `netlify.toml` rewrites differ from the adapter's paths; a redirect target is not written as a double-quoted string; another redirect reaches the vendor; the proxy matcher catches the rewrites or stops catching real pages; the server entry or the layout stops rendering the script |
| Confirm-page referrer | a request from a confirm page carries the token in `Referer`; a confirm path lacks the header, or another page gets it |
| No-production e2e | any analytics script or request appears; analytics writes a cookie or web storage. The only cookie allowed is the existing `NEXT_LOCALE` |
| Docs | the goal table or the pageview-goal list in `docs/analytics.md` differs from the catalog; the growth skill names `?o=` again |

**Request-level spec** (`apps/landing/e2e/analytics-requests.spec.ts`). Chromium loads the local build under the name `www.rutaopta.org`, with the adapter's exact tags injected. The script path serves a pinned copy of our per-site script, `apps/landing/e2e/vendor/plausible-site-script.js.txt` (the tracker is MIT-licensed; `e2e/vendor/README.md` carries the notice and the refresh procedure), and the test answers the event path. `window.__plausible` skips the tracker's automation check. It proves:
- no analytics request carries the token value, in its URL, any header or its body, including after a language switch on the confirm page (a soft navigation that builds a URL with the token) and in the engagement sent while the page is leaving (read in Chromium's NetLog, because Playwright never sees it);
- the check can see a leak: with a bare `init` it reports the token;
- confirming sends a pageview of the confirmed page in both locales: the server action's redirect is a client-side navigation, so it counts only if the tracker's history hook sees the router's `pushState`;
- on both homes, a click on each innermost node of every tagged element except the form yields its catalog name through the vendor's own parser (one more wrapper could push the tag out of reach);
- a sign-up completes with the script loaded, sends one `Signup Submit`, and neither the name nor the address reaches an analytics request;
- **dashboard toggle:** with outbound links, file downloads and form submissions switched on in the pinned script's built-in config, the adapter's snippet sends none of the three, and a bare `init` sends all three;
- **wrong host:** on `deploy123--rutaopta.netlify.test` the script initialises and nothing reaches the event path (`.test`, because Chromium forces HTTPS on `.app`; the snippet compares the exact host name);
- nothing is written to storage, and the only cookie is `NEXT_LOCALE`.

Safety rules, so that the spec cannot reach a live service:
- **never use `route.fetch`, `page.request`, `context.request`, the `request` fixture or Node's `fetch` there: they ignore the browser's resolver rules and would reach the live site;**
- both browsers connect directly (`--proxy-server=direct://`) with resolver rules that map the two test hosts to the local server and every other name to nothing;
- it fails closed: a remote browser, a non-Chromium one or one launched without those two switches is refused before any navigation, and the first navigation is a gate on the `.test` host, which loads only through the mapping and whose server address is checked;
- every page a test opens has its server address checked, and every document must have passed that check before a form is filled or submitted, and again when the test ends;
- requests outside the test hosts are aborted, and requests to the vendor are recorded and asserted to be none. A `keepalive` request sent while a page unloads bypasses this; the resolver rules keep it local;
- HTML is never rewritten: of the app's paths, the test answers only the script and event paths;
- a test that opens its own browser context must build the same lab on it, or it skips the gate.

The e2e never touches a real service.

## Privacy, rules and records

- Privacy strings (es and en), copied verbatim from the text Santiago approved on 2026-11-25 (sections 1 and 7 of `~/Downloads/ruta-opta-analytics-proposal.md`, kept outside the repository because Spanish copy lives only in `messages/es.json`): a new `measurement` section, whose second paragraph is about the language cookie; changed intro, data, purpose, processor and rights texts; a new `requests` section on how to exercise rights; the effective date (25 November 2026, which must be the day of publication) with the yearly reminder; `policyVersion = '2026-11-25-draft'`. In the controller section the brand name changes and the privacy address is added; the legal name, tax id and representative stay (`tests/home-messages.test.mjs` requires them).
- `growth-opta` rule 8 allows only Plausible (cookieless, first-party proxied, never sent anything we collect) and UTM links.
- ADR 0003 records the decision to ship before counsel, with its date (the PR body must too). For the questions meant for counsel, it records what the owner said on 2026-11-25 and, apart from that, the working answers proposed on the strength of it: counsel has not confirmed them, and no later confirmation from him is recorded. The three questions stay open (authorisation for cookieless measurement; adequacy of the EU hosting; whether the new purpose must be notified to existing subscribers under Decree 1074, art. 2.2.2.25.2.2).
- `AGENTS.md` has one line: every call to action takes an event from the catalog.

## `docs/analytics.md`

Event catalog and goals; UTM convention with a one-line link builder; KPI definitions; **decision map** (event → question → action); reading rules (counts, not rates per button; each conclusion labelled High, Medium or Low; at least 5 data points per segment; no A/B tests); a weekly review that takes 10 minutes, with the issue's tally table (its sign-up column is named "Sign-up attempts", because the list receives only confirmed people); what each tool can attribute (confirmations per channel come from the mailing list's source field, because the confirmation e-mail usually opens in another browser; this depends on the list tool showing or exporting that field, still unverified); a redesign playbook (keep ids; a moved call to action is a new event with the same intent, and the old one is retired; never rename a goal; a slug change means a new pageview goal); the owner's dashboard checklist (domain `rutaopta.org`; hostname allow-list `www.rutaopta.org`; outbound links, file downloads and form submissions off; own visits excluded); and what remains before the production variable is set.

The plan includes no Stats API below Business, so no weekly script is proposed.

## UTM convention

Lowercase, ASCII, no spaces, at most 24 characters in `utm_source` (a longer or odd value is not stored with the sign-up).

| Parameter | Values |
|---|---|
| `utm_source` | `diplomado`, `whatsapp`, `instagram`, `email`, `qr` |
| `utm_medium` (the placement) | `grupo`, `estado`, `bio`, `historia`, `boletin`, `afiche` |
| `utm_campaign` | `diplomado-2026-11` (course channels), `lanzamiento-2026-12` (public Instagram) |

## Constraints

The repo rules in `AGENTS.md`; test first; `npm run check`, build, e2e and budget pass; the Lighthouse limit never rises (199,680 B since PR #17; measured 2026-11-25 on this branch, `/es` is 192,680 B, a headroom of 7,000 B). The budget run loads no vendor script, so the PR states the measured size of our own per-site script against that headroom: 2,491 B gzip, above the issue's "about 2 KB". Report it, do not hide it.

## Order

1. Stack on PR #15 and read `utm_source` (done).
2. Port, server entry and the vendor-neutral guards (done).
3. Adapter, script gate, proxy wiring, tags and the request-level spec (done).
4. Privacy strings, rule 8, `docs/analytics.md` (done).
5. Draft PR; the deploy preview counts nothing; after his approval and the merge, set the variable and verify in production. The steps are in `docs/analytics.md`, "Before the production variable is set".

## Open

Whether `fix/hero-copy-and-note` lands first; whether the mailing list shows or exports the source field; counsel's answers; whether anyone is already on the list (check in Zoho before publishing); whether Netlify lets a rewrite override `Cookie` and `Referer`. The referrer header on both confirm pages is checked on every deploy preview that touches the proxy.
