# Architecture

aitamer.news is a static news site. Astro renders every page to HTML at build time; there is no server-rendered page and no database.

## Build

- **Framework:** Astro 7, `output: 'static'`, MDX and sitemap integrations (`astro.config.mjs`).
- **Content:** Astro content collections defined in `src/content.config.ts`.
  - `src/content/posts/*.md(x)` — articles, validated against the strict post contract (`src/content/post-schema.ts`, ADR 0004). A post is live when `draft` is not true and its `pubDate` has passed at build time (`src/lib/schedule.ts`); a future `pubDate` is a scheduled post. `getPostPages()` builds a page for every live post, withdrawn ones included (title and notice only, `noindex`); `getPublishedPosts()` feeds every list, feed, sitemap and the search index and leaves withdrawn posts out.
  - Scheduled posts go live through `.github/workflows/scheduled-publish.yml`: hourly at minute 7 it runs `scripts/due-posts.mjs` and, if a post fell due in the last two hours, dispatches the normal deploy.
  - `src/content/authors/*.md` — author profiles; a post's `author` must match one.
- **Routes** (`src/pages/`): home, `/posts/[slug]`, `/section/[section]` (the seven habitats from `src/lib/habitats.ts`; the five retired desk URLs render a noindex redirect page built by `src/lib/redirect-stub.ts`, and `public/_redirects` gives Cloudflare a real 301 for them), `/authors/[id]`, `/archive/` + `/archive/[year]/` + `/archive/[year]/[month]/` (month grouping in `src/lib/archive.ts`, UTC), `/section/` (habitat index), `/extinction-watch/`, `/campfire/`, `/about/`, `/privacy/`, `/terms/`, `/search/` (noindex; see "Search" below). Machine-readable: `/rss.xml` and `/feed.json` (newest 50), `/llms.txt`, `/contract/post.schema.json` (+ `/contract/v1/`), `/sitemap-index.xml` (no withdrawn or scheduled posts; lastmod per post, `scripts/sitemap-data.mjs`) and `/news-sitemap.xml` (last 48 hours).
- **Shared code:** `src/lib/site.ts` (site constants, sections, `withBase()` for the path prefix), `src/lib/covers.ts` (hero/cover selection), `src/layouts/BaseLayout.astro`, `src/components/`.
- **Styling:** `src/styles/bestiary-tokens.css` and `src/styles/global.css`: the Bestiary night theme, described in `docs/bestiary.md` (the retired Big Top theme is on branch `archive/big-top-theme`). Theme helpers: `src/lib/bestiary.ts`.
- **SEO:** NewsArticle, BreadcrumbList and (for embedded videos) VideoObject JSON-LD on posts, WebSite on the home page, `max-image-preview:large` on indexable pages, `noindex` on withdrawn posts, redirect pages and search.
- **Publish times:** `pubDate` holds a full UTC time for every published post, written by `scripts/stamp-post-times.mjs` (`npm run stamp`) from git history. The same command gives each published post a permanent specimen number from the append-only ledger `src/content/specimen-ledger.txt` (`scripts/stamp-specimens.mjs`; format and repair in `POST.md` section 4). `npm run check:posts` enforces both: in `deploy-pages.yml` before every deploy, and in `check-posts.yml` on every pull request and every push to another branch. The scripts read frontmatter through `scripts/frontmatter.mjs`, which parses it with `js-yaml` the way Astro does, so they never disagree with the build about what a post says. Listings sort newest first, ties broken by post id.
- **Hero images:** JPEGs in `public/heroes/`. `scripts/decode-heroes.mjs` runs before every dev/build to assemble any base64-encoded hero parts into binaries.
- **Incremental build:** `experimental.incrementalBuild` reuses HTML for unchanged pages when `node_modules/.astro` is restored from the CI cache. Build concurrency must stay at 1 or Astro disables the cache.

Only `src/pages/` and `public/` reach the published `dist/`. Repository documents (`*.md` in the root, `docs/`) are never published.

