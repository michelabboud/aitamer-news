# PR248 conflict resolution review

Accepted source: `6c879f65d93d9c85de2e3d87b920125702c82bf9`. Two fresh GPT-6 Astra xhigh sessions, same-family limitation; shared filesystem, separate contexts, excluded review/report inputs. Both accepted with no blocking findings. Tokens/latencies unavailable.

# PR 248 independent cold-read review A

Status: CONFIRMED source review; PASS for the disabled-lane conflict-resolution scope. No blocking findings.

- Review SHA: `6c879f65d93d9c85de2e3d87b920125702c82bf9`
- Main base: `0636f657ce953ff732284653de892746a35f92f5`
- Original PR parent: `3d6888d72633be923c22307c48440a49d6fa702e`
- Repository: `/home/michel/.local/share/aitamer-work/site-quill-lane`
- Scope: conflict resolution preserving main's PR 251 reliability changes and Quill's disabled independent lane, byline limits, trusted identity and required certificates. No App activation or pin change.
- Reviewer: Codex child review session; exact runtime model and effort not exposed to this reviewer. Same-family pair limitation supplied in the brief. This note does not establish cross-family review or independently verified process isolation.
- Inputs: standalone task brief, applicable global/project rules, local playbook layer and relevant review/testing skills; pinned Git objects and both parent diffs. No other reviewer output was read.
- Excluded contents: `docs/reviews/**`, `docs/reports/**`, coordinator conflict-resolution reports/handoffs, and every other reviewer's scratch directory. The cold note was written before opening any such material; none was opened.

## Source conclusions

1. Quill remains disabled. `scripts/specimen-admission.mjs:23` retains `QUILL_ACTOR = null`; lines 63-69 require a positive safe numeric pin, Bot identity, matching lane branch, same repository and main base. The mutable test object adds no production input path. The disabled-pin and identity negative cases remain in `scripts/quill-lane-admission.test.mjs:23-42`.
2. Main's candidate/infrastructure error distinction survives. `scripts/specimen-admission.mjs:389-427` uses `CandidateAdmissionError` only for submitted candidate shape/content errors; trusted baseline reads and infrastructure failures remain ordinary errors. Lines 842-853 catch only the typed candidate error, continue discovery, then apply the Quill byline gate. This keeps invalid older Quill submissions from starving either supported producer lane while preserving failure visibility for trusted data and infrastructure. Added regression cases cover malformed/oversize/invalid-UTF8 candidates for both successor lanes at `scripts/quill-lane-admission.test.mjs:136-151`, infrastructure errors at lines 153-158, and fatal trusted baseline errors at lines 160-170.
3. Byline ownership is retained at discovery and repeated validity checks. `scripts/specimen-admission.mjs:423-428` retains ancestor/current-main article texts; lines 178-180 and 851-853 enforce Quill ownership. `scripts/check-publisher-paths.mjs:269,332-345` keeps the immutable `quill` author list and checks candidate, ancestor and current-main bylines. Existing same-PR ancestry and editorial digest checks at `scripts/specimen-admission.mjs:183-192` prevent a later head from changing bylines without invalidating the bound source. The repeated validity check is exercised at `scripts/quill-lane-admission.test.mjs:172-181`.
4. The merge does not loosen certificates. `scripts/specimen-admission.mjs:451-460` still demands exact base/head allocation proof; lines 645-654 still require strict server current-base checks, all three named certificates bound to GitHub Actions integration 15368, repeated source validation and a normal merge pinned to the head SHA. Trusted validation remains isolated from producer executable code in `.github/workflows/specimen-admission.yml:83-141`.
5. Main's explicit terminal holds remain at `scripts/specimen-admission.mjs:739` and 990-998: the exact malformed owner-recovery condition, plus missing exact proof only for an already merged PR, retain evidence as held. Ordinary open-head/API failures remain retryable. Six reliability source/test/workflow files outside the conflict are byte-identical to the main base (command below).

## Nonblocking activation issue

