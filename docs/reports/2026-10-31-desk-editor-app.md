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
Ruleset 24468307 ("main updates only by admins and existing publishing Apps") lists `grok-bots-app` (5189850) as a bypass actor, while `docs/reports/2026-10-05-grok-app-access.md` says that rule excludes Grok. Main still requires a PR with both checks (24029855), so Grok cannot push to main directly, but it can merge its own PR once checks pass. Raised with Michel for a decision.

## Undo
Delete ruleset 26285798, remove `refs/heads/eic/*` from the two exclude lists, delete the variable, and uninstall or delete the App in Michel's GitHub settings.