- **Search:** `pagefind@1.5.2` (exact devDependency; vetting: `docs/reports/2026-09-25-pagefind-vetting.md`) runs as `pagefind --site dist` at the end of `npm run build`, after `astro build` has written the HTML — so search exists only after a build, never in `npm run dev`. It walks `dist/` for `data-pagefind-body` (the article element on `src/pages/posts/[slug].astro`; withdrawn posts carry none, so they drop out of the index) and writes the index and a browser search bundle to `dist/pagefind/`. `src/pages/search/index.astro` mounts Pagefind's Default UI from that bundle; the habitat is exposed as both `data-pagefind-filter` and `data-pagefind-meta`, and the specimen number as `data-pagefind-meta`, on the post's kicker line.

## Publishing

| Destination | Workflow | Build settings |
|---|---|---|
| https://aitamer.news (Cloudflare Pages, project `aitamer-news`) | `.github/workflows/deploy-pages.yml` — runs `npm test` and `check:posts`, builds, runs `check:dist`, uploads `dist/` | defaults: site `https://aitamer.news`, base `/` |
| https://contact.aitamer.news/ (contact Worker `aitamer-contact`) | `.github/workflows/deploy-contact-worker.yml`, only when `workers/contact/**` changes | `workers/contact/wrangler.toml` |

Both trigger on a push to `main`. Google Analytics loads only on the main domain.

`ASTRO_SITE` and `ASTRO_BASE` (applied through `withBase()` in `src/lib/site.ts`) still work for a future base-path deployment target, but nothing sets them today. A GitHub Pages copy built with `ASTRO_BASE=/aitamer-news` until it was retired on 2026-09-25; its workflow, `.github/workflows/deploy-github-pages.yml`, is disabled but kept in the repo.

## Server code — the contact Worker

The site itself is static files only (no `functions/`, no Astro adapter). The one piece of server code is a separate Cloudflare Worker, `aitamer-contact`, on its own hostname `https://contact.aitamer.news/`, deployed from `workers/contact/`.

- `workers/contact/src/index.mjs` — entry; answers only `/`, 404 elsewhere. Exports nothing but the handler: workerd treats every named export of the entry module as an entrypoint and refuses to start on anything else.
- `workers/contact/src/handler.mjs` — the checks, cheapest first: method → origin allowlist → body size (≤ 32 KB, before reading) → rate limits (5/min per IP, IPv6 counted per /64; 30/min site-wide; fails closed without the bindings) → parse → Turnstile (when its secret is set) → send. JSON answers for `fetch`, a 303 back to the About page for a plain submit.
- `workers/contact/src/message.mjs` — field limits, cleaning (control characters stripped, one-line names, strict addresses), honeypot, and the letter (From `desk@aitamer.news`, Reply-To the visitor).
- `workers/contact/src/turnstile.mjs` — server-side Turnstile check (5 s timeout; any failure is a rejection).
- `workers/contact/wrangler.toml` — custom domain, `send_email` binding (sender locked to the desk address), two rate-limit bindings; `workers.dev` and preview URLs off; Cloudflare's per-request invocation logs off (they carry visitor IPs, and the privacy page says the count is not kept).
- `workers/contact/test/contact.test.mjs` — part of `npm test`.

Secrets (`CONTACT_TO`, optional `TURNSTILE_SECRET_KEY`) are Worker secrets. The site build never has them; `npm run check:dist` fails CI if a secret name or a known secret value appears in `dist/`. The form's address is `CONTACT_ENDPOINT` in `src/lib/site.ts` (override with `PUBLIC_CONTACT_ENDPOINT` for local work). Deploys: `.github/workflows/deploy-contact-worker.yml`, only when `workers/contact/**` changes. Why this design: `docs/adr/0003-contact-form-runs-on-a-worker.md`.

## Third parties in the browser

- **Disqus** (`src/components/Comments.astro`, `CommentCount.astro`) — per-story comment threads, keyed to the canonical URL.
- **Google Analytics** (GA4) — main domain only.
- **Google Fonts** — Gloock, Hanken Grotesk, IBM Plex Mono.
- **YouTube** — only when a reader presses play on an embedded video (`src/components/VideoEmbed.astro`, youtube-nocookie.com).

## Decisions

Recorded under `docs/adr/` (index: `docs/adr/README.md`). Editorial rules for posts: `docs/posting-standards.md`.
