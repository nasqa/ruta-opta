---
name: extract-to-module
description: Promote code from a route to src/modules/<domain> when a second route needs it.
---

# Extract to module

1. Ask Santiago for approval. State the code, the two routes that need it and the module name.
2. Create `apps/landing/src/modules/<domain>/` (kebab-case) with only the entry points it needs: `index.ts` (client-safe), `server.ts` (starts with `import 'server-only'`) and `actions.ts` (`'use server'`).
3. Move the code with `git mv`. Keep one concern per file and use named exports. No `export *`.
4. Re-export from the entry points only what routes use. Everything else stays internal.
5. Only `server.ts` reads `process.env`. Queries return DTOs.
6. `actions.ts` stays thin and validates its input inside.
7. Update both routes to import from `@/modules/<domain>`, `.../server` or `.../actions`, never from internals.
8. If the module needs another module, stop: compose them in the route instead, or ask Santiago.
9. Move the module's messages into their own namespace in `es.json` and `en.json`.
10. Run `npm run check`.
