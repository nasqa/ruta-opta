# 0002. Campaign documents live in the claude.ai Project, not in the repo

Status: accepted (Santiago, 2026-11-22).

## Context

The pre-launch campaign needs Spanish working documents: the verbal brand kit, the brief, the roadmap, the question guide and later the phase outputs. Stephania Forero approves them and works in Spanish. `AGENTS.md` says everything in the repo is English except `messages/es.json`.

## Decision

- Campaign documents live in the claude.ai Project "OPTA", under the `campaign/` folder. They are not stored in this repo.
- The repo keeps one pointer, `docs/campaign/README.md` (English), linked from `AGENTS.md`, so an agent that looks for these documents knows where they are and how to read them.
- Agents read them with the Projects tool (`project_read`, `project_search`), never by searching the filesystem.
- Copy that ships on the site goes to `apps/landing/messages/es.json`. Drafts in the Project are inputs; the app never imports them.
- Agent definitions, skills and ADRs stay in the repo, in English.

## Consequences

- The English rule in `AGENTS.md` keeps its one invariant: no Spanish outside `messages/es.json`, and no exception to maintain.
- A Claude Code session needs to be attached to the Project to read the documents. If it is not, the agent says so and asks Santiago instead of guessing.
- Documents are versioned by the Project, not by git. Decisions that change the code (for example the Zoho integration) still get their own ADR here.
