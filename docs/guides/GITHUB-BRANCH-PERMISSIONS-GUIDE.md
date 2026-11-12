# GitHub branch permissions for daily context summaries

This guide explains why the nightly context summary work is stuck, what the repository rules say today, and the maintainer submission route that gets it reviewed without expanding publisher authority. It is written for Wiz Cat and for any agent (Codex or Claude) working on Wiz Cat's account.

Historical bot observations: 2026-11-02, 11:20 Asia/Jerusalem. Submission guidance corrected 2026-11-03. This document does not change permissions or install the proposed nightly workflow.

## Who does what

Wiz Cat (or Codex/Claude on Wiz Cat's account) changes rulesets and GitHub App permissions. Eden (Grok Newsroom App) opens PRs. Wiz Cat merges site, CI and docs PRs.

## What the feature does

A Cursor cloud agent ([bc-2df6f0e3-fb2a-57b7-9dde-1f787ac372cf](https://cursor.com/agents/bc-2df6f0e3-fb2a-57b7-9dde-1f787ac372cf)) built:

- `scripts/context-summary.mjs` and `.github/workflows/context-summary.yml`.
- Each night at 23:50 Asia/Jerusalem the workflow writes `context-summaries/YYYY-MM-DD.md`. It uses two crons, `50 21 * * *` and `50 20 * * *` (UTC), to cover standard and daylight time. `workflow_dispatch` takes an optional date for backfill.
- Summaries go to a long-lived data branch named `context-summaries`. Main only carries `context-summaries/README.md`. The design is modeled on `specimens/state`.
- The job uses only `GITHUB_TOKEN`, with `contents: write` and `pull-requests: read`.
- Safeguards: it refuses to push main, refuses force-push, and refuses writes outside `context-summaries/`. A quiet day writes nothing. Output is deterministic, and it pushes only when something changed.
- `check-posts.yml` ignores that branch.

### Why the summaries live off main

Every push to main runs `deploy-pages.yml` and triggers a Cloudflare Pages rebuild. Writing summaries to main every night would cause a rebuild every night for no site change. A separate data branch avoids that.

## The change waiting to land

- Commit `4b12f56` (made on the Cursor agent's VM, never pushed): 10 files, +969/-6.
  - `.github/workflows/check-posts.yml`
  - `.github/workflows/context-summary.yml`
  - `AGENTS.md`, `CHANGELOG.md`, `VERSION` (0.2.137)
  - `context-summaries/README.md`
  - `package.json` (adds `npm run context-summary`)
  - `scripts/context-summary.mjs`, `scripts/context-summary.test.mjs`, `scripts/specimen-check-contexts.test.mjs`
- Base: main `fd0977b` (merge of #403).
- Tests on the agent VM: `npm test` 1637 passed, 0 failed. A dry run for 2026-11-01 found 4 merged PRs, 20 posts live and 3 site/CI PRs.
- The commit was exported as a format-patch (sha256 `d4346a8ac0316b6286ada0b57fa7d152b651d3bc6a61426b9893e65cfa2ce4fc`) so Eden could apply it on a `grok/` branch.
- Eden applied it cleanly on a local branch `grok/context-summaries-daily` (head `4f353b817ed7cddcc61a0823516c475bd0695165`). There, `npm test` passed 1637/1637 and the named tests passed 22/22.

## What failed and why

1. Cursor agent push of `cursor/daily-context-summaries-72cf`: rejected with GH013 "Cannot create ref due to creations being restricted", under ruleset 24467961. The agent's token is not treated as the Cursor App, so it cannot bypass.
2. Cursor agent fallback ref `context-summaries-probe-72cf`: HTTP 422 under ruleset 24029856, which blocks creating any branch outside the allowed prefixes. No ref was created and no bypass was attempted.
3. Eden push of `grok/context-summaries-daily` with the Grok Newsroom App: rejected with GH013 "refusing to allow a GitHub App to create or update workflow `.github/workflows/check-posts.yml` without `workflows` permission". Creating a `grok/*` branch is allowed. The only blocker is that the app lacks the Workflows permission, and this commit edits two workflow files.

At the time of writing, branch `grok/context-summaries-daily` does not exist on GitHub and there is no PR from it. It exists only locally on Eden's box.

## Ruleset facts (read with the Grok Newsroom App token on 2026-11-02)

The app can read rulesets, names, targets, ref patterns and rules. It cannot see the bypass actor lists (the API omits `bypass_actors` for this token). It only sees `current_user_can_bypass` for itself.

| ID | Name | Includes | Excludes | Rules | App can bypass |
| --- | --- | --- | --- | --- | --- |
| 24467961 | only Cursor App and admins write cursor branches | `refs/heads/cursor/*` | none | creation, update, deletion | never |
| 24469063 | only Grok bots App and admins write grok branches | `refs/heads/grok/*` | none | creation, update, deletion | always |
| 24029856 | desk branches only: every other branch is the maintainer's | `~ALL` | see below | creation, deletion | never |
| 24520133 | Workflow numbering updates to maintainer branches | `~ALL` | see below | update | never |
| 24488522 | Workflow-owned specimen branches | `refs/heads/specimens/*` | none | creation, update, deletion, non_fast_forward | never |

Rulesets 24029856 and 24520133 share the same exclude list:

- `~DEFAULT_BRANCH`
- `refs/heads/desk/comments-*`, `refs/heads/desk/posts-*`, `refs/heads/desk/authors-*`
- `refs/heads/cursor/*`
- `refs/heads/grok/*`
- `refs/heads/specimens/*`
- `refs/heads/eic/*`
- `refs/heads/admin/*`

**Update 2026-11-12 (ADR 0054), read with the maintainer's token:** ruleset 27012455, "only Grok bots App and admins write series and diagrams branches", covers `refs/heads/series/*` and `refs/heads/diagrams/*` (creation, update, deletion), bypassed only by admins and the Grok bots App (5189850); the Cursor App is not on it. Both shared exclude lists above now also carry `refs/heads/series/*` and `refs/heads/diagrams/*`. How the bots use these branches: [Series and diagrams for the bots](series-and-diagrams-for-bots.md).

What this means:

- `grok/*` is already an allowed prefix. It is excluded from 24029856 and 24520133, and 24469063 lets the Grok Newsroom App (and admins) write it.
- `refs/heads/specimens/*` is carved out of the two catch-all rulesets by being listed in their `exclude` arrays. Its own ruleset, 24488522, then governs it. `context-summaries` needs the same exclude entry.
- `context-summaries` is not excluded today, so the workflow could neither create it (24029856) nor update it (24520133).
- GitHub does not accept the built-in GitHub Actions app as a ruleset bypass actor (see `docs/adr/0031-workflow-owned-specimens.md`). Exclusion is the way to let `GITHUB_TOKEN` write the branch.

## Maintainer submission: no publisher permission expansion

The Grok Newsroom App does not need Workflows write permission to hand source to a maintainer for review. Its refusal to push workflow files is an intended trust boundary, not a reason to widen its daily publishing lane.

1. Export the original source commits as a patch or share their immutable Git objects and recorded source/base hashes. Keep the original evidence and author attribution.
2. The maintainer checks that the patch contains only the expected files, reviews the workflow and its permissions, and applies it on a maintainer-owned `claude/*` branch based on current main. Do not push into an App-owned `grok/*` or `cursor/*` branch using another identity.
3. Open a maintainer-authored PR. Its checks must report the required `check`, `publisher-paths` and `specimen-integrity` certificates for the current head/base. Article-lane observation checks on a bot PR do not authorize site or workflow code.
4. Merge normally with the exact reviewed head SHA after required checks pass. Never use `--admin`, direct-main pushes, ruleset weakening, borrowed App credentials or an open-PR description edit to make a blocked submission pass.

Keep the publisher App's Workflows permission unchanged. No Cursor actor bypass is required. Granting an App the ability to change CI is a separate authority decision, not part of submitting this proposal.

## Data-branch writing is a separate design gate

The proposed nightly workflow source is not part of this documentation PR and has not been accepted by this guide. Review its exact implementation before selecting its writer or changing any ruleset.

Do not simply exclude `context-summaries` from both catch-all rulesets: that also removes the branch's creation/deletion protections and does not authenticate which writer produced a summary. The eventual workflow must establish a narrowly scoped authenticated writer and preserve append/history evidence. Protect deletion and non-fast-forward updates; do not make data-branch protection optional. Use the existing workflow-owned state design as a reference, rather than assuming the built-in Actions token is an authenticated exception.

No branch exclusions, bypass actors, App permissions, workflow secrets or main protections are changed by this guide.

## Verification when the implementation is separately accepted

- Check the exact source/base, original attribution, intended nightly timezone handling, idempotence and backfill behavior in the maintainer PR.
- Verify required checks and a normal pinned merge; preserve failed observations as history.
- Verify authorized writes succeed on the dedicated data branch while unauthorized updates, deletion and non-fast-forward updates remain refused.
- Run one accepted backfill and verify its dated file and evidence. Confirm that the data-branch write starts no production deployment.
