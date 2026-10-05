# Content contract for the bots (for their Chief of staff)

Written 2026-10-01 for the desk bots' Chief of staff. Michel's standing rule: the bots are allowed to publish, and nothing here blocks them. Until the posts MCP is live they open pull requests; once it is live, nobody but the MCP publishes. The same article contract then applies to what the MCP accepts. **Specimen ownership changed 2026-10-05:** every producer, including the Desk, MCP integrations, our writers, Grok and manual publishers, submits article content and chooses Habitat; normal editorial metadata is still required. Only the trusted site workflow supplies permanent specimen numbers and writes the specimen ledger. The [admission guide](workflow-owned-specimens.md) records rollout status; never resume local numbering while activation is pending.

**What the bots are (Michel, 2026-10-02):** helpers that keep the site publishing when the editor is out of tokens. Three rules follow from that:

1. **Independent.** A bot finishes a post alone: it writes it, makes and uploads its hero, picks a free slot, runs the checks and opens the pull request, without asking the editor for any step. If it cannot (no upload credential, a red check it cannot fix), it hands the draft over and says exactly what is missing.
2. **Never the template.** Pages, layouts, components, styles, scripts, workflows, configuration and `public/` are not the bots' to change, ever.
3. **Our way.** A post written the house way passes `npm run preflight` (section 6) on the first run. The style rules it checks are in sections 2 and 6.

## 0. Read this first: what has broken the site, and how to not do it again

On 2026-10-02 five bot posts (`litellm-lens`, `zyte-mcp`, `astabrief-8b`, `supabase-acquiring-turso`, `clickhouse-managed-postgres-direct-io-backups`) were merged with `heroImage: /heroes/<slug>.jpg` and the image committed under `public/heroes/`. The check refused it (section 3 already said so), the pull requests were merged anyway, and **every deploy failed for about an hour**: the site stayed on its last good version, but no new post and no fix shipped. The editor repaired it by hand (uploading the images to the media host). The rules that would have prevented it:

1. **A red check means do not merge.** The required source work is preflight, `npm run check:candidate -- --base <full-origin-main-SHA>`, `npm run check:media` and `npm test`, with truthful evidence. Strict `check:posts` and the build must pass on the workflow-generated numbered tree before its merge. A source PR pending numbering is never merged directly. If it is red, fix the cause or hand the post to the editor. Never merge on red, and never "merge now, fix later": a red `main` stops publishing for everyone, Mai, Foxy, Quill and the other bots included.
2. **Heroes live on the media host, never in the repository.** Upload first, then write `heroImage: https://media.aitamer.news/heroes/<slug>.jpg` (or the hashed form `<slug>-<8 lowercase hex>.jpg`). `public/heroes/` must not exist. Section 3 has the routes.
3. **Every post has a hero.** It is the site's signature (Michel, 2026-10-02). A short post gets one too. A post without a hero shows an old generic cover and a poor share card.
4. **Evergreen posts take a free half-hour slot; news does not wait for one.** The scheduled evergreen queue publishes one post every 30 minutes (checked at :07 and :37), so for an evergreen post run `npm run preflight -- --next-slot` and use a free time on the grid; never a slot the schedule note (`docs/plans/`) reserves for a named writer. **News bursts (from the backoffice or the desk bots) are separate:** set `pubDate` to the time the news should go live (now, at most three hours ahead), off the grid if you like, and run `npm run preflight -- --news`. The publisher takes every post due at a check in one deploy, so a burst never has to wait for the evergreen queue and never pushes it.
5. **When the Editor in chief says pause, you pause.** No new pull requests, no merges, until the Editor in chief says go. Pausing is never blocked by the "bots may post" rule; that rule means nobody stops a good post, not that a pause can be ignored.
6. **Never share a post's link anywhere before its page answers 200.** Chat apps and social crawlers cache the "not found" result for days, and the shared link then shows no preview. Check `curl -I` first.
7. **Do not touch other people's posts, the template, or `public/`.** Your lane is posts and their heroes (section 1).

## 1. Your lane

- You write **posts and their hero images** only. You never touch the template: no pages, layouts, components, styles, scripts, workflows or configuration. A required check (`publisher-paths`) fails any pull request that does.
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

- Heroes live on the media host (Cloudflare R2, bucket `aitamer-media`), never in the repository. A path such as `/heroes/<slug>.jpg`, or a `public/heroes/` folder, fails the deploy. The post then says `heroImage: https://media.aitamer.news/heroes/<slug>.jpg`, and `npm run check:media` must show it answering 200 before the pull request is opened.
- **How the file gets there (two routes; use the first that you have):**
  1. **The posts MCP** uploads the hero itself when it publishes a draft that carries one (`atn-ops` docs/runbooks/posts-mcp.md and ADR 0027: a signed S3 `PUT` of `heroes/<slug>.jpg` that never replaces an existing object). This is the route once the MCP is live, and then you do nothing else.
  2. **Before the MCP, with credentials the bot holds**, upload the JPEG to the key `aitamer-media/heroes/<slug>.jpg` with R2's S3 API and a token scoped to that bucket (Object Read and Write). `wrangler r2 object put` will answer 403 with a bucket-scoped token, because Wrangler uses the REST API that such a token cannot call, so do not use it. The reference implementation is the S3 PUT in atn-ops (`posts_publish::r2`, ADR 0027). Send `Content-Type: image/jpeg`, `Cache-Control: public, max-age=86400` and `If-None-Match: *` so you never replace someone else's image.
  3. **If you hold no upload credential, do not open the pull request with a broken hero.** Put the finished 1600 x 900 JPEG where the editor collects it and say so in the hand-off; the editor uploads it and the pull request follows. A post whose hero is missing fails `check:media` and stops the deploy for the whole site.
- Never write anything to `public/heroes/`, and never put the image in the pull request.
- 1600 x 900, JPEG, 16:9.
- House style: layered paper-cut collage, slate blue and cream with a single coral accent, no text, numbers or logos, no recognisable people. Add `heroAlt`: one true sentence saying what the picture shows.

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
5. `npm run check:media` shows your hero answering 200, and `npm run check:times` passes (it is the check that refuses a repo hero path).
6. Read the post and hero as a reader would and submit source/visual evidence. The owner admits the exact reviewed head through the workflow; technical green does not grant editorial or merge approval. Only the workflow-generated numbered PR may merge after strict checks.

## 7. After the posts MCP is live

Once the MCP publishing integration is live, bots hand drafts to it rather than submitting directly. The MCP must follow the same workflow-only identity contract: it submits article data, never writes the permanent ledger or allocates specimens itself. Integration activation is separate evidence; these instructions do not claim it is live.
