# Reviewed articles advance one at a time, with acknowledged publication state

## Context

A timestamp-only rebuild can release every overdue article. A short due-post lookback can also miss a long scheduling outage. The publishing request requires unique half-hour slots, editorial decisions for the whole queue, and continued publication without relying on a model session. The site's current full-build preview, smoke tests and rollback remain useful safeguards.

## Decision

`publication/queue.json` records a verified historical baseline and the exact source hashes, review receipt hashes and half-hour slots of accepted articles. `scripts/publication.mjs` validates that contract and selects at most one due article. All deployment entry points run under the existing non-cancelling `pages-production` concurrency group. A push or default manual action retains current article visibility; only explicit `publication_mode=publish` can advance it.

The deployed `/publication-state.json` contains the exact visible set, the last article publication workflow identity and the most recent deployment workflow identity. Keeping these identities separate lets code-only deployments bind a new artifact receipt to the served state without resetting the article spacing clock. The next advance requires a successful most-recent deployment with a matching archived GitHub receipt: its selection, checked artifact, production verification, actual production deployment ID and outcome must all agree with the served state digest and workflow identity. The last article publication attempt must also have completed successfully, and at least 30 minutes must have elapsed from its completion timestamp. A missing receipt or failed attempt recovers the same visible set and creates a fresh receipt; a present but mismatched receipt fails closed. Missing state requires explicit bootstrap against an exact observed live baseline digest. Corrupt or conflicting state fails closed.

Each deployment builds an isolated copy of the pinned source. Non-admitted posts are marked draft only in that copy. This preserves original article bytes while reusing the existing visibility rules for pages, feeds, search and comments, and the independent rendered-body checks. Before upload, the artifact's article and comment-thread sets must exactly equal the private pre-build selection, which is held outside the build copy and bound by a workflow step output digest. The preview and production retain all existing smoke checks; the selected article's parsed story body is additionally compared with the checked build, and both hashes enter the verification receipt. Whole-page byte comparison would incorrectly fail because the edge rewrites email-sharing links outside the article body.

The secondary GitHub schedule requests safe reconciliation with no timestamp lookback. A persistent operator-owned host timer may issue the same request and archive receipts; it needs no model to publish accepted inventory. No commits are created for individual publication ticks. Delayed publications remain spaced rather than being released in a burst. Ordinary code updates can rebuild the visible set without resetting the last article's spacing clock.

This supersedes the wall-clock-only article admission and due-window assumptions in ADR 0014. Preview-first deployment, production verification and rollback remain in force.

## Alternatives rejected

- More frequent cron or a wider lookback: neither limits which articles a build makes visible.
- Updating every article's source flag on each tick: adds unnecessary commits and changes reviewed files.
- A new hosted state service: the deployed manifest, GitHub attempt status and retained receipts already provide the required evidence.
- A new central visibility predicate: would also require changing independent build-body checks and comment consumers; a build copy reuses the proven draft boundary.

## Consequences and limits

The first activation requires an explicit baseline and never publishes a queued article. GitHub runner and host outages can still delay publication; neither schedule is an exact-time guarantee. Every normal deployment must use the guarded workflow. Direct administrative uploads outside it remain an operator bypass and require the same review discipline. The existing rollback API's canonical-deployment limitation remains as documented in ADR 0014; rollback now verifies the previously observed publication set too.

Receipts are uploaded under `publication-<run>-<attempt>` for 90 days; the host must archive them for longer retention. The hosted workflow independently retrieves the exact prior artifact from GitHub on every admission decision, so host archival is a durability copy rather than an admission dependency. Receipts contain publication metadata and verification results, never credentials. A missing historical artifact is reconciled without adding content. If the account's actual direct-upload allowance cannot sustain the required cadence, report that capacity limit instead of dropping articles or assuming a pricing exemption.

The new infrastructure dependency is GitHub's official `actions/upload-artifact` v7.0.1, pinned to `043fb46d1a93c77aae656e7c1c64a875d1fc6a0a`. Live vetting on 2026-10-04 checked the [latest release](https://github.com/actions/upload-artifact/releases/tag/v7.0.1), [repository](https://github.com/actions/upload-artifact), current issues and the repository security-advisory API. The project was unarchived and actively maintained; the advisory API returned no published advisories. This is not a full transitive dependency audit. It supplies authenticated immutable workflow artifacts; custom upload code or mutable caches would add more code or weaker receipt semantics. No application dependency changed.

## Status

Accepted for implementation 2026-10-04 under the queue preparation and continuing publication request. Runtime activation is conditional on exact-candidate checks, independent review and verified bootstrap; this document does not assert those have occurred.
