# Deep review — the Content-Security-Policy (report-only), commit dc6fe65

- **Reviewer:** Claude Opus 5.5, deep tier, in a separate session, on a git-archive snapshot.
- **Verdict:** clear. Nothing blocks report-only mode. Four should-fixes are latent, and must be fixed before `CSP_ENFORCE` becomes true.

## Should-fix, before enforcement

- **S1.** The guard does not look inside an iframe's `srcdoc`. A srcdoc document inherits the page's policy, so a script or handler inside one would be blocked without the guard saying so. The fix is to refuse `srcdoc`, or scan its value.
- **S2.** The guard does not check these loads:
  - media: `video`, `audio`, `source`, `track`;
  - `link` with rel stylesheet, preload or modulepreload;
  - `img` over http;
  - SVG `script href`, which is also mis-hashed as inline.

  The fix is to add them to the checked loads, and to treat a script with `src` or `href` as external.
- **S3.** connect-src lacks `https://*.google.com`, which Google's current GA4 CSP guidance lists (developers.google.com/tag-platform/security/guides/csp, fetched 2026-09-26). The same guidance does not mention `*.analytics.google.com`. Correct the code comment and BACKLOG.
- **S4.** A script whose type carries MIME parameters is treated as not executable, per the spec, while Firefox has run such scripts. The fix is to decide by the part before the `;`.

## Notes

- **N1.** A local `.env` endpoint can fail the guard, because csp-headers reads only `process.env` while Vite reads `.env`.
- **N2.** The guard models only exact and trailing-`*` rules. It should refuse rule forms it does not understand.
- **N3.** The retired GitHub Pages copy has no CSP; `_headers` there is a readable file holding only the public policy.
- **N4.** The ADR says "9 today"; the build has 8 distinct hashes.
- **N5.** The width trade-offs, with the concrete risk of each: img-src https:, style-src 'unsafe-inline', *.google-analytics.com, frame-src www.youtube.com. form-action is tight. object-src, base-uri and frame-ancestors are 'none'.
- **N6.** Turnstile and Pagefind 1.5.2 need nothing more.

## Verified

- **Checks:** 489 tests pass; the build writes 8 hashes across 51 pages; check:csp, check:posts and check:bodies:build all pass. The inline-handler ban breaks no current post.
- **Hash inventory:**
  - no srcdoc, template, SVG, speculationrules or importmap scripts;
  - no RSS stylesheet;
  - no runtime inline-script creation.
- **Headers served by wrangler pages dev 4.139.0:** exactly one CSP line per path, with 'wasm-unsafe-eval' only on /search/ and /pagefind/, no commas in any value, and `/_astro/*` Cache-Control kept.
- **Workflows:** the guard runs after the build and before the upload in every workflow that builds.
- **Public repo:** no account details.

## Coordinator's ruling (2026-09-26)

Land report-only now (0.2.31). S1–S4, N1, N2 and N4 go to the site lane as a follow-up task, which must land before any change of `CSP_ENFORCE`. The production headers are to be confirmed with curl after this deploy.
