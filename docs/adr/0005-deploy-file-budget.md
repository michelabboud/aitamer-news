# The deploy has a file budget, and search stays full-text over every story

## Context

Cloudflare's free plan accepts at most **20,000 files per deploy** (Pages and Workers static assets alike; 100,000 on Workers Paid at about $5 a month). The site is built to reach 10,000 posts on the free plan, and Michel's direction is to use the free tier as long as possible and pay the $5 only when growth needs it.

Each post costs about three deploy files: its page, its hero JPEG (`public/heroes/`), and, since search landed in 0.1.20, its Pagefind fragment (`dist/pagefind/fragment/`). Around 60 more files are fixed (home, habitats, archive, feeds, the Pagefind runtime). The batch B–C deep review (`docs/reviews/2026-09-25-batch-bc-deep-review.md`, N3) measured it and corrected the earlier estimate:

| Where the images and index live | Files per post | Posts before the 20,000 cap |
|---|---|---|
| Heroes and index in the deploy (today) | ~3 | ~6,600 |
| Heroes on R2, index in the deploy | ~2 | ~9,900 |
| Heroes and index on R2 | ~1 | ~19,900 |

## Decision

1. **Keep full-text search over every story.** Old stories are what a reader searches for; indexing only the newest N would make search forget the archive.
2. **Guard the budget in CI.** `npm run check:files` (`scripts/check-dist-files.mjs`) runs after every build in the deploy: it warns from 16,000 files and fails from 19,500, before Cloudflare rejects the deploy with a less helpful error.
3. **Move in this order when the warning fires:**
   1. Hero images to **R2** (free: 10 GB, no egress fees). The post contract already accepts `https://` hero URLs (ADR 0004), so this is a storage move plus a one-time rewrite of `heroImage` values, done by atn-mcp.
   2. Then, if still needed, the Pagefind index to R2 (Pagefind's UI takes a `bundlePath`), or Workers Paid for the 100,000-file cap, whichever is simpler at that time.

## Alternatives rejected

- **Index only the newest N posts.** Keeps the file count flat, but search silently loses the archive, and every new post changes an old post's page (it drops out of the index), which works against the incremental build.
- **Move to Workers Paid now.** Costs money before it is needed, against Michel's free-first direction.
- **Drop search.** The design and readers want it; the cost is known and bounded.

## Consequences

- Today's ceiling is about 6,600 posts, not 10,000, until heroes move to R2. `BACKLOG.md` carries the move with the right threshold.
- A deploy can now fail for size, loudly and early, with the fix named in the message.
- The Pagefind vetting report (`docs/reports/2026-09-25-pagefind-vetting.md`) is extended with the file cost.

## Status

Accepted, 2026-09-25.
