# Homepage Desk Bot card

## Result
Include Desk Bot between Ari and Quill in the right-hand homepage cards. Use its existing avatar and `/authors/desk-bot/` profile. Global author classification and writer routes remain unchanged.

## Verification
- Full suite: 940 passed, 0 failed. Focused author/order suite: 18 passed.
- Strict post checks and production build: exit 0. Existing grandfathered-post warnings remain unchanged.
- Rendered HTML: six cards in Mai, Aviram, Ari, Desk Bot, Quill, Foxy order; both Desk Bot profile links, avatar URL and built profile verified. Avatar HTTP 200.
- Independent read-only mechanical review: CONFIRMED, no blockers. Requested gpt-6-luna/max; reviewer runtime reported GPT-6 but did not expose exact variant/effort or token usage. Fresh context, shared filesystem. Reviewer independently inspected source, routes and avatar; tests were coordinator-run.
- Reviewed base: `d8890ca35d9e9a862feedd2f644e2217d37a8d4e`; source/version/changelog diff SHA-256: `1c44627eb5ebd1951bf027b9a2dc1d445e2f7320b17ff8991ecb2bce83036054`.

## Assumptions and observations
Use the established singular Desk Bot byline and current newsroom profile. No article content, specimen numbers or publishing rules changed.

## Close-out
Version 0.2.81, feature branch and checkpoint tag; normal pull-request merge after required checks, then Cloudflare Pages deployment and live verification. Deployment is not established by local build results.

## Hygiene
Retain the task worktree and build as verification evidence; shared dependencies belong to another worktree. No files deleted. Filesystem had 91 GiB available at verification.
