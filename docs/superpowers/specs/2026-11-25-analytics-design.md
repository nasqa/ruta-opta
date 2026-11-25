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
- **Privacy:** one consolidated change, policy version `2026-11-25-draft`, with a paragraph on the language cookie, and the controller section naming Ruta Opta.
- **Timing:** ship with that interim text without waiting for counsel. This overrides the issue's acceptance criterion "reviewed by counsel before the merge". He accepts the risk. The production variable is the kill switch. Merging still needs his explicit approval of the finished PR.
- **Architecture:** `modules/analytics`, composed by the route.
- **Vendor:** Plausible, as in the issue. Recommended again on 2026-11-25; **his yes is pending**. Nothing vendor-specific is built before it.

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
  catalog.ts     pure data: events, business questions, retired names, pageview-goal routes (built)
  plausible.ts   the only file that knows the vendor
  server.ts      starts with `import 'server-only'`; the one entry point routes import
```

No `index.ts`: nothing here belongs in client JavaScript, and `server-only` plus `next build` enforces it. Client islands (`CopyEmail`, `WaitlistForm`, `ConfirmForm`) and `SiteFrame` receive serialised attribute objects from their server parents, never event ids. `site-shell` declares the shape of the slots it accepts; `(site)/layout.tsx` fills them.

### Port

- `eventProps(id: EventId, className?: string)` returns attributes to spread on the element, keeping the call site's class. It is a set of attributes and not a class string because the fallback vendor in the issue marks elements with `data-` attributes.
- `noEvent(reason)` returns a neutral marker attribute for a route-owned element that leads to a conversion destination and is deliberately not counted. Only reason today: `recovery` (the "sign up again" links on the confirm page).
- `parse(attributes)` in the adapter returns the goal name an element carries. Every guard reads markup through it, so the guards are vendor-neutral.

Event attributes render in every build. Only the script is gated.

### Vendor adapter (`plausible.ts`)

- Markup: class `plausible-event-name=Words+Joined+By+Plus`. The click handler looks at most 3 parents up from the clicked node. A tagged link also sends its `href` as the `url` property.
- Snippet: the vendor's `plausible.init` call, written as a **literal string** (not `fn.toString()` of compiled code), with `endpoint` and `transformRequest`. It takes the canonical host as an input.
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
- **Fix (built):** `next.config.ts` answers the two confirm pages with `Referrer-Policy: no-referrer`, so the policy holds from the first byte and stays with the document through soft navigations. Only those pages: the waitlist reads `utm_source` from the `Referer`, so a site-wide policy would break attribution. Guards: an e2e on real requests and a contract test against `routing`. After a deploy, check the header with `curl -I` (the page renders in a Function).
- **Still open, other pages.** Netlify passes the browser's headers on through a 200 rewrite (its support staff confirm it for cookies). So the vendor would receive the full page address in `Referer` (an `fbclid`, for example) and every first-party cookie of this domain. Today that is only `NEXT_LOCALE`; a signed-in platform on this domain would hand its session cookie to the analytics vendor. Rule: the two rewrites override `Cookie` and `Referer` with the `headers` map in `netlify.toml`. Whether Netlify overrides an incoming header is unverified: prove it on a deploy preview against an echo endpoint, with fake values, before pointing the rewrites at the vendor in production. If it does not, stop and ask the owner to choose between the direct-script fallback (a cross-origin request gets only the origin and no cookies; blockers hide more visits) and a proxy function with a header allow-list (departs from the issue's rewrites).

### Gate and delivery

- `next.config.ts` inlines `ANALYTICS_SCRIPT_SRC`: the Netlify variable when `CONTEXT === 'production'`, and the empty string otherwise. Never `undefined`: Next skips undefined values, and `/confirm` renders in a Function that would then read the runtime environment.
- Empty: no script. A first-party path: the proxy, with the adapter's event path as `endpoint`. An absolute vendor URL: the issue's direct-script fallback, used only if the proxy cannot be made to work or cannot be made safe, and documented.
- A production deploy's permalink is also built with `CONTEXT=production`: the script file loads there and sends nothing, because the host check drops every event. Accepted: nothing is counted or sent.
- The root layout renders a plain `<script async src>` and the inline init (not `next/script`, to add no client code of ours).
- `netlify.toml`: two `status = 200` rewrites with neutral paths (no "analytics", "stats" or "plausible"). The per-site script URL is public, so it is written there.
- **The proxy matcher in `src/proxy.ts` must exclude those paths.** Netlify runs the Next proxy before the rewrites; the event path has no dot, so next-intl would redirect it and every event would be lost without an error. Next requires the matcher to be a literal, so a test checks it against the adapter's constants.
- In production, verify that the visitor IP is forwarded and that responses carry no `x-plausible-dropped` header.

## What is tagged

22 + 1 events and 6 pageview goals, as declared in `catalog.ts`. `Signup Submit` goes on the `<form>` only after our own per-site script is checked: the tracker source has a compat branch that resubmits a tagged form with `form.submit()`, which would bypass the server action. A live per-site script (not ours) has no such branch. If ours has it, the form is not tagged and the event moves to `retiredGoals` with that reason.

Not counted, by rule rather than by list:
- fragment links inside a `<nav>` are navigation (header sections, footer "Explore");
- links to WhatsApp, the contact address or Instagram **always** need an event, inside a `<nav>` too;
- rights-request addresses (privacy e-mails) must **never** carry one;
- `noEvent('recovery')` on the confirm page's "sign up again" links.

`fix/hero-copy-and-note` (unpushed, another worktree) edits `hero.tsx`, the messages and home tests. Tagging the hero will conflict with it if it lands first.

## Guards

| Guard | Fails when |
|---|---|
| Catalog unit test (built) | a goal name is reused, renamed or dropped without retiring it; an event answers no question; an ally route lacks its events; a renamed slug changes a pageview goal |
| Adapter unit test, evaluating the exact snippet string | the token could leave in any field; a non-canonical host is not dropped; an error does not drop the event |
| Rendered-HTML crawl of every route in `routing.pathnames` in each locale, plus states driven with the fake adapter (confirm valid, expired, invalid; form after "sent"; closed FAQ panels from the server HTML) | a conversion destination (WhatsApp, contact e-mail, Instagram, `#lista`, `#allies` outside a `<nav>`, the sign-up form once tagged) has neither an event nor `noEvent`; a rights address carries an event; an element carries an unknown goal; a goal appears twice on a page; an active event appears on no page |
| Request-level spec | see below |
| Wiring contract | `netlify.toml` rewrites differ from the adapter's paths; the proxy matcher catches them or stops catching real pages |
| Confirm-page referrer (built) | a request from a confirm page carries the token in `Referer`; the header rule drifts from `routing` or reaches another page |
| No-production e2e | any analytics script or request appears; analytics writes a cookie or web storage. The only cookie allowed is the existing `NEXT_LOCALE` |
| Docs | the goal table in `docs/analytics.md` differs from the catalog |

