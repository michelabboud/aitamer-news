# Content contract for the bots (for their Chief of staff)

Written 2026-10-01 for the desk bots' Chief of staff. Michel's standing rule: the bots are allowed to publish, and nothing here blocks them. Until the posts MCP is live they open pull requests; once it is live, nobody but the MCP publishes. The same contract then applies to what the MCP accepts.

## 1. Your lane

- You write **posts and their hero images** only. You never touch the template: no pages, layouts, components, styles, scripts, workflows or configuration. A required check (`publisher-paths`) fails any pull request that does.
- One pull request per post or per small batch. Do not edit other people's posts (Mai, Quill, Foxy, Ari, Michel).

## 2. What readers see: no working notes

Everything in a post is read by the public: title, description, verdict, wildness lines, headings, body. Never put instructions to yourself or to the next bot there.

- No lines such as "HARD: keep MIT explicit", "HARD fence vs T6", "This is a Desk Bot briefing. Prefer those two primaries only."
- No task codes (T6, T14, R4, D10), no slugs of other briefs, no "fence" notes, no "do not invent..." reminders. If a fact is uncertain, say so in plain words to the reader ("OpenAI has not published the price") instead of a rule to yourself.
- Headings are for readers: "Pricing", "Availability", not "Pricing (HARD)".
- The description is one or two plain sentences, about 160 to 220 characters. The limit is 400, but the front page shows it in full next to the hero.
- `npm run check:posts` prints a warning for each leak (`scripts/check-reader-text.mjs`). It does not fail the pull request, but fix every warning before you open it.

## 3. Hero image

- Heroes live on the media host, never in the repository. Upload to `heroes/<slug>.jpg` with the bucket-scoped token, then write `heroImage: https://media.aitamer.news/heroes/<slug>.jpg`. A path such as `/heroes/<slug>.jpg`, or a `public/heroes/` folder, fails the deploy.
- 1600 x 900, JPEG, 16:9.
- House style: layered paper-cut collage, slate blue and cream with a single coral accent, no text, numbers or logos, no recognisable people. Add `heroAlt`: one true sentence saying what the picture shows.

## 4. Frontmatter limits (the build fails past these)

title 200, description 400, heroAlt 300, verdict 240, wildness.verified and wildness.claimed 120 each, each tag 60. An unknown field fails the build. Do not write `specimen` by hand; the stamper assigns it (`npm run stamp`).

## 5. Words that break the deploy

- Never write the literal name of a secret variable (for example the Cloudflare API token variable) anywhere in a post. The deploy's secrets guard stops the whole site when it sees one. Write "an API token passed as an environment variable".
- No account ids, keys, tokens or internal hostnames.

## 6. Before you open the pull request

1. `npm run stamp`
2. `npm run check:posts` and `npm test` pass, with no reader-text warnings.
3. `npm run check:media` shows your hero answering 200.
4. Read the front-page card and the post once as a reader would.

## 7. After the posts MCP is live

Only the MCP publishes. Bots hand drafts to the MCP; no pull requests, no direct pushes. The MCP applies sections 2 to 5 as hard rules on input.
