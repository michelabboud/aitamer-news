# Workflow-owned specimen numbers

Only the trusted site workflow assigns permanent `specimen` values and writes `src/content/specimen-ledger.txt`. This applies to everyone: manual publishers, maintainer agents, our writers, the Desk, Grok and publishing/MCP integrations. A producer chooses Habitat (`section`, optional `subsection`) and supplies the article with its normal required metadata. Habitat is classification, not permission to omit sources, hero, author or publication date.

**Rollout status, 2026-10-05:** enabled on main. Controlled Aviram and Grok admissions merged under required checks and both articles were verified live. See [publication evidence](../reports/2026-10-05-publication-verification.md). Do not fall back to local stamping. Publication continues to use `draft: false` and `pubDate`; no `queue.json` admission is reinstated.

**Same-PR update:** the reviewed implementation keeps one original PR throughout numbering, validation and merge. Owner approval reviews automatically wake trusted-main admission. PR #197 demonstrated automatic owner-review numbering and certification on the original PR, then a normal Grok App merge. Its queued finalizer did not establish automatic finalizer-merge acceptance. Its future `pubDate` remains scheduled; merge is not proof of due-date publication. See the [Grok submission and merge procedure](grok-news-posting.md) and [single-PR report](../reports/2026-10-05-single-pr-publication.md) for the separate source and runtime evidence. Historical generated PRs retain their original proof/recovery path.

## Producer submission

1. Write plain Markdown in `src/content/posts/<slug>.md`, choose a valid Habitat and an existing honest author, upload the required own-slug hero and supply a full UTC `pubDate` ending in `Z`. New articles omit `specimen`. Leave an existing article's identity and published date unchanged. Do not edit, stage or replace the permanent ledger, including proposed void lines.
2. Run `npm run preflight -- --files <post-files>` (add `--news` for news). Commit only the approved article files before checking the candidate. Fetch origin/main and use its full SHA:

   ```bash
   git fetch origin main
   BASE_SHA=$(git rev-parse origin/main)
   npm run check:candidate -- --base "$BASE_SHA"
   npm run check:media
   npm test
   ```

   The candidate check inspects committed changes without allocating a number. Commit corrections and rerun checks. A local commit can precede validation; push only after gates pass. Strict `check:posts` and build apply to the generated numbered tree and ordinary numbered main, not an unnumbered submission.
3. Open the source PR with a nonempty description recording sources opened, claims checked, visual findings, exact UTC date and immediate/scheduled intent, hero URL, commands actually run and unresolved evidence. Technical success does not establish editorial approval. If strict browser preview is unavailable on the unnumbered source, record it as pending until the generated validated tree is inspected. Do not fabricate preview evidence.
4. Retain the original PR and its source history. The owner approves that exact head in a PR review. The trusted workflow automatically appends its numbering commit to the same branch and validates it. Never merge an unnumbered source, push to main, force-push or allocate locally. Only successful current-head `check`, `publisher-paths` and `specimen-integrity` certificates from GitHub Actions make the numbered head eligible for a normal pinned merge while owner approval remains valid. The permitted Grok App may normally merge its own certified PR; the trusted finalizer also performs normal merge when a runner is available. Initial observation checks do not supply these certificates.

Grok submits through its dedicated installation identity on `grok/*`, with only post files and an existing `kind: bot` or `kind: ai` byline. Author/profile creation is a separate permitted maintainer or existing authors-lane task. A missing App credential means hand off the prepared bundle, not use a borrowed personal token.

## Operator admission

The editorial admission authority is the account whose numeric ID is configured as `MAINTAINER_ID`. Review article facts, sources, byline, hero, timing and intended edits, then submit an APPROVED PR review for that exact source head. Its credential-free notification records the event-time reviewed source and review ID. Trusted main independently authenticates that receipt, the immutable run head, current owner review ID/state, trusted workflow and article-only source. Bots require no Actions-write token or manual workflow dispatch. Passing tests or a label is not editorial approval.

GitHub may move an approved review's REST `commit_id` after numbering. That field cannot approve a new body or start another root. The earliest authenticated request retains its original source; later heads must be independently proved deterministic workflow numbering descendants with the same editorial digest. Withdrawal, dismissal, a newer decisive review or a content edit stops that lineage. A COMMENTED or edited wake never approves changed content. Legacy roots retain their original proof and request formats. For an old anchor-check hold, an owner review wake can retry the verified original request without resetting retry exhaustion. See [source-binding rationale](../adr/0034-immutable-owner-review-source.md).

