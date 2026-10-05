# Workflow-owned specimen assignment

Status: implementation authorized by Michel with “proceed”; source implemented and undergoing final review on 2026-10-05. Live enforcement and controlled publication remain pending.

## Owner requirements

- Only the workflow writes `src/content/specimen-ledger.txt` and assigns permanent `specimen` values. Bots, people and local agents never edit that file or run allocation locally.
- Confirmed site-wide submission contract: Grok bots, our writers, the Desk, manual publishers and every other producer submit article content and choose Habitat (`section`/`subsection`); the workflow alone supplies `specimen` and updates the ledger. No producer submits ledger changes or chooses permanent numbers. Normal editorial metadata remains part of the article.
- Automatically correct submitted specimen/ledger tampering in a workflow-generated commit; do not merely ask the producer to fix it. Record the attempted change and repair, and require fresh validation.
- Preserve all historical ledger bytes and published numbers. Keep `pubDate` publishing and the scheduled publisher; do not reinstate `queue.json` admission.

## Problem and evidence

PRs #169 and #172 independently received specimen 0393. After #169 merged, #172 needed collision repair. A maintainer push to the App-authored #172 correctly failed `publisher-paths`: author was the Grok App, sender was the maintainer. The prepared integration PR #174 preserves original commits and assigns 0394, but has not been merged following the owner's new workflow-only constraint. No further manual allocation is allowed.

## Threat sketch

This is a production publishing workflow. Protect permanent identities, ledger history, approved content, GitHub credentials and publication timing. Inputs are untrusted PR branches and review events. Execute orchestration only from trusted main; never run PR scripts or install PR dependencies in a credential-bearing job. Authenticate event actors numerically, constrain App writes, pin approved source and generated commit hashes, and fail closed on changed content, stale main or forged workflow evidence. Admin override remains technically possible; normal gates must block unrepaired manual ledger edits and accept only workflow-corrected commits without claiming GitHub admins cannot bypass policy.

## Proposed flow

1. Any producer submits a new Markdown article with valid Habitat (`section`, optional `subsection`) and other required editorial content, but no permanent specimen and no ledger change. Keep normal required article metadata; Habitat is the classification chosen by the bot, not a restriction that removes article content.
2. A credential-free candidate check validates the full article, sources, media and render. A narrowly scoped pending-submission mode permits missing specimen only for new candidate articles; ordinary main checks and production builds still require permanent numbers. Existing articles never lose their specimen. Preview displays pending identity without inventing a permanent number.
3. Editorial approval binds the content to the exact PR head. Initially only Michel/the authorized publisher may admit it. Green technical checks do not grant bots editorial or merge authority.
4. A trusted main workflow receives admission of that exact PR/head. One repository-wide serial admission worker handles eligible requests, in deterministic order, without cancellation. GitHub concurrency alone is not a reliable FIFO queue: persist safe request/run receipts and reconcile outstanding approved PRs after every admission and on recovery. This is orchestration state, not a content `queue.json` requirement.
5. Refresh main, verify the approved editorial content and allowed paths, then normalize workflow-owned fields before allocation. Ignore any submitted number on a new post. Restore every existing post's number exactly from current main, including a deleted or invalid specimen value; duplicate specimen-only fields may be removed/restored only when their boundaries and all editorial fields are unambiguous. Malformed YAML or ambiguity affecting editorial content must fail closed. Replace the candidate ledger with current main's exact bytes; untrusted additions, deletions or rewrites never become allocation input. Then use the trusted stamper to allocate from the trusted ledger. Generate a commit that changes only the admitted post's specimen and the expected append-only ledger entries. Preserve existing numbers and content. Handle legacy numbered pending PRs with the documented append-only collision/void repair, performed solely by workflow code.
6. Push using the workflow's narrowly scoped App identity. Validate the exact generated commit without secrets, including ledger prefix, one atomic allocation transaction (which may number multiple posts), article/render/media tests and original editorial content binding. Check provenance so a bot cannot manufacture an apparently workflow-owned ledger edit. Plain commit author names are not proof.
7. Before merging, re-read main SHA, PR head, approval and required check results. If main moved or content changed, recompute/revalidate; never merge stale allocation. Pin the head and require server-enforced current-base validation at merge (strict required checks against current main or a trusted merge queue). A client-side reread followed by a pinned-head merge is insufficient: it leaves a base-update race. Verify enforcement for the actual merge identity; fail closed if unavailable. Owner/admin bypass remains an explicit policy exception, not a claimed atomic guarantee. Merge as a merge commit. Never force-push, use admin merge, or change a guard merely to turn a check green.
8. Wait for the normal deploy and verify article HTTP 200, expected specimen, content and hero. Respect future pubDate: a future post stays scheduled, and its absence is expected. Record pending versus published truthfully.

## Automatic repair contract

