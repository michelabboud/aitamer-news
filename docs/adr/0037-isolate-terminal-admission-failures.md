# 0037: Isolate terminal admission failures

## Context

Normal owner-backed and Grok submissions share trusted admission, exact-head certificates and serialized finalization. Historical malformed owner recovery dispatches and superseded merged-head proofs can remain pending forever. They repeatedly fail reconciliation after their articles have merged and deployed. One malformed Grok candidate can also abort discovery before later valid candidates are considered.

## Decision

Preserve irrecoverable provenance failures as explicit durable holds. Hold the exact invalid owner-recovery error; hold exact absent allocation proof only for already-merged PRs. Open missing proofs and API failures remain pending. Held entries are not validated, deployed or deleted; retained state history preserves their reason.

Give deterministic submitted-article validation failures a dedicated error type at the candidate boundary. Discovery may refuse that candidate and examine the next. Trusted baseline/ledger validation, filesystem/Git failure, allocation exhaustion, and API failures propagate. Exact source identity, content digest, approval and required certificate checks remain mandatory.

## Alternatives rejected

- Delete failed history: loses evidence and can invite duplicate processing.
- Treat every failure as a hold or swallow discovery errors: hides infrastructure and baseline faults and prevents safe retry.
- Relax exact-head checks for old merged requests: would turn missing proof into trust.
- Keep every irrecoverable failure pending: creates repeated false service-health failures and unbounded unnecessary polling.

## Consequences

The first reconciliation may report the observed historical failures while preserving them as held. Later sweeps skip those holds and continue processing new requests. Malformed submissions remain unmerged; valid subsequent submissions can proceed. A held historical run remains an unresolved evidence record, not publication acceptance.

## Status

Accepted for implementation under the owner's request to verify and repair both publication lanes, 2026-10-11. Live verification follows normal reviewed merge and trusted-main reconciliation.
