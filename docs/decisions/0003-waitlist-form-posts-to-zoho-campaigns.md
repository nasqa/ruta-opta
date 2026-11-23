# 0003. The waitlist runs its own double opt-in

Status: proposed (Claude, 2026-11-23). Accepted when Santiago merges the branch.

## Context

The first version let Zoho Campaigns own the double opt-in. Its confirmation email is one org-wide message for both languages, sends people to a Zoho page, and already lands in spam, with no room to change the HTML. Santiago chose to confirm with our own email instead (2026-11-23). The alternatives were Zoho confirming and Amazon SES. SES needs a new AWS account and a sandbox review. Resend's free plan caps at 100 emails a day, which a launch day could exceed.

## Decision

- **Flow.** Signup never calls Zoho. The server action validates, throttles, seals a token and emails a confirm link through Zoho CPaaS. Zoho Campaigns is called only after the person confirms. The form gives the same answer for a new address and a known one.
- **Token.** AES-256-GCM, so the URL carries no readable personal data. The purpose is bound as additional data, so a token sealed for another purpose cannot be replayed as a confirmation. It lasts 7 days. `WAITLIST_TOKEN_KEY` is 32 random bytes in base64, and `WAITLIST_TOKEN_KEY_PREVIOUS` is optional, so rotating the key does not break links already sent. The throttle hash key and the at-rest key for the cached Zoho token derive from it, so there are no extra secrets. The payload carries the policy version the person saw, and the Zoho `source` records it.
- **Confirm page.** `/confirm` (es `/confirmar`) is a Server Component. Opening the link changes nothing, because corporate link scanners open every link. A button posts to `confirmWaitlist`, which subscribes and redirects to `/confirmed`, so reloading does not resubscribe. The page is noindex with `referrer: no-referrer`. The token's locale picks the Zoho list.
- **Locale.** The signup locale comes from a hidden form field validated against the locales that have the confirm page, because `getLocale()` throws in Server Actions under next/root-params.
- **Ports and adapters.** All in `src/modules/waitlist`. `mailer.ts`, `audience.ts` and `store.ts` are ports that return result unions and never throw across the boundary. Adapters: `mailer-cpaas`, `audience-zoho` (OAuth refresh, then `listsubscribe`), Netlify Blobs or memory for the store, and in-memory fakes. Only `server.ts` reads `process.env`: it validates the configuration once and builds the use cases. Every other file takes its settings as arguments, so node:test imports it without `server-only`.
- **Switching provider.** `server.ts` has two adapter maps. `mailers` is selected by `MAIL_PROVIDER` (`cpaas`), and `audiences` by `AUDIENCE_PROVIDER` (`zoho`, the default when unset). Each entry reads its own variables. An audience entry then builds on the shared store and token keys, which the Zoho adapter needs for its sealed token cache. To switch, add `mailer-<name>.ts` or `audience-<name>.ts`, add one entry to its map, set the provider variable and the adapter's own variables in Netlify, and delete the old adapter. An unknown provider value is invalid configuration: it fails closed and the log names the variable. Nothing else changes.
- **Zoho Campaigns.** An auth failure is HTTP 401 or a body code of 401 or 1007, with one refresh and one retry. The access token is cached sealed in Blobs. Refreshes are single-flight, and an instance adopts a token another one renewed, which keeps cold-start bursts under Zoho's refresh limit.
- **Throttles.** Per address, two consecutive gap slots and then day claims 1 to 3 are atomic create-only claims in Netlify Blobs, so concurrent requests cannot both pass: at most 1 email per 2 minutes and 3 per UTC day. The per-IP limit (30 an hour, loose on purpose for shared mobile and event Wi-Fi) and the daily total (`WAITLIST_DAILY_CAP`, default 1,000) are approximate. In live mode a request with no IP header goes into one shared bucket, `unknown`. Over a limit the form says "check your inbox" per address, and "could not send" for IP and total. The store holds only HMAC hashes and counters.
- **No typed text in the email.** The confirmation email goes to an unverified address, so it carries neither name nor address. Only the confirm page greets by name.
- **Modes.** `fake` (in-memory mailer and audience, for local runs, e2e and previews) or `live`. A production build with anything but `WAITLIST_ADAPTER=live` fails in `next.config.ts`, and so does a deploy preview or branch deploy with `live` (any `CONTEXT` other than `production` or `dev`, which netlify dev sets), because a new Netlify variable reaches every deploy context by default. Invalid live configuration fails closed, and the log names the variables, never their values.
- **Unsubscribe.** Zoho adds the mandatory unsubscribe link to every newsletter and redirects to our static `/unsubscribed` (es `/baja`), which is noindex.
- **English is shipped but switched off.** Every piece of code handles `en`, and both list keys are required. English goes live when its namespaces are complete, with no code change beyond its URLs in `lighthouserc.json` and `localeDetection`.
- **Not in v1.** Turnstile, until abuse shows up (Santiago approved). The daily cap is a circuit breaker, so an attacker can exhaust it and lock new signups out for the day. That tradeoff is accepted: it protects the domain's reputation.
- The waitlist form is still the exception to "every form returns a request number": our confirmation email is its receipt, and the list belongs to Fundación OPTA. `apps/landing/AGENTS.md` says so.
- The Spanish copy is a draft with `[PENDIENTE]` markers. `npm run check:pending` checks every locale file and blocks publishing until they are gone.

## Open

All of these are live checks, to run with a throwaway address before relying on them.

- With both opt-in settings off (the lists' signup confirmation and the org-level double opt-in), `listsubscribe` adds the contact directly and Zoho sends nothing.
- What Zoho answers when the address is already on the list. Expected: code 0 with the fields updated.
- Whether `source` accepts the policy label, such as `rutaopta.org/es · policy 2026-11`.
- Whether Zoho's unsubscribe redirect is set per list or org-wide, and whether it can point at our page.
- Whether Netlify's Free plan keeps deploy-context values, so previews never see production secrets, and what Blobs costs at this volume.
- The "how do you want to take part" question and the channel of origin need custom fields in the Zoho lists. They are not in this version.
