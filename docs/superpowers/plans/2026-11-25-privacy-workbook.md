# Privacy and Data Workbook Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** a workbook that says what to do when anything about personal data or measurement changes, one register of versions and open actions, and three ways Claude cannot miss it: a skill, a session reminder and tests.

**Architecture:** `docs/privacy/{workbook.md,register.json}` are the source. A Node script with a pure function reads the register for the `SessionStart` hook and for `npm run privacy:status`. `node:test` guards tie the register to the policy text, the consent wording, the code's policy version and the Claude wiring.

**Tech Stack:** Node 24 (`node:test`, `node:crypto`), Claude Code project hooks and skills. No dependency is added.

**Spec:** `docs/superpowers/specs/2026-11-25-privacy-workbook-design.md`

## Global Constraints
- Everything in the repository is English. Spanish copy only in `apps/landing/messages/es.json`; the workbook may quote Spanish terms the law uses ("reclamo en trámite").
- The repository is public: no personal data in it, ever. No e-mail address outside `rutaopta.org` in `docs/privacy/`.
- The workbook says it is not legal advice. It states only the legal facts listed in the spec, with their sources; anything else is marked "unverified" or sent to counsel.
- Test first. No new dependency. No ESLint exceptions, kebab-case file names, arrow functions, early returns, minimal comments. Lint rules are `error` or `off`.
- A hook never breaks a session: it exits 0, and says so when it cannot read the register.
- No attribution lines in commits. Never push, never merge.

## Review Focus
1. Someone makes the fingerprint test pass by overwriting a **published** version's hash: the failure message and the workbook say never; a new version is added. (Task 1)
2. A new use of data that changes no text: no test sees it; the skill's triggers and the workbook's table must name it. (Task 1)
3. A broken or missing register at session start: one clear line, exit 0. (Task 2)
4. Date boundaries: due today is "due soon", not overdue; day 30 is included, day 31 is not; the date is read in `America/Bogota`. (Task 2)
5. A data subject's address pasted into the register or the workbook: a test fails. (Task 1)

---

### Task 1: The workbook, the register, their guards and the Claude wiring

**Files:** Create `docs/privacy/workbook.md`, `docs/privacy/register.json`, `.claude/skills/privacy-changes/SKILL.md`, `tests/privacy-register.test.mjs`. Modify `AGENTS.md`, `.claude/skills/growth-opta/SKILL.md` (one pointer line), `docs/analytics.md` (one pointer to the workbook; do not repeat its content).

**Interfaces — Produces** (`register.json`):
```ts
type Register = {
  policyVersions: { version: string; publishedOn: string | null; textSha256: string; summary: string; substantial: boolean; subjectsTold: string }[]; // oldest first
  actions: { id: string; title: string; owner: string; due: string | null; repeat: null | 'yearly'; blocks: null | 'publish' | 'measurement'; status: 'open' | 'done'; workbook: string /* "#anchor" */ }[];
};
```
**Fingerprint:** sha256 hex of `JSON.stringify` of `{ en: { consent, privacy }, es: { consent, privacy } }` with every object's keys sorted, where `privacy` is the file's `Privacy` namespace and `consent` is `Waitlist.consent.label`. Amended 2026-11-25, when the consent took two layers: `consent` is `{ label, notice }`, from `Waitlist.consent`. `2026-11-draft` keeps the hash it had.

**Workbook contents.** A short "how to use this" for people and agents; who does what (owner: approves exact wording, merges, publishes; legal representative: attends requests; Ruta Opta team: reads both privacy mailboxes, sends the yearly reminder; counsel: flagged questions); a "which case is it?" table linking to one section each, every section being numbered steps with who acts, what to stop and ask, and whether it blocks publishing: (1) new field or datum; (2) new purpose or new use of data held, which also checks the consent wording on the form; (3) new or changed provider, or data to a new country; (4) new script, cookie, storage, embed, analytics event or property that sends something new; (5) wording change (how to tell substantial from not); (6) controller, contact data or who attends requests; (7) retention or database lifetime; (8) anything that signs people in on this domain (the proxy rule in `docs/analytics.md`); (9) a person writes (query or claim) with a deadline table, kept **outside** the repository, never pasted into issues, pull requests or commits, and an "unverified" note on how to mark it in Zoho; (10) security incident; (11) publishing a policy version (the standard change procedure: classify, draft es and en outside the repository, plain-language pass, owner approval of the exact text, counsel for flagged points, tell people and get new authorization where the law asks, messages, `policyVersion`, effective date = publication day, register entry, tests, PR, preview, after the merge set `publishedOn` and the yearly due dates, verify live); (12) recurring duties; then the limits of the guards, and legal references with links and the date read.

