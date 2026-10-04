# Reviewed publication queue

The deployment workflow retains the currently visible articles unless explicitly asked to admit one reviewed due article. Run it on `main` with `publication_mode=publish`; omit that input to deploy code without adding articles.

## Queue contract

`publication/queue.json` is version 1:

```json
{
  "version": 1,
  "baseline": { "slugs": ["already-live-slug"], "sha256": "<digest of sorted baseline slug array>" },
  "entries": [
    {
      "slug": "reviewed-article",
      "sha256": "<SHA-256 of final Markdown bytes>",
      "pubDate": "2026-10-06T08:00:00Z",
      "reviewSha256": "<SHA-256 of the retained editorial receipt>"
    }
  ]
}
```

The example contains explanatory placeholders and is not an accepted manifest. The real baseline must be complete, every digest must be 64 lowercase hexadecimal characters, and every accepted entry needs a unique UTC half-hour timestamp matching its frontmatter. Baseline slugs cannot be queue entries. Keep accepted entries after publication so later builds can validate the live set. Changing accepted article bytes requires renewed review and a matching queue digest. Rejected or incomplete articles are omitted from the approved entries, while their original evidence remains preserved privately.

`scripts/publication.mjs` exports `validateQueue`, `validateState`, `validateSelection`, `validateReceiptBundle`, `expectedArticleBodySlug`, `validateRequestId`, `acknowledgedAt`, `selectPublication`, `digest`, and `PUBLICATION_INTERVAL_MS` for controllers. Reuse these functions rather than reimplementing normalization. Digest input is `JSON.stringify` of the normalized object; the state digest excludes its own `digest` field. Queues normalize dates to milliseconds and sort entries by time/slug.

## Bootstrap and recovery

Both publishing entry points must remain disabled while preparing the initial queue. Confirm the current complete article set through `/comments/threads.json`, verify its pages and retained baseline evidence, and hash the sorted slug array. After merge and review, enable the guarded deploy workflow and dispatch `publication_mode=bootstrap` with `bootstrap_digest=<that exact hash>`. Bootstrap requires the state endpoint to be absent and the live thread set to match the queue baseline. It adds no articles. A later bootstrap is refused.

After bootstrap is verified, enable the publication timer and secondary schedule. The first new article still waits for its due time and the spacing interval. The controller can request `publish` again after a failure: a failed or interrupted last publication is reconciled by retaining the same visible set, verifying it and creating a new successful acknowledgment before any next addition. If the last publication names an article, recovery checks that article's story body in preview and production and archives matching hashes. Its `selected` value remains null; recovery is not a new publication. Baseline recovery has no article body to check. A network error, invalid JSON, hash mismatch or changed baseline is a failure, not an empty queue.

## Controller observations

`/publication-state.json` contains:

- `version`, `sourceSha`, `queueSha256`, and sorted `visible` slugs;
- `lastPublication`: `runId` as a decimal string, `attempt` as an integer, `sourceSha`, and `slug` or null for baseline bootstrap; this is the 30-minute spacing clock;
- `lastDeployment`: the same identity shape for the deployment that produced this exact served state, including code-only retain deployments;
- `digest`, computed from the preceding normalized fields.

Read the `lastDeployment` GitHub run attempt through `GET /repos/michelabboud/aitamer-news/actions/runs/{runId}/attempts/{attempt}`. `acknowledgedAt(run, state.lastDeployment)` accepts only a matching successful completed attempt on `main` for `deploy-pages.yml`. Download its exact `publication-<runId>-<attempt>` artifact and pass `{ selection, artifactVerification, productionVerification, outcome }` and the current served state to `validateReceiptBundle`. It requires exact state digests, source SHA, run/attempt, checked article body and actual production deployment ID. A missing artifact permits recovery only; a present invalid artifact is an error. Separately check `acknowledgedAt(run, state.lastPublication)` for the last article's completion time and wait at least `PUBLICATION_INTERVAL_MS` after it. Do not dispatch while a deploy is active. The workflow repeats these decisions under its production concurrency lock, so the host's observation is advisory.

Run receipts use artifact name `publication-<runId>-<attempt>` and include `selection.json`, `artifact-verification.json`, preview/production verification JSON when reached, and `outcome.json`. Production verification records the Cloudflare deployment ID and checked article body hashes for a newly selected article or a recovered prior article. `expectedArticleBodySlug(selection)` defines which one needs proof; a null result requires `articleBody: null`. Final success comes from the GitHub run conclusion, not the outcome snapshot written before the artifact upload. Archive them before the configured 90-day retention expires. Record check, dispatch and verified publication separately; a successful dispatch or same-set recovery is not a newly published article. A controller dispatch may send a canonical UUID version 4 `publication_request_id`; the workflow title becomes `Publication <uuid>` and the same request ID enters selection and outcome receipts.

## Build and verification boundary

`publication-cli.mjs prepare <retain|publish|bootstrap> [baseline-digest]` runs only on the main repository branch with its GitHub run identity and `GH_TOKEN`. It verifies current main, approved source hashes, live state, the last deployment's GitHub status and matching GitHub artifact, then creates an owned build directory under `RUNNER_TEMP`. It emits `build-dir`, `receipt-dir`, `selection-digest`, `selected`, `reason` and `should-deploy` step outputs. `spacing` and `nothing_due` return `should-deploy=false`.

Every later build, check and upload must use that build directory. The selection receipt stays outside it and every verification command checks its state digest against the prepare output. `verify-artifact` checks exact pages/threads/state against that receipt; `verify-live <origin>` repeats the artifact check, then checks deployed state/threads and the required article body, including the previous admitted article during recovery. `verify-prior` verifies the pre-selection state before production upload and after rollback. Accepted origins are the production domain and deployment-specific `aitamer-news.pages.dev` hosts. The workflow retains the existing hero, rendered-body, content-security-policy, internal-link and full-site smoke checks.

No local development server or raw source build is a production publication artifact. The run-owned directory has held posts flagged draft; original source files retain their reviewed bytes. Direct uploads outside the workflow bypass admission and must not be used for routine publishing.
