# 0003. The waitlist form posts to Zoho Campaigns from a server action

Status: proposed (Claude, 2026-11-23). Accepted when Santiago merges the branch.

## Decision

- The form is ours (Mantine with the Opta theme), not Zoho's embedded form, so it keeps the brand's look.
- It lives in the first module, `src/modules/waitlist` (`index.ts`, `server.ts`, `actions.ts`). The module is required by the `process.env` rule: the Zoho keys are read only in a module's `server.ts`.
- `server.ts` calls Zoho Campaigns API v1.1 `listsubscribe`. It trades the refresh token for an access token and keeps it in memory until it expires, because Zoho limits how many tokens one refresh token can mint.
- Zoho owns the double opt-in. With the list's signup confirmation on, it emails the person and adds them only after they confirm. The form gives the same answer for a new address and one already on the list.
- The keys are Netlify environment variables. Their names are in `apps/landing/.env.example`.
- The waitlist form is the exception to "every form returns a request number": the confirmation email is its receipt, and the list belongs to Fundación OPTA. `apps/landing/AGENTS.md` says so.
- It fails closed. If the settings are missing, the form says it could not send. The test stand-in answers only when `WAITLIST_ADAPTER=fake` and Netlify's `CONTEXT` is not `production`.
- A hidden `company` field catches simple bots. There is no rate limit yet.

## Open

- What Zoho answers when the address is already on the list: unverified until a test against the real list.
- The "how do you want to take part" question and the channel of origin need custom fields in the Zoho list. They are not in the first version.
- Which Zoho data center the account uses. The MX records point to `mx.zoho.com`, which suggests `com`.
