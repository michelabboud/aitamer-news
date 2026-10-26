# 0047 · Comments and reaction totals are read in the browser from data.aitamer.news

2026-10-24 · accepted under the plan approved by Michel on 2026-10-24 (comments and reactions on R2). Supersedes ADR 0006 (baked static comments) and ADR 0008 (the publisher's second lane); amends ADR 0007 (the publisher guard).

**Status:** accepted. The code lands switched off: `COMMENTS_SOURCE` and `REACTIONS_SOURCE` ship as `'baked'` and `REACTIONS_LIVE` stays `false`, so the running site still works as ADR 0006, 0007 and 0008 describe until the flip (a later pull request). Those three ADRs gain their supersession links in the flip's pull request, not before.

## Context

ADR 0006 bakes approved comments into the site: a publisher commits `src/content/comments/<slug>.json` through a pull request, and a deploy renders them into the HTML and the JSON-LD. That makes a new comment wait for a pull request, a build and a deploy (up to about an hour), and it puts every published comment into the public git history, where a removal cannot reach it. ADR 0008 added the same lane for reaction totals. Michel asked for the moderation app to publish on approval, to a place a page can read.

## Decision

- The desk's moderation app writes, on approval, three kinds of public JSON object to a dedicated public R2 bucket served at `https://data.aitamer.news/`: `v1/comments/<slug>.json` (the comment contract v1, unchanged), `v1/comments-index.json` (a new contract, below) and `v1/reactions/<slug>.json` (the reactions contract v1, unchanged). The comments Worker writes the reaction files itself through a bucket binding.
- Story pages fetch their comments file in the browser and render it with `textContent`, never `innerHTML`, after validating its shape. The home page and the Campfire page fetch the index for their counts and "Around the fire". The switch is `COMMENTS_SOURCE` in `src/lib/site.ts`: `'baked'` (the state before the flip) or `'r2'`. It ships as `'baked'`; the flip is its own commit, with the privacy page's date.
- **The comments index is a new public contract, owned by this site**, defined by `src/content/comments-index-schema.ts`, published at `/contract/comments-index.schema.json` and, frozen, at `/contract/v1/comments-index.schema.json` (snapshot `src/content/comments-index-schema.v1.snapshot.json`). It carries public data only: per-story approved-comment counts (sorted, stories with none left out) and the 60 newest comments site-wide (text cut to 400 code points at a grapheme boundary and marked `truncated`). The same state of the desk's database makes the same bytes.
- Objects are served with `Cache-Control: public, max-age=0, s-maxage=60`: a removal is gone from the edge within 60 seconds. The page's content security policy gains the data origin in `connect-src` only.
- The publisher job retires as a whole, by host configuration, after the old lanes stop receiving files; baked files leave the tree in the flip pull request. ADR 0007's guard keeps its required check name and admits no lane.

## Alternatives rejected

- **Keep baking, only faster.** A build per approval does not remove the public git history of comments, which the removal promise cannot cover.
- **A prefix in the media bucket.** A credential scoped to it could overwrite every hero image.
- **Server-side rendering from a Worker.** A runtime on the reading path for static content that changes a few times a day.
- **A reactions index.** Decision D6 of the comments plan keeps reaction counts off list pages, so nothing would read one.

## Consequences

- **Accepted SEO trade-off:** comments leave the first HTML and the structured data. Crawlers that run JavaScript (Googlebot does) see them; others will not. The way back is kept open: the contract, the content collections, the server renderer and the build-time JSON-LD code stay in the site, and a later build step can pull `v1/comments/*.json` into `src/content/comments/` before the build. It must also rebuild on a removal, or the baked page would outlive the 60-second promise.
- Previews and mirrors outside the CORS allowlist show the comments error state.
- The index grows with the number of stories that have comments (about 40 bytes each, plus about 30 KB for `recent`); sharding `counts` is the answer past 64 KiB.
- Comments published before the flip stay in the public git history.

## Amendment · 2026-10-25 · the comments flip

**Status of the text above:** the "Status" paragraph describes the code before the flip. The flip pull request (version 0.2.123) did the following and nothing else:

- `COMMENTS_SOURCE` is `'r2'`. `REACTIONS_SOURCE` stays `'baked'` and `REACTIONS_LIVE` stays `false`: reaction totals are a later flip, with their own privacy wording.
- The baked comment files left the tree (`the-gap-between-the-needles.json`, `detectorscope-auditable-ai-text-detectors.json`), restorable by git; the README stays and describes the data host. `commentsJsonLd` left the story page; the function stays in `src/lib/comment-text.ts` for the way back.
- ADR 0006 is superseded and ADR 0008 is superseded, by the ADR index; ADR 0007 is amended: `publisher-paths` keeps its required name and, with no lane left, refuses every path from the publisher, and the deploy's step is renamed "The publisher may change nothing". Both the reactions lane and the comments lane closed together, because the publisher job retires as a whole on the desk's host (cutover step C3) before this pull request merges (step C4).
- The held-comment message now promises the comment within about a minute of approval, which is true only on the data host path.
- The privacy page describes the data host request, the private backup history (12 months for a removed comment's record) and the removal path, in the wording Michel approved on 2026-10-25.

The order of the cutover is what keeps the privacy promise true: the old publisher stops (C3) before the site stops reading baked files (C4), so no comment can land in the public history after the site stopped showing it.
