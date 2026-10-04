# Grok media and posting instructions

## Outcome

Accept exact hashed, own-slug JPEG heroes from bots.aitamer.news, while preserving all existing media URLs, date publishing, preview/production checks and rollback. Provide a copyable news-post procedure with conditional bucket-scoped S3 uploads, true JPEG/dimension/hash verification, post-builder gates, a complete house-style image prompt, author restrictions and author-creation commands. Explain that typography belongs to layouts/CSS and that the existing GitHub path guard still governs submissions.

## Verification

773 tests passed, zero failed. Focused media/stamper/preflight suite: 62 passed, zero failed; new URL regression cases failed against the old implementation. Normal Astro build passed. Source checks and 393 existing hero checks passed. Grok guide's 14 Bash blocks and embedded Python/JSON parse. No existing article or queue data changed. Existing grandfathered reader-text warning remains unchanged.

Mixed-origin fixtures prove that an identical main-bucket key cannot satisfy a missing bot-bucket hero, and that wrong-host/query/fragment/wrong-slug URLs are not accepted. These are controlled tests, not an actual Grok upload. The public bot domain responded with verified TLS; root path returned 404, which does not prove any image is present. The Grok credential and bucket name were not inspected or guessed, and no test article was published.

## Assumptions and limits

Michel supplied bots.aitamer.news and credentials to Grok. Bots must use the real bucket name and S3 credentials from their private configuration. Read & Write bucket credentials are not enforced create-only; conditional PUT is a client safeguard. Bot-host support is for frontmatter heroes only; Markdown inline-image allowlists remain unchanged. Existing author ID desk-bot is available; individual identities need separate profile setup. A separate Grok GitHub account is not automatically admitted by the existing publisher path guard, so a permitted publisher submits unless the identity is already supported.

## Review and close-out

Implementation: Sol6.1 high. Root integration and source/artifact verification completed. Independent pinned-source review, required CI and deployment follow before acceptance. No new package dependency, bucket, key, GitHub actor or service is created by this change. Source release is a checkpoint, not a package release. The archived admission system stays inactive.
