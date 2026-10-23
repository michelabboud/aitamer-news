# Michel collage profile

Michel approved the generated paper-collage portrait before implementation. The preview used his public GitHub avatar for identity and the existing Mai portrait for house style, through the built-in image generation tool. The original GitHub image remains available unchanged.

Profile delivery uses a 768 × 1024 WebP portrait and a 256 × 256 WebP avatar. Matching JPEG versions are retained alongside them. No original image or article is overwritten. The stable author ID remains `wiz-cat`, the public name remains Michel, and the existing biography and GitHub link are preserved.

Michel opts into the existing featured human-writer profile. Explicit presentation ranks put Michel first, Mai second and Aviram third, preserving the existing writers’ relative order. This changes presentation, not author identity or article URLs. No framework, schema, script or workflow changes are required.

Verification: full suite 1139 passed, zero failed. Production build and independent review are recorded on the pull request before merge. The first focused attempt exposed an ordering-test regression from changing default order; that approach was reverted, and the final implementation uses existing metadata only. The superseded full run was stopped; its logs were retained. No additional tests were added for metadata values.

Image generation prompt: preserve Michel’s recognizable face, short spiky hair, glasses and facial hair from his GitHub drawing; match Mai’s layered torn-paper collage, cream parchment, muted blue palette, circuit motifs and coral accent; chest-up vertical portrait, no text or watermark. The generated master is retained locally, and only resized delivery assets enter the public repository.

Close-out: repository checkpoint 0.2.102. Source push opens a normal pull request; merging publishes to Cloudflare Pages through existing checks. Separate responsive post-image work remains isolated in its original worktree.
