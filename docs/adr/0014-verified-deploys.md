# Deploys stay automatic, wait for merges to settle, and are verified on a preview and in production, with an automatic rollback

## Context

A merge to `main` deploys aitamer.news (`.github/workflows/deploy-pages.yml`). On 2026-09-28 Michel merged two pull requests seconds apart and asked for an on-demand deploy instead, so that many merges could ship together at a moment he chooses, and for a mechanism that makes sure a deploy cannot break the site.

What was true before this decision:

- **Two merges did not make two deploys.** The workflow's concurrency group cancelled the older run: #34's deploy was cancelled after 29 s and only #35's shipped. Bursts already coalesced; they were just not designed to.
- **Every deploy already re-ran every check on the merged commit** before uploading: the tests, `check:posts`, the build, and the rendered-body, CSP, secrets and file-budget checks. A build that fails or a bad post never went live.
- **Nothing checked the site Cloudflare actually served.** A redirect mistake, a header rule gone wrong, a missing page or a dead internal link passes the build and shows only on aitamer.news, and nothing undid a bad deploy but a person noticing.
- **`scheduled-publish.yml` deploys `main` every hour a post comes due.** Anything that lets `main` differ from production has to deal with it.

## Decision

1. **Deploys stay automatic, and wait for merges to settle.** A `settle` job waits `DEPLOY_SETTLE_SECONDS` (a repository variable, default 60, at most 3600) after a push; a newer push cancels an older run still waiting and restarts the wait, so merges less than a minute apart, however many, are one deploy of the last of them. Michel set 60 s ("1 minute is more than enough"); a pause longer than the window mid-batch only means two deploys, the second following the first. A manual run (the "Run workflow" button) and the hourly scheduled publish do not wait; the button has a `wait` input for a manual run that should. The deploy job itself is never cancelled once started: a newer run queues behind it, and GitHub keeps only the newest queued run.
2. **Every internal link is checked before upload** (`npm run check:links`, `scripts/check-dist-links.mjs`), in the deploy and on every pull request: each same-site URL in every built page must resolve to a file, a folder page or a `_redirects` source, the way Cloudflare Pages serves them. External links are not checked, on purpose: another site's outage must not block a deploy.
3. **The build goes to a preview first.** It is uploaded with `--branch=deploy-candidate`, which Pages serves only at a `pages.dev` address, and `scripts/smoke-site.mjs` checks that preview against `dist`:
   - every page answers 200 with this build's `<title>`;
   - every root file, and every file the home page loads, answers 200;
   - every `_redirects` line answers its status and target;
   - an unknown address answers 404;
   - the home page carries a Content-Security-Policy, and a hashed `/_astro/` file the long cache header;
   - the preview carries `X-Robots-Tag: noindex`, set for `*.pages.dev` hosts in `public/_headers`.

   Any failure stops the deploy with production untouched.
4. **Then production, checked the same way on aitamer.news.** Production must **not** carry `noindex`, which would take the whole site out of search results. Because the page titles must match this build, an old deployment still being served fails too. A fresh deployment gets three rounds, 20 s apart, before the verdict.
5. **A failed production check rolls production back** to the deployment that was live when the run started. Before uploading anything, the run records that deployment's id through the Pages API (`scripts/pages-api.mjs live`); on failure it calls the rollback endpoint (`pages-api.mjs rollback`). The job still fails, so GitHub reports it, and the summary shows the deployment ids.

## Alternatives rejected

- **On-demand deploys only (a "Deploy" button, no deploy on merge).** Michel's first proposal; rejected with his agreement.
  - The hourly scheduled publish deploys whatever is on `main`, so it would ship un-released code merged since the last manual deploy. Avoiding that means building scheduled posts from "last deployed commit + new content", which is a much larger and more fragile change.
  - Merging a content pull request would no longer publish it: a merged post waits until someone remembers.
  - `main` stops being what is live, so "what is live?" needs its own bookkeeping.

  The settle window gives the batching without those costs, and the button still exists.
- **A separate staging site that production is promoted from.** It needs a second Pages project and a promotion flow. The preview deployment gives the same "try it where nobody reads it" check inside one project and one run. Per-pull-request previews for a *human* to look at remain a separate, open idea (BACKLOG).
- **Verify production only, with no preview.** It is simpler, but every failure would reach readers before the rollback. The preview catches most failures with production never touched, and the upload is cheap, because Pages deduplicates files by content.
- **Roll back by rebuilding the previous commit.** It is slow, needs the old tree to still build, and repeats work Cloudflare has already kept. The rollback API restores the exact bytes that were live.
- **Check external links too.** It is flaky by nature, since other sites time out, rate-limit and move. A dead source link is a correction to a post, not a broken deploy.

## Consequences

- **A merge goes live about 3 minutes later** (the 1-minute settle time plus about 2 minutes of build and checks); `DEPLOY_SETTLE_SECONDS=0` restores immediate deploys. The hourly publish and the button are unaffected.
- **Two uploads per deploy**, the preview and production, each a Pages deployment. Direct-upload deploys are not the free plan's "builds", and the files are deduplicated.
- **Preview addresses are public** (anyone with the address can read them) and carry `noindex`. They hold nothing that production will not hold minutes later. Putting them behind Cloudflare Access would be a new Cloudflare resource, and is Michel's call.
- **The API token needs Pages Edit** (the documented permission for rollback), which deploying already requires. The account id is never printed; `pages-api.mjs` replaces it in any Cloudflare message it shows.
- **What this does not catch:** a page that works but looks wrong (a layout bug, a bad image), content errors, and anything on a page beyond its status and title. Visual regression checks are a BACKLOG idea.
- **Known limit of the rollback target.** It is the project's `canonical_deployment` when the run starts, which Cloudflare documents as the most recent production deployment. If a previous run rolled back and was then followed by another failure, that field's behaviour after a rollback is not documented. It is not verified; the runbook says how to check it and roll back by hand.
- **`check:csp` now models one absolute-URL rule form**: a `*.pages.dev` rule, as never reaching the site, and only while it leaves the Content-Security-Policy alone.

## Status

Accepted 2026-09-28 (Michel: "we need a mechanism to make sure the deploy is safe and will not break the website"; the design agreed in conversation the same day).
