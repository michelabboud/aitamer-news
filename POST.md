# How a post works

The mechanics of a story on aitamer.news, from file to live page, for humans and desk bots. **What** a story must say (structure, numbers, sources, the review gates) is in [`docs/posting-standards.md`](docs/posting-standards.md). This file covers **how** the site handles it.

## 1. A post is one Markdown file

- Location: `src/content/posts/<slug>.md` (or `.mdx` when you need components).
- The file name is the slug, and the slug is the address: `grok-4-7.md` → `https://aitamer.news/posts/grok-4-7/`.
- Pick the slug once. Renaming the file changes the address, breaks every link to it, and starts a new, empty Disqus comment thread (threads are keyed to the slug).
- Slugs are lowercase words joined by `-`. Two posts cannot share a slug, since they would be the same file. When a name is taken, be more specific (`grok-4-7-pricing`).

## 2. Frontmatter

The schema in `src/content.config.ts` checks field types and the required fields below; a post that breaks it fails the build. `heroImage` is required by the posting standards, not by the schema.

| Field | Required | What it is |
|---|---|---|
| `title` | yes | The headline. It must state the news. |
| `description` | yes | One-line dek. Used on cards, in RSS, and as the search/social description. |
| `pubDate` | yes | Publish date. While drafting, a plain date (`2026-09-25`); once published, a full UTC time (`2026-09-25T09:15:12Z`) written by `npm run stamp` (section 4). |
| `updatedDate` | no | Date of a substantive update. Written by hand, and shown as "Updated …". |
| `section` | yes | One habitat: `models` `tools` `creative` `infra` `rust` `policy` `opinion` (codes H1–H7, defined in `src/lib/habitats.ts`). The retired values `top`, `image`, `video`, `data` and `databases` fail the build; use `opinion`, `creative`, `creative`, `infra` and `infra`. |
| `subsection` | no | Free text, e.g. `cli`. |
| `tags` | no | List of lowercase tags. |
| `draft` | no | `true` keeps the post off the site. Defaults to `false`, so a missing `draft` line means **published**. |
| `heroImage` | yes for a public post | `/heroes/<slug>.jpg`. Without it the card falls back to the section's SVG cover, which is for emergencies only. |
| `author` | yes | An id from `src/content/authors/`: `wiz-cat` (human) or `desk-bot` (bot). The byline badge (Human / AI) comes from the author's `kind`. |
| `sources` | no (expected) | List of `{ title, url }`, deep links, mirrored from the body. |
| `heroAlt` | no (expected) | What the cover art shows, in a sentence, for screen readers and image search. Without it the title is used. |
| `specimen` | written by `npm run stamp` | The permanent, citable specimen number (`No. 0012`). Assigned once in publish order and never reused, even after a post is withdrawn. Never write or change it by hand. |
| `wildness` | no (expected) | How tamed the claims are: `rating` 1 (independently verified) to 5 (vendor claim only), `verified` (what the sources verify, ≤120 characters), `claimed` (what rests on a claim only, ≤120). Leave it out when the post makes no claim to rate, such as a desk note. |
| `verdict` | no (expected) | The Tamer's verdict: one line (≤240 characters) on what the news means for the reader. |
| `sunset` | no | For a story about something going away: `date` (YYYY-MM-DD, UTC), `what` goes away, and `replacement` if the vendor names one. Feeds Extinction Watch. One per post, only when the sunset is the story. |
| `video` | no | A YouTube video to embed: `youtube` (the 11-character video ID, never a URL), `title`, `channel`. Only channels on the desk's allow-list, cleared by a human (the MCP enforces this). |
| `corrections` | no | Dated corrections shown on the post: a list of `{ date, text }`. Add a new entry; never edit or delete an old one. |
| `withdrawn` | no | `{ date, reason }` takes a post down without breaking links: the page stays at its URL with the notice, and the post leaves every list, feed, sitemap and search result. Its specimen number is retired with it. |

