# Workflow runtime refresh — October 6, 2026

Current image selection: checkpoint0.2.76 supersedes the Ubuntu24.04 choice below with Michel's explicitly requested Ubuntu26.04 trial. The following inventory and full-suite/build evidence describe checkpoint0.2.75; the successor's bounded verification is recorded at the end.

## What was built

PR #204 keeps its existing documentation changes and adds a bounded workflow refresh. All 14 hosted job selectors now use `ubuntu-24.04`, avoiding the announced October 19–November 19 migration of `ubuntu-latest` to Ubuntu 26.04. Three Cloudflare deployment steps pin Wrangler CLI `4.147.0`, replacing `4.139.0`. All six direct action dependencies already match their official latest stable releases, so their immutable commit pins remain unchanged.

PR auto-merge was disabled and read back as `null` before changing its tip. No article, specimen ledger, controller code, credential, permission, ruleset, trigger, checkout ref, cache key or deploy destination changed. The retired GitHub Pages workflow remains manual-only and disabled in repository settings. No paid or self-hosted runner was added; the repository runner API returned `total_count: 0`.

## Dependency and image inventory

Official GitHub release APIs returned `draft: false` and `prerelease: false` for each release below. Tag references resolved to the exact pinned commits; Wrangler Action's annotated tag was dereferenced to its commit. This is verification at the time of this task, not a promise that upstream will never publish another release.