**Request-level spec.** Chromium with `--host-resolver-rules=MAP www.rutaopta.org 127.0.0.1:3100`; `window.__plausible` set with `addInitScript` (it skips the tracker's automation check); the adapter's exact snippet injected; a pinned copy of our per-site script served through `page.route`; the event endpoint intercepted; anything addressed to the vendor aborted and asserted to be zero. It proves:
- no request carries the token value, in its body or in any header, including after a language switch on the confirm page (a soft navigation that builds a URL with the token);
- confirming sends a pageview for `/es/confirmado`: the server action's redirect is a client-side navigation, so it only counts if the tracker's history hook sees the router's `pushState`;
- clicking the **innermost** node of each tagged element yields its catalog name through the vendor's own parser (one more wrapper would push the tag out of reach);
- nothing is written to storage;
- a sign-up still completes with the script loaded.

The e2e never touches a real service. Check the tracker's licence before committing the pinned copy.

## Privacy, rules and records

- Privacy strings (es and en), copied verbatim from section 1 of the proposal Santiago approved on 2026-11-25 (`~/Downloads/ruta-opta-analytics-proposal.md`, kept outside the repository because Spanish copy lives only in `messages/es.json`): new `measurement` section with its table-of-contents entry, changed intro, data, purpose and processor texts, the language-cookie paragraph; `policyVersion = '2026-11-25-draft'`. In the controller section only the brand name changes: the legal name, tax id and representative stay (`tests/home-messages.test.mjs` requires them).
- `growth-opta` rule 8 is rewritten in the same PR (after the vendor yes): only Plausible, cookieless, first-party proxied, nothing we collect is sent; UTM links.
- ADR 0003 and the PR body record the decision to ship before counsel, with its date. The three counsel questions still go out (authorisation for cookieless measurement; adequacy of the EU hosting; whether the new purpose must be notified to existing subscribers under Decree 1074, art. 2.2.2.25.2.2).
- `AGENTS.md` gains one line: every call to action takes an event from the catalog.

## `docs/analytics.md`

Event catalog and goals; UTM convention with a one-line link builder; KPI definitions; **decision map** (event → question → action); reading rules (counts, not rates per button; each conclusion labelled High, Medium or Low; at least 5 data points per segment; no A/B tests); a weekly review that takes 10 minutes, with the issue's tally table; what each tool can attribute (confirmations per channel come from the mailing list's source field, because the confirmation e-mail usually opens in another browser; this depends on the list tool showing or exporting that field, still unverified); a redesign playbook (keep ids; a moved call to action is a new event with the same intent, and the old one is retired; never rename a goal; a slug change means a new pageview goal); the owner's dashboard checklist (domain `rutaopta.org`; hostname allow-list `www.rutaopta.org`; outbound links, file downloads and form submissions off; own visits excluded).

