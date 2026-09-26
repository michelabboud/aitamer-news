# Contributing

AI Tamer is a small, owner-run news site. Issues and pull requests for the **code** are welcome; the articles and artwork are not open for contribution (see `LICENSE-CONTENT.md`). Story tips and corrections go through https://aitamer.news/about/#contact.

## Setup

- Node 22.12 or newer (CI uses Node 24).
- `npm ci`, then `npm run dev` for the site at http://localhost:4321. Search works only after a full build: `npm run build && npm run preview`.
- The contact Worker runs separately: `npm run dev:contact` (see `README.md`).

## Before you open a pull request

Run what CI runs; every pull request runs the same checks (`.github/workflows/check-posts.yml`):

```sh
npm test              # all unit tests (found by pattern)
npm run check:posts   # publish times, specimen numbers, sources, slugs, comment files belong to posts
npm run build         # the strict post schema is enforced here
npm run check:dist    # no secrets in the built site
npm run check:files   # the deploy stays under Cloudflare's file cap
```

- Posts follow the contract in `POST.md`; a post that breaks it fails the build and names the file.
- Keep diffs focused: one logical change per pull request, matching the code around it.
- New behaviour comes with tests, including the failure path.
- Decisions with real trade-offs get a record in `docs/adr/`.

## The desk's publisher and the `publisher-paths` check

Reader comments and reaction totals reach this repository as data files, `src/content/comments/<slug>.json` and `src/content/reactions/<slug>.json`, written by the desk's publisher (`POST.md` sections 8 and 9, ADR 0006; the second lane, ADR 0008). The publisher is a GitHub App — no `workflows` permission, on no bypass list. It never pushes to `main`: it pushes a `desk/comments-*` branch and opens a pull request **with its own installation token**, so the pull request's author and every event's sender are the App, never the maintainer.

Every pull request into `main` runs `.github/workflows/check-publisher-pr.yml` on `opened`, `synchronize`, `reopened` and `edited`; its job **`publisher-paths`** is a required check in the branch ruleset, together with **`check`** (the `Check posts` workflow: tests, `check:posts`, build), both with their source pinned to GitHub Actions so nothing else can post a passing check under those names (repository admins bypass the ruleset, so the maintainer's direct pushes keep working). Why two, and why pinned: `docs/adr/0007-the-publisher-guard-as-built.md`. The job checks out `main` only, installs nothing, and never runs anything from the pull request. It fetches `refs/pull/<n>/head` and fails unless that is exactly the event's head commit (a moved branch is judged by the run for its new head), then runs `main`'s `scripts/check-publisher-paths.mjs`, which reads the changes with `git diff --name-status -M` from the merge base to that commit and the file modes with `git ls-tree` on it — fetched objects, never checked out. There is no file-count cap and no API listing.

**Who is held to the rule: every pull request**, unless its author and the event's sender are both the maintainer, compared by numeric account id with the repository variable **`MAINTAINER_ID`**, and the event is `opened` or `synchronize`. So the publisher pushing into someone else's pull request (Dependabot's, or the maintainer's) is caught, because the sender of that `synchronize` is the App. `edited` and `reopened` never exempt: their sender changed the title, base or state, not the commits. `MAINTAINER_ID` unset, empty or not a number: every pull request is held (fail safe). Find the id with `gh api users/<login> --jq .id`.

The rule (phase 2 plan D12, widened by ADR 0008): every changed path must be `src/content/comments/<slug>.json` or `src/content/reactions/<slug>.json` — the publisher's two lanes; not nested, not another name, extension or case, nothing outside those two directories; a rename must start and end inside **the same** lane; an added or changed file must be a plain, non-executable file (no symlink, no submodule, no executable bit). Deleting a file in a lane is allowed: that is how an emptied thread, or a story whose reactions are back to none, leaves the site. Anything that cannot be judged (a missing commit, unreadable git output) fails.

**Second line, in the deploy.** `deploy-pages.yml` runs the same script in `push` mode as its first step after checkout, before `npm ci`: when `github.actor_id` (the account that pushed) is the repository variable **`PUBLISHER_ACTOR_ID`** (the App's numeric bot account id, `gh api 'users/<app-slug>[bot]' --jq .id`), every path changed between the push's `before` and `after` must be in one of the two lanes, or nothing is built or deployed. `PUBLISHER_ACTOR_ID` unset or blank: the step logs a notice and skips; set but not a numeric id: the deploy fails. A `before` of all zeros or one that cannot be fetched fails, and so does a non-push run started by the publisher. The pushed tree is the thing being judged, so the step takes the script (and `scripts/slug.mjs`) from the commit before the push with `git show`, and decides who pushed in the workflow's own shell (tested as it stands by `scripts/deploy-publisher-guard.test.mjs`). It is only a second line: the workflow file itself comes from the pushed commit (the App cannot change workflow files without the `workflows` permission).

**When the deploy refuses a publisher push, revert first.** The refusal stops that one deploy; the commit stays on `main`, and the next push by anyone deploys it, because each push is judged on its own range. Revert the refused commit on `main` before anything else is pushed, then rotate the App's private key and find out how it got there.

**Keep your own unfinished pull requests as drafts.** The App can merge any pull request whose required checks pass, and yours are exempt from `publisher-paths`; a draft cannot be merged by anyone (ADR 0007).

**A private copy of this repository** needs an authenticated fetch in both jobs (they fetch with `persist-credentials: false`, anonymously, which only works on a public repository).

A pull request the check refuses is never merged and never deploys; `main` is untouched. Run the logic locally in a clone that has both commits: `PR_ACTION=opened PR_AUTHOR_ID=<id> EVENT_SENDER_ID=<id> MAINTAINER_ID=<id> node scripts/check-publisher-paths.mjs pr --base <sha> --head <sha>`, or `node scripts/check-publisher-paths.mjs push --before <sha> --after <sha>` (usage in the file); `npm test` covers it. The script imports only node's built-ins and `scripts/slug.mjs`, which is why the slug rule lives there (`scripts/frontmatter.mjs` re-exports it).

## Versions and commits

`VERSION` is the single source of truth. Each merged task bumps the patch number and is tagged `checkpoint/<VERSION>`; a phase ends in a `v<VERSION>` release. Tags are protected and never move. Commits carry a clear message; the maintainer handles versions and tags when merging.

## Licence

By contributing code you agree that it is licensed under the Apache License 2.0 (`LICENSE`).
