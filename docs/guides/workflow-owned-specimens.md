# Workflow-owned specimen numbers

Only the trusted site workflow assigns permanent `specimen` values and writes `src/content/specimen-ledger.txt`. This applies to everyone: manual publishers, maintainer agents, our writers, the Desk, Grok and publishing/MCP integrations. A producer chooses Habitat (`section`, optional `subsection`) and supplies the article with its normal required metadata. Habitat is classification, not permission to omit sources, hero, author or publication date.

**Rollout status, 2026-10-05:** implementation is being validated; live activation and controlled publication are separate acceptance gates. These instructions describe the source implementation, not proof that the workflows are enabled on main. Do not fall back to local stamping while activation is pending. Publication continues to use `draft: false` and `pubDate`; no `queue.json` admission is reinstated.

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
4. Retain the source PR and its original history. The owner approves the exact source head through admission. The workflow produces a separate numbered PR; producers never merge an unnumbered source PR, push to main, force-push or perform allocation locally.

Grok submits through its dedicated installation identity on `grok/*`, with only post files and an existing `kind: bot` or `kind: ai` byline. Author/profile creation is a separate permitted maintainer or existing authors-lane task. A missing App credential means hand off the prepared bundle, not use a borrowed personal token.

## Operator admission

The initial editorial admission authority is the account whose numeric ID is configured as `MAINTAINER_ID`. Dispatch binds approval to PR number and exact reviewed head SHA; a bot cannot approve itself. Review article facts, sources, byline, hero, timing and intended edits before dispatch. Passing tests is not news approval.

Get the source SHA without displaying credentials:

```bash
gh pr view 172 -R michelabboud/aitamer-news \
  --json number,state,isDraft,headRefOid
```

Replace the example PR number and SHA with the reviewed source values. Run from the owner's authenticated private environment:

```bash
gh workflow run specimen-admission.yml -R michelabboud/aitamer-news \
  --ref main -f pr_number=172 -f head_sha='replace-with-exact-reviewed-40-character-head-SHA'
```

Dispatch is approval of that precise source, not a grant of unrestricted merge authority. No manual ledger repair is needed for a legacy submitted number or tampered ledger. Such a source may fail its numbering/path check while awaiting repair; that red source is never merged. Admission still fails closed on ambiguous YAML, unsafe file types/paths, deleted articles, changed editorial content or conflicting main edits.

The workflow runs orchestration from trusted main and reads only added/modified regular plain Markdown post data from the source tree. It never executes submitted scripts, installs submitted dependencies or treats the source ledger as allocation input. It reconstructs the tree from main, removes safely separable submitted specimen fields, restores main's existing identities, and allocates new identities deterministically in publication-date/slug order. It preserves the trusted ledger byte prefix and article content, Habitat, author, hero, source links and dates. New hand-written numbers reserve nothing. Malformed or ambiguous specimen fields are rejected when they cannot be isolated safely.

A `specimens/run-<run-id>` branch and dedicated publishing App PR retain the original source as ancestry without rewriting it. The generated PR records the source PR/head, base, generated head, editorial digest and repairs. The validation job checks deterministic allocation and materializes only article/ledger data on the trusted code tree without write credentials, then runs tests, strict post/media checks, build, rendered-body, Content-Security-Policy, link and diagram checks.

Only successful validation allows certification of the exact generated head. Required checks `publisher-paths`, `check` and `specimen-integrity` bind repository, base, head, editorial digest and trusted workflow run. The finalizer verifies provenance and current source approval again, requires server-enforced strict current-base checks, and uses a normal merge commit with the generated head pinned. Dedicated publishing App `5107739` (bot ID `334982782`) writes workflow-owned branches and PRs; Actions actor `41898282` performs recovery dispatches and check integration `15368` certifies validation; an author name or a similarly named green check is not proof. Admin bypass remains technically possible; normal workflow operation never uses it.

## Failed, stale and retried runs

The separate `specimen-finalize.yml` reconciles immediately after workflow completion. Its five-minute schedule is recovery only, not a normal publication waiting period. The existing 60-second production deployment aggregation window remains unchanged. Its repository-wide merge concurrency does not promise first-in-first-out order. It considers durable run requests and PR state, serializes finalization, and retains failures.

