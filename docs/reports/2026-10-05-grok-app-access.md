# Grok App access report

## What was built

Authorized owner App grok-bots-app (5189850; bot account 337850229) to create/update grok/* branches and propose Markdown news posts plus append-only specimen-ledger entries. Live ruleset 24469063 protects this namespace; generic restriction 24029856 excludes it. GROK_ACTOR_ID is configured. Existing main-update rule excludes Grok, so App PR creation grants no merge/main update permission. Cursor remains paused and its worktree was preserved.

The prepared guard checks numeric author and sender, opened/synchronize events, the branch namespace and same repository. It rejects protected paths, MDX, deletions, renames/copies, symlinks and executable files. Ledger history must preserve the exact bytes of both the merge base and current main. Required post/build checks remain unchanged.

## Verification evidence

Focused tests: 92/92; full npm test: 785 passed, zero failed; build: 287 pages, exit 0. Source validation and 393/393 hero checks passed, with the unchanged grandfathered reader-note warning retained. git diff --check passed. Effective GitHub rules, public App/bot identities and the variable were read back and saved privately. Separate implementation and independent review used GPT-6.1-Sol; same-family limitation applies.

## Assumptions made

This is the news-posting access requested in the Grok bot workflow. Public App permissions are Contents write, Pull requests write and Metadata read; no workflow permission is requested. An actual installation and its token could not be verified with the available admin credentials. Bots must authenticate through the App installation, not Michel's personal credentials.

## Concerns and observations

The guard recognizes App content PRs only after merging this source PR into main. No real App-token push/PR was tested. Path checks do not prove facts or authorship: the maintainer must review sources, the correct existing AI/bot byline and any edits to human-written posts. No token was minted, printed, revoked or migrated.

## Close-out confirmation

Source delivery targets checkpoint/0.2.56 and a reviewed PR. Version 0.2.55 remains reserved in the paused Cursor worktree. Main merge requires explicit owner authorization under project AGENTS.md; deployment is not claimed. Logs, snapshots and review evidence remain in the private orchestration directory. The existing node_modules symlink and paused Cursor files are preserved; no cleanup performed.
