# Home page of rutaopta.org: design

Status: draft for Santiago's approval; Appendix A (copy) is a draft until he approves it. Written 2026-11-24. Target: preview ready 2026-11-25; publishing needs Santiago's explicit OK.

## Intent and why
The home is the first thing the people at the rural-tourism course (about 250 tourism entrepreneurs, rural women, youth, Indigenous and Afro-descendant participants, on mid and low-end phones, WhatsApp-first) and, later, allies and funders will see. It must say plainly what Ruta Opta is and how it works, give them one easy way to stay in touch, and be built to be found by search. The name is "oportunidad + talento": people already have talent; opportunities do not reach everyone. The founder's stance: listen, recognize, connect and build with people; communities must not get used to others deciding for them.

## Goals
- A bilingual (ES first, EN together) home that works well on a weak phone connection.
- One clear action: leave name and email (the existing double opt-in form). The label and destination live in the message files so the growth strategy can change them.
- The method named as OPTA names it: Crecer, Crear, Conectar.
- A real SEO base (metadata per language, social cards, structured data, one H1, a sensible H2 outline) so the brand queries rank quickly and later content can build on it.
- The shipped state is honest: nothing that does not exist is promised or shown.

## Non-goals (not tomorrow)
- The actor selector "¿Qué te describe?" and extra form fields (blocked by an unproven Zoho capability and the privacy-policy change; v1.1).
- New territory scenes, the collage pieces (unless approved and ready), 2K hero upscale, analytics tool, a Turismo Vivo page, one page per territory, WhatsApp channel.
- Header, footer, layout, English of the other pages, robots.ts, sitemap.ts, the privacy page, the form module: all owned by `ruta-opta-46`.

## Anti-goals (a failure even if it works)
Savior or disaster framing; invented numbers, testimonials, partners or counters; pressure devices (urgency, scarcity); a Trama violation (pills, hex literals, territory colour on interactive parts); naming the course organizer or implying an agreement with it; photos of people or children; text baked into images.

## Constraints
- Trama (`@nasqa/trama-react`, Opta theme only; no new tokens or territories), Comfortaa and Inter via the theme. Controls are soft rectangles; cards raised with a hairline border; page inset 24, section 64, group 24.
- Repo rules (`AGENTS.md`): visible text only from `messages/*.json` (Spanish is the source of types); an English namespace is complete or absent; `Link` from `@/i18n/navigation`; Server Components; a file is born next to its route; no hex literals; the Lighthouse JS budget never goes up.
- Hard rules of the `growth-opta` skill (no pressure, minimal data, consent, never echo typed data).
- The five territories are exactly the five the course covers and the Opta theme has: Quindío, Risaralda, Caldas, Valle del Cauca, Chocó. Territory colours only through `<Scope>` on sections, never on controls.
- Dependency: header, footer, `(site)/layout.tsx` and the English of `Prelaunch` come from `ruta-opta-46`'s branch `feat/brand-flow-and-english`. Santiago decided one PR there; this work is stacked on it.

## Approaches considered
1. **Stack on the other session's complete branch (chosen).** Build the home sections now as isolated components and message keys on a branch from main, then rebase onto their SHA and wire them into `page.tsx`. Cost: the go-live waits for their whole PR to merge. Benefit: one header, one footer, one i18n catalogue, no throwaway code.
2. **Build on main with a temporary header and footer.** Faster to publish alone, but it duplicates the shared shell, collides in `page.tsx` and `en.json`, and ships a header Santiago did not choose. Rejected.
3. **Wait and build everything after their merge.** Safest for conflicts, loses the day. Rejected.

## Design

### Page structure (one idea per section, each answers one visitor question)
| # | Section | Question it answers | Content |
|---|---|---|---|
| 0 | Header (other session) | Where am I? | logo, "Ruta Opta", ES · EN |
| 1 | Hero | What is this? | H1, one sentence, one button to the form, paper-relief valley with the real logo as the sun |
| 2 | Thesis | Why does it exist? | talent exists in every territory; decisions stay with the community; the five territories as a plain list |
| 3 | Cómo trabajamos | How does it work? | Crecer, Crear, Conectar as three numbered steps (text only; art slots reserved) |
| 4 | Turismo Vivo | What are you building? | one block, stated as under construction |
| 5 | Quién está detrás | Who answers? | the entity and city, link to the data policy |
| 6 | Aliados | How do I join in? | one sentence, one `mailto:` button |
| 7 | Suscripción | How do I stay in touch? | the existing form, unchanged |
| 8 | Footer (other session) | | |

