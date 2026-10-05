# 0033 — Workflow admission keeps the original PR

## Context

The separate generated PR lifecycle made the producer PR appear blocked even after its article was accepted. Michel requested one PR throughout, automatic owner approval triggering, workflow-only numbering and unchanged production safeguards.

## Decision

Supersede ADR 0031's separate generated PR and routine owner-dispatch steps. A permission-free review notification wakes trusted-main reconciliation; the controller independently authenticates the latest decisive numeric owner review and exact commit. It dispatches the existing trusted workflow with immutable source/review identifiers. Exceptional owner-authored PRs retain an explicit owner dispatch because GitHub forbids self-review.

Reuse the allocator and credential-free validator. Append a deterministic numbering commit to the original branch with parents `[runBase, observedHead]`; bind the original reviewed source separately. Non-force updates preserve concurrent producer history. A retry reuses matching work; a stale base appends a newly validated replacement to the same PR. Changed editorial bytes need a fresh owner review. Required Actions certificates retain exact repository/base/head/digest/run bindings and strict current-base enforcement. The finalizer performs a normal pinned merge of the original PR. No App, prefix, label or green observation supplies approval or numbering authority.

Observation names isolate source checks, including expected waiting states and publishing-App synchronization. Code, author and comment PR checks retain their normal required names. No source code or dependency runs with the publishing token. Preserve legacy generated requests, protected state schema/certificates, failure evidence, deployment verification, dates and disabled content queue.

## Operational permissions

Root reconciled live rules and verified readback: Grok namespace rule 24469063 permits publishing App 5107739. Generic rule 24029856 retains administrator-only creation/deletion; its update restriction is split into identical-selector rule 24520133 permitting administrators and the publishing App. This branch-update expansion grants no workflow editing permission, review approval or main/check bypass. State, main and Cursor protections remain unchanged. See the report for before/after evidence.

## Consequences and evidence

This is a focused adapter, with no new service, datastore, admission-state schema or generated PR for new requests. The shared publishing App still cannot forge independent Actions proof. Technical primary references are [GitHub workflow events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows), [non-force reference updates](https://docs.github.com/en/rest/git/refs#update-a-reference) and [review metadata](https://docs.github.com/en/rest/pulls/reviews). See the [plan](../plans/2026-10-05-single-pr-publication.md) and [closeout report](../reports/2026-10-05-single-pr-publication.md). Source acceptance, live rule configuration, deployment and the scheduled PR #197 exercise are recorded separately.
