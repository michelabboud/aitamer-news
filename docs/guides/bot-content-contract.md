# Content contract for the bots (for their Chief of staff)

Written 2026-10-01 for the desk bots' Chief of staff. Michel's standing rule: the bots are allowed to publish, and nothing here blocks them. Until the posts MCP is live they open pull requests; once it is live, nobody but the MCP publishes. The same article contract then applies to what the MCP accepts. **Specimen ownership changed 2026-10-05:** every producer, including the Desk, MCP integrations, our writers, Grok and manual publishers, submits article content and chooses Habitat; normal editorial metadata is still required. Only the trusted site workflow supplies permanent specimen numbers and writes the specimen ledger. The [admission guide](workflow-owned-specimens.md) records rollout status; never resume local numbering while activation is pending.

**What the bots are (Michel, 2026-10-02):** helpers that keep the site publishing when the editor is out of tokens. Three rules follow from that:

1. **Independent.** A bot finishes a post alone: it writes it, makes and uploads its hero, picks a free slot, runs the checks and opens the pull request, without asking the editor for any step. If it cannot (no upload credential, a red check it cannot fix), it hands the draft over and says exactly what is missing.
2. **Never the template.** Pages, layouts, components, styles, scripts, workflows and configuration are not the bots' to change. The only `public/` exception is a separate image-only proposal under the owner approval process below; bots cannot authorize or merge it independently. Article heroes still never go in `public/heroes/`.
3. **Our way.** A post written the house way passes `npm run preflight` (section 6) on the first run. The style rules it checks are in sections 2 and 6.

## Owner-requested image updates

When asked to update a portrait, avatar or other supported image, open a separate image-only PR on `images/<description>`. Keep it separate from article submissions and numbering. The [image approval guide](owner-image-approval.md) lists supported raster assets, sanitized SVG diagrams and permitted image metadata fields. Code, templates, author identity, article text, dates and numbering remain outside this path.

The owner uses **Actions → Approve image PR → Run workflow** on `main`, supplying the PR number and full reviewed commit SHA. This visible control works independently of GitHub's review button. Update the branch from main before asking for authorization; a later push or moving main requires another exact-head authorization. Observation checks grant no merge permission. Wait for the owner's workflow to issue all three required certificates, then the authorized owner may merge normally.

Changed remote avatars must already be uploaded to the existing owned media hosts and answer HTTP 200 with the expected image type. This workflow uploads nothing and does not broaden article or hero publishing permissions.

## 0. Read this first: what has broken the site, and how to not do it again

On 2026-10-02 five bot posts (`litellm-lens`, `zyte-mcp`, `astabrief-8b`, `supabase-acquiring-turso`, `clickhouse-managed-postgres-direct-io-backups`) were merged with `heroImage: /heroes/<slug>.jpg` and the image committed under `public/heroes/`. The check refused it (section 3 already said so), the pull requests were merged anyway, and **every deploy failed for about an hour**: the site stayed on its last good version, but no new post and no fix shipped. The editor repaired it by hand (uploading the images to the media host). The rules that would have prevented it:

1. **A red check means do not merge.** The required source work is preflight, `npm run check:candidate -- --base <full-origin-main-SHA>`, `npm run check:media` and `npm test`, with truthful evidence. Strict `check:posts` and the build must pass on the workflow-generated numbered tree before its merge. A source PR pending numbering is never merged directly. If it is red, fix the cause or hand the post to the editor. Never merge on red, and never "merge now, fix later": a red `main` stops publishing for everyone, Mai, Foxy, Quill and the other bots included.
2. **Heroes live on the media host, never in the repository.** Upload first, then write `heroImage: https://media.aitamer.news/heroes/<slug>.jpg` (or the hashed form `<slug>-<8 lowercase hex>.jpg`). `public/heroes/` must not exist. Section 3 has the routes.
3. **Every post has a hero.** It is the site's signature (Michel, 2026-10-02). A short post gets one too. A post without a hero shows an old generic cover and a poor share card.
4. **Evergreen posts take a free half-hour slot; news does not wait for one.** The scheduled evergreen queue publishes one post every 30 minutes (checked at :07 and :37), so for an evergreen post run `npm run preflight -- --next-slot` and use a free time on the grid; never a slot the schedule note (`docs/plans/`) reserves for a named writer. **News bursts (from the backoffice or the desk bots) are separate:** set `pubDate` to the time the news should go live (now, at most three hours ahead), off the grid if you like, and run `npm run preflight -- --news`. The publisher takes every post due at a check in one deploy, so a burst never has to wait for the evergreen queue and never pushes it.
5. **When the Editor in chief says pause, you pause.** No new pull requests, no merges, until the Editor in chief says go. Pausing is never blocked by the "bots may post" rule; that rule means nobody stops a good post, not that a pause can be ignored.
6. **Never share a post's link anywhere before its page answers 200.** Chat apps and social crawlers cache the "not found" result for days, and the shared link then shows no preview. Check `curl -I` first.
7. **Ordinary article submissions do not touch other people's posts, the template, or `public/`.** Their lane is posts and remote heroes (section 1). Separate image-only proposals may use the narrow [owner approval process](#owner-requested-image-updates); that exception grants no independent authorization or merge rights.

