---
name: extract-to-package
description: Promote code to packages/<domain> when the second app needs it.
---

# Extract to package

1. Ask Santiago for approval. State the code, both apps and the package name.
2. Create `packages/<domain>/` with a `package.json` named `@ruta-opta/<domain>`, `private: true`, and one `exports` entry per entry point (`./schema`, `./server`, `./ui`) pointing at TypeScript source (just-in-time, no build).
3. Use internal `#` imports inside the package. No project references.
4. Move the code with `git mv`. Named exports only.
5. Declare `"@ruta-opta/<domain>": "*"` in the `package.json` of each app that imports it.
6. Adopt dependency-cruiser with this first package (`npm-no-pkg`, cycles, no app imports another app) if it is not there yet.
7. Add `packages/<domain>` to the Netlify `ignore` of every app that depends on it.
8. Run `npm install`, then `npm run check` and `npm run build`.
