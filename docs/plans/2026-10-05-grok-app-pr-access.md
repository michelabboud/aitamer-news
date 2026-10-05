# Grok App content pull requests

Dev mode: production (existing public site). Authorized by Michel on 2026-10-05. Tasks run back to back through checks, independent review and a pull request; merging requires the owner's explicit authorization under this repository's AGENTS.md.

## Threat sketch

- Protect the site template, executable files and historical specimen assignments.
- Untrusted entry points are pull request event metadata and fetched Git objects.
- Only the configured numeric Grok bot account as both author and sender receives the lane.
- Only `opened` and `synchronize` events from a valid `grok/` branch in this repository qualify.
- Read commits without checking out or executing the proposal; keep Actions permissions read-only.
- Admit plain Markdown posts and an append-only specimen ledger; retain both merge-base and current-base history.
- Required content checks and the build retain responsibility for schema and rendered content. Factual accuracy still needs source review.
- The App gains ordinary pull request creation, no authority to update main or change workflows.

## Execution

The coordinator owns live GitHub rules, version allocation, review, commit, checkpoint tag, push and opening the implementation pull request. The implementation worker owns the isolated `feat/grok-app-pr-access` worktree: guard, regression tests, minimal workflow environment wiring and affected documentation. Agents exchange results through native collaboration messages; reports and command logs persist under the run's orchestration directory. The paused Cursor work is outside this task.

1. Record this decision in ADR 0030 (0029 is reserved by the separate paused Cursor task); add the narrow guard and regressions. Evidence: focused behavior tests for identities, repositories, branches, events, file modes and ledger history.
2. Update the Grok posting guide and environment documentation; run required repository checks and build. Evidence: direct command exits and preserved logs.
3. Independently review the frozen candidate, repair any blockers, then commit/tag/push and open the implementation pull request. Status: local validation complete; frozen source reviewed separately, source PR delivery and owner-authorized merge remain the activation boundary. Live App identity and branch restrictions are verified; no real App-token submission has been tested.
