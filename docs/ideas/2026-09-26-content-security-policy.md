# A Content-Security-Policy for aitamer.news — proposal (2026-09-26)

- **Status:** **adopted, report-only**, 2026-09-26 (Michel approved it the same day). The policy as built, with every origin and where it is used, is in `SECURITY.md`, "Content-Security-Policy"; the decision and the alternatives are `docs/adr/0010-content-security-policy-by-build-time-hashes.md`; the generator and guard are `scripts/csp-headers.mjs` (`npm run check:csp`). This page is kept as the proposal it was.
- **What changed from the proposal** once it met a browser and the build:
  - `'wasm-unsafe-eval'` goes on `/pagefind/*` as well as `/search/*`. Pagefind compiles WebAssembly in a worker, which obeys its own response's policy; with only the `/search/*` rule, search breaks when enforced.
  - `style-src` adds `https://fonts.googleapis.com` and a `font-src https://fonts.gstatic.com` is added: the layout loads Google Fonts, which `default-src 'self'` would have refused.
  - `upgrade-insecure-requests` is added only when enforcing (browsers ignore it in report-only mode and log an error on every page).
- **Source:** the S4 deep review, derived from the site's source and a built page. Not yet tested in a browser.

## Why

`public/_headers` sets only Cache-Control, and the site sends no CSP at all. A script that slips past the content gates would run unhindered. A CSP is defence in depth; it does not replace the rendered-output gate.

## Proposed header, `/*`

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'sha256-<one per inline script>' https://challenges.cloudflare.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://comments.aitamer.news https://contact.aitamer.news https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com; frame-src https://challenges.cloudflare.com https://www.youtube-nocookie.com https://www.youtube.com; form-action 'self' https://comments.aitamer.news https://contact.aitamer.news; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; upgrade-insecure-requests
```

`/search/*` also needs `'wasm-unsafe-eval'` in `script-src`, for Pagefind.

## How to roll it out

1. Ship it first as `Content-Security-Policy-Report-Only`, then enforce it once the reports are clean.
2. **Inline scripts** (the analytics bootstrap, the station clock, the external-link marker, the comment form's `define:vars`, and small hoisted scripts) change with every build.
   - A post-build script computes their SHA-256 hashes and writes them into `dist/_headers`.
   - A test fails when a built page has an inline script that is not in the list.
   - `'unsafe-inline'` in `script-src` is never an option: it would throw away exactly the protection wanted.
3. **`style-src 'unsafe-inline'`** is needed for Shiki's and the tables' `style` attributes. The rendered-output gate constrains those values, and inline styles carry no script risk.
4. **`frame-src` includes www.youtube.com** only for the grandfathered iframe post. Drop it when that post moves to the `video:` field.
5. **`img-src https:`** is there because human posts may use any image host. Narrow it if images are ever restricted.
6. **gtag may reach further Google hosts.** The report-only period will show which.
7. **Local wrangler-dev endpoints are unaffected,** because `_headers` applies only on Cloudflare Pages.
8. **The GitHub Pages copy cannot send headers.** It would need a `<meta http-equiv>` tag, and that tag cannot carry `frame-ancestors`.
9. **Reports need a collector.** Cloudflare Pages has none, so this means a small Worker, which also needs Michel's go.
