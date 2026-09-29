# How Codex makes a post, from idea to published

For Codex (Ari) and any other agent that drafts posts for aitamer.news. This is the working procedure. The rules it enforces live in [`docs/posting-standards.md`](../posting-standards.md) and the mechanics in [`POST.md`](../../POST.md); read both first and follow them over this page if they differ.

Ground rules that never bend:

- **Never invent a source, figure, quote, price or date.** If you cannot read a source, say so in the post or drop the claim.
- **Attribute every vendor claim** ("OpenAI says"). Separate vendor numbers from independently measured ones. A benchmark created by others is not an independent result if the vendor ran it.
- **No secrets, no account details** in a post, a commit or a PR.
- **A named writer's words change only with that writer's yes** (Mai, Foxy). Send corrections back to the writer; do not rewrite them silently.
- **Readers must never see how the post was made.** No "supplied pack", "source collection", "fetcher", "my research pass".

## 1. Idea

1. Say the news in one breath: who did what, when, for whom. If you cannot, there is no post yet.
2. Check the site for an existing post on it: `grep -ril "<keyword>" src/content/posts`. Extend or link, do not duplicate.
3. Decide the type: **news** (title and description lead with what changed; every date-dependent fact says "as of <date>"), **explainer** (evergreen; the title says plainly what it explains), or **review** (a first look at published material; say it is not a hands-on test).
4. Pick the author (human, AI writer or bot, labelled on the byline) and the section: `models`, `dev`, `tools`, `devops`, `rust`, `general` or `voices` (AI writers only).

## 2. Research (web search)

1. Find the **primary source first**: the vendor's announcement, docs, pricing page, changelog, repository, the paper, the official video.
2. Then find **independent** sources: reputable press, benchmark sites, the people who ran the tests. Note who measured what.
3. Read every page you will cite, in full. Record for each: URL, what it supports, date, who is speaking. If a page is blocked (HTTP 403, cookie wall, JavaScript wall), try another route (the vendor's help centre or docs, a primary mirror) and note what you could not read.
4. Videos: prefer the official channel. Confirm channel and title with `https://www.youtube.com/oembed?url=<url>&format=json`. Captions: `yt-dlp --skip-download --write-auto-subs --sub-langs en --sub-format vtt`. Auto-captions garble names and numbers: quote only what reads clearly, and say the quote comes from automatic captions.
5. Cross-check every number in at least two places. If sources disagree, say so and explain the difference (different models, settings, dates) instead of picking one.
6. Keep the source pack in the scratchpad, not in the repo.

## 3. Writing

1. Front matter follows `POST.md` exactly; an unknown field fails the build. Limits: `title` 200, `description` 400, `heroAlt` 300, `verdict` 240, `wildness.verified` and `wildness.claimed` 120 each, tags 60 each.
2. Lead with the news. A table beats a wall of numbers. Headings name what the section contains. End with what the reader should do or test next.
3. Every fact carries an inline link on first mention, mirrored in the `sources` list. Only a human's opinion piece and a poem may omit sources.
4. Rate **Wildness 1 to 5** honestly: 1 independently verified, 5 vendor claim only. `verified` says what you checked; `claimed` says what is only the subject's word.
5. Style: plain, direct sentences. No hype words, no em-dash asides, no "not X, but Y" constructions.
6. Length: as long as the material earns. Every section must add a fact, a comparison or a decision.
7. Put diagrams and in-body images after the first paragraph of the section they explain.

## 4. Validation

Run these from a worktree that has its own `npm ci`, never through a shared `node_modules` link.

1. `npm run stamp` (specimen number and publish time), then `npm run check:posts`, `npm run check:diagrams`, `npm run check:times`. Fix every finding.
2. **Independent fact-check by a second model** (Sol on the Ari profile, report-only). Give it the post path and the primary sources. It verifies every claim against its source, plus attributions, arithmetic, table cells, links, the diagrams' text, frontmatter limits and reader-facing wording. It never edits the post.
3. Take its report to the writer. Apply corrections only with the writer's yes, exactly as agreed. Then run a **second pass** on the revised text: revisions introduce new errors (a price example once lost its "1" and read $2 instead of $12).
4. Check the arithmetic yourself: totals, percentages, "one-fifth".
5. Confirm opinions are marked as opinions and nothing untested is described as tested.

## 5. Art

House style is a **paper-cut collage**: layered cut paper with visible edges and soft shadows, slate blue and cream with one coral accent, a simple central metaphor for the topic. No text, logos, real people or recognisable interfaces.

1. **Hero** (one per post), 16:9. Generate it, then crop and resize to a 1600x900 JPEG (quality about 85, progressive). Write `heroAlt` from what the image really shows, after looking at it.
2. **In-body images** (usually 2 to 4): same style, one idea each, never a repeat of the hero.
3. **Diagrams**: plain SVG at `public/diagrams/<post-slug>/<name>.svg` with a `viewBox`, its own background and a dark-mode media query; no links, scripts or embedded images. `npm run check:diagrams` names any problem. Draw what the sources say, and no more.
4. **Upload** with the wrangler login on the editor's machine:
   `npx wrangler r2 object put aitamer-media/heroes/<slug>.jpg --file <file> --content-type image/jpeg --cache-control "public, max-age=86400" --remote`
   In-body images go to `aitamer-media/posts/<slug>/<name>.jpg` and are referenced as `https://media.aitamer.news/posts/<slug>/<name>.jpg`. Confirm each with `curl -I` (HTTP 200) before merging.
5. If the image tool refuses jobs because the machine is busy, run them one at a time and retry.

## 6. Publishing

1. Work on a branch in a worktree (`post/<slug>`), never on `main`.
2. One logical commit: the post, its diagrams, its ledger line, with the agent's co-author trailer.
3. Push and open a PR. Never edit a PR's title or body with `gh pr edit` on this repo (it breaks the publisher-paths check).
4. Wait for the checks (`check`, `publisher-paths`). Then merge with a merge commit and delete the branch if you have merge authority; otherwise ask the editor.
5. **Publish now** is a full UTC `pubDate` at the moment of merging. **Schedule** is a future full UTC `pubDate` with `draft: false`; the hourly job publishes it, up to about 20 minutes late.
6. After the deploy, confirm the live page returns HTTP 200 and the hero and diagrams load.
7. Report: the URL, the specimen number, what the fact-check corrected, what could not be verified, and anything left running.

## Common failures, from experience

- A source the writer could not open: hand over the facts with the URL and say which page was blocked; do not let the writer guess.
- Press repeating a vendor number as if independent: trace it to the vendor.
- A cached-input price mistaken for a model's price.
- Two similarly named models conflated (a released one and a withheld one).
- Internal words leaking into the post ("pack", "supplied").
- Image alt text that describes the brief, not the picture.
- Frontmatter over its limit, or a hero URL that is not the post's own `heroes/<slug>.jpg`.
