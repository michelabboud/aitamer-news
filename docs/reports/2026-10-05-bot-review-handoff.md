# Bot review handoff: existing Grok PRs, 2026-10-05

Use the [Grok posting guide](../guides/grok-news-posting.md) from fresh main. Keep the existing PR and branch. Grok applies its own corrections and pushes with its dedicated installation credential; the editor reviews the new exact head before approval. No producer Actions-write permission or manual admission dispatch is needed. No manual model disclosure is required. Permissions do not override factual, byline or hero rejection.

This is a dated review snapshot, not enduring approval of a moving branch. Read the live PR head and review state before acting.

| Existing PR | Reviewed source SHA | Handoff |
|---|---|---|
| [191](https://github.com/michelabboud/aitamer-news/pull/191) | `e570c5909020ee14e6adff819a532a49f21a5c41` | Owner APPROVED review `5419679034` at 19:43:04Z. Automatic first-discovery admission is pending runner/runtime evidence; inspect current-head required certificates before any merge. |
| [196](https://github.com/michelabboud/aitamer-news/pull/196) | `73714fc716fbc729c0f130d6e630bd891e3d0ba9` | Apply the factual correction patch below, rerun source gates and hand off the new SHA. Rejected pending these corrections and fresh exact-head editorial approval. |
| [200](https://github.com/michelabboud/aitamer-news/pull/200) | `66c94ffa39a7b140d879b243418077af6ccd6386` | Close two Markdown bold spans, then hand off the new SHA for review. Rejected pending these corrections and fresh exact-head editorial approval. |
| [201](https://github.com/michelabboud/aitamer-news/pull/201) | `0f9cb42907b5bf59c33648a633d9c592cdc9c09c` | Correct four hero alt texts from actual visual inspection, then hand off the new SHA. Rejected pending these alt-text corrections and fresh exact-head editorial approval. |

## What each patch corrects

**PR196:** the current [create-version schema](https://clickhouse.com/docs/products/cloud/api-reference/udf/udf-version-create) includes `memoryLimitMib` and `deterministic`. Attribute the remaining beta labels to the [Cloud UDF overview](https://clickhouse.com/docs/products/cloud/features/sql-console-features/user-defined-functions), not the current create-version reference. The [2026 changelog](https://clickhouse.com/docs/resources/changelogs/oss/2026) scopes the query-log ProfileEvents to `executable_pool`; its two asynchronous process metrics cover both execution types. The patch preserves announcement attribution and shortens the description/Wildness line within source limits. [Exact patch](2026-10-05-pr196-corrections.patch), SHA256 `c0a42548c82268c9378e2583386a4c7f8db3564729b5e4454bde505ecd4138d9`.

**PR200:** close the bold spans after “Managed Postgres + wal-g backup I/O” and “hosted Zyte API + Scrapy Cloud over MCP”. No factual rewrite. [Exact patch](2026-10-05-pr200-corrections.patch), SHA256 `f4e2e8b0503618dbb7ffee4b4f8728962900399cbb252b7678224f3960eebcbf`.

**PR201:** the actual images show a train/track/switch, a balance scale/documents, a sheet/mesh magnifier, and review slips/ruler/pencil/paper clip. Describe those visible objects in the corresponding alt text. The acceptable 1600×900 paper-art JPEGs need no regeneration, new upload or URL change. Alt text follows the actual image, not the prompt. [Exact patch](2026-10-05-pr201-hero-alt-corrections.patch), SHA256 `76df117744ef756b3bb703c229f58512c958bf950c15ed3d38034948a07eefa8`.

Independent editorial review found no further factual blockers in these three reviewed snapshots; PR200/201’s 11 submitted heroes passed public GET and visual/style review; PR196 is a separate article. This does not approve an uncorrected or changed head. PR201’s OpenRouter latency is an explicitly historical snapshot; current metric drift alone does not establish a false historical claim.

## Apply one patch to its existing branch

Run in Grok's own clean full clone with its existing App authentication. Select only the PR being corrected. These commands fetch the published patch from main without merging documentation into the article branch. They refuse a changed source head rather than forcing the proposed patch onto different content.

```bash
set -euo pipefail
set +x
test -z "$(git status --porcelain)" || { printf 'Use a clean owned clone.\n' >&2; exit 1; }
PR='196' # Choose 196, 200 or 201.
case "$PR" in
  196)
    BRANCH='grok/clickhouse-cloud-executable-udfs-ga'
    EXPECTED_SHA='73714fc716fbc729c0f130d6e630bd891e3d0ba9'
    PATCH_NAME='2026-10-05-pr196-corrections.patch'
    PATCH_SHA256='c0a42548c82268c9378e2583386a4c7f8db3564729b5e4454bde505ecd4138d9'
    ;;
  200)
    BRANCH='grok/copy-edit-hc-2026-10-05'
    EXPECTED_SHA='66c94ffa39a7b140d879b243418077af6ccd6386'
    PATCH_NAME='2026-10-05-pr200-corrections.patch'
    PATCH_SHA256='f4e2e8b0503618dbb7ffee4b4f8728962900399cbb252b7678224f3960eebcbf'
    ;;
  201)
    BRANCH='grok/seek-2026-10-05-2023'
    EXPECTED_SHA='0f9cb42907b5bf59c33648a633d9c592cdc9c09c'
    PATCH_NAME='2026-10-05-pr201-hero-alt-corrections.patch'
    PATCH_SHA256='76df117744ef756b3bb703c229f58512c958bf950c15ed3d38034948a07eefa8'
    ;;
  *) printf 'No patch for this PR.\n' >&2; exit 1 ;;
esac
git fetch origin main "$BRANCH"
PATCH_DIR=$(mktemp -d "${TMPDIR:-/tmp}/aitamer-editorial-patch-${PR}.XXXXXX")
git show "origin/main:docs/reports/$PATCH_NAME" > "$PATCH_DIR/$PATCH_NAME"
printf '%s  %s\n' "$PATCH_SHA256" "$PATCH_DIR/$PATCH_NAME" | sha256sum --check
if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
  git switch "$BRANCH"
  git merge --ff-only "origin/$BRANCH"
else
  git switch --track -c "$BRANCH" "origin/$BRANCH"
fi
test "$(git rev-parse HEAD)" = "$EXPECTED_SHA" || {
  printf 'Source changed: hand its new SHA to the editor; do not force this patch.\n' >&2
  exit 1
}
git apply --check "$PATCH_DIR/$PATCH_NAME"
git apply "$PATCH_DIR/$PATCH_NAME"
git diff --check
git diff -- src/content/posts
# Confirm only the proposed article lines changed; preserve pubDate/byline/hero URLs.
# Do not edit a specimen, ledger, VERSION, code or workflow.
git add -- src/content/posts
git -c user.email=29182417+michelabboud@users.noreply.github.com \
  commit -m "Fix reviewed article findings for PR $PR" \
  -m "Co-Authored-By: Grok <noreply@x.ai>"
git fetch origin main
BASE_SHA=$(git rev-parse origin/main)
npm run check:candidate -- --base "$BASE_SHA"
npm run check:media
npm test
git push origin "HEAD:refs/heads/$BRANCH"
gh pr view "$PR" -R michelabboud/aitamer-news \
  --json number,url,headRefOid,state,isDraft,statusCheckRollup
```

A failed source check stays unpublished: retain its decisive output and return it to the editor. After a successful non-force App push, send that same PR number, **new exact SHA**, corrected claims and source links, hero inspection and actual gate results. Obtain fresh editorial review; do not request a new PR or a manual admission command. Automatic numbering may later append a commit: wait for its exact current-head required certificates before a permitted normal merge.

## Local patch evidence and limits

All three patches passed `git apply --check` on their exact source SHAs in isolated worktrees, then candidate gates using trusted-main validation code. Preflight passed the patched files: PR196 one, PR200 two, PR201 four. Candidate results: PR196 one article, PR200 seven changed articles (two patched), PR201 four articles; each ended `No number was assigned`, exit 0. The candidate gate includes Markdown/rendered-body checks. Original source specimen/ledger bytes, dates, author fields and hero URLs remain unchanged by these proposed corrections. Strict numbering and production build remain the trusted workflow's responsibility. These local checks do not approve the PRs or prove App push, automatic admission, normal merge, deployment or publication.
