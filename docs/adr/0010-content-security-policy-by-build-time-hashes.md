# The Content-Security-Policy lists the build's inline scripts by hash, and ships report-only first

## Context

The site sent no Content-Security-Policy. A script that got past the content checks (the post
contract, the rendered-body gate for bot posts, the trust placed in human writers) would run with
the page's full authority. A CSP is the browser-side second line: it names where scripts, frames,
stylesheets, fonts and requests may come from, and refuses the rest.

The site is static on Cloudflare Pages, and its layout and components put small scripts inline:
the analytics bootstrap, the station clock, the Cmd/Ctrl+K and external-link helpers, the comment
form's and the search page's `define:vars` blocks, and the hoisted scripts Astro inlines. Pagefind
compiles WebAssembly. Turnstile, Google Analytics, Google Fonts and the YouTube players come from
other origins. Michel approved a policy on 2026-09-26, starting in report-only mode
(`docs/ideas/2026-09-26-content-security-policy.md`).

## Decision

1. **Inline scripts are allowed by SHA-256 hash, computed from the built HTML.**
   `scripts/csp-headers.mjs` runs as the last step of `npm run build`: it parses every built page
   with parse5, hashes the text of every `<script>` the browser would run (classic, module, import
   map, speculation rules; never a JSON-LD data block), and appends the policy to `dist/_headers`
   after the hand-written rules from `public/_headers`, which it keeps verbatim.
2. **A deploy guard, `npm run check:csp`**, runs after the build in every workflow that builds the
   site, before any upload. It fails when a page has an inline script missing from the policy, an
   inline event handler, a `javascript:` URL, an `<object>`, `<embed>` or `<base>`, a script,
   frame, form or data-attribute endpoint the policy does not name, a path that would receive two
   policies, a Pagefind worker without `'wasm-unsafe-eval'`, a header line over Cloudflare's 2,000
   characters, or a `dist/_headers` that differs from what this build calls for.
3. **One policy for the site, one for Pagefind.** `/*` gets the site policy. `/pagefind/*` and
   `/search/*` get the same policy plus `'wasm-unsafe-eval'`, each detaching the site-wide header
   first (`! <name>`), because Cloudflare joins two values of one header with a comma, which a
   browser reads as two policies that must both pass. `/pagefind/*` is the one that matters:
   Pagefind compiles its WebAssembly in a worker, and a worker is governed by the policy on its
   own response, not the page's. `/search/*` covers Pagefind's main-thread fallback.
4. **Report-only first.** The header is `Content-Security-Policy-Report-Only` while `CSP_ENFORCE`
   in `scripts/csp-headers.mjs` is false; a test pins the value, so enforcing is a reviewed
   two-line change. `upgrade-insecure-requests` is added only when enforcing: browsers ignore it
   in a report-only policy and log an error on every page saying so. There is no `report-uri` or
   `report-to` yet: a collector needs a Worker, which is Michel's decision.

## Alternatives rejected

- **`'unsafe-inline'` in `script-src`.** It allows every injected inline script along with the
  site's own, which is the one thing the policy exists to refuse.
- **Nonces.** A nonce must be new on every response. A static site on Pages serves the same bytes
  to everyone; a nonce would need a Worker in front of every page view (cost, latency, and a
  moving part in the reading path) and would still be the same value to every reader of a cached
  page.
- **Moving every inline script into a bundled file** (so `'self'` alone would do). Cleaner, and
  still worth doing (BACKLOG), but `define:vars` blocks carry per-build values and the analytics
  bootstrap must run before anything else; the hash list gets the protection now without
  restructuring the layout.
- **`'wasm-unsafe-eval'` on the search page only** (the proposal's shape). Measured in Chromium on
  2026-09-26 with the policy enforced: the search page's policy does not reach Pagefind's worker,
  the worker's WebAssembly compile is refused, and search returns nothing. In report-only mode the
  violation is reported only inside the worker, so a check that listens on the page sees nothing.
- **`'wasm-unsafe-eval'` site-wide**, which would avoid the per-path rules. It only permits
  WebAssembly compilation, not JavaScript `eval`, so the cost would be small, but no other page
  needs it and the per-path rules are checked by the guard.
- **A `<meta http-equiv>` policy in the HTML.** It cannot carry `frame-ancestors` or report-only
  mode. It would matter only for a host that cannot send headers, which after the GitHub Pages
  copy's retirement is none.

## Consequences

- Any change to an inline script changes its hash; the build recomputes it, so nobody edits
  hashes by hand. A new inline script on some page is covered automatically, and the guard
  catches a `dist/_headers` that is stale or hand-edited.
- Every page carries every hash (9 today, about 1,200 characters of header). Cloudflare ignores a
  `_headers` line over 2,000 characters; the build fails before that, at roughly 15 more distinct
  inline scripts. The way out is fewer inline scripts, never a truncated policy. A `define:vars`
  block whose values differ per page would add one hash per page and reach the limit fast.
- An inline event handler or `javascript:` URL anywhere, including in a human post's raw HTML,
  fails the build even in report-only mode: enforcement would break it, so it is refused now.
- The guard judges the static HTML. Scripts that load more at run time (gtag's own requests,
  Turnstile's frame, the click-to-load player) are covered only by the browser check recorded in
  the CHANGELOG, and by the report-only period.
- Report-only violations currently reach only the reader's own console. Enforcing without a
  collector means trusting the browser checks and the report-only period seen by maintainers.

## Status

Accepted 2026-09-26 (report-only).
