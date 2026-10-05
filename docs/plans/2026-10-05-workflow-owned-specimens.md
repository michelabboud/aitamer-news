# Workflow-owned specimen assignment

Status: plan requested 2026-10-05; implementation not authorized by this planning request.

## Owner requirements

- Only the workflow writes `src/content/specimen-ledger.txt` and assigns permanent `specimen` values. Bots, people and local agents never edit that file or run allocation locally.
- Confirmed submission contract: bots submit the article and choose Habitat (`section`/`subsection`); the workflow alone supplies `specimen` and updates the ledger. Bots do not submit ledger changes or choose permanent numbers.
- Preserve all historical ledger bytes and published numbers. Keep `pubDate` publishing and the scheduled publisher; do not reinstate `queue.json` admission.

## Problem and evidence

PRs #169 and #172 independently received specimen 0393. After #169 merged, #172 needed collision repair. A maintainer push to the App-authored #172 correctly failed `publisher-paths`: author was the Grok App, sender was the maintainer. The prepared integration PR #174 preserves original commits and assigns 0394, but has not been merged following the owner's new workflow-only constraint. No further manual allocation is allowed.

## Threat sketch

This is a production publishing workflow. Protect permanent identities, ledger history, approved content, GitHub credentials and publication timing. Inputs are untrusted PR branches and review events. Execute orchestration only from trusted main; never run PR scripts or install PR dependencies in a credential-bearing job. Authenticate event actors numerically, constrain App writes, pin approved source and generated commit hashes, and fail closed on changed content, stale main or forged workflow evidence. Admin override remains technically possible; normal gates must reject manual ledger edits without claiming GitHub admins cannot bypass policy.

## Proposed flow

1. A bot submits a new Markdown article with valid Habitat (`section`, optional `subsection`) and other required editorial content, but no permanent specimen and no ledger change. Keep normal required article metadata; Habitat is the classification chosen by the bot, not a restriction that removes article content.
2. A credential-free candidate check validates the full article, sources, media and render. A narrowly scoped pending-submission mode permits missing specimen only for new candidate articles; ordinary main checks and production builds still require permanent numbers. Existing articles never lose their specimen. Preview displays pending identity without inventing a permanent number.
3. Editorial approval binds the content to the exact PR head. Initially only Michel/the authorized publisher may admit it. Green technical checks do not grant bots editorial or merge authority.
4. A trusted main workflow receives admission of that exact PR/head. One repository-wide serial admission worker handles eligible requests, in deterministic order, without cancellation. GitHub concurrency alone is not a reliable FIFO queue: persist safe request/run receipts and reconcile outstanding approved PRs after every admission and on recovery. This is orchestration state, not a content `queue.json` requirement.
5. Refresh main, verify the approved article bytes and allowed paths, then use the trusted stamper to allocate from the current ledger. Generate a commit that changes only the admitted post's specimen and the expected append-only ledger entries. Preserve existing numbers and content. Handle legacy numbered pending PRs with the documented append-only collision/void repair, performed solely by workflow code.
6. Push using the workflow's narrowly scoped App identity. Validate the exact generated commit without secrets, including ledger prefix, one allocation, article/render/media tests and original editorial content binding. Check provenance so a bot cannot manufacture an apparently workflow-owned ledger edit. Plain commit author names are not proof.
7. Before merging, re-read main SHA, PR head, approval and required check results. If main moved or content changed, recompute/revalidate; never merge stale allocation. Pin the head and require server-enforced current-base validation at merge (strict required checks against current main or a trusted merge queue). A client-side reread followed by a pinned-head merge is insufficient: it leaves a base-update race. Verify enforcement for the actual merge identity; fail closed if unavailable. Owner/admin bypass remains an explicit policy exception, not a claimed atomic guarantee. Merge as a merge commit. Never force-push, use admin merge, or change a guard merely to turn a check green.
8. Wait for the normal deploy and verify article HTTP 200, expected specimen, content and hero. Respect future pubDate: a future post stays scheduled, and its absence is expected. Record pending versus published truthfully.

## Identity and permissions design

Use a dedicated workflow identity for allocation, with only necessary repository branch-write permissions and no workflow-file permission. The content bot loses ledger-write acceptance. Extend the path guard narrowly for proven allocation runs: exact configured workflow identity, same repository, trusted-main workflow provenance, expected post/ledger mutation and generated SHA. Bind provenance to the head; reruns must not recycle acceptance from another head.

Keep allocation separate from the privileged merge identity. Reuse an existing authorized publisher identity only after verifying its actual permissions/ruleset access. Do not borrow Michel's credentials for routine bot automation. Installation secrets stay in trusted orchestration jobs; no untrusted code, arbitrary URLs or artifacts may execute with them. Restrict credentials to this repository and revoke run-local tokens on completion.

## Implementation batches

1. **Contract:** update builder, preflight, candidate checks and bot instructions for unnumbered submissions; preserve strict main checks. Bots choose Habitat and supply article content; workflow alone supplies numbering.
2. **Allocator:** trusted deterministic stamping, immutable receipts, exact-content binding, idempotent retry and legacy collision migration. No new external datastore.
3. **Admission:** workflow-only identity/provenance checks, serial reconciliation, fresh-base/head checks and authorized pinned merge. Configure App/ruleset permissions only as part of implementation.
4. **Acceptance:** frozen-SHA independent security/code review, isolated concurrent-PR tests, one controlled publication, then enable the workflow. Do not grant unrestricted Grok merge permission as a shortcut.

## Tests and acceptance criteria

- Two approved PRs submitted against the same main receive distinct permanent numbers and both publish successfully in sequence.
- Bots and maintainer-authored PRs that manually edit ledger or specimen fail policy checks; legitimate workflow changes pass using verified provenance.
- Retry after allocation, push, checks, merge or deployment does not issue another number or duplicate a ledger row.
- Human/main updates during checks, changed PR content, revoked approval, wrong sender/App, forged receipt, deleted/closed PR and failed media/build block admission safely.
- Existing numbers, URLs, historical/void entries and ledger byte prefix remain intact. No deployment-time renumbering and no independent deploy writer.
- Reconcile older pending numbered PRs automatically; no hand-edit instructions remain in the bot guide.
- No secrets in logs/artifacts and no PR code execution in credential-bearing jobs.

## Recovery and rollout

Keep a durable run record with PR, approved head, base, generated head, allocation, checks, merge/deploy SHAs and outcome. Recover by inspecting main and receipts before doing anything; a reservation is not publication. Failures preserve evidence and historical entries. Disable admission if broken while retaining the last published ledger and normal pubDate deploys. Do not restore a stale ledger or revoke a published number. Publish precise instructions and operator recovery commands with implementation, not fabricated commands in this plan.

## Current boundary

This document changes no workflows, Apps, permissions, schema or posting policy enforcement. #169 is merged and its deployment succeeded; #172's content is prepared in #174 and remains pending pending workflow-owned admission. Implementation and completion of that outstanding admission require the future workflow. The Habitat contract is confirmed.
