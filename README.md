# AI Tamer · aitamer.news

Production-ready **static** Astro news site for [aitamer.news](https://aitamer.news), aimed at **Cloudflare Pages (free tier)**.

- Astro + TypeScript + MDX content collections
- `output: 'static'` (no Cloudflare adapter required for Pages)
- Sections: Top, Models, Tools, Image, Video, Data, Databases, Rust, Policy, Opinion
- Human / AI byline badges
- RSS + sitemap + robots.txt

## Local development

Requires **Node.js ≥ 22.12**.

```bash
npm install
npm run dev
```

Open the URL Astro prints (usually `http://localhost:4321`).

```bash
npm run build    # writes static site to dist/
npm run preview  # preview the production build
```

## Project layout

```
src/content/authors/   # author profiles (Markdown frontmatter)
src/content/posts/     # news posts (Markdown / MDX)
src/pages/             # routes
src/components/        # PostCard, badges, chips
src/layouts/           # BaseLayout
src/styles/global.css  # editorial dark theme
```

## Editorial standards

Before drafting or editing posts, read [`docs/posting-standards.md`](docs/posting-standards.md) (structure, numbers, sources, Art/`heroImage` gate).

## How bots (or humans) add posts

1. Create a file: `src/content/posts/your-slug.md` (or `.mdx`).
2. Use this frontmatter shape:

```yaml
---
title: Your headline
description: One-line dek / summary.
pubDate: 2026-09-23          # date only while drafting; `npm run stamp` adds the time at publish
updatedDate: 2026-09-24   # optional
section: tools            # top | models | tools | image | video | data | databases | rust | policy | opinion
subsection: cli           # optional
tags: [briefing, tools]
draft: true               # keep true until ready
heroImage: /images/foo.jpg # optional
author: desk-bot          # must match an authors/*.md id
sources:                  # optional
  - title: Example source
    url: https://example.com
---

Body copy in Markdown…
```

3. Author ids today: `wiz-cat` (human), `desk-bot` (bot). Add more under `src/content/authors/`.
4. Set `draft: false` to publish, then run `npm run stamp`. It writes the publish time into `pubDate` (UTC, e.g. `2026-09-23T17:51:26Z`); the deploy fails if a published post has no time. Drafts are excluded from home, section pages, author pages, and `/rss.xml`.
5. Run `npm run build` and confirm `/posts/your-slug/` exists in `dist/`.

## Publishing

A push to `main` publishes two copies.

1. **https://aitamer.news** is the main site. `.github/workflows/deploy-pages.yml` builds with no path prefix and uploads `dist` to Cloudflare Pages. Unchanged article, section, and author pages are copied from the previous build when `node_modules/.astro` is restored. The homepage, about page, and RSS feed are rendered every time.
2. **https://michelabboud.github.io/aitamer-news/** is the GitHub Pages copy. `.github/workflows/deploy-github-pages.yml` builds the same site with `ASTRO_BASE=/aitamer-news` so links work under that project path. Canonical URLs in the HTML still point at `https://aitamer.news`.

GitHub Pages has to use **GitHub Actions** as its source. “Deploy from a branch” runs Jekyll on the Astro source and the build fails. The GitHub Pages site is public even though this repository is private.

## Cloudflare Pages setup (free tier)

1. Push this repo to GitHub (when you are ready — do not require paid features).
2. In Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → connect the repo.
3. Build settings:
   - **Framework preset:** Astro (or None)
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Node version:** `22` (set `NODE_VERSION=22` in Pages environment variables if needed)
4. Deploy. Then **Custom domains** → add `aitamer.news` (and `www` if you want) and follow DNS instructions.
5. No Wrangler Worker/`@astrojs/cloudflare` adapter is required for this static site. Optional `wrangler.toml` is included only for local static asset preview via Wrangler if you prefer Workers static assets later.

### Optional Wrangler (static assets only)

```bash
npx wrangler pages dev dist
# or, with the included wrangler.toml assets config:
npx wrangler dev
```

## Key routes

| Route | Purpose |
| --- | --- |
| `/` | Latest published posts + section chips |
| `/posts/[slug]` | Article |
| `/section/[section]` | Section listing |
| `/authors/[id]` | Author page |
| `/about/` | About stub |
| `/rss.xml` | RSS feed |
| `/sitemap-index.xml` | Sitemap (via `@astrojs/sitemap`) |
| `/robots.txt` | Crawler rules |

## Design notes

Dark, editorial UI: Source Serif headlines, IBM Plex Sans UI, deep teal accent (`#1fa6a0`), muted meta, mobile-first cards, **Human** / **AI** badges on every byline.
