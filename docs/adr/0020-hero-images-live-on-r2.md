# Hero images live on R2 behind media.aitamer.news, written as full URLs

## Context

Until 0.2.44 every post's hero was a JPEG in `public/heroes/` (44 of them, about 13 MB), shipped in every deploy and referenced as `heroImage: /heroes/<slug>.jpg`. Three costs grew with the site:

- **The deploy file budget** (ADR 0005). A hero is one of the ~3 files each post adds, and the free plan's cap is 20,000 files: heroes in the deploy put the ceiling near 6,600 posts, short of the 10,000 the site is built for.
- **The repository.** Binary images in git never leave its history; at ~330 KB a post, 10,000 posts is gigabytes that every clone and every CI checkout carries.
- **The writers.** Bots and AI writers work through pull requests; a JPEG in a pull request is awkward for them (the old workaround was base64 text parts decoded by `scripts/decode-heroes.mjs` before every build).

The approved plan (atn-ops `docs/plans/2026-09-25-comments-and-r2-media.md` §5.5, §7) moves them to Cloudflare R2. Michel gave the go on 2026-09-28; the bucket `aitamer-media` and its custom domain `media.aitamer.news` were set up and verified first (headers `nosniff`, a sandboxing Content-Security-Policy, `Cross-Origin-Resource-Policy: cross-origin`).

## Decision

1. **Heroes live in R2** at `heroes/<slug>.jpg` in the bucket `aitamer-media`, served at `https://media.aitamer.news/heroes/<slug>.jpg` as `image/jpeg` with `Cache-Control: public, max-age=86400`. In-body images, for any author, go to `posts/<slug>/<name>.jpg` the same way. Humans upload with `wrangler r2 object put` under their own login; bots use a bucket-scoped token that lives only in atn-ops. POST.md §3 is the procedure.
2. **Frontmatter holds the full URL**: `heroImage: https://media.aitamer.news/heroes/<slug>.jpg`. `src/lib/media.ts` is the one place that knows the host (`MEDIA_ORIGIN`, `heroUrl`); `resolveMedia` rewrites it to `PUBLIC_MEDIA_BASE` for offline work (a git-ignored `public/media-local/`). The build never fetches an image, so the media host being down never fails a deploy.
3. **`check:posts` enforces it.** `scripts/stamp-post-times.mjs --check` refuses a published post whose `heroImage` is not exactly its own media URL: another host, another post's image, any variant of the URL (no normalising: scheme, case, query, fragment, encoding and userinfo all count), or the old `/heroes/<slug>.jpg`. It also fails while a `public/heroes/` folder exists, so images never return to the repository. A post without a hero keeps its section cover. The schema's pattern still admits `/heroes/…` so the posts tool's copy of the contract keeps parsing; the check, not the schema, is the gate.
4. **`npm run check:media` proves the upload**, in the deploy (before any upload) and on demand: one `HEAD` per post hero, and with `--local <dir>` a byte-for-byte comparison (`Content-Length`, and the ETag, which R2 sets to the MD5 of a single-part upload). The migration ran it against `public/heroes/` before any frontmatter changed: 44 of 44 matched.
5. **The move was textual and checked.** `scripts/rewrite-hero-urls.mjs` rewrote the one `heroImage` line of each post by index, re-parsed the file with the reader Astro agrees with (ADR 0019) and refused unless every other field came back identical; bodies were not touched. It refuses a post whose hero is not its own file.
6. **Old URLs keep working.** Feeds, social previews and other sites hold `https://aitamer.news/heroes/<slug>.jpg`. `public/_redirects` sends each of the 44 to its media URL with a 301, one explicit line per image (`LEGACY_HEROES` in `src/lib/media.ts`, held equal to the file by `src/lib/redirects.test.ts`). The list is closed: a post written after the move never had a repo path. The deploy's smoke test checks every one, and a redirect to another host must land on that host. `heroes` stays a reserved top-level name, so no writer page can take `/heroes/`.
7. **Nothing is ever deleted from the bucket** by a migration or a script: an old image may still be linked from outside.

## Alternatives rejected

- **`r2.dev` URLs.** Rate-limited, meant for development, and not cached by the CDN; a custom domain is.
- **Relative paths rewritten at build time** (keep `/heroes/<slug>.jpg` in frontmatter, map it to the media host in the build). The frontmatter would then not say where the image is; every consumer (feeds, the posts tool, other sites) would need the mapping. A full URL means what it says everywhere.
- **A splat redirect** (`/heroes/* https://media.aitamer.news/heroes/:splat 301`). One line instead of 44, but it also answers for names that never existed, and the smoke test cannot check a pattern against the live site. Explicit lines stay well inside Pages' 2,000 static redirects and never grow.
- **Cloudflare Image Transformations** for responsive sizes. Free for 5,000 unique transformations a month, which the site outgrows at scale; not needed until page weight is a measured problem (plan §7.5).
- **Keep the heroes in the deploy and pay for Workers Paid.** Solves the file cap, not the repository growth or the writers' path, and costs money before it must (ADR 0005).

## Consequences

- Each post costs ~2 deploy files, not ~3; the free plan's ceiling moves from ~6,600 posts to ~9,900 (the second row of ADR 0005's table). The 0.2.45 build ships 196 files, none under `heroes/`.
- A live post's hero that was never uploaded fails the deploy: `npm run check:media` runs in `deploy-pages.yml` before anything is uploaded (one `HEAD` per hero, retried on a 5xx), as a missing `public/heroes/` file used to fail the link check. A draft's or a scheduled post's hero is only listed until it goes live. The media host being down therefore holds deploys back; it is ours, and that is the right outcome. The build itself still never fetches an image.
- Writing a post now needs `wrangler` access (humans) or the bucket token (bots). Local development shows the production bytes over the network; offline needs `PUBLIC_MEDIA_BASE`.
- Git history still holds the 44 JPEGs, recoverable with `git show`; the repository stops growing by images from here on.
- Replacing an image under the same key can take up to a day to reach every reader (the cache lifetime).

## Status

Accepted, 2026-09-28. Supersedes in part step 3.1 of ADR 0005 (deploy file budget): the move is carried out here, by the site itself rather than atn-mcp, and each post now costs ~2 deploy files, so the ceiling is about 9,900 posts, not 6,600.
