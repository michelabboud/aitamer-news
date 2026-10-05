# GitHub certificate details links

## What was built
Accept either the supplied admission-run URL or GitHub's exact canonical check URL, bound to the check's own positive numeric ID and repository. Retain independent Actions identity, successful trusted run, exact commit/content/run receipts and every other certificate gate. Apply the same rule to protected state certificates.

## Verification evidence
Live admission check 111673754335 and state check 111678474688 returned canonical /runs/<check-id> URLs rather than the supplied /actions/runs/<workflow-run-id>. The independently fetched admission run/check passes the pure binding verifier. Thirty-eight controller tests passed, including both canonical paths and wrong ID/repository/actor/run rejection. Failed finalizer 37283978942 retained; live retry pending.

## Assumptions made
The details link is presentation metadata. Independent API identities and immutable external receipts provide authority; a canonical link alone grants none.

## Concerns and observations
Earlier fixtures preserved supplied details links and missed GitHub's actual response behavior. Real response evidence now has regression coverage. No article or ledger edited locally.

## Close-out confirmation
Version 0.2.66 reserved. Independent source review, normal PR checks/merge and live retry follow. Retain evidence; no cleanup performed.