- If main advances before merge, the generated allocation is stale. Recovery recomputes from current main only when the original exact approved source and editorial digest still match. It generates and validates a successor rather than overwriting history or merging a stale allocation. The predecessor remains available as evidence; a dispatch response alone is not success.
- Failed preparation or validation remains pending. Recovery is bounded to three recorded automatic admission attempts with a five-minute cooldown. Attempts are recorded before dispatch. A changed/closed/draft source or revoked owner review blocks recovery. When the bound is exhausted, the owner inspects the failure and reviews any new dispatch; producers never repair numbers themselves.
- Repeating a successful preparation within its run reuses only a matching deterministic branch/tree. Existing identities and ledger history prevent a second issuance after merge. Do not treat provisional allocation in an unmerged generated PR as a published identity.
- Merge and deployment are distinct states. The reconciler requests ordinary deployment and can retry failed dispatches with the same bounded policy. A successful later-main deployment is accepted only after API evidence proves its source contains the admitted merge; otherwise recovery dispatches the current main without rolling back newer content.

Inspect failures and exact run evidence:

```bash
gh run list -R michelabboud/aitamer-news --workflow specimen-admission.yml \
  --limit 20 --json databaseId,displayTitle,headSha,status,conclusion
gh run view 'replace-with-run-id' -R michelabboud/aitamer-news --log-failed
gh pr view 'replace-with-generated-PR-number' -R michelabboud/aitamer-news \
  --json state,headRefOid,mergeCommit,statusCheckRollup
```

Keep repair receipts, source SHA, generated SHA, current-base checks and failed runs. Never delete/reorder history, append manual voids, restore a stale ledger, bypass a guard or borrow owner credentials for bot automation. Operator recovery does not grant a changed article approval.

## Activation and publication acceptance

Before enabling `SPECIMEN_ADMISSION_ENABLED=true`, merge the reviewed implementation into main, verify `MAINTAINER_ID` and workflow branch/PR permissions, and enforce `publisher-paths`, `check` and `specimen-integrity` as strict current-base required checks from GitHub Actions (`integration_id: 15368`). Verify the actual finalizer identity is subject to those checks and is not using a bypass. Confirm every producer integration has migrated away from local allocation. Local docs or tests do not configure these repository settings.

Run independent review and concurrent-submission tests, including fake/removed/duplicate specimens, ignored candidate-ledger edits, stale main, failed validation, exact-content binding, retry recovery and a controlled admission/deployment. Preserve the historical main ledger and existing public identities. An unset/false enable variable keeps the new workflows disabled; it does not authorize manual numbering. Disabling a broken admission lane preserves the last published site and ordinary date-based publication.

For a due admitted post, verify the deployment matching its merge SHA, article HTTP 200, expected specimen, reviewed body/byline and public hero. Record the admission run, source/generated PRs, source/head/base/merge SHAs and deployment result. A future `pubDate` remains scheduled; absence before its date is expected. A source PR, generated PR, green test, merge or dispatch alone is not proof of publication.

## Workflow identity and durable recovery state

The installed `aitamer-desk-posts` App supplies short-lived, repository-scoped `contents:write` and `pull_requests:write` tokens only in trusted main prepare/finalize jobs. Its private key is a repository secret; validation jobs never receive it. GitHub Actions uses its own token for read-only proof inspection, check certification and workflow dispatch. GitHub rejected the built-in Actions App as a ruleset bypass actor; the installed publishing App already satisfies main’s update identity rule and still must pass required PR/check rules.

The protected `specimens/*` namespace admits only the publishing App and repository administrators. `specimens/state` stores workflow recovery metadata, not a list of articles required for publication. Completion evidence is verified once and retired from active polling; request/run receipts remain in Git and GitHub history. State initialization must validate protection first, and updates must be non-force, parent-bound writes. Grok has no access to this namespace or main merge identity.

The publishing App is also used by the existing Desk integration, so its identity alone does not authenticate recovery state. Every state commit requires a separate GitHub Actions certificate bound to its exact commit, content digest and trusted main finalizer run. State updates use compare-and-swap Git parents; concurrent writes fail safely. The discovery cursor enrolls running requests before advancing, and verified completed requests leave active polling. Idle polling therefore has a fixed read cost rather than growing with all published articles. Tokens are revoked in an always-run cleanup step.

GitHub hides ruleset bypass lists from tokens without ruleset-write access. The recovery controller therefore pins the maintainer-verified namespace ruleset ID and server update timestamp in trusted main code. It still verifies active branch enforcement and all four effective restrictions; an explicitly returned unsafe bypass list is refused. A changed timestamp stops reconciliation until the protection snapshot is reverified and updated through a reviewed code PR. Repository variables alone do not attest this snapshot. This avoids adding administrator credentials to the runtime.
