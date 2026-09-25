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

## Versions and commits

`VERSION` is the single source of truth. Each merged task bumps the patch number and is tagged `checkpoint/<VERSION>`; a phase ends in a `v<VERSION>` release. Tags are protected and never move. Commits carry a clear message; the maintainer handles versions and tags when merging.

## Licence

By contributing code you agree that it is licensed under the Apache License 2.0 (`LICENSE`).
