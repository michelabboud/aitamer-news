# Security

## Reporting a vulnerability

Please report security problems privately, not in a public issue:

- **Preferred:** GitHub's private vulnerability reporting on this repository (Security tab → "Report a vulnerability").
- **Or, once it is open:** the contact form at https://aitamer.news/about/#contact, marked "Security".

Include what you found, where (URL, file, or commit), and how to reproduce it. You will get an answer within a few days. Please give us reasonable time to fix a problem before disclosing it.

## Supported versions

Only the site as currently deployed at https://aitamer.news, built from `main`, is supported.

## In scope

- The static site at aitamer.news and its build (`src/`, `scripts/`, `astro.config.mjs`), including injection through post content, feeds, structured data and search.
- The contact Worker at `contact.aitamer.news` (`workers/contact/`): abuse, rate-limit bypass, header injection, anything that makes it send mail it should not.
- The comments Worker at `comments.aitamer.news`: it is ours, not a vendor's, so a way past its moderation queue, its rate limits, or its checks on a submitted comment is in scope here too. Report through the same channels above.
- The GitHub Actions workflows (`.github/workflows/`) and anything that could expose a deploy secret.

## Trust model

Posts are written by the desk's own bots, the posts tool and editors, all trusted writers. The post contract (`POST.md`, strict JSON Schema) blocks malformed data and dangerous link schemes, and everything rendered from frontmatter is escaped; but Markdown bodies may contain raw HTML by design, so a writer with commit access can publish arbitrary markup. Protection against that sits upstream: only the maintainer can push, and pull requests from outside run no deploy. A bot's post additionally passes the rendered-body gate below, because a bot copies untrusted text from the web.

## Bot posts: the rendered-body gate

Bots write post bodies from untrusted web content, so a bot post gets a check a human post does not. The build renders every post whose `author` is a bot (an author file under `src/content/authors/` with `kind: bot`; `desk-bot` today) with the site's own Markdown pipeline, and checks the **rendered HTML** against an exact allowlist (`scripts/check-rendered-body.mjs`, `scripts/rendered-body-allowlist.mjs`; ADR 0009):

- only the elements Markdown produces, each with only the attributes and value shapes the site's renderer writes (Shiki's code blocks for the pinned theme, footnotes, task lists, table alignment); anything else, raw HTML included, is refused;
- links: `http`, `https`, `mailto`, a `/path` or a `#fragment`, judged after the HTML parser decodes entities, never protocol-relative, never with a user name or password;
- images: only `https://media.aitamer.news/…`, never through Astro's image pipeline;
- heading ids in the slugger's shape, never empty, and never one on the protected list (no DOM clobbering). The list covers the ids and `window` globals of the site's own code on the story page (its layout, components and scripts; a test fails when that code adds one), plus the third-party globals we know gtag.js and Turnstile read. It is not a list of everything a third-party script might read: a new third-party script needs its globals added by hand.

The HTML is parsed with a spec-conformant parser (parse5), never a regex, inside a stand-in for the whole story page, so a body that reaches the page's `<html>`, `<head>` or `<body>`, or closes one of the page's own elements, is refused; any parse error is refused too. The render runs in a child process with a timeout and a memory cap; a render error, a timeout or an exhausted cap is a finding. `npm run check:posts` runs it before the build; after the build, `npm run check:bodies:build` checks the HTML the build stored for those posts and fails unless the checker renders every post exactly as the build did and every built story page places the body exactly where the check's stand-in of the page does. At least one page must have had that placement checked, and a post that was published when the site was built (by the routes' own rule, `isLive` in `src/lib/schedule.ts`, against the build's clock) must have its page. Both run on every pull request (`check-posts.yml`) and in every workflow that builds the site to publish it (`deploy-pages.yml`, and the retired, manual-only `deploy-github-pages.yml`), before any upload; a test fails if a workflow builds the site without them; any finding fails the job and nothing deploys. The posts tool runs the same check before it validates or publishes.

**Human posts are not gated** (the trust model above is unchanged): editors may still use raw HTML. `node scripts/check-rendered-body.mjs --all` reports what the gate would say about every post. One bot post from before the gate, `made-on-youtube-2026-gemini-ask-studio.md`, embeds two YouTube players as raw `<iframe>`s; it is exempt from exactly those two findings, and only while the file is byte-for-byte unchanged (`GRANDFATHERED_POSTS`, pinned by SHA-256). If the file changes in any way, the exemption is void and the build fails until the entry is removed, so the exception cannot quietly outlive an edit. Nothing new is ever added to that list. A way to get markup past this gate in a bot post is in scope.

## Content-Security-Policy

