# Reference ledger: privacy policy section on visit measurement (2026-11-25)

Brief: one new section in the existing privacy page, in Spanish and English; visitor goal: understand on a phone what is measured and what is not; business goal: a plain, accurate draft that counsel can review.
Refero calls used: 2 (budget about 80). Plan limit: 8,000 per month. Only search results were read (descriptions); no screen was opened and no image was fetched.

## References kept
| # | Refero id or URL | Product and page | What it does | Why it works | Take | Avoid | Trama token or component |
|---|---|---|---|---|---|---|---|
| 1 | 861b7746-d12e-4f44-af4c-b16b89aa45ef | Skiff, annotated privacy policy | Puts a plain-language explanation next to the legal text | A reader gets the meaning without the legal register | Plain language in the policy itself | Two parallel texts and collapsible panels: more to keep in sync, and hidden content | Existing section heading and paragraph |
| 2 | 4b38e08b-ed01-4631-bde0-ab63bab89844 | Dub, privacy policy | Numbered sections with a section navigation | Each topic has its own anchor | A section of its own for measurement, listed in the table of contents | Numbering the sections | The page's current table of contents |
| 3 | 718d9655-90b2-45e9-a95b-84827cafe1d7 | Dribbble, privacy policy | Tables of the data collected and how it is used | Easy to scan | The order: purpose, then what is recorded, then what is not | Wide tables on a 320 px screen | Paragraphs only |

## Rejected (and why)
- 5ae35ff0-6005-42a2-987a-568c3af37802: promotional banner on a legal page.

## Decisions
1. Measurement gets its own section with its own anchor, not a sentence inside "What we use it for" (references 2 and 3).
2. No new component, accordion or table: the section uses the page's current heading and paragraph, so the privacy routes gain no client JavaScript (references 1 and 3).
3. The paragraph opens with the purpose, then says what is stored on the device (nothing), what is recorded, and what never leaves the site (reference 3).

## Open questions for the owner
- Approval of the Spanish and English copy, and counsel's review.

## Rules followed
Links and notes only; no Refero images stored; no Refero colors, fonts or radii used; copy invents no proof.
