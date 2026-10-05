# 0031 — Workflow-owned permanent specimen identities

## Context

Parallel producer PRs can allocate the same next number from stale branch ledgers. Repairing that collision by hand changes permanent identity and can conflict with App sender/path guards. The owner requires workflow-only specimen and ledger writes for all producers, automatic correction of submitted numbering, preserved historical bytes and published dates, and continued date-based publication. This supersedes ADR 0030's producer-ledger permission and its rejection of post submissions without a ledger; the numeric Grok App identity and narrow post lane remain.

## Decision

All producers choose Habitat and submit article content with normal required editorial metadata. New submissions omit specimen; no person, local agent, Desk, writer, Grok bot or MCP producer allocates permanent numbers or writes the specimen ledger. The owner dispatches trusted-main `specimen-admission.yml` with the exact reviewed source PR/head. Technical checks grant no editorial approval.

Trusted main code reads added/modified plain Markdown post data only, ignores the candidate ledger, removes safely isolatable submitted specimen fields, restores existing main identities and allocates deterministically from main's ledger. It preserves historical bytes, published identities, article content and dates, rejects unsafe or ambiguous inputs, and records repairs in a workflow-generated PR retaining source ancestry. Untrusted reservations never become history. Allocation is one atomic generated tree, including a multi-post batch.

Credential-bearing orchestration never executes source code or dependencies. A separate job verifies deterministic content/identity binding and runs full validation without write credentials. Certification binds required checks to the exact generated head, base, digest and trusted run. A separate serial finalizer verifies current source approval and server-enforced strict current-base checks with GitHub Actions provenance before a normal pinned-head merge. Stale or failed runs retain evidence and use bounded recovery; no force-push or admin override. Main still publishes through `draft: false` and `pubDate`; no content queue is restored.

## Alternatives rejected

- Producer stamping followed by manual conflict repair: reproduces stale allocations and permits people to alter permanent identity.
- Accepting only a well-formed append-only producer ledger: fabricated reservations remain untrusted, even if syntax and historical prefix are valid.
- Merely rejecting a submitted number: makes safe identity repair a producer chore instead of satisfying automatic workflow correction.
- Running PR code in a credential-bearing repair job: grants an untrusted producer repository credentials through scripts or dependencies.
- Rereading main then merging without enforced current-base checks: leaves a base-update race and can admit stale allocation.
- Automatic approval when CI is green: tests do not establish facts, byline honesty, hero quality or editorial judgment.
- Deployment-time allocation or reintroducing reviewed `queue.json`: creates another writer or changes the owner's retained date-based publication policy.

## Consequences

Article submissions and strict numbered-tree validation are separate. Producers use candidate checks before pushing; full strict checks remain on main and workflow-generated trees. Grok loses ledger permission and uses only an existing honest bot/AI byline. Maintainer identity alone grants no numbering authority. Existing author-profile lanes remain separate.

Operational activation requires verified identity/permissions, strict GitHub Actions required checks, migrated producer integrations, independent review and controlled concurrent-admission/publication evidence. New workflow files and local green checks do not prove live enforcement. Failures, stale allocations and pending publication remain explicit in receipts and operator instructions.

## Status

Accepted for implementation 2026-10-05 at the owner's request. Implementation/review and live activation evidence are recorded separately; this decision does not claim a deployed workflow or automatic editorial approval. See [the operator guide](../guides/workflow-owned-specimens.md) and [running plan](../plans/2026-10-05-workflow-owned-specimens.md).

## Deployment refinement, October 5

Live GitHub rejects built-in Actions integration15368 as a repository ruleset bypass actor. Reuse installed publishing App5107739, with repository-scoped contents/PR writes, for trusted workflow mutations. Keep Actions tokens for check/dispatch operations and keep main PR/check enforcement outside the App update-only bypass. Protect `specimens/*` before initialization.

To keep reconciliation bounded, persist workflow-owned control state on `specimens/state`, with pending requests and a discovery cursor. Verify deployment completion once; preserve terminal evidence in history while excluding completed entries from hot polling. This is recovery metadata and introduces no queue.json admission requirement.
