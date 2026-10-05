# Single-PR publication implementation plan — 2026-10-05

Runtime repair, 2026-10-05: GitHub moved a review's REST commit anchor after numbering. The authorized [immutable source binding decision](../adr/0034-immutable-owner-review-source.md) preserves the original trusted root, proves numbering descendants, adds event-time receipts for first discovery, and corrects observation comparisons to the actual trusted checkout. Versions 0.2.71/72 deployed successfully; original PR197 remains held pending the reviewed repair and automatic recovery proof. Root owns readiness/review edits; implementation owns the scoped source/test/docs checkpoint. No new approval or manual admission dispatch replaces the original reviewed source.

Dev mode: production. Tasks run back to back. Authorized by Michel's current request; no additional approval gate. Root coordinates implementation and live proof; admission_recovery owns source changes; specimen_security_review owns this plan and independent frozen-candidate review. Native collaboration messages carry findings and commit/hash receipts. This plan changes no repository or GitHub settings itself.

## Threat sketch

- Protect permanent specimen identities, ledger history, reviewed editorial content, repository/App credentials, and production output.
- Untrusted entry points: producer PR blobs, branch names, review-event workflow code/payloads, comments, labels, and concurrent source pushes.
- Only trusted-main code may mint/use the publishing App token or certify numbering. PR code/dependencies never execute with that token.
- Exact owner review authorizes editorial bytes; a prefix, label, App identity, commit message, or workflow wake never authorizes content.
- Only main's ledger allocates identities. Shared publishing App credentials alone cannot produce an Actions admission certificate.
- Ref updates preserve source history; pinned normal merges and strict current-base required checks prevent stale numbering admission.
- Historical generated-PR proofs, protected control state, deployment verification, published identities and dates remain valid.

## Ground truth and decision

Inspected fresh full main clone /tmp/aitamer-single-pr-review-20261005-sr5Ltb at e284f089db10ae91b8f5e362d4abe8f43484fbc7 and live rules APIs. PR197 is open, same repository, grok/what-is-grok-bot at 429d235f4c50be108994e6bce124d22f62fb56af; no review was present at inspection. Its future publication date must remain unchanged.

Add a narrow same-PR adapter to the current admission controller. New admissions append the numbered commit to the original branch and merge that original PR. Keep the allocator, isolated validator, check receipt format, protected state format, legacy generated-PR verification/reconciliation, and deployed-gate. No new service, queue, framework, producer ledger grant, or generated PR for new admissions.

## 1. Automatic trusted entry

