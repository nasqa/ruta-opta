# Reference ledger: home page and collage pieces (2026-11-24)

Brief: the home of rutaopta.org (hero, how we work, platform, transparency, allies, newsletter band) plus the simple conceptual cut-paper pieces; visitor goal: understand what Ruta Opta is and how it works, then leave an email or reach out; business goal: lead capture (CTA still open, swappable from the messages) and trust with allies.
Refero calls used: 32 of 8,000 per month (20 in round 1, 12 in round 2) (1 language-switcher probe, 4 searches by me, 2 thumbnails by me, 3 style reads and 10 section calls by two extraction agents). Header and footer are not researched: the `ruta-opta-46` session owns them (decisions 1 and 12 of its branding design).

Status of each entry: SEEN = the title, description and layout were read in a Refero result by this session (and, where marked, the thumbnail was viewed); REPORTED = extracted by a Haiku agent from the Refero tool output and not re-checked here. Quotes under "Collage and art principles" are REPORTED.

## References kept

| # | Refero id | Product and page | What it does | Take (pattern, not pixels) | Avoid | Trama token or component | Status |
|---|---|---|---|---|---|---|---|
| 1 | fe27f316-c4e0-49d9-a77d-b54adf3e3c8b | Mailchimp, "Give Where You Live" (campaign for local nonprofits) | Two-column hero: headline and a short paragraph on a flat field, beside one hand-drawn map with a handful of meaningful objects; text never touches the art | One concept per art piece (a place, a few objects); text on its own plain field | Corporate-hosted campaign; map selector, share and donate pushes; the loud single-colour field | `Scope`, `--color-surface-*`, `t-display-lg`, `t-body-lg` | SEEN, thumbnail viewed |
| 2 | 1eab1313-e096-4ed9-9794-cab6864f52a2 | Kickstarter, charter | Numbered commitments: bold number and headline left, explanation right | "How we work" as three numbered steps in a narrow number column beside wide text | Blue annual-statement callout, tab bar | `t-heading-lg`, `t-title`, `t-body-md`, `--space-group` | SEEN (listing), pattern also REPORTED |
| 3 | 87720313-3bf8-4eea-b285-cf79edd5d608 | MasterClass, commitments page | Six numbered commitments, closing statement with no CTA | Same numbered pattern; a closing line that is a statement, not a push | Implies finished outcomes | same as 2 | REPORTED |
| 4 | ed27e392-b4d0-499d-a750-1fbff5a304d2 | Literal.club, legal page | Legal notice as a plain page: company details and contact | Transparency block = legal entity, NIT, address, representative, contact, privacy link, all read from messages | A join CTA on the legal page | `--color-surface-raised` card, hairline border, `t-body-md` | REPORTED |
| 5 | 67dea6d9-fa11-4753-8012-d540034fa19a | Scape, ESG and social | Downloadable reports list: title, one line, download action | If a real, dated document exists later, list it this way | Showing reports that do not exist yet; "impact" cards | same as 4 | REPORTED |
| 6 | 9a194680-5749-4c01-84ba-b2c37c97b012 | Fibery, partners | Three benefit columns, four expectation columns, one "Become a partner" button, terms as a PDF | Allies: what allies do and what we expect, one button | Partner directory, logo grids, per-partner contact buttons | `Button` (default), `--space-group` | REPORTED |
| 7 | 0e606829-07f5-447f-abee-4ef8488ce1c7 | Typeform, agency partners | Alternating benefit blocks, one centred CTA, "get in touch" as secondary | Allies section: one primary, one quiet secondary link | Logo row, announcement bar | `Button`, text `Link` | REPORTED |
| 8 | 25f31b3b-9286-4d7c-8b14-10fea5ecf907 | Stocksy, newsletter | Form with an explicit consent checkbox beside a preview column | Consent stays visible and unticked; we already have it in `WaitlistForm` | Asterisk overload, past-issue archive (none yet), image collage | `WaitlistForm` (owned by `ruta-opta-46`) | REPORTED |

No reference found for the honest early-stage page ("we are building, nothing to prove yet"): the search returned only testimonial-heavy pages. This is a gap in Refero, so that section is designed from the brief's own rule ("show figures as goals until evidence backs them") and the existing prelaunch copy ("Estamos construyendo la ruta").

## Collage and art principles (REPORTED by the style-extraction agent; quotes not re-verified)

Sources: Refero styles for Givingli (62f904b0-0d6e-47dd-b78c-6f097a7259bc), Craft (fe6a44db-cde5-4c34-b447-796f35795c90) and Kira Learning (21c1dbc4-7ebd-4333-b7af-de4ed468d42c). Principles only, rebuilt in our own words; no image from Refero is used as a generation reference.

