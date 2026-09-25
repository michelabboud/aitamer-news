# Architecture

aitamer.news is a static news site. Astro renders every page to HTML at build time; there is no server-rendered page and no database.

## Build

- **Framework:** Astro 7, `output: 'static'`, MDX and sitemap integrations (`astro.config.mjs`).
- **Content:** Astro content collections defined in `src/content.config.ts`.
  - `src/content/posts/*.md(x)` — articles. `draft: true` keeps a post off every listing, author page, and the RSS feed.
  - `src/content/authors/*.md` — author profiles; a post's `author` must match one.
- **Routes** (`src/pages/`): home, `/posts/[slug]`, `/section/[section]`, `/authors/[id]`, `/archive/` + `/archive/[year]/` + `/archive/[year]/[month]/` (month grouping in `src/lib/archive.ts`, UTC), `/about/`, `/privacy/`, `/terms/`, `/rss.xml`.
- **Shared code:** `src/lib/site.ts` (site constants, sections, `withBase()` for the path prefix), `src/lib/covers.ts` (hero/cover selection), `src/layouts/BaseLayout.astro`, `src/components/`.
- **Styling:** `src/styles/big-top-tokens.css` and `src/styles/global.css` — the Big Top daylight theme, described in `docs/big-top.md`.
- **Publish times:** `pubDate` holds a full UTC time for every published post, written by `scripts/stamp-post-times.mjs` (`npm run stamp`) from git history; `npm run check:times` enforces it in both deploy workflows. Listings sort newest first, ties broken by post id.
- **Hero images:** JPEGs in `public/heroes/`. `scripts/decode-heroes.mjs` runs before every dev/build to assemble any base64-encoded hero parts into binaries.
- **Incremental build:** `experimental.incrementalBuild` reuses HTML for unchanged pages when `node_modules/.astro` is restored from the CI cache. Build concurrency must stay at 1 or Astro disables the cache.

Only `src/pages/` and `public/` reach the published `dist/`. Repository documents (`*.md` in the root, `docs/`) are never published.

## Publishing — one build, two destinations

| Destination | Workflow | Build settings |
|---|---|---|
| https://aitamer.news (Cloudflare Pages, project `aitamer-news`) | `.github/workflows/deploy-pages.yml` — runs `npm test` and `check:times`, builds, runs `check:dist`, uploads `dist/` | defaults: site `https://aitamer.news`, base `/` |
| https://contact.aitamer.news/ (contact Worker `aitamer-contact`) | `.github/workflows/deploy-contact-worker.yml`, only when `workers/contact/**` changes | `workers/contact/wrangler.toml` |
| https://michelabboud.github.io/aitamer-news/ (GitHub Pages) | `.github/workflows/deploy-github-pages.yml` | `ASTRO_SITE=https://michelabboud.github.io`, `ASTRO_BASE=/aitamer-news` |

Both trigger on a push to `main`. Canonical URLs on both copies point at `https://aitamer.news`. Google Analytics loads only on the main domain.

## Server code — the contact Worker

The site itself is static files only (no `functions/`, no Astro adapter). The one piece of server code is a separate Cloudflare Worker, `aitamer-contact`, on its own hostname `https://contact.aitamer.news/`, deployed from `workers/contact/`.

- `workers/contact/src/index.mjs` — entry; answers only `/`, 404 elsewhere. Exports nothing but the handler: workerd treats every named export of the entry module as an entrypoint and refuses to start on anything else.
- `workers/contact/src/handler.mjs` — the checks, cheapest first: method → origin allowlist → body size (≤ 32 KB, before reading) → rate limits (5/min per IP, 30/min site-wide; fails closed without the bindings) → parse → Turnstile (when its secret is set) → send. JSON answers for `fetch`, a 303 back to the About page for a plain submit.
- `workers/contact/src/message.mjs` — field limits, cleaning (control characters stripped, one-line names, strict addresses), honeypot, and the letter (From `desk@aitamer.news`, Reply-To the visitor).
- `workers/contact/src/turnstile.mjs` — server-side Turnstile check (5 s timeout; any failure is a rejection).
- `workers/contact/wrangler.toml` — custom domain, `send_email` binding (sender locked to the desk address), two rate-limit bindings; `workers.dev` and preview URLs off.
- `workers/contact/test/contact.test.mjs` — part of `npm test`.

Secrets (`CONTACT_TO`, optional `TURNSTILE_SECRET_KEY`) are Worker secrets. The site build never has them; `npm run check:dist` fails CI if a secret name or a known secret value appears in `dist/`. The form's address is `CONTACT_ENDPOINT` in `src/lib/site.ts` (override with `PUBLIC_CONTACT_ENDPOINT` for local work). Deploys: `.github/workflows/deploy-contact-worker.yml`, only when `workers/contact/**` changes. Why this design: `docs/adr/0003-contact-form-runs-on-a-worker.md`.

## Third parties in the browser

- **Disqus** (`src/components/Comments.astro`, `CommentCount.astro`) — per-story comment threads, keyed to the canonical URL.
- **Google Analytics** (GA4) — main domain only.
- **Google Fonts** — Bricolage Grotesque, Instrument Sans, Martian Mono.

## Decisions

Recorded under `docs/adr/` (index: `docs/adr/README.md`). Editorial rules for posts: `docs/posting-standards.md`.
