# Workflow-owned specimen implementation

## What was built
Trusted main reads owner-approved article data, repairs supplied numbers, restores published identities, and allocates permanent numbers from the trusted ledger. Validation is credential-free; the finalizer merges only a pinned, current-base certified tree and dispatches deployment. Producers submit no ledger changes. Date publishing and the existing 60-second aggregation remain unchanged.

## Verification evidence
Integrated source suite passed 872 tests with zero failures with the protected control-state/App refinements. Recovery/allocator/integrity suite 74 passed, including App token tests. Build and strict post checks passed; two known unchanged rendered-body findings and one reader-text warning remain explicitly grandfathered. Independent security review accepted the controller, token helper and isolated check contexts. Fourteen focused workflow tests passed; live admission remains pending.

Independent security review found and drove repairs for lost stale requests, merge-without-deploy recovery, pre-PR failure discovery, historical 1000-item limits and repeated completed-history API calls. Failed evidence retained. Review is not live acceptance.

## Assumptions made
Only owner workflow dispatch approves editorial content. Installed publishing App 5107739 supplies repository-scoped contents/PR writes; Actions holds check/dispatch authority. Live GitHub rejected built-in Actions 15368 as a ruleset bypass identity. The existing installed App is allowed by main update restrictions but receives no bypass of required PR/check rules.

Workflow control state is separate from article admission and introduces no queue.json content requirement. State namespace is protected before initialization. The shared publishing App cannot authenticate state alone: an independent Actions certificate binds the exact state commit, content digest and trusted finalizer run. Verified completions leave active polling. Local regression checks fixed idle request cost; live acceptance remains open.

## Concerns and observations
Original GitHub Actions-only identity approach was rejected by real API; generic namespace exception temporarily added during the rejected request was restored before using the installed App. Current namespace ruleset 24488522 allows only installed publishing App/admin and generic rule 24029856 excludes that protected namespace. Main PR/check enforcement remains mandatory. Grok has no main merge access.

## Close-out confirmation
ADR 0031, producer guides, schema workflow docs and plan updated. Source PR 178. Version 0.2.62 allocated after remote reconciliation; final checkpoint/push pending final source acceptance. No real specimen ledger written locally. Live articles 172/177 remain pending. Implementation Sol high/xhigh; security/planning review Astra xhigh; token figures unavailable.