Components live in `(site)/_components/home/` (hero, thesis, steps, tourism, who, allies); `page.tsx` only composes. The hero no longer uses `Scope territory="quindio"`. Territory colour is not used in v1 (plain list), to respect "Scope on sections only".

### Copy
Source of truth: this document's Appendix A, once Santiago approves it, then moved into `messages/es.json` and `en.json` under `Prelaunch`. Spanish is written first, English alongside. Every string passes a plain-Spanish and anti-AI-tells read. No claim without a source: method wording comes from OPTA's project document; the founder's verbs from the interview; "Turismo Vivo" is stated as under construction.

### Hero art
`A2-base-2-mirrored.png` (empty sky, 1K) as the background, exported to AVIF and WebP in 640, 960 and 1280 widths through `next/image`, `priority`. The sun is the real `opta-icon.svg` as a separate layer (centre x 80 %, y 20 %, width 11.5 % of the frame), its soft shadow inside the SVG (Stylelint forbids `drop-shadow`). The sun asset is the one `ruta-opta-46` already builds for `SceneBand`; reuse it, do not redraw. Layout follows the measured prototype: the art keeps 16:9 at the bottom with extra paper-coloured sky above, the headline in two lines (max 54 % width), below 760 px the text stacks above the art, text at least 17/16/14 px, contrast at least 7:1 on step-12 text measured on real pixels. The art is decorative (`alt=""`). The 2K upscale of the empty base is a later swap with no code change.