A1 (CONFIRMED source mismatch; due before Quill activation, not a blocker for this frozen disabled candidate): once a future reviewed change pins Quill, an App credential holder can continue automatic admission after an operator unsets `QUILL_ACTOR_ID`, because `.github/workflows/check-publisher-pr.yml:123-128` routes `quill/` branches to `observe-paths`, which never reads that variable (`scripts/specimen-admission.mjs:679-684`), while automatic authority checks only the code pin (`scripts/specimen-admission.mjs:63-69,830,869-871`); the required certificates are issued by trusted admission at lines 556-560. The missing reachable step today is a non-null production pin (line 23). The route already exists in the original PR parent and is not introduced by this merge. This conflicts with the variable-only kill-switch promise in `docs/guides/quill-posting.md`; resolve its behavior/documentation in the activation work before treating that variable as revocation authority. No proof of concept or activation was attempted.

## Verification and limits

Independently executed, both exit 0 with no diagnostic output:

- `git diff --check 0636f657ce953ff732284653de892746a35f92f5..6c879f65d93d9c85de2e3d87b920125702c82bf9`
- `git diff --exit-code 0636f657ce953ff732284653de892746a35f92f5..6c879f65d93d9c85de2e3d87b920125702c82bf9 -- scripts/specimen-admission-data.mjs scripts/specimen-admission-data.test.mjs scripts/specimen-admission.test.mjs scripts/specimen-single-pr.test.mjs .github/workflows/scheduled-publish.yml scripts/deploy-workflow.test.mjs`

The coordinator brief reports 1,025 full and 183 focused tests passing. Those results were not independently rerun or treated as reviewer-produced evidence; this is a source review plus the read-only checks above. No live GitHub behavior, deployment, App activation or remote rules were exercised. No implementation files, repository metadata, App pins or commits were changed. The repository working tree remained clean.


# PR 248 independent source review B

CONFIRMED: no blocking conflict-resolution regression found in the reviewed scope; one documentation/activation limitation is confirmed below.
REFUTED: no submitted finding was adjudicated; no other review was opened.
UNVERIFIED: live CI, live repository configuration, deployment, App activation, and coordinator-reported test executions were not independently repeated.

## Frozen inputs and verdict

- Reviewed candidate: `6c879f65d93d9c85de2e3d87b920125702c82bf9`.
- Main base / second merge parent: `0636f657ce953ff732284653de892746a35f92f5`.
- Original PR / first merge parent: `3d6888d72633be923c22307c48440a49d6fa702e`.
- Repository: `/home/michel/.local/share/aitamer-work/site-quill-lane`.
- Mode: production. Scope is conflict resolution preserving main's publication reliability and Quill's disabled admission route; creation, identity pinning and activation of an App are excluded.
- Verdict: ACCEPT this frozen conflict-resolution candidate within that scope. No blocking findings. This is source-review acceptance, not activation, CI, merge or deployment evidence.

## Independence and method

This note was written after reading the brief and candidate source/ADRs/tests, before opening any other review or coordinator report. The task context contained the assigned brief and instruction environment, not a parent implementation discussion. The filesystem is shared; path exclusions are procedural, not filesystem isolation. The pair is same-family and does not establish cross-family corroboration. Runtime identifies this reviewer as GPT-6-based Codex; an exact model/effort receipt is not exposed inside this task.

Excluded: repository `docs/reviews/**`, `docs/reports/**`, coordinator handoff reports, all `/tmp/pr248-review-*` directories except this review's `/tmp/pr248-review-b-20261011`, and other reviewers' scratch. Read `PLAN.md` as required project instruction context; did not follow its report links. Read candidate source through pinned `git show`/`git diff`, not moving working files. No implementation edits, commit, push or live configuration changes.

## Source findings

