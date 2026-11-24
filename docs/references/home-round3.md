# Reference ledger: home page, round 3, richness (2026-11-24)

Brief: the home of rutaopta.org after PR #10. Content stays; composition changes. Visitor goal: understand Ruta Opta (talent in five territories, a three-step method, Turismo Vivo in progress, who is behind it), then leave an email or reach out as an ally. Business goal: newsletter sign-ups and ally contacts, plus trust. Constraints: Spanish first, mid and low-end phones on weak signal (growth-opta), Trama and the Opta theme own every color, font, radius and motion, the JS budget only goes down, art carries no text, no invented proof.

Refero calls used: **57** (cap for this round 70; skill budget about 80). Cumulative with rounds 1 and 2: 89 of 8,000 per month. Breakdown: 21 screen searches, 1 site search, 2 style searches, 1 style read, 2 similar-screen calls, 27 thumbnails and 3 full-size images.

Full-size images: three, because a thumbnail only shows the first viewport and needs 9 and 10 (footer, page rhythm) sit at the bottom of the page. They are fe27f316 (Mailchimp), 8936cc84 (Mocha manifesto) and 9828d7e9 (Family home). 8936cc84 was fetched twice, as a thumbnail first and then at full size.

Earlier rounds: `docs/references/home.md`. Round 1 decisions 1 to 6 and round 2 adjustments 9 to 14 still stand unless a decision below replaces them.

Status:
- **SEEN**: this session viewed the image (thumbnail unless marked "full").
- **LISTING**: Refero metadata only.
- **STYLE (read)**: the full Refero style text was read and no screen of that site was viewed.

Refero link for any id: `https://refero.design/pages/<id>`.

Image cache disclosure: the harness saved each image call as a `.jpg` (30 files named `mcp-refero-blob-*.jpg`) in the research session's local `tool-results` folder, outside the repository. Nothing was saved to the repo or the scratchpad, and no image is used as a generation reference. The cached files can be deleted on request.

## 1. Hero: headline and a large illustration share the first screen

