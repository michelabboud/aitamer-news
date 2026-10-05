# 0030 — Grok App content pull requests

## Context

Michel installed a dedicated Grok GitHub App and asked for ordinary content pull requests from `grok/*`. The existing publisher guard admits comments/reactions, the maintainer exemption and the posts App's separate author-profile lane. Granting Grok the maintainer exemption would allow template changes. Posting also needs the stamper's specimen ledger to travel with new posts.

## Decision

Add a pull request lane only when `GROK_ACTOR_ID` is a positive numeric account ID matching both the author and event sender, on `opened` or `synchronize`, with a valid nonempty `grok/` branch whose head repository exactly matches the trusted `github.repository` value. No login fallback; absent or malformed configuration grants no lane.

Allow only added/modified plain non-executable `src/content/posts/<slug>.md` files and `src/content/specimen-ledger.txt`. Refuse MDX, nested files, author profiles, other directories, deletions, renames, copies, symlinks, submodules and executable modes. Read the ledger as bytes from fetched objects and require the head to retain the full ledger prefix at both the merge base and the current base commit. A stale branch must refresh before it can omit later specimen history. Ordinary content tests and build remain responsible for schema and rendered output; they do not establish factual accuracy or editorial approval.

Keep the workflow on `pull_request_target`, reading main's trusted guard, with `contents: read` and no proposal checkout or execution. Add only environment wiring for the lane; no new dependency or installation step. The owner-registered App requests contents/write, pull_requests/write and metadata/read, without workflow permission. Live branch rules permit its `grok/*` namespace while main updates exclude it. Those external rules and their verification are coordinator-owned; this source change cannot itself grant merge authority.

## Alternatives rejected

- Maintainer exemption or a general bot allowlist: permits arbitrary repository changes.
- Posts without the ledger: stamping a new article could not carry its immutable specimen assignment.
- Ledger comparison only at the merge base: a stale head could omit assignments already added to main.
- Author/profile permissions in the same lane: expands the requested content submission boundary.

## Consequences

Grok can prepare and submit a content pull request using its installation identity after this guard lands. Required checks remain mandatory. Profile creation stays with the existing maintainer/posts-App process; source review and independent editorial judgment remain separate. The App cannot update main, and any owner-authorized merge still follows the repository's existing checks.

The file lane does not verify a post's byline or prevent an edit to a human-authored article. The editor must verify the correct existing AI/bot identity, refuse false human attribution and reject unapproved changes to human articles before authorizing a merge. No new metadata parser or author-profile authority is added by this change.

## Status

Accepted for implementation 2026-10-05. Local source validation is complete (785 tests, zero failures, build exit 0). Independent review, source PR delivery and owner-authorized merge are recorded in the task report; activation awaits the merge. ADR 0029 remains reserved for the separate paused Cursor task.
