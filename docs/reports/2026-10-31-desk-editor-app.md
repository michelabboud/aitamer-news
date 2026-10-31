# The desk editor GitHub App

Date: 2026-10-31. By Claude (Opus 5.5), on Michel's account at his request ("help me creating the apps").

## What exists now
- **App:** `aitamer-desk-editor`, App id 5558957, owned by `michelabboud`, private. Bot account `aitamer-desk-editor[bot]`, account id 350852201.
- **Permissions:** repository contents (write), pull requests (write), metadata (read). No events, no webhook. Kept to that on purpose; widen only for a named desk job, with its own lane.
- **Installation:** 177314164, on `michelabboud/aitamer-news` only (selected repositories). Checked by listing the App's installations with an App token.
- **Created through** GitHub's App-from-manifest flow: Michel clicked Create; the one-time code was exchanged locally and the credentials were written straight to a file only Michel's user can read, on the operator machine. The key never appeared in a transcript or a repository. Where the desk keeps it from now on is the desk's credential store.

## Repository settings changed
- **Variable** `EIC_ACTOR_ID=350852201`. Nothing reads it yet; the path guard lane that will is in the site-code PR (plan `docs/plans/2026-10-31-top-nav-and-pinning.md`).
- **New ruleset 26285798**, "only desk editor App and admins write eic branches": `refs/heads/eic/*`, creation/update/deletion restricted, bypass the admin role (5) and Integration 5558957.
- **Rulesets 24029856** ("desk branches only: every other branch is the maintainer's") and **24520133** ("Workflow numbering updates to maintainer branches"): `refs/heads/eic/*` added to their exclude lists, the same way `grok/*` is excluded, so the generic maintainer-only rules do not also bind the desk's namespace. Nothing else in them changed.
- Untouched: main's rules (24012720, 24029855, 24468307), the tag rules, every other namespace.

## Verified
Using an installation token of the App:
- created `eic/probe-1793476936` at main: 201; deleted it: 204;
- creating `grok/eic-probe-1793476936`: 422, refused;
- creating `probe-1793476936`: 422, refused.

## Found while checking, not changed
Ruleset 24468307 ("main updates only by admins and existing publishing Apps") lists `grok-bots-app` (5189850) as a bypass actor, while `docs/reports/2026-10-05-grok-app-access.md` says that rule excludes Grok. Main still requires a PR with both checks (24029855), so Grok cannot push to main directly, but it can merge its own PR once checks pass. Raised with Michel; **resolved the same day, Michel's word: "yes grok need to be able to post into main".** Grok's place on the main-update rule is intended and stays; this report supersedes the 2026-10-05 line on that point. Main still requires a PR with all three required checks, so Grok merges only what passes them.

## Undo
Delete ruleset 26285798, remove `refs/heads/eic/*` from the two exclude lists, delete the variable, and uninstall or delete the App in Michel's GitHub settings.

# The desk admin GitHub App (same day)

Michel's word, 2026-10-31: one App for posts and another for the template, named `aitamer-desk-admin`; "the admin should also manage the template in news".

## What exists now
- **App:** `aitamer-desk-admin`, App id 5559033, owned by `michelabboud`, private. Bot account `aitamer-desk-admin[bot]`, account id 350853873. Same permissions as the editor App: contents (write), pull requests (write), metadata (read); no events, no webhook.
- **Installation:** 177316046, on `michelabboud/aitamer-news` and `michelabboud/aitamer-uiux` only.
- **Key:** written by the manifest flow to a file only Michel's user can read; never printed.

## Repository settings changed
- aitamer-news: variable `ADMIN_ACTOR_ID=350853873`; new ruleset **26286125** "only desk admin App and admins write admin branches" (`refs/heads/admin/*`, bypass admin role 5 and Integration 5559033); `refs/heads/admin/*` added to the exclude lists of 24029856 and 24520133.
  - An earlier attempt to create 26286125 before the App was installed failed (GitHub requires an installed App as a bypass actor). The two exclude-list additions made just before it were reverted at once and re-applied only after the ruleset existed; for a few seconds `admin/*` was open to any App with write access. No branch was created in that window that we know of.
- aitamer-uiux: new ruleset **26285953** "main changes only by pull request; admins bypass": PR required with 1 approval given after the last push, stale approvals dismissed, no force-push, no deletion; admin role bypasses (Michel's own pushes keep working). Before this, aitamer-uiux main had no protection at all.
- The admin App is **not** a bypass actor of aitamer-news's main-update rule (24468307), so it cannot merge its own PRs; Michel merges them.

## Verified with the App's own installation token
- aitamer-news: create `admin/probe-1793477401` 201, deleted 204; create `grok/…` 422; create `eic/…` 422; move main directly 422 ("Changes must be made through a pull request").
- aitamer-uiux: create `admin/probe-1793477401` 201, deleted 204; move main directly 422.

## Still to do
- The admin lane in `scripts/check-publisher-paths.mjs`, as its own reviewed PR. Allowed: `src/components/`, `src/layouts/`, `src/styles/`, `src/pages/`, `src/assets/`, `public/` images and fonts. Refused: `.github/`, `scripts/`, `workers/`, `src/content/`, `src/data/`, `package.json` and the lockfile, `astro.config.mjs`, `wrangler.toml`, the CSP headers. Until it lands, the admin App's aitamer-news PRs fail the path guard and cannot merge.

## Undo
Delete rulesets 26286125 (aitamer-news) and 26285953 (aitamer-uiux), remove `refs/heads/admin/*` from the two exclude lists, delete `ADMIN_ACTOR_ID`, and uninstall or delete the App.
