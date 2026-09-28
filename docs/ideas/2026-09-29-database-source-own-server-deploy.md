# Idea: database as source of truth, builds on our own server, token-only upload

Status: idea, not a plan. Michel, 2026-09-29. Nothing here is approved or scheduled.

## The idea

1. **The database is the source of truth** for posts. The posts MCP already stores drafts and scheduled posts; the scheduler decides when a post is published.
2. **The site is compiled on Michel's own server**, not by GitHub.
3. **An API token uploads the exact files that changed** to Cloudflare.
4. **The news repo goes private**, kept as a backup only, with workflows that run on demand.

## What the current setup relies on (check before changing it)

- The hourly `scheduled-publish.yml` job publishes the queued posts (27 on 2026-09-29, through 2026-10-03). It needs GitHub Actions.
- A public repo has unlimited Actions minutes. A private repo on the free plan has a monthly allowance (about 2,000 minutes; confirm).
- Branch ruleset 24115826 confines the posts App to its own branches, and the required checks gate every merge. Whether rulesets are enforced on a private repo without a paid plan must be confirmed first (unverified). The posts MCP merges only after those checks pass.
- The repo history still contains the old Cloudflare account id, which going private would stop exposing.

## Points raised in discussion

- **Staleness risk moves to the server.** With GitHub building, publishing needs nobody. With one server building, an outage stops publishing. Keep a fallback build somewhere else, and keep a mirror of posts and images so a rebuild is always possible.
- **Uploading only changed files does not lift the file cap.** Cloudflare already skips files it has seen, but each deploy still lists every file, and the 20,000-file cap counts that list (ADR 0005). Michel's plan is to pay the $5 Workers Paid plan (100,000 files) when the cap is reached. Unverified against this account.
- **The deploy token** lives on the server and should be scoped to this site's deploys only, like the R2 token.
- **Related posts** (see below) cost nothing extra once builds run on our own machine.

## Suggested order

1. Run the MCP scheduler, the seeker and the writer for real, with failure alerts and a restored D1 export (atn-ops runbook).
2. Build and deploy from the own server in parallel with GitHub, and compare outputs.
3. Make GitHub workflows on demand only.
4. Confirm the ruleset question, then flip the repo to private.

## Related posts

Decided in discussion: up to 3 related posts baked into every post page at build time, chosen from the whole archive by shared tags and section, with an optional `related:` list in the frontmatter as an override. Revisit when the archive reaches a few thousand posts or builds get slow. Needs its own design before building.
