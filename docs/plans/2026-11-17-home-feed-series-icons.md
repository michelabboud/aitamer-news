# Homepage series-card repair

Authorized 2026-11-17 by Michel's request to fix broken lazy loading and the edge-injected CSP error. Dev mode: production. Tasks run back to back through validation, independent review, checked merge and live verification.

Threat sketch: fetched homepage batches are untrusted HTML until the strict card validator accepts them. Preserve its HTML-only namespace, element/attribute allowlist, URL checks, size bounds and snapshot binding. Existing trusted series icons must render without admitting executable SVG. Keep CSP enforced; the unrelated rotating Cloudflare detection wrapper is an operational configuration issue, never a reason to permit arbitrary inline scripts. Preserve analytics and Turnstile. No post, specimen, credential or user-data changes.

1. Feed worker: reproduce a real series-card batch rejection, render homepage icons with existing trusted SVG assets as CSS masks, preserve inherited color and normal listing/post icons. Own the rendering components, adjacent icon CSS and focused render regression.
2. Coordinator: run one broad frozen-candidate suite, strict post checks, production build and generated-artifact gates. Verify real desktop/mobile feed progression and icons using a temporary localhost static preview (port 8847, task registry claim).
3. Independent reviewers: inspect pinned Git objects and validation receipts; assess strict validation preservation, base-path behavior and visual compatibility. Coordinator owns docs, versions, push, checked PR merge and deployment.
4. Coordinator: verify production feed batches and separately resolve/verify the Cloudflare injection setting using authorized account access. Private operations records retain account access details. Do not weaken CSP to hide the error.

The native collaboration runtime supplies worker handbacks; unavailable deployment/account capabilities are recorded as explicit blockers. Existing template snapshots without series components are not wholesale refreshed by this repair.

Status: implementation running. Source baseline: eabefb89f5fdb34a363e7ef9bfcc6a15dc158980. Live acceptance remains pending.
