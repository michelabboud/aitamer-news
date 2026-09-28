# Cold read — c554515 (site/heroes-to-r2) vs 060c610

Written after `git diff --stat` and the code diffs of the key files, before verifying the author's claims.

## What I understand the change to be

- 44 JPEGs deleted from `public/heroes/`; 44 posts each change exactly one line, `heroImage: /heroes/<slug>.jpg` → `heroImage: https://media.aitamer.news/heroes/<slug>.jpg`. A mechanical loop over the diff confirmed old == `/heroes/<own slug>.jpg` and new == media URL of own slug for all 44, and no other `+`/`-` line exists under `src/content/posts`.
- `stamp-post-times.mjs --check` (check:times, part of check:posts) gains `heroProblem`: a published post with a `heroImage` key must equal `heroUrl(basename)` exactly; the old relative form passes only if the file exists in `public/heroes/`.
- `_redirects` gains 44 explicit 301s to the media host, derived from `LEGACY_HEROES` and pinned by a test.
- `reservedTopLevelNames` now also reads the first path segment of each `_redirects` source, so `heroes` stays reserved after the folder is gone.
- Social fallback moves to `DEFAULT_SOCIAL_IMAGE` (the welcome hero's media URL).
- smoke-site: a redirect with an absolute target must land on that origin, not just the same path.
- decode-heroes removed from dev/build.

## Suspicions to check

1. Slug derivation: `basename(file)` minus extension. If posts can live in subfolders, or if Astro's id differs from the filename (a `slug:` field, uppercase, dots), the check's "own slug" and the page's slug diverge. Check `postFiles` recursion and the collection loader.
2. Strict `===` should reject http, query, trailing slash, case, percent-encoding, other slugs. But YAML: a non-string heroImage, or `heroImage:` empty (null), yields a message rather than a crash? And the check runs only for `draft:false` — drafts are exempt, so a draft→published flip is caught at the flip. Scheduled future posts are published-by-draft-field, so they must already be on the media host — acceptable, but the check does not prove the object exists (only check:media does, on demand).
3. Is `check:times` actually wired into the CI that gates merges (check:posts in workflows)?
4. `_redirects` to an external host: supported by Pages and by Workers static assets; limits (2,000 static) fine at 44. Interaction with `_headers` rules for `/heroes/*` (stale cache headers?), and CSP `img-src` must allow `media.aitamer.news`.
5. `reservedTopLevelNames` parsing: placeholders, splats, absolute sources, comments — any that add junk or crash? Any other caller not updated?
6. Stale references: `LICENSE-CONTENT.md` still says the artwork is `public/heroes/` — the content licence would no longer describe where the heroes are. Workflows / astro config: grep found no `decode-heroes` or `public/heroes` in `.github/`.
7. GRANDFATHERED hash: recompute both hashes.
8. ADR 0005: edited in place (table labels + Status line). Rulebook: never edit an old ADR, supersede. Need to judge whether the decision text changed.
9. check-media.mjs: must not run in build/test with network; its test must be offline.