- Treat submitted specimen values and ledger edits as untrusted input. Candidate checks report them as pending automatic correction; the final merge gate blocks them until a verified workflow repair exists. The repair workflow must be triggerable even when numbering/path checks are red, without granting admission or executing PR code.
- New articles receive numbers exclusively from trusted main's ledger. A bot-supplied number never reserves an identity. Existing articles keep their already published numbers, even if the submission changes or removes them.
- Restore the candidate ledger from current main and append only trusted workflow allocations. Never overwrite main's ledger, remove its history or propagate bogus submitted ledger entries. Preserve attempted edits in Git/run evidence; they are not authoritative issuance records.
- Legacy pending allocations with provable prior workflow/stamper provenance use the migration repair described above. Untrusted hand-written entries are not preserved as legitimate allocations merely because they look well formed.
- Push a normal corrective commit, never rewrite the producer's history. Record each corrected path/value, without secrets. Keep article content, Habitat, source links, hero, author and dates unchanged. Editorial approval binds canonical content with only workflow-owned specimen/ledger fields excluded; any other content change invalidates it.
- Reject ambiguous frontmatter, unsafe paths/file types or conflicting editorial mutations instead of guessing. Repeated tampering is logged and blocks further admission pending operator review. This protects integrity without making a false number a manual repair chore.
- Re-run full checks on the repaired head and current base. Repair is neither editorial approval nor merge permission; fail closed if the workflow cannot safely authenticate, parse or correct the input.

## Identity and permissions design

Use a dedicated workflow identity for allocation, with only necessary repository branch-write permissions and no workflow-file permission. All producer lanes lose ledger-write acceptance, including maintainer-authored and existing publishing-App lanes. A maintainer identity alone never satisfies allocation provenance. Extend the path guard narrowly for proven allocation runs: exact configured workflow identity, same repository, trusted-main workflow provenance, expected post/ledger mutation and generated SHA. Bind provenance to the head; reruns must not recycle acceptance from another head.

Keep allocation separate from the privileged merge identity. Reuse an existing authorized publisher identity only after verifying its actual permissions/ruleset access. Do not borrow Michel's credentials for routine bot automation. Installation secrets stay in trusted orchestration jobs; no untrusted code, arbitrary URLs or artifacts may execute with them. Restrict credentials to this repository and revoke run-local tokens on completion.

## Implementation batches

1. **Contract:** update builder, preflight, candidate checks, Desk/writer/manual publishing instructions and every publishing integration for unnumbered submissions; preserve strict main checks. All producers choose Habitat and supply article content; workflow alone supplies numbering. Remove local allocation/stamping calls from every producer, including Desk operations, our writer tools and posting/MCP integrations. Inventory and migrate all entry points before activation.
2. **Allocator:** trusted deterministic stamping, immutable receipts, exact-content binding, idempotent retry and legacy collision migration. No new external datastore.
3. **Admission:** workflow-only identity/provenance checks, serial reconciliation, fresh-base/head checks and authorized pinned merge. Configure App/ruleset permissions only as part of implementation.
4. **Acceptance:** frozen-SHA independent security/code review, isolated concurrent-PR tests, one controlled publication, then enable the workflow. Do not grant unrestricted Grok merge permission as a shortcut.

## Tests and acceptance criteria

- Two approved PRs submitted against the same main receive distinct permanent numbers and both publish successfully in sequence.
- Grok, our writer/Desk Apps, manual and maintainer submissions with fake, changed, removed or duplicate specimen values are automatically corrected; untrusted ledger edits are discarded from the candidate against trusted main. Unrepaired heads fail the merge gate; corrected heads pass only with verified workflow provenance.
- Cover negative/huge/string numbers, duplicate YAML fields, deletion/reordering of ledger history, fabricated reservations, edits to existing post numbers, and reruns after corrective commits. Specimen-only invalid/duplicate values are corrected when safely separable; malformed YAML or editorial ambiguity blocks safely; no historic main bytes or published numbers change.
- Retry after allocation, push, checks, merge or deployment does not issue another number or duplicate a ledger row.
- Human/main updates during checks, changed PR content, revoked approval, wrong sender/App, forged receipt, deleted/closed PR and failed media/build block admission safely.
- Existing numbers, URLs, historical/void entries and ledger byte prefix remain intact. No deployment-time renumbering and no independent deploy writer.
- Test both single-post and multi-post PRs from every producer. Allocate multiple posts deterministically in the same atomic admission and preserve their requested publication dates.
- Reconcile older pending numbered PRs automatically; no hand-edit instructions remain in the bot guide.
- No secrets in logs/artifacts and no PR code execution in credential-bearing jobs.

## Recovery and rollout

Keep a durable run record with PR, approved head, base, generated head, allocation, checks, merge/deploy SHAs and outcome. Recover by inspecting main and receipts before doing anything; a reservation is not publication. Failures preserve evidence and historical entries. Disable admission if broken while retaining the last published ledger and normal pubDate deploys. Do not restore a stale ledger or revoke a published number. Publish precise instructions and operator recovery commands with implementation, not fabricated commands in this plan.

## Current boundary

This document changes no workflows, Apps, permissions, schema or posting policy enforcement. #169 is merged and its deployment succeeded; #172's content is prepared in #174 and remains pending workflow-owned admission. Implementation and completion of that outstanding admission require the future workflow. The site-wide Habitat contract is confirmed. This applies equally to our posts and the Desk. Existing producer commands remain unchanged until implementation; documentation must explicitly distinguish proposed behavior from current behavior.
