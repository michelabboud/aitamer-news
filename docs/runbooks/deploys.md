# Deploys: how aitamer.news goes live, and what to do when it does not

The design and the reasons are in `docs/adr/0014-verified-deploys.md`; this is the operator's page.

## How a deploy runs

`.github/workflows/deploy-pages.yml`, on every push to `main`, on the hourly scheduled publish (`scheduled-publish.yml`, only when a post is due), and on the **Run workflow** button:

1. **settle** — after a push, wait `DEPLOY_SETTLE_SECONDS` (default 60). Each newer push replaces a waiting run and restarts the wait, so merges less than a minute apart, however many, are one deploy. The button and the scheduled publish skip the wait.
2. **checks** — the tests, `check:posts`, the build, then `check:bodies:build`, `check:csp`, `check:dist`, `check:files` and `check:links`. Any failure: nothing is uploaded.
3. **preview** — upload to the `deploy-candidate` branch (a `*.aitamer-news.pages.dev` address; the run's summary shows it) and smoke-test it. Failure: nothing went live.
4. **production** — upload to `main` and smoke-test https://aitamer.news.
5. **rollback** — only if step 4's check failed: production goes back to the deployment that was live when the run started. The run still fails.

A started deploy is never cancelled by a newer one; the newer one waits for it.

## Deploy now

Actions → **Deploy Cloudflare Pages** → **Run workflow** on `main`. Tick **wait** only if you want it to collect more merges first. From a terminal: `gh workflow run deploy-pages.yml --ref main`.

## Change the settle time

Repository → Settings → Secrets and variables → Actions → **Variables** → `DEPLOY_SETTLE_SECONDS`, a whole number from 0 to 3600. `0` deploys straight after each merge. A value outside that range fails the run with a message naming the variable.

## Read a failed deploy

The job summary lists the commit, the deployment that was live before, the preview address, and the production deployment id. The failing step says which layer caught it:

| Failed step | Production | What to do |
|---|---|---|
| a `check:*` step, the build, or the tests | untouched | Fix on a branch; the error names the file. |
| Check every internal link leads somewhere | untouched | The log lists each page and the link it cannot serve. |
| Smoke-test the preview | untouched | Each `::error::` line names the address and what was wrong. Open the preview address to see it. |
| Smoke-test production, then **Roll production back** succeeded | back to the previous deployment | Readers saw the bad version for about a minute. Fix, then merge again. |
| Roll production back failed | **the bad version is live** | Roll back by hand (below), now. |
| Record the live deployment | untouched | The Cloudflare API refused; usually the token (below). |

`smoke:` checks the whole site three times, 20 s apart, before failing, so a one-off network error does not fail a deploy.

## Roll back by hand

Cloudflare dashboard → Workers & Pages → `aitamer-news` → **Deployments** → the last good production deployment → **⋯** → **Rollback**. Any successful production deployment is a valid target, including one newer than the one live now.

Then check what is served: `node scripts/smoke-site.mjs --base https://aitamer.news --expect production --dist dist` against a local build of the commit you rolled back to. Titles are compared, so a build of another commit reports every changed page.

## The API token

`CLOUDFLARE_API_TOKEN` (an Actions secret) needs the account permission **Cloudflare Pages: Edit**. That covers uploading, reading the project's live deployment, and rollback. `CLOUDFLARE_ACCOUNT_ID` is also a secret, and it is never printed: `scripts/pages-api.mjs` hides it in any Cloudflare message it shows.

## Check a deployment yourself

```
npm run build
node scripts/smoke-site.mjs --base https://aitamer.news --expect production
node scripts/smoke-site.mjs --base https://<id>.aitamer-news.pages.dev --expect preview
```

Exit 0 means it passed; each finding is printed as `::error::`.
