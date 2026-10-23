# Prepared responsive hero images

Normal `npm run build` does not generate or decode images. It renders approved delivery URLs from `src/data/prepared-heroes.json` and checks their current bytes, plus both originals. The original JPEG remains the fallback and social image; WebP remains the preferred display format. An uncatalogued new post uses its original pair normally.

## Local operator procedure

1. Run `npm run test:images` locally with FFmpeg/FFprobe installed. `npm test` remains the full local suite; `npm run test:site` runs routine tests without decoder tools.
2. Run `npm run heroes:qualify` locally. This explicitly enables Astro generation and the original full quality finalizer, using a separate cache. CI refuses this mode. The finalizer prints its passed receipt path under `node_modules/.astro/responsive-heroes/`.
3. Export the receipt and the exact resulting build bytes into a fresh private directory:
   `node scripts/export-prepared-heroes.mjs RECEIPT_JSON dist NEW_PRIVATE_DIRECTORY`
   The exporter refuses changed bytes or incompatible measurements. Preserve the full receipt and failed measurements privately.
4. Publish each `upload-plan.json` entry through the existing bucket-scoped uploader described in [the hero procedure](hero-procedure.md#upload-both-formats-original-media-host). Its `file`, `key`, SHA256, size and URL are explicit. Use `image/webp`, immutable cache control, and `If-None-Match: *`. Never overwrite/delete an object. An existing object is reusable only after exact public readback. Never request a new public URL before its upload; preserve upload receipts and uncertain outcomes.
5. Require every plain public variant URL to return matching SHA256, size and WebP MIME. Then copy the exported `prepared-heroes.json` into `src/data/`, and run the ordinary build. It independently checks both originals and every referenced derivative without FFmpeg. An original that changed since qualification requires fresh local qualification.
6. Submit the catalog through an ordinary source PR. Article/image-only producer approval does not authorize this catalog or the qualification policy. Normal checked merge/deployment applies.

The catalog records recipe/policy and local-receipt digests, source and derivative hashes/dimensions/bytes and admitted SSIM measurements. It is approval evidence, not a claim that a remote filename alone proves image quality. The verifier checks all marked pictures, including feed templates, and refuses modified descriptors, missing files, redirects, wrong MIME/signatures, oversized bodies and changed bytes. Both caches and feed fingerprints include the catalog/policy inputs.
