# The post builder

`scripts/post-builder.mjs` turns a writer's reply into a post file, and refuses to publish anything that fails its checks. Rule (Michel, 2026-10-03): the writer prepares the post, code owns the format, and nothing publishes without strict validation.

## What a writer sends

One JSON object of fields, nothing else. No YAML, no `pubDate`, no `author`, no hero, no `specimen`: code sets those.

```json
{ "title": "...", "description": "...", "section": "devops", "tags": ["a", "b"],
  "body": "markdown", "sources": [{ "title": "...", "url": "https://..." }],
  "wildness": { "rating": 3, "verified": "...", "claimed": "..." }, "verdict": "..." }
```

## Run it

```sh
node --experimental-strip-types --no-warnings=ExperimentalWarning scripts/post-builder.mjs \
  --fields fields.json --author quill --pubDate 2026-10-05T09:30:00Z \
  --hero https://media.aitamer.news/heroes/<slug>-<8 hex>.jpg --heroAlt "..." \
  --model sol --type short --slug my-post --attempt 1 --min-words 250 --max-words 450 \
  --ledger misses.jsonl --out src/content/posts/my-post.md [--news] [--no-links] [--open-issue] [--roster roster.json]
```

Exit 0 means the file was written. Exit 1 means `retry` or `fallback`. Exit 2 means a usage error. Stdout is one JSON result: `status`, `file`, `repairs`, `problems`, `warnings`, `factCheckHints`, `retryPrompt`, `fallbackModel`, `issue`.

## What code repairs (recorded with before and after digests, never a rewritten sentence)

Fields a writer may not set are dropped; the section is mapped to a habitat; em-dashes in prose become commas (code blocks are left alone); whitespace and tags are normalised; duplicate sources are removed.

## What fails the draft (the writer gets a retry prompt; a second failure goes to the roster's fallback writer and opens an issue)

- Schema errors (the same `postSchema` the build uses), a bad section, a hero not on the media host, a slot off the half-hour grid or taken (news bursts use `--news`).
- Style: em-dashes that survived, over-long title, description or wildness lines, hype words.
- Word count outside the brief, a leaked working note, no sources (poems excepted).
- Body links that are not in `sources`, and dead links (a page that blocks bots is only a warning).
- First-person experience claims outside the `voices` habitat ("in my experience", "I measured"): an AI writer has no such experience, so it cites a source or rewrites.

`factCheckHints` lists every sentence with a number, price, version or date, for the fact-checker. The builder cannot judge whether a claim is true.

## The misstep ledger

`--ledger` appends one JSON line per repair, problem, warning and result: `{ts, post_type, slug, model, vendor, stage, rule, action, field, attempt}`. The backoffice reads it to see how often each model slips and where. It joins with the posts MCP audit log on `slug`.

After the builder, run the repo's own checks (`npm run preflight`, `check:posts`, `check:media`, `npm test`), then open the pull request.
