# Quill posting: the `quill/` lane

Quill's evergreen posts go through one pull request per batch from a `quill/*` branch, opened by the `aitamer-quill-posts` GitHub App. The workflow numbers the posts, certifies the checks and merges, with no owner review (ADR 0036). Posts, ledger and byline rules are Grok's plus one: **every post must be written as `author: quill`, and an existing post can be edited only if it already is.**

## What the lane allows
- Added or modified plain `src/content/posts/<slug>.md` files, and nothing else. Never edit `src/content/specimen-ledger.txt` yourself; new posts omit `specimen`.
- Branch `quill/<anything>`, in this repository, from `origin/main`.
- Heroes stay on the media host (`https://media.aitamer.news/heroes/<slug>-<8 hex>.jpg`), uploaded before the pull request opens. Never commit a hero.
- The pull request description still records sources opened, claims checked, visual findings, the UTC dates, the hero URLs, the commands run and any unresolved evidence. The lane skips the owner's review, not the evidence.

## One-time setup (the owner)
Not done yet; until it is, the lane is inert and the owner-dispatch route in `workflow-owned-specimens.md` stays in force.
1. **Create the App** `aitamer-quill-posts` (GitHub, Settings, Developer settings, GitHub Apps): permissions Contents read and write, Pull requests read and write, Metadata read. **No Workflows permission**, no webhook needed. Install it on `michelabboud/aitamer-news` only.
2. **Download its private key** and keep it as a mode 600 file under `~/.config/aitamer-publisher/` on the publishing machine, for example `quill-posts-app.pem`. Never in a repository, a chat or a log. Note the App id and the installation id.
3. **Find the bot account's numeric id**: `gh api /users/aitamer-quill-posts%5Bbot%5D --jq .id`.
4. **Set the repository variable** `QUILL_ACTOR_ID` to that id (Settings, Secrets and variables, Actions, Variables). This opens the publisher guard's lane. **Unsetting it closes the lane** immediately.
5. **Pin the id for admission**: change `QUILL_ACTOR` from `null` to the same number in `scripts/specimen-admission.mjs` through a code pull request and merge it. Admission reads the pin, never the variable, because variables can be changed by other collaborators. Reverting that line also closes the lane.
6. **Branch rules**: allow the App to create `quill/*` branches and open pull requests, as for `grok/*`; it must still not be able to update `main`, and the required checks (`publisher-paths`, `check`, `specimen-integrity`, certified by GitHub Actions) stay strict.
7. **Tell Quill the ids** (App id, installation id, key path) so the publishing scripts can mint short-lived installation tokens. The key authenticates only this App.

## Kill switch and recovery
- Close the lane: unset `QUILL_ACTOR_ID`, or revert the `QUILL_ACTOR` pin, or suspend the App's installation. Any one is enough; open pull requests then fall back to the ordinary rules and wait for owner review.
- A pull request with a non-`quill` byline, or one that edits another writer's article, is held at discovery (a `::warning::` in the admission log names the file) and refused at certification. Fix the byline or remove the file; a corrected head is a new source.
- Merged posts are reverted like any other: a revert pull request through the owner's route.
