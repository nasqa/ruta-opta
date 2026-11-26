# Analytics: what we count and what we decide with it

For whoever runs the campaign. We read three sources, as counts:

- **Plausible:** visits and clicks, with no cookies.
- **The mailing list** (Zoho Campaigns): confirmed sign-ups.
- **The inboxes** (WhatsApp and info@rutaopta.org): messages that were really sent.

Day to day you need [Tagged links](#tagged-links), [Weekly review](#weekly-review-10-minutes) and [Reading rules](#reading-rules). Requirements are in GitHub issue #14. How it is built is in `docs/superpowers/specs/2026-11-25-analytics-design.md`. When a change touches personal data, a provider or the privacy policy, follow [the privacy workbook](privacy/workbook.md).

**Status on 2026-11-25: Plausible counts nothing yet.** It starts when the variable in step 4 of [Before the production variable is set](#before-the-production-variable-is-set) is set. To switch it off, unset the Netlify variable `ANALYTICS_SCRIPT_SRC` and trigger a deploy. Visits from before the start cannot be recovered.

## Questions and decisions

| Short name | Question | Decision it informs |
|---|---|---|
| Channel | Which channel deserves the effort: WhatsApp groups, Instagram, QR codes or e-mail? | Where the next links, QR codes and hours go |
| Instagram | What does Instagram contribute to sign-ups and confirmations? | Whether Instagram keeps its weekly time |
| Ally route | Which ally route or contact link turns clicks into real messages? | Which invitation or pre-written message to rewrite or push |
| Funnel | Where does the funnel leak: visit, call to action, sign-up, confirmation? | Which step of the page or the sign-up to fix first |

## Goals

Each name in the first column is an event the site sends. The Plausible goal must have exactly that name, or it does not show in conversions. The list in code is `apps/landing/src/modules/analytics/catalog.ts`, and a test fails if these names differ from it. Card names are the ones on the English page.

| Goal | Business question | Action it informs | Where the click is |
|---|---|---|---|
| Hero Follow | Funnel, Channel, Instagram | Whether the top of the page takes people to the list; by source, where effort goes | Top of the home, main button to the sign-up |
| Hero Ally | Funnel | Whether the top button takes allies to their section | Top of the home, ally button |
| Tourism Follow | Funnel, Channel, Instagram | Whether the middle of the page also takes people to the list; by source, where effort goes | Home, tourism panel link to the sign-up |
| Ally Train WhatsApp | Ally route | Rewrite or push the Train invitation and its message | Train card (training institutions), button |
| Ally Train Email | Ally route | Rewrite or push the Train invitation and its subject | Train card, e-mail link |
| Ally Link WhatsApp | Ally route | Rewrite or push the Coordinate invitation and its message | Coordinate card (public bodies), button |
| Ally Link Email | Ally route | Rewrite or push the Coordinate invitation and its subject | Coordinate card, e-mail link |
| Ally Validate WhatsApp | Ally route | Rewrite or push the Validate invitation and its message | Validate card (agencies, lodgings, guides), button |
| Ally Validate Email | Ally route | Rewrite or push the Validate invitation and its subject | Validate card, e-mail link |
| Ally Drive WhatsApp | Ally route | Rewrite or push the Drive invitation and its message | Drive card (businesses and foundations), button |
| Ally Drive Email | Ally route | Rewrite or push the Drive invitation and its subject | Drive card, e-mail link |
| Ally Accompany WhatsApp | Ally route | Rewrite or push the Accompany invitation and its message | Accompany card (organizations), button |
| Ally Accompany Email | Ally route | Rewrite or push the Accompany invitation and its subject | Accompany card, e-mail link |
| Ally Share WhatsApp | Ally route | Rewrite or push the Share invitation and its message | Share card (people with a craft, a skill or a connection), button |
| Ally Share Email | Ally route | Rewrite or push the Share invitation and its subject | Share card, e-mail link |
| Ally Other WhatsApp | Ally route | Rewrite or push the open invitation and its message | "Is yours a different case?", WhatsApp button |
| Ally Other Email | Ally route | Rewrite or push the open invitation and its subject | "Is yours a different case?", e-mail button |
| Copy Email | Ally route | Read it with Ally Other Email; an e-mail sent to a copied address has no written subject | "Is yours a different case?", copy button |
| WhatsApp Floating | Ally route | Keep or rewrite the floating button's own message | Floating button, every page |
| Footer WhatsApp | Ally route | Whether the footer brings contact clicks | Footer, every page; no written message |
| Footer Email | Ally route | Whether the footer brings contact clicks | Footer, every page; no written subject |
| Footer Instagram | Instagram | Whether the site sends people to the profile. It does not show what Instagram brings in: tagged links do | Footer, every page |
| Signup Submit | Funnel, Channel, Instagram | Whether people who reach the form send it; by source, which channel produces attempts | Sign-up form, on submit. Its Total counts every attempt, refused ones included |

Not counted, on purpose: menu links to the home's sections (in the header, and under "Explore" in the footer), the privacy e-mail addresses, and the "sign up again" links on the confirm page.

## Pageview goals

- `/es/confirmar`: opened the link in the confirmation e-mail (Spanish)
- `/en/confirm`: the same, English
- `/es/confirmado`: saw the "confirmed" page (Spanish)
- `/en/confirmed`: the same, English
- `/es/baja`: saw the "unsubscribed" page (Spanish)
- `/en/unsubscribed`: the same, English

In the Goals report, **Total** counts every view of these pages, reloads included, and **Uniques** counts the visitors who saw them. Neither is the number of people who confirmed or left: the mailing list is where to read that. The confirm page has the same address for a valid, expired or broken link. The unsubscribed pages count leavers only if Zoho Campaigns sends people there after they unsubscribe, which is **not yet verified** (ADR 0003, "Open").

## Tagged links

Put all three tags on every link or QR code shared outside the site. WhatsApp and QR traffic often arrives without a referrer, and untagged it shows as direct.

**Link builder.** Copy this line and replace the three words in capitals (use `/en` for English):

`https://www.rutaopta.org/es?utm_source=SOURCE&utm_medium=MEDIUM&utm_campaign=CAMPAIGN#lista`

| Parameter | What it names | Values |
|---|---|---|
| `utm_source` | Channel | `diplomado`, `whatsapp`, `instagram`, `email`, `qr` |
| `utm_medium` | Placement | `grupo`, `estado`, `bio`, `historia`, `boletin`, `afiche` |
| `utm_campaign` | Campaign | `diplomado-2026-11` (course channels), `lanzamiento-2026-12` (public Instagram) |

| Where you share it | Link |
|---|---|
| Instagram bio | `https://www.rutaopta.org/es?utm_source=instagram&utm_medium=bio&utm_campaign=lanzamiento-2026-12#lista` |
| Instagram story | `https://www.rutaopta.org/es?utm_source=instagram&utm_medium=historia&utm_campaign=lanzamiento-2026-12#lista` |
| Course WhatsApp group | `https://www.rutaopta.org/es?utm_source=diplomado&utm_medium=grupo&utm_campaign=diplomado-2026-11#lista` |
| QR code on a course poster | `https://www.rutaopta.org/es?utm_source=qr&utm_medium=afiche&utm_campaign=diplomado-2026-11#lista` |

- Lowercase, ASCII, no spaces. `utm_source` takes at most 24 letters, digits or hyphens. A longer or odd value is not stored with the sign-up.
- The tags go before `#lista`. Remove `#lista` to open at the top of the page.
- Link to the home (`/es` or `/en`). The sign-up reads `utm_source` from the address of the page with the form. The tag is lost if the visitor uses the language switch, or leaves the home through a plain link and comes back without it, or if a browser or extension strips the Referer. The sign-up still goes through.
- **Only `utm_source` reaches the mailing list.** Confirmations can never be split by placement or campaign.
- Decided by the owner (2026-11-25): links shared by the course, its WhatsApp groups included, take `utm_source=diplomado`. `whatsapp` is for WhatsApp outside the course.
- If you need a value that is not listed, such as a campaign outside the course and Instagram, add it here before you share the link.

## KPI definitions

| KPI | How it is counted | Source |
|---|---|---|
| Visits by channel | Visits by `utm_source` | Plausible |
| Visits by language | Pages under `/es`, and the bare `/`, are Spanish; pages under `/en` are English | Plausible |
| Visits by device | Device type | Plausible |
| Clicks by call to action | The goal's **Total** | Plausible |
| Sign-up attempts | **Total** of `Signup Submit`: every attempt, refused ones included | Plausible |
| Confirm links opened | **Total** of `/es/confirmar` plus `/en/confirm` | Plausible |
| Confirmed pages seen | **Total** of `/es/confirmado` plus `/en/confirmed` | Plausible |
| **Confirmed sign-ups** (the sign-up number to report) | New contacts on the list, our own tests left out | Mailing list |
| Confirmed sign-ups by channel | Contacts whose source ends in `o=<utm_source>` (see the unverified points below) | Mailing list |
| Messages by ally route | Conversations that start with that route's written message or subject | Inboxes |
| Clicks against messages | Messages and click **Total** side by side, for example "3 messages from 11 clicks" | Weekly tally |
| Unsubscribed pages seen | **Total** of `/es/baja` plus `/en/unsubscribed` (that leavers reach them is not yet verified, see Pageview goals) | Plausible |

For every goal, read the **Total** column of the Goals report: it counts every conversion, repeats by the same visitor included. **Uniques**, the other column, counts visitors who converted, so one visitor's repeated clicks or attempts count once. A person counts as one visitor within a day, and as another one on another day or device ([Plausible's metrics definitions](https://github.com/plausible/docs/blob/master/docs/metrics-definitions.md), read 2026-11-25).

## Reading rules

- Report counts. No percentages per button.
- No A/B tests: with about 250 first visitors they measure noise.
- Label every conclusion High, Medium or Low confidence.
- Draw no conclusion about a segment with fewer than 5 independent data points. Write "not enough data".
- A click is not a message, and an attempt is not a sign-up. The inboxes and the mailing list are the truth.
- Read the funnel as separate counts: visits, follow clicks, `Signup Submit`, confirm links opened, confirmed pages, new contacts. They are not one tracked group: people can scroll to the form without a follow click, or confirm in another browser. Funnel reports need the Business plan; issue #14 chose Starter.
- Blockers hide some visits from Plausible.
- To learn why something happens, watch 3 to 5 people use the page on their phone.

## Weekly review (10 minutes)

Once a week while the course runs (it ends 2026-12-18). Use the same seven days in all three sources. Who does the tally: **nobody is named yet**.

1. **Visits (2 min).** In Plausible, note visits by source, language (from the page paths) and device.
2. **Clicks (2 min).** In the Goals report, note the **Total** column for each goal, `Signup Submit` and the pageview goals included. Not Uniques, which counts visitors.
3. **Inboxes (4 min).** For each new conversation in WhatsApp and info@rutaopta.org, match its first message or subject to a route and count it.
4. **List (1 min).** In Zoho Campaigns, count new contacts without our own tests. Each sign-up language goes to the list set for it: count every such list once. Split by source if you can see it.
5. **Decide (1 min).** One line per question: a decision, "no change" or "not enough data", with its confidence.

Copy this table into your own sheet, and keep it out of this repository, which is public. It holds counts only: never a name, a phone number or message text.

| Week | Route | Clicks (WhatsApp) | WhatsApp messages received | Clicks (e-mail) | E-mails received | Sign-up attempts | Confirmed |
|---|---|---|---|---|---|---|---|
| | Train | | | | | | |
| | Link | | | | | | |
| | Validate | | | | | | |
| | Drive | | | | | | |
| | Accompany | | | | | | |
| | Share | | | | | | |
| | Other | | | | | | |
| | Floating | | | n/a | n/a | | |
| | Footer | | n/a | | n/a | | |
| | Unmatched | n/a | | n/a | | | |
| | Week total | | | | | | |

- **Train to Share:** clicks come from the two `Ally <Route>` goals. "Link" is the card titled Coordinate in English.
- **Other:** clicks come from the two `Ally Other` goals. Add `Copy Email` apart in the e-mail clicks, as "+ 2 copies".
- **Footer:** clicks come from `Footer WhatsApp` and `Footer Email`. These links write nothing, so their messages cannot be recognised.
- **Unmatched:** anything without a written message or subject. It may come from a footer link, from a copied or typed address or number, or from someone who edited the text.
- **Sign-up attempts** (week total only): `Signup Submit`. It replaces issue #14's "List sign-ups", because the list receives only confirmed people.
- **Confirmed** (week total only): new contacts on the list.

To recognise a route, press its button or link on the live site and read what it writes, in a browser with your own visits excluded so that you add no clicks. In code the texts are in `apps/landing/messages/es.json` and `en.json`: `Prelaunch.allies.routes.<route>.message` and `.subject`; for Other, `Prelaunch.allies.whatsapp.message` and `Prelaunch.allies.email.subject`; for Floating, `SiteShell.whatsappFloat.message`.

## What each tool can attribute

| Tool | It can tell you | It cannot tell you |
|---|---|---|
| Plausible | Visits and their UTM tags, clicks by goal, views of the funnel pages | Which channel a confirmation came from, because the e-mail link usually opens in another browser. Whether a message was sent |
| Mailing list | Who confirmed. The source we send with each contact reads `rutaopta.org/<locale> · <policy version> · o=<utm_source>`, with no `o=` part for an untagged link | Sign-ups never confirmed. Placement or campaign |
| Inboxes | That a message was really sent, and its route if the written text survived | Which channel brought the person |

Confirmations by channel come only from the list's source field. **Unverified:**

- Whether Zoho Campaigns shows or exports that field on our plan. ADR 0003 notes that in Zoho Campaigns 3.0, Contact Source is an Advanced segmentation field of the Professional plan; on Standard, check whether a list export carries it.
- Whether Zoho accepts the value as written, and whether signing up again updates the source or keeps the first one.
- Splitting Plausible's goals by source has not been tried on our account. Check it at the first review.

No weekly script is planned: Plausible's Stats API needs the Business plan.

## When the site changes (redesign playbook)

- Same call to action in the same place, with new code or a new look: keep its event id.
- A call to action that moves is a new event with the same intent. Retire the old one: move it to `retiredGoals` with the date and reason. Retire a removed one the same way.
- Never rename a goal or reuse a retired name. The dashboard's history hangs on the name.
- A new page address (slug) means a new pageview goal.
- For a new event, add it to `catalog.ts`, tag its element with `eventProps`, add its name to the ledger in `tests/analytics-catalog.test.mjs`, add its row to [Goals](#goals) and create the goal in Plausible. For a retired one, remove its row and keep the ledger line.
- Every page keeps the footer and floating-button goals.
- Keep the tag close to what people press: the script looks for it at most 3 parents up from the clicked node.
- CI fails when a conversion link has no event, when a goal sits on the wrong link, when an active goal is on no page or a footer or floating-button goal is missing from one (`e2e/analytics.spec.ts`), and when a tag is too far from the click (`e2e/analytics-requests.spec.ts`). One limit: for a link to `#lista` or `#allies` the check looks only at the section, so a swapped or extra goal there can pass.
- After a change to Plausible's script settings, refresh the pinned copy (`apps/landing/e2e/vendor/README.md`).

## Owner checklist

- [x] Account and site created (domain `rutaopta.org`); its script address is in `apps/landing/netlify.toml`.
- [x] 2026-11-25: outbound links, file downloads and form submissions switched off. The site also forces all three off.
- [ ] In Shields, Hostnames, allow only `www.rutaopta.org`.
- [ ] Exclude your own visits. In each browser you use on the site, open `https://www.rutaopta.org` and run `localStorage.plausible_ignore = "true"` in the console.
- [ ] Name who does the weekly tally.

There are no goals in the dashboard yet, on purpose. After release:

- [ ] Use the dashboard's step that adds every event already received. An event nobody has triggered yet is not among them: add it by hand with the exact name from [Goals](#goals). A goal also counts events received before it existed.
- [ ] Add the 6 [pageview goals](#pageview-goals) by hand.

## Before the production variable is set

**First, the blockers** in `docs/privacy/register.json`. The policy is published only when no open action has `blocks` set to `publish` ([the workbook's publishing section](privacy/workbook.md#11-publishing-a-policy-version)). The variable is set only after that, once every other open action with `blocks` set to `measurement` is done.

**Done:**

- Script rewrite: the script and event rewrites are both in `apps/landing/netlify.toml`.
- Request-level check: `apps/landing/e2e/analytics-requests.spec.ts` runs a pinned copy of our script.
- Sign-up form: tagged (`Signup Submit`). Our script was read first: it has no `preventDefault` or `.submit()` call and writes no cookie or storage.

**Still to do, in this order:**

1. **Deploy preview, with GET or HEAD only, so that no event reaches Plausible.** Set `preview` to the pull request's preview address.

   ```sh
   preview=https://deploy-preview-16--rutaopta.netlify.app
   curl -sI "$preview/o/e"
   curl -s "$preview/o/s.js" | head -c 300
   curl -sI "$preview/es/confirmar"
   curl -sI "$preview/en/confirm"
   curl -sI "$preview/es/baja"
   curl -sI "$preview/en/unsubscribed"
   curl -sI "$preview/es"
   for page in es en es/privacidad en/privacy es/confirmar en/confirm es/confirmado en/confirmed es/baja en/unsubscribed; do
     echo "$page $(curl -s "$preview/$page" | grep -cE 'plausible\.init|/o/s\.js|plausible\.io/js')"
   done
   ```

   Expected, in order:
   - `/o/e` does not redirect to a `/es…` address;
   - `/o/s.js` returns Plausible's script, not a page of ours;
   - both confirm pages and both unsubscribed pages answer `Referrer-Policy: no-referrer` (Zoho redirects to the unsubscribed ones, and what it appends to their address is unknown);
   - the home does not: the sign-up reads `utm_source` from the `Referer`;
   - every page prints `0`, so none has the script. The `plausible-event-name` classes are in every build and do not count.

2. **Best effort: do the rewrites override `Cookie` and `Referer`?** Netlify passes the browser's headers through a rewrite (its support staff confirm it for cookies). So Plausible can receive a page's non-secret address in `Referer` (UTM tags, at most an ad click id) and this domain's cookies, today only `NEXT_LOCALE`. The confirm and unsubscribed pages send no `Referer`. Both rewrites set a `headers` map; whether it replaces what the browser sent is **unverified**. To test it, on a preview that will never be merged, add a temporary rewrite from `/o/echo` (the proxy skips `/o/`), with the same `status`, `force` and `headers`, to an endpoint that returns the headers it receives. Call it with fake values: `curl -s -H 'Cookie: probe=fake' -H 'Referer: https://example.com/fake' -H 'X-Probe: seen' <that preview>/o/echo`. It is proven only if `X-Probe` comes back, which shows that the endpoint echoes what reaches it, and neither fake value does. If it is not, keep the proxy and record that here.
   - **Result:** not yet checked.
   - **The proxy rule:** before anything that signs people in shares this domain, either the override is proven or the proxy goes. Otherwise its session cookie reaches the analytics vendor.

3. **Before publishing: is anyone already on the list?** Check in Zoho. The owner says nobody is (**unverified**). The form has been live under the older policy. Decree 1074 of 2015, art. 2.2.2.25.2.2 ([official text](https://www.cancilleria.gov.co/sites/default/files/Normograma/docs/decreto_1074_2015_pr025.htm), read 2026-11-25): when there are substantial changes to the content of the processing policies about the identification of the controller or the purpose of the processing, which can affect the content of the authorization, the controller must tell the data subject before, or at the latest when, the new policies are applied, and must obtain a new authorization when the change is about the purpose. This is not legal advice: counsel confirms how it applies. This change adds purposes, so anyone found there is a question for counsel before they are measured by link.

4. **After the owner's approval and the merge,** set `ANALYTICS_SCRIPT_SRC=/o/s.js` in Netlify, for the **Production context only**, and rebuild (Netlify's "Trigger deploy"). Then open the live site with a tagged link, in a browser without the own-visit exclusion, click a call to action. The visitor's IP address must be forwarded, because Plausible's bot filter drops events without it. No direct way to see that is verified here, so check:
   - no response to `/o/e` carries `x-plausible-dropped` (browser developer tools, Network);
   - the visit and the click reach the dashboard.

## Script weight

Our Plausible script is about 2.5 KB gzip: 2,491 B for the content alone (`gzip -9n`, measured 2026-11-25 on the pinned copy, after the three automatic measurements were switched off), body only, before response headers. That is above the "about 2 KB" of issue #14.

The JavaScript budget run never loads it. On this branch (2026-11-25) it measured `/es` at 192,680 B against a limit of 199,680 B, which leaves 7,000 B.
