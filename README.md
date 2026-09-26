# AI Tamer · aitamer.news

Production-ready **static** Astro news site for [aitamer.news](https://aitamer.news), aimed at **Cloudflare Pages (free tier)**.

- Astro + TypeScript + MDX content collections
- `output: 'static'` (no Cloudflare adapter required for Pages)
- Habitats (sections): Models, Tools, Creative, Infra, Rust, Policy, Opinion
- Human / AI byline badges
- RSS + sitemap + robots.txt

## Local development

Requires **Node.js 24** (`.nvmrc`; CI uses 24). Node 22.12 or later still works.

```bash
npm install
npm run dev
```

Open the URL Astro prints (usually `http://localhost:4321`).

```bash
npm run build    # writes static site to dist/
npm run preview  # preview the production build
```

For browser checks of a build on a machine where 4321 is taken, `npx astro preview --host 127.0.0.1 --port 4391` (the port this project claims for local previews).

Hero images load from `https://media.aitamer.news/` by default, so `npm run dev` and `npm run preview` show the same bytes production serves (`src/lib/media.ts`). Working offline, or previewing a draft whose hero is not uploaded yet: set `PUBLIC_MEDIA_BASE=/media-local` and drop the file under the git-ignored `public/media-local/heroes/`; the build rewrites media URLs to that base instead. A hero missing there simply shows as a broken image, same as a hero missing on R2 would.

## Project layout

```
src/content/authors/   # author profiles (Markdown frontmatter)
src/content/posts/     # news posts (Markdown / MDX)
src/pages/             # routes
src/components/        # post card, Wildness meter, specimen tag, Extinction list, video embed
src/layouts/           # BaseLayout
src/styles/global.css  # the Bestiary theme (tokens in bestiary-tokens.css)
```

## Editorial standards

Before drafting or editing posts, read [`docs/posting-standards.md`](docs/posting-standards.md) (structure, numbers, sources, Art/`heroImage` gate).

## How bots (or humans) add posts

The full mechanics — slug, frontmatter, hero image, publish time, CI, where a post appears — are in [`POST.md`](POST.md). The short version:

1. Create a file: `src/content/posts/your-slug.md` (or `.mdx`).
2. Use this frontmatter shape:

```yaml
---
title: Your headline
description: One-line dek / summary.
pubDate: 2026-09-23          # date only while drafting; `npm run stamp` adds the time at publish
updatedDate: 2026-09-24   # optional
section: tools            # models | tools | creative | infra | rust | policy | opinion
subsection: cli           # optional
tags: [briefing, tools]
draft: true               # keep true until ready
heroImage: /heroes/my-post.jpg # /heroes/<slug>.jpg or an https:// URL
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

A push to `main` publishes **https://aitamer.news**. `.github/workflows/deploy-pages.yml` builds with no path prefix and uploads `dist` to Cloudflare Pages. Unchanged article, section, and author pages are copied from the previous build when `node_modules/.astro` is restored. The homepage, about page, and RSS feed are rendered every time.

The build also supports a path prefix (`ASTRO_BASE`, applied through `withBase()` in `src/lib/site.ts`) for a future base-path deployment target; nothing uses it today. A GitHub Pages copy built under that prefix until it was retired on 2026-09-25 — its workflow, `.github/workflows/deploy-github-pages.yml`, is disabled but kept in the repo.

## Cloudflare Pages setup (free tier)

1. Push this repo to GitHub (when you are ready — do not require paid features).
2. In Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → connect the repo.
3. Build settings:
   - **Framework preset:** Astro (or None)
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Node version:** `24` (set `NODE_VERSION=24` in Pages environment variables if needed)
4. Deploy. Then **Custom domains** → add `aitamer.news` (and `www` if you want) and follow DNS instructions.
5. No Wrangler Worker/`@astrojs/cloudflare` adapter is required for this static site. Optional `wrangler.toml` is included only for local static asset preview via Wrangler if you prefer Workers static assets later.

### Optional Wrangler (static assets only)

```bash
npx wrangler pages dev dist
# or, with the included wrangler.toml assets config:
npx wrangler dev
```

## Contact form

The About page form posts to `https://contact.aitamer.news/`, a small Cloudflare Worker in `workers/contact/`. It checks where the post came from, refuses oversized posts, rate-limits (5 notes a minute per visitor, 30 site-wide), cleans the fields, optionally runs Cloudflare Turnstile, and emails the desk through Cloudflare Email. Nothing is stored. Why: `docs/adr/0003-contact-form-runs-on-a-worker.md`.

To make it live, on the Cloudflare account (none of this lives in the repo):

1. Onboard `aitamer.news` to **Email Routing**. The domain has no MX or SPF records today, so this adds them without replacing a mailbox.
2. Add and verify the inbox that should receive notes as an Email Routing **destination address**.
3. Deploy the Worker once, then set its secret:

```bash
npx wrangler login
npx wrangler deploy --config workers/contact/wrangler.toml
npx wrangler secret put CONTACT_TO --config workers/contact/wrangler.toml
```

Later deploys run from CI (`deploy-contact-worker.yml`) when `workers/contact/` changes. The `CLOUDFLARE_API_TOKEN` repository secret needs **Workers Scripts: Edit** and permission for Workers custom domains on `aitamer.news`, as well as Pages.

4. Set `CONTACT_FORM_LIVE` to `true` in `src/lib/site.ts`, in the commit after the Worker's first successful deploy. Until then the About page, the Campfire and the privacy page say the form opens soon instead of pointing readers at a form that would fail.
5. Optional for the contact form, required for comments: create a **Turnstile** widget for `aitamer.news`, put its public site key in `TURNSTILE_SITE_KEY` (`src/lib/site.ts`), and set the secret key on the Worker with `wrangler secret put TURNSTILE_SECRET_KEY`. Set both or neither. The About page's widget declares the action `contact`, and the Worker accepts a token only for that action, solved on `aitamer.news` (so a token solved on the comment form, action `comment`, cannot send a note). The comment form on story pages uses the same site key and needs it: until it is set, story pages say commenting is not set up yet.

**Go-live order: the contact form goes live before comments open.** It is the channel readers use to ask for a comment's removal (the privacy page sends them there), so steps 1–4 come first. Setting `TURNSTILE_SITE_KEY` is what shows the comment form on every story page, so set it only once the contact form answers and `CONTACT_FORM_LIVE` is `true`, and the desk's comments Worker is deployed.

Secrets never reach the static pages: CI runs `npm run check:dist` after every build.

Local check, sending no real mail (Wrangler simulates the email and the rate limits):

```bash
printf 'CONTACT_TO=owner@example.com\nALLOW_LOCAL_ORIGINS=true\n' > workers/contact/.dev.vars
npm run dev:contact                                   # Worker on http://localhost:8787/
PUBLIC_CONTACT_ENDPOINT=http://localhost:8787/ npm run dev   # site on http://localhost:4321/
```

`ALLOW_LOCAL_ORIGINS` exists only in that git-ignored file and is never deployed.

The comment form on story pages posts to `https://comments.aitamer.news/`, the desk's comments Worker (it lives in the desk's private repository; the form fields and the files it reads are documented in `POST.md` section 8 and `ARCHITECTURE.md`). `PUBLIC_COMMENTS_ENDPOINT=http://localhost:8788/ npm run dev` points a local build at a local copy of that Worker.

