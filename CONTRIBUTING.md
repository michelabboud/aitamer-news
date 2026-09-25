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

Reader comments reach this repository as data files, `src/content/comments/<slug>.json`, written by the desk's publisher (`POST.md` section 8, ADR 0006). The publisher is a GitHub App — no `workflows` permission, on no bypass list — whose login is the repository variable **`PUBLISHER_LOGIN`** (`<app-slug>[bot]`). It never pushes to `main`: it pushes a `desk/comments-*` branch and opens a pull request.

Every pull request into `main` runs `.github/workflows/check-publisher-pr.yml`, whose job **`publisher-paths`** is the required check in the branch ruleset (repository admins bypass the ruleset, so the maintainer's direct pushes keep working). The job checks out `main` only and never runs anything from the pull request: it lists the changed files through the API and reads the head tree's file modes with `git ls-tree` on a fetched, never checked-out commit, then runs `main`'s `scripts/check-publisher-paths.mjs` over that list. The rule (phase 2 plan D12):

- The author is `PUBLISHER_LOGIN`: every changed path must be `src/content/comments/<slug>.json` — not nested, not another name, extension or case, nothing outside the directory; a rename must start and end inside; an added or changed file must be a plain, non-executable file (no symlink, no submodule, no executable bit). Deleting a comment file is allowed: that is how an emptied thread leaves the site.
- The author is anyone else: the check passes; the maintainer reviews the pull request.
- `PUBLISHER_LOGIN` is unset or empty: every pull request is held to the rule (fail safe), so set the variable before the first human pull request that touches code.

A pull request the check refuses is never merged and never deploys; `main` is untouched. Run the logic locally with `node scripts/check-publisher-paths.mjs --files <pr-files.json> --modes <ls-tree -z output>` (usage in the file); `npm test` covers it.

## Versions and commits

`VERSION` is the single source of truth. Each merged task bumps the patch number and is tagged `checkpoint/<VERSION>`; a phase ends in a `v<VERSION>` release. Tags are protected and never move. Commits carry a clear message; the maintainer handles versions and tags when merging.

## Licence

By contributing code you agree that it is licensed under the Apache License 2.0 (`LICENSE`).
