# Deployment ancestry repair

## What was built
Fetch full Git history in production checkout so the numbering gate can verify actual merge parents and compare the admitted tree. Keep all gates and the existing 60-second deployment batching.

## Verification evidence
Deploy 37284636818 failed with no trusted parent because checkout defaulted to shallow history. Aviram admission PR 185 merged through the controller as 6dd934b9227111500476d1624242f89b9c2d13b5. The source PR is merged; live article verification remains pending. Workflow regression requires full ancestry and unchanged deployment concurrency.

## Assumptions made
Parent verification requires actual history; fetching only the already-shallow head cannot recover it.

## Concerns and observations
The shallow-checkout integration failure was missed by local full-clone tests. No gate is disabled, no ledger edited locally.

## Close-out confirmation
Version 0.2.67 reserved. Checks, independent review, checkpoint and normal merge follow. Failed deployment evidence retained; no cleanup performed.
