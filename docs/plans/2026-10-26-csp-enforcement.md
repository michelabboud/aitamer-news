# CSP enforcement through SSH staging

Authorized 2026-10-26 by Michel: finish CSP using the apps server and SSH tunnel; no staging domain. Dev mode: production. Status: integration in progress; production remains report-only until reviewed delivery and live acceptance.

Threat sketch: protect readers from unapproved executable content while preserving reading, search, forms and media. Treat edge injection separately from authored scripts. Preserve exact provider origins, Worker token checks, comments reads, SVG sandbox and worker Wasm permission. Tests create no production comment, message or reaction. No credential/account details, new runtime, dependencies or provider changes.

1. Integrate accepted template enforcement and regression tests. Preserve explicit report-only rollback support and handwritten headers byte-for-byte.
2. Strengthen deployment smoke checks against the exact generated artifact for home, story, search, actual worker, 404 and diagrams. Preserve redirect, cache, noindex and content checks.
3. Run full source tests, post/media gates and production build. Retain candidate hashes and independent mechanical/deep reviews.
4. Serve the unchanged candidate artifact on the apps server behind the existing local SSH tunnel. Verify reader journeys, worker search, media, form feedback using isolated interception, and a disposable unknown-inline rejection probe.
5. Before merge, test actual fresh anonymous production HTML with only candidate CSP response headers substituted. Block production mutations and analytics measurement; attribute any rotating edge-wrapper denial precisely. This is simulation, not live enforcement.
6. Complete independent production review, required exact-head hosted checks and normal merge. Existing workflow verifies preview, deploys production, smoke-tests it and rolls back on failure.
7. Verify actual live enforced headers and fresh anonymous journeys with interception disabled. Keep cache/encoding/provider behavior unchanged. Retain failures and rollback receipts if any; no history rewrite or broad purge. Stop only the newly owned staging service after testing and preserve the user's SSH tunnel.

ADR 0048 records the intentional edge-wrapper tradeoff. Missing/wrong policy, newly attributed site violations, broken legitimate flows or challenge loops fail acceptance. Source, staging, simulated edge compatibility, deployment and actual live acceptance are separate evidence.
