# Owner-approved bot image updates

Dev mode: production. Authorized by Michel on 2026-10-20: resolve PR #292's checks and provide a GitHub control to approve bot image updates.

## Design

Bots may propose image updates without acquiring general repository write authority. A dedicated workflow on trusted `main` accepts a PR number and the full commit SHA the owner reviewed. Only Michel's pinned numeric GitHub identity may authorize a run. Approval applies to that head and the current base only. A new push or base movement requires a fresh run.

Separate jobs inspect the allowed data changes, run the site's complete validation without writer credentials, and certify the exact candidate from trusted main. Ordinary merge rules still apply. The article allocator, bot path restrictions and permanent specimen identities remain intact. See the [architecture decision](../adr/0038-owner-approved-image-updates.md).

## Tasks and evidence

1. Implement the bounded image policy, dispatch workflow and adversarial regression tests. Owner: implementation agent; files: `scripts/image-approval*` and `.github/workflows/image-approval.yml`.
2. Document the approval control, record the decision and verify the implementation. Owner: coordinator; documentation and version records only.
3. Obtain independent security and mechanical review, resolve findings, run remote checks and merge the maintainer implementation PR.
4. Refresh PR #292 onto current main, dispatch approval for its exact head, verify required checks and merge normally. Verify the production deployment separately.

One implementation batch, with root coordinating. Planning: Astra xhigh; security implementation: Sol xhigh; independent review models and results recorded in the close-out report. No third-party dependency is added.

Status: running. Source implementation, review, remote checks, original image merge and deployment remain pending.
