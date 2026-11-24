# Reference ledger: confirmation email (2026-11-23)

Brief: the double opt-in email (E1 fluid hybrid, decided), sent after someone types an address on the landing; visitor goal: understand in two seconds who is asking, tap one button, and be able to ignore the message safely if it was not them; business goal: a confirmation that gets completed without spam-folder or phishing suspicion.
Refero calls used: 6 (budget 80). Plan limit: 8,000 per month.

Scope note, read first: Refero indexes product screens, not email bodies. A search for the email itself returns the web or iOS screens that tell the person to expect it ("Check your email", "Verify your email"). Those are evidence for the wording and the button pattern the email must match, not for email layout. Email structure is already decided by the design (section 3) and by the email-client constraints in it. The decisions below are therefore few and limited to copy order, the single action and the failure helpers. I stopped at 6 calls because more searches kept returning the same verification screens.

## References kept
Page ids are Refero screen UUIDs; web at `https://refero.design/pages/<id>`, iOS at `https://refero.design/screens/<id>`.

| # | Refero id | Product and page | What it does | Why it works | Take | Avoid | Trama token or component |
|---|---|---|---|---|---|---|---|
| 1 | 7d2cd58e-bc5a-4a5a-962c-4e48e1370bb8 (flow 11115, step 2) | Medium, "Confirm now" for a newsletter | Heading names the newsletter, one short paragraph, one verb-first button | The ask and the action are the same words | A button that names the act, not "Click here" | The modal over a dimmed page; the pill button (ours is a 7 px radius, `action-solid`) | email `h1`, bulletproof `<a>`, `action.solid` and `action.on-solid` from `tokens.resolved.json` |
| 2 | 4c5a1086-a92c-4990-b64f-738596dfb2c1 | Figma, "Check your inbox" (iOS web view) | Heading, one sentence to "click the link" to finish, one button, two small help lines: "didn't get it?" and "wrong address?" | Each failure has its own one-line exit | Name the failure paths in one short line each | Echoing the address in bold | footer lines in `text.secondary` |
| 3 | 11510a23-ab35-4a5a-8955-791136c921b8 | Miro, "Check your email" (iOS) | Tells the person what to do if nothing arrives "within 10 minutes" | Sets an honest wait | The idea of stating a wait, only if the service has one | The number itself unless the product states it | none |
| 4 | 27ce8e72-e13a-4995-8753-a7177213b342 | Mailchimp, sign-up success | Card with heading, one sentence "we sent a link to activate", provider links, "didn't get it?" with a retry link; a language selector in the top corner | The same two-failure helpers, plus a visible language control | Short helpers, language reachable | Serif heading and card colours (ours come from Trama) | none |
| 5 | 54cdd72a-fe47-4220-b84c-a065e47e1e2b, 9e700218-1bc7-47c9-8db8-eded8e0341b7, 9cbdda06-a9ca-40b4-b972-31a68dd5fb04 | OpenAI, Zendesk, Intercom verification pages | Logo, heading, two lines of text, one prominent action, a small secondary link | A message with one primary action and nothing else | Heading, two lines, button, small link | "Open Gmail/Outlook" provider buttons in an email (nothing to open from inside the inbox) | email body order |
| 6 | 499a57d0-f675-4aac-ad0e-e6faaf4a84c4 | Gmail (iOS), message list/body | A verification email as the reader sees it: the subject states the action | The subject carries the sender and the action | Subject = action plus sender name | Showing a code in the subject | the email `<title>`/subject string |
| 7 | 6839b412-7ed0-4a67-ac7e-95f7f5d574f3, 25372bf3-67e9-4047-ab9a-b0f7a2b07424 | Cal, Navan "check your email" | Names inbox and spam in one sentence; one resend control | The spam hint is one clause, not a block | One clause for spam/promotions | Resend buttons (a resend is a new sign-up here) | none |

