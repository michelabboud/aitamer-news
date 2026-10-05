# Source submission smoke checks — 2026-10-05

## What was built

The CLI smoke test now starts the real scripts by absolute path in disposable fixtures. A valid numbered fixture proves startup and successful checks; an unnumbered fixture proves strict rejection with exit 1. Both checks preserve article and ledger bytes. Tests also avoid writing the surrounding Actions job's outputs. No production validator, workflow, certificate, source article or permanent ledger changed.

PR #189 (`grok/batch-2026-10-05`, source head `73f73778aeeb2624cba658b3cd5000413cffab96`) legitimately submits 24 unnumbered articles. Its original `check` run 37293575786 failed in the ambient smoke test before candidate checks. Its separate `specimen-integrity` failure remains the required security guard: `no successful trusted-main allocation proof for this exact base/head`.

## Verification evidence

- Original exact source checkout reproduced the smoke failure; the same article/ledger tree with only the test overlay passes all four smoke tests.
- Full `npm test`: `tests 896`, `pass 896`, `fail 0` on both the fix tree and exact source overlay.
- Source `check:candidate` against main `1d21febb69ebb0a8974deb3e460947bc91923dd9`: `24 article(s) checked; numbering/ledger require workflow admission. No number was assigned.` Main strict `check:posts`: 394 numbered published posts, 395 ledger lines.
- Media: main 396/396 and source 420/420 heroes answer `200 image/jpeg`. Both builds succeed. Rendered-body, CSP, links, shipped diagrams, dist-secret and file-limit checks pass on both isolated builds.
- The first parallel builds shared a linked `node_modules/.astro` cache: main's body check correctly rejected the source's 24 extra cached posts. That failed result is retained. A private source cache and repeated affected build/output checks resolve the fixture collision without deleting shared state.
- Independent source review accepted the test-only patch, SHA-256 `054ec5353d29ef67dfd6a27540f42dfc4d93b546e692e64a76c03921a287be46`; reviewer independently passed four smoke and thirteen integrity/context tests. Implementation: inherited Codex development lane; independent review: parent's existing security-review lane. No additional agents or dependencies added.

## Assumptions made

CLI startup tests validate scripts independently of submission data. Real candidate validation and required admission proof continue to judge the source. A source PR can have a green ordinary `check` while required `specimen-integrity` remains failed until editorial approval and workflow-generated numbering. A successful local source build does not authorize publication.

## Concerns and observations

The existing grandfathered YouTube post retains its known rendered-body exceptions and working-note warning; this repair changes no articles. No new article/media defect was found by these gates. Editorial, visual and primary-source validation of PR #189 was not performed or authorized here.

After the fix reaches main, the source producer must refresh its branch using its own Grok App identity. A Michel-authenticated push would violate the required author/sender identity guard. The producer's normal refresh commands are:

```bash
git fetch origin main
git switch grok/batch-2026-10-05
git merge --no-edit origin/main
npm test
npm run check:candidate -- --base "$(git rev-parse origin/main)"
npm run check:media
git push origin grok/batch-2026-10-05
```

Do not stamp numbers, edit the ledger, bypass checks or merge the unnumbered source PR. After editorial validation, the owner approves its exact refreshed head through the existing admission workflow.

## Close-out confirmation

This task updates VERSION to 0.2.69, its changelog and progress record, and this report. The source checkpoint is `checkpoint/0.2.69`; it lands through a normally checked feature PR. No phase release or content publication is included. Temporary build/test logs under `/tmp/aitamer-*-20261005.log` retain failed and successful evidence; the isolated source worktree remains available for reproducing the source gates. Shared dependency links, other worktrees and existing dashboard runs are preserved.

Dashboard run: `bot-submission-checks`, session `01a1036f-4e08-7a53-b1ee-9ec0d759b49a`, `/home/michel/.local/state/build-task-dashboard/tasks.html`. Final CI and merge status are recorded in the feature PR and dashboard after this source checkpoint.
