# Protection timestamp comparison repair

## What was built
Compare the pinned protection timestamp as an exact instant, accepting ISO timezone representations while rejecting drift and invalid formats. No permission or certificate gate changes.

## Verification evidence
Administrator API returned 2026-10-05T10:59:20.822+03:00; public curl API returned 2026-10-05T07:59:20.822Z. These represent the same millisecond. Failed finalizer 37283429323 retained. Tests cover both representations and changed/invalid timestamps. Live retry pending.

## Assumptions made
API timestamp formatting may vary by caller. Configuration revision is the timestamp instant, not its display timezone.

## Concerns and observations
The prior raw-string comparison was incorrect and caused an avoidable extra blocked run. No article or ledger changes occurred.

## Close-out confirmation
Version 0.2.65 reserved. Source review, commit, checkpoint and normal PR merge follow verification. Active evidence retained; no cleanup performed.