- Art is secondary to the type: objects never orbit or crowd the headline ("hero objects are secondary to the headline").
- Few, large pieces, each one concept; objects isolated on a plain ground.
- Depth is a faint edge plus one broad, low-opacity shadow under the overlap. This matches our paper relief and the logo rule (shadow only inside an illustration).
- Captions live outside the art; a piece carries no text.
- One scene takes half a row, not the whole page.
- Flagged DECORATIVE by the agent, and already rejected by the owner: torn edges with fibre lips, tape, stickers, tilted cards, halftone clouds, scribbles, highlighter marks. None enters the page.

## Rejected (and why)
- a0540b55-4fe1-4f3f-a9e8-3baee2784d93 (Canva nonprofits): crisis-framed resource hub and promo banner.
- 573af900-0a8b-4152-91bc-237e7fb8db80 (GoFundMe): donor-as-hero fundraising hub.
- 722a8756-1f60-47eb-953e-322123372d43 (Pexels): subscription modal over the page.
- 9b498549-e75c-41b0-9fdb-2a192af85416 (Monarch): testimonial grid.
- ae46f537-e0fc-4efb-83f4-6bd1573346b2 (Kitchen Stories): testimonial carousels and stats grid.
- c204ea19-6035-491e-84c2-3e525e0190e2 (GitHub Sponsors): sponsor social proof and stats.
- Style direction "Craft, torn paper" as a whole: its torn-paper scraps are the decorative device the owner rejected.

## Decisions (proposed, for the spec)
1. "How we work" = three numbered steps (number column beside text), each with one text-free cut-paper concept piece, because refs 2, 3 and the art principles agree.
2. Hero text on a plain paper field, art below or beside it and never under the text, because ref 1 and the measured prototype agree.
3. Transparency = a plain card with the legal entity, NIT, address, representative, contact and privacy link read from the messages; a proof/report slot that renders nothing until real data exists, because refs 4 and 5.
4. Allies = what allies do and what we expect, one primary button and one quiet link, no logos, because refs 6 and 7. The destination comes from the messages (placeholder: the `info@` alias).
5. Newsletter band = the existing `WaitlistForm`, consent visible, because ref 8.
6. Generation prompts carry the principles as words (one concept, isolated on plain paper, one soft shadow, no text, no tilt, no torn edges); the only image references are our own approved pieces.

## Open questions for the owner
- Spend approval for the first art batch (see the spec message).
- The Escuchar metaphor: the ear came out as a drop; the new metaphor needs a pick after two variants.

## Rules followed
Links and notes only; no Refero images stored or used as generation references; no Refero colours, fonts or radii used; copy invents no proof. Refero results skew toward SaaS and corporate sites, so they confirm structure but give almost no nonprofit paper-art precedent.

## Round 2 (2026-11-24, 12 calls; thumbnails viewed by this session, so status SEEN)
Queries: hero with headline above illustration on mobile; contact via WhatsApp; partner form with organization type; honest early-stage; three numbered steps with art. Results were again mostly SaaS; six screens were worth viewing.

| # | Refero id | Product and page | What it does | Adjustment taken |
|---|---|---|---|---|
| 9 | 7d3715c9-223b-4413-a764-15a066f92a1c | Hers, "Almost done, here's what's next" | Three stacked step cards joined by a vertical line, a marker, a title, one sentence and an image slot per step | Method = vertical timeline with numbered circle markers and a hairline connector; an optional art column that collapses |
| 10 | 4ed39ecb-b79c-42a3-9ce8-087d61119b8d | Hers, intake landing step | Headline, short paragraph, one illustration, then a wide full-width primary button | Hero button full width and 48 px on phones, right after the lead |
| 11 | f323996a-0052-4c86-95bb-de1ba294a5f8 | Mangomint, contact us | Two equal rounded cards (chat, call), each a title, a sentence and one button | Allies = two equal cards (WhatsApp, email), stacked on phones, no icons in v1 |
| 12 | 88e30bc2-7bef-4f56-b270-8464bfafa350 | Navia, "Where are you today?" | Three stacked selectable cards with title and one line each | For v1.1 "¿Qué te describe?": stacked selectable cards on phones, not a dropdown. Avoid its fake-looking star rating |
| 13 | 75fb8b8a-7d42-4400-8b93-71a0f1e47dd4 | Kinhive, development roadmap | Plain bordered cards titled with what is being worked on and what is next | Honest "in progress" presented as a status tag on the Turismo Vivo card |
| 14 | 54278d59-9e4a-4e48-8646-7cbe622391f3 | Todoist, private beta | A small "Private beta" tag by the logo and an invitation to "help shape" it | Optional: a small "En construcción" status in the hero; needs Santiago's OK |

Not found again: a nonprofit paper-art precedent, and any WhatsApp-first contact pattern (the results were chat widgets and phone pages), so the WhatsApp card is designed from the repo's own rules. Reference lock: leading direction is the approved paper relief and Trama; traits carried are the six adjustments above as principles; rejects are star ratings, testimonial strips, carousels and modals.
