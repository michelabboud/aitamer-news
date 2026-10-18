# WebP integration review · 2026-10-18

CONFIRMED: source reviews and local checks below; final candidate review and remote checks pending.

Michel authorized validation and acceptance of the open site PRs. PR283 passed review and merged normally at21fbcb94. Code changes from PR285 (ebfb8fab) and PR261 (59f43ba) and documentation from PR284 (b1f55719) are preserved by merges onto a maintainer code branch based on21fbcb94. Their latest source heads add only main merges. Grok-prefixed source branches correctly enter article-only admission; this integration uses the ordinary maintainer PR route and changes no workflow, permission, or required check.

## Review findings and disposition

- Independent deep review, GPT-6.1 Sol at xhigh: no current-content production blocker; confirmed repeated/trailing-hyphen slug mismatch and conversion after local media rewriting. Fixed the slug matcher to match the site's accepted slug alphabet; section metadata converts the raw hero before resolving a local base. Added a regression covering ordinary, repeated and trailing hyphens and local JPEG resolution.
- Independent focused review, GPT-6.1 Sol at high: PR283 and PR261 source had no actionable defects. Verified share-image dimensions against two existing images. Confirmed bot docs still selected JPEG despite explicit-WebP code; fixed selection only after verified WebP upload, preserving JPEG fallback. Focused follow-up found live-byte comparison still used JPEG; retain HERO_FILE with the selected URL through final verification.
- Reviews share a filesystem; initial reviews read pinned Git objects. Focused mutable-file guide review is recorded as such, not blind acceptance. Final focused reviews will inspect a pinned commit.

## Local evidence

Combined candidate: npm test1030 passed,0 failed; npm run build exited0; check:posts exited0; check:media908/908 passed (907 live); built-body check907 posts,0 findings; CSP check1006 pages passed;94675 internal links all served;1989 built files checked with no secrets or server-only content. Logs retained privately under /home/michel/.local/state/aitamer-publisher/webp-combined-*-20261018.log.

Existing reader-text warning in made-on-youtube-2026-gemini-ask-studio.md and its grandfathered body findings remain unchanged; the same warning occurred before integration. No article text, image objects, dates, numbering or ledgers changed. Historical bot hero URL switching and original-media-host picture rollout remain separate work.
