# Reference ledger: flow pages (2026-11-23)

Brief: `/confirm` (valid token, link-expired and blocked states), `/confirmed`, `/unsubscribed`; visitor goal: finish a double opt-in or leave a list with no friction and know what happens next; business goal: a trustworthy confirmation that sets the right expectation (one email, no surprise), and an exit that respects the person.
Refero calls used: 14 (budget 80). Plan limit: 8,000 per month.

Scope note: Refero indexes product screens, not nonprofit newsletters. Evidence is strong for the structure of verify/confirm/cancel-confirmation pages and thin for expired-link states and for Spanish. Where the evidence is thin the decision says so.

## References kept
Page ids are Refero screen UUIDs; open them at `https://refero.design/pages/<id>`. Flow ids at `https://refero.design/flows/<id>`.

| # | Refero id | Product and page | What it does | Why it works | Take | Avoid | Trama token or component |
|---|---|---|---|---|---|---|---|
| 1 | e527a9b4-304b-4a6a-b55a-6f2b6e238dda | Grok, "Email verified" (flow 5316, step 8) | One small card: heading, one sentence, one full-width button | Nothing to read twice; the single action is the only control | Heading + one sentence + one button, and nothing else in the card | Top-right "Sign out" style secondary controls | `SceneCard narrow`, `Title order={1}`, `Button` |
| 2 | 498474a9-91d5-402f-93bb-06da2d876b93 | Missive, email-verified success | Bold headline over one short paragraph, no button | Success states can be pure text | Success can end with text only when the next step is obvious | Dead end with no route back | `Title`, `t-body` |
| 3 | 7a69e148-0b6a-4abb-9fce-48b5c7527dfb, 0a0c2e59-4c6c-4583-b48b-41459ef5bcbe, 6b145a41-e394-40a8-8dfc-f76141e44335 | Matter, B150, time2book "check your email" | Icon, heading, explanation, resend or back link, spam tip | Names the inbox, offers the one recovery path | The "if it does not arrive" helper line under the main text | Dark full-screen backdrops (Matter) | `Text` with `text-secondary`, one `Link` |
| 4 | 9db19c92-40d7-47b9-8f3c-201ac85f68d4 (flow 6303, step 4) | Missive, expired-link line under the form | Small line "Expired link? Send another email" under the primary button, with an envelope-X icon | The recovery is stated where the person is looking, in one short sentence plus one link | State the problem and the next step in the same breath | Hiding the recovery in a footer; the envelope-X icon (our ring marks only what goes right) | `Button component="a"` to `/#lista` |
| 5 | 2a075bc1-cf51-4821-83d8-72a514a8ac9f | Parallel, "You're on the list!" | Short heading plus one sentence that sets the next step ("will email you with next steps") | Confirms and sets the expectation in two lines | Say what happens next and who will write | Modal over a dimmed page; the novelty photo | `SceneCard`/centred column, `t-display-lg`, `t-body` |
| 6 | 7c373e04-586d-45c4-9456-53aa3a4ab64e | NYT, cancellation confirmation | Serif headline, what stays true (access until a date), "we sent a confirmation email", one quiet "Return to homepage" link | States the consequence and the exit in plain words | Name what stops and what does not; one quiet return link | The black "Tell us about this experience" button (a feedback ask on exit) | `Link` (`action-text-low`), `t-body` |
| 7 | fd4eedf2-fdf4-4735-b09f-a48b577a5d04 (flow 11201, step 7) | Washington Post, "We've canceled your subscription" | Pale success banner, headline, paragraph with the access date and one link to reverse it, small "Return to account" link | The reversal path is present but not pushed | Offer the way back as a sentence, not a retention screen | Banner colour (ours comes from Trama); the full masthead header | `Link`, `Title`, `t-body` |
| 8 | 49773820-501e-479b-b8f3-3815d6dd5940 (flow 11946, step 5) | Fernand, account deleted | Icon, soft headline, short paragraph, support address inline to restore, sign-off; no buttons, no cards | The reversal runs through a mailto, so no extra UI | Final states point to an address in the text instead of a button | Founder sign-off copy that invents a voice | `Text` + `Link mailto:`, no `Button` (matches the `blocked` state) |
| 9 | 5ad21fa3-409f-4b82-9113-d39f1af6cf20 | Klarna, uninstall "Sorry to see you go" | Farewell headline with a reinstall button, then promo sections | Warm tone | Warm one-line farewell | Reinstall hero button and the promo blocks that follow | none; used only as a counter-example |
| 10 | e093d6db-bf5d-4cc8-9e98-79cbcf1b13bb | Saint Laurent, newsletter confirmation panel | Narrow text panel beside a big editorial image, close icon | The image carries the mood and the text stays short | Text stays short when a scene carries the emotion (matches D2/C1) | Luxury styling; a close-only exit | `SceneBand` + `SceneCard` |
| 11 | flow 14211 (Zara Home, newsletter subscription, 4 steps) | Zara Home | Form with consent checkbox, then a one-line thank-you | The confirmation is one short sentence | Plain consent wording before, one-line thanks after | Double email-entry field; QR promo | informs `ConfirmForm` only |

