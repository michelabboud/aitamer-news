# Numbered PR readback and completion wake — October 5

## What was built

The first automatic admission wrote PR197's correct numbering commit, then failed because its PR read still returned the previous head. Readback now makes six attempts, with at most 15 seconds of waiting. Every attempt verifies the authoritative branch ref before and after a scoped PR read. It waits only for the exact known predecessor; another head, changed scope or transport error fails immediately. Approval, deterministic validation, strict certificates and non-force writes are unchanged.

The automatically dispatched run also produced no completion wake. The trusted certificate job now explicitly dispatches the existing finalizer on main with a numeric run hint. The finalizer authenticates that exact admission on every read and waits up to 30 reads/29 seconds of backoff before minting an App token. A completed failed run may enter unchanged recovery; merging still requires an independently proved successful completed admission. Only the certificate job gains Actions write permission; no App key enters it. [GitHub documents dispatch as an exception to its token's event suppression](https://docs.github.com/en/actions/concepts/security/github_token).

## Verification evidence

Frozen controller/test change `e8dcc92` passes 66/66 focused tests and 920/920 full tests, with zero failures or skips. Five regressions exercise temporary lag, a producer push during readback, an unexpected metadata head, permanent lag with bounded failure/idempotent reuse, and changed scope/transport failure. Evidence is retained at `/tmp/aitamer-single-pr-convergence-focused-20261005.log` and `/tmp/aitamer-single-pr-convergence-full-20261005.log`.

Wake adapter `adaba628a95ffbf7698f53f91000cb2a67fce982` passes 81/81 focused tests, including six additional tests for exact automatic dispatch, spoofed run/caller rejection, completion races, identity checks on every poll, bounded timeout/API failure and workflow permission/order. Both independent reviews accept the convergence and wake commits; each independently ran 81/81 wake-focused tests. Final full suite passes 926/926, zero failures or skips. Evidence: `/tmp/aitamer-single-pr-wake-focused-20261005.log` and `/tmp/aitamer-single-pr-wake-full-20261005.log`.

Root preserved failed admission37353799417, actual branch ref and commit c4ed0e4e228c2a3eb5f14ba335cee9185e690fd3 with parents d93b021/0e2d273 at `/tmp/aitamer-pr197-first-auto-admission-failure-20261005.json` and its redacted `.log`. No article or ledger was edited locally. Independent review, normal CI/merge/deployment and the original PR's successful runtime acceptance remain separate evidence.

Model ledger: existing Strong implementation lane; existing independent Astra security and mechanical review lanes, with shared collaboration context recorded.

## Assumptions made

Only PR metadata lag behind an already verified expected ref is recoverable in this short wait. A response with any other head is unsafe, even when that response might itself be cached. The previous failed write remains a reusable immutable commit and is not rewritten.

## Concerns and observations

The first attempt's completion did not demonstrate an immediate finalizer notification. The explicit wake addresses that observed failure; root still verifies its successful runtime path separately. Scheduled recovery alone will not establish ordinary fast-path acceptance. A timeout remains failed/pending evidence, not a successful publication. No new queue, service, approval protocol or broader API retry mechanism is added.

## Close-out confirmation

ADR0033 records the bounded readback. Local and remote SemVer tags reconcile to 0.2.71; task checkpoint0.2.72 is unused. Normal feature PR CI, pinned merge and deployment will complete the source repair; root retains the original article's automatic runtime proof. The clean isolated clone, failed evidence and fixtures remain available. No unrelated refs, worktrees or data were removed.
