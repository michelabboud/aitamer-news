# Progress

## Where the site is (2026-09-25)

- **Live:** https://aitamer.news (Cloudflare Pages) and the mirror https://michelabboud.github.io/aitamer-news/ (GitHub Pages). A push to `main` deploys both.
- **Content:** 28 posts across the Models, Tools, Image, Video, Data, Databases, Rust, Policy and Opinion desks, each with a house hero image. Two authors: `wiz-cat` (human) and `desk-bot` (bot).
- **Site features:** the Bestiary theme (habitats, specimen numbers, wildness ratings, Extinction Watch), human/AI byline badges, Disqus comments, Google Analytics on the main domain only, RSS, sitemap, incremental Astro builds.

## Log

- **2026-09-25** — 0.2.0: the Bestiary redesign (Claude Design Concept 2). Dark field-station theme, seven habitats, wildness ratings and verdicts on every post, Extinction Watch, the Campfire, a phone tab bar.
- **2026-09-25** — 0.1.5: About page redesigned around the bot pipeline, with the contact form served by the `contact.aitamer.news` Worker (rate-limited, no API token). Live sending waits on Email Routing, the first Worker deploy, and the `CONTACT_TO` secret. Roomier post cards.
- **2026-09-25** — 0.1.4: desk pages no longer show the desk pills twice.
- **2026-09-25** — 0.1.3: CI on Node 24 and the latest stable GitHub Actions; the Cloudflare deploy uses Wrangler 4.
- **2026-09-25** — 0.1.2: archive by year and month; `POST.md` documents how a post works.
- **2026-09-25** — 0.1.1: publish times stamped into every published post; CI refuses a published post without one.
- **2026-09-25** — Standard repository files added; versioning starts at 0.1.0.
