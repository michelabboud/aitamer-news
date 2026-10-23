# 0045 · Prepare image delivery assets locally

2026-10-24 · accepted by Michel's instruction to remove repeated GitHub image preparation.

Routine builds previously invoked Astro image transforms and FFmpeg decoding/SSIM qualification for every hero, even after the same files passed local checks. Each fresh runner also installed FFmpeg and fonts. This duplicated work and delayed ordinary publication.

The trusted local image workflow retains canonical JPEG comparison, 480/720px WebP Q84, SSIM≥0.95, byte savings, bounded decoding and individual exclusions. Its passed receipt and actual staged file hashes produce a protected source catalog. New derivative objects use full SHA256 names on the existing media origin and create-only writes; public readback must match before catalog promotion. Originals are unchanged.

Default rendering only looks up the catalog. Post-build verification checks emitted descriptors and bounded current public JPEG, original WebP and variant bodies against the approved hashes, sizes, MIME and signatures. It includes inert homepage templates. Missing catalog entries use the existing original WebP/JPEG pair; invalid existing entries fail rather than silently downgrading. Catalog and verifier changes invalidate relevant caches and feed snapshots.

Routine GitHub jobs run all site, contract and pure security tests without image tools. Only real image-tool integration fixtures run in the explicit local media suite; the exceptional owner image-approval workflow retains its decoder. Producer admission cannot change the catalog, recipe or code. No dependency, service, account or credential distribution is added.

Tradeoff: current-byte verification still downloads and hashes images, so this is not a zero-network build. New bot posts do not require a local service; they use the original pair until a later local preparation sweep adds qualified sizes. Existing image preparation code and all JPEG fallbacks remain available.
