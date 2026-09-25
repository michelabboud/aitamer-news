# Progress

## Where the site is (2026-09-25)

- **Live:** https://aitamer.news (Cloudflare Pages). A push to `main` deploys it. The GitHub Pages copy is retired: its workflow was disabled on 2026-09-25 and the last copy there is stale.
- **Content:** 25 published posts (specimens 0001–0025) across seven habitats (Models, Tools, Creative, Infra, Rust, Policy, Opinion), each with a house hero image, a Wildness rating and a verdict (the welcome note has no rating). Two authors: `wiz-cat` (human) and `desk-bot` (bot).
- **Site features:** the Bestiary theme; post contract v1 (strict, versioned, published as JSON Schema); scheduled publishing; Pagefind search; Extinction Watch and Campfire pages; click-to-load YouTube; RSS, JSON Feed, `llms.txt`, sitemaps (general and Google News) and JSON-LD; Disqus comments; Google Analytics on the main domain only; incremental Astro builds.

## Log

- **2026-09-25** — **v0.2.0 released: the Bestiary redesign.** Both release reviewers' blockers fixed (0.1.27–0.1.28): a real 404 page, no stale countdowns in the HTML, no empty headlines in contract v1. The Wildness ratings and verdicts are provisional until Michel's editorial sign-off. Next phase not chosen yet.

- **2026-09-25** — 0.1.7–0.1.21: the Bestiary redesign, phase 1 (plan `docs/plans/2026-09-25-bestiary-redesign.md`): habitats, the post contract with permanent specimen numbers, the theme site-wide, scheduled posts, search, feeds for machines, SEO, and the repo cleaned up to go public. Released as v0.2.0 after 0.1.22–0.1.28 (reviews and fixes).

- **2026-09-25** — 0.1.6: the Bestiary redesign plan is approved and running (`docs/plans/2026-09-25-bestiary-redesign.md`). The Big Top theme is kept at tag `checkpoint/0.1.5` (the branch that held it was removed later). GitHub Pages deploys are switched off.

- **2026-09-25** — 0.1.5: About page redesigned around the bot pipeline, with the contact form served by the `contact.aitamer.news` Worker (rate-limited, no API token). Live sending waits on Email Routing, the first Worker deploy, and the `CONTACT_TO` secret. Roomier post cards.
- **2026-09-25** — 0.1.4: desk pages no longer show the desk pills twice.
- **2026-09-25** — 0.1.3: CI on Node 24 and the latest stable GitHub Actions; the Cloudflare deploy uses Wrangler 4.
- **2026-09-25** — 0.1.2: archive by year and month; `POST.md` documents how a post works.
- **2026-09-25** — 0.1.1: publish times stamped into every published post; CI refuses a published post without one.
- **2026-09-25** — Standard repository files added; versioning starts at 0.1.0.