**The contract is strict.** An unknown field, at any level, fails the build naming the file, so a typo is never silently dropped. Dates in `sunset`, `corrections` and `withdrawn` must be a YAML date, a plain `YYYY-MM-DD`, or a full UTC timestamp ending in `Z`, never a bare number or `true`/`false`. `heroImage` must be `/heroes/<slug>.jpg` or an `https://` URL with no spaces or quotes. Why: `docs/adr/0004-post-contract-is-strict.md`.

**The contract is versioned and published.** `https://aitamer.news/contract/post.schema.json` is the JSON Schema of these rules, generated from the schema the build itself uses, with `"x-contract-version": 1`; `/contract/v1/post.schema.json` is the same file at a pinned address, so a future breaking change can live at `/contract/v2/` beside it. atn-mcp and atn-ops validate against it before writing.

The field rules above are the **post contract**. atn-ops (the bots), atn-mcp (the posts tool) and human editors all write against it. It only grows: a field is never renamed or given a new meaning.

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
heroAlt: "Paper-cut price tags pinned to a night sky."
wildness:
  rating: 2
  verified: "Rates on xAI's pricing page"
  claimed: "Benchmark jump is xAI's own number"
verdict: "Same price, better agent scores: worth a rerun of your evals."
# Only when the story is about something going away:
# sunset: { date: 2026-10-23, what: "grok-3 API", replacement: "grok-4-7" }
# Only for an allow-listed channel:
# video: { youtube: dQw4w9WgXcQ, title: "Launch talk", channel: "xAI" }
---
```

## 3. Hero image

- A JPEG at `public/heroes/<slug>.jpg`, referenced as `heroImage: /heroes/<slug>.jpg`.
- Use `.jpg` and real JPEG bytes. The site sends `nosniff`, so a PNG saved as `.jpg` (or the reverse) will not display.
- Images committed as base64 text (`.b64` parts) are assembled into binaries by `scripts/decode-heroes.mjs`, which runs before every `npm run dev` and `npm run build`.

## 4. Publishing and the publish time

1. Write with `draft: true` and a plain `pubDate` date. Drafts appear nowhere: not on the homepage, desks, authors, archive, or in RSS.
2. When the story clears the gates in `docs/posting-standards.md`, set `draft: false`.
3. Run `npm run stamp`. It does two things. First it replaces the plain date with the full publish time in UTC:
   - if git already has the post published, the time of that commit (when it went live);
   - otherwise, the current time.
   The date you wrote always wins. If the chosen time falls on another UTC day, the post keeps its date at `00:00 UTC` and the command lists it, so set the real time by hand.

   Then it gives the post its **specimen number**: the next unused number, written as `specimen: N` under `pubDate` and appended to `src/content/specimen-ledger.txt`. Posts stamped together are numbered oldest first, ties by slug. The ledger is append-only: a withdrawn or deleted post keeps its line, so its number is never issued again.
4. Commit the post **and the ledger** together, and merge to `main`.

**Scheduling a post for later.** To have a post go live at a specific future moment instead of as soon as it merges, write a full future UTC time in `pubDate` (e.g. `2026-09-26T08:00:00Z`) with `draft: false`, then run `npm run stamp` — it leaves a full time alone, so yours is kept exactly — and merge as usual. The post stays out of every list, feed, and page until that time passes: `isPublished` requires `pubDate <= build time`, so a build that runs before the moment arrives builds the site without it. An hourly check (`.github/workflows/scheduled-publish.yml`, `scripts/due-posts.mjs`) looks for posts whose full-ISO `pubDate` fell due in roughly the last two hours and triggers the normal deploy when it finds one, so the post actually appears without anyone pushing a new commit at that moment. A **date-only** future `pubDate` is stamped to `00:00:00Z` that day by `npm run stamp` (the deploy refuses a published post without a time), so it goes live at the first hourly check after midnight UTC. `stamp` may also print its "went live on a different day" note for it; for a scheduled post that note is expected and needs no action. The post's **specimen number is assigned when it is stamped** (filing order among already-stamped posts), not when it goes live: a post scheduled for next week and stamped today gets a lower number than one published today and stamped tomorrow.

**The checks refuse a post that breaks the contract.** `npm run check:posts` runs on every pull request and every push to a branch other than `main` (`.github/workflows/check-posts.yml`), and again in the deploy. It fails and names the file when:

- a published post has no time, no specimen number, a number the ledger does not hold, a number another post also carries, or (outside Opinion) no `sources`;
- a post's file name is not a slug, a post sits in a subfolder of `src/content/posts/`, or it has a `slug:` field;
- a post's frontmatter is not valid YAML, or `draft` or `specimen` holds something other than what the contract allows;
- the ledger itself is inconsistent.

For a missing time or number the fix is always the same: run `npm run stamp`, commit the post **and the ledger**, push. `npm run stamp` refuses to run while any post or the ledger has one of these problems. When it runs, it checks everything first, appends the ledger, and only then writes the posts, so a run that fails changes nothing.

**The ledger's format.** One line per event, never edited or removed:

- `0026 slug-a`: number 26 was issued to `slug-a`.
- `0026 slug-b void: collision with slug-a`: the issuance of 26 to `slug-b` is void. `slug-b` may not carry 26, and 26 is never issued again. A number whose every issuance is void belongs to no post.

A void line is the only legal repair, and it is itself an append.

**When two branches pick the same number.** Numbers are issued on branches, so two branches stamped in parallel can both take the next number, say 26. Both append a line at the end of the ledger, so the merge conflicts there, or the pull request check fails on the merged result.

1. Resolve the conflict by keeping **both** lines (`0026 slug-a` and `0026 slug-b`). The check now reports "ledger issues 26 twice".
2. Pick the post that is not yet on `main` (if neither is, the later one). Append a void line for it: `0026 slug-b void: collision with slug-a`.
3. Delete that post's `specimen:` line.
4. Run `npm run stamp`. The post gets the next unused number (27), and the ledger gets `0027 slug-b`.
5. Run `npm run check:posts`, then commit the post and the ledger together.

The same void line repairs a number issued by mistake, for example to a post that should have stayed a draft: append `NNNN slug void: <reason>`, delete the post's `specimen:` line, and stamp again when it is really published. If a stamp run is interrupted after the ledger was appended but before the posts were written, run `npm run stamp -- --restore`: a post with no `specimen:` line whose slug already holds a number in the ledger gets that number back, and the ledger gets no new line. Without `--restore` the stamp refuses, because the same state is what a new story filed under a deleted post's slug looks like, and that story must not inherit the old citable number: give it a new slug instead.

Rules for times:

- Times are UTC and end in `Z`. Bylines show them as "Sep 25, 2026, 09:15 UTC".
- Don't change `pubDate` after publishing. For a real update, add `updatedDate`.
- Posts with the same time (merged together) are ordered by slug.

## 5. What happens on a push to `main`

`deploy-pages.yml` runs on every push to `main`: `npm test`, `npm run check:posts`, the build, `npm run check:dist`, then the upload to https://aitamer.news (Cloudflare Pages). The GitHub Pages copy was retired on 2026-09-25; its workflow is disabled.

If a check fails, nothing is published and the live site stays as it was. Unchanged post, desk, author and archive-month pages are reused from the previous build (Astro's incremental build cache), so adding one post does not rebuild the whole site.

## 6. Where a published post appears

- Its own page: `/posts/<slug>/`, with the byline date linking to its month in the archive.
- The homepage, newest first.
- Its habitat: `/section/<section>/`. The old desk pages (`/section/top/`, `/image/`, `/video/`, `/data/`, `/databases/`) redirect to the habitat that absorbed them.
- Its author page: `/authors/<author>/`.
- The archive: `/archive/` → `/archive/<year>/` → `/archive/<year>/<month>/`. Months follow the UTC publish time.
- `/rss.xml` and the sitemap.

## 7. Checklist before merging

- [ ] File name is the final slug; `heroImage` points to `/heroes/<slug>.jpg`, which exists and is a JPEG.
- [ ] `author` exists; `section` is one of the seven habitats.
- [ ] `draft: false`, and `npm run stamp` has written the time and the specimen number.
- [ ] The ledger (`src/content/specimen-ledger.txt`) is committed with the post.
- [ ] `npm test`, `npm run check:posts` and `npm run build` pass locally.
- [ ] `dist/posts/<slug>/index.html` exists after the build.
