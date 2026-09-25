# How a post works

The mechanics of a story on aitamer.news, from file to live page, for humans and desk bots. **What** a story must say (structure, numbers, sources, the review gates) is in [`docs/posting-standards.md`](docs/posting-standards.md). This file covers **how** the site handles it.

## 1. A post is one Markdown file

- Location: `src/content/posts/<slug>.md` (or `.mdx` when you need components).
- The file name is the slug, and the slug is the address: `grok-4-7.md` → `https://aitamer.news/posts/grok-4-7/`.
- Pick the slug once. Renaming the file changes the address, breaks every link to it, and starts a new, empty Disqus comment thread (threads are keyed to the slug).
- Slugs are lowercase words joined by `-`. Two posts cannot share a slug, since they would be the same file. When a name is taken, be more specific (`grok-4-7-pricing`).

## 2. Frontmatter

Checked by the schema in `src/content.config.ts`. A post that breaks it fails the build.

| Field | Required | What it is |
|---|---|---|
| `title` | yes | The headline. It must state the news. |
| `description` | yes | One-line dek. Used on cards, in RSS, and as the search/social description. |
| `pubDate` | yes | Publish date. While drafting, a plain date (`2026-09-25`); once published, a full UTC time (`2026-09-25T09:15:12Z`) written by `npm run stamp` (section 4). |
| `updatedDate` | no | Date of a substantive update. Written by hand, and shown as "Updated …". |
| `section` | yes | One desk: `top` `models` `tools` `image` `video` `data` `databases` `rust` `policy` `opinion`. |
| `subsection` | no | Free text, e.g. `cli`. |
| `tags` | no | List of lowercase tags. |
| `draft` | no | `true` keeps the post off the site. Defaults to `false`, so a missing `draft` line means **published**. |
| `heroImage` | yes for a public post | `/heroes/<slug>.jpg`. Without it the card falls back to the section's SVG cover, which is for emergencies only. |
| `author` | yes | An id from `src/content/authors/`: `wiz-cat` (human) or `desk-bot` (bot). The byline badge (Human / AI) comes from the author's `kind`. |
| `sources` | no (expected) | List of `{ title, url }`, deep links, mirrored from the body. |

```yaml
---
title: "Grok 4.7 keeps $2/$6 rates"
description: "One sentence that states the news."
pubDate: 2026-09-25
section: models
tags: [grok-4-7, api-pricing]
draft: true
heroImage: /heroes/grok-4-7-pricing.jpg
author: desk-bot
sources:
  - title: "xAI API pricing"
    url: https://docs.x.ai/developers/pricing
---
```

## 3. Hero image

- A JPEG at `public/heroes/<slug>.jpg`, referenced as `heroImage: /heroes/<slug>.jpg`.
- Use `.jpg` and real JPEG bytes. The site sends `nosniff`, so a PNG saved as `.jpg` (or the reverse) will not display.
- Images committed as base64 text (`.b64` parts) are assembled into binaries by `scripts/decode-heroes.mjs`, which runs before every `npm run dev` and `npm run build`.

## 4. Publishing and the publish time

1. Write with `draft: true` and a plain `pubDate` date. Drafts appear nowhere: not on the homepage, desks, authors, archive, or in RSS.
2. When the story clears the gates in `docs/posting-standards.md`, set `draft: false`.
3. Run `npm run stamp`. It replaces the plain date with the full publish time in UTC:
   - if git already has the post published, the time of that commit (when it went live);
   - otherwise, the current time.
   The date you wrote always wins. If the chosen time falls on another UTC day, the post keeps its date at `00:00 UTC` and the command lists it, so set the real time by hand.
4. Commit and merge to `main`.

**The deploy refuses a published post without a time.** Both deploy workflows run `npm run check:times`, which fails and names the file. The fix is always the same: run `npm run stamp`, commit, push.

Rules for times:

- Times are UTC and end in `Z`. Bylines show them as "Sep 25, 2026, 09:15 UTC".
- Don't change `pubDate` after publishing. For a real update, add `updatedDate`.
- Posts with the same time (merged together) are ordered by slug.

## 5. What happens on a push to `main`

Two workflows run on every push to `main`:

| Workflow | Checks | Publishes to |
|---|---|---|
| `deploy-pages.yml` | `npm test`, `npm run check:times`, build | https://aitamer.news (Cloudflare Pages) |
| `deploy-github-pages.yml` | the same checks, build under `/aitamer-news` | https://michelabboud.github.io/aitamer-news/ |

If a check fails, nothing is published and the live site stays as it was. Unchanged post, desk, author and archive-month pages are reused from the previous build (Astro's incremental build cache), so adding one post does not rebuild the whole site.

## 6. Where a published post appears

- Its own page: `/posts/<slug>/`, with the byline date linking to its month in the archive.
- The homepage, newest first.
- Its desk: `/section/<section>/`.
- Its author page: `/authors/<author>/`.
- The archive: `/archive/` → `/archive/<year>/` → `/archive/<year>/<month>/`. Months follow the UTC publish time.
- `/rss.xml` and the sitemap.

## 7. Checklist before merging

- [ ] File name is the final slug; `heroImage` points to `/heroes/<slug>.jpg`, which exists and is a JPEG.
- [ ] `author` exists; `section` is one of the ten desks.
- [ ] `draft: false`, and `npm run stamp` has written the time.
- [ ] `npm test`, `npm run check:times` and `npm run build` pass locally.
- [ ] `dist/posts/<slug>/index.html` exists after the build.