1. Main's reliability changes are preserved. `scripts/specimen-admission.mjs:348-369` retries only bounded transient GET transport failures; writes remain one-shot. Lines `390-397` distinguish candidate blob failures from trusted failures; lines `415-426` preserve candidate rejection and strict source bounds. Lines `845-850` catch only `CandidateAdmissionError`, so a malformed older independent candidate cannot starve a later valid one while Git/infrastructure/trusted-data failures still propagate. Lines `851-854` retain Quill's separate byline refusal. The exact terminal owner-recovery and merged-proof holds remain at lines `736-739` and `988-1000`; they preserve failed evidence rather than accepting it.
2. Quill remains disabled at admission. `scripts/specimen-admission.mjs:23-26,63-68` keeps the production pin null and rejects non-positive/non-integer pins. Independent identity still requires the pinned numeric Bot identity, matching branch prefix, same repository, non-draft PR and main base. Neither the repository variable nor a branch prefix supplies that authority. Original Grok identity is unchanged.
3. Byline ownership survives the merge seam. `scripts/specimen-admission.mjs:411-428` now returns candidate texts plus the ancestor/current-main texts for modified posts without losing main's candidate error classification. `scripts/check-publisher-paths.mjs:268-354` uses a frozen `['quill']` byline list, strict reader and old/current ownership checks. Admission checks those texts before dispatch (`851-854`) and on approval revalidation (`174-180`), reached again before numbering writes (`507`) and before merge (`636,650`). Editorial digest and authenticated numbering ancestry remain mandatory.
4. Required certificates remain separate from observations. The Quill prefix adds only observation names in `.github/workflows/check-posts.yml:27`, `check-publisher-pr.yml:59`, and `check-specimen-pr.yml:16`; it gives no required success. Admission checks out trusted base, materializes only deterministic content data, validates in a separate job and certifies after validation (`.github/workflows/specimen-admission.yml:83-141`). `scripts/specimen-admission.mjs:451-460,589-654` still requires a successful trusted run and exact base/head proof, strict server checks, pinned Actions integration, current main, repeated source validation and the normal pinned-head merge API.

## Nonblocking documentation / future activation finding

**B-1: the advertised repository-variable kill switch does not stop trusted admission after future activation.** `docs/guides/quill-posting.md:16,22` and `docs/adr/0036-quill-app-content-pull-requests.md:12,23,26` say unsetting `QUILL_ACTOR_ID` immediately closes the lane. However, a `quill/` branch takes `observe-paths` rather than the variable-aware publisher guard (`.github/workflows/check-publisher-pr.yml:123-128`). Trusted admission uses only the code pin (`scripts/specimen-admission.mjs:63-68,825-872`) and never reads that variable. Suspending the App prevents fresh authenticated writes, but this code does not independently check installation suspension when admitting already-open PRs either. The guide should not promise that all existing requests stop on either mechanism.

Attack story after a future pin: a holder of the Quill App credential can continue submitting same-repository Quill articles after an operator merely unsets the advertised kill-switch variable, because discovery and certification use the still-pinned identity. Missing step in this frozen candidate: `QUILL_ACTOR` is null, and setting it is explicitly outside this task. Therefore this does not block the disabled conflict-resolution candidate. Treat it as an activation prerequisite and correct the operational documentation before relying on variable removal to stop admission. No pin change or fix is performed by this reviewer.

## Verification evidence and limits

- Ran pinned parent/target object comparisons. Main's `specimen-admission-data.mjs`, `specimen-integrity.mjs`, `specimen-finalize.yml`, `scheduled-publish.yml`, and admission/data/single-PR tests are byte-identical to the main base: `git diff --quiet` exit 0.
- Original PR's `check-publisher-paths.mjs`, `quill-pr-paths.test.mjs` and four Quill workflow files are byte-identical to the first merge parent: `git diff --quiet` exit 0.
- Ran `git diff --check 0636f657ce953ff732284653de892746a35f92f5 6c879f65d93d9c85de2e3d87b920125702c82bf9`: exit 0.
- Read the new merge-specific regression tests in `scripts/quill-lane-admission.test.mjs:136-169`: malformed/oversize/invalid-UTF8 older Quill inputs permit later Quill/Grok dispatch; infrastructure errors and invalid trusted baseline remain fatal. Read disabled identity, byline and actual workflow-expression tests as well.
- Coordinator brief reports 1,025 full-suite and 183 focused passes. Those counts are attributed to the coordinator; this reviewer did not rerun them, since no source defect or uncovered merge behavior justified duplicate execution. No live API or activation probe was made.
