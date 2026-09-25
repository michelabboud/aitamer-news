# Release review (high deep) — v0.2.0, the Bestiary redesign

- **Target:** candidate `2e59d0d` (VERSION 0.1.25). Phase base `29e1453`. Rulings checked against `main` at 0.1.28.
- **Kind:** high deep, release gate, dual-blind.
- **Reviewers:** two separate sessions (separate processes, separate scratch directories, each with its own detached checkout), both Top tier: Claude Fable 5.1. **A same-family pair**, so the two readings are independent in context but not in model.
- **Limits, stated plainly:** the harness denied both reviewers a shell. Neither ran tests, the build, the checks, `git` or `npm audit`; every finding comes from reading source. The coordinator ran all of those (below). Each reviewer wrote a cold-read note before opening the earlier batch reviews.
- **Reports, verbatim:** reviewer A `2026-09-25-release-review-a.md`, reviewer B `2026-09-25-release-review-b.md`.
- **Verdict:** both said "release after fixes". Every blocker is fixed; the gate is passed at 0.1.28.

## Rulings

| Finding | A | B | Ruling | Fixed in |
|---|---|---|---|---|
| No 404 page: Cloudflare Pages served the home page with status 200 for every unknown URL | 1 (Blocking) | B-1 (Blocking) | Confirmed: `src/pages/404.astro` did not exist. Blocking. | 0.1.27 |
| Extinction Watch wrote "N days left" into the static HTML, against plan decision D12 | 3 (Minor) | B-2 (Blocking) | Confirmed. Blocking: the count goes wrong between deploys for every reader without JavaScript, crawlers and language models included. | 0.1.27 |
| Contract v1 accepted an empty `title`, `description` and tags | 8 (Minor) | B-3 (Blocking) | Confirmed. Blocking: once v1 is published, tightening it would be a breaking change. | 0.1.27 |
| Privacy and terms pages still described the retired GitHub Pages copy | 6 | M-1 | Confirmed. | 0.1.27 |
| README's post template failed the contract; stale README wording | 5 | M-2 | Confirmed. | 0.1.27 |
| Plan tasks without a recorded status (404, C5 copy and accessibility pass) | 4 | M-3 | Confirmed. Plan §10 now carries a status per task; the scripted dead-link check is deferred to BACKLOG. | 0.1.27 |
| Desk Bot bio began "Placeholder" | — | M-4 | Confirmed. | 0.1.27 |
| ADR 0004 did not state the trust model | — | M-5 | Confirmed. Recorded in `SECURITY.md` ("Trust model"), where a reporter looks for it. | 0.1.27 |
| Field data (ratings, verdicts) live before Michel's editorial sign-off | 2 | — | Confirmed, not code. The review document still says it awaits sign-off; the release notes call the ratings provisional. | release notes |
| `about.astro` imported a type (`Wildness`) that does not exist | 7 | — | Confirmed. The build passes because type imports are erased; a type check would fail. | 0.1.28 |
| Privacy page said only story lists load the Disqus count script; it loads on every page | 17 | — | Confirmed. | 0.1.28 |
| `heroImage`'s `https://` branch accepted spaces and quotes | 13 | — | Confirmed, harmless after escaping; tightened to match `sources[].url` while the contract is still unreleased. 1 test. | 0.1.28 |
| `/campfire/` lists every post; too heavy at thousands of posts | 9 | — | Confirmed. BACKLOG. | — |
| Footer year frozen in incrementally cached pages | 15 | 6 | Confirmed. BACKLOG. | — |
| GitHub turns off scheduled workflows after 60 days without a commit | 12 | 7 | Confirmed. BACKLOG. | — |
| Stale BACKLOG line about the Big Top phone header | 18 | — | Confirmed; marked superseded. | 0.1.28 |
| `deploy-github-pages.yml` still triggered on push | 12 | 3 | Confirmed. Trigger removed (`workflow_dispatch` only). The file's `check:times` stays in BACKLOG. | 0.1.27 |
| Contact Worker still allows the `github.io` origin | 10 | 5 | Confirmed, low risk. Already in BACKLOG. | — |
| `decode-heroes.mjs` is a dormant build step | — | 8 | Already in BACKLOG. | — |
| `/contract/v1/` re-exports the live handler | 16 | 9 | Accepted: the route's comment says v2 must fork it first. | — |
| Git-history privacy audit and repository protections could not be seen from the tree | 11 | 1, 2 | Verified by the coordinator before the repository went public (0.1.26): rulesets on `main` and on release and checkpoint tags, read-only default token, fork-PR approval, secret scanning with push protection. Michel approved going public with the history as it stands. | 0.1.26 |

The batch B–C review's three blockers and ten minors, and batch A's six blockers, were re-verified by both reviewers as present in the tree.

## Coordinator's checks on the release candidate (0.1.28)

```
npm test              pass 145, fail 0
npm run build         exit 0 (Astro build + Pagefind)
npm run check:posts   every published post has a publish time; 25 published posts numbered; ledger holds 25 lines
npm run check:dist    79 published files, no secrets or server-only content
npm run check:files   137 files in the deploy; the free plan allows 20000
npm audit             found 0 vulnerabilities
```

Live after 0.1.27: `curl` on `https://aitamer.news/posts/no-such-specimen/` returns 404 with the "Specimen not found" page.