| # | Refero id | Product and page | URL | What it does | Take | Avoid | Trama token or component | Status |
|---|---|---|---|---|---|---|---|---|
| 1.1 | fe27f316-c4e0-49d9-a77d-b54adf3e3c8b | Mailchimp, Give Where You Live (round 1 #1, re-viewed full page) | mailchimp.com/givewhereyoulive/ | Full-bleed split band: headline and short paragraph on a flat field at left; an illustrated map fills the right half to the viewport edge | Desktop split: text column of about 40 % on paper, the 16:9 valley bleeding to the right edge; on phones text first, art below | Hand-lettered title (baked text), donate framing, loud single-color field | `t-display-lg`, `t-body-lg`, `Button`, Next `Image` with `priority` | SEEN (full) |
| 1.2 | 5e675348-60d8-4f03-9636-9f02db172bff | Manus, About | manus.im/about | Centered display title on a plain canvas, then one wide rounded art panel at container width; nothing overlaps the art | Phone order and fallback: title, lead and button, then the art as one wide panel, never under the text | Announcement bar, pill CTA, painterly realism | same as 1.1 | SEEN |
| 1.3 | 9e0413e6-6582-466a-a5fe-ea2273cd5cb5 | Playbook, PB Community | playbook.com/p/school/ | Spot illustration above the headline with a small caption crediting the illustrator | If a local artist makes the art, credit them in a caption outside the art (community talent made visible) | Announcement bar, tiny art | `t-caption` | SEEN |
| 1.4 | 7d5204b8-3fe7-47f3-9a93-dd0ab714837b | Nomad Goods, About | nomadgoods.com/pages/about | Full-bleed landscape band with the title set over a quiet zone at bottom-left | Considered, not adopted: puts text on art, against round 1 decision 2 | Person photo, promo bar, chat bubble | none | SEEN |
| 1.5 | 3f73dccf-1aca-4dd5-9221-d4b274028687 (same hero as 9828d7e9) | Family, home hero | family.co | Centered headline flanked left and right by dense clusters of mascots and objects | Not adopted: the art orbits the headline, against round 1's principle "objects never orbit or crowd the headline" | Mascots, confetti objects, two equal hero buttons | none | SEEN |

## 2. Method (Crecer, Crear, Conectar)

| # | Refero id | Product and page | URL | What it does | Take | Avoid | Trama token or component | Status |
|---|---|---|---|---|---|---|---|---|
| 2.1 | 79dd95e6-4202-4995-af09-0fbe0b37ea67 | 1Password, Get started | support.1password.com/explore/get-started/ | Oversized thin numeral "1" in a narrow left column, step title and text beside it, an illustration panel on the right | One big light numeral per step as structure, one art spot per step on the opposite side | Blue gradient header, art with words in it ("WELCOME") | numeral in `t-display-lg` (Comfortaa), `t-heading-md`, `t-body-md` | SEEN |
| 2.2 | b4bec0d8-7b13-4d97-ac33-c2037f2231d5 | Homerun, hiring guide step 1 | homerun.co/guides/hiring-an-intern/internship-program | Sticky left index of the steps with the current one marked; a large illustration above a "Step 1:" display heading | Optional on desktop: a sticky list of the three verbs beside the scrolling steps (CSS `position: sticky`, no JS). On phones, a plain list above the steps | 3D character, yellow flood, pill highlight on the active item | `--space-section`, `t-label` for the index | SEEN |
| 2.3 | style f946f035-2a1d-44a2-92ef-ad1aefb0a07a | komoot style, "capability and collage" recipe | komoot.com | Alternating split chapters: text takes about 40 %, art is on the other side, sides alternate, wide gaps between chapters | Three alternating rows for the method | Tilted overlapping collage, rotated handwritten notes, photo cards | `--space-section` | STYLE (read) |

This upgrades round 2's vertical timeline (Hers 7d3715c9) to alternating rows with art. Round 1's numbered pattern (Kickstarter, MasterClass) still applies to the numerals.

## 3. Territories (Quindío, Risaralda, Caldas, Valle del Cauca, Chocó)

| # | Refero id | Product and page | URL | What it does | Take | Avoid | Trama token or component | Status |
|---|---|---|---|---|---|---|---|---|
| 3.1 | ad3e518b-e5c7-481d-a33f-8390c124f344 | adidas group, Headquarters | adidas-group.com/en/about/headquarters | Full-bleed muted map with dot markers and place names; title and intro sit in a quiet zone at bottom-left | A map band of the five departments with five markers, and the intro on the map's quiet area or above it | Uppercase labels, corporate photo bands below | `Scope` band, `t-heading-lg` | SEEN |
| 3.2 | fe27f316-c4e0-49d9-a77d-b54adf3e3c8b | Mailchimp, map section (same page as 1.1) | mailchimp.com/givewhereyoulive/ | Wide illustrated map of the area with a small list of the six cities overlaid at top-left | An illustrated map with an HTML list of the five territories (name plus one line each) beside it; on phones the list goes below the map | Interactive map JS, labels drawn into the art | `SimpleGrid` or CSS grid, `t-title`, `t-body-sm` | SEEN (full) |
| 3.3 | d2d06a0b-1699-4d39-b908-dae81d1318f2 | DJI, Flying tips | dji.com/flyingtips | Region heading over a wrapping grid of equal cards, each with a name label | Fallback without map art: a wrapping grid of five cards (name plus one line), all five visible on phones | City photos with text over them, dark header | `SimpleGrid`, `--color-surface-raised`, hairline border | SEEN |
| 3.4 | style f946f035 | komoot style, "category symbol tile" | komoot.com | Tiles in which a large flat pictogram fills the top and a short label sits at the bottom | One flat symbol per territory, reused as that territory's marker on the map (one family at several scales) | Tilt-and-scale on hover, diagonal arrows, photo rail | none (art) | STYLE (read) |

## 4. Product in progress (Turismo Vivo)

| # | Refero id | Product and page | URL | What it does | Take | Avoid | Trama token or component | Status |
|---|---|---|---|---|---|---|---|---|
| 4.1 | a4af92cd-95cf-4878-9db7-7794a5f57c43 | Airbnb, Early access | airbnb.com/early-access/overview | "Be the first to try" headline, a short stacked list of what is coming (thumbnail, title, one line each) and one CTA | List two to four things being designed (from messages), with one action that points to the newsletter band ("be the first to know") | Fixed bottom CTA bar, phone screenshots, strong brand-color button | `Badge` (status tag, server-safe), plain `<ul>` with `t-body-md` (not Mantine `List`: compound parts would need a client island), `Button` or `Anchor` | SEEN |
| 4.2 | style f946f035 | komoot style, "promotion in paper" | komoot.com | One broad tinted inset slab inside the paper margins; heading and prose on one side, art on the other | Turismo Vivo becomes the page's only inset panel, so "in progress" reads as its own object | Store badges, phone collage | `--color-surface-raised` or `--color-surface-subtle` panel, theme radius | STYLE (read) |

Gap: no Refero screen shows an honest, non-SaaS "being built" band. Round 2's Kinhive 75fb8b8a (status-tagged cards) and Todoist 54278d59 ("help shape it") remain the precedents.

## 5. About, who is behind it, transparency (no numbers)

| # | Refero id | Product and page | URL | What it does | Take | Avoid | Trama token or component | Status |
|---|---|---|---|---|---|---|---|---|
| 5.1 | 337b6fd9-97d7-4195-9752-40177982119b | Brilliant, About us | brilliant.org/about/ | Text-led: title, five short mission paragraphs on the left, one illustration anchored bottom-right, no cards and no figures | "Who is behind it" as plain prose on paper beside one spot illustration | Sign-up CTA in the header | `t-heading-lg`, `t-body-md` | SEEN |
| 5.2 | 686401c9-9ee2-4928-8049-b9e2cdcd7e69 | Stable Audio, About | stableaudio.com/about | Art panel on the left; short About text on the right ending in "reach out to us here" | Split: art on one side; foundation, city and data-policy link on the other | Blurred gradient art, AI framing | `Anchor` for the policy link | SEEN |
| 5.3 | 8936cc84-babc-4b9a-a55d-06cc7b5c82d6 | Mocha, Manifesto | getmocha.com/manifesto | Oversized title and lead, a hairline rule, three short principle columns, then one closing statement line | Optional: three short commitments as columns, only if the copy exists in messages (no invented claims) | Pill CTAs, AI claims | `Divider`, `SimpleGrid` | SEEN (full) |

Round 1's legal-notice (Literal.club ed27e392) and its rule "proof slots render nothing until real data exists" still apply.

## 6. Allies

| # | Refero id | Product and page | URL | What it does | Take | Avoid | Trama token or component | Status |
|---|---|---|---|---|---|---|---|---|
| 6.1 | 37bdf214-5d54-43bd-aebb-1a413abd0684 | Preply, Partner up | lp.preply.com/affiliate/ | Below the hero, two equal outlined cards, each with a small spot illustration, a title, a paragraph and its own action | Allies: one intro line on what allies do and get, then two equal cards (WhatsApp, email), each with a small spot | Person-photo hero with tilted stacked cards, pink flood, the affiliate-earnings framing | `SimpleGrid cols={{ base: 1, sm: 2 }}`, raised surface, hairline border, `Button` | SEEN (cards row only) |

Round 2's Mangomint f323996a (two equal contact cards) and round 1's Fibery 9a194680 and Typeform 0e606829 (what partners do, one primary action) still stand. The "get involved" query found nothing new.

## 7. FAQ

| # | Refero id | Product and page | URL | What it does | Take | Avoid | Trama token or component | Status |
|---|---|---|---|---|---|---|---|---|
| 7.1 | 5ab0d7a8-a7aa-42f9-984f-ca3491fe9d70 | Family, FAQs | family.co/faqs | Narrow column with a plus or minus marker left of each question, hairline dividers and a "last updated" date | Native `details`/`summary` in a narrow column with hairlines and a plus or minus glyph; zero JS | Crypto content | `details`/`summary` styled with theme tokens (no Mantine `Accordion`: it is compound and stateful, so it would need a client island) | SEEN |
| 7.2 | 9828d7e9-733f-4254-98fa-8a7e040b8171 | Family, home (FAQ block) | family.co | On the home page, a two-column FAQ: heading at left, questions at right; an illustrated closing band follows | Desktop: heading and a "write to us" line at left, questions at right; one column on phones | The testimonial grid right above it | same as 7.1 | SEEN (full, downscaled to 237 px wide: low confidence) |

The current page has no FAQ and the brief keeps the content, so this is an **open question**, not a decision.

## 8. Newsletter band with presence

| # | Refero id | Product and page | URL | What it does | Take | Avoid | Trama token or component | Status |
|---|---|---|---|---|---|---|---|---|
| 8.1 | da57f551-1464-454f-97a7-e98def6d92a5 | Open, shipping-policy page (newsletter band and footer) | shop.o-p-e-n.com/policies/shipping-policy | Full-bleed dark band: a one-line question heading and a one-line promise on the left, an inline email field and "Subscribe" on the right; the footer attaches directly below | Full-bleed dark band holding `WaitlistForm` beside a short promise, joined to the footer as one closing block | Email-only form (ours keeps name, email and an unchecked consent box), "special offers" promise, underline-only input | `<Scope theme="dark">`, `WaitlistForm` (owned by the `ruta-opta-46` session) | SEEN |
| 8.2 | fe27f316-c4e0-49d9-a77d-b54adf3e3c8b | Mailchimp, newsletter band (same page as 1.1) | mailchimp.com/givewhereyoulive/ | Full-bleed band: large heading, one line, an inline field and button, an unsubscribe-anytime note and privacy link underneath, spot illustrations at both edges | Spot art in the band's margins, outside the form; the "unsubscribe anytime" line under the form | Loud single-color field, generic "insights" promise | `Scope`, `t-body-sm` for the note | SEEN (full) |
| 8.3 | b00a3ec4-f4d4-4913-a745-908d41252a81 | The New Yorker, Recommends | newyorker.com/newsletter/recommends | Centered: a small icon cluster, the title, a promise that states the cadence ("every Saturday"), field and button, consent line | Say how often we write in the promise, once the owner sets a cadence | reCAPTCHA badge, all-caps title | messages copy | SEEN |
| 8.4 | ef025a71-9245-42db-8515-7ec4a484804a | 1Password, newsletter | 1password.com/newsletter/ | Spot illustration above the promise and form | Alternative: a crop of the valley above the band heading | Confetti, gift boxes | Next `Image` | SEEN |
| 8.5 | 573ead48-cfac-4e6d-8363-a469e3b0d08f | OpenSea, blog newsletter | opensea.io/blog/newsletter/ | Text and form on the left, an illustration on the right, inside one bordered panel | Weaker alternative: a split panel inside the page instead of a full-bleed band | Dotted decorative circles, UI-mock art | raised surface | SEEN |

## 9. Footer with presence

| # | Refero id | Product and page | URL | What it does | Take | Avoid | Trama token or component | Status |
|---|---|---|---|---|---|---|---|---|
| 9.1 | 8936cc84-babc-4b9a-a55d-06cc7b5c82d6 | Mocha, Manifesto (footer) | getmocha.com/manifesto | Large wordmark at left, four link columns and a legal row on the canvas; the page then ends with a full-bleed decorative art strip | End the page with a full-bleed horizon strip of the valley (a crop, no text) under the legal row | Pattern colors; the black area below is a capture artifact | Next `Image` (lazy), `--color-surface-*` | SEEN (full) |
| 9.2 | da57f551-1464-454f-97a7-e98def6d92a5 | Open (same as 8.1) | shop.o-p-e-n.com | Footer directly under the band: a large brand mark at left, a mission line in its own column, link column at right, hairline column rules | Large Opta mark, the initiative line as a mission statement, then columns | Tiny type, shop links | logo asset, `t-body-lg` for the mission line | SEEN |
| 9.3 | style f946f035 | komoot style, "closing scene and footer" | komoot.com | An illustrated sign-off band with a row of simple silhouettes, then a dark four-column footer with a legal row and a language selector | A short closing band that reuses the territory symbol family, then the footer | Photo duotone, app badges | `Scope theme="dark"` | STYLE (read) |
| 9.4 | 686401c9-9ee2-4928-8049-b9e2cdcd7e69 | Stable Audio (same as 5.2) | stableaudio.com/about | Dark footer that opens with the logo at left and Company, Resources and Socials columns | Columns for Explore (page anchors), Contact (WhatsApp, email), Legal (privacy, data policy), plus the ES/EN switch with text labels | Social icons we do not have | `Scope theme="dark"`, `Anchor`, `Link` from `@/i18n/navigation` | SEEN (top of footer only) |

Gap: no footer with a large brand statement turned up in Refero. Open's mission line is the closest.

## 10. Page rhythm (bands, dividers, illustration spots, bento)

| # | Refero id | Product and page | URL | What it does | Take | Avoid | Trama token or component | Status |
|---|---|---|---|---|---|---|---|---|
| 10.1 | fe27f316-c4e0-49d9-a77d-b54adf3e3c8b | Mailchimp, full page | mailchimp.com/givewhereyoulive/ | Seven full-bleed bands of alternating fields (flat color, white, map, tinted, color, color, black). Every band keeps spot illustrations in its margins and never behind text | One surface per band, alternating, with art spots in the margins; a different composition in every band | The colors themselves, the share-a-card block (baked text in art), the thin black footer | `Scope`, `--color-surface-canvas`, `--color-surface-subtle`, `--color-surface-raised` | SEEN (full) |
| 10.2 | a8f801a8-f668-440f-90c0-5b73288bffbc | Headspace, Join us | headspace.com/join-us | Stacked full-width color bands; one has large soft organic shapes faintly in the background behind centered text | At most one band with a low-contrast paper-hills silhouette in the background | The user and country statistics in its copy, saturated floods | `--color-surface-subtle` | SEEN |
| 10.3 | 7911bb41-a8c4-4a70-975f-fbe344aa829c | Mocha, home | getmocha.com | Huge headline on canvas, then a full-bleed colored band whose rounded edges the next element overlaps | One deliberate overlap: the next section's art or panel overlaps a band edge, for depth | Pill buttons, product UI, lime and aqua | negative margin with theme spacing | SEEN |
| 10.4 | 9828d7e9-733f-4254-98fa-8a7e040b8171 | Family, home (full page) | family.co | Under the hero, a six-card bento of mixed sizes, then alternating text-and-media splits, a two-column FAQ and an illustrated closing band before the footer | At most one bento: territories as a 2 + 3 grid at desktop (fallback 3.3). Close with an illustrated band before the footer | Testimonials, phone mockups, mascots | CSS grid or `SimpleGrid` | SEEN (full, downscaled to 237 px wide: low confidence) |
| 10.5 | style f946f035 | komoot style, page flow and "handwritten editorial pause" | komoot.com | Promise, proof, alternating chapters, curated browsing, one quiet full-width pause band carrying a single belief, closing scene, dark footer | One pause band: a single centered sentence (the thesis "There is talent in every territory") on a tinted band | Rotated handwritten notes | `t-heading-lg` on `--color-surface-subtle` | STYLE (read) |

Style searches that informed this section but were not adopted as directions: ethereum.org a336a01a (illustrated worlds), Ko-fi 4b6a8a0b (paper playground), Kikin eaa4ac11 (hand-drawn landscapes). All are listing only. Their palettes and type are irrelevant (Trama owns both).

## Rejected (and why)

- **komoot f946f035 (style)**: rejected parts are the collage that tilts and overlaps, the rotated handwritten notes, the rotate-and-scale hover, the photo story cards, the statistic tiles and the ratings. These are owner-banned tilt and decoration plus invented-proof patterns. Kept as principles: the inset tinted panel, alternating split chapters, one flat symbol family at several scales, and a closing scene before a footer with legal row and language switch.
- **Tripadvisor Rewards 1b901571**: scalloped, tilted sticker badges and a "$30 off" promotion (pressure).
- **Family hero 3f73dccf / 9828d7e9 (hero only)**: art clusters orbit and crowd the headline, against round 1's principle; mascots.
- **Nomad Goods 7d5204b8 (as a hero model)**: headline set on the image, a person photo, a promo bar and a chat widget.
- **Preply 37bdf214 (hero)**: person photo with tilted stacked cards. Only the two-card row is kept.
- **Reown 5c51eae8**: FAQ bento with giant round toggles and pill shapes everywhere.
- **Cartesia 85c54588**: region tabs hide four of five territories behind JS. Dark SaaS.
- **The Leap 6e99c5ae**: creator photo cards (people as the product) and pill CTAs.
- **Headspace a8f801a8 (copy)**: user and country statistics. Only the band shapes are kept.
- **Mercury 404 c9992bdb**: only the top edge of the footer is visible; the hero has a SaaS tile graphic and pill CTAs.
- **Onefinestay privacy 4b5991bc**: the thumbnail shows no footer. Nothing learned, and not credited.
- **Listing only, discarded on their description**:
  - Onefinestay home a13a5d2a: testimonials, logo wall, carousels.
  - Onefinestay journal cb4a234d: tilted polaroid stack.
  - PayPal partners 003da618, IFTTT partners bc822ec0 and Homerun partners 4a78ae07: logo walls, testimonials, stats.
  - Riverside creators 03338bcd: carousels, testimonials.
  - Jasper company 6230074f: metrics, carousel.
  - Pexels 722a8756, DailyArt fed21e63 and Kit 45594a13: newsletter modals.
  - GoFundMe and Kickstarter: fundraising framing.
  - Kitchen Stories ae46f537: stats and testimonial carousels, already rejected in round 1.
- **Styles not adopted**:
  - Flying Papers and Mana: full-color poster floods.
  - Craft: torn paper, already rejected in round 1.
  - Handsome Frank, New Yorker and ilovecreatives: their signature is their type and art direction, which Trama owns.

## Decisions for the redesign

Every decision uses Trama tokens and Mantine components that render on the server (`Container`, `SimpleGrid`, `Stack`, `Group`, `Title`, `Text`, `Anchor`, `Divider`, `Badge`) plus plain HTML (`ul`, `details`). None needs a new client island. Mantine `List`, `Accordion` and `Timeline` are avoided because their compound parts would need one. The text classes and space tokens named here were checked against the landing's current usage on `feat/home-landing`. Copy check against `apps/landing/messages/es.json` (namespace `Prelaunch`): anything marked **needs copy** is new text, so it is the owner's call and needs a complete English namespace. Opta theme territory names were not verified in this session: `Scope` accepts `theme` and a `territory` string, and the surfaces are `canvas`, `subtle`, `raised`, `element` and `overlay`. So the band decisions name surfaces and `theme="dark"` only. Below-the-fold art is lazy-loaded at responsive sizes for low-end phones.

1. **Split hero with bleeding art.** Text column on paper (H1, lead, one button) at desktop, the 16:9 valley filling the other half to the viewport edge; on phones the text comes first and the art follows full width. Art never sits under text (round 1 decision 2 kept); this replaces the stacked hero. Reason: 1.1, with 1.2 for the phone order; Family's flanking art (1.5) and text on art (1.4) rejected. **New art: no.** Keep the art at 16:9 and let the bleed come from width. Use no cover crop that could clip the sun (the logo) at any width; if a crop is ever needed, first confirm where the sun sits in the frame.
2. **Territories as an illustrated map plus an HTML list.**
   - A paper-relief map of the five departments carries five markers.
   - Beside it, a list gives each territory's name and one line from messages; on phones the list comes below the map.
   - No tabs, no carousel, no JS. Labels are never part of the art (art rule and i18n).
   - Fallback until the map exists: a wrapping grid of five cards, 2 + 3 at desktop, all five visible on phones.
   - Reason: 3.1 and 3.2, fallback 3.3 and 10.4; Cartesia tabs rejected. **New art: yes** (one map; optionally one flat symbol per territory, 3.4).
3. **Method in three alternating rows.** Each row has a large light numeral, the verb, one sentence and one art spot. The spot sits on the opposite side and the sides alternate. Optionally, a sticky index of the three verbs on desktop (CSS `position: sticky` only). Reason: 2.1, 2.2, 2.3, and it matches round 1 decision 1 (one cut-paper concept per step). **New art: yes** (three spots, the batch already proposed in round 1).
4. **Band rhythm.** Each section gets one full-bleed band, and the surfaces alternate:
   - canvas: hero;
   - subtle: thesis pause band, a single sentence (10.5);
   - canvas: territories;
   - subtle: method;
   - raised inset panel, the only one on the page: Turismo Vivo;
   - canvas: who is behind it;
   - subtle: allies;
   - `Scope theme="dark"`: the newsletter and footer closing block.

   Spot art sits in band margins only. At most one deliberate overlap at a band edge (10.3) and at most one band with a faint background silhouette (10.2). Reason: 10.1, 10.2, 10.3, 10.5. **New art: optional** (margin spots).
5. **Turismo Vivo as the page's only inset panel.** A `Badge` status tag (`Prelaunch.tourism.status`), the existing title and text, and an optional short `<ul>` of what is being designed. The list **needs copy**: today the examples live inside `Prelaunch.tourism.text`. No dates or numbers. One spot of art, and one action that scrolls to the newsletter band. Reason: 4.1, 4.2, round 2 #13. **New art: optional** (one spot).
6. **A newsletter band with presence.** It is a full-bleed dark band under `Scope theme="dark"`:
   - a one-line promise, which states the cadence only once the owner sets one;
   - `WaitlistForm` inline beside the promise at desktop and stacked on phones, with name, email and the unchecked consent box unchanged (the form is owned by the `ruta-opta-46` session);
   - an "unsubscribe anytime" line and the privacy link under the form (the unsubscribe line **needs copy**);
   - spot art at the band's edges, outside the form.

   Reason: 8.1, 8.2, 8.3; growth-opta rules 1, 4 and 5. **New art: no** (a valley crop is enough).
7. **A footer with presence, joined to the band.** Large Opta mark and the initiative line as a mission statement. Three columns: Explore (page anchors), Contact (WhatsApp, email) and Legal (privacy, data policy). The ES/EN switch uses text labels. Then the legal row. The page ends with a full-bleed, text-free horizon strip of the valley. Reason: 9.1, 9.2, 9.3, 9.4. **New art: no** (a crop of the valley).
8. **Who is behind it, text first.** Prose about the foundation and Armenia beside one spot illustration. Legal facts as a quiet definition list, with the data-policy link inline. No figures. Reason: 5.1, 5.2, round 1 decision 3. **New art: optional.**
9. **Allies as an intro line plus two equal cards.** The line is the existing `Prelaunch.allies.text`, which says who allies are; a line on what allies get **needs copy**. The two cards are WhatsApp and email; each has a small spot, one sentence and one button. There is no logo wall. Reason: 6.1, round 2 #11, round 1 decision 4. **New art: optional** (two small spots).

## Open questions for the owner

- **FAQ**: the page has no FAQ today. Add one (7.1/7.2 pattern, native `details`, zero JS)? The questions would need to come from the course audience, not be invented.
- **Art spend**: the round 1 approval is still open. This round adds one map piece and, optionally, a five-symbol territory family, on top of the three method spots.
- **Territory symbols**: one flat symbol per department is the owner's choice, and stereotypes are to be avoided.
- **Dark closing block**: confirm that a section in `theme="dark"` (or a named Opta territory) is approved for the newsletter and footer.
- **Footer ownership**: round 1 left the header and footer to the `ruta-opta-46` session (decisions 1 and 12 of its branding design). Decisions 6 and 7 need that session's agreement, or an explicit hand-over, before anyone builds them.
- **New copy**: Turismo Vivo items (decision 5), the unsubscribe line (decision 6), the newsletter cadence (decision 6) and what allies get (decision 9). Each needs Spanish copy and a complete English namespace (`translate-namespace`).
- **Illustrator credit**: if a local artist makes the art, show a credit caption (1.3)?
- **Image cache**: delete the 30 cached Refero images from the session's `tool-results` folder?

## Rules followed

Links, ids and notes only; no Refero colors, fonts or radii carried into decisions; copy invents no proof (statistics, ratings and testimonials from references rejected); dignity filter applied (no people as beneficiaries, no savior framing); patterns checked against the repo's rules (server components first, `details` over a stateful accordion, labels from messages, JS budget unchanged).