**Initial register.** One version, `2026-11-25-draft`, `publishedOn: null`, `substantial: true`. Open actions (ids verbatim): `check-subscribers-before-publish` (Santiago, blocks publish), `confirm-effective-date` (Santiago, blocks publish), `plausible-hostname-allow-list` (Santiago, blocks measurement), `netlify-script-variable` (Santiago, blocks measurement), `counsel-review` (Santiago, blocks nothing: the owner ships before counsel; questions: prior authorization for cookieless measurement, the transfer, notice and authorization for anyone already listed, the consent wording and the yearly reminder), `rnbd-threshold` (Santiago, blocks nothing), `yearly-list-reminder` (Ruta Opta team, yearly), `yearly-policy-review` (Santiago, yearly; proposed), `calendar-reminder` (Santiago, blocks nothing; create it only with his explicit yes). The controller's addendum lists any other action open at build time.

- [ ] **Step 1: Write `tests/privacy-register.test.mjs`.** Tests: `the policy version in the code is the newest in the register` (read `policyVersion` from `modules/waitlist/server.ts` source); `the policy text and the consent wording match the newest version's fingerprint` (on failure the message gives the computed hash, names the workbook and says never to edit a published version's hash); `versions are unique, complete, and only the newest may be unpublished`; `actions are well formed` (unique ids; the enums above; `due` null or a real `YYYY-MM-DD`; `owner` and `title` non-empty; `workbook` is an anchor that exists in the workbook, computed from its headings as GitHub does); `once a version is published, every open yearly duty has a due date`; `claude finds the workbook` (the skill file and `AGENTS.md` contain `docs/privacy/workbook.md`; the skill has `name: privacy-changes` and a `description`); `the privacy folder holds no address outside rutaopta.org`.
- [ ] **Step 2: Run** `node --test tests/privacy-register.test.mjs` — expected FAIL, files missing.
- [ ] **Step 3: Write the register, the workbook, the skill and the pointers.** The skill's `description` names its triggers: privacy policy, consent wording, data collected or its use, forms, analytics and events, cookies or storage, providers, retention, who attends requests, a data-subject request, a security incident, publishing, and open privacy actions or reminders. Its body sends the reader to the workbook and repeats only: classify with the table first, never change policy or consent text without the owner's approval of the exact wording, no personal data in the repository. `AGENTS.md` gets a `## Privacy and data` section of at most three lines and `privacy-changes` in its list of procedures.
- [ ] **Step 4: Run** the test — PASS. Show two temporary breakages caught (a changed word in `es.json`'s consent; an outside address in the workbook), not committed. `npm run check` passes.
- [ ] **Step 5: Commit** `docs(privacy): the workbook, its register and the guards`.

### Task 2: The reminders

**Files:** Create `.claude/hooks/privacy-reminders.mjs`, `tests/privacy-reminders.test.mjs`. Modify `.claude/settings.json`, `package.json` (script `privacy:status`), `docs/privacy/workbook.md` (how the reminder works).

**Interfaces — Consumes:** `Register` from Task 1. **Produces:**
```ts
export const todayIn: (now: Date, timeZone?: string) => string;          // YYYY-MM-DD, default 'America/Bogota'
export const reminders: (register: Register, today: string) => string;    // '' when there is nothing to say
export const report: (registerPath: string, today: string) => Promise<string>; // never rejects
```
Output, in this order, only for `status: 'open'` actions, each line with id, owner, title and workbook anchor: `Overdue:` (due before today), `Due within 30 days:` (today to today+30 inclusive), `Blocks publishing:`, `Blocks measurement:` (an action already listed as dated is not repeated). A non-empty report starts `Privacy actions (docs/privacy/register.json).` and ends `Tell the user about overdue and due-soon items. Check what blocks publishing before any merge or release. Procedure: docs/privacy/workbook.md.` It never starts with `{` (Claude Code would read it as JSON). An unreadable or invalid register gives `Privacy reminders could not read the register: <reason>. See docs/privacy/workbook.md.` Run as a program, it prints the report for today and exits 0.

Settings: add to `.claude/settings.json`, beside the existing hooks, `"SessionStart": [{ "hooks": [{ "type": "command", "command": "node \"${CLAUDE_PROJECT_DIR}/.claude/hooks/privacy-reminders.mjs\"", "timeout": 10 }] }]`.

- [ ] **Step 1: Write `tests/privacy-reminders.test.mjs`:** with a fixture register and `today = '2026-12-01'`: due `2026-11-30` is overdue; `2026-12-01` and `2026-12-31` are due soon; `2027-01-01` is not listed; `done` is never listed; a blocker without a date is listed under its heading; a dated blocker appears once; nothing open gives `''`; `report` on a missing file and on invalid JSON resolves to the "could not read" line; `todayIn(new Date('2026-12-01T03:00:00Z'))` is `'2026-11-30'`; running the file with `node` exits 0 and its output does not start with `{`; the real register's report lists its publish blockers; `.claude/settings.json` has the `SessionStart` command and keeps `PostToolUse` and `Stop`; `package.json` has `privacy:status`.
- [ ] **Step 2: Run** — expected FAIL, module not found.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the test, `npm run check` — PASS. Run `npm run privacy:status` and put its output in the report.
- [ ] **Step 5: Commit** `feat(privacy): bring open privacy actions into every Claude session`.

## Running order
After Tasks 5 and 6 of the analytics plan: the fingerprint reads the final policy text and the workbook points at `docs/analytics.md`.