## 1. Your article lane

- In the ordinary article lane, write **posts and their hero images** only. Image updates to existing author/post metadata or approved local assets go in a separate [owner-reviewed image proposal](#owner-requested-image-updates). Neither lane may change the template: no pages, layouts, components, styles, scripts, workflows or configuration. Required checks reject those changes.
- Omit `specimen` for new articles and never change `src/content/specimen-ledger.txt`. Choose valid Habitat (`section`, optional `subsection`) and supply all required article fields, including author, sources, hero and full UTC `pubDate`. Workflow admission alone allocates and repairs permanent identities.
- One pull request per post or per small batch. Do not edit other people's posts (Mai, Quill, Foxy, Ari, Michel).

## 2. What readers see: no working notes

Everything in a post is read by the public: title, description, verdict, wildness lines, headings, body. Never put instructions to yourself or to the next bot there.

- No lines such as "HARD: keep MIT explicit", "HARD fence vs T6", "This is a Desk Bot briefing. Prefer those two primaries only."
- No task codes (T6, T14, R4, D10), no slugs of other briefs, no "fence" notes, no "do not invent..." reminders. If a fact is uncertain, say so in plain words to the reader ("OpenAI has not published the price") instead of a rule to yourself.
- Headings are for readers: "Pricing", "Availability", not "Pricing (HARD)".
- The description is one or two plain sentences, about 160 to 220 characters. The limit is 400, but the front page shows it in full next to the hero.
- `npm run check:posts` prints a warning for each leak (`scripts/check-reader-text.mjs`). It does not fail the pull request, but fix every warning before you open it.

## 3. Hero image

Every new hero requires both a stamped 1600×900 JPEG and its 960-wide WebP, sharing the JPEG hash and basename on the same authorized media host. Follow the single [hero procedure](hero-procedure.md). Both uploads use `If-None-Match: *`; read both public objects back and verify their bytes and image types before submission. Article heroes never belong in the repository. Separate non-hero assets may be proposed only through the [owner image approval process](#owner-requested-image-updates).

Keep the JPEG URL in `heroImage`; the site automatically selects WebP for article heroes, cards and the homepage. JPEG remains the browser format fallback and social/feed image. `npm run check:media` must pass for both. A quality, upload or verification failure holds publication; there is no JPEG-only production exception. A producer or posts uploader that supplies only one format must hand off both files and failure evidence instead of proceeding.

Every new hero carries one visible site mark and truthful `heroAlt` after visual inspection. The canonical procedure owns marking, style, originals and the conversion details. Use the appropriate owned media host and a new content-hashed key for both files. The Grok lane's authorized S3 upload is documented in [its guide](grok-news-posting.md#4-upload-to-the-bot-bucket-and-verify-the-public-url).

## 4. Frontmatter limits (the build fails past these)

title 200, description 400, heroAlt 300, verdict 240, wildness.verified and wildness.claimed 120 each, each tag 60. An unknown field fails the build. Do not submit a new `specimen` or alter an existing identity or the specimen ledger. The trusted admission workflow assigns and repairs numbering. `npm run stamp` is reserved for that workflow, never a producer command.

## 5. Words that break the deploy

- Never write the literal name of a secret variable (for example the Cloudflare API token variable) anywhere in a post. The deploy's secrets guard stops the whole site when it sees one. Write "an API token passed as an environment variable".
- No account ids, keys, tokens or internal hostnames.

## 6. Before you open the pull request

1. Pick the publish time with `npm run preflight -- --next-slot` (add a number for several). It prints the next free half hours in UTC. Slots are one per half hour, on :00 or :30, shared by every writer.
2. Run `npm run preflight -- --files <post-files>` (add `--news` for news), commit only the article files, then `git fetch origin main`. Do not stage the specimen ledger.
3. **`npm run preflight`**: the bots' own gate. It checks every post your branch adds or changes: hero present, on the media host, with `heroAlt`; `pubDate` on the grid and free; no em-dashes in the prose; title under 120, description under 260 and each wildness line under 110 characters; sources present. It also prints notes on "not X, but Y" sentences, question headings and hype words: read them and fix any that is a real break. It exits 1 on a problem. Fix every line before going on.
4. Run `npm run check:candidate -- --base "$(git rev-parse origin/main)"` and `npm test`, with no unresolved reader-text warnings. The candidate check examines committed changes; commit corrections and repeat it before pushing. It issues no number.
5. `npm run check:media` shows both your JPEG and WebP answering 200 with their correct types, and `npm run check:times` passes (it is the check that refuses a repo hero path).
6. Read the post and hero as a reader would and submit source/visual evidence. The owner admits the exact reviewed head through the workflow; technical green does not grant editorial or merge approval. The owner approval review automatically starts admission on the same PR. Only its trusted certified numbered head may merge after strict current-base checks.

## 7. After the posts MCP is live

Once the MCP publishing integration is live, bots hand drafts to it rather than submitting directly. The MCP must follow the same workflow-only identity contract: it submits article data, never writes the permanent ledger or allocates specimens itself. Integration activation is separate evidence; these instructions do not claim it is live.
