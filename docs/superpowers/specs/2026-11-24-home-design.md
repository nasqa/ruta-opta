# Home page of rutaopta.org: design

Status: draft for Santiago's approval. Written 2026-11-24. Target: preview ready 2026-11-25; publishing needs Santiago's explicit OK.

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
Source of truth: this document's Appendix A, approved by Santiago, then moved into `messages/es.json` and `en.json` under `Prelaunch`. Spanish is written first, English alongside. Every string passes a plain-Spanish and anti-AI-tells read. No claim without a source: method wording comes from OPTA's project document; the founder's verbs from the interview; "Turismo Vivo" is stated as under construction.

### Hero art
`A2-base-2-mirrored.png` (empty sky, 1K) as the background, exported to AVIF and WebP in 640, 960 and 1280 widths through `next/image`, `priority`. The sun is the real `opta-icon.svg` as a separate layer (centre x 80 %, y 20 %, width 11.5 % of the frame), its soft shadow inside the SVG (Stylelint forbids `drop-shadow`). The sun asset is the one `ruta-opta-46` already builds for `SceneBand`; reuse it, do not redraw. Layout follows the measured prototype: the art keeps 16:9 at the bottom with extra paper-coloured sky above, the headline in two lines (max 54 % width), below 760 px the text stacks above the art, text at least 17/16/14 px, contrast at least 7:1 on step-12 text measured on real pixels. The art is decorative (`alt=""`). The 2K upscale of the empty base is a later swap with no code change.

### SEO (this document's scope; sitemap and robots belong to the other PR)
- **Titles and descriptions, per language,** set with `generateMetadata` and `title.absolute` for the home. ES title: "Ruta Opta · Talento y oportunidades para los territorios" (56 chars). EN title: "Ruta Opta · Talent and opportunity for rural territories" (56). Descriptions up to 155 characters naming the five territories and the sign-up; final counts by the builder. Brand queries ("Ruta Opta", the foundation's name) are the realistic early target; generic queries (turismo rural sostenible and similar) need content and links over months and are out of scope.
- **Canonical and hreflang:** `metadataBase` already exists in `[locale]/layout.tsx` (do not duplicate it). Keep `alternates('/')` (es, en, x-default) and add a self-referencing `canonical` per locale inside the same `alternates` object so `languages` is not lost. No page has a canonical today. `robots` is served by `/robots.txt`, not per page. The sitemap (other PR) lists `/` with es, en and x-default and `/privacy` the same way.
- **Open Graph and Twitter:** `og:title`, `og:description`, `og:image` (1200 x 630, built from the hero art and the real logo, no text), `og:locale`, `og:locale:alternate`, `twitter:card=summary_large_image`, per language.
- **Structured data (JSON-LD, server-rendered):** `Organization` with `name` "Ruta Opta", `legalName` "Fundación Embajadores de la Paz", `url`, `logo`, `address` (locality Armenia, region Quindío, country CO), and a `WebSite` with `inLanguage`. Nothing else: no `sameAs`, rating, review, phone or email until they exist and are confirmed; no claim of non-profit status.
- **On-page:** exactly one H1; the H2 outline is the section table; the five territory names and the three method words appear naturally in text; descriptive link text; images either decorative or with a real `alt`.
- **Performance as a ranking signal:** LCP <= 2.5 s, INP <= 200 ms, CLS <= 0.1, tested on a Slow 4G, mid-range-phone profile, not only Lighthouse defaults. The Lighthouse JS budget does not go up.
- **Owner steps outside the code:** verify the domain in Google Search Console and Bing Webmaster Tools (a DNS record in Cloudflare) and submit the sitemap once the other PR publishes it. A 90-day content plan (Turismo Vivo page, territory pages, legitimate institutional links) follows the launch.
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
6. English is written together with Spanish and marked for review.

## Left to the builder
Exact component props and CSS, how the sun layer is shared with the other module, the `ImageResponse` for the social card, image export settings, copy length trimming, e2e selectors.

## Appendix A: draft copy (Spanish, then English)
**Hero.** H1: "El talento de las comunidades puede transformar sus territorios." Lead: "Ruta Opta conecta el talento de las personas con oportunidades en Quindío, Risaralda, Caldas, Valle del Cauca y Chocó. Escuchamos, reconocemos, conectamos y construimos con ellas." Button: "Quiero que me avisen".
EN: "Community talent can transform its territories." / "Ruta Opta connects people's talent with opportunities in Quindío, Risaralda, Caldas, Valle del Cauca and Chocó. We listen, recognize, connect and build with them." / "Let me know".

**Thesis.** H2: "Hay talento en cada territorio". "Las comunidades ya saben cocinar, cultivar, guiar, crear y organizarse. Lo que muchas veces falta es que las oportunidades lleguen hasta ellas. Ruta Opta existe para acercarlas, y para que las decisiones sigan en manos de quienes viven en el territorio." List: Quindío · Risaralda · Caldas · Valle del Cauca · Chocó.
EN: "There is talent in every territory" / "Communities already know how to cook, farm, guide, create and organize. What is often missing is opportunities reaching them. Ruta Opta exists to bring the two closer, and so that decisions stay with the people who live there."

**Cómo trabajamos.** H2: "Una ruta en tres pasos".
1. Crecer: "Reconocer quién soy, qué siento y qué puedo aportar." "Fortalecemos a las personas: bienestar, confianza y reconocimiento de lo que ya saben hacer."
2. Crear: "Convertir saberes y talentos en propuestas." "Acompañamos para que eso que sabes hacer tenga costos, precio y una buena presentación."
3. Conectar: "Presentar las propuestas a quienes pueden comprarlas y apoyarlas." "Abrimos contacto con visitantes, aliados y mercados."
EN: Grow: "Recognize who I am, what I feel and what I can contribute." / Create: "Turn knowledge and talents into proposals." / Connect: "Present proposals to the people who can buy and support them." (supporting lines translated from the Spanish.)

**Turismo Vivo.** H2: "Turismo Vivo". "Experiencias de turismo diseñadas por quienes habitan el territorio: una comida, un recorrido, un oficio. Cada familia decide qué comparte y cómo, y el precio y el reparto se conocen antes de vender. Lo estamos construyendo junto a las comunidades."
EN: "Living Tourism" is not used; keep the name "Turismo Vivo". "Tourism experiences designed by the people who live in the territory: a meal, a walk, a craft. Each family decides what to share and how, and the price and how it is shared are known before anything is sold. We are building it together with the communities."

**Quién está detrás.** H2: "Quién está detrás". "Ruta Opta es una iniciativa de la Fundación Embajadores de la Paz, con sede en Armenia, Quindío." Link: "Política de tratamiento de datos".
EN: "Who is behind it" / "Ruta Opta is an initiative of Fundación Embajadores de la Paz, based in Armenia, Quindío." / "Data processing policy".

**Aliados.** H2: "Construyamos juntos". "Ruta Opta se construye con empresas, agencias, alojamientos, instituciones y personas que quieran compartir su experiencia. Cuéntanos cómo te gustaría participar." Button: "Quiero ser aliado".
EN: "Let's build together" / "Ruta Opta is built with businesses, agencies, lodgings, institutions and people who want to share their experience. Tell us how you would like to take part." / "I want to be an ally".

**Suscripción** keeps the current keys ("Déjanos tu correo", "Déjanos tu nombre y tu correo y te avisamos cuando abramos.").