Every response from aitamer.news carries a Content-Security-Policy, **in report-only mode** since 2026-09-26: browsers report what the policy would refuse (today in the reader's own console, since there is no report collector) and block nothing. It is a second line behind the content checks above, not a replacement for them. Decision record: `docs/adr/0010-content-security-policy-by-build-time-hashes.md`.

**How it is produced.** `public/_headers` holds only hand-written rules. The last step of `npm run build` is `scripts/csp-headers.mjs`: it parses every built page with parse5, takes the SHA-256 of the text of every inline `<script>` a browser would run (JSON-LD data blocks never run and get no hash), and appends the policy to `dist/_headers` after the hand-written rules. Nobody writes a hash by hand; a changed script gets a new hash on the next build. `'unsafe-inline'` is never in `script-src`.

**The policy** (the hash list is the build's; the rest is fixed in `directives()`):

```
default-src 'self'; script-src 'self' 'sha256-…' https://challenges.cloudflare.com https://www.googletagmanager.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: https:; connect-src 'self' https://comments.aitamer.news https://contact.aitamer.news
https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com;
frame-src https://challenges.cloudflare.com https://www.youtube-nocookie.com https://www.youtube.com;
form-action 'self' https://comments.aitamer.news https://contact.aitamer.news; object-src 'none'; base-uri 'none';
frame-ancestors 'none'
```

| Origin | Directive | Used by |
|---|---|---|
| `https://challenges.cloudflare.com` | `script-src`, `frame-src` | Turnstile: `api.js` on the About page's contact form and every comment form; the widget is its iframe |
| `https://www.googletagmanager.com` | `script-src`, `connect-src` | gtag.js, injected by the layout's analytics bootstrap on aitamer.news only |
| `https://*.google-analytics.com`, `https://*.analytics.google.com` | `connect-src` | gtag's measurement requests (Google's published GA4 CSP guidance; the browser check saw `www.google-analytics.com`) |
| `https://fonts.googleapis.com` / `https://fonts.gstatic.com` | `style-src` / `font-src` | the layout's Google Fonts stylesheet and the font files it loads |
| `https://comments.aitamer.news` | `connect-src`, `form-action` | the comment form (it `fetch`es its `action`), and reactions when they go live |
| `https://contact.aitamer.news` | `connect-src`, `form-action` | the About page's contact form |
| `https://www.youtube-nocookie.com` | `frame-src` | `VideoEmbed`'s click-to-load player |
| `https://www.youtube.com` | `frame-src` | only the grandfathered post with raw iframes (`made-on-youtube-2026-gemini-ask-studio`); drop it when that post moves to the `video:` field |
| any `https:` image | `img-src` | human posts may use any image host; bot posts only `media.aitamer.news` (the gate above) |

`style-src 'unsafe-inline'` is there for Shiki's and the tables' `style` attributes; inline styles carry no script, and the rendered-body gate constrains them in bot posts.

**Pagefind.** `/pagefind/*` and `/search/*` get the same policy plus `'wasm-unsafe-eval'`. Pagefind compiles its WebAssembly in a worker (`/pagefind/pagefind-worker.js`), and a worker obeys the policy on its own response, not the page's; the search page's copy covers Pagefind's main-thread fallback. Each of those rules detaches the site-wide header first (`! Content-Security-Policy-Report-Only`): Cloudflare joins two values of one header with a comma, and a browser reads that as two policies that must both pass.

**The guard.** `npm run check:csp` runs after the build in `check-posts.yml` and both deploy workflows, before any upload (a test fails if a workflow that builds the site does not run it). It fails when a built page has an inline script missing from the policy, an inline event handler (`onclick=…`), a `javascript:` URL, an `<object>`, `<embed>` or `<base>`, a script, iframe, form action or `data-endpoint`/`data-embed` URL the policy does not name, when a path would get two policies, when Pagefind's worker would lack `'wasm-unsafe-eval'`, when a header line exceeds Cloudflare's 2,000 characters, or when `dist/_headers` is not exactly `public/_headers` plus the policy this build calls for. Event handlers and `javascript:` URLs fail the build itself too: use `addEventListener` in a script.

**Limits.** Every page carries every hash, about 1,200 characters today; the build fails at Cloudflare's 2,000-character line limit, roughly 15 more distinct inline scripts from now. A `define:vars` block whose values differ per page adds one hash per page, so keep per-page values in `data-` attributes read by one shared script. `_headers` applies only on Cloudflare Pages: `astro preview`, `astro dev` and the retired GitHub Pages copy send no policy (serve `dist` with `npx wrangler@4.139.0 pages dev dist` to see it).

**Enforcing.** Set `CSP_ENFORCE = true` in `scripts/csp-headers.mjs` and update the test that pins it (`scripts/csp-headers.test.mjs`, "the report-only switch"). The header becomes `Content-Security-Policy` and gains `upgrade-insecure-requests`, which browsers ignore in report-only mode and log an error about. Do it after a clean report-only period, with a browser pass over the pages listed in the CHANGELOG entry that introduced the policy.

## Out of scope

- Findings that need a compromised maintainer account or machine.
- Third-party services the site loads (Google Analytics, Google Fonts, YouTube when a reader presses play): report those to the vendor.
- Denial of service by traffic volume; Cloudflare handles that layer.
- Missing security headers or best-practice notes with no demonstrated impact (still welcome as ordinary issues).
