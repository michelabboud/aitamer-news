# Generated responsive hero delivery

Status: implemented for review,2026-10-23. Dev mode:production. Michel requested optimizing the supplied image audit while retaining JPEG fallback for all posts.

Keep original JPEG and paired960WebP objects unchanged; social/feed metadata remains JPEG. Generate only smaller480/720WebP static site assets from canonicalJPEG with installed Astro/Sharp. Browser sizes follow the actual lead/homecard/listing/article CSS and DPR. Actual source dimensions/aspect determine descriptors and heights; no upscaling. Unknown/offline/inconsistent sources retain original rendering with diagnostics. Metadata promises alone are memoized; each render registers transforms with Astro.

Measured q90 produced a720asset larger than its existing960WebP. Use q84 and a postbuild admission finalizer before Pagefind and CSP: actual width/aspect/format valid, SSIM>=0.95 against exact-size JPEG reference, and derivative bytes strictly below existingWebP. Exclude only disqualified candidates; always retain rawWebP+JPEG. Operational failures and malformed explicitly marked pictures fail the build. A unique local receipt records hashes, dimensions, bytes, recipe/comparator versions, verdicts and page totals. No public optimization manifest, manual per-hero exception registry or new service/dependency.

Only marked owned pictures participate. Remote reads use exact HTTPS owned hero paths, no redirects, bounded body/time/retries. Subprocesses force image formats/protocols with bounded time/output/thread counts; source pixel limits apply before Sharp. Rewrites splice only srcset attributes and preserve other HTML bytes. Warm cached pages are requalified every build. Existing original-pair publication requirements are unchanged.
