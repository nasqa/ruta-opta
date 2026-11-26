# Pinned analytics script

`plausible-site-script.js.txt` is a byte-for-byte copy of the site's own Plausible script. `analytics-requests.spec.ts` serves it at the
first-party script path (`/o/s.js`), so the spec runs the real tracker in Chromium without any request reaching plausible.io.

| | |
|---|---|
| Source | `https://plausible.io/js/pa-gVAEa_XsPsebKDIjckNPK.js` |
| Fetched | 2026-11-25, after the owner switched outbound links, file downloads and form submissions off in the dashboard |
| Size | 5,972 B; 2,491 B with `gzip -9n` (2,497 B with `gzip -9`, whose header also stores the file name `pa.js`) |
| SHA-256 | `24b5b55518a872865f175c3b23d70cb9b6757df724ef762c813c28a2f449b994` |

## Why it is pinned

The spec proves things about the tracker that production runs: what it sends, what our `transformRequest` removes, and which tags its
parser reads. A copy downloaded at test time would make every run depend on plausible.io and send a request there; a pinned copy makes the
proof repeatable and keeps the tests off real services.

The `.txt` ending is on purpose: the file is third-party data that a test serves, not our source, so TypeScript, ESLint and the
architecture rules leave it alone.

## When to refresh it

The live script is generated per site and changes when the dashboard settings change (its built-in config carries the domain and the
automatic measurements), and when Plausible ships a new tracker version. Refresh the copy after either:

1. Download the site's script: `curl -sS -o /tmp/pa.js https://plausible.io/js/pa-gVAEa_XsPsebKDIjckNPK.js`.
2. Replace `plausible-site-script.js.txt` with it, unchanged.
3. Update the date, sizes and hash above (`wc -c`, `gzip -9n < file | wc -c`, `shasum -a 256`).
4. Build, then run the spec: `npm run build -w apps/landing && npm run e2e -w apps/landing -- analytics-requests.spec.ts`. Its test with the
   bare init must still see the token leak: if it does not, the checker can no longer see a leak, and that is the first thing to fix.

## Licence

The tracker is MIT-licensed, although the rest of the Plausible repository is AGPL-3.0: see `tracker/LICENSE.md` and
`tracker/npm_package/LICENSE.md` in github.com/plausible/analytics, `"license": "MIT"` in `tracker/package.json`, and the README's
"License & Trademarks" section ("we've released the JavaScript tracker which gets included on your website under the MIT license"). The
notice travels with this copy:

```
MIT License

Copyright 2020 Plausible Insights OÜ

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```
