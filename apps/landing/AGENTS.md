<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Landing conventions

- Show figures as goals until evidence backs them.
- Text over a photo always gets a scrim (a veil).
- Every form returns a request number and reaches an owner. The waitlist form is the exception to the number: Zoho's double opt-in confirmation email is its receipt, and the list belongs to Fundación OPTA.

## Client islands

- Pages stay Server Components.
- A Mantine component without handlers renders directly from a server page.
- An island gets its own `'use client'` file under the route's `_components/` when it has handlers, state, compound components (for example `Menu.Item`) or client-side `useTranslations`.
- `NextIntlClientProvider` passes only the namespaces the islands use.
