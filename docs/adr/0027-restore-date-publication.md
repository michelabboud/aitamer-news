# ADR 0027: Restore publication by post date

Date: 2026-10-04
Status: Accepted; supersedes the production activation of ADRs 0025 and 0026.

## Decision

Michel requested disabling the queue requirement. Restore the existing deployment and scheduled-publisher behavior from the pre-admission workflow: eligible non-draft posts publish after their `pubDate`. The scheduled workflow checks recent due posts and triggers the ordinary deployment. Manual dispatch remains the documented fallback.

The production workflows no longer call publication selection, require bootstrap state, enforce content hashes through the queue, impose acknowledgment spacing, or depend on publication receipt artifacts. Keep the queue, scripts, tests and historical evidence without using them as publishing authority. Restoring this feature later requires an explicit implementation decision.

## Consequences

Ordinary deploys publish every overdue eligible post. Backlog catch-up can therefore publish multiple posts together. Future posts remain scheduled by their dates. Existing preview and production smoke tests, content and media checks, serialized deployments and rollback remain active. No article, image, byline or publication date is changed by this repair. The extra host timer remains disabled. The old publication-state URL is not maintained by ordinary builds and must not be treated as current site state.
