# Publishing recovery, 2026-10-11

Authorized by Michel: solve blocked publication, allow agents to merge, update unpublished dates before merging; preserve separate Grok news cadence of ten minutes.

Threat sketch: production publishing. Repository and credentials remain protected. Only trusted main allocates specimens; source PRs stay subject to exact-head checks. Network retries apply only to idempotent reads, never writes or rejected redirects. No published dates or identifiers change.

Tasks: reschedule the 19 Quill articles in PRs 244/245 into free future half-hour slots; reschedule unpublished Grok PR 249 in its separate news timeline; submit exact-head owner dispatches; repair read transport diagnostics/retries; check due content every ten minutes; validate, review and merge through normal PR gates. Existing App-lane PR 248 is outside this repair and is not needed for owner dispatch.

Merge authorization: Michel explicitly authorized this agent to merge these repaired PRs after required checks pass. This grants no admin bypass and does not replace editorial evidence.

Concern: GitHub cron can run late; dates ten minutes apart do not guarantee deployments exactly ten minutes apart. A failed read has been observed repeatedly in runner finalizers; stale pooled connections are a hypothesis, not a confirmed cause.
