# Owner-approved image updates: source verification

## What was built

An owner-only GitHub Actions dispatch authorizes a single image PR head against current main. Three isolated jobs inspect bounded image data, run the complete site's validation without writer credentials, and issue the three required checks from trusted main. Normal protected merging and deployment remain separate. Image-only observations explain the owner action while retaining article numbering and bot path boundaries.

## Verification evidence

Persistent evidence copies: `/home/michel/.local/state/aitamer-news/image-approval-20261020-Ccq2Ed/`. Original temporary logs below remain retained too.

- Full suite: **1089 tests, 1089 pass, 0 fail**, 47976.605942 ms. Log: `/tmp/aitamer-news-image-full-tests-20261020-8xxIDk.log`.
- Final suite after the avatar review fix: **1092 tests, 1092 pass, 0 fail**, 48267.588453 ms. Log: `/tmp/aitamer-news-image-full-tests-20261020-5nm39r.log`, also copied to persistent evidence. The focused policy/observation/routing suite passed **54/54**.
- Failing-first routing test and missing image-policy/export regressions were recorded before implementation. A CLI import-cycle regression found and corrected a real exit-13 deadlock; the corrected CLI refusal returns exit 1 normally.
- Initial full run: 1087 pass, 2 fail because the existing security tests enumerate every builder workflow. Added `image-approval.yml` to those two expected inventories; existing validation-order assertions were retained. Initial log: `/tmp/aitamer-news-image-full-tests-20261020-BK3LAQ.log`. Focused body/CSP suite then passed **80/80**.
- Production build passed; log: `/tmp/aitamer-news-image-approval-build-20261020.log`. CSP checked 1026 pages; 96356 internal links all served; 41 shipped diagrams matched their rewrites; 928 built posts had zero unexcused rendered-body findings.
- `check:posts`, `check:dist` (2028 published files without secrets), `check:files` (3058 deployed files), and `check:media` (**1857/1857**, 1853 live) passed. Existing unchanged grandfathered body findings and reader-text warning remain recorded by the ordinary checks.
- `git diff --check`, Node syntax and workflow YAML parsing passed.

Source review ledger: Astra xhigh planned the trust separation; Sol xhigh implemented the image module/workflow; coordinator implemented observation integration, routing, documentation and verification. Independent Sol xhigh deep review accepted source and the focused avatar fix without a blocking finding. Independent Luna max mechanical review found the permissive avatar-string gap; it was fixed with allowed image paths/origins and isolated remote HEAD validation, and focused mechanical re-review accepted the fix without a remaining blocker. Reviewer tokens, queue time and exact per-agent latency are unavailable. One batch; no carried unruled batches or extra line admission.

## Assumptions made

The manual GitHub control is **Actions → Approve image PR → Run workflow**. Native review approval is not required and does not independently authorize this path. New bot proposals use `images/` branches; existing recognized observation branches remain compatible. Exact-head dispatch is deliberate authorization; a new push or moving main requires a new run. The owner identity is pinned in trusted code.

Raster files and sanitized diagram SVGs cover ordinary image roles; other SVGs retain existing pinned-hash restrictions. External hero references retain the create-only media upload contract. No media uploader, new dependency, general bot write permission or automatic merger was added.

## Concerns and observations

Local tests alone did not establish hosted dispatch, certificate issuance, original PR #292's merge or production deployment. The separate hosted receipts below now establish those outcomes. PNG decoding has a real-file regression; other formats have signature checks and runtime decoder validation. The original WebP portrait passed the hosted decoding/validation job and independent live byte-hash verification.

## Close-out confirmation

Documentation, plan, architecture decision and bot instructions updated. Version reserved: `0.2.91`. Both independent source reviews are accepted. Source checkpoint: `checkpoint/0.2.91`; remote required checks, protected merge and hosted image acceptance are tracked separately in the implementation PR and PR #292.

Hygiene inspection: no deletion or cleanup performed. Standard ignored dependencies (277 MiB), build output (66 MiB) and Astro output (56 KiB) retained for local verification; logs retained as evidence. No new long-running local process, service, datastore or worktree was created. Free working disk was 37 GiB; available memory 43 GiB; shared-memory filesystem 8% used. The initial unused maintainer adoption branch remains local, preserving its cherry-picked original image change.

Dashboard: `/home/michel/.local/state/build-task-dashboard/tasks.html`; project `/home/michel/projects/aitamer-news`, run `aviram-image-adoption`, session `news-pr292-adoption`.

## Hosted acceptance and final records

- [Implementation PR298](https://github.com/michelabboud/aitamer-news/pull/298) passed all four check instances and normally merged at `d6dcbfc9b4c6c0b2eb8250981633776bc9bcff29`.
- [Owner run39400050864](https://github.com/michelabboud/aitamer-news/actions/runs/39400050864) passed prepare, isolated validation and certification for image head `3eced3580046af9b782d7f1eda5679a740c155c9`. Both previously failing observations passed, along with both full check observations and all three required certificates.
- [Image PR292](https://github.com/michelabboud/aitamer-news/pull/292) received exact-head approval and normally merged at `24d4b22fa6e2239c53bdd9ecab4713e6877ef21b`. The CLI precheck stopped at the update policy, but the normal SHA-pinned REST merge succeeded under unchanged server rules. No `--admin`, branch-rule change or direct main push was used.
- [Production run39400491915](https://github.com/michelabboud/aitamer-news/actions/runs/39400491915) succeeded. Independent live checks returned HTTP200 for the homepage, both author pages, the180634-byte portrait and15472-byte avatar. New references were present in served HTML; portrait SHA256 `ec2cb87c19f09e7cf3635eeb03179baf1f8e307e8b7ec49b30af6626e8b370c6` matched reviewed source exactly, and the avatar hash matched its content-addressed filename.
- Final documentation review resolved remaining absolute article-only image bans in the bot contract, added the Grok image route, and preserved old handoff evidence. The new architecture decision was renumbered0040 because0038/0039 were already allocated. No application code changed in checkpoint0.2.92; documentation whitespace/reference checks and normal remote required checks govern its close-out.

Append-only detailed hosted receipts are in the persistent evidence folder. Bot instructions, plan and current handoff now describe the accepted state.
