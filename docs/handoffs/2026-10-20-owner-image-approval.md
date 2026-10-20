# Owner image approval: accepted source and merge

Date: 2026-10-20. Task complete: owner image approval, original image merge and production acceptance verified.

- Source implementation: [PR #298](https://github.com/michelabboud/aitamer-news/pull/298), source `94cbc28a553fd881ac72836337c5274bec73b99b`, checkpoint `0.2.91`, merge `d6dcbfc9b4c6c0b2eb8250981633776bc9bcff29`. Local full suite **1092/1092**; build, media and output gates passed. Independent mechanical/deep reviews accepted, including the avatar URL and availability fix.
- Hosted owner approval: [run 39400050864](https://github.com/michelabboud/aitamer-news/actions/runs/39400050864) completed successfully: trusted prepare, credential-free validation and trusted certification. Exact image head `3eced3580046af9b782d7f1eda5679a740c155c9`, base `d6dcbfc9b4c6c0b2eb8250981633776bc9bcff29`, tree `8a057433841bf0e87446289cfbb4472123567246`, digest `fefcf24c43942254d252e2f0d579b6fdb1c9972345bc328ce45314e54a255754`.
- Original image: [PR #292](https://github.com/michelabboud/aitamer-news/pull/292) approved at that exact head with all seven checks successful; normally merged at `24d4b22fa6e2239c53bdd9ecab4713e6877ef21b`. The portrait is 180634 bytes, down from 2911332 bytes. Visual comparison preserved the same composition; remote avatar answered HTTP200 image/webp without redirect.
- Production acceptance: [deployment run 39400491915](https://github.com/michelabboud/aitamer-news/actions/runs/39400491915) succeeded. Independent live requests to `/`, `/aviram/` and `/authors/aviram/` returned HTTP200 and contained the new references. The live portrait returned HTTP200 image/webp, 180634 bytes, SHA256 `ec2cb87c19f09e7cf3635eeb03179baf1f8e307e8b7ec49b30af6626e8b370c6`, matching the exact reviewed asset. The avatar returned HTTP200 image/webp, 15472 bytes, SHA256 `a8842817747ddbc22829cda92300665485a00332ed80edc477b7a9bd304a9280`. These live receipts establish production acceptance separately from the source checks.

## How to approve future proposals

Bots propose on `images/<description>`; the owner opens [Actions → Approve image PR](https://github.com/michelabboud/aitamer-news/actions/workflows/image-approval.yml), selects main and supplies PR number plus full reviewed head SHA. A new head or moving main requires another owner dispatch. Supported formats, metadata, owned avatar origins and normal merge controls are in the [guide](../guides/owner-image-approval.md). Bots still cannot authorize themselves or change code, dates, article text, identity or numbering.

## Preserved evidence and local state

The [source report](../reports/2026-10-20-owner-image-approval.md) preserves the initial two workflow-inventory test failures and successful reruns. Persistent local logs, portrait copies and append-only hosted receipts live at `/home/michel/.local/state/aitamer-news/image-approval-20261020-Ccq2Ed/`.

The CLI merge precheck refused despite green checks; normal SHA-pinned REST merges succeeded under the unchanged server rules, without `--admin`. No branch protections were weakened. No data, logs, branches or worktrees were deleted. The unused local `maintainer/aviram-webp-portrait-20261020` branch preserves its preliminary cherry-pick. Standard ignored dependencies and build output remain; no local server or service was started.

Acceptance records and reconciled bot instructions use checkpoint `0.2.92` on `docs/owner-image-approval-acceptance-20261020`. Application code remains checkpoint `0.2.91`; no further implementation is pending for this request. The owner image decision is ADR0040, preserving the existing0038/0039 hero decisions. Dashboard: `/home/michel/.local/state/build-task-dashboard/tasks.html`, project `/home/michel/projects/aitamer-news`, run `aviram-image-adoption`, session `news-pr292-adoption`.
