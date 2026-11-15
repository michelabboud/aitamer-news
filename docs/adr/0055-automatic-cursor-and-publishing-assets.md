# 0055: Automatic Cursor submissions and publishing assets

Status: accepted by owner instruction, 2026-11-15.

## Context

The owner requests that Grok and Cursor publish without human approvals or reviews. Grok articles already use automatic trusted admission; Cursor branches do not. PR483 changes lesson-kit JSON and PDFs, which no existing publishing lane accepts. Branch rules already require zero approving reviews. Required automated validation remains useful and is not an editorial approval.

## Decision

Use the existing trusted-main admission, credential-free validation, certification and exact-head merge process for both producers. Cursor is recognized by the owner's pinned numeric account on a same-repository non-draft cursor/* PR into main. Cursor opens PRs through that account. Grok retains its pinned App identity and grok/* namespace. A prefix alone, a fork or a different account grants nothing.

Allow plain added or modified lesson-kit JSON, lesson PDFs, post-scoped SVG diagrams and the series catalog as publishing data. Asset-only submissions need no article number. The trusted allocator carries asset blob IDs into its deterministic tree; the editorial digest binds paths and exact blob IDs alongside article bytes. Binary files are never decoded as UTF-8. Preserve existing article-only digest receipts. Reject deletes, executable files, symlinks, code and workflow edits. Refuse stale changes when main has changed that asset. Bound each asset at20MiB and each submission at200assets. Quill remains article-only. Parse JSON with strict UTF-8 and require lesson-kit slug/filename agreement. Verify PDF structure with Poppler pdfinfo only inside the credential-free validation job, with a10second timeout; discovery uses only bounded signatures. The isolated validation job installs the distribution-maintained poppler-utils security package. The trusted allocator App also needs write access on cursor/* branches, as already granted on grok/*. Preserve all other branch rules.

Cursor observation checks are distinct from required certificates, like Grok's. The finalizer discovers eligible PRs automatically and merges only a fully validated certificate for the current base and exact head. The owner has removed human editorial review from these publishing routes, not automated checks. Existing image-approval and other account lanes retain their separate scopes.

## Alternatives rejected

- Bypass required checks or give bots unrestricted code access: unnecessary authority and no publication-integrity guarantee.
- Copy Cursor changes into a maintainer branch each time: preserves the manual bottleneck.
- Only allow lesson-kit paths in the old path guard: articles would still lack automatic numbering and merge.

## Consequences

Bot publishing can complete without a person approving or reviewing it. Failed builds, invalid data, conflicts and changed heads still stop publication. Same-repository write access and the owner's Cursor account are the trust boundary for Cursor. Workflow changes deploy through a normal source PR. The existing finalizer schedule supplies recovery if a completion wake is missed.