## Rejected (and why)
- 1257 (Open), 11075 (Mercury), 43883c45-0d40-4e1b-a7dc-5bd526978532 (Suno), 4d44d8cb-6c3d-41bd-94aa-362965d6af84 (Gumroad), 914330e2-b011-4f7d-a50d-56bb02aaa523 (Skillshare): retention offers, reason surveys and "Don't cancel" prompts in cancellation flows (dark pattern in unsubscribe). Not applied to `/unsubscribed`.
- a41b5d93-8cc2-4074-abc8-9a3037b2f119 (Epidemic Sound), 86d92ac3-369f-40d6-b0be-16ca54401694 (Dropbox): upsell and promo blocks after a cancellation.
- Visual Electric, Shuttle, DocuSign, Expedia, Meta, The Org code-entry screens: six-digit code UX, not our link-based opt-in; DocuSign's two-column modal over a blurred backdrop is also a modal on top.
- 7d2cd58e-bc5a-4a5a-962c-4e48e1370bb8 (Medium "Confirm now" modal), Pexels, NYT store, Voicenotes, DailyArt popups: modal over a dimmed page; our confirmations are pages.
- Email-preferences pages (1password, Epic, Maze, Zara, New Yorker): category settings; Ruta Opta has one list, so there is nothing to manage.

## Decisions (3 to 7)
1. **Confirm click is the only action on the card** -> one `Button` (full width at 320 px) under `Title order={1}`, the greeting and the lead, inside `SceneCard narrow`; no secondary controls, because refs 1 and 11 show a single-purpose card reads fastest and the form is already a deliberate POST. Task 5.
2. **Failed link on open (expired, invalid, unavailable) states the problem and the next step in two sentences, then one button** -> `Title` + `t-body` + `Button component="a"` «Inscribirme de nuevo» to `/#lista`, no icon, because ref 4 puts the recovery beside the problem and the ring marks only success. Spanish runs about 20 to 30 percent longer than English, so the title must wrap at 320 px; keep it under about 6 words. Task 5.
3. **Final states without a button (`blocked`) route to the privacy address in the sentence** -> `Link mailto:` in `action-text-low`, as in ref 8, because there is nothing to retry. `unavailable` keeps the submit button (retry is real). Task 5.
4. **`/confirmed` sets the expectation in two lines, then exits quietly** -> `Title order={1}` (display-lg), `lead` (what was confirmed), `frequency` (how often; ours already exists), then a default-variant `Button` «Volver al inicio», because refs 5 and 6 pair a confirmation with what happens next and no extras. Add no survey, share ask or upsell (refs 6, 9, 10 rejected patterns). Task 6.
5. **`/unsubscribed` confirms immediately and offers no persuasion** -> `SceneBand short` + `SceneCard narrow`: title, one sentence that says what stopped, and one quiet `Link` «Volver al inicio». No reasons list, no "stay" button, no feedback ask (rejected set). Optionally one sentence saying that signing up again is possible from the home, like ref 7's reversal line. Task 7.
6. **Every page is a page, not a modal, and carries its own heading, one primary path and the shared header/footer** -> matches the approved D2/C1 compositions; refs 5 and 10 are the only modal/panel patterns and are taken for copy only. Tasks 5, 6, 7.

## Open questions for the owner
- None that conflict with decisions 1 to 12 of the design. Refero shows no evidence against D2, C1, header B or the reveal footer for these pages.
- Is a re-subscribe sentence on `/baja` welcome? Design says one quiet `Link` only; the sentence is a copy addition, not a structural change.

## Rules followed
Links and notes only; no Refero images stored in the repo; no Refero colours, fonts or radii used; copy invents no proof.

## Controller rulings (2026-11-23)
- Refero's microcopy proposals were moved out of the repo (the repo is English-only); Santiago approved the existing copy.
- The pages keep the existing `Confirm`, `Confirmed` and `Unsubscribed` strings; the spec adds no new campaign copy to them.
