# Focused re-check: c554515..ea08f6a (`site/heroes-to-r2`)

Reviewer: Opus 5.5, read-only. The detached checkout was moved to ea08f6a after `git fetch`. `node_modules` is still an untracked symlink, and no `astro` commands were run through it. Scope: `git diff c554515 ea08f6a` (29309a3 carries the N1–N4 fixes, and ea08f6a adds `check:media` to `check-posts.yml`).

## Evidence

- `npm test`: `ℹ tests 681 · ℹ pass 681 · ℹ fail 0`, up from 676.
- `npm run check:posts`: `check:times: every published post has a publish time and its hero on the media host.`
- `node scripts/check-media.mjs` against the live host: `44/44 post heroes on https://media.aitamer.news answer 200 image/jpeg (39 of them live).` (exit 0). The 5 posts that are not live are the scheduled "Vectors, Plainly" parts 2–6.
- `git diff 060c610 ea08f6a --stat -- docs/adr/0005-deploy-file-budget.md`: `1 insertion(+), 1 deletion(-)`.

## Does each fix close its finding?

### N1 · closed: the deploy now catches a hero that was never uploaded

- **Where it runs in the deploy.** The step sits in `deploy-pages.yml` after `check:links` and `check:diagrams:dist`, and before the rollback target is recorded and before the preview upload. A missing hero therefore stops the run before anything reaches Cloudflare. `scripts/deploy-workflow.test.mjs` pins this: `check:media` is now the `lastCheck` that must come before `live`, `preview` and production. It also pins that the step has no `if` or `continue-on-error` and runs with no `--local` argument.
- **Which posts count as live.** `collect` (`scripts/check-media.mjs`) marks a post as required when `isPublishedDraftField === true` and its `pubDate` is either unreadable (null, which is treated strictly as live) or has passed according to `isLive`. `isLive` is the same function the site uses (`src/lib/schedule.ts`, `pubDate <= now`), so the boundary matches the build: the new test shows 08:59:59 is only listed and 09:00:00 exactly fails.
- **Clock direction.** The build takes `BUILD_TIME = new Date()` before `check:media` runs, so the check's `now` is always at or after the build's. The check can only treat *more* posts as live than the build did, never fewer. That direction is safe, and no page the build made live can escape the check.
- **Scheduled posts.** When a scheduled post goes live, `scheduled-publish.yml` (cron `7 * * * *`) calls `gh workflow run deploy-pages.yml`. That deploy runs the check with `now` past the `pubDate`, so the post's hero is verified the moment it goes live.

### N2 · closed: the old path is refused and the folder cannot come back

- **The old path.** `heroProblem` no longer checks the disk: `/heroes/<own slug>.jpg` gets the "retired repo path" message that names the correct URL, and `/heroes/<other>.jpg` gets "must be".
- **The folder.** `main(['--check'])` fails while `public/heroes/` exists, even when it is empty. A test covers the empty folder and the folder with a file. The test that runs against the real repository also asserts `existsSync('public/heroes') === false`.
- **The 13 URL variants.** The table in the test holds 13 near-misses: another slug, another host, http, a query, a fragment, a trailing slash, an uppercase host, an encoded slug, userinfo on an attacker's host, userinfo on the real host, an explicit `:443`, `.jpeg`, and an in-body image path. Empty and null values are tested too. Every one must match `must be … not "`. This also closes I2.
- **Remaining gap (informational, I agreed to the folder-only form).** A JPEG placed elsewhere under `public/` (for example `public/img/x.jpg`) is not refused. Only the `heroes` folder is guarded.

### N3 · closed: the licence names the new location

One line changed: "The artwork: the hero images served from `https://media.aitamer.news/heroes/`, …". The rest of the licence is untouched.

### N4 · closed: the old decision record is back to its original text

- **ADR 0005** matches the base commit except for its Status line, which now reads "Accepted, 2026-09-25. Step 3.1 superseded in part by ADR 0020." The table labels were reverted.
- **ADR 0020's Status** now carries the supersession: it names step 3.1, says the move was done by the site rather than atn-mcp, and states the new ceiling of about 9,900 posts. The ADR index entry says the same.

## The step added to pull requests (ea08f6a)

- **Trigger and permissions.** `check-posts.yml` runs on `pull_request`, not `pull_request_target`, with `permissions: contents: read`. The checkout uses `persist-credentials: false`, and neither the job nor the step has an `env` or a secret. The new test `scripts/check-posts-workflow.test.mjs` pins this: no `if`, no `continue-on-error`, no `env`, runs after `npm ci` and `check:posts`, workflow permissions exactly `{contents: read}`, and `pull_request` still among the triggers.
- **Fork pull requests.** They get no secrets and a read-only token, and the step only sends anonymous `HEAD` requests to our public media host. A fork can edit `check-media.mjs` in its own pull request, but it could already run arbitrary code through `npm test` in the same unprivileged job, so nothing new is exposed.
- **Order.** The step runs after `check:posts`, which proves each URL is the right one, and before the build.

## New findings

### R1 · non-blocking (documentation) · ADR 0020 contradicts itself about deploys

- **Where:** `docs/adr/0020-hero-images-live-on-r2.md:16`, decision point 2, still says: "The build never fetches an image, so the media host being down never fails a deploy."
- **The conflict:** the updated Consequences section, and the workflow itself, say the opposite: "The media host being down therefore holds deploys back". A reader who stops at the Decision section gets the wrong operational picture during an outage of the media host.
- **Fix:** change the sentence to "The build never fetches an image; the deploy's `check:media` step does, so a media-host outage holds deploys back (see Consequences)." The ADR was written in this same unreleased change, so editing it now is not a rewrite of an accepted record.

### R2 · informational · a malformed `pubDate` crashes `check:media` instead of producing a message

- **Where:** `collect` in `scripts/check-media.mjs` calls `pubDateOf(fm)` outside its `try`. `pubDateOf` throws a `FrontmatterError` for a `pubDate` in a flow mapping, or a date-only value it cannot rewrite.
- **Effect:** `check:media` then exits through an unhandled rejection (non-zero, with a stack trace) rather than listing the file and exiting 2. It fails closed, and `check:posts` runs first in both workflows and reports the same file cleanly, so this only matters for someone running the script on its own.
- **Fix:** move the `pubDateOf` call inside the existing `try`, which pushes the error to `errors`.

### R3 · informational · one missing hero now blocks the whole deploy

A live post whose hero is missing stops every deploy of `main`, including unrelated code fixes and every other scheduled post, until the image is uploaded or the post is returned to draft. This is what the design intends, and the ADR states it. Two notes for later:

- The recovery step ("upload it, or set `draft: true`") belongs in the runbook for the deploy.
- The check sends one HEAD per post on every deploy, at 8 concurrent requests. That is trivial at 44 posts but grows linearly toward 10,000.

## Nothing broken

- The tests, `check:posts` and the live `check:media` are all green.
- The PR check reads only and needs no secret.
- The deploy order is pinned by tests.
- The live boundary matches the site's own rule.
- ADR 0005 differs from the base commit by exactly one Status line.

VERDICT: CLEAR
