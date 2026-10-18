# All post heroes use verified WebP · 2026-10-18

Dev mode: production. Authorized by Michel: please update all our posts.

## Threat sketch

Public static site; protect article identities, existing images and publication availability. Inputs are committed post metadata and a trusted positive catalog of verified JPEG/WebP pairs. Only exact owned hero URLs can become WebP sources. No network during builds, no credentials in source, no uploads or destructive image changes. Required media checks validate both publicly served objects before deployment.

## Decision and execution

Use a committed catalog of verified hero pairs and a shared picture component on article pages, PostCard and the homepage lead. Modern browsers choose WebP; the image fallback remains JPEG. Social cards and feeds retain JPEG. Both owned hosts and original unhashed media URLs are covered. Every existing post is included; no post source or permanent metadata changes. Unknown future JPEGs remain JPEG so an explicitly allowed quality-floor fallback can publish; verified new pairs can be registered by the operator, and explicit bot WebP heroes remain supported.

1. Inventory and verify all post WebP twins. Initial result: 907/907 pass (578 original media,329 bot). Private probe evidence under /home/michel/.local/state/aitamer-publisher/all-webp-20261018/.
2. Coordinator owns media helper, picture component, render call sites and helper/component behavior tests. A scoped worker owns positive catalog, media checker and its behavior tests. Shared helper contract agreed before dispatch; no overlapping edits.
3. Run focused and full tests, build/post/media/output checks. Verify built HTML for every live post, WebP sources on cards/homepage, JPEG metadata and unchanged source post/ledger blobs.
4. Independent source review and focused fixes; commit/version/checkpoint, ordinary maintainer PR, current-head required checks, normal merge, production deployment and live WebP verification.

Status: running. No published dates, specimens, content, image objects or workflow boundaries change.