Get the source SHA without displaying credentials:

```bash
gh pr view 197 -R michelabboud/aitamer-news \
  --json number,state,isDraft,headRefOid
```

For normal submissions, use GitHub's Approve review after checking the displayed head. A later CHANGES_REQUESTED, dismissal or editorial edit withdraws that approval. A numbering-only workflow commit preserves the reviewed editorial bytes and requires no second review.

GitHub does not allow approving your own PR. Only for an owner-authored exceptional submission, the owner may bind the exact reviewed head with a trusted dispatch. The default same-PR mode still appends numbering to that original PR:

```bash
gh workflow run specimen-admission.yml -R michelabboud/aitamer-news \
  --ref main -f pr_number='replace-with-source-PR-number' \
  -f head_sha='replace-with-exact-reviewed-40-character-head-SHA' \
  -f same_pr=true -f review_id=0
```

Dispatch is approval of that precise source, not a grant of unrestricted merge authority. No manual ledger repair is needed for a legacy submitted number or tampered ledger. Such a source may fail its numbering/path check while awaiting repair; that red source is never merged. Admission still fails closed on ambiguous YAML, unsafe file types/paths, deleted articles, changed editorial content or conflicting main edits.

The workflow runs orchestration from trusted main and reads only added/modified regular plain Markdown post data from the source tree. It never executes submitted scripts, installs submitted dependencies or treats the source ledger as allocation input. It reconstructs the tree from main, removes safely separable submitted specimen fields, restores main's existing identities, and allocates new identities deterministically in publication-date/slug order. It preserves the trusted ledger byte prefix and article content, Habitat, author, hero, source links and dates. New hand-written numbers reserve nothing. Malformed or ambiguous specimen fields are rejected when they cannot be isolated safely.

The installed publishing App appends a commit whose parents are trusted run base and the observed original branch head. The immutable owner-reviewed source and review ID remain separate authorization inputs. A non-force ref update refuses a concurrent producer push; no new PR is created. The validation job checks deterministic allocation and exact parent/tree/content binding, then materializes only article/ledger data on the trusted code tree without write credentials. It runs tests, strict post/media checks, build, rendered-body, Content-Security-Policy, link and diagram checks.

Article namespaces and the `workflow-numbering` label isolate ordinary checks as observations. Expected pending-numbering and workflow sender transitions produce an explicit waiting notice; unsafe paths, parsing, code changes or unexpected failures still fail. Observations never supply required success. Ordinary code, author and comment PRs retain their usual required contexts. The App identity, label, branch name and commit author alone cannot certify an allocation.

Only successful validation allows certification of the exact generated head. Required checks `publisher-paths`, `check` and `specimen-integrity` bind repository, base, head, editorial digest and trusted workflow run. The finalizer verifies provenance and current source approval again, requires server-enforced strict current-base checks, and uses a normal merge commit with the generated head pinned. Installed publishing App `5107739` (bot ID `334982782`) writes workflow-owned branches and PRs; Actions actor `41898282` performs recovery dispatches and check integration `15368` certifies validation; an author name or a similarly named green check is not proof. Admin bypass remains technically possible; normal workflow operation never uses it.

## Failed, stale and retried runs

After successful certification the trusted job explicitly dispatches `specimen-finalize.yml` on main. Before minting its App token, the finalizer waits for that exact authenticated admission run to complete, then applies unchanged proof/recovery checks. The run ID is only a wake hint. Workflow-run and five-minute scheduled triggers remain recovery fallbacks; GitHub can suppress completion events for workflows dispatched by its Actions token. The existing 60-second production deployment aggregation window remains unchanged. Its repository-wide merge concurrency does not promise first-in-first-out order. It considers durable run requests and PR state, serializes finalization, and retains failures.

- If main advances before merge, recovery recomputes from current main only while the original exact reviewed source and editorial digest still match. It appends and validates a replacement commit on the same PR branch, preserving earlier commits as evidence. It never rewrites history or merges a stale allocation. Historical generated-PR requests continue their legacy successor path.
- Failed preparation or validation remains pending. Recovery is bounded to three recorded automatic admission attempts with a five-minute cooldown. Attempts are recorded before dispatch. A changed/closed/draft source or revoked owner review blocks recovery. When the bound is exhausted, the owner inspects the failure and reviews any new dispatch; producers never repair numbers themselves.
- Repeating preparation within its run reuses only matching deterministic tree/parents on the original branch. A lost write response or failed validation does not create another PR or endless no-op commits. Existing identities and ledger history prevent a second issuance after merge; unmerged numbering remains provisional.
- Merge and deployment are distinct states. The reconciler requests ordinary deployment and can retry failed dispatches with the same bounded policy. A successful later-main deployment is accepted only after API evidence proves its source contains the admitted merge; otherwise recovery dispatches the current main without rolling back newer content.

