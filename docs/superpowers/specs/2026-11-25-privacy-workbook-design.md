# Privacy and data workbook: design

Date: 2026-11-25. Owner approved the approach ("same PR", "approved"). Small change; part of PR #16.

## Intent
When anything about personal data or measurement changes, whoever does it (a person or Claude) knows what to do, who acts, and whether it blocks publishing. Open actions and yearly duties are not forgotten, and Claude brings them up without being asked. **That last part is not built:** the session reminder that would do it moved to a later pull request (owner scope freeze, 2026-11-26).

**Failure, even if it technically works:** the policy or consent wording changes with no new version; a duty promised in the policy (the yearly e-mail) has no owner or date; the guide exists but nothing makes Claude read it; a data subject's personal data lands in this public repository.

**Non-goals:** legal advice; automating e-mails or calendar events; tickets or GitHub issues opened by CI; a log of data-subject requests (it holds personal data, so it lives outside the repository).

## Approaches
| Approach | Trade-off | Verdict |
|---|---|---|
| A document only | Cheap; depends on someone remembering to read it | Rejected |
| Document, register, project skill, session reminder, tests | A hook and two test files to keep | **Chosen**; the session reminder, its hook and its test moved to a later pull request |
| Plus a scheduled workflow opening GitHub issues | Works with no session open; issues are public and CI needs write access | Rejected |

## Parts
- `docs/privacy/workbook.md`: the procedure. English, like the whole repository. "Not legal advice" at the top.
- `docs/privacy/register.json`: the only list of policy versions and open actions.
- `.claude/skills/privacy-changes/SKILL.md` plus a line in `AGENTS.md`: how Claude finds the workbook.
- **Not built, moved to a later pull request (owner scope freeze, 2026-11-26):** the session reminder. As designed: a script in `.claude/hooks/`, wired as a `SessionStart` hook (its plain stdout reaches Claude's context: code.claude.com/docs/en/hooks, read 2026-11-25), with an npm script that prints the same report. Neither the file, the hook nor the npm script exists. Open in the register: `session-reminders`.
- Tests: the policy text and the consent wording cannot change without the register; the register is well formed; the yearly duties get a date once a version is published; the Claude wiring exists; no e-mail address outside rutaopta.org in the two files.

## Limits, stated in the workbook
The fingerprint test sees text, not behaviour: a new use of data that leaves the text alone passes it (the skill and the workbook's trigger table are the cover). There is no session reminder: it moved to a later pull request (owner scope freeze, 2026-11-26), so nothing brings the open actions up on its own. As designed, it would run only when a Claude session opens in the repository (or someone runs its command), so the yearly e-mail also needs a calendar reminder, created only with the owner's explicit yes.

## Legal facts the workbook may state (read 2026-11-25; anything else is marked unverified or left to counsel)
- Law 1581 of 2012 (secretariasenado.gov.co/senado/basedoc/ley_1581_2012.html). Art. 8: rights to know, update and rectify; ask proof of authorization; be told what use was made; complain to the SIC; revoke the authorization and/or ask deletion (literal e, as read with ruling C-748/11 below); free access. Art. 14, queries: 10 business days from receipt; if not possible, say why and when, at most 5 more business days. Art. 15, claims: num. 1, a claim carries the data subject's identification, a description of the facts that give rise to it, an address, and the documents they want to rely on; if incomplete, ask within 5 days of receipt for what is missing, and if 2 months pass from the date of that request without an answer, the claim is taken as withdrawn; whoever is not competent forwards it within 2 business days and says so; num. 2, a complete claim is marked in the database with "reclamo en trámite" and its reason within 2 business days, and the legend stays until the claim is decided; answer within 15 business days from the day after receipt, at most 8 more with reasons and date. Art. 16: a complaint to the SIC only after that procedure.
- Constitutional Court, ruling C-748 of 2011 (corteconstitucional.gov.co/relatoria/2011/c-748-11.htm), operative point Fourth: art. 8 of the bill is enforceable except the word "sólo" in literal e), which must be read so that the data subject may also revoke the authorization and ask for deletion when no legal or contractual duty requires them to remain in the database. The SIC's determination belongs only to the infringement route. (Corrected 2026-11-25: an earlier line here made revocation and deletion depend on that determination.)
- Decree 1074 of 2015 (cancilleria.gov.co/sites/default/files/Normograma/docs/decreto_1074_2015_pr025.htm). Art. 2.2.2.25.2.2: authorization at collection at the latest, naming the data and **all** specific purposes; substantial changes about the controller's identification or the purpose of the processing, which can affect the content of the authorization, are told to data subjects before, or at the latest when, the new policies apply, and a change of purpose also needs a new authorization. 2.2.2.25.2.5: keep proof of the authorization. 2.2.2.25.2.6: data subjects may at any time ask for deletion and/or revoke the authorization, by a claim under art. 15 of Law 1581; it does not proceed when they have a legal or contractual duty to remain in the database; free and easy mechanisms must be offered; if the data is not deleted within the legal term, they may ask the SIC to order it. 2.2.2.25.2.8: data only as long as the purpose needs. 2.2.2.25.3.1: the policy's six minimum contents; substantial changes are told before they apply. 2.2.2.25.3.4: keep the privacy notice used.
- SIC, Circular Única, Título V (version of Circular 001 of 9 January 2026, sedeelectronica.sic.gov.co). A security incident (breach of security codes, or loss, theft or unauthorized access to a database) is reported within 15 business days of being detected and told to the person or area that handles it, whether or not the controller must register in the RNBD. RNBD registration is for societies and non-profits with total assets of 100,000 UVT or more, and public legal entities (section 2.2).
- Owner decisions: requests are attended by the legal representative; the Ruta Opta team reads privacidad@ and privacy@; the database lasts while news are sent, with a yearly reminder e-mail that offers to unsubscribe.

## Left to the builder
Wording of the workbook and the skill, within the facts above.
