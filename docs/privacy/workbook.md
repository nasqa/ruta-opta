# Privacy and data workbook

**Not legal advice.** This says what to do when anything about personal data or measurement changes on rutaopta.org, who acts, and what blocks publishing. Its legal statements come only from the sources in [Legal references](#legal-references), and each names its article. Anything else is marked **unverified** (nobody has checked it) or **unrecorded** (no source here says it), or sent to counsel. Neither is a guess to act on: ask.

## How to use this

- **Something is changing:** find it in [Which case is it](#which-case-is-it). Follow every case that applies, then [11. Publishing a policy version](#11-publishing-a-policy-version) once.
- **Someone wrote about their data:** [9](#9-a-person-writes-about-their-data). **Data may have leaked:** [10](#10-a-security-incident). **Nothing changed:** [12. Recurring duties](#12-recurring-duties).
- **Open actions and policy versions** are in `docs/privacy/register.json`, the only list of them. Each action's `workbook` field points to the section here that says how to do it. Update the register in the pull request that does the work.
- **Claude and other agents:** the `privacy-changes` skill sends you here. Classify with the table first. Tell the user which open actions block what you are about to do. Never change the policy or the consent wording without the owner's approval of the exact wording. Never write personal data into this repository.

## Who does what

| Role | Who | Does |
|---|---|---|
| Owner | Santiago | Approves the exact wording of the policy and the consent. Merges and publishes. Decides wherever a step says **stop** |
| Legal representative | Stephania Forero, as the policy names her | Attends queries and claims ([9](#9-a-person-writes-about-their-data)) |
| Ruta Opta team | Not named one by one | Reads privacidad@rutaopta.org and privacy@rutaopta.org. Sends the yearly reminder e-mail |
| Counsel | Not named | Answers the [questions for counsel](#questions-for-counsel) |
| You | Whoever makes the change, a person or Claude | Follows the case, drafts, updates the register, opens the pull request. Never publishes |

## What we hold and where

Cases 1 to 4 and 7 update this table. Write what a source shows; otherwise write unrecorded or unverified.

| Datum | Where it lives | Why | Who can see it | How long |
|---|---|---|---|---|
| Name and e-mail address of a confirmed sign-up | Zoho Campaigns, the list for the sign-up's language. Country: unrecorded | Send news and say when Ruta Opta opens | Users of the Zoho Campaigns account: unrecorded | Until the person unsubscribes, then only so as not to write again. The list lasts while Ruta Opta sends news |
| Source of that sign-up: `rutaopta.org/<locale> · <policy version> · o=<utm_source>` | Zoho Campaigns, on the contact | Which language and policy version the person authorized. Count sign-ups per link | As above | As the contact |
| A pending sign-up: name, e-mail address, language, consent time, policy version, link tag | Sealed inside the confirm link, which is e-mailed through Zoho CPaaS. We keep no copy | Subscribe only after the person confirms | Nobody without the token key. The address passes through Zoho CPaaS | The link works 7 days. What Zoho CPaaS keeps of a sent e-mail: unverified |
| Sign-up protection codes: keyed hashes of the IP address with the hour, of the e-mail address with the date, and of confirm links | Netlify Blobs, store `waitlist` | Limit abuse of the form and of confirm links | Members of the Netlify site: unrecorded | Nothing deletes them, except two short claims released after a failed send |
| A visit: page, where it came from, buttons and links tapped, time and scroll, device, system, browser, approximate place. A daily code from the IP address and browser details | Plausible Insights OÜ, Estonia, processed in the EU. It passes through Netlify | Count visits and clicks (`docs/analytics.md`) | Users of the Plausible dashboard: unrecorded | Plausible's retention: unverified. Nothing is sent until `ANALYTICS_SCRIPT_SRC` is set |
| Every request to the site: IP address and headers, cookies included | Netlify, Inc. | Serve the site and run the sign-up | Netlify. What members of the Netlify site can see: unverified | Unverified |
| Language cookie `NEXT_LOCALE`: only "es" or "en" | The visitor's browser | Remember the language | The site | The browser session |
| A message by WhatsApp or to info@rutaopta.org: name, organization, message | WhatsApp (Meta). The provider of the rutaopta.org mailboxes: unrecorded | Reply and talk about the collaboration | Whoever reads those inboxes: unrecorded | Not stated in the policy. Deleted on request |

- **Sources:** the policy (`Privacy` in `apps/landing/messages/es.json`), ADR 0003 (`docs/decisions/0003-waitlist-form-posts-to-zoho-campaigns.md`), and `apps/landing/src/modules/waitlist` (`use-cases.ts`, `throttle.ts`, `confirm-guard.ts`, `store.ts`). Our code logs event names and codes, never a name or an address (ADR 0003, "Deadlines"; `use-cases.ts`).
- **Proof of authorization.** The consent time travels in the confirm link but never reaches Zoho, which receives the name, the address and the source. So the record of when a person authorized is Zoho's own date on the contact: **unverified**. Decree 1074 asks to keep proof of the authorization (art. 2.2.2.25.2.5). Open: `consent-proof`. A person listed under `2026-11-draft` accepted one of its three texts: match them by the date they signed up (its `summary` in the register).
- **Already open:** the policy does not mention the protection codes (`abuse-protection-records-in-policy`), and nothing deletes them (`delete-old-throttle-records`).
- **Link tags are permanent.** The `o=` value is the link's `utm_source` and cannot be changed after the sign-up. Agree on values before sharing links (`course-whatsapp-utm-source`; `docs/analytics.md`, "Tagged links").
- **Providers' own pages, read 2026-11-25.** [Plausible](https://plausible.io/privacy), updated November 2026: company in Tartu, Estonia; visitor data processed entirely in the EU; its subprocessors for it are Hetzner (Germany), Bunny (Slovenia) and UpCloud (Finland). [Netlify](https://www.netlify.com/privacy/), updated 4 November 2026: Netlify, Inc.; transfers to the United States under its section on the Data Privacy Framework. That page covers Netlify as controller; its processing for customers falls under its Data Processing Agreement, **not read**. Zoho: no source records the country where this account's data is kept.

## Which case is it

Several can apply: follow each. A change that alters what happens to data but leaves every text alone still counts: no test sees it.

| If the change or the event... | Go to |
|---|---|
| Adds a form field, a question or any new datum about a person | [1](#1-a-new-field-or-datum) |
| Uses data for something new, or adds a purpose | [2](#2-a-new-purpose-or-a-new-use-of-data-we-hold) |
| Adds or swaps a provider, or sends data to a new country | [3](#3-a-new-or-changed-provider-or-data-going-to-a-new-country) |
| Adds a script, cookie, storage, embed, analytics event or property | [4](#4-a-new-script-cookie-storage-embed-or-analytics-event) |
| Changes the policy's text or the consent wording | [5](#5-a-wording-change) |
| Changes the controller, its contact data, or who attends requests | [6](#6-the-controller-its-contact-data-or-who-attends-requests) |
| Changes how long data is kept, or how long the list lasts | [7](#7-retention-or-how-long-the-database-lasts) |
| Lets people sign in on this domain | [8](#8-anything-that-signs-people-in-on-this-domain) |
| A person writes about their data | [9](#9-a-person-writes-about-their-data) |
| Data may have leaked, been lost, or reached someone who should not have it | [10](#10-a-security-incident) |
| A policy version is ready to publish | [11](#11-publishing-a-policy-version) |
| Nothing changed: what is due | [12](#12-recurring-duties) |

## 1. A new field or datum

**Blocks publishing:** yes. The field goes live only with a published policy version that names it.

1. **You:** check that the field earns its place and is not sensitive (`growth-opta`, rule 4). If it might be sensitive or about children: **stop**, ask the owner.
2. **You:** add its row to [What we hold and where](#what-we-hold-and-where).
3. **You:** if it is used for anything the policy does not already say, follow [2](#2-a-new-purpose-or-a-new-use-of-data-we-hold) too.
4. **You:** draft the policy's data section (`Privacy.sections.data`) so it names the field, and check the consent wording. Decree 1074, art. 2.2.2.25.2.2: the authorization is obtained at the latest when the data is collected, and it names the data and all the specific purposes. Whether naming it only in the linked policy is enough: counsel.
5. **You:** if it travels in the confirm link, keep the link short (`growth-opta`, rule 5).
6. Then [11](#11-publishing-a-policy-version).

## 2. A new purpose or a new use of data we hold

**Blocks publishing:** yes. **Blocks the new use** of data already held until its people gave a new authorization.

Decree 1074, art. 2.2.2.25.2.2: substantial changes about the controller's identification or the purpose of the processing, which can affect the content of the authorization, are told to data subjects before, or at the latest when, the new policies apply; a change of purpose also needs a new authorization. The authorization names all the specific purposes.

1. **You:** write the new use in one sentence: which data, for what, who sees it.
2. **You:** **stop** before using any data already held for it. Ask the owner.
3. **You:** check that the consent wording on the form names every purpose, the new one included. Today it does not name the per-link sign-up count: `consent-wording-purpose`.
4. **You:** draft the policy's purpose section (`Privacy.sections.purpose`) and update [What we hold and where](#what-we-hold-and-where).
5. **Owner, with counsel:** how to ask the people already on the list for the new authorization.
6. Then [11](#11-publishing-a-policy-version), with `substantial: true`.

## 3. A new or changed provider, or data going to a new country

**Blocks publishing:** yes. The policy names the providers (`Privacy.sections.processor`).

1. **You:** from the provider's own privacy page or data processing terms, write down its legal name, its country, what data it receives, where it keeps it, the link and the date read. What no page says is unrecorded.
2. **You:** update [What we hold and where](#what-we-hold-and-where) and draft the policy's providers section.
3. **You:** check the country. The SIC's Circular Única, Título V, section 3.2 (version of Circular 001 of 9 January 2026, read 2026-11-25) includes Germany, Estonia, Finland, Slovenia and the United States of America among the countries with an adequate level of protection. A country you cannot find there: **stop**, nothing is sent until counsel answers.
4. **Counsel:** whether a transfer needs anything more, even to a listed country (`counsel-review`).
5. **You:** a provider that loads in the visitor's browser is also [4](#4-a-new-script-cookie-storage-embed-or-analytics-event).
6. Then [11](#11-publishing-a-policy-version).

## 4. A new script, cookie, storage, embed or analytics event

**Blocks publishing:** yes when it sends something new or writes on the device. For measurement blockers see [What blocks publishing or measurement](#what-blocks-publishing-or-measurement).

1. **You:** list what it sends, to whom, and whether it writes a cookie or storage on the device. Read the vendor's script, as was done for Plausible (`docs/analytics.md`, "Before the production variable is set").
2. **You:** **stop**, ask the owner, if it is a tracker other than Plausible, writes a cookie or storage other than `NEXT_LOCALE`, or sends anything we collect (names, e-mail addresses, tokens, form values). `growth-opta` rule 8 forbids all three.
3. **You:** a new event on a contact or sign-up button or link that sends nothing new: follow `docs/analytics.md`, "When the site changes". The policy already covers it. Anything else it records (another kind of button, a property, a new datum): draft the policy's measurement section (`Privacy.sections.measurement`).
4. **You:** an embed (a video, a map, another site's form) loads a third party: also [3](#3-a-new-or-changed-provider-or-data-going-to-a-new-country).
5. **You:** update [What we hold and where](#what-we-hold-and-where).
6. Then [11](#11-publishing-a-policy-version) if the policy changed.

## 5. A wording change

**Blocks publishing:** yes. Any change to the `Privacy` namespace or to `Waitlist.consent.label`, in `es.json` or `en.json`, needs its version in the register; the tests fail until it has one.

| The change | Substantial? | What it needs |
|---|---|---|
| The controller's identification, or the purpose of the processing, in a way that can affect the content of the authorization | Yes. Decree 1074, art. 2.2.2.25.2.2 | Tell the people on the list before, or at the latest when, it applies. A change of purpose also needs a new authorization |
| New data, a new recipient or country, longer retention, fewer rights | Treat it as substantial until counsel says otherwise. A proposed cautious default: the decree's text read here names only the row above | As above |
| Same meaning in clearer words, a typo, a label, the effective date | No | A version entry with `substantial: false`, or the new hash of a version still unpublished (step 2). The owner still approves the exact text |

Decree 1074, art. 2.2.2.25.3.1 also says substantial changes to the policy are told before they apply. Tell people before, to meet both.

1. **You:** classify the change with the table.
2. **You:** while the newest version in the register is unpublished, its text may still change: once the owner approves the exact text, put the hash the test prints in its `textSha256`. Once a version is published, **never** edit its hash: add a new version.
3. Then [11](#11-publishing-a-policy-version).

**One label, one text.** Once a version is published, its label never carries another text. `2026-11-draft` did: three texts were merged under it on 2026-11-23 and 2026-11-24 (its `summary` in the register names them). From `2026-11-25-draft` on, the fingerprint test enforces this.

Already open: the rights text says every e-mail has an unsubscribe link, and the confirmation e-mail has none (`unsubscribe-sentence`). Decree 1074, art. 2.2.2.25.2.6 asks for free, easy ways to revoke or ask for deletion.

## 6. The controller, its contact data or who attends requests

**Blocks publishing:** yes.

1. **Owner:** decides the change. A change in the controller's identification is substantial ([5](#5-a-wording-change)): **stop**, counsel before publishing.
2. **You:** update the policy's controller and requests sections (`Privacy.sections.controller` and `.requests`) in both languages, and [Who does what](#who-does-what).
3. **You:** make sure someone reads any new contact address, and tell the Ruta Opta team. Addresses in `docs/privacy/` stay on rutaopta.org: a test fails otherwise.
4. **You:** check the policy keeps its minimum contents. Decree 1074, art. 2.2.2.25.3.1 lists six: read the article.
5. **You:** update `tests/privacy-measurement.test.mjs`, which checks who attends and the address.
6. Then [11](#11-publishing-a-policy-version).

## 7. Retention or how long the database lasts

**Blocks publishing:** yes when the policy's text changes.

Decree 1074, art. 2.2.2.25.2.8: data is kept only as long as its purpose needs. The owner decided, and the policy says, that the list lasts while Ruta Opta sends news, with a yearly e-mail that reminds people and offers to unsubscribe.

1. **You:** update [What we hold and where](#what-we-hold-and-where) and draft the policy's data section and effective line (`Privacy.sections.data`, `Privacy.effective`).
2. **You:** if data must go sooner, write who deletes what, and where (Zoho Campaigns, Netlify Blobs). Netlify Blobs needs a code change.
3. **You:** a change to the yearly e-mail also changes [12](#12-recurring-duties) and `yearly-list-reminder`.
4. **Owner:** if Ruta Opta stops sending news, the list's purpose ends: **stop**, decide with counsel what is deleted and when.
5. Then [11](#11-publishing-a-policy-version).

Already open: `delete-old-throttle-records`, because nothing deletes the sign-up protection codes.

## 8. Anything that signs people in on this domain

**Blocks publishing** the sign-in until step 1 is settled.

1. **You:** read `docs/analytics.md`, "Before the production variable is set", step 2, and its **Result**. The proxy rule there: before anything that signs people in shares this domain, either the header override is proven or the proxy goes. Otherwise the sign-in's session cookie reaches the analytics vendor.
2. **Owner:** if the override is not proven, the proxy goes before the sign-in ships.
3. **You:** an account holds data about a person: follow [1](#1-a-new-field-or-datum) to [4](#4-a-new-script-cookie-storage-embed-or-analytics-event) as they apply.

## 9. A person writes about their data

**Blocks publishing:** no. **The clock starts on the day it arrives**, whichever inbox it reached.

**Never** put the person's name, address or message in this repository, an issue, a pull request or a commit. The record goes in the request log, [outside the repository](#records-kept-outside-this-repository).

What people may ask, Law 1581, art. 8: to know, update and rectify their data; proof of the authorization; what use was made of it; to complain to the SIC; to revoke and/or ask for deletion when principles or guarantees are not respected, once the SIC has so determined; free access. What the policy promises them is in `Privacy.sections.rights` and `.requests`. For someone listed under `2026-11-draft`, the text they accepted depends on the date they signed up ([What we hold and where](#what-we-hold-and-where)).

1. **Ruta Opta team:** the day it arrives, open a record in the request log and pass the message to the legal representative. For a request that reached info@rutaopta.org or WhatsApp, the clock started the day it arrived there.
2. **Legal representative:** decide whether it is a query (what we hold and how we use it) or a claim (correct, update, delete, withdraw the authorization, or a breach). Write its deadlines from the table below into the record.
3. **Legal representative:** before giving out data, be sure the writer is the person or may act for them. How to check: **unverified**, ask counsel.
4. **Legal representative, claim:** if it is incomplete, ask for what is missing within 5 days. If it is not ours to answer, forward it within 2 business days to whoever is competent, and tell the person.
5. **Legal representative, complete claim:** within 2 business days, mark the contact "reclamo en trámite", with the claim's reason. **Unverified:** how to mark it in Zoho Campaigns (a field, a tag or a note); nobody has checked. Ask the owner the first time, and write the answer here. Never unsubscribe or delete a contact just to mark it.
6. **Legal representative:** answer within the deadline, from the privacy address. If you cannot, tell the person why and the new date before the first deadline passes.
7. **Owner, or whoever he names, for a deletion or a withdrawal:** act in Zoho Campaigns. What Zoho keeps after an unsubscribe or a delete: **unverified**. The protection codes in Netlify Blobs are keyed hashes: finding one person's needs the key and a script that does not exist yet.
8. **Legal representative:** close the record with the answer's date and what was done. When the "reclamo en trámite" mark comes off: **unverified**, ask counsel.

Every legal deadline in this workbook, the incident one included:

| Kind | What | By when | Source |
|---|---|---|---|
| Query | Answer | 10 business days from receipt | Law 1581, art. 14 |
| Query | Cannot answer in time: say why and when | The new date is at most 5 business days after the first deadline | Law 1581, art. 14 |
| Claim | Incomplete: ask for what is missing | 5 days from receipt. The law says days, not business days | Law 1581, art. 15 |
| Claim | The person does not complete it | After 2 months it counts as withdrawn | Law 1581, art. 15 |
| Claim | Not ours to answer: forward it and tell the person | 2 business days | Law 1581, art. 15 |
| Claim | Mark "reclamo en trámite" and its reason in the database | 2 business days from a complete claim | Law 1581, art. 15 |
| Claim | Answer | 15 business days from the day after receipt | Law 1581, art. 15 |
| Claim | Cannot answer in time: say why and when | The new date is at most 8 business days after the first deadline | Law 1581, art. 15 |
| Complaint | The person may complain to the SIC | Only after this procedure | Law 1581, art. 16 |
| Incident ([10](#10-a-security-incident)) | Report | Within 15 business days of being detected and told to the person or area that handles it | SIC, Circular Única, Título V |

## 10. A security incident

What counts, SIC, Circular Única, Título V: a breach of security codes, or the loss, theft or unauthorized access to a database. Treat as one, for example, a leaked key, someone else in the Zoho or Netlify account, or personal data published here. It is reported within 15 business days of being detected and told to the person or area that handles it, whether or not the controller must register in the RNBD.

**Deadline:** the last row of [the deadlines table](#9-a-person-writes-about-their-data). **Who handles incidents is not decided yet** (`name-incident-owner`). Tell the owner. "Handler" below is whoever he names.

1. **Anyone:** tell the owner at once, and write down when it was detected and by which role.
2. **Handler:** contain it: revoke the access, rotate the leaked key, take down what was exposed. The waitlist and Zoho keys are Netlify variables; ADR 0003, "Token", says how the token key rotates without breaking links.
3. **Handler:** start the incident note [outside the repository](#records-kept-outside-this-repository).
4. **Handler, with counsel on the first day:** report it within the 15 business days. To whom and through which channel, for a controller not registered in the RNBD: **unverified**. Whether and how to tell the people affected: counsel.
5. **You:** a fix in a pull request says what was fixed, never whose data. Personal data that reached this repository stays in its public history: treat it as an incident; rewriting history is the owner's call.
6. **Handler:** afterwards, update this workbook and [What we hold and where](#what-we-hold-and-where) if anything changed.

## 11. Publishing a policy version

**Blocks:** no merge that publishes a version while an action with `blocks: "publish"` is open in the register.

1. **You:** classify the change ([Which case is it](#which-case-is-it), then [5](#5-a-wording-change)): substantial or not.
2. **You:** draft the Spanish and the English text outside the repository, which is public.
3. **You:** a plain-language pass: short sentences, words the reader knows. Spanish copy goes through the humanizer pass (`growth-opta`).
4. **Owner:** approves the exact text in both languages, in the pull request or before it. Nothing below happens without it.
5. **Counsel:** answers the points flagged for them. For `2026-11-25-draft` the owner chose to publish before counsel's review (ADR 0003, "Measurement and privacy text"). For a later version, ask him.
6. **Owner:** first `check-subscribers-before-publish`: is anyone already on the list? If the change is substantial and someone is, tell them before it applies, and get a new authorization if the purpose changed ([5](#5-a-wording-change)). How to collect it: counsel.
7. **You:** put the approved text in `apps/landing/messages/es.json` and `en.json` (`Privacy` and `Waitlist.consent.label`).
8. **You:** the effective date in `Privacy.effective` is the day it will be published (`confirm-effective-date`). If publishing slips, the date changes and the owner approves the new one.
9. **You:** give `policyVersion` in `apps/landing/src/modules/waitlist/server.ts` a new name, never used before.
10. **You:** add the version at the end of `policyVersions` in `docs/privacy/register.json`: `publishedOn: null`, the `textSha256` the test prints, a one-line `summary`, `substantial`, and `subjectsTold` (how and when people were told, or why it was not needed). Never edit a published version's hash.
11. **You:** `npm run check` and `npm run check:pending` pass.
12. **You:** open the pull request and list in it the register's open publish blockers.
13. **Owner:** on the deploy preview, reads `/es/privacidad`, `/en/privacy` and the consent on the sign-up form.
14. **Owner:** merges when no publish blocker is open. The deploy publishes it.
15. **You, the same day:** in a follow-up pull request, set `publishedOn` to the publication day and give every open yearly duty its `due` date (proposed: one year after publication; the owner confirms). The tests fail until each has one.
16. **Owner:** reads the live pages on www.rutaopta.org, and checks with a throwaway address of our own that a new sign-up's source in Zoho carries the new version.

Git history keeps every published text and the register its fingerprint. Decree 1074 asks to keep the proof of authorization (art. 2.2.2.25.2.5) and the privacy notice used (art. 2.2.2.25.3.4). Whether these records are enough: counsel.

## 12. Recurring duties

| Duty | Who | When | Register |
|---|---|---|---|
| Read privacidad@rutaopta.org and privacy@rutaopta.org | Ruta Opta team | Often enough to meet the deadlines in [9](#9-a-person-writes-about-their-data). How often, and who covers absences, is not set | `set-mailbox-check` |
| Yearly e-mail to the list: a reminder that offers to unsubscribe | Ruta Opta team | Yearly. The first date is set when the policy is published | `yearly-list-reminder` |
| Review the policy, this workbook and [What we hold and where](#what-we-hold-and-where) | Santiago | Yearly. Proposed, not confirmed by the owner | `yearly-policy-review` |
| Weekly tally of counts (`docs/analytics.md`, "Weekly review") | Not named yet | Weekly while the course runs, until 2026-12-18 | `name-weekly-tally-owner` |
| Check what blocks publishing | You, in each pull request; the owner, before merging | Before every merge or release | All open actions |
| A calendar reminder for the yearly e-mail | Santiago | Created only with his explicit yes | `calendar-reminder` |

When a yearly duty is done, keep it `open` and move its `due` one year on, in a pull request that says when it was done. Nothing in this repository sends e-mails or creates calendar events.

## What blocks publishing or measurement

- `blocks: "publish"`: the newest policy version is not published while the action is open. Publishing is the merge that deploys it.
- `blocks: "measurement"`: measurement does not start while the action is open. It starts when `ANALYTICS_SCRIPT_SRC` is set in Netlify, which is itself the last of these actions (`netlify-script-variable`). The steps are in `docs/analytics.md`, "Before the production variable is set". The variable is set only after the merge that publishes the policy describing the measurement (its step 4), so publish blockers come first.
- `blocks: null`: blocks nothing, but has an owner and stays listed until done.
- An action is closed by setting `status: "done"` in the pull request that does it, or in one that records it was done.

## Questions for counsel

The owner chose to publish `2026-11-25-draft` before counsel's review (ADR 0003, "Measurement and privacy text"). ADR 0003, "The questions meant for counsel", holds proposed working answers to the first three; the owner has not confirmed them. Register: `counsel-review`.

1. Does the cookieless visit measurement need prior authorization? ADR 0003 cites Law 1581, art. 9.
2. The international transfer: Plausible (Estonia, EU servers), Netlify (United States), Zoho (country unrecorded).
3. Anyone already on the list under the earlier version, `2026-11-draft`: what notice, and what new authorization.
4. The consent wording: does it name the controller and every purpose as it must (`consent-wording-purpose`)?
5. The yearly reminder e-mail, with the list lasting while news are sent (Decree 1074, art. 2.2.2.25.2.8).

Also raised here: how to verify who writes ([9](#9-a-person-writes-about-their-data)), where to report an incident ([10](#10-a-security-incident)), and whether our records prove the authorization ([11](#11-publishing-a-policy-version)).

## The national database register (RNBD)

SIC, Circular Única, Título V, section 2.2: registration in the RNBD is for societies and non-profits with total assets of 100,000 UVT or more, and for public legal entities. Whether the foundation reaches that threshold is open: `rnbd-threshold`. An incident is reported either way ([10](#10-a-security-incident)).

## Records kept outside this repository

The repository is public. These records hold personal data, or could, so they live outside it, where the owner chooses (unrecorded here). Never copy them into issues, pull requests, commits or files here.

- **Request log**, one record per request ([9](#9-a-person-writes-about-their-data)): date received and inbox; query or claim; what is asked; its deadlines; the date of each message sent; for a claim, when "reclamo en trámite" was marked and removed; the answer's date and what was done.
- **Incident notes** ([10](#10-a-security-incident)): when it was detected and by which role; what happened; which data and how many people, as a count; what was done and when; when it was reported, and to whom; counsel's advice.
- **Weekly tally:** counts only, never a name, a phone number or a message's text (`docs/analytics.md`, "Weekly review").

The owner's approval of an exact text holds no personal data: record it in the pull request that carries the text.

## Limits of the guards

`tests/privacy-register.test.mjs` runs with `npm test` and in CI.

- It sees text, not behaviour. A new use of data that leaves the text alone passes it. The `privacy-changes` skill and [Which case is it](#which-case-is-it) are the only cover.
- The fingerprint covers the `Privacy` namespace and the consent label. The e-mails, other pages and the form's fields are not covered.
- The address check reads only `docs/privacy/` and finds only e-mail addresses: not names or phone numbers, and nothing in issues, pull requests or commits.
- Only the newest version's hash is checked against the text. An older one, such as `2026-11-draft` (the hash of its last text, read from git history), cannot be.
- The yearly-duty dates are checked only while the newest version is published, since that is the text that promises them.
- A `workbook` anchor is checked to exist, not to be the right section.
- Nothing here sends e-mails or creates calendar events. The yearly e-mail also needs a calendar reminder: `calendar-reminder`, only with the owner's explicit yes.

## Legal references

Read 2026-11-25. Every legal statement in this workbook comes from one of these.

- Law 1581 of 2012, arts. 8, 14, 15 and 16: [secretariasenado.gov.co](https://www.secretariasenado.gov.co/senado/basedoc/ley_1581_2012.html).
- Decree 1074 of 2015, arts. 2.2.2.25.2.2, 2.2.2.25.2.5, 2.2.2.25.2.6, 2.2.2.25.2.8, 2.2.2.25.3.1 and 2.2.2.25.3.4: [cancilleria.gov.co](https://www.cancilleria.gov.co/sites/default/files/Normograma/docs/decreto_1074_2015_pr025.htm).
- SIC, Circular Única, Título V, version of Circular 001 of 9 January 2026: section 2.2 (RNBD), section 3.2 (countries with an adequate level of protection) and security incidents: [sedeelectronica.sic.gov.co](https://sedeelectronica.sic.gov.co).
- Providers' own pages: [plausible.io/privacy](https://plausible.io/privacy), updated November 2026; [netlify.com/privacy](https://www.netlify.com/privacy/), updated 4 November 2026.