### SEO (this document's scope; sitemap and robots belong to the other PR)
- **Titles and descriptions, per language,** set with `generateMetadata` and `title.absolute` for the home. ES title: "Ruta Opta · Talento y turismo comunitario en Colombia" (52 chars). EN title: "Ruta Opta · Talent and community tourism in Colombia" (52). Descriptions up to 155 characters naming the five territories and the method ("Crecer, crear y conectar"); final counts by the builder. "Ruta Opta" is always written as a unit, never "Opta" alone: a SERP check found "Opta" dominated by the sports-data company and "Ruta Opta" unowned. Realistic early targets are the brand query and its long-tails; head terms (turismo rural sostenible, turismo comunitario Colombia) are held by government and news sites and need content and links over months, so they are out of scope here.
- **Canonical and hreflang:** `metadataBase` already exists in `[locale]/layout.tsx` (do not duplicate it). Keep `alternates('/')` (es, en, x-default) and add a self-referencing `canonical` per locale inside the same `alternates` object so `languages` is not lost. No page has a canonical today. `robots` is served by `/robots.txt`, not per page. The sitemap (other PR) lists `/` with es, en and x-default and `/privacy` the same way.
- **Open Graph and Twitter:** `og:title`, `og:description`, `og:image` (1200 x 630, built from the hero art and the real logo, no text), `og:locale`, `og:locale:alternate`, `twitter:card=summary_large_image`, per language.
- **Structured data (JSON-LD, server-rendered, on `/es` and `/en`):** `Organization` (not the `NGO` subtype, which would imply a status we have not confirmed) with one `@id`, `name` "Ruta Opta", `legalName` and `address` read from the same message strings the privacy policy uses (so they can never disagree), `url`, `logo`, `description`, `areaServed` (the five departments) and `knowsLanguage`; plus a `WebSite` with `name`, `url` and `inLanguage`. Nothing else: no `sameAs`, rating, review, phone, email, `taxID`, `foundingDate`, partner list or `SearchAction` until they exist and are confirmed.
- **hreflang only for URLs that return 200.** `alternateLinks` is already off in `routing.ts`; `alternates('/')` is the single source. An e2e test asserts that every hreflang URL answers 200 before it ships (today `/en` is 404, which Google would treat as a broken alternate).
- **Host and redirects:** `https://www.rutaopta.org` is canonical (apex already 301s to it; `siteUrl` comes from Netlify's `URL`). The root `/` answers 307 to `/es`; Google keeps the source URL on a temporary redirect, so a permanent or direct-serve root is a post-launch item to settle with `ruta-opta-46`, together with `localeDetection: true`, which Google advises against for automatic language redirects.
- **After launch (90 days, highest leverage first):** a Turismo Vivo pillar page (an ownable term, written with real content only); a Quindío page, then one page per territory only when its content is unique; legitimate institutional listings once eligibility is checked (the colombia.travel community-tourism map, the national community-tourism programmes); a real English page set with an About page once the legal name is settled; local press with consent. Do not buy links, machine-translate pages, ship untranslated English, or mark up ratings. `llms.txt` is skipped for now.
- **On-page:** exactly one H1; the H2 outline is the section table; the five territory names and the three method words appear naturally in text; descriptive link text; images either decorative or with a real `alt`.
- **Performance as a ranking signal:** LCP <= 2.5 s, INP <= 200 ms, CLS <= 0.1, tested on a Slow 4G, mid-range-phone profile, not only Lighthouse defaults. The Lighthouse JS budget does not go up.
- **Owner steps outside the code:** create a Domain property in Google Search Console verified with one DNS TXT record in Cloudflare, import it into Bing Webmaster Tools, and submit the sitemap once the other PR publishes it.
- Recommendations from the SERP research agent are folded in before building; the document is updated if they change anything above.

### Form and consent
The existing waitlist form, unchanged: name, email, consent, double opt-in through the other session's module. The hero button and the allies section point to it or to `mailto:`; both targets come from messages. Nothing in this PR reads, echoes or stores what a person typed.

### Allies
One `mailto:` button to the project's `info@` address with a prefilled subject, text from messages. Assumption to confirm: `info@rutaopta.org` is monitored by the founder.

### Accessibility, quality gates and tests
WCAG 2.2 AA with zero serious axe violations in both locales; keyboard order and focus ring (>= 2 px, >= 3:1); `prefers-reduced-motion` respected; contrast measured on the real pixels under text. E2E in ES and EN (home renders, hero button lands on the form, hreflang and canonical present, JSON-LD parses, no console errors). Lighthouse budget unchanged. A Netlify deploy preview for Santiago.

### Measurement (not a blocker)
A neutral tracked link (`?o=<tag>`) for the first cohort; an analytics tool without cookies is still to be chosen by Santiago. Nothing personal goes to analytics. If chosen tonight, it is one script tag plus a CSP entry.

## Calls I made (Santiago to check)
1. The H1 stays the existing one: "El talento de las comunidades puede transformar sus territorios."
2. Turismo Vivo is in, as "under construction"; OPTA por la Infancia is out of v1.
3. "Quién está detrás" names only the entity and the city. NIT, address and legal representative stay in the data policy. It does not say "sin ánimo de lucro".
4. The allies button is a `mailto:` to `info@` for tomorrow.
5. No territory colour in v1.
6. English is written together with Spanish and marked for review; where `feat/brand-flow-and-english` already has an English string (the H1 and lead), that one wins.
7. Legal name and address for the visible text and JSON-LD get their own keys in `Prelaunch`, because the privacy policy holds them as one prose string. A unit test asserts that the legal name in `Prelaunch` appears in `Privacy.sections.controller.text` in both languages, so the two cannot drift. JSON-LD carries locality, region and country only, not the street.
8. The hero image is rendered with `getImageProps()` and a plain `<img>` in a Server Component, as the other session's stack brief prescribes (no client `Image`, no JS added to the budget). Lint allows `<img>` only under `modules/site-shell/**`. First try `SceneBand` (it already does `getImageProps` + `<img>` with `loading="eager"` and `fetchPriority="high"`, the real sun layer, and the brand rise): add a `height: 'hero'` variant with `aspect-ratio` 16/9 in its CSS module, in this PR after the other session's merge. A separate `HeroScene` inside site-shell (reusing `assets/sun.svg`, never copying it) only if the text-above-art layout does not fit. The sun is cropped at the `short` and `strip` heights on desktop, not at 16:9. Text placed over the art, rather than above it, needs a scrim (`apps/landing/AGENTS.md`). No ESLint exception is added.
9. `siteUrl` stays Netlify's `URL`. Previews therefore point canonical, `og:image` and JSON-LD at the production host; social cards and structured data are checked on a local build with `URL` set, and again after publishing.
10. The PR is stacked: base is `feat/brand-flow-and-english`, current shell commit `a0587fe`. `robots.ts` and `sitemap.ts` arrive in that branch later. Go-live needs that whole PR merged first, then this one; if it is not ready on 2026-11-25 Santiago decides between waiting and publishing something smaller.

## Dependencies
`ruta-opta-46`'s branch has no upstream and no PR yet; they push at their last task. A Netlify deploy preview exists for a PR only once it is open and only if previews are enabled for a non-`main` base (not confirmed). Fallback for Santiago's review: a local `next start` build with screenshots at 375, 768 and 1440 px.

## Left to the builder
Exact component props and CSS, how the sun layer is shared with the other module, the `ImageResponse` for the social card, image export settings, copy length trimming, e2e selectors.

## Appendix A: draft copy (Spanish, then English)
**Hero.** H1: "El talento de las comunidades puede transformar sus territorios." Lead: "Ruta Opta conecta el talento de las personas con oportunidades en Quindío, Risaralda, Caldas, Valle del Cauca y Chocó. Escuchamos, reconocemos, conectamos y construimos con ellas." Button: "Quiero que me avisen".
EN: use the English already committed on `feat/brand-flow-and-english` for the H1 and lead ("The talent in communities can transform their territories."), so the site has one English; the lines below are mine only where that branch has no equivalent. (Draft: "Community talent can transform its territories." / "Ruta Opta connects people's talent with opportunities in Quindío, Risaralda, Caldas, Valle del Cauca and Chocó. We listen, recognize, connect and build with them." / "Let me know".)

**Thesis.** H2: "Hay talento en cada territorio". "Las comunidades ya saben cocinar, cultivar, guiar, crear y organizarse. Lo que muchas veces falta es que las oportunidades lleguen hasta ellas. Ruta Opta existe para acercarlas, y para que las decisiones sigan en manos de quienes viven en el territorio." List: Quindío · Risaralda · Caldas · Valle del Cauca · Chocó.
EN: "There is talent in every territory" / "Communities already know how to cook, farm, guide, create and organize. What is often missing is opportunities reaching them. Ruta Opta exists to bring the two closer, and so that decisions stay with the people who live there."

**Cómo trabajamos.** H2: "Crecer, crear y conectar: una ruta en tres pasos". (EN: "Grow, create, connect: a path in three steps".)
1. Crecer: "Reconocer quién soy, qué siento y qué puedo aportar." "Fortalecemos a las personas: bienestar, confianza y reconocimiento de lo que ya saben hacer."
2. Crear: "Convertir saberes y talentos en propuestas." "Acompañamos para que eso que sabes hacer tenga costos, precio y una buena presentación."
3. Conectar: "Presentar las propuestas a quienes pueden comprarlas y apoyarlas." "Abrimos contacto con visitantes, aliados y mercados."
EN: Grow: "Recognize who I am, what I feel and what I can contribute." / Create: "Turn knowledge and talents into proposals." / Connect: "Present proposals to the people who can buy and support them." (supporting lines translated from the Spanish.)

**Turismo Vivo** (sources in OPTA's project document: "las experiencias se diseñarán con la comunidad… La comunidad podrá aceptar, modificar o rechazar cualquier actividad", §13 area; "La comunidad conocerá el precio final y la distribución de ingresos antes de vender", §14.3). H2: "Turismo Vivo: experiencias rurales diseñadas por quienes las habitan". (EN: "Turismo Vivo: rural experiences designed by the people who live there".) "Experiencias de turismo diseñadas por quienes habitan el territorio: una comida, un recorrido, un oficio. Cada familia decide qué comparte y cómo, y el precio y el reparto se conocen antes de vender. Lo estamos construyendo junto a las comunidades."
EN: "Living Tourism" is not used; keep the name "Turismo Vivo". "Tourism experiences designed by the people who live in the territory: a meal, a walk, a craft. Each family decides what to share and how, and the price and how it is shared are known before anything is sold. We are building it together with the communities."

**Quién está detrás.** H2: "Quién está detrás". "Ruta Opta es una iniciativa de la Fundación Embajadores de la Paz, con sede en Armenia, Quindío." Link: "Política de tratamiento de datos".
EN: "Who is behind it" / "Ruta Opta is an initiative of Fundación Embajadores de la Paz, based in Armenia, Quindío." / "Data processing policy".

**Aliados.** H2: "Construyamos juntos: alianzas para abrir oportunidades". (EN: "Let's build together: partnerships that open opportunities".) "Ruta Opta se construye con empresas, agencias, alojamientos, instituciones y personas que quieran compartir su experiencia. Cuéntanos cómo te gustaría participar." Button: "Quiero ser aliado".
EN: "Let's build together" / "Ruta Opta is built with businesses, agencies, lodgings, institutions and people who want to share their experience. Tell us how you would like to take part." / "I want to be an ally".

**Suscripción** keeps the current keys ("Déjanos tu correo", "Déjanos tu nombre y tu correo y te avisamos cuando abramos.").