Reactions under stories (seven, one per reader, `src/components/Reactions.astro`) are built but **off** until the desk's publisher bakes real totals: `REACTIONS_LIVE` in `src/lib/site.ts` turns on the component and the privacy page's paragraph together. A choice posts to `/react` on the same Worker; the totals come from `src/content/reactions/<slug>.json` (`POST.md` section 9).

## Search

`/search/` runs on [Pagefind](https://pagefind.app/), which indexes the built `dist/` and writes its index to `dist/pagefind/` — so search only exists after `npm run build`, never in `npm run dev`. Only story pages are indexed (they carry `data-pagefind-body`); withdrawn posts and every other route are excluded.

## Key routes

| Route | Purpose |
| --- | --- |
| `/` | The field log: latest catch, recent sightings, Extinction Watch, habitat counts |
| `/posts/[slug]` | Article |
| `/section/[section]` | Habitat listing (old desk URLs redirect) |
| `/authors/[id]` | Author page |
| `/archive/`, `/archive/[year]/`, `/archive/[year]/[month]/` | Archive by year and month (UTC publish time) |
| `/about/` | How the desk works, and the contact form |
| `/search/` | Pagefind search (built assets only, see above) |
| `https://contact.aitamer.news/` | Contact Worker. Receives the form and emails the desk. |
| `/rss.xml` | RSS feed |
| `/sitemap-index.xml` | Sitemap (via `@astrojs/sitemap`) |
| `/robots.txt` | Crawler rules |

## Design notes

The Bestiary: a night-shift field station that catalogues wild machines. Every story is a *sighting* with a permanent specimen number, a habitat, a Wildness rating (1 tamed … 5 wild) and a Tamer's verdict; shutdowns feed Extinction Watch. Gloock headlines, Hanken Grotesk reading type, IBM Plex Mono field data, one ember accent on a night ground, and a bot/human tag on every byline. Details: `docs/bestiary.md`.

## License

The code is licensed under the [Apache License 2.0](LICENSE). The articles, author pages, artwork and the AI Tamer name are **not**: they are all rights reserved, as listed in [LICENSE-CONTENT.md](LICENSE-CONTENT.md). See also [NOTICE](NOTICE).
