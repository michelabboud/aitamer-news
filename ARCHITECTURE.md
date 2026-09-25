# Architecture

aitamer.news is a static news site. Astro renders every page to HTML at build time; there is no server-rendered page and no database.

## Build

- **Framework:** Astro 7, `output: 'static'`, MDX and sitemap integrations (`astro.config.mjs`).
- **Content:** Astro content collections defined in `src/content.config.ts`.
  - `src/content/posts/*.md(x)` — articles. `draft: true` keeps a post off every listing, author page, and the RSS feed.
  - `src/content/authors/*.md` — author profiles; a post's `author` must match one.
- **Routes** (`src/pages/`): home, `/posts/[slug]`, `/section/[section]`, `/authors/[id]`, `/about/`, `/privacy/`, `/terms/`, `/rss.xml`.
- **Shared code:** `src/lib/site.ts` (site constants, sections, `withBase()` for the path prefix), `src/lib/covers.ts` (hero/cover selection), `src/layouts/BaseLayout.astro`, `src/components/`.
- **Styling:** `src/styles/big-top-tokens.css` and `src/styles/global.css` — the Big Top daylight theme, described in `docs/big-top.md`.
- **Hero images:** JPEGs in `public/heroes/`. `scripts/decode-heroes.mjs` runs before every dev/build to assemble any base64-encoded hero parts into binaries.
- **Incremental build:** `experimental.incrementalBuild` reuses HTML for unchanged pages when `node_modules/.astro` is restored from the CI cache. Build concurrency must stay at 1 or Astro disables the cache.

Only `src/pages/` and `public/` reach the published `dist/`. Repository documents (`*.md` in the root, `docs/`) are never published.

## Publishing — one build, two destinations

| Destination | Workflow | Build settings |
|---|---|---|
| https://aitamer.news (Cloudflare Pages, project `aitamer-news`) | `.github/workflows/deploy-pages.yml` | defaults: site `https://aitamer.news`, base `/` |
| https://michelabboud.github.io/aitamer-news/ (GitHub Pages) | `.github/workflows/deploy-github-pages.yml` | `ASTRO_SITE=https://michelabboud.github.io`, `ASTRO_BASE=/aitamer-news` |

Both trigger on a push to `main`. Canonical URLs on both copies point at `https://aitamer.news`. Google Analytics loads only on the main domain.

## Third parties in the browser

- **Disqus** (`src/components/Comments.astro`, `CommentCount.astro`) — per-story comment threads, keyed to the canonical URL.
- **Google Analytics** (GA4) — main domain only.
- **Google Fonts** — Bricolage Grotesque, Instrument Sans, Martian Mono.

## Decisions

Recorded under `docs/adr/` (index: `docs/adr/README.md`). Editorial rules for posts: `docs/posting-standards.md`.
