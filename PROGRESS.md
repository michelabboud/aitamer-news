# Progress

## Where the site is (2026-09-25)

- **Live:** https://aitamer.news (Cloudflare Pages). A push to `main` deploys it. The GitHub Pages copy is retired: its workflow was disabled on 2026-09-25 and the last copy there is stale.
- **Content:** 28 posts across the Models, Tools, Image, Video, Data, Databases, Rust, Policy and Opinion desks, each with a house hero image. Two authors: `wiz-cat` (human) and `desk-bot` (bot).
- **Site features:** Big Top daylight theme, human/AI byline badges, Disqus comments, Google Analytics on the main domain only, RSS, sitemap, incremental Astro builds.

## Log

- **2026-09-25** — 0.1.6: the Bestiary redesign plan is approved and running (`docs/plans/2026-09-25-bestiary-redesign.md`). The Big Top theme is kept on branch `archive/big-top-theme`. GitHub Pages deploys are switched off.

- **2026-09-25** — 0.1.5: About page redesigned around the bot pipeline, with the contact form served by the `contact.aitamer.news` Worker (rate-limited, no API token). Live sending waits on Email Routing, the first Worker deploy, and the `CONTACT_TO` secret. Roomier post cards.
- **2026-09-25** — 0.1.4: desk pages no longer show the desk pills twice.
- **2026-09-25** — 0.1.3: CI on Node 24 and the latest stable GitHub Actions; the Cloudflare deploy uses Wrangler 4.
- **2026-09-25** — 0.1.2: archive by year and month; `POST.md` documents how a post works.
- **2026-09-25** — 0.1.1: publish times stamped into every published post; CI refuses a published post without one.
- **2026-09-25** — Standard repository files added; versioning starts at 0.1.0.
