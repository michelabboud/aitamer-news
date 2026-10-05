# 0035: Independent Grok posting with workflow-owned numbering

## Status
Accepted 2026-10-06 at Michel's explicit instruction. Supersedes ADRs 0031–0034 only where they require owner editorial approval for authorized Grok submissions.

## Context
The requested automation was specimen numbering. Owner-review admission added an editorial dependency that stalled the independently operated Grok newsroom.

## Decision
Discover open, non-draft, same-repository `grok/*` PRs from the configured numeric Grok App identity. Trusted main binds the exact submitted head and performs numbering, technical validation, certification and normal same-PR merge. Owner reviews do not authorize or revoke this lane. Preserve other lanes, immutable source binding, technical checks, identity/path restrictions, concurrency and bounded recovery.

## Alternatives rejected
Retaining owner approval or asking bots to dispatch workflows would preserve the unwanted dependency. Disabling numbering or required checks would remove the requested functionality and technical protections.

## Consequences
Grok owns its editorial decisions. The workflow changes only specimen fields and the ledger. New article edits require fresh technical certification. Publication still follows `pubDate`; a merge is not proof of live publication.
