# Reference ledger: site chrome (2026-11-23)

Brief: shared header with a language switch, the footer (reveal footer is decided), and the `/privacy` page with contents and a data-rights contact; visitor goal: know where they are, switch language in one tap, find who is responsible and how to reach them; business goal: credibility and legal clarity for a prelaunch nonprofit-style initiative.
Refero calls used: 12 (budget 80). Plan limit: 8,000 per month.

Scope note: Refero shows what products do, not what suits a two-locale prelaunch page. Almost every reference is a multi-column, many-locale footer or a SaaS legal portal; the useful part is structure and order, and the decisions below keep only that. Refero has no reveal-footer evidence in either direction.

## References kept
Page ids are Refero screen UUIDs; open at `https://refero.design/pages/<id>`.

| # | Refero id | Product and page | What it does | Why it works | Take | Avoid | Trama token or component |
|---|---|---|---|---|---|---|---|
| 1 | d68723c5-aa0b-476b-b9f6-5d190db3aad0 | Wise, header and open language list (flow 370, step 3) | Header: logo left, small globe plus "EN" code with a chevron right, then Log in and Register; the list names each language in its own language (Español, Deutsch) | A short code in the header is enough; the names are shown in their own language | Code in the header; each language named in itself (supports the full-name `aria-label` and `lang`) | A dropdown for two locales (an extra tap); the globe icon | `Group`, next-intl `Link` with `aria-current`, `t-label` |
| 2 | 26cb9f93-3048-4f66-ae34-1b8166852a7c | Dopper, home header | Logo centred, language dropdown and cart in the corner, nothing else competes | A brand-first header with the utilities parked at the edge | Keep utilities at the edge, the brand as the anchor | Full-screen photo hero; chat bubble | `Container`, `Group justify="space-between"` |
| 3 | 7573bf28-6150-4307-8551-71503369093b, 4b5991bc-0b72-4100-8f53-6982208f9e09, d1a9ba71-e0f0-42aa-87c0-421213c3a13a | Kickstarter, Onefinestay, Tidal footers | Locale and currency selectors in the footer bottom bar beside legal links | Footers are where large sites put locale controls | Legal links live in a bottom bar with small type | Multi-column link grids, partner logos, app badges, trust badges (all for large catalogues) | `SiteFooter` one row, `t-body-sm`, `action-text-low` |
| 4 | 3cb2cf0a-44f8-4916-ab6a-e5c9747c2174 | Shopify privacy | Dark hero with title, "Updated" date and one-line promise ("How Shopify handles your data"), then a left TABLE OF CONTENTS column with a rule beside the current item and the article on the right | The reader knows scope and freshness before the first paragraph, then can jump | Title, one-line scope, date under the title; left sticky contents list | The black hero banner (colour is Trama's); six-tab legal portal bar | `SceneCard wide`, `Card` with `<nav aria-label>`, `t-overline` |
| 5 | 4b38e08b-ed01-4631-bde0-ab63bab89844 | Dub privacy | Big centered title, article in a bordered card, a right-hand "On this page" list with the current item marked by a vertical rule | The label "On this page" says what the list is | The overline "On this page" is the pattern for «En esta página»; items short enough for one line | Right-hand placement (left is the majority and matches the design) | `t-overline`, hairline `border-subtle` |
| 6 | 428184eb-b3cc-4dd7-8813-fa9f2eed8e34 | Calm privacy | One centered card with the title and "last updated" under it, sections with plain headings | A calm single card is readable without chrome | Title plus date directly under, one reading column | A dense first paragraph with no summary | `SceneCard`, `Title order={2}`, `t-body` |
| 7 | 5fb160df-d976-42cf-8150-0d1ab607f6ca, 5ae35ff0-6005-42a2-987a-568c3af37802, 9a57d7f0-9e96-458a-aaba-52e2606f8a4f | Airtable, Kitchen.co, Appwrite legal pages | Left sticky anchor list plus wide text column, same two-column shape across three unrelated products | The two-column legal layout is the convention readers already know | Left TOC about 240 px, article on the right, one column on phones | Promo banners above the policy (Kitchen) | the design's 240 px / 65 ch grid |
| 8 | 4cd6cbc2-6e9c-4a82-aa9f-c8d069e19871, a057ecad-e1f5-46ca-9c65-904417cc893f (flow 6474) | Pop Site, privacy-rights request form and its confirmation | Request form, then a plain "Successfully Requested" page stating that a reply comes within a legal time | Sets a clear response expectation | State the response window in one plain sentence | A request form and a form page for a five-section policy that can run on mailto | `Card` accent contact block, `Link mailto:` |
| 9 | 7bec7f55-2e78-4281-93f8-4fee649d3417, c5565e44-d295-4eb9-a0dc-3611fc6bbefb | Jasper, Hers privacy controls | Modal with action cards: download my data, delete my data, do not contact | Rights are named as plain actions | Name the actions plainly in the contact card text | Modal; card grid; identity-verification step | text only |

(Row 3 ids in order: Kickstarter, Onefinestay, Tidal.)

## Rejected (and why)
- 319bcd5c-2460-49b3-8cdf-d0a8cb101ea3 (Trulia): a language modal over the page on load; also red buttons per language.
- 7cc3c6d7-4cc9-47c3-8963-3fefe514863f (Busuu), f95a8c84-765e-498c-8d80-8c6f89d7c061 (Cartesia): language carousels and flag-led language pickers.
- 31afe4ba-c63a-4c12-8ce2-af0b6588ddcf (Promova), 101766c2-4348-4476-a224-64987084643c (Klarna): language as a settings-radio page; we have no account.
- 85c54588-be1f-4f02-a384-1dcd95b93cfe (Cartesia, all-languages): a regions-and-languages directory for many locales.
- 9fcf2654-d718-4c9c-9c8d-f9bbae53fe9b (HTTPie): dark legal page with a newsletter signup in the footer; footer upsell.
- a017b4cd-f1a0-4256-b8b7-1d74e40850f0 (LinkedIn): embedded video summary of the policy.
- Footers that carry social icons, app badges, newsletter or partner logos: nothing to link to yet.

## Decisions (3 to 7)
1. **Language switch is two text codes, ES and EN, not a dropdown and not flags** -> next-intl `Link` per locale in a `<nav aria-label>` inside a `Group`, `t-label`, the current one with `aria-current="true"` and the design's 2 px underline; `aria-label` and `lang` give each language its own name (as ref 1 names languages in themselves). With two locales a dropdown is one extra tap (ref 1 avoided). Task 4. At 320 px verify logo, hairline, label and switch fit one line with a 16 px gutter; if they do not, drop the «Ruta Opta» label under about 360 px and keep the switch visible. Keep tap targets at least 44 px (padding, not font size).
2. **The header carries no navigation links and no menu button** -> `SiteHeader` is logo, label and switch only (ref 2: brand anchor, utilities at the edge), because the five routes have nothing to navigate between yet. Task 4.
3. **The footer is one compact block, not a link grid** -> `SiteFooter`: the organisation line, the `/privacy` link and the privacy `mailto:` in a `Group` that stacks on phones; `t-body-sm`, `text-secondary`, links `action-text-low`. No locale selector in the footer (refs 3 put it there because they have many locales; the header switch is enough for two). Reveal behaviour stays as decided: Refero has no evidence for or against it. Task 4.
4. **`/privacy` opens with title, one-line scope and date, then contents** -> `SceneCard wide`: overline «Fundación Embajadores de la Paz», `Title order={1}`, an intro of at most 60 ch, then «Vigente desde [PENDIENTE]» directly under it (refs 4 and 6 date the page where the eye lands). Task 7.
5. **Contents is a left column with an overline and short labels, one column above the text on phones** -> `Card` with `<nav aria-label>`, the overline «En esta página» (ref 5's label), an ordered list of anchors; sticky only on desktop; **no scroll-spy**, because it needs client JS and the route budget only goes down (refs 4 and 5 mark the current item with a rule; we leave it static). Spanish section labels run long, so write them as short noun phrases that fit a 240 px column in one or two lines. Task 7.
6. **Data rights go through a contact card, not a form or a modal** -> a closing `Card` in the accent family with a one-sentence list of what a person can ask (see, correct, delete, stop) and both `mailto:` addresses; a response-time sentence only with the legally confirmed term (ref 8's pattern), written as `[PENDIENTE: plazo de respuesta, confirmar con la Fundación]` and not invented. Task 7 (the footer address link in Task 4).

## Open questions for the owner
- Verify the header at 320 px before Task 4 is merged; the label is the first thing to give up (decision 1), not the switch.
- Which response time applies to the Fundación under Colombian data-protection rules? This is a legal fact for Santiago or the Fundación, not for Refero.
- Header B re-types "Opta" beside the logo (Trama's peer flagged it). Refero's headers (Wise, Dopper) show no logo-plus-label pair; the evidence is neutral, so this is not a conflict.

## Rules followed
Links and notes only; no Refero images stored in the repo; no Refero colours, fonts or radii used; copy invents no proof.

## Controller rulings (2026-11-23)
- Decision 1's fallback (drop «Ruta Opta» under about 360 px) is NOT applied: header B is Santiago's decision. At 320 px the header keeps logo, hairline, label and switch, and fits by tightening gaps and the 96 px logo. If it truly cannot fit, that goes to Santiago.
- Decision 6's response-time sentence is evidence for Santiago, not copy to ship. The privacy page adds only the spec's new keys (`overline`, `effective`, `toc`, `questions`); the legal text stays as it is.
- Refero's microcopy proposals were moved out of the repo (the repo is English-only); Santiago approved the existing copy.
