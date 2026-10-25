# Build dependency audit repair

Date: 2026-10-25 UTC. Source qualification only; independent review, integration, release and deployment remain separate coordinator steps.

## Scope and decision

The phase audit of source `2396c256fbba0e69b5478e0aefa64349e43a6604` reported 13 advisories across six transitive packages, aggregated as six high-severity affected packages. This repair runs `npm audit fix --package-lock-only --ignore-scripts --json` without `--force` and preserves `package.json` and all source/content contracts. Every package remains within its existing dependency range; no direct dependency, architecture, runtime behavior or public API is added or changed.

The repaired lockfile has SHA-256 `9d5c8f4b0a24d4f37cc7db398dae551632a1396fa420523e8ae618729eb47806`. `package.json` stays SHA-256 `906af9676969b2769928637e998845415e0adf4b50bfc509c733c1e7c89e148b`; Astro stays 7.3.5. Existing declared dependency ranges remain authoritative.

## Advisory resolution

| Package | Before | Resolved | Advisory IDs and upstream evidence |
| --- | --- | --- | --- |
| http-cache-semantics | 4.2.0 | 4.3.0 | [GHSA-ch52-4w7c-c8xp](https://github.com/advisories/GHSA-ch52-4w7c-c8xp), outside the recorded affected range `<=4.2.0`; see the dispute below. |
| sharp | 0.35.4 | 0.35.5 | [GHSA-wq5f-xc86-pv6w](https://github.com/advisories/GHSA-wq5f-xc86-pv6w), patched at 0.35.5. Matching platform binaries move to 0.35.5 and libvips bundles to 1.3.4. |
| source-map-js | 1.2.1 | 1.2.2 | [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q), patched at 1.2.2. |
| undici | 8.11.2 | 8.12.3 | [GHSA-4qv8-2p9j-2685](https://github.com/advisories/GHSA-4qv8-2p9j-2685), [GHSA-f72v-6w45-q472](https://github.com/advisories/GHSA-f72v-6w45-q472), [GHSA-xjj6-f33q-929c](https://github.com/advisories/GHSA-xjj6-f33q-929c); the 8.x patch threshold is 8.12.2. |
| vite | 8.3.1 | 8.3.5 | [GHSA-698v-4r3x-3vcv](https://github.com/advisories/GHSA-698v-4r3x-3vcv), [GHSA-r825-w8mm-5pxw](https://github.com/advisories/GHSA-r825-w8mm-5pxw), [GHSA-587h-7wmj-h5pm](https://github.com/advisories/GHSA-587h-7wmj-h5pm), [GHSA-9jrq-w75r-8gcw](https://github.com/advisories/GHSA-9jrq-w75r-8gcw), [GHSA-rq7h-c2jc-7f22](https://github.com/advisories/GHSA-rq7h-c2jc-7f22), [GHSA-vfpm-58rq-9qcg](https://github.com/advisories/GHSA-vfpm-58rq-9qcg); the 8.3.x patch threshold is 8.3.3. |
| zod | 4.6.5 | 4.6.7 | [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5), patched at 4.6.6. |

The http-cache-semantics advisory still lists no patched version. Its [maintainer disputes the report and closed the issue as not planned](https://github.com/kornelski/http-cache-semantics/issues/56). Version 4.3.0 is [present in the upstream package metadata](https://github.com/kornelski/http-cache-semantics/blob/main/package.json) and is outside the affected version range used by npm audit. The evidence establishes an audit resolution, not a demonstrated security patch for the disputed behavior. No advisory is suppressed or excluded.

The compatible Vite resolution also advances Rolldown 1.2.11 to 1.2.15 and its platform bindings, `@oxc-project/types` 0.151.0 to 0.155.0, PostCSS 8.5.28 to 8.5.31 and nanoid 3.3.19 to 3.3.20. Together with the six packages and sharp platform bundles, 51 existing lockfile package entries change; none are added or removed. These are transitive resolutions. The [Vite 8.3.5 release](https://github.com/vitejs/vite/releases/tag/v8.3.5) includes build/hash and dependency changes, so rendered-output compatibility is checked below. npm documents the chosen lockfile-only repair in its [audit command reference](https://docs.npmjs.com/cli/v12/commands/npm-audit/).

## Verification

Commands use Node 24.20.0 and npm 12.0.2 in an isolated worktree with a private, real `node_modules` directory. Installation uses `npm ci --ignore-scripts --no-audit --no-fund`; no shared checkout or dependency symlink is changed. Receipt files bind each command to the source commit, lockfile/package hashes, start/end timestamps and raw output hashes.

- `npm audit fix --package-lock-only --ignore-scripts --json`: exit 0.
- Fresh `npm audit --json`: exit 0; zero vulnerabilities at every severity.
- Private `npm ci --ignore-scripts --no-audit --no-fund`: exit 0.
- `npm run check:posts`: exit 0; 1,054 numbered published posts, zero comment/reaction files and 1,052 machine-authored posts with zero new findings. The existing two grandfathered iframe findings remain explicitly reported.
- Changed-lock `npm test`: exit 0; 1,415 passed, zero failed/cancelled/skipped/todo. The frozen v1/v2 schema and route tests passed without source or snapshot edits.
- `npm run build`: exit 0; 1,393 HTML pages; prepared-image readback, redirect generation, diagram materialization, Pagefind and Content Security Policy generation completed. Existing Shiki fallback notices and Pagefind's informational UI notice were retained in private output.
- `npm run check:csp`: exit 0; every inline script on 1,393 pages is covered by the existing Content-Security-Policy-Report-Only policy. This repair does not change that policy's mode.
- `npm run check:bodies:build`: exit 0; the build's 1,055 posts have zero new findings.
- `npm run check:dist`: exit 0; 2,534 scanned published files contain no detected secrets or server-only content.
- `npm run check:links`: exit 0; 140,208 internal links on 1,393 pages are served.
- All ten generated current/v1/v2 contract documents are byte-identical to the accepted pre-repair reader build, including the frozen comments and comments-index contracts.
- `git diff --check`: exit 0. The 1,650 tracked source files match the pinned commit except `package-lock.json`; this new report is the only added repository file. No lint command is defined in this package.

## Output compatibility

The accepted reader build was generated around 20:18 UTC. By the ordinary repaired build, four additional scheduled posts were due: the page count moved from 1,389 to 1,393 with no removed HTML pages. That clock difference cannot establish a dependency regression.

A separate `git archive` of the pinned source was verified against every tracked Git blob and installed privately with the original lockfile. Paired `astro build --force` renders then used an external test-only Date preload fixed at `2026-10-25T22:00:00.000Z`; the patched render used a separate private output directory. Both forced renders exited 0 and produced 1,392 HTML pages and 2,555 total files before the post-build stages. Neither fixed-clock output is a deployment artifact.

The paired renders contain no route additions/removals, and all contract and other non-HTML files are identical except three regenerated JavaScript bundles. Of the HTML pages, 333 are byte-identical; all 1,392 are identical after substituting only the three changed bundle references and the dependency-sensitive homepage feed snapshot token on six pages. The existing feed fingerprint deliberately includes `package-lock.json`, so that token must change when the lock changes. No reader text, attributes other than those references/token, article identity, schema, or comments/reaction behavior is normalized away.

The regenerated bundles are CommentsLive, HomeFeed and Reactions. Their raw sizes change from 2,342 to 2,340 bytes, 14,717 to 14,693 bytes and 12,083 to 12,070 bytes respectively. Re-minifying both sides with the patched Rolldown compressor produces identical canonical CommentsLive and Reactions code. HomeFeed retains a structural difference: an if/early-return branch is compressed into a conditional expression inside a discarded async invocation. A diagnostic equality check exited 1 for that remaining structural difference; it is retained as such, not presented as an independent semantic proof.

To check the affected HomeFeed artifact, the existing Chromium regression was adapted privately to embed the exact emitted bundle bytes. It uses the original synthetic fixture, CSS and assertions, with Chrome's pipe transport and intercepted requests rather than a server or live API. The emitted-bundle test passed: one test, zero failures/skips, exit 0. It exercises one-batch automatic loading, continued scrolling, restoration failure/retry, suspension/resume, anchor restoration and keyboard focus. The first private harness attempt failed on a CSS path after relocation (`ENOENT`); that failed output/profile remains retained. The corrected harness resolves the original CSS explicitly and passed without changing repository source or tests.

The ordinary checked `dist` remains the 1,393-page build. The lane's private Astro cache was subsequently used for the fixed-clock comparison; any later build in this lane must use `astro build --force` to avoid reusing that comparison cache.

## Exposure and limits

These findings concern dependency behavior in the controlled Node build/development toolchain. This Astro application emits static files without a server adapter. An anonymous deployed-reader path into these Node packages has not been demonstrated. That limited exposure assessment does not establish that build inputs, developer servers, image parsing or every dependency are safe. A clean npm audit is a current registry result for this lockfile, not a general security guarantee or an audit of Node's bundled libraries.

## Custody and hygiene

Private raw evidence is retained under the coordinator's `dependency-repair` evidence directory. No raw logs, credentials or account details are committed. The lane retains its private dependency install, ordinary build, fixed-clock outputs, original-lock archive and failed/successful Chromium fixtures for independent review. No data was removed. The coordinator owns final cleanup, version allocation, commit, checkpoint, push and integration. Existing frozen schema snapshots/routes, article and specimen identities, comments/reaction behavior and other lanes remain untouched.

All command receipts identify the pinned source, unchanged package metadata hash and repaired lock hash before and after execution. The fresh clean audit ran from 22:10:40 to 22:10:41 UTC; changed-lock tests from 22:11:08 to 22:12:07 UTC; the full build from 22:12:55 to 22:13:33 UTC; paired forced renders from 22:15:33 to 22:15:51 UTC; and emitted HomeFeed qualification from 22:19:33 to 22:19:43 UTC. No commit, tag, push, pull request, merge or deployment was performed by this repair lane.
