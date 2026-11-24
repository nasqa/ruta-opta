# Home proposal: audit and redesign (2026-11-24)

Status: PROPOSAL on branch `feat/home-proposal` (base `main` 15ab269, the home of PR #10). Nothing here is merged; merging needs Santiago's explicit OK.

## Why
Santiago, 2026-11-24: the home is correct but not captivating. After the hero the page is flat and simple, Mantine is used only for its basics, there are no illustrations although the style was defined, the footer has no presence, and the composition lacks taste. He asked for a deep audit (landing, SEO, Open Graph) and a proposal he can see on a branch, using Refero, Context7, Exa and ElevenLabs, with art that feels authored, never generic AI.

## Audit of production (www.rutaopta.org/es, 2026-11-24)

### Composition
1. One 1024 px column on one background; every section is a bordered card with the same gap. No full-bleed bands, no change of surface, no rhythm.
2. One illustration (the hero). Territories, method, Turismo Vivo, allies and the form have none, although the paper-relief style is approved.
3. The hero frames its art below the text instead of using it as the stage; the call to action is small.
4. The five territories are bare chips with no content, though they are the page's most ownable search topics.
5. The WhatsApp ally card has no text; both ally cards are mostly empty.
6. The form's inputs are 215 px wide inside a near-full-width card, and the consent link renders in the browser's default blue (bug).
7. The footer is one line under a reveal effect: no logo, navigation, contacts or language.
8. Mantine: only `Button`. The previous build avoided components on purpose (each one adds client JS under a down-only budget, about 30 KB of headroom).

### SEO and Open Graph
Lighthouse on production: SEO 100, accessibility 100, best practices 100. The gaps are the ones Lighthouse does not see:
1. `og:site_name` missing; `og:description` 144 characters (previews cut at about 125); the OG image is art only, with no brand or headline (opengraph.xyz).
2. The bare domain has no page of its own: `rutaopta.org` → 301 → `www.rutaopta.org/` → 307 → `/es`. A scraper that does not follow both hops, or caches the 307, shows no preview; the redirect time also counts in LCP.
3. `og:image` is a hashed `/_next/static/media/...` URL: any art change orphans the preview of links already shared (WhatsApp and Facebook never refresh a cached image URL).
4. On deploy previews, canonical, OG and JSON-LD point to production, so the preview cannot be tested with opengraph.xyz.
5. No `apple-touch-icon`, no web manifest, no `theme-color`; the favicon is a 48 px ICO only (Google recommends larger than 48 px).
6. JSON-LD: `WebSite.url` and `Organization.url` point to `/es` or `/en` instead of the site root (Google uses the root home for the site name); no `alternateName`; no public contact point although info@ and the WhatsApp number are on the page; the foundation is modelled as Ruta Opta's `legalName`.
7. The page is thin for search (about 400 words); the winnable long-tail queries found by research ("emprendimientos rurales Quindío", "talento rural Eje Cafetero", "turismo rural comunitario Chocó") have no content to rank.

Research notes (Exa, 2026-11-24, sources in the PR): FAQPage rich results ended for every site on 2026-05-07, so no FAQ markup; Tourist*/Place markup yields no rich result; WhatsApp needs the og tags in the first 300 KB of HTML and an image under 600 KB, at most 4:1; "Turismo Vivo" collides with other organisations, so it is always paired with "Ruta Opta".

## Approaches considered
1. **Evolve the shipped home on one branch (chosen).** Keep every approved string and the form, recompose the page into full-bleed bands, add authored art per section, use Mantine where it earns its bytes, rebuild the footer in site-shell, fix SEO/OG. One PR, as Santiago prefers.
2. **Ship the SEO/OG fixes alone first, then the redesign.** Faster for the OG bug, but two PRs and two production deploys (15 Netlify credits each) for one review cycle. Rejected; the SEO commits come first in the branch so they can be cherry-picked if Santiago wants them earlier.
3. **Throwaway HTML mockups first.** Lets him compare looks before code, but he asked to see it on a branch; a deploy preview of real code shows the same thing with real performance. Rejected.

## The proposal

### Art direction
- The layered paper relief stays the official style (hero, Turismo Vivo, the footer horizon).
- New: localized, very specific collage-inspired pieces with an authored finish, as Santiago asked: large hand-cut shapes from painted papers, visible fibre and brush streaks, one soft shadow, isolated on paper, one idea per piece. No torn edges, tape, stickers, tilt, halftone or scribbles (rejected earlier as decoration); no artist names in prompts; no people, so no representation risk.
- Where: one piece per method step and one symbol per territory. Each sits next to its own text; none carries text.
- They are AI-generated with prompts written to the principles above; the node and generation ids below let any piece be replaced by a commissioned or hand-made one with no code change (same file name).

### Page, top to bottom
0. Header: in-page section links on desktop, sticky.
1. Hero: split; text on paper (overline, H1, lead, primary and secondary buttons, a no-pressure note), the approved valley with the real sun bleeding to the edge.
2. Manifesto band: "Hay talento en cada territorio", the four verbs from the founder interview, and the stance "Las comunidades no tienen por qué acostumbrarse a que otros decidan por ellas."
3. Territories: five collage symbols with one factual line each (landscape only, no claims about our work there).
4. Method: three editorial rows with a big numeral and a collage piece per step.
5. Turismo Vivo: the one inset panel, paper-relief veranda scene, status tag, three principles taken from OPTA's project document.
6. Allies: who can be an ally, plus WhatsApp and email cards (copy-address button).
7. FAQ: six answers built only from approved facts, including the honest "can I book yet? Not yet".
8. Newsletter: the existing form, wider and with the consent-link bug fixed, plus a one-line promise of what the emails contain.
9. Footer (every page): the paper horizon, then a dark band with the logo, mission, Explore / Contact / Legal columns and the rights line.

### Mantine, deliberately
`Button` (variants), `Badge`, `Accordion` (already themed by Trama, so cheap), `CopyButton` (only if it costs under 2 KB). Layout stays in CSS modules (zero JS). No Carousel, Tabs, Timeline, Marquee or Drawer: on the audience's phones each one is JavaScript for a visual effect that CSS already gives. The per-component cost is measured and reported in the PR.

### SEO and OG fixes
`/` answers 200 with the Spanish home (English browsers still get a 307 to `/en`); x-default points to `/es`; previews use their own URL for canonical/OG; per-language OG cards with the logo and headline on the empty sky, stable versioned URLs, at most 300 KB; `og:site_name`, a brand-free OG title and a ~100-character OG description; icons and manifest; JSON-LD with the root URL, `alternateName`, a contact point and the foundation as `parentOrganization` (plain `Organization`, no unconfirmed NGO status).

## Calls I made (Santiago to check)
1. All new copy (es and en) is a draft for review: territory lines, method lead, Turismo Vivo principles (restated from the approved text), ally list, FAQ, newsletter promise, footer. The stance line paraphrases the founder interview.
2. The collage pieces are AI-generated stand-ins with an authored look; swap them for commissioned or community-made pieces whenever they exist.
3. The OG card has the logo and the headline on the art's empty sky: it is a composed card, not text baked into an illustration.
4. Reopened earlier v1 decisions: header links (v1 had none), icons-free but richer ally cards, the hero art bleeding to the edge.
5. The footer is dark on every page; the horizon art is shared by all pages.

## Art ledger (ElevenLabs)
Flow "Ruta Opta · home proposal art (2026-11-24)", `idacBsR8IeBn8Cv558Mn`. Style reference node `UGMZgtqRPNKOS0yfNcL5` (asset `mc5GbMlvQ0NCPngeLqFE`, the approved A-paper-relief master). Four variations per node; the pick is listed.

| Piece | Model | Node | Picked generation |
|---|---|---|---|
| Method 1, Crecer (coffee seedling) | krea-3, 1K | `nVtPpeMbZFdSyeZo5Epa` | `SgvJs8ko10j1LF44VhRh` |
| Method 2, Crear (half-woven basket) | krea-3, 1K | `p1TZDuUvMSFyaJkVHVjv` | `xTiDfQjzmCT0wOhQ9qex` |
| Method 3, Conectar (hanging footbridge) | krea-3, 1K | `KoVCPW5zoOehSG9P1u6E` | `ecStOZlJrf1K6W0SqRQ1` |
| Quindío (wax palm on coffee rows) | krea-3, 1K | `2huUuV7ixPdR6fYWGCRX` | `if6xJFOfYumSGvOfniFc` |
| Risaralda (guadua and hot spring) | krea-3, 1K | `uMhIwr4OseIuBkIXALNP` | `5MnKet75hKpjPsM28mgc` |
| Caldas (Nevado del Ruiz, frailejones) | krea-3, 1K | `JUGQblgoLMuL3cx15Vjc` | `B4fJkvgTgVHBzq9CVarh` |
| Valle del Cauca (cane, river, Farallones) | krea-3, 1K | `QTXyS3UavOBSuOQPJkJg` | `tNbae1lpHYNASiFYfvfz` |
| Chocó (Pacific, whale tail, canoe) | krea-3, 1K | `HgNOmxoQw3r4VbBXRNjf` | `iXo7Bo9SAfJ22O9eFD2w` |
| Turismo Vivo (veranda table) | gpt-image-2.5-sunburst, 1K, paper relief | `0aeI4yTKqzb2n6ioXAuJ` | `KevR7qaRdzWgFQ3cgGZf` |
| Footer horizon (3:1) | gpt-image-2.5-sunburst, 2K, paper relief | `kwrLF4KyFw87TIaBuh5o` | `YEuu5KiUDa0B0PW9Pi7S` |

Spend: 48 generations, 8,820 credits (about USD 1.60): 4 x 510 (Turismo Vivo), 4 x 427 (horizon), 32 x 151 (collage). Then the eight collage picks went through background removal (`birefnet-v2-bg-removal`, 8 x 30 credits; cutout nodes `MhBiwnuAP1VOkzh7DDUR`, `9N5hskiI0Fh3N9zvgSXP`, `H4zXL0Ic1HZhhl8GaJSS`, `B6tidkRb9f111D6SGxjp`, `WymWXaT3pE3ABo1QsKnr`, `OtAeoJOpLEjOxVEW19cv`, `7VpC6bE8ouy6xO0HCSIH`, `a0EdaRbaVL5XIiS2qSZZ`), and one soft shadow was baked in locally (ImageMagick `-shadow 26x16+0+12` in the ink colour) before the transparent WebP export. To swap a piece, keep its file name in `_art/`.

## References
- Refero round 3 ledger: `docs/references/home-round3.md` (57 calls; 89 across the three rounds).
- Earlier rounds: `docs/references/home.md`.
- Style guide of the first art session: `~/Downloads/opta-illustration-style/STYLE.md` (outside the repo).
