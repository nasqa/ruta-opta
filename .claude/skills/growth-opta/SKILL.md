---
name: growth-opta
description: Use when designing or reviewing anything that captures, converts or follows up people for Ruta Opta: the home's CTA and sign-up form, consent and privacy wording, the double opt-in and welcome emails, analytics and tracked links, ally outreach, or the growth brief. Rules here override every copied reference. Not legal advice.
---

# Growth for Ruta Opta

Trama and the project rules stay the authority for design. This skill is the authority for how we ask people for things. The files under `references/` are copied third-party material (MIT, pinned commits, see `references/SOURCES.md`). They are useful and they are wrong for us in places; when they disagree with this file, this file wins.

## Who we are talking to
The first visitors are attendees of a rural-tourism course (about 250 people: tourism entrepreneurs, rural women, youth, Indigenous and Afro-descendant participants) on mid and low-end phones, with weak signal, and WhatsApp as their usual channel. Spanish first. Later: allies (businesses, agencies, lodgings, institutions). Do not name the course organizer or imply an agreement with it.

## Hard rules (no exceptions)
1. **No pressure.** No countdowns, scarcity, fake deadlines, "last chance", loss framing, guilt, or fake social proof. Reject any reference pattern that does this (the sample re-engagement flow in some SaaS skills ends with "last chance").
2. **Dignity first.** Never savior or disaster framing, never "we deliver aid". People are talented; opportunities are what is missing. No photos or stories of people without their separate, written authorization. No children.
3. **Do not invent proof.** No numbers, testimonials, partners or counters that are not real and dated. Goals are shown as goals.
4. **Ask for the minimum.** Every field must earn its place (see `references/rampstack/form-strategy.md`, "Field strategy"). Do not collect ethnic origin, health, or any other sensitive data. Free text only where unavoidable, with a length cap. Adults only.
5. **Consent is specific and recorded.** Unchecked box, plain wording, one purpose per box, the policy linked, double opt-in (already built). Record date, form, language and policy version. The signup data travels sealed in the confirmation token, so every added field lengthens the email link: keep a length budget and test the link in mail clients.
6. **Never echo what the person typed.** The confirmation email and the confirm page greet by name only. The organization and collaboration answers never appear in emails, pages or logs.
7. **One-click unsubscribe, honored at once**, with a List-Unsubscribe header on every bulk email. Never re-add someone who left.
8. **No cookie banner, no personal data in analytics.** The only third-party measurement allowed is Plausible: cookieless, nothing stored on the device, served first-party through our own proxy, and never sent anything we collect (names, emails, tokens, form values). It processes the visitor's IP address and user agent to count a day's visitors and stores neither. Measure with counts and UTM-tagged links. No other trackers.

## Ley 1581 de 2012 (habeas data): to confirm with counsel
Treat everything below as working assumptions, not conclusions.
- Minimize data, state the purpose, collect authorization before processing, keep the right to know, update, correct, delete and withdraw. The privacy policy must list every field and its purpose, and its version is bumped when fields change.
- Probably sensitive (so: do not ask): ethnic origin, health, children's data. Confirm the exact wording of Art. 5 and Art. 7 and the authorization requirements against the official text and the SIC (Superintendencia de Industria y Comercio) guidance before relying on this.
- `references/resend/compliance.md` covers US, EU, Canada and Brazil only. It says nothing about Colombia. Do not use it as a Colombian compliance checklist.

## Small numbers
With about 250 visitors, an A/B test measures noise. Do not run split tests. Count the funnel (scans or visits, reach the form, submit, confirm, by actor type), label every conclusion High, Medium or Low confidence, and need at least 5 independent data points per segment before drawing a conclusion about it. Learn qualitatively: watch 3 to 5 real people use the page on their phone, then ask what they expected. Do not invent personas; write hypotheses as hypotheses. Pointers (not copied): `rampstackco/claude-skills` `experiment-design` ("When to call qualitative") and `coreyhaines31/marketingskills` `customer-research` (minimum sample and confidence guardrails).

## Email and follow-up
- Sender "Ruta OPTA", plain Spanish, one email one job, one primary action, mobile first, no AI tells (contrast-reveal sentences, stock openers, filler sign-offs). Spanish copy goes through the project's humanizer pass.
- Welcome sequence: at most 3 emails, first one immediate, value before any ask, no urgency. Nothing about results we do not have.
- Deliverability: SPF, DKIM and DMARC are in place for Zoho Campaigns; DMARC is still `p=none` and tightening is the owner's call. Resend's examples use Amazon SES records; ours differ.
- WhatsApp is not covered by the email consent. Any WhatsApp outreach needs its own opt-in and a research pass first (not yet done).

## Zoho Campaigns facts (read from the official docs, 2026-11-24)
- `listsubscribe` documents `contactinfo` with three standard fields only: `First Name`, `Last Name`, `Contact Email`.
- The docs do NOT say whether custom fields can be sent in `contactinfo`, how they are keyed, or what error an unknown field returns. Do not build on it until one real call proves it. Fallbacks, in order: encode the actor type in the documented `source` parameter; one list per audience.
- For signup-form-enabled lists Zoho sends its own confirmation email. Ours does the confirming, so the list must be the form-disabled kind (check before launch).

## When to open each reference
| Task | Open |
|---|---|
| Fields, validation, errors, spam layers of the form | `references/rampstack/form-strategy.md` |
| Opt-in flow, consent checkboxes, verification timing | `references/resend/email-capture.md` |
| Unsubscribe, consent records, retention (then add Colombia) | `references/resend/compliance.md` |
| Spam folder, DNS, sender reputation | `references/resend/deliverability.md` |
