# GitHub branch permissions for daily context summaries

This guide explains why the nightly context summary work is stuck, what the repository rules say today, and the exact changes that unblock it. It is written for Wiz Cat and for any agent (Codex or Claude) working on Wiz Cat's account.

Status as of 2026-11-02, 11:20 Asia/Jerusalem.

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

What this means:

- `grok/*` is already an allowed prefix. It is excluded from 24029856 and 24520133, and 24469063 lets the Grok Newsroom App (and admins) write it.
- `refs/heads/specimens/*` is carved out of the two catch-all rulesets by being listed in their `exclude` arrays. Its own ruleset, 24488522, then governs it. `context-summaries` needs the same exclude entry.
- `context-summaries` is not excluded today, so the workflow could neither create it (24029856) nor update it (24520133).
- GitHub does not accept the built-in GitHub Actions app as a ruleset bypass actor (see `docs/adr/0031-workflow-owned-specimens.md`). Exclusion is the way to let `GITHUB_TOKEN` write the branch.

## Exact changes requested

Before merge (to get the PR open):

- [ ] 1. Grant the Grok Newsroom GitHub App the **Workflows: Read and write** repository permission (in the App's settings, Permissions and events). Then Wiz Cat accepts the updated permissions on the installation for michelabboud/aitamer-news. Eden then pushes `grok/context-summaries-daily` and opens the PR. Alternative: Wiz Cat pushes that branch himself, then Eden opens the PR.
- [ ] 2. Secondary option only, if the Cursor agent should push its own branches: add the Cursor agent's actor as a bypass actor on ruleset **24467961**, or find out why its push is not recognized as the Cursor App. Not needed if item 1 is done.

After the PR merges (so the nightly workflow can write its data branch):

- [ ] 3. Ruleset **24029856**: add `refs/heads/context-summaries` to `conditions.ref_name.exclude` (lifts the creation and deletion restriction for that one branch).
- [ ] 4. Ruleset **24520133**: add `refs/heads/context-summaries` to `conditions.ref_name.exclude` (lifts the update restriction).
- [ ] 5. Optional: protect `refs/heads/context-summaries` with its own ruleset, the way 24488522 protects `specimens/*`, if you want to block anyone other than the workflow from writing it. If you do, check that the workflow can still push, since the Actions app cannot be a bypass actor.

Do not exclude anything else. Leave main protection as it is.

## Verification after the changes

- The PR from `grok/context-summaries-daily` exists and its checks pass.
- After merge, run the workflow once with `workflow_dispatch` and a past date. Confirm `context-summaries` was created and holds one `context-summaries/YYYY-MM-DD.md` file.
- Confirm no `deploy-pages.yml` run was triggered by that write.
