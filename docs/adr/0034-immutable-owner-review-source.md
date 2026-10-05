# Immutable owner-review source binding

## Context

During the first single-PR runtime exercise, GitHub moved the same APPROVED review's REST `commit_id` after each workflow numbering push. Its numeric ID, submission time, state and body stayed fixed. Treating this field as an immutable approval anchor rejected valid numbering and started new roots for the same review. Separately, a PR event's cached base SHA made observation checks mistake already merged workflow changes for producer code.

## Decision

Bind a review ID to the source in its earliest authenticated trusted-main admission root. Current owner review ID/state can withdraw or supersede that approval; the moving REST anchor cannot replace its source. Group and deduplicate by PR/review ID. Later roots that rebind the review are held, with failed evidence retained.

For first discovery, the permission-free review workflow records PR number, review ID, event action/state and reviewed source in its run title. Require a successful owner-authored submitted/APPROVED event, repository/workflow/PR identity, and equality between that event-time source and the immutable top-level run head. Verify the source workflow blob against its trusted-main ancestor and reject code changes through the existing article-only parser. The admission request carries the wake run ID through recovery. Titles are locators, not standalone authority. A COMMENTED or edited event cannot approve a changed body.

Existing pre-receipt roots remain valid historical bindings. New policy refuses receipt-free reviewed roots; old requests retain their format during recovery. An authenticated owner review wake can reconsider a legacy hold caused by the old anchor check. It never resets exhausted retries or replaces the original source. Every intervening numbering commit must independently match its actual trusted-main run, exact parents and deterministic allocator tree, with the original editorial digest preserved. No local data is materialized by this verification.

Observations compare the pinned PR head with the actual trusted checkout HEAD. Required integrity checks, allocation bases and certificate bindings keep their existing exact-base rules.

## Alternatives rejected

- Requiring a fresh approval after every numbering push recreates the failure and makes automation unusable.
- Accepting APPROVED state alone allows a newer edited body to inherit old approval.
- Associating a review with a wake by timestamp, or using nested PR head metadata, cannot prove the exact reviewed source. Creation times only bound discovery.
- Replacing the protected pending index or introducing another publication service is unnecessary.

## Consequences

Legacy generated-PR proof, state schema, strict current-base checks, non-force branch writes, token separation and scheduled dates stay compatible. Provisional numbering from an interrupted old request may carry the original approval only after independent deterministic proof. Malformed provenance or content edits fail closed. Recovery scans retain the unfiltered history stream and stop only at an applicable server creation boundary.

## Status

Accepted for the authorized production repair on 2026-10-05. Supersedes ADR0033's assumption that the current REST review commit is immutable. The [repair report](../reports/2026-10-05-review-source-binding.md) distinguishes source review, deployment and original PR runtime acceptance.