| Direct action | Latest stable, retained | Exact commit |
|---|---|---|
| [actions/checkout](https://github.com/actions/checkout/releases/tag/v7.0.1) | 7.0.1 | `3d3c42e5aac5ba805825da76410c181273ba90b1` |
| [actions/setup-node](https://github.com/actions/setup-node/releases/tag/v7.0.0) | 7.0.0 | `820762786026740c76f36085b0efc47a31fe5020` |
| [actions/cache](https://github.com/actions/cache/releases/tag/v6.1.0) | 6.1.0 | `55cc8345863c7cc4c66a329aec7e433d2d1c52a9` |
| [cloudflare/wrangler-action](https://github.com/cloudflare/wrangler-action/releases/tag/v4.1.3) | 4.1.3 | `953926a2e2182532811c01a25e53647d93bf07c0` |
| [actions/upload-pages-artifact](https://github.com/actions/upload-pages-artifact/releases/tag/v5.0.0) | 5.0.0 | `fc324d3547104276b827a68afc52ff2a11cc49c9` |
| [actions/deploy-pages](https://github.com/actions/deploy-pages/releases/tag/v5.0.1) | 5.0.1 | `368f82528645a54fb793d4d04e342629a3f51346` |

The five JavaScript actions use upstream `node24` runtimes. Upload Pages Artifact is composite and internally pins Upload Artifact v7.0.0 to `bbbca2ddaa5d8feaa63e36b76fdaad77386f024f`. There are no workflow `container`, `services`, `image` or Docker action dependencies to refresh. The hosted OS label selects Ubuntu 24.04, not an immutable image build: GitHub still updates the software image behind that version. The [official Ubuntu 24.04 manifest](https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2404-Readme.md) reported image `20260927.320.1`, Bash 5.2.21, Git 2.55.0 and GitHub CLI 2.101.0. Its preinstalled Node is 22.23.3; existing setup-node steps explicitly install Node 24. Trusted steps before setup-node retain their existing compatible built-in Node use.

| Workflow | Jobs changed to Ubuntu 24.04 |
|---|---|
| check-posts.yml | check |
| check-publisher-pr.yml | publisher-paths |
| check-specimen-pr.yml | specimen-integrity |
| deploy-contact-worker.yml | deploy |
| deploy-github-pages.yml | build, deploy |
| deploy-pages.yml | settle, deploy |
| scheduled-publish.yml | check-due |
| specimen-admission.yml | prepare, validate, certify |
| specimen-editorial-review.yml | wake |
| specimen-finalize.yml | reconcile |

[Wrangler 4.147.0](https://github.com/cloudflare/workers-sdk/releases/tag/wrangler%404.147.0) was published October 2 as a stable release. Its annotated tag resolves to `64c1337155a6bc7224b5d47f58ca521d8b8ee3fe`; npm's stable `latest` is also 4.147.0. The workflow keeps an exact CLI version input, rather than a floating tag. Its Node requirement is `>=22.0.0`, satisfied by Node 24; the existing action also runs on Node 24. The CLI's upstream supported dependency set includes `miniflare@5.20261001.0-alpha` and `unenv@2.0.0-rc.24`; these are transitive dependencies of the stable CLI, not direct prerelease selections made here. No transitive override or repository package/lockfile change was introduced.

Release notes for 4.140.0 through 4.147.0, including 4.143.1, were inspected. The existing Worker `deploy --config` and Pages `pages deploy` interfaces remain supported; actual Worker bundling and Pages command help were checked below. Retain Cloudflare's maintained first-party deployment CLI and GitHub/Cloudflare actions: replacing them adds an unrelated integration and trust boundary. No action major version changes or new direct dependencies were necessary. The local `package.json` development command still uses Wrangler 4.139.0 and is outside this workflow-only task. This report does not claim all repository libraries were updated or that a separate dependency vulnerability audit passed.

## Runner failure evidence and limits

The two reported failures targeted `c982d013e425238bea3548aa976356b6adb54b28`:

| Run | Run ID | Attempt 2 job ID | Result |
|---|---|---|---|
| [Check posts #537](https://github.com/michelabboud/aitamer-news/actions/runs/37366867174) | 37366867174 | 111959723292 | Run failure; job cancelled; `runner_id: 0`, empty runner name and `steps: []` |
| [Workflow-owned numbering #47](https://github.com/michelabboud/aitamer-news/actions/runs/37366992566) | 37366992566 | 111959963436 | Run failure; job cancelled; `runner_id: 0`, empty runner name and `steps: []` |

Both check-run annotations say the hosted runner was never acquired. Their separate notice links to the [Ubuntu migration announcement](https://github.com/actions/runner-images/issues/14748). The reported internal-server correlation IDs are `5e7e70ab-578f-4c29-9763-099b536b2210` for #537 and `96816746-ad8a-4802-a54c-51adaff5bbd0` for #47. Check posts #538 subsequently succeeded on the same original SHA. No workflow action or project command executed in the failed jobs. The image migration notice is not evidence that an obsolete action caused acquisition failure. Pinning Ubuntu avoids an OS-family migration; it does not establish a fix for GitHub hosted-runner availability. The coordinator observed an ongoing Actions provider incident separately from these source changes.

`check-publisher-pr.yml` and `check-specimen-pr.yml` use `pull_request_target`, so their pending-PR runs execute trusted main's workflow and runner selection. Updating PR #204 cannot change those jobs' runner labels until the source merges to main. Fresh Check posts push/PR runs can use the candidate's Ubuntu 24.04 selection. Event types, required check names and trusted checkout refs remain intact; changing them to run untrusted PR workflow code would weaken the security boundary. Independent review, exact-head remote checks, normal merge and actual deployment remain separate acceptance gates.

## Verification evidence

All checks below exited 0 against the unchanged application tree with the workflow edits:

- `npm test`: 933 tests, 933 passed, zero failed/cancelled/skipped/todo; Node v24.20.0. Log: `/tmp/aitamer-workflow-refresh-tests-20261006T001600Z.log`.
- YAML/structure audit: all 10 workflow files parsed with the existing js-yaml dependency. Comparing parsed old/new workflows confirmed only 14 runner selectors and three Wrangler inputs changed. All 67 actual Bash `run` steps passed `bash -n` after replacing GitHub expressions with inert syntax placeholders. This is YAML and Bash syntax validation, not a claim that actionlint was run.
- `npm run check:posts`: 419 published posts numbered, 420 ledger lines; zero rendered findings across 417 machine-authored posts. The two grandfathered findings and one reader-note warning on unchanged `made-on-youtube-2026-gemini-ask-studio.md` remain reported. Log: `/tmp/aitamer-workflow-refresh-posts-20261006T001600Z.log`.
- `npm run build`: production build and Pagefind completed; CSP generated for 369 pages. Log: `/tmp/aitamer-workflow-refresh-build-20261006T001600Z.log`.
- Rendered-body, CSP, link, diagram, secret and file gates: 420 rendered posts with zero findings; inline scripts covered on 369 pages; 34,434 internal links served; 41 diagrams match; 753 published files contain no secrets/server-only content; 1,118 deploy files below the 20,000 free-plan limit.
- `npm run check:media`: 421/421 heroes return 200 image/jpeg, including 308 live heroes. Log: `/tmp/aitamer-workflow-refresh-media-20261006T001600Z.log`.
- Wrangler 4.147.0 `deploy --dry-run --config workers/contact/wrangler.toml`: bundles 10.82 KiB, gzip 3.74 KiB, and exits successfully without a deployment. Pages deployment help confirms the existing `--project-name`, `--branch`, `--commit-hash` and `--skip-caching` options. Logs: `/tmp/aitamer-workflow-refresh-wrangler-20261006T001600Z.log` and `/tmp/aitamer-workflow-refresh-pages-help-20261006T001600Z.log`.
- `git diff --check`: passed. No tests were added to assert constants or prose; existing workflow and publication regressions exercise behavior.

## Assumptions, concerns and close-out

This is a stable workflow runtime refresh, not an application dependency upgrade or a runner-provider replacement. Routine patch allocation reconciled on-disk VERSION and all local/remote checkpoint/release tags: greatest 0.2.74, next unused checkpoint 0.2.75. A VERSION hold was kept by the implementation lane through push. Existing PR #204 receives the new commit; no second PR is opened. Its title/body are left unchanged because an `edited` event does not receive the publisher-paths maintainer exemption; the new commit's synchronize event and this report carry the final scope.

Hygiene: approximately 31.28 GB was available before validation; existing build outputs were 26 MB and the production build fit. The isolated clone, existing node_modules/dist/Astro cache, dry-run bundle and all evidence logs are retained. No cleanup, branch removal, history rewrite or unrelated state mutation was performed. Source checkpoint and local gates do not imply provider recovery, a release, a production deployment or publication. Root owns the independent reviews and subsequent normal merge/deployment proof.

## Ubuntu 26.04 trial successor — checkpoint0.2.76

Michel explicitly requested trying Ubuntu26.04. All14 runner selectors now use `ubuntu-26.04`; this supersedes the earlier Ubuntu24.04 choice without changing action SHAs, Wrangler4.147.0, permissions, triggers, checkout refs, cache configuration, trust boundaries, articles or the ledger. PR204 was still open, main unchanged at `83fc37a727b86cbf4392423acf0eac64f3e4cbb9`; auto-merge was disabled and read back as null before edits. The [official announcement](https://github.com/actions/runner-images/issues/14748) confirms Ubuntu26.04 is generally available for production workloads. The [official Ubuntu26.04 manifest](https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2604-Readme.md) reported image20260927.149.1, Node24.21.0, Bash5.3.9, Git2.55.0 and GitHub CLI2.101.0. The pre-setup trusted Node/Git/CLI steps therefore have the required tools; setup-node still requests Node24.

Successor verification exited0: all10 YAML files parse; a semantic comparison against parent `8e455562a261099754435457603af01895ca1d4e` confirms exactly14 runner values changed; all67 actual Bash run steps pass syntax; seven existing workflow/context/cache/token test files pass45/45 tests with no failures. Log: `/tmp/aitamer-ubuntu26-workflow-tests-20261006.log`. The earlier933-test/application-build results are retained as parent evidence, not relabeled as successor runtime proof. No unchanged application full suite/build or Wrangler dry-run was repeated; fresh remote Check posts runs execute their full checks on Ubuntu26.04. Trusted-main `pull_request_target` jobs retain main's prior label until merge. Runner acquisition, independent successor review, merge and deployment require fresh evidence; the trial is no provider-recovery claim. Tags/VERSION reconciled to greatest0.2.75 and next unused0.2.76. Existing PR204 and evidence are preserved; no cleanup or new runner/service was introduced.
