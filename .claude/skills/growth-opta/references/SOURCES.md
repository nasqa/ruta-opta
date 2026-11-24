# Sources

Everything here was read in full by a person-supervised session before it was copied. Nothing was installed: no plugin, no script, no MCP server, no hook. If a source changes, the copies do not.

## Copied (MIT, pinned)

| Copy | Source | Commit |
|---|---|---|
| `resend/email-capture.md`, `resend/compliance.md`, `resend/deliverability.md` | https://github.com/resend/resend-skills (`skills/email-best-practices/references/`) | `063246e39987faebc2608f968ca13a02d994a0d4` |
| `rampstack/form-strategy.md` | https://github.com/rampstackco/claude-skills (`skills/form-strategy/SKILL.md`) | `9d281db6e7a5c4a0084ba89c91633a07f5f7e42b` |

Each folder keeps the upstream `LICENSE`. Only a provenance header was added (and, for form-strategy, its YAML frontmatter was removed).

## Read and not copied (pointers at the pinned commit)

| What | Why not copied |
|---|---|
| `coreyhaines31/marketingskills` @ `8fd2fcade2fd6629026e9dfe6d133b55b36968b9`: `skills/customer-research`, `skills/emails`, `skills/copywriting/references/ai-tells.md` | SaaS-shaped (G2 and Reddit mining, paid interviews, upgrade and social-proof emails, a "last chance" step). Useful ideas (confidence labels, 5-point minimum, one email one job) are restated in `SKILL.md` |
| `rampstackco/claude-skills` @ `9d281db...`: `skills/experiment-design` | 32 KB, for traffic we do not have. Only its qualitative-alternative guidance is cited |
| `resend/resend-skills` @ `063246e...`: `list-management.md` and the transactional references | Code for a custom backend; our list lives in Zoho Campaigns |

## Considered and rejected
- `anthropics/knowledge-work-plugins` marketing plugin (Apache-2.0): overlaps the email material; its plugin registers 13 remote MCP servers, so it would have to be hand-copied file by file. Deferred.
- `AgriciDaniel/claude-seo`: its installer clones a mutable tag, writes to `~/.claude` and runs a hook on every edit. Hreflang is already handled in `src/i18n/alternates.ts`.
- `phuryn/pm-skills`, `mohitagw15856/pm-claude-skills`, compounding-marketing: README installs a system scheduled task, or SaaS-only and no consent guidance.
- The agency-agents Growth Hacker: viral-loop and K-factor goals that do not fit a 250-person, dignity-first launch.

## Not verified
The Claude for Nonprofits plugin (no public repository found), Spanish-language and Colombian sources, the exact text of Ley 1581 and the SIC guidance, and WhatsApp opt-in rules.
