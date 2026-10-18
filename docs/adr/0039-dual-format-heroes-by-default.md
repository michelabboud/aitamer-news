# 0039 · Both hero formats, WebP display by default

Status: accepted for implementation 2026-10-18. Michel: from now on upload JPEG and WebP varieties; posts use WebP by default.

## Context

ADR0038 limited automatic WebP selection to the rollout catalog and allowed future JPEG-only quality fallbacks. Michel now requires both formats for every new hero. The UIUX procedure keeps the canonical JPEG address in post metadata, derives the WebP by name and preserves JPEG social images. Requiring a catalog edit per post would add a maintainer code change to ordinary article publishing.

## Decision

Supersede ADR0038's future JPEG-only publication exception and catalog-registration requirement. Every exact valid owned JPEG hero automatically derives its same-name WebP: legacy or hashed on the original media host, hashed on the bot host. Existing explicit bot WebP inputs remain compatible. The shared picture component selects WebP by default and retains JPEG fallback and social/feed images. Local media overrides keep documented JPEG-only previews.

Generate WebP from the final stamped JPEG using the existing quality ladder and SSIM floor0.95. Upload both files create-only, with the JPEG hash in both names, then verify both public byte/type readbacks before submission. If quality, upload or verification fails, hold publication and preserve evidence; never lower the floor or overwrite an image. The media gate requires both formats for each live hero. Drafts and future posts are rechecked when due.

## Alternatives rejected

- Continuing manual positive-catalog edits would make each ordinary post depend on a maintainer code change.
- Requiring new post metadata to change format is unnecessary: JPEG is the canonical shared address and the renderer already supports derived WebP.
- Keeping JPEG-only publication on failed conversion conflicts with Michel's new two-format requirement. The quality floor remains intact by holding the post.

## Consequences

Future posts default to WebP without a catalog entry or content-schema migration. The original catalog remains historical evidence. Producer services must supply and verify both formats; this change does not claim any external uploader service has been modified or qualified. A producer that cannot supply both must keep the post unpublished. Existing post bytes, dates, identities and image objects are preserved.
