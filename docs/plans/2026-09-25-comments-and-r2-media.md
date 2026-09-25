# Comments on our own Cloudflare stack, and hero images on R2 — implementation plan

**Status:** draft, awaiting Michel's go (2026-09-25). Nothing in this plan is approved yet; `PLAN.md` gets a row only when it is.
Owner: Michel (solo). Planner: Top tier. Phase ends in release **v0.3.0** (current `VERSION` 0.2.0).
Companion, private: the comments-system plan in the `atn-ops` repository (never copied here). This public document describes only the **interfaces** between the two repos; moderation rules, spam heuristics and tokens live in atn-ops.

## 1. Goal

1. **Replace Disqus with our own comments** on Cloudflare. Reason (Michel, 2026-09-25): free Disqus injects advertising trackers (Krux/LiveRamp user-matching pixels were observed in the comments frame) and loads `count.js` on every page. Ours: a small write-only Worker, comments stored in D1 (Cloudflare's SQL database), moderated before they appear, and **baked into the static post pages at build time** so readers, search engines and language models read them with zero server calls.
2. **Move hero images to R2** (Cloudflare's object storage), served from `media.aitamer.news`, so the repository stops growing by ~330 KB per post and the deploy stays under the free plan's 20,000-file cap (ADR 0005).
3. **Reader sign-in with Google and GitHub** (Michel's decision, 2026-09-25, option b): after anonymous moderated comments work end to end, readers may sign in through OAuth (open authorization: the provider vouches for the reader; we never see or store a password). Its own batch, in atn-ops.

## 2. Scope and the split between repositories

Michel's decision (2026-09-25): **the comments system lives in the private repo `atn-ops`**, not in this public repo.

| Piece | Repo | Why |
|---|---|---|
| Comments Worker at `https://comments.aitamer.news/` (accepts a comment; Turnstile, rate limits, honeypot, normalisation, fail closed), D1 schema and migrations, moderation (Michel now, bots/atn-mcp later), spam heuristics, trust score, PII handling, publisher, OAuth sign-in, deploy workflow, all tokens and secrets | **atn-ops** (private) | Rules and heuristics must not be readable by the people they stop; tokens never sit in a public repo |
| Comment **data files** under `src/content/comments/<slug>.json` (public data only), the strict schema that validates them, rendering approved comments as escaped static HTML, JSON-LD, the comment form markup, the `threads.json` endpoint, Campfire on our data, privacy and terms pages, Disqus removal | **aitamer-news** (public) | It is what the build needs, and nothing more |
| R2 bucket, custom domain, the 25-hero migration, `heroImage` handling in the build, docs | aitamer-news for the build and docs; the bucket-scoped upload token and the bots' upload path in atn-ops / atn-mcp | The site only ever holds public URLs |

**In:** everything in the table; ADRs 0006–0008; the Michel checklist; tests with failure paths for every layer.
**Out:** a newsletter; comment threading deeper than flat (see decisions); Cloudflare Image Transformations (optional note in §7.5, not in scope); pagination of Campfire/archives (BACKLOG); email magic links (Michel chose OAuth; magic links would need a transactional email provider because Cloudflare Email sends only to verified addresses); passwords, ever.

## 3. Facts checked on 2026-09-25 (where every number comes from)

- **Workers Free:** 100,000 requests/day **account-wide**, 10 ms CPU per request, 50 external subrequests per request, 5 Cron Triggers per account, static assets 20,000 files (`developers.cloudflare.com/workers/platform/limits/`). Requests to Pages static assets are free and unlimited (`pages/functions/pricing/`). Pages: 20,000 files per site on Free; 500 builds/month applies to Pages' own Git builds, and this site deploys by direct upload from GitHub Actions (`pages/platform/limits/`; the page does not state a cap for direct uploads).
- **The account today** (read-only listing through the Cloudflare MCP on 2026-09-25; confirm it is the same account as `48a3301b…` in the deploy workflows): **no D1 database exists; R2 is not enabled** ("Please enable R2 through the Cloudflare Dashboard"); the only Worker is an unrelated one — so **the contact Worker `aitamer-contact` has never been deployed**, and the third Worker shares the 100,000/day cap with ours.
- **Workers rate-limit binding:** generally available since 2025-09-19 (`changelog/post/2025-09-19-ratelimit-workers-ga/`). The note does not say "all plans"; the first Worker deploy on this free account is the real test (BACKLOG line 12 already says so; WAF rule as fallback).
- **D1 Free:** 5 million rows read/day, 100,000 rows written/day, 5 GB total; since 2026-09-01 queries **fail until midnight UTC** once a daily limit is hit, with an email alert (`workers/platform/pricing/`, `changelog/post/2026-09-01-d1-free-tier-limit-enforcement/`). A `SELECT` without an index counts every row scanned. API token scopes `D1 Read` / `D1 Edit` are account-level (`fundamentals/api/reference/permissions/`).
- **R2 Free:** 10 GB-month storage, 1 million Class A and 10 million Class B operations per month, free egress (`r2/pricing/`). `r2.dev` is "not intended for production", rate-limited to hundreds of requests/second with throttled bandwidth; a custom domain gets Cloudflare cache, WAF and analytics (`r2/platform/limits/`, `r2/buckets/public-buckets/`). Only certain file types are cached by default; JPEG is one of them.
- **WAF rate limiting rules, Free plan:** 1 rule, characteristic IP, 10-second period, action Block, 10-second duration (`waf/rate-limiting-rules/`, `use-cases/solutions/protect-sensitive-forms-fraud-abuse/`).
- **Image Transformations:** 5,000 unique transformations per month free; beyond that new transformations fail with error 9422, no charge (`images/pricing/`).
- **Workers AI:** 10,000 Neurons/day free on Workers Free (`workers-ai/platform/pricing/`). Per-model cost of a classification call was not verified; hence optional and off at launch (atn-ops plan).
- **Workers Logs:** 200,000 events/day, 3-day retention on Free (`workers/observability/logs/workers-logs/`).
- **Heroes today:** 25 JPEGs, 1600×900, 8.1 MiB by `du -sh public/heroes` → about 330 KB each on average; 10,000 posts ≈ 3.3 GB, inside the 10 GB free tier.
- **What the build does with `heroImage`** (read `src/pages/posts/[slug].astro`, `src/components/PostCard.astro`, `src/pages/index.astro`, `src/layouts/BaseLayout.astro`, `src/pages/feed.json.ts`): it writes the string into `<img src>` with constant `width`/`height`, into `og:image`/`twitter:image` (made absolute), JSON-LD `image`, and the JSON feed. It never opens the file: **the CI build needs no network access to images.**
- **Astro incremental build** (`node_modules/astro/dist/core/build/incremental.js`, Astro 7.3.5): a `getStaticPaths` page is reused only when its `cacheKey` and the render hashes of the content entries it used are unchanged. Astro's glob loader reads JSON files as data entries (`getEntryType(…, dataFileExts)` in `dist/content/utils.js`), so a comments file can be a content entry with its own `digest`.

## 4. Decisions (planner; Michel's are in §11 as open decisions)

- **D1 — Reads never touch a Worker.** Approved comments are static HTML; the only Worker traffic is a reader posting a comment, opening the comment form while signed in (batch C), or signing in. Page views cost zero Worker requests, so the shared 100,000/day cap is spent only on writes.
- **D2 — Bridge: atn-ops publishes approved comments into this repo as data files** `src/content/comments/<slug>.json` on a batched schedule, which triggers the normal deploy (Michel's recommended bridge; evaluated in ADR 0006 against two alternatives — the build reading D1 through the REST API with a token in this repo's secrets, and a JSON snapshot on R2). It holds: this repo keeps no D1 token and never talks to D1; the build works offline and locally shows exactly what production shows; comments are versioned and reviewable like posts; a bad file fails `npm run build` on the deploy and the old site stays up; the incremental build rebuilds only the posts whose file changed. The one real cost is §12 R1: published comments are also in the public git history. Files hold only what the page shows: id, display name, text, time, and whether the writer was signed in. Never an email, IP, hash or moderation note.
- **D3 — Pre-moderation at launch.** Nothing appears until approved and published; the trust score that can auto-approve later is atn-ops' rule. The Campfire is a news site's comment section read by crawlers and language models; a spam comment baked into HTML is worse than a delayed good one.
- **D4 — Flat threads.** No replies in v1. The data file format and the D1 schema reserve nothing for it either: adding a nullable `parent` later is an additive change to both (ADR 0004's rule: contracts only grow).
- **D5 — Plain text only.** Comments never pass through the Markdown pipeline (post bodies allow raw HTML by design, `SECURITY.md`; comments must not). The site validates every data file with a strict zod schema (defence in depth if atn-ops misbehaves), renders text escaped with paragraphs only, linkifies only `http(s)://` URLs with `rel="nofollow ugc noopener noreferrer"`, and puts comments into JSON-LD only through `toJsonLd`.
- **D6 — Comment counts on the post page and the Campfire only, not on cards.** A count on a card would put every post's comment state into the `cacheKey` of every habitat, author and archive page, and each approval would rebuild them all.
- **D7 — Per-post closing is a frontmatter field, `comments: { closed: true }`**, additive to contract v1 (see §11 Q4 for the name). Withdrawn posts are closed. The build publishes `/comments/threads.json` (one file) so the Worker can refuse unknown or closed slugs without reading the repo.
- **D8 — Turnstile is mandatory for comments** (the contact form keeps it optional). The Worker fails closed without it. Consequence: a reader without JavaScript cannot comment (Turnstile needs it); the no-script path says so instead of failing silently.
- **D9 — `heroImage` holds the full URL** `https://media.aitamer.news/heroes/<slug>.jpg`. The contract already accepts it (no change); the page serves exactly the string a bot wrote; every consumer (og:image, JSON-LD, feed) works today. A host move is a one-time mechanical rewrite of frontmatter — the same operation this migration does once — and a resolver key would have given `/heroes/<slug>.jpg` a second meaning, which POST.md forbids. Local overrides go through one build-time variable, `PUBLIC_MEDIA_BASE` (§7.3).
- **D10 — Identity is behind one interface, and sign-in state is checked only when the reader opens the form.** The D1 `comments` row carries a nullable `author_id`; the site's page never calls the Worker on view. Batch C adds providers without touching batch A's tables beyond adding `users`.
- **D12 — The key that can push to this repo never sits in an internet-facing Worker** (coordinator's amendment to the draft, 2026-09-25). The publisher runs as its own Worker with a cron trigger and **no route**, so nothing on the internet can reach it; only it holds the GitHub token. The comments Worker that readers post to holds no GitHub token at all. And this repo defends itself: the deploy workflow fails any push by the publisher's identity whose diff touches a path outside `src/content/comments/`. A flaw in the public-facing Worker can then at worst write to D1, never publish code to the site.
- **D11 — Anonymous commenting stays after accounts exist**, still moderated; signed-in commenters feed the trust score. Recommended, not assumed: §11 Q8.

## 5. Interfaces between the two repositories (the public contract)

### 5.1 Comment data file, format v1 — `src/content/comments/<slug>.json`

```json
{
  "version": 1,
  "slug": "grok-4-7",
  "generatedAt": "2026-09-25T12:37:00Z",
  "comments": [
    { "id": "01K63M4Q3ZJ8W3Y8N5V2R7T9AB", "name": "Ada", "text": "First paragraph.\n\nSecond paragraph with https://example.com/a-link.", "at": "2026-09-25T10:00:00Z", "signedIn": true }
  ]
}
```

Rules, enforced by `src/content/comment-schema.ts` (strict at every level, like the post contract): `version` = 1; `slug` matches `^[a-z0-9][a-z0-9-]*$` and equals the file name; `id` is a ULID (`^[0-9A-HJKMNP-TV-Z]{26}$`), unique in the file; `name` 1–60 characters, one line, no control characters; `text` 1–2,000 characters, only `\n` as control character, no `<` followed by a letter or `/` (HTML is not plain text; atn-ops strips it, the site refuses it); `at` an ISO-8601 UTC time; `signedIn` optional boolean; comments sorted oldest first. A file whose slug has no post fails `npm run check:posts` naming the file. A slug with zero approved comments has **no file** (the publisher deletes it). Published as JSON Schema at `/contract/comments.schema.json` (+ `/contract/v1/`) so atn-ops validates before it commits.

### 5.2 The Worker at `https://comments.aitamer.news/`

- `POST /` — the comment form. Multipart or URL-encoded body. Fields: `slug`, `name`, `text`, `desk_extra` (honeypot, must stay empty), `cf-turnstile-response`, `t` (page-load time in epoch milliseconds, written by the page script), `csrf` (only when signed in, from `/me`). Optional `email` only if §11 Q2 says so. Answers: with `Accept: application/json` → `{ "ok": true, "held": true }` (200) or `{ "ok": false, "error": "…" }` (400/403/404/410/413/429/503); otherwise a `303` to `https://aitamer.news/posts/<slug>/?commented=1#comments` on success, or a plain HTML error page. The Worker validates `slug` shape before it ever builds that redirect.
- `GET /me` (batch C) — `{ "signedIn": false }` or `{ "signedIn": true, "name": "Ada", "csrf": "…" }`, `Cache-Control: no-store`, credentials required. Called by the page script only when the reader opens the form.
- `GET /auth/google/start`, `GET /auth/github/start` (`?return=/posts/<slug>/`), `GET /auth/<provider>/callback`, `POST /auth/signout`, `GET /account` (a small HTML page: export, delete), `GET /account/export.json`, `POST /account/delete` — batch C.
- Everything else 404. `workers.dev` and preview URLs off, like the contact Worker.
- Cross-origin: the form's `fetch` is a "simple" request (form body, `Accept` header only), so no preflight; `/me` and `/account` use `credentials: 'include'` with an exact-origin `Access-Control-Allow-Origin` and `Access-Control-Allow-Credentials: true`. `aitamer.news` and `comments.aitamer.news` are the same *site*, so a `SameSite=Lax` cookie on the comments origin rides along on the form's POST.

### 5.3 `GET https://aitamer.news/comments/threads.json`

`{ "version": 1, "generatedAt": "…", "threads": { "<slug>": "open" | "closed" } }` — every live post; withdrawn or `comments.closed` posts are `closed`. Regenerated on every build (one Astro endpoint, one deploy file). The Worker fetches it with a five-minute edge cache; if it cannot, it refuses comments (fails closed).

### 5.4 Sign-in, as the page sees it (batch C)

The form shows "Sign in with Google" / "Sign in with GitHub" links to the `start` routes. On opening the form the page script calls `/me`; when signed in it fills the name, hides the name field, adds the `csrf` field, and shows "Signed in as Ada · sign out · your account". The session is an `HttpOnly; Secure; SameSite=Lax` cookie with the `__Host-` prefix on `comments.aitamer.news`; the site itself sets no cookie. Providers share with us only an opaque subject id and a verified email (Google scopes `openid email`; GitHub `user:email`); the reader chooses the display name.

### 5.5 Media

Bucket `aitamer-media`, key layout `heroes/<slug>.jpg`, served at `https://media.aitamer.news/heroes/<slug>.jpg`, `Content-Type: image/jpeg`, `Cache-Control: public, max-age=86400`. Humans upload with `wrangler r2 object put` under their own login; bots use a bucket-scoped token that lives only in atn-ops / atn-mcp.

## 6. Comments — the site side, in detail

### 6.1 Sanitisation and anti-spam layers (who does what)

| Layer | Where | What (public part) |
|---|---|---|
| 1. Before anything is trusted | atn-ops Worker | Method and Origin allowlist; content type and body size cap before reading; Turnstile (single-use tokens: a replayed token is rejected by Cloudflare's `siteverify`); honeypot; minimum time on page from `t`; per-IP, per-post and site-wide rate limits (Workers binding, WAF rule as the outer wall); thread open per `threads.json`; **fails closed** when any binding or secret is missing |
| 2. Normalisation | atn-ops Worker | Unicode NFC; control characters, bidirectional overrides and zero-width characters stripped; length caps; HTML refused; links counted (rules in atn-ops) |
| 3. Decision | atn-ops | Pre-moderation at launch; trust score later; optional Workers AI classification only after its cost is verified |
| 4. Output | this repo | Strict schema on every data file; escaped rendering with paragraphs only; `http(s)` links only, `rel="nofollow ugc noopener noreferrer"`; a second strip of bidi/zero-width characters at render (defence in depth); JSON-LD only through `toJsonLd`; never the Markdown pipeline |
| 5. PII | atn-ops (+ privacy page here) | IP kept only as a salted, truncated hash with short retention; email optional and never published; a documented deletion path |

### 6.2 Rendering (`src/components/Comments.astro`, `src/lib/comment-text.ts`)

`renderCommentHtml(text)`: split on blank lines into `<p>`, single newlines to `<br>`, escape `& < > " '`, then linkify `https?://` tokens (bounded pattern, trailing punctuation left outside the link, visible text truncated at 80 characters, `target="_blank"`); strip U+202A–U+202E, U+2066–U+2069, U+200B, U+FEFF (keep U+200C/U+200D: joiners real scripts and emoji need). Each comment is `<article id="c-<id>">` with the name, a `<time>`, and a "signed in" mark when `signedIn`. Count and anchor `#comments`. Withdrawn posts render no comments and no form.

### 6.3 The form

Same progressive-enhancement pattern as the About page: a plain `<form method="post" action={COMMENTS_ENDPOINT}>` works without script (303 back to the post), and the script turns it into a `fetch` with "Held for the desk. It appears after a look." Fields per §5.2. `t` is set by the script at load. Turnstile widget with the existing `TURNSTILE_SITE_KEY`; the `api.js` script tag on post pages only. `?commented=1` shows the held message and is dropped from the URL, like `?sent=1`. `PUBLIC_COMMENTS_ENDPOINT` overrides the origin for local work, like `PUBLIC_CONTACT_ENDPOINT`.

### 6.4 Incremental builds

`getStaticPaths` in `[slug].astro` loads the `comments` collection once, maps it by id, and adds `entryStamp(thread)` (or `no-comments`) to each post's `cacheKey`. A publisher commit that touches `grok-4-7.json` rebuilds `/posts/grok-4-7/` and the always-rebuilt pages (home, Campfire, feeds), nothing else.

### 6.5 JSON-LD

`NewsArticle.commentCount` = approved count; `comment` = up to the 50 newest as `{ "@type": "Comment", "text", "dateCreated", "author": { "@type": "Person", "name" } }`, through `toJsonLd`. Withdrawn posts publish none (unchanged).

### 6.6 Campfire, privacy, terms, Disqus

Campfire lists every story with its baked count (newest story first, the pagination note stays in BACKLOG) and "Around the fire": the 30 newest comments site-wide with their story. Privacy page: what a comment sends and stores, that published comments are public and kept in the site's public source history, how to ask for removal (contact form, quoting the comment id shown next to its time), the Turnstile check, the cookie on `comments.aitamer.news` after sign-in (batch C), the account export and deletion page; Disqus paragraphs removed. Terms: "hosted by Disqus" replaced. `count.js` and `DISQUS_SHORTNAME` removed from `BaseLayout.astro` and `site.ts`; `CommentCount.astro` becomes a build-time count; `SECURITY.md` names the comments Worker (report through the same channels; it is ours, not a vendor's).

### 6.7 What happens to existing Disqus comments

Michel exports the thread XML from the Disqus admin (checklist item 12) and reports the count. If there are any, atn-ops' one-time import writes them as approved rows (source `disqus`, author name only) and the publisher bakes them; if none, nothing to do. Either way the Disqus site is disabled after go-live.

## 7. R2 media — the design

### 7.1 Michel's question: "when we run the website locally for checks, will it load images from R2 as well?"

**Yes, by default.** After migration `heroImage` is a full `https://media.aitamer.news/…` URL, so `npm run dev` and `npm run preview` show the same bytes production serves, fetched over the network by the browser (not by the build). Offline, or for an unpublished draft whose hero is not uploaded yet, set `PUBLIC_MEDIA_BASE=/media-local` and drop files under the git-ignored `public/media-local/heroes/`: the build rewrites the media origin to that base. A hero that is missing on R2 shows as a broken image locally and would in production too; it never fails the build. The section SVG cover applies only when `heroImage` is absent, not when it is unreachable. **CI never fetches an image** (§3).

### 7.2 Why a custom domain, and what it costs

`r2.dev` is rate-limited and for development; `media.aitamer.news` gets the CDN cache, so R2 Class B reads happen only on cache misses. At today's traffic this is far inside 10 million/month; the number to watch is storage, ~330 KB per post.

### 7.3 Code changes

`src/lib/media.ts` (pure, tested): `MEDIA_ORIGIN = 'https://media.aitamer.news'`, `heroUrl(slug)`, `resolveMedia(value)` applying `PUBLIC_MEDIA_BASE`. Used by `[slug].astro`, `PostCard.astro`, `index.astro`, `authors/[id].astro`, `BaseLayout.astro` (the default social image becomes the welcome hero's media URL), `feed.json.ts`. `scripts/stamp-post-times.mjs --check` (part of `check:posts`) gains a rule: a published post's `heroImage` is `https://media.aitamer.news/heroes/<slug>.jpg` or, during the transition, `/heroes/<slug>.jpg` with the file present — any other value fails naming the file (§11 Q5). `scripts/check-media.mjs` (`npm run check:media`, network, never in the deploy): HEAD every hero URL, compare `Content-Length` and the ETag with the local MD5 for the migration, then report missing heroes on demand.

### 7.4 Migration of the 25 heroes (reversible through git until the last step)

1. Upload all 25 with `wrangler r2 object put aitamer-media/heroes/<slug>.jpg --file public/heroes/<slug>.jpg --content-type image/jpeg --cache-control "public, max-age=86400"` (a loop; Michel or the coordinator under `wrangler login`).
2. `npm run check:media` against `public/heroes/`: 25 hits, sizes and ETags match.
3. `scripts/rewrite-hero-urls.mjs` rewrites the 25 `heroImage` lines textually (the `frontmatter.mjs` edit pattern, re-parsed and compared before writing).
4. Build, `check:dist`, `check:files`; walk a post page and the home page.
5. Remove `public/heroes/` (tracked files: `git rm`, recoverable from history), `scripts/decode-heroes.mjs` and its two `package.json` steps (BACKLOG line 26), POST.md §3's base64 paragraph.
6. Update ADR 0005's table (files per post ≈ 2 now; thresholds unchanged), `check-dist-files.mjs` comments, README template, `.env.example`, CONTRIBUTING.

### 7.5 Optional, not in scope: Image Transformations

Free for 5,000 unique transformations a month. With three responsive sizes, 25 posts use 75, but 10,000 posts could use 30,000 in a month if all were viewed; over the allowance new sizes fail (9422) and would need `onerror=redirect` to the original. Small and free today, not at the site's target scale; revisit if page weight becomes a measured problem.

## 8. Tasks

Each task: one commit, `VERSION` patch bump, `checkpoint/<VERSION>` tag, CHANGELOG entry, close-out note. New test files join the `npm test` globs. Tiers: Top for security, data and public-contract tasks; Strong for rendering and integration; Standard for scripts and migration; Fast for pure documentation. **[deep]** = deep review at task grain (security, data or public API). Every batch ends in a deep review on the Strong tier. Tasks marked **atn-ops** are specified in the companion plan; here they appear for sequencing only.

### Batch A — comments on the site (aitamer-news) and the Worker (atn-ops), in parallel

- **A0 — Plan, ADR 0006, `PLAN.md` row.** Fast. Files: `docs/plans/2026-09-25-comments-and-r2-media.md`, `docs/adr/0006-comments-are-baked-static-from-published-data-files.md`, `docs/adr/README.md`, `PLAN.md`, `PROGRESS.md`. Acceptance: ADR states the three alternatives and the git-history consequence. Risk: none. Deps: Michel's go.
- **A1 — Comment data contract [deep, public API].** Top. Files: `src/content/comment-schema.ts`, `src/content.config.ts` (collection `comments`, glob over `src/content/comments/*.json`), `src/pages/contract/comments.schema.json.ts` + `v1/`, `src/lib/comment-contract.test.ts`, `src/content/comments/README.md` (the format, "written by the desk's publisher; edit by hand only to remove"), `scripts/stamp-post-times.mjs` (`check:posts` rule: orphan file fails), `POST.md` (a short section 8 "Comments"). Tests, happy: a valid file parses, ids unique, order enforced. Failure: unknown key, `<script>` in text, `<a href` in text, name with a newline, bidi override, 2,001 characters, non-ULID id, duplicate id, file for a missing slug. Acceptance: `/contract/comments.schema.json` served with `additionalProperties: false` everywhere; `npm run build` fails naming a bad file. Deps: A0.
- **A2 — Rendering, incremental keys, JSON-LD [deep].** Strong (Top review). Files: `src/lib/comment-text.ts` + test, `src/components/Comments.astro`, `src/components/CommentCount.astro`, `src/pages/posts/[slug].astro` (cacheKey, JSON-LD), `src/styles/global.css`. Tests: paragraphs and `<br>`; escaping of `& < > " '`; `javascript:` and `data:` never linked; 10 links all carry `rel="nofollow ugc noopener noreferrer"`; trailing `).` stays outside the link; bidi/zero-width stripped; `toJsonLd` escapes `</script>` in a comment; 51 comments → JSON-LD carries 50, `commentCount` 51. Acceptance: with a fixture file in a worktree, `dist/posts/<slug>/index.html` contains the comment escaped and `#c-<id>`; a second build with the file unchanged reuses the page; changing the file rebuilds only that post (Astro's incremental log). Fixture is not committed. Deps: A1. Parallel with A3.
- **A3 — Comment form and `threads.json` [deep, security].** Top. Files: `src/components/CommentForm.astro` (or inside `Comments.astro`), `src/lib/site.ts` (`COMMENTS_ENDPOINT`, `PUBLIC_COMMENTS_ENDPOINT`), `src/content/post-schema.ts` (`comments: { closed: true }` additive + JSON Schema, test), `src/lib/post-contract.test.ts`, `src/pages/comments/threads.json.ts` + pure helper and test, `.env.example`, `POST.md` (the field), `.github/workflows/deploy-pages.yml` (the D12 guard: a publisher push touching anything outside `src/content/comments/` fails, with a test of the path filter). Tests: threads map marks withdrawn and closed posts closed and drafts absent; contract accepts `comments: { closed: true }` and rejects `comments: { closed: 'yes' }` and an unknown key. Acceptance: no-script submit reaches the Worker's 303; script path shows the held message; `check:dist` green; `dist/comments/threads.json` valid; Turnstile widget present only on post pages. Deps: A1; ships behind the Worker (W3) being live, else the form answers "not set up yet".
- **A4 — Disqus out; Campfire, privacy, terms, docs.** Standard (copy reviewed by Michel). Files: `src/layouts/BaseLayout.astro`, `src/lib/site.ts`, `src/pages/campfire.astro`, `src/pages/privacy.astro`, `src/pages/terms.astro`, `src/pages/about.astro` (one sentence), `SECURITY.md`, `ARCHITECTURE.md`, `README.md`, `docs/bestiary.md`, `BACKLOG.md`. Tests: none new (build checks). Acceptance: `grep -ri disqus dist/` is empty; privacy page says what §6.6 lists; Campfire shows counts from data. Deps: A2. Parallel with A3.
- **W1–W5 (atn-ops):** D1 database and migrations; Worker handler with all layer-1 checks; normalisation and validation; moderation notification and CLI; deploy workflow. **P1 (atn-ops):** the publisher that writes `src/content/comments/*.json` into this repo. See the companion plan.

**Batch A boundary → deep review (both repos, Strong tier, security findings escalated to Top). Milestone M1:** one real comment posted from the live site, held, approved by Michel with the CLI, published by the publisher, live in the post's HTML and JSON-LD, and `grep -ri disqus dist/` empty. `npm run check:files` reports the count.

### Batch B — hero images on R2

- **B0 — Michel's dashboard steps** (checklist §10, items 6–8). Blocking for B2.
- **B1 — `src/lib/media.ts` and consumers.** Strong. Files: `src/lib/media.ts` + test, the six consumers in §7.3, `.env.example`, `README.md` (local-dev paragraph). Tests: `resolveMedia` leaves non-media URLs alone, applies `PUBLIC_MEDIA_BASE` to media URLs only, no double slash; a `/heroes/` value still resolves during the transition. Acceptance: build unchanged in output for today's 25 posts (diff `dist/` before/after: only whitespace). Deps: none (can start before B0). Parallel with A-tasks.
- **B2 — Migration [deep, data].** Standard execution, Top review. Files: `scripts/check-media.mjs` + test (pure parts: ETag/MD5 compare, report shape), `scripts/rewrite-hero-urls.mjs` + test (textual rewrite, re-parse guard, idempotent), the 25 posts, `public/heroes/` removed, `scripts/decode-heroes.mjs` removed, `package.json`, `stamp-post-times.mjs --check` rule + test. Tests: rewrite refuses a post whose slug does not match the file name; check rule rejects `https://elsewhere.example/x.jpg` for a published post and accepts the media URL; refuses `/heroes/<slug>.jpg` once the file is gone. Acceptance: 25/25 HEAD hits with matching sizes and ETags before the rewrite; a post page, a card and `og:image` load from `media.aitamer.news` in a browser; `check:files` drops by 25. Deps: B0, B1. Not parallel with anything touching posts.
- **B3 — Docs and ADR 0007.** Fast. Files: `docs/adr/0007-hero-images-live-on-r2.md`, `docs/adr/0005-…` (table), `POST.md` §3 and §7, `docs/posting-standards.md` (one line pointing at POST.md), `ARCHITECTURE.md`, `CONTRIBUTING.md`, `BACKLOG.md` (lines 24 and 26 closed). Deps: B2.

**Batch B boundary → deep review. Milestone M2:** all heroes from R2; repo holds no JPEG under `public/heroes/`; `npm run check:media` green; a fresh `npm run dev` on a machine without the images renders the site. This is a shippable point (see §11 Q9 on the release cut).

### Batch C — reader sign-in with Google and GitHub (atn-ops, plus small site pieces)

Security class: **deep review at task grain, Top tier for every auth task.** Sequenced after M1: anonymous moderated comments must already work end to end.

- **C1–C5 (atn-ops):** identity interface and `users` table; OAuth Authorization Code flow with PKCE (Proof Key for Code Exchange) and `state` for Google and GitHub; sessions and CSRF (cross-site request forgery) protection; account page, export and deletion; trust-score hook. Companion plan.
- **C6 — Site: sign-in in the form, `/me` on open [deep].** Top. Files: `Comments.astro`/`CommentForm.astro`, `src/lib/site.ts` (`COMMENTS_SIGNIN` on/off constant), privacy page. Tests: none unit-testable beyond the helper that builds `start` URLs with a safe `return` (test: rejects a `return` outside `/posts/<slug>/`). Acceptance: form open triggers exactly one `/me` request (network panel), page view triggers none; signed-in state shows the name and hides the field; sign-out works; CSP-free page still works with script off (anonymous path). Deps: C3.
- **C7 — Privacy and terms for accounts; ADR 0008.** Fast. Files: `privacy.astro`, `terms.astro`, `docs/adr/0008-reader-identity-is-oauth-on-the-comments-origin.md` (interface-level; internals in atn-ops' own ADR). Acceptance: the page says what Google and GitHub share, the cookie, export and deletion. Deps: C6.

**Batch C boundary → deep review. Milestone M3 = release v0.3.0** after the high deep, dual-blind release review: `npm audit`, docs, `VERSION`, tag, `gh release`.

### Parallelism

Host disk is 94% full (61 GB free at planning time): at most **two worktrees** beside `main`. Suggested lanes: lane 1 (Top) A1 → A3; lane 2 (Strong) A2 → A4; the coordinator on `main` merges and does B1 meanwhile; atn-ops work runs in its own repo. B2 runs alone. Batch C: lane 1 atn-ops C1–C5, lane 2 site C6–C7 after C3.

## 9. ADRs to write, at decision time

- **0006 — Comments are baked static from data files published by the desk** (this repo): the bridge, the two alternatives, the git-history consequence, the zero-Worker-reads rule. Written at A0.
- **0007 — Hero images live on R2 behind `media.aitamer.news`**: full URLs in frontmatter, local override, the `check:posts` rule, the r2.dev exclusion. Written at B3.
- **0008 — Reader identity is OAuth on the comments origin, never passwords** (interface level). Written at C7.
- atn-ops writes its own ADRs for the Worker's check order and the identity internals (companion plan).

## 10. What Michel must do by hand (numbered; each is outward-facing or irreversible)

1. **Confirm the account.** The Cloudflare MCP listing (§3) shows no D1, R2 disabled and no `aitamer-contact` Worker. If that is account `48a3301b…`, the contact Worker's first deploy is still owed (README "Contact form" steps 1–3) and it doubles as the test of the rate-limit binding on the free plan.
2. **Turnstile:** create a widget for `aitamer.news` (both forms use it), put the site key in `TURNSTILE_SITE_KEY` (`src/lib/site.ts`) and the secret on both Workers. Comments will not accept anything without it (D8).
3. **Email Routing** destination verified (needed by the contact Worker already; the comments Worker mails "a comment is waiting" to the same address).
4. **D1:** create database `aitamer-comments` (dashboard or `wrangler d1 create`), then apply the first migration from atn-ops. Keep Time Travel's default backups on.
5. **CI token for atn-ops** (`CLOUDFLARE_API_TOKEN` there): Workers Scripts Edit, Workers custom domains on `aitamer.news`, and D1 Edit only if CI applies migrations (companion plan says whether).
6. **Enable R2** in the dashboard (the API refuses until then; whether the dashboard asks for a payment method on file was not verified in the docs — if it does, the free tier still applies).
7. **Bucket `aitamer-media`**, then Settings → Custom Domains → add `media.aitamer.news` (Cloudflare adds the DNS record). Leave the r2.dev public development URL **disabled**.
8. **R2 API token**, scoped to bucket `aitamer-media`, Object Read & Write, for atn-ops / atn-mcp uploads. Store it only there.
9. **GitHub fine-grained personal access token** (PAT) for the publisher: repository `aitamer-news` only, permission Contents: Read and write, with an expiry you will remember to renew. It acts as you, so the "only the owner can push" ruleset still holds; the publisher's commits will carry the author name atn-ops sets. Store it only in atn-ops.
10. **WAF rate-limiting rule** (the one the free plan allows) on the zone: expression `http.host eq "comments.aitamer.news" and http.request.method eq "POST"`, IP, 10 requests per 10 seconds, Block for 10 seconds. It stops a flood before it is counted against the 100,000/day Workers cap. (The contact Worker cannot share it: one rule per zone on Free.)
11. **Go-live order:** Worker deployed and answering 503 "not set up" → secrets set → A3 merged → post one comment yourself → approve with the CLI → wait for the publisher → confirm it is live → then disable the Disqus site.
12. **Disqus:** admin → Export → wait for the email with the XML; tell the coordinator the comment count; keep the file in atn-ops, not here. After go-live, remove the site from Disqus.
13. **Google OAuth (batch C):** Google Cloud project → OAuth consent screen (External; app name AI Tamer; homepage and privacy URLs; authorised domain `aitamer.news`; publish it, otherwise Google caps testers at 100 and shows "unverified app"; scopes `openid email` need no verification) → Credentials → OAuth client, Web application, redirect URI `https://comments.aitamer.news/auth/google/callback`. Client id and secret go to atn-ops secrets.
14. **GitHub OAuth App (batch C):** Settings → Developer settings → OAuth Apps → New: homepage `https://aitamer.news`, callback `https://comments.aitamer.news/auth/github/callback`; generate a client secret; both to atn-ops secrets.
15. **Review the privacy and terms copy** before A4 and C7 merge; they are statements to readers.

## 11. Open decisions for Michel (only those that change what gets built)

**Q1 — The bridge: data files in this public repo (recommended), or a JSON snapshot on R2, or the build reading D1 with a token in this repo's secrets?** Data files give versioned, reviewable, offline-buildable comments with exact incremental rebuilds and no token here; the cost is that a comment, once published, stays in the public git history even after removal from the site (rulesets forbid rewriting `main`). An R2 snapshot avoids that history but makes every build depend on a network fetch, loses versioning and review, and still needs a deploy trigger. The D1 token option puts an account-wide `D1 Read` secret in a public repo's CI and adds rows read to every build. Recommendation: data files, with the privacy page saying plainly that published comments are public and archived.

**Q2 — Optional email on anonymous comments?** Recommendation: **no email field at launch.** Less PII to protect and to explain; an email would only serve "verified returning commenter", which batch C's accounts do better. Add later if wanted (additive form field and column). Pro of asking: a reply channel; con: a mailbox to protect, a field spammers love.

**Q3 — Threading: flat (recommended) or one-level replies?** Flat renders as a log, keeps moderation simple and the file format tiny. One level costs a `parent` id in the file, the schema and the D1 table, and reply rendering; it can be added later without breaking either contract.

**Q4 — Per-post closing:** field name `comments: { closed: true }` (recommended: an object, so a `reason` or `closesAt` can be added additively) versus a bare `commentsClosed: true`. And: no automatic closing by age (recommended for a news archive), or close threads N days after publication?

**Q5 — Should `check:posts` require the media host for published posts?** Recommended yes: a published post's hero must be `https://media.aitamer.news/heroes/<slug>.jpg`. Contract v1 itself stays as is (any `https://` is still valid there); this is the publish-state gate, like "no sources outside Opinion". Con: a future second media host needs the rule updated first.

**Q6 — Existing Disqus comments: import them (recommended if there are any and they are few) or archive the XML privately and start clean?** Import keeps readers' words; archive is zero work. Needs the export count first (checklist 12).

**Q7 — Comment counts on cards?** Recommended no (D6). If yes, every listing page rebuilds on every approval batch; acceptable at 25 posts, wasteful at thousands.

**Q8 — Once accounts exist, does anonymous commenting stay?** Recommended: yes, still moderated; signed-in readers get a "signed in" mark and feed the trust score, so their comments can auto-approve first. The alternative — sign-in required — halves spam but turns readers away and makes the Campfire depend on two outside providers.

**Q9 — Release cut:** v0.3.0 after batch C (as briefed), or v0.3.0 at M2 (comments and R2) and v0.4.0 for accounts? Recommended: cut at M2 if batch C is not finished within the same working session; readers get the tracker-free Campfire sooner and the auth batch gets its own release review.

## 12. Honest risks

- **R1 — Public git history.** Removing a comment removes it from the site, not from the repository's history. Mitigation: only displayed data is ever written; the privacy page says so; a takedown that truly must vanish everywhere is a GitHub support request, which we should not promise.
- **R2 — Denial of wallet.** One flood can spend the account-wide 100,000 requests/day, taking the contact form and the account's other Worker down with it (Error 1027). Mitigations: the WAF rule (item 10), the Worker's rate limits, the pending-queue cap in atn-ops, and Workers Paid at $5 if it ever happens twice.
- **R3 — Rate-limit binding on the free plan** is unconfirmed until the first deploy (BACKLOG line 12). Fallback is the same WAF rule, at weaker granularity (10-second windows only).
- **R4 — D1 daily caps fail hard** since 2026-09-01. Indexes on every filtered column; the publisher reads only unpublished rows; a pending cap bounds writes. If the cap trips, comments pause until midnight UTC and the site is unaffected (reads are static).
- **R5 — Publisher push races** with a human push to `main`; the publisher retries with a fresh parent (Git Data API `sha` precondition). A publisher commit that fails the deploy leaves the previous site up; Michel gets the failed-run mail.
- **R6 — JavaScript required to comment** (Turnstile, time-on-page). Stated on the form's no-script fallback and on the privacy page.
- **R7 — OAuth dependencies:** Google's consent-screen publication, GitHub's email privacy setting (`/user/emails` still returns verified addresses with the `user:email` scope), and PKCE support on GitHub OAuth Apps must be confirmed at implementation time (fallback: `state` plus the client secret, which the flow uses anyway). Provider outages only affect sign-in; anonymous commenting keeps working (Q8).
- **R8 — Deploy frequency** rises to hourly when comments flow; each is a direct upload from Actions (public repo minutes are free; Pages' 500/month limit is documented for Git builds, not direct uploads). If a cap surfaces, the publisher batches less often.
- **R9 — Moderation load** sits on Michel until atn-mcp takes it; the CLI and the mail keep it to a minute a day at today's traffic. The pending cap protects the mailbox from a flood.
- **R10 — Disk:** two worktrees maximum; a third risks a full disk mid-build.
- **R11 — The 60-day pause of scheduled workflows in a quiet public repo** (BACKLOG line 30) does not affect the publisher if it runs as a Worker cron (atn-ops decision); it would if it ran as an atn-ops Actions schedule.

## 13. Status

| Task | Status |
|---|---|
| all | not started; awaiting Michel's go and the answers to §11 |