Inspect failures and exact run evidence:

```bash
gh run list -R michelabboud/aitamer-news --workflow specimen-admission.yml \
  --limit 20 --json databaseId,displayTitle,headSha,status,conclusion
gh run view 'replace-with-run-id' -R michelabboud/aitamer-news --log-failed
gh pr view 'replace-with-original-PR-number' -R michelabboud/aitamer-news \
  --json state,headRefOid,mergeCommit,statusCheckRollup
```

Keep repair receipts, source SHA, generated SHA, current-base checks and failed runs. Never delete/reorder history, append manual voids, restore a stale ledger, bypass a guard or borrow owner credentials for bot automation. Operator recovery does not grant a changed article approval.

## Activation and publication acceptance

Before enabling `SPECIMEN_ADMISSION_ENABLED=true`, merge the reviewed implementation into main, verify `MAINTAINER_ID` and workflow branch/PR permissions, and enforce `publisher-paths`, `check` and `specimen-integrity` as strict current-base required checks from GitHub Actions (`integration_id: 15368`). Verify the actual finalizer identity is subject to those checks and is not using a bypass. Confirm every producer integration has migrated away from local allocation. Local docs or tests do not configure these repository settings.

Run independent review and concurrent-submission tests, including fake/removed/duplicate specimens, ignored candidate-ledger edits, stale main, failed validation, exact-content binding, retry recovery and a controlled admission/deployment. Preserve the historical main ledger and existing public identities. An unset/false enable variable keeps the new workflows disabled; it does not authorize manual numbering. Disabling a broken admission lane preserves the last published site and ordinary date-based publication.

For a due admitted post, verify the deployment matching its merge SHA, article HTTP 200, expected specimen, reviewed body/byline and public hero. Record the admission run, original PR (source/generated PRs for legacy requests), source/head/base/merge SHAs and deployment result. A future `pubDate` remains scheduled; absence before its date is expected. A PR, green test, merge or dispatch alone is not proof of publication.

## Workflow identity and durable recovery state

The installed `aitamer-desk-posts` App supplies short-lived, repository-scoped `contents:write` and `pull_requests:write` tokens only in trusted main prepare/finalize jobs. Its private key is a repository secret; validation jobs never receive it. GitHub Actions uses its own token for read-only proof inspection, check certification and workflow dispatch. GitHub rejected the built-in Actions App as a ruleset bypass actor; the installed publishing App already satisfies main’s update identity rule and still must pass required PR/check rules.

The protected `specimens/*` namespace admits only the publishing App and repository administrators. `specimens/state` stores workflow recovery metadata, not a list of articles required for publication. Completion evidence is verified once and retired from active polling; request/run receipts remain in Git and GitHub history. State initialization must validate protection first, and updates must be non-force, parent-bound writes. Grok has no access to this namespace. Its existing permitted identity may merge its own certified PR through the normal server-enforced route; it may never directly push main, bypass required checks or allocate numbers.

The publishing App is also used by the existing Desk integration, so its identity alone does not authenticate recovery state. Every state commit requires a separate GitHub Actions certificate bound to its exact commit, content digest and trusted main finalizer run. State updates use compare-and-swap Git parents; concurrent writes fail safely. The discovery cursor enrolls running requests before advancing, and verified completed requests leave active polling. Idle polling therefore has a fixed read cost rather than growing with all published articles. Tokens are revoked in an always-run cleanup step.

GitHub hides ruleset bypass lists from tokens without ruleset-write access. The recovery controller therefore pins the maintainer-verified namespace ruleset ID and server update timestamp in trusted main code. It still verifies active branch enforcement and all four effective restrictions; an explicitly returned unsafe bypass list is refused. A changed timestamp stops reconciliation until the protection snapshot is reverified and updated through a reviewed code PR. Repository variables alone do not attest this snapshot. This avoids adding administrator credentials to the runtime.

Closed or withdrawn source requests are held before reading Git content; revoked or superseded owner reviews become durable holds. Already-merged admissions still prove deployment. Deployment scans stop before the admitted PR creation time, preserving equal-time runs and independently verifying later deployed-head ancestry. Pending discovery and the state schema remain compatible with historical generated admissions.
