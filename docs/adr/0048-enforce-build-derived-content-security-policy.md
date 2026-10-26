# 0048. Enforce the build-derived Content Security Policy

## Status
Decision recorded 2026-10-26; source integration and live acceptance in progress. Extends ADR 0010. Authorized by Michel to finish enforcement using apps-server staging through an SSH tunnel, without a custom staging domain.

## Context
The site has generated hashes for authored executable inline scripts, exact provider origins and separate Pagefind worker and SVG policies. The site policy is report-only. Cloudflare injects a rotating inline JavaScript Detections wrapper after build time, which cannot receive a stable build hash.

## Decision
Enforce the existing generated hash policy, deliberately denying the unapproved rotating inline detection wrapper. Preserve caching, analytics, allowed form providers, comment-data reads, search WebAssembly permissions and diagram lockdown. Do not introduce unsafe inline script permission, fixed nonces, dynamic middleware, provider configuration changes or `no-transform`.

Strengthen deployed-artifact checks so report-only fallback, missing/duplicate/wrong policy, stale hashes or a missing worker permission fail the existing preview/production deployment guards. Qualify the exact candidate through SSH staging and fresh anonymous production-origin response interception before merge, then verify actual unmodified live responses after deployment. See [execution plan](../plans/2026-10-26-csp-enforcement.md).

## Alternatives rejected
- Unsafe inline execution, fixed nonces or one copied wrapper hash weaken protection or fail on the next wrapper.
- `no-transform` also disables automatic Cloudflare Web Analytics injection and can disable edge compression, changing existing behavior.
- Per-response nonce middleware adds a dynamic HTML and caching path; reserve it for evidence that legitimate readers require the denied detection script.
- A custom staging hostname does not replace actual production-edge acceptance.

## Consequences
Losing this one detection signal does not disable every bot control or prove account rules were audited. Fresh anonymous reading and actual form-widget operation must pass; a challenge loop or broken legitimate workflow fails acceptance. Every unrelated site-origin violation is a blocker. Only per-response attribution establishes the intentional wrapper exception. Production form submissions are never used as test data. Keep a known healthy deployment and the existing verified rollback path.

## References
- [JavaScript Detections](https://developers.cloudflare.com/cloudflare-challenges/challenge-types/javascript-detections/)
- [Web Analytics setup](https://developers.cloudflare.com/web-analytics/get-started/)
- [Origin cache control](https://developers.cloudflare.com/cache/concepts/cache-control/)
