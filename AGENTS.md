# Agent instructions for aitamer.news

Static Astro site on Cloudflare Pages. Posts are Markdown in `src/content/posts/`; the schema is `src/content/post-schema.ts`. These rules apply to any coding agent working here.

## Read first
`HANDOFF.md` (points at the current handoff), `docs/guides/post-builder.md`, `docs/guides/bot-content-contract.md`, `PLAN.md`, `BACKLOG.md`.

## Posts
- Valid `section` values: models, dev, tools, devops, rust, general, voices. `news` is not valid.
- Every post needs a hero image (`heroImage`, hashed `heroes/<slug>-<hash>.jpg` on the media bucket). Never ship one without it.
- Build and validate post files with `scripts/post-builder.mjs`; writers return JSON fields only, code builds the frontmatter. Free slots: `npm run preflight -- --next-slot`.
- A post goes live at the first publisher run after its `pubDate`. The publisher is a scheduled GitHub workflow that runs late; if a due post is not live, run `gh workflow run scheduled-publish.yml -R michelabboud/aitamer-news --ref main`.
- Reader text never describes how the site is made or run (no agent, harness or bot names). No em-dashes, no "not X, but Y" framing, no hype words, no invented numbers or quotes. Every claim needs a source the author opened.

## Gates before a pull request
`npm run stamp`, `npm run preflight -- --files <files>`, `npm run check:posts`, `npm run check:media`, `npm test`. Quote the decisive output lines; do not claim green without running them.

## Git
- Never push to `main` directly; open a pull request from a branch. Never `gh pr edit` an open pull request (it breaks a path check); push a new commit instead.
- Commit identity `29182417+michelabboud@users.noreply.github.com`; end the message with a `Co-Authored-By:` line naming the model.
- Merge only when the owner has authorized this agent to merge, and only after checks pass, as a merge commit, never `--admin`. Otherwise stop at the open pull request and report its number.
- Never rewrite published history; never delete files, branches or data you did not create this session without asking.

## Secrets and accounts
Never print, log or commit a secret. No Cloudflare account ids or account details in this public repository. Inspect secrets by name and presence only.

## Skill
Codex: the `aitamer-publish` skill (`~/.codex/skills/aitamer-publish/SKILL.md`) is the step-by-step procedure for shipping a post.
