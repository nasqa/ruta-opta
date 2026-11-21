---
name: translate-namespace
description: Add or complete an English namespace in messages/en.json from messages/es.json.
---

# Translate namespace

1. Open `apps/landing/messages/es.json` and find the namespace. Spanish is the source.
2. Copy its exact shape into `apps/landing/messages/en.json`: same keys, same nesting, same ICU placeholders.
3. Translate the values into natural English. Keep placeholders such as `{name}` untouched.
4. Do not add, drop or rename keys in English only. Change `es.json` first.
5. A page's namespace in English publishes its `/en` route. Add that URL to `collect.url` in `apps/landing/lighthouserc.json`.
6. Run `npm test`. It fails when an English namespace is incomplete or has no Spanish source, or when Lighthouse misses the new URL.
7. Run `npm run typecheck` to confirm every key resolves.