## Rejected (and why)
- 078e8086-1216-437c-9a7a-c8fd0973faee, a52899f3-72f9-4135-96b6-81020bea43f0, 438f8064-a894-463b-9119-244b92d76809, ed30556a-6dfb-47b4-a8d0-655cdedc6886, bb339371-c299-47dd-a1e3-8c081ead9dd6 (Visual Electric, Shuttle, Perplexity, Cycle, Digg): six-digit code entry; ours is a link, so no code UI or code in the subject.
- 4c7fcafb-c5db-4293-8273-900c2e05dcd4 (Lemon Squeezy): testimonial panels next to the verification step; no proof or testimonials exist and none may be invented.
- 79293057-0ce0-4ee9-8a73-4c4a187ed56c (Duolingo): a blocking modal with a mascot and a "NO THANKS" link for promotional email.
- cdebc899-41e7-4401-ba55-0386a625bee8, 1b35f3ab-5e1b-4205-a231-9b78cee81c75 (Spoil me): resend countdown and a QR magic-link alternative; extra machinery for a single link.
- Pages that put the address in bold (Figma, Miro, Mailchimp, Cal): the email contract forbids any user-typed value in the body, and the person already sees their own address as the recipient. Kept the invariant.

## Decisions (3 to 7)
1. **One verb-first button is the only primary action, and the body is at most two short paragraphs above it** -> the bulletproof `<a>` with `action.solid`/`action.on-solid`, full width under 480 px, because refs 1 and 5 pair a heading and two lines with one action and nothing else, and the button must be visible without scrolling on a 320 px phone. Keep the Spanish label near 20 characters so it does not wrap at 320 px («Confirmar suscripción» is 21). Task 8.
2. **Name the failure paths in the email, one line each: "it was not me" and "the button does not work"** -> the fallback line with the bare URL (decided) and one new line saying that if the person did not ask for this, they can ignore the email and nothing is subscribed (refs 2 and 4 use two one-line helpers). Text in `text.secondary` below the hairline, not in the button area. New copy, proposed below. Task 8.
3. **State link validity only with the service's real term, never an invented one** -> one sentence, written as `[PENDIENTE: vigencia del enlace]` until Task 8 reads the actual expiry from the waitlist module (ref 3 states a wait, but we must not copy its number). The `/confirm` expired state already exists, so the sentence and the page must agree. Task 8, then Task 5 for consistency.
4. **The subject states the action and the sender, and the preheader repeats the reason in one short clause** -> `subject` string from the `Waitlist` email messages («Confirma tu suscripción a Ruta Opta» style), preheader from the existing hidden block (ref 6). No code, no emoji, no urgency. Both strings are new copy, so they carry the pending tag. Task 8.
5. **Keep the footer reason line, the organisation line and the privacy link exactly as designed** -> it already covers the "why am I receiving this" role that refs 2 and 4 handle with helper links; do not add a language selector or a resend control to the email (a resend would be a second sign-up). Task 8.

## Open questions for the owner
- How long is the confirmation link valid? The email should say it only if the service enforces it; this needs a look at the waitlist code in Task 8.
- Should the home page's own "check your email" message (the screen that precedes this email) get provider quick-open buttons (Open Gmail / Open Outlook, as refs 5 and 4 show)? That is a landing change outside this PR; recorded for a later pass.
- No conflict with E1 or the fluid layout: the Refero verification cards are centred single-column cards on a pale surface, which agrees with the fluid centred 600 px email.

## Rules followed
Links and notes only; no Refero images stored in the repo; no Refero colours, fonts or radii used; copy invents no proof.

## Controller rulings (2026-11-23)
- Refero's microcopy proposals were moved out of the repo (the repo is English-only); Santiago approved the existing copy.
- The email keeps Santiago's approved `ConfirmEmail` strings (subject «Confirma tu inscripción a OPTA», action «Confirmar mi inscripción»). The spec allows new strings only for the layout (`EmailLayout`).
- Decisions 2 and 3 are already met by the existing copy: `ConfirmEmail.p3` is the "it was not me" line and `ConfirmEmail.p2` states the real validity, 7 days. No new line.