The plan includes no Stats API below Business, so no weekly script is proposed.

## UTM convention

Lowercase, ASCII, no spaces, at most 24 characters in `utm_source` (a longer or odd value is not stored with the sign-up).

| Parameter | Values |
|---|---|
| `utm_source` | `diplomado`, `whatsapp`, `instagram`, `email`, `qr` |
| `utm_medium` (the placement) | `grupo`, `estado`, `bio`, `historia`, `boletin`, `afiche` |
| `utm_campaign` | `diplomado-2026-11` (course channels), `lanzamiento-2026-12` (public Instagram) |

## Constraints

The repo rules in `AGENTS.md`; test first; `npm run check`, build, e2e and budget pass; the Lighthouse limit never rises (measured on `c12cfb0`: 267,464 B of 297,984 B). The budget run loads no vendor script, so the PR states the measured size of our own per-site script against the headroom. A live per-site script measured 2,491 B gzip, above the issue's "about 2 KB": report it, do not hide it.

## Order

1. Stack on PR #15 and read `utm_source` (done).
2. Port, server entry and the vendor-neutral guards.
3. Adapter, script gate, proxy wiring, tags (needs the vendor yes; the proxy needs the per-site URL).
4. Privacy strings, rule 8, `docs/analytics.md`.
5. Draft PR; deploy preview counts nothing; after his approval and the merge, set the variable and verify in production.

## Open

Vendor yes; the per-site `pa-…js` URL; whether `fix/hero-copy-and-note` lands; whether the mailing list shows the source field; counsel's answers; whether Netlify lets a rewrite override `Cookie` and `Referer`.

**Owner decision pending:** what ships if the vendor yes or the script URL is missing on 2026-11-29. Proposed: a first pull request with only the `utm_source` change and the privacy sentences about the link (no measurement section), so sign-ups from the launch are attributed in the mailing list, which cannot be backfilled. It means two privacy changes instead of one.
