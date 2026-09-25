# AI Tamer · aitamer.news

Production-ready **static** Astro news site for [aitamer.news](https://aitamer.news), aimed at **Cloudflare Pages (free tier)**.

- Astro + TypeScript + MDX content collections
- `output: 'static'` (no Cloudflare adapter). The contact form is one Pages Function, not a server-rendered site.
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
src/styles/global.css  # Big Top daylight theme
functions/             # Pages Function for the contact form
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
pubDate: 2026-09-23
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
4. Set `draft: false` to publish. Drafts are excluded from home, section pages, author pages, and `/rss.xml`.
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
5. No `@astrojs/cloudflare` adapter. Pages stays a static upload. `functions/api/contact.js` is the only server code, and `wrangler.toml` is the Pages config (`pages_build_output_dir`) so the email binding deploys with the site.

## Contact form

The About page posts to `https://aitamer.news/api/contact`. Cloudflare Pages runs `functions/api/contact.js`, which sends one plain-text email through the `EMAIL` binding (`send_email` in `wrangler.toml`).

That send needs three things on the Cloudflare account, none of which live in this repo:

1. Onboard `aitamer.news` to Email Routing or Email Sending. The domain has no MX or SPF records today, so onboarding adds those DNS records. It does not replace an existing mailbox.
2. Verify the inbox that should receive notes (Email Routing destination). Sending to a verified destination is on the free plan. General Email Sending to any address is a Workers paid feature, and this form does not need it.
3. Set the Pages secret `CONTACT_TO` to that verified address. The address is not written in the site or in git.

```bash
npx wrangler pages secret put CONTACT_TO --project-name=aitamer-news
```

Local check, without sending real mail:

```bash
printf 'CONTACT_TO=owner@example.com\n' > .dev.vars
npm test
npm run build
npx wrangler pages dev dist --port 8788
```

`.dev.vars` is gitignored. The GitHub Pages copy has the same form and posts it to `aitamer.news`.

## Key routes

| Route | Purpose |
| --- | --- |
| `/` | Latest published posts + section chips |
| `/posts/[slug]` | Article |
| `/section/[section]` | Section listing |
| `/authors/[id]` | Author page |
| `/about/` | About the desk, and the contact form |
| `/api/contact` | Pages Function. Emails the desk. Not a static file. |
| `/rss.xml` | RSS feed |
| `/sitemap-index.xml` | Sitemap (via `@astrojs/sitemap`) |
| `/robots.txt` | Crawler rules |

## Design notes

Daylight paper UI (Big Top): Bricolage Grotesque headlines, Instrument Sans text, Martian Mono labels, rose correction bar, mobile-first cards, **Human** / **AI** badges on every byline. See `docs/big-top.md`.