- Add a no-op `pull_request_review` wake workflow for submitted/edited/dismissed events: `permissions: {}`, no checkout, secrets, API calls, artifacts, or payload interpolation into commands. It is only a notification. Its PR-side definition is untrusted.
- Add this workflow name to the existing trusted-main finalizer's `workflow_run: completed` triggers. Its existing five-minute schedule remains missed-event/cancelled-run recovery.
- In trusted-main finalization, discover open, non-draft, same-repository article PRs targeting main. Query GitHub reviews independently. Latest decisive owner review must be APPROVED and its commit_id must equal the editorial source SHA. Ignore COMMENTED for revocation; a later CHANGES_REQUESTED or DISMISSED invalidates approval. Never resurrect closed/superseded PRs.
- Persist a new request via the existing trusted-main workflow_dispatch. Include an explicit same-PR discriminator and owner review ID in the durable run-name/request inputs, alongside source PR and immutable reviewed source SHA. Authenticate the review again in prepare/finalize; arbitrary Actions actor plus recovery=0 is not authorization.
- Reuse the existing pending run index/discovery and retry grouping. Deduplicate PR + immutable review ID + source SHA against queued/running/completed attempts; a scheduled wake must not launch duplicate work. Failed/cancelled pre-prepare runs remain recoverable automatically.
- Preserve existing owner dispatch authorization for historical and exceptional owner-authored manual submissions (GitHub disallows approving one's own PR). Ordinary Grok/Desk/manual branches authored by another account need only one owner review; no recurring owner dispatch. If eliminating dispatch for self-authored PRs is required, use an owner-authored exact-head `/publish <40-hex-sha>` issue comment, authenticated from GitHub by numeric ID, as the one explicit approval—not labels or PR authorship alone. Keep this fallback narrow and document it.

## 2. Same-branch deterministic preparation

- Pin the trusted policy/allocator base to the admission run's main `head_sha`; keep the invariant `BASE_SHA === run.head_sha`. If main advanced before prepare, automatically retry on current main. Do not weaken proof verification to silently accept a different allocation base.
- Fetch immutable main, original reviewed SOURCE_SHA, and current source branch head. Reject forks, main/state/generated namespaces, closed/draft/moved PRs, unsafe paths, file types, ambiguous YAML, deletions, and editorial differences since owner approval. Number-only producer mistakes and an untrusted ledger are repairable under the existing allocator policy.
- `collectAdmission(base, reviewedSource)` remains the canonical allocation. Reuse its main-ledger prefix preservation, restoration of existing identities, deterministic new numbering, and editorial digest. Preserve pubDate, draft intent, body, byline, hero and sources.
- Build the new Git tree from trusted main plus only planned regular article blobs and the allocator ledger. New commit parents are `[base, observedBranchHead]`; the original reviewed source remains a separate immutable authorization input. On the first attempt observedBranchHead equals SOURCE_SHA. On recovery it may be an earlier allocation commit whose editorial content must still match the original review.
- Update the SAME source ref with `force:false`, after rechecking current branch/head and approval. Non-fast-forward refusal means a concurrent producer update: reread and reevaluate; never force, reset, silently overwrite a new commit, or create another PR. Re-read PR head after write.
- Lost-response/crash recovery: derive the existing head's actual tree/parents and compare against deterministic allocation from authenticated main/source. Matching existing work can be revalidated; commit messages/comments are locators, not authority. Repeated successful prepare must not append endless no-op commits.
- Keep the existing global mutation concurrency boundary across same-PR and legacy finalization; no simultaneous uncontrolled allocator/ref/merge writer. GitHub concurrency is not FIFO and replaces pending runs, so retain scheduled recovery from durable approvals/runs. Strict base checks remain necessary between completed validation and merge.

## 3. Validation, proof and required checks

- Keep separate prepare / read-only validate / certify jobs, checked out from pinned trusted main with persist-credentials:false. No App key/token in validator; never checkout the source tree there. Materialize only verified Markdown and ledger data.
- Extend materialize only as needed for same-PR parent order: `[base, observedBranchHead]`, authenticated immutable reviewedSource, exact expected tree/modes/paths, matching editorial digest. Run every current test/post/media/build/body/CSP/link/diagram gate unchanged.
- Keep the existing certificate external_id format (repository/base/numberedHead/digest/run ID), Actions App15368 identity, canonical-or-run details URL handling, trusted-main workflow identity, completed successful run, and exact base/head binding. Distinguish same-PR vs historical requests by durable authenticated request metadata, not branch name.
- Avoid recreating the same-name check collision: all three ordinary source checks must use observation names for admission source branches, just as specimens/run-* does today. Recognize known article namespaces (`grok/*`, valid desk/posts-*), plus a controller-applied admission label for arbitrary manual branches. Set the label before appending the numbered commit. Prefix/label affects names only; without the certificate required contexts remain absent/pending and merge is impossible.
- Account for App5107739 becoming the synchronization sender on a Grok/manual PR: existing publisher-paths sender/author rule rejects that event. An observation or proof-aware path must handle this; never grant a blanket App/prefix permission exception. On a certified candidate the trusted full validator—not a sender exemption—supplies required success.
- Before numbering, report waiting-for-owner-review/numbering accurately; do not emit green required checks merely because a candidate is unnumbered. Keep ordinary code/author/comment PR required contexts unchanged. Retain observations for legacy generated branches and the exact specimens/state push exclusion.

## 4. Finalize/recover the same PR

- For new requests, locate original PR by authenticated request.pr; preserve legacy generated-branch lookup for old requests. Verify original source approval, exact current numbered head, actual ancestry, deterministic tree/digest, and successful trusted admission certificate.
- Re-read owner review, PR state/head, current main, and required rules immediately before merge. Require the same three strict current-base checks bound to Actions15368. Use normal merge method=merge with sha=numberedHead; no admin override or relaxed rule.
- If main advanced, reconstruct current-base allocation and append a replacement numbering commit on the SAME branch. Revalidate and certify the new exact tree. Carry original review only while editorial digest is unchanged. Changed content needs a fresh owner approval. Closed/rejected/superseded requests stay held.
- Already-merged source PRs go directly through authenticated merge/deployment verification, not the open-source approval guard. Merge parents remain `[base,numberedHead]`, and merge tree must equal validated head tree; this retains deployed-gate compatibility.
- Preserve existing state schema, independent Actions state certificate, ruleset revision pin, non-force CAS behavior, deployment completion witnesses, and historical admission readers. Do not replay all completed history or drop pending legacy requests.
- Retain 60-second deploy aggregation, production deployment serialization/verification, date-based visibility and disabled queue.json. A future post can be successfully merged and deployed while correctly absent from the public page.

## 5. Minimal live rules changes (root, after reviewed source)

- Ruleset24469063 currently permits admin role5 + Grok App5189850 on grok/*: add publishing App5107739, retaining existing actors/restrictions.
- Ruleset24115823 already permits publishing App5107739 on desk/posts-* and desk/authors-*: no expansion needed there.
- Generic non-default namespace rule24029856 keeps creation/deletion administrator-only. Root added update-only rule24520133 with identical generic selectors, permitting admin5 and publishing App5107739 for arbitrary manual source branches; this is a real branch-update expansion and is documented. It grants no workflow-edit permission, owner approval, numbering certificate or merge-check bypass. All meaningful main admission protection must remain independently enforced by main's trusted checks.
- If a separately protected producer namespace (such as cursor/*) is supported, its own ruleset needs the same narrow publishing App addition; do not assume the generic rule covers excluded namespaces.
- Keep main update rule24468307, strict PR/check rule24029855, protected specimens/* rule24488522, and App permissions unchanged. No Grok/Desk Actions permission or human private key is required. Read back effective rules; never print App secrets.

## File ownership and acceptance evidence

Worker owns: new tiny review-wake YAML; .github/workflows/specimen-admission.yml and specimen-finalize.yml; focused same-PR adapter/controller tests in scripts/specimen-admission.mjs/.test.mjs (or small sibling module); materialize/proof changes only where required; the three check workflows and context/path tests; docs/guides/workflow-owned-specimens.md, new superseding ADR+index, plan/report and normal repository close-out records. Existing allocator/data logic should stay unchanged unless a test proves a necessary correction. Root owns live rules, review, merge, deployment and VERSION allocation. Reviewer changes no source/settings.

Required focused tests:
1. Owner review exact head triggers automatically once; nonowner/stale/withdrawn/closed/fork review and forged wake/label never authorize.
2. First allocation updates original ref and merges original PR; no POST /pulls and no new specimens/run-* branch.
3. Wrong/missing producer specimen and fabricated ledger repaired solely from main; prior published identities and dates preserved.
4. Producer update between read/write rejected by FF/head binding; edited bytes after numbering invalidate approval/certificate.
5. Two PRs from the same main: unique final allocations after stale-base recovery on the SAME PR, no manual redispatch.
6. Lost update response, crash before cert, validation failure, queued cancellation, repeated wake and main advance recover without duplicate PR/ledger reservations/no-op commit loops.
7. Forged App commit/certificate, mismatched source/base/head/run/review, PR workflow/script/package edits, symlink/MDX/deletion rejected. No PR code or dependency executes in App-secret jobs.
8. All three normal contexts remain distinct from certificates on source numbered heads, including manual label and push checks; spoofed prefix/label cannot merge; ordinary nonarticle PR checks unchanged.
9. Historical generated-PR proof and deployed-gate/state fixtures still pass; already merged same-PR request completes deployment even though source is now closed.
10. Frozen focused/full test/build gates + independent security review. Runtime PR197 receives one owner approval, obtains an appended workflow commit, required checks, and normal merge of197 itself. Verify immutable original source ancestry, ledger uniqueness, unchanged Oct8 pubDate, successful production deploy/site health and expected scheduled absence; do not claim article live before due.

Primary technical references: GitHub Actions events (pull_request_review uses PR merge ref; workflow_run executes default-branch workflow), https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows ; non-force ref updates, https://docs.github.com/en/rest/git/refs#update-a-reference ; review author/state/commit binding, https://docs.github.com/en/rest/pulls/reviews .
