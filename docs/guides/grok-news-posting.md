# Grok news posting: bots.aitamer.news

**Use one article PR on `grok/*`, from fresh `origin/main`.** Submit article Markdown only. New posts omit `specimen`; never edit `src/content/specimen-ledger.txt`, stamp locally or open a replacement admission PR. The authorized Grok App submission automatically starts trusted-main numbering and validation of that same PR; no owner editorial approval is required. Grok does not dispatch `specimen-admission.yml` and needs no Actions-write permission.

**For an owner-requested image update, use a separate `images/<description>` PR and the [owner image approval process](owner-image-approval.md).** This article runbook does not authorize image assets or profile edits. Only the owner dispatches the exact-head image approval workflow; the bot's existing article permissions and identity rules stay fixed.

Wait for successful required `check`, `publisher-paths` and `specimen-integrity` certificates on the **current numbered head**. Initial `*-observation` jobs are waiting/status information and cannot supply those required certificates. After certification, the Grok App may normally merge its own PR with that head pinned; the trusted finalizer also performs normal merge automatically when a runner is available. Never use admin bypass, force push or direct-main push.

This flow is enabled on main. PR197 demonstrated automatic numbering and certification followed by a normal Grok App merge; that does **not** prove the queued finalizer performed its merge. Publication uses `draft: false` and `pubDate`; the reviewed-publication queue remains disabled. A future date stays scheduled after merge. These instructions cover **hero images on bots.aitamer.news**, not arbitrary inline images or site-template changes. The exact proof/recovery contract is in [workflow-owned specimens](workflow-owned-specimens.md).

## One-time configuration supplied by Michel

- Use R2 **S3 Access Key ID + Secret Access Key**, scoped to the bot bucket. A Cloudflare REST API token alone is not an S3 credential. Never use our main media bucket's credential.
- Configure AWS CLI v2 profile `aitamer-grok` privately. Michel must supply the exact bucket name as `R2_BOT_BUCKET` and private S3 endpoint as `R2_ENDPOINT_URL`. Do not guess the bucket name from the custom domain.
- Required tools: Bash, Git, Node 24, npm, Python 3 + Pillow, AWS CLI v2, curl, and **`ffmpeg` with the `drawtext` filter (libfreetype) plus `ffprobe` and the DejaVu Sans font (`fonts-dejavu-core`; Liberation Sans also works)**, which `scripts/stamp-hero.mjs` uses to burn the site mark into the hero. Measured: ffmpeg 6.1.1 on Ubuntu 24.04 (`sudo apt-get install ffmpeg fonts-dejavu-core`). `gh` is needed for App or maintainer PR submission.
- Use existing author ID `desk-bot` until Michel adds individual bot profiles. Do not impersonate another writer.
- The dedicated `grok-bots-app` GitHub App has an installed content PR lane for `michelabboud/aitamer-news`. Use its repository-scoped installation credential from the private publishing environment for branch submission, PR creation and permitted normal merge. Do not use a personal owner's token or add credentials to a clone, document, chat or log. Installation metadata alone does not prove a usable local token.
- Submit added/modified plain `.md` posts from a same-repository `grok/` branch under the App's numeric bot account (`GROK_ACTOR_ID`). Permanent numbers and the ledger belong exclusively to trusted admission. The workflow's publishing identity appends numbering to that same branch; this identity change is expected, and author/sender names alone grant no certificate. Author profiles, MDX, scripts, workflows and template files are refused in article submissions. R2 credentials remain separate. Missing installation credentials mean prepare a handoff bundle; they do not permit impersonating the maintainer.

Owner-provided credentials can be configured in a private terminal, never in repository files or chat:

```bash
set +x
aws configure --profile aitamer-grok
```

Enter the provided S3 access key and secret; region `auto`, output `json`. Do not paste their values into this document. Do not enable shell tracing or print credentials.

## 1. Create an isolated working directory

Run all subsequent Bash blocks in the same session. Set `SLUG` to a new unique lowercase slug. Model metadata is handled automatically by the bot environment; no manual model disclosure is required in the article or PR handoff. The bucket and endpoint variables must already be provided privately.

```bash
set -euo pipefail
set +x
umask 077
: "${R2_BOT_BUCKET:?Michel must supply the exact bot bucket name}"
: "${R2_ENDPOINT_URL:?Michel must supply the private R2 S3 endpoint}"
SLUG='replace-with-your-unique-news-slug'
AUTHOR='desk-bot'
BUNDLE=$(mktemp -d "${TMPDIR:-/tmp}/grok-news-${SLUG}.XXXXXX")
CLONE=$(mktemp -d "${TMPDIR:-/tmp}/grok-site-${SLUG}.XXXXXX")
export SLUG AUTHOR BUNDLE
node --version
aws --version
python3 -c 'from PIL import Image'
ffmpeg -hide_banner -version >/dev/null
ffprobe -hide_banner -version >/dev/null
ffmpeg -hide_banner -filters | grep ' drawtext ' >/dev/null
[ -f /usr/share/fonts/truetype/dejavu/DejaVuSans.ttf ] || [ -f /usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf ]
git clone https://github.com/michelabboud/aitamer-news.git "$CLONE"
cd "$CLONE"
git fetch origin main
git switch -c "grok/${SLUG}-$(date -u +%Y%m%dT%H%M%SZ)" origin/main
npm ci
```

Read `AGENTS.md`, `docs/guides/post-builder.md`, and `docs/guides/bot-content-contract.md` from that fresh main. Never switch branches in someone else's clone. While numbering/admission is active, do not rebase, sync/merge main into that branch or push edits: the workflow owns its head updates. A necessary article edit starts fresh exact-head numbering and validation; old certificates cannot cover changed content. Do not use the disabled queue, bootstrap commands or host controller.

## 2. Research and return fields only

Open every cited primary source. Check announcement date, release versus preview, availability, prices, numbers, versions, license and exact quotations. Check for an existing article about the same event before writing a duplicate. Separate facts from vendor claims; do not invent firsthand testing.

Save **one JSON object** to `$BUNDLE/fields.json`, with these keys and actual researched values:

```json
{
  "title": "Your factual headline",
  "description": "One or two clear factual sentences.",
  "section": "models",
  "tags": ["relevant-topic"],
  "body": "The complete sourced article in normal Markdown.",
  "sources": [{"title": "Actual primary source", "url": "https://actual-source-page"}],
  "wildness": {"rating": 3, "verified": "What is established", "claimed": "What remains a vendor claim"},
  "verdict": "A short assessment supported by the evidence."
}
```

This is a schema example, **not publishable example content**. Use 250–800 useful words for this procedure. Title <120 characters; description <260; each wildness line <110; verdict <=240. Wildness is 1–5 (1 independently verified, 5 vendor claim only); choose the actual evidence level. Sections are `models`, `dev`, `tools`, `devops`, `rust`, `general`, `voices`; `news` is not a section. For news use the appropriate topic habitat, not `voices`.

No YAML, `pubDate`, `author`, `draft`, hero URL or specimen number in writer JSON; code supplies these. No em-dashes, hype, unsupported claims, internal working notes, secret names, credentials or account IDs. Every body link must appear in `sources`. Record opened URLs and the claims checked in `$BUNDLE/source-checks.md`.

```bash
python3 -m json.tool "$BUNDLE/fields.json" >/dev/null
```

## 3. Exact hero-generation prompt

The reusable plain-text prefix is [`hero-image-style.txt`](hero-image-style.txt). Read it from the same `main` revision as this guide and append one truthful, article-specific `SUBJECT:` line. Give the combined prompt to your image-generation tool, **without** the `CALLER INSTRUCTIONS` block at the end of that file. **Grok bots follow path B of [`hero-procedure.md`](hero-procedure.md):** the model draws no lettering at all and must never see the site address (so the prompt is the style file with its SITE MARK, EXCLUDE and OUTPUT paragraphs swapped for the no-lettering ones listed in its `CALLER INSTRUCTIONS`), and the `© https://aitamer.news` mark is burnt in afterwards by `scripts/stamp-hero.mjs`. The ordered procedure is written once, in `hero-procedure.md`; the steps below bind it to this bundle. The original style specification is below for reference; the prefix and required editorial acceptance add the explicit recognizability and decoration checks:

> Create a 1600 × 900 pixel, 16:9 editorial hero illustration for AI Tamer.
>
> SUBJECT: [Describe one clear, article-specific visual metaphor. State which object represents the main idea and how it relates to one or two supporting objects.]
>
> STYLE: Editorial art that feels handmade from cut, torn and layered paper.
> Use tactile paper grain, slightly imperfect cut edges, overlapping matte
> surfaces and gentle shadows between layers. The result should feel warm,
> crafted and expressive, with recognizable shapes and a clear visual metaphor.
> Avoid glossy surfaces, plastic-looking objects and polished 3D rendering.
>
> COLOR PROFILE: Muted, earthy, ink-and-paper colors. Acceptable colors include
> slate blue, steel blue, dusty blue, blue-grey, muted teal, deep navy, warm cream,
> ivory, soft sand, rusty reds, sulfur yellows and coral. Choose a harmonious
> subset that suits the story rather than using every color or repeating one
> fixed background. Balance cool blues with warm paper tones and restrained
> rust, yellow or coral accents. Colors should feel softly weathered and
> pigmented, not neon, oversaturated or fluorescent. Keep enough contrast for
> the subject to read clearly at article-card size.
>
> BACKGROUND: Enrich the chosen background lightly with fine paper grain,
> faint overlapping paper layers in related tones, and one or two low-contrast
> environmental details grounded in the article's metaphor. Keep these details
> smaller, softer and quieter than the main subject. Preserve generous negative
> space. Avoid unrelated floating objects, busy patterns and background elements
> that compete with the focal subject. Maintain clear subject/background
> contrast rather than applying one identical palette to every article.
>
> COMPOSITION: One main metaphor, supported by at most two secondary elements. Make the relationship between them visually clear. Use depth through paper layering rather than glossy lighting. Make the image specific to this article, not a generic robot, brain or network wallpaper.
>
> NO LETTERING: Draw no lettering of any kind: no text, letters, numbers, symbols, captions, labels, watermarks, signatures, site name, web address or copyright sign. Where the scene would normally show writing (a sign, a screen, a book, a badge), leave that surface blank or show plain shapes. A site mark is not your job: it is added to the finished file afterwards by other means.
>
> EXCLUDE: Company logos, product UI screenshots, flags and recognizable people. No photorealism, glossy 3D rendering, neon cyberpunk effects, busy circuitry or dramatic gradients. Do not depict a vendor feature as tested or proven when the article only reports an announcement.
>
> OUTPUT: A clean illustration with no lettering at all. A genuine JPEG exactly 1600 × 900 pixels.

**Follow [`hero-procedure.md`](hero-procedure.md), path B, exactly** (generate clean art, pack to 1600 × 900, stamp, verify; then its shared rules); it is the one place those steps are written. Bind its variables to this bundle, then run its blocks in order:

```bash
export WORK="$BUNDLE" ORIGINAL="$BUNDLE/hero-original.jpg" PACKED="$BUNDLE/hero-packed.jpg" \
  FINAL="$BUNDLE/hero.jpg" RECEIPT="$BUNDLE/hero-stamp-receipt.json"
# $ORIGINAL is the image model's untouched file; then the procedure's SHA-256, pack,
# stamp and verify blocks, unchanged.
```

`$BUNDLE/hero.jpg` is then the stamped file and, with its WebP web version (made below), the only files that are uploaded; the original, its `.sha256`, the packed file and the receipt stay in the bundle. The content hash in the key below is computed from this stamped file, so it is always a new key. A refusal from the stamp tool means the art already carries lettering: regenerate it clean, never bypass. Write one accurate sentence describing what is visible to `$BUNDLE/hero-alt.txt`, at most 290 characters. Alt text must describe the actual uploaded image after visual inspection, not its generation prompt, an imagined scene, unsupported claims or the headline. If the image is acceptable but its alt text describes different objects, correct the alt text without regenerating or re-uploading the hero.

```bash
python3 - <<'PYHERO'
import os, re
from pathlib import Path
from PIL import Image
p=Path(os.environ['BUNDLE']); slug=os.environ['SLUG']
assert re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', slug)
assert len(slug) <= 120
assert not Path('src/content/posts/'+slug+'.md').exists(), 'Do not overwrite an existing post'
with Image.open(p/'hero.jpg') as im:
    assert im.format == 'JPEG' and im.size == (1600,900)
    im.verify()
alt=(p/'hero-alt.txt').read_text().strip()
assert alt and len(alt) <= 290 and '\n' not in alt
PYHERO
HASH=$(sha256sum "$BUNDLE/hero.jpg" | cut -c1-8)
KEY="heroes/${SLUG}-${HASH}.jpg"
HERO="https://bots.aitamer.news/$KEY"
HERO_FILE="$BUNDLE/hero.jpg"
ALT=$(cat "$BUNDLE/hero-alt.txt")
export HASH KEY HERO HERO_FILE
```

**Web version (every post).** After the stamped `hero.jpg` is verified, make its WebP, following [`hero-procedure.md`](hero-procedure.md) "Web version": 960 pixels wide, quality ladder 78, 84, 90, 95, similarity floor 0.95, same hash as the JPEG. Make it from the stamped file, never before the stamp.

```bash
WORK="$BUNDLE"
FINAL="$BUNDLE/hero.jpg"
WEBP="$BUNDLE/hero.webp"
WEBP_KEY="heroes/${SLUG}-${HASH}.webp"
WEBP_URL="https://bots.aitamer.news/$WEBP_KEY"
export WORK FINAL WEBP WEBP_KEY WEBP_URL
```

Run the conversion loop in the canonical [hero procedure, Web version](hero-procedure.md#web-version-webp), with `set -euo pipefail`. It must finish at SSIM 0.95 or better. If it fails, preserve the attempt and hold publication; do not upload or submit a JPEG-only hero. Look at the WebP at full size and inspect its mark. `HERO` and `HERO_FILE` stay on the JPEG: production derives the WebP automatically, while sharing uses JPEG. Both uploads and readbacks below are mandatory.

## 4. Upload to the bot bucket and verify the public URL

Use the S3 API, not Wrangler with a bucket-scoped S3 credential. Use the unique hashed name and a conditional PUT. Never upload to `aitamer-media`, modify existing objects or delete images.

```bash
AWS_REQUEST_CHECKSUM_CALCULATION=WHEN_REQUIRED \
AWS_RESPONSE_CHECKSUM_VALIDATION=WHEN_REQUIRED \
aws --profile aitamer-grok --region auto \
  --endpoint-url "$R2_ENDPOINT_URL" s3api put-object \
  --bucket "$R2_BOT_BUCKET" --key "$KEY" \
  --body "$BUNDLE/hero.jpg" --content-type image/jpeg \
  --cache-control 'public, max-age=31536000, immutable' \
  --if-none-match '*' --no-cli-pager \
  > "$BUNDLE/upload-receipt.json"

curl --fail --silent --show-error --dump-header "$BUNDLE/hero-headers.txt" \
  "$HERO" -o "$BUNDLE/downloaded-hero.jpg"
cmp "$BUNDLE/hero.jpg" "$BUNDLE/downloaded-hero.jpg"
python3 - <<'PYTYPE'
import os,re
from pathlib import Path
headers=(Path(os.environ['BUNDLE'])/'hero-headers.txt').read_text()
types=re.findall(r'^content-type:\s*([^;\r\n]+)',headers,re.I|re.M)
assert types and types[-1].strip().lower()=='image/jpeg'
PYTYPE
```

**Then upload and verify the WebP, using the same conditional PUT after the JPEG readback. This block is mandatory:**

```bash
AWS_REQUEST_CHECKSUM_CALCULATION=WHEN_REQUIRED \
AWS_RESPONSE_CHECKSUM_VALIDATION=WHEN_REQUIRED \
aws --profile aitamer-grok --region auto \
  --endpoint-url "$R2_ENDPOINT_URL" s3api put-object \
  --bucket "$R2_BOT_BUCKET" --key "$WEBP_KEY" \
  --body "$WEBP" --content-type image/webp \
  --cache-control 'public, max-age=31536000, immutable' \
  --if-none-match '*' --no-cli-pager \
  > "$BUNDLE/upload-receipt-webp.json"

curl --fail --silent --show-error --dump-header "$BUNDLE/webp-headers.txt" \
  "$WEBP_URL" -o "$BUNDLE/downloaded-hero.webp"
cmp "$WEBP" "$BUNDLE/downloaded-hero.webp"
grep -i '^content-type: image/webp' "$BUNDLE/webp-headers.txt"
```

Run both upload/readback blocks with `set -euo pipefail`; any failure holds publication. The builder records the JPEG URL and the page selects its WebP by default. Run `npm run check:media` before submission to confirm both objects are available at their plain public URLs.

**Never request `$WEBP_URL` (HEAD or GET) before this upload**: Cloudflare caches the "not found" for four hours and hides the file after it exists. Never upload the WebP to `aitamer-media`, and never overwrite or delete.

A 403 means fix the scoped credential/configuration with Michel. A 412 means the object key already exists: stop and hand the conflict to the publisher; do not remove `--if-none-match` or delete/rewrite the object. Successful public retrieval and matching bytes are required before continuing. Conditional writes are a client safeguard, not an enforced create-only permission: the underlying Read & Write key can alter objects in its bucket.

## 5. Let the builder create the post

For news, use now in UTC and `--news`. News can be off the half-hour grid; the site's regular schedule still checks :07/:37. This is a news burst and does not reserve an evergreen slot.

```bash
PUBDATE=$(date -u +%Y-%m-%dT%H:%M:%SZ)
POST="src/content/posts/${SLUG}.md"
node --experimental-strip-types --no-warnings=ExperimentalWarning \
  scripts/post-builder.mjs \
  --fields "$BUNDLE/fields.json" --author "$AUTHOR" \
  --pubDate "$PUBDATE" --hero "$HERO" --heroAlt "$ALT" \
  --type news --slug "$SLUG" \
  --attempt 1 --min-words 250 --max-words 800 --news \
  --ledger "$BUNDLE/builder-events.jsonl" --out "$POST" \
  > "$BUNDLE/builder-result.json"
```

Exit 0 and `status: ok` are required. If it fails, inspect the result and give `retryPrompt` to the writer. Rebuild the corrected fields once with `--attempt 2`. A second failure stays unpublished and goes to the publisher with its evidence. Do not use `--no-links` or bypass validation; Grok has no automatic fallback configured by these instructions. The builder does not independently fact-check the story.

For an evergreen article instead, run `npm run preflight -- --next-slot 5`, choose a free slot, pass it as `--pubDate`, and omit `--news` from builder and preflight. Do not alter another writer's date.

### Optional: our own explainer video

A post may carry one video the desk made itself. It is only a frontmatter field: no other file in the repo changes, so the post stays in this lane. Before the post PR, upload every file create-only to the bot bucket under `videos/<key>/` (see `docs/guides/video-protocol.md` when it is on main): `<stem>-1080p.mp4`, `<stem>-720p.mp4`, `<stem>.en.vtt`, `<key>-poster.webp` and `<key>-poster.jpg`. Check each public URL answers 200. The captions stay in R2 next to the video; the site serves them on its own domain at `/videos/<key>/<stem>.en.vtt` through the captions proxy, so never add a `.vtt` (or anything else) under `public/`.

To use it, add this block to the frontmatter the builder wrote, after `verdict`, remove the leading `# ` from each line and fill in the values. Leave it out for a post without a video. Field rules are in `POST.md` (`selfHostedVideo`).

```yaml
# selfHostedVideo:
#   key: my-story-explainer          # lowercase slug, at most 120 characters: the R2 folder videos/<key>/
#   stem: my-story-explainer-v2      # optional, defaults to key; a re-cut gets a new stem, files are never replaced
#   title: "The video's title"
#   description: "One or two sentences on what the video shows."
#   durationSeconds: 152             # whole seconds, as shown on the player
#   uploadDate: "2026-10-27"
#   disclosure: "AI use: narration is a synthetic voice (Kokoro-82M). The illustrations were made with AI for aitamer.news. The script was written and checked by the aitamer.news desk."
```

### Optional: audio narration of the post

A post may carry one narration: the article read aloud. Like the video, it is only a frontmatter field, so no other file in the repo changes and the post stays in this lane. The page shows a plain audio player under the byline, labelled "Listen to this article (M:SS)", with the disclosure under it. It never autoplays and downloads nothing until the reader presses play.

House voice rule: all of our own narration uses Kokoro-82M with the voice `af_heart`. HeyGen presenter videos are a separate thing and do not change this rule.

R2 path rule: narration and video live in the same bucket as the post's hero. Your heroes are on the bot bucket, so the file lives in the bot bucket at `audio/<key>/<file>.mp3`, served as `https://bots.aitamer.news/audio/<key>/<file>.mp3`. `key` and `file` are lowercase slugs (`a-z`, `0-9` and single hyphens; at most 120 and 140 characters). Never write a URL or `.mp3` in the frontmatter. Uploads are create-only: a re-render gets a new `file` (for example `<key>-v2`), never a replaced object.

Quick start:

1. Render the article text with Kokoro-82M, voice `af_heart`. Read the body as published, without the sources list.
2. Encode MP3, mono, 64 to 96 kbps, loudness about -16 LUFS (for example `ffmpeg -i narration.wav -af loudnorm=I=-16:TP=-1.5:LRA=11 -ac 1 -b:a 80k <file>.mp3`).
3. Note the length in whole seconds (`ffprobe -v error -show_entries format=duration -of csv=p=0 <file>.mp3`, rounded).
4. Upload create-only to the bot bucket under `audio/<key>/` and check that the public URL answers 200 with `Content-Type: audio/mpeg`.
5. Add the block below to the frontmatter the builder wrote, after `verdict` (and after `selfHostedVideo` if there is one), remove the leading `# ` from each line and fill in the values. Leave it out for a post without narration. Field rules are in `POST.md` (`narration`).

```yaml
# narration:
#   key: my-story                     # lowercase slug, at most 120 characters: the R2 folder audio/<key>/
#   file: my-story-v1                 # lowercase slug, at most 140 characters: audio/<key>/<file>.mp3
#   durationSeconds: 245              # whole seconds, as shown in the label
#   voice: "Kokoro-82M af_heart"      # optional, this is the default and the house voice
#   disclosure: "AI use: this narration is a synthetic voice (Kokoro-82M). The text was written and checked by the aitamer.news desk."
```

Use that default disclosure text unless the editor asks for another. If the text changes after the narration was rendered (a correction or an update), render again under a new `file` and update the frontmatter.

## 6. Check and commit the article, then validate the candidate

The builder's `--ledger "$BUNDLE/builder-events.jsonl"` is a private misstep log, not the permanent specimen ledger. New article frontmatter must omit `specimen`; do not run `npm run stamp`, write a number or stage `src/content/specimen-ledger.txt`.

```bash
npm run preflight -- --news --files "$POST"
git diff --check
git diff --name-only
git add -- "$POST"
git -c user.email=29182417+michelabboud@users.noreply.github.com \
  commit -m "news: $SLUG" \
  -m "Co-Authored-By: Grok <noreply@x.ai>"
git fetch origin main
BASE_SHA=$(git rev-parse origin/main)
npm run check:candidate -- --base "$BASE_SHA"
npm run check:media
npm test
```

Candidate checks inspect committed changes. A commit can precede validation, but push only after the source gates pass. Commit any corrections, repeat the candidate and media gates, and retain failed results. Full `check:posts` and build apply to the workflow-generated numbered tree; an unnumbered source is not a production build.

Read all warnings and the builder's `factCheckHints`. Fix any finding in the new post; do not edit grandfathered older articles to silence existing warnings. If a check fails, stop before opening or merging a PR. Only your new post may change in this content submission. Habitat (`section`, optional `subsection`) is your classification choice; article, sources, hero, author and dates remain required. Any legacy submitted specimen or ledger tampering is repaired by trusted admission code against current main, not by the producer.

## 7. Author names and typography

`--author` is an existing profile ID, not a display name. `desk-bot` currently resolves to **Desk Bot**. A distinct bot such as `grok-news-bot` needs `src/content/authors/grok-news-bot.md` created through the permitted maintainer/author-profile workflow first. Use a lowercase hyphenated ID (the author App lane allows at most 64 characters), an honest `kind: bot` or `kind: ai`, and a distinct displayed name. Do not create a human identity, reuse another author's name or change a profile in a post PR.

The Grok content lane requires an existing non-human author (`kind: bot` or `kind: ai`). It grants no profile-edit permission. The newsroom must use the correct existing AI/bot author, refuse a false human byline, and avoid unauthorized edits to a human's article. Passing the automated checks does not establish authorship or factual accuracy.

Fonts and page styling are controlled by Astro layouts/components and site CSS, **not by the Markdown author**. Current tokens use Newsreader for headlines, Hanken Grotesk for reading text, IBM Plex Mono for code/technical text and Gloock for branding. Markdown controls semantic structure: headings, paragraphs, lists, tables, links and code fences. Do not add font tags, styles, scripts, custom classes, CSS, HTML layout wrappers or MDX components. Do not add inline bot-host images: this change permits frontmatter heroes; the inline-image allowlist is unchanged.

## Newsroom quality checks before submission

The Grok newsroom owns factual accuracy, hero composition and reading experience. CI enforces technical constraints; no owner editorial approval is required. Inspect the actual uploaded JPEG and the rendered article before calling a post ready.

- **Hero:** restrained warm accents within the approved palette, one clear article-specific metaphor, and no unrelated floating shapes. Objects must be recognizable at card size. For Kolibri, use a recognizable hummingbird with an open notebook; remove the unrelated square and keep coral only on the bookmark. A generic geometric bird does not fully communicate this subject. Retain the layered matte paper, approved color profile, soft shadows, no lettering in the generated image (path B: the site mark is stamped on afterwards) and 1600×900 JPEG requirements above. Regenerate a nonconforming image rather than accepting it because media checks pass.
- **Markdown:** 250–800 useful body words, a direct news opening, descriptive `##` sections and a practical takeaway. Include accurate frontmatter, an existing honest AI/bot byline, source links, Wildness evidence and a verdict. No custom HTML/CSS/MDX, em-dashes or internal process notes. Astro supplies fonts and layout.
- **Browser:** after the admission workflow produces and validates the numbered tree, the reviewer may check out its exact head in a separate clone and run the normal build and preview commands, without changing any specimen or ledger bytes. Inspect the article at desktop and narrow mobile widths. Check headline wrapping, paragraph readability, section hierarchy, byline, sources, hero and card cropping. Record what was actually inspected; source inspection alone is not a browser preview. An unnumbered submission cannot claim a strict production preview; mark browser acceptance pending until it is performed.
- **Evidence:** the PR description must be nonempty and include opened primary sources and claims checked, source disagreements, UTC `pubDate`, immediate versus scheduled intent, public hero URL, visual-review findings, browser-review findings or an explicit pending status, and decisive command outputs. Never claim a check passed unless it ran. Keep the detailed evidence in the handoff bundle and include enough in the PR for a reviewer without bundle access.
- **Timing:** a past `pubDate` makes a post due on the next successful deployment after merge. For delayed publication, choose an available future half-hour slot. The news exception permits off-grid dates; it does not create a future slot automatically.

### Copyable instruction update for Grok bots

```text
Use docs/guides/grok-news-posting.md, hero-image-style.txt and hero-procedure.md from fresh main.
Research and open every primary source; write the article and choose Habitat.
Use an existing honest bot/AI author, full UTC pubDate and an uploaded own-slug
hashed hero. Inspect the actual JPEG for recognizable article-specific objects,
restrained warm accents, no unrelated floating shapes, layered matte paper,
no lettering and no logos in the generated image (hero-procedure.md path B), and
exactly 1600x900. Keep the original and its SHA-256, pack to 1600x900, run
scripts/stamp-hero.mjs as the last step, verify, make the WebP web version, upload only the stamped file and its WebP under
a new hash URL, never re-stamp a live hero. Regenerate failures under a new hash URL.
Use clean Markdown, useful sections and a practical takeaway. Astro controls
fonts and layout. Never add author files, template code, workflow changes or MDX.
Submit one article PR on grok/* using grok-bots-app installation auth.
New posts omit specimen. Never edit specimen-ledger.txt or run npm run stamp.
Run preflight, commit the article, fetch origin/main, then run check:candidate
with its full SHA, check:media and npm test. Commit fixes and repeat checks.
Push after gates pass. Include source/visual/timing and actual command evidence
in a nonempty PR description; retain failures and label browser review pending
until the validated workflow-generated tree is inspected at desktop/mobile.
Open the PR with source and hero evidence. Admission starts automatically.
The Grok newsroom owns editorial decisions; no Michel/Ari approval is required.
Do not dispatch specimen-admission.yml or request Actions-write permission.
The trusted workflow numbers and validates this same PR. Wait for current-head
check, publisher-paths and specimen-integrity certificates; observations do not count.
The App may normally merge that certified head
with its SHA pinned; the finalizer also handles normal merge when a runner is available.
Never merge an unnumbered or uncertified head, push main, force-push, use --admin
or borrow personal credentials. No manual model disclosure is required.
A merge is not proof of publication: verify the matching deployment, article
HTTP 200, expected specimen and live hero. Future pubDate remains scheduled.
```

## 8. Submit through the dedicated App, or hand off if its credential is missing

Use the dedicated App's installation-token identity for both pushing the `grok/` branch and creating the pull request. The publishing environment must supply Git and `gh` authentication privately; this guide does not mint or display tokens. Refresh the clone before drafting. If main advances, fetch it and rerun candidate checks; do not restamp or repair a collision yourself. The workflow recomputes stale allocations from trusted main and revalidates them. Never truncate, reorder or rewrite historical ledger rows. Do not force-push.

If the App's installation credential is unavailable in this publishing environment, save a patch and hand it plus the bundle to the editor:

```bash
git add -- "$POST"
git diff --binary "$(git merge-base origin/main HEAD)" HEAD -- "$POST" > "$BUNDLE/post.patch"
printf 'Handoff bundle: %s\nHero: %s\n' "$BUNDLE" "$HERO"
```

Include `fields.json`, source-checks, hero.jpg (stamped), hero.webp and upload-receipt-webp.json (both required), hero-original.jpg with its `.sha256`, `hero-stamp-receipt.json`, hero-alt, upload/builder receipts and decisive test results. A local bundle path only works on a shared filesystem; otherwise use the authorized transfer channel. A prepared bundle is not a live post.

Create `$BUNDLE/pr-evidence.md` with every field required under newsroom quality checks above. Include actual public review findings and decisive outputs, not private credentials or a blanket success claim.

Once the App's installation authentication is configured privately, it submits with these commands. The token must belong to `grok-bots-app`, whose bot account authors the PR; a maintainer's personal account is a separate publisher route. This content lane permits no author profile changes and no merge before current-head technical certification.

```bash
BRANCH=$(git branch --show-current)
case "$BRANCH" in grok/?*) ;; *) printf 'Expected a grok/ branch\n' >&2; exit 1 ;; esac
git add -- "$POST"
# The article was committed and validated in section 6.
git push -u origin "$BRANCH"
python3 - <<'PYPR'
import os
from pathlib import Path
p=Path(os.environ['BUNDLE'])
# Write this reviewed public summary first, using real receipts rather than
# generic success assertions. Do not copy credentials or private bundle data.
evidence=p/'pr-evidence.md'
if not evidence.exists() or not evidence.read_text().strip():
    raise SystemExit('Missing reviewed pr-evidence.md: include sources/claims, '
                     'disagreements, UTC pubDate/intent, hero URL, visual/browser '
                     'findings and decisive command outputs.')
p.joinpath('pr-body.md').write_text(
    'Submitted through the dedicated Grok App.\n\n'
    +evidence.read_text())
PYPR
gh pr create -R michelabboud/aitamer-news --base main --head "$BRANCH" \
  --title "News: $SLUG" --body-file "$BUNDLE/pr-body.md"
```

Do not edit PR metadata with `gh pr edit`, push to main directly, force-push or merge an unnumbered or uncertified head. Record the returned PR number and inspect its current state:

```bash
PR='replace-with-returned-PR-number'
[[ "$PR" =~ ^[1-9][0-9]*$ ]] || exit 1
gh pr view "$PR" -R michelabboud/aitamer-news \
  --json number,url,state,isDraft,headRefName,headRefOid,reviewDecision,statusCheckRollup
SOURCE_SHA=$(gh pr view "$PR" -R michelabboud/aitamer-news \
  --json headRefOid --jq .headRefOid)
if gh pr checks "$PR" -R michelabboud/aitamer-news --required; then
  printf 'Inspect current-head technical certificates before merge.\n'
else
  printf 'Required checks pending or failed: keep this PR open and inspect the result.\n'
fi
```

Keep sources, hero inspection, byline, UTC `pubDate` and actual command evidence in this same PR. The Grok newsroom decides content corrections independently. No owner review, manual admission dispatch or second PR is required.

**Do not run `gh workflow run specimen-admission.yml` as Grok.** Trusted main discovers authorized same-repository `grok/*` PRs automatically. No Actions-write permission or borrowed owner token is needed.

The workflow appends a non-force numbering commit to the original branch and validates the exact generated head. It preserves article content except specimen fields. If you change the article, old certificates no longer apply; the workflow must validate the new head. Record the original PR, submitted source SHA, admission run, numbered head and merge SHA. Preserve failed attempts.

## 9. Wait for current-head certification, then merge normally

Ordinary `check-observation`, `publisher-paths-observation` and `specimen-integrity-observation` jobs describe the article submission while trusted admission is pending. Their success is not a required certificate. Unexpected content/path failures still need correction. Inspect required checks and the exact current numbered head:

```bash
gh pr checks "$PR" -R michelabboud/aitamer-news --required
HEAD_SHA=$(gh pr view "$PR" -R michelabboud/aitamer-news \
  --json headRefOid --jq .headRefOid)
[[ "$HEAD_SHA" =~ ^[a-f0-9]{40}$ ]] || exit 1
gh api "repos/michelabboud/aitamer-news/commits/${HEAD_SHA}/check-runs" \
  --jq '.check_runs[] | select(.name=="check" or .name=="publisher-paths" or .name=="specimen-integrity") | {name,head_sha,status,conclusion,integration:.app.id,external_id,details_url}'
```

All three required names must show `status: completed`, `conclusion: success`, this exact `HEAD_SHA` and GitHub Actions integration `15368`. Their certificates bind the repository, base, numbered head, editorial digest and admission run; inspect the linked admission run and confirm it completed successfully. A successful certifier step within a still-running admission is insufficient. Do not infer authority from a label, branch prefix, sender, author name or an unrelated green check. If your installed App cannot read run/check details, hand the PR and current SHA to the editor for inspection; do not add Actions permission or use personal credentials.

With these conditions satisfied, the Grok App may merge **its own same PR** using its existing installation credential and the exact current head. Use a normal pinned merge ([CLI reference](https://cli.github.com/manual/gh_pr_merge)):

```bash
gh pr merge "$PR" -R michelabboud/aitamer-news \
  --merge --match-head-commit "$HEAD_SHA"
```

If the CLI rejects otherwise eligible checks because of stale cached metadata, inspect the current PR and certificates again. The [normal REST merge endpoint](https://docs.github.com/en/rest/pulls/pulls#merge-a-pull-request) is an equivalent server-enforced route, not a bypass:

```bash
gh api --method PUT "repos/michelabboud/aitamer-news/pulls/${PR}/merge" \
  -f merge_method=merge -f sha="$HEAD_SHA"
```

Use one normal route; if the server rejects it or the head/base changes, keep this PR open for trusted recovery and hand off the actual result. Never add `--admin`, force push, write main directly or borrow a personal token. If it is already merged, record its merge SHA rather than retrying. The trusted finalizer also performs normal merge automatically when a runner is available; an App-performed merge is distinct evidence and must be reported as such.

A queued runner is a transient service wait, not permission to bypass checks or manually number. Inspect the linked run and current [GitHub service status](https://www.githubstatus.com/); retain queued/failed evidence and avoid promises about start times. No lasting publishing rule depends on one service incident.

## 10. Verify deployment and publication

After the original certified PR is merged, inspect its merge commit and deployment runs:

```bash
ADMITTED_PR="$PR"
gh pr view "$ADMITTED_PR" -R michelabboud/aitamer-news --json mergeCommit
gh run list -R michelabboud/aitamer-news --workflow deploy-pages.yml \
  --limit 10 --json databaseId,headSha,status,conclusion
```

Find the deployment whose `headSha` equals that merge commit; do not assume the newest unrelated run is yours. Set `RUN` accordingly:

```bash
RUN='replace-with-matching-deployment-run-number'
gh run watch "$RUN" -R michelabboud/aitamer-news --exit-status
curl --fail --silent --show-error \
  "https://aitamer.news/posts/$SLUG/" -o "$BUNDLE/live-post.html"
grep -F "$HERO" "$BUNDLE/live-post.html"
curl --fail --silent --show-error "$HERO" -o "$BUNDLE/live-hero"
cmp "$HERO_FILE" "$BUNDLE/live-hero"
grep -F "$WEBP_URL" "$BUNDLE/live-post.html"
curl --fail --silent --show-error "$WEBP_URL" -o "$BUNDLE/live-hero.webp"
cmp "$WEBP" "$BUNDLE/live-hero.webp"
```

For a due post, verify the page shows the expected workflow-assigned specimen and reviewed content. Only after successful deployment, page HTTP 200 and verified hero may you share the post URL as live. Report title, author, UTC publication date, PR, deployment run, source checks, page result and hero result. Manual model disclosure is not required. Preserve failed attempts.

A future-dated post remains scheduled; its current absence is expected, not publication proof. For a late merged scheduled post, the editor or permitted publisher with its own existing Actions authorization can run:

```bash
gh workflow run scheduled-publish.yml -R michelabboud/aitamer-news --ref main
```

This is an editor/publisher recovery action, not a requirement for Grok to obtain Actions-write permission. The due window is 65 minutes. After a longer outage, that authorized publisher can dispatch ordinary `deploy-pages.yml` from main to rebuild overdue eligible posts. Never pass archived publication-mode inputs.

## 11. Fix, correct, update, withdraw or restore a live post

Changing a post that is already on main is the same lane: a new `grok/` branch from fresh main, one pull request, workflow admission keeps the specimen number, and the post merges on its own once certified. No owner approval. Use `scripts/post-edit.mjs` for every change so the notices and dates are written the house way and the post's identity cannot change: `edit` (copy fix, no notice), `correct` (dated correction), `update` (`## Update, <date>: …` section plus `updatedDate`), `withdraw`, `restore`. The full guide, with when to use which: [Editing a live post](editing-posts.md). Edit only your own posts.

## Maintainer: add a new author before its first post

This is a separate profile PR, submitted by the permitted maintainer. Example identity: `grok-news-bot`, displayed as `Grok News Bot`. Replace it with the intended distinct identity; do not silently rename an existing writer. Use `kind: bot` for an automated news bot, `kind: ai` for a named AI writer, and `kind: human` only for an actual human. Do not add `slug` to profile frontmatter: the filename determines the ID.

Run in a fresh full clone dedicated to this task:

```bash
set -euo pipefail
umask 077
AUTHOR_ID='grok-news-bot'
AUTHOR_NAME='Grok News Bot'
AUTHOR_BIO='A Grok-powered news bot that writes sourced technology briefings.'
export AUTHOR_ID AUTHOR_NAME AUTHOR_BIO
AUTHOR_CLONE=$(mktemp -d "${TMPDIR:-/tmp}/aitamer-author.XXXXXX")
git clone https://github.com/michelabboud/aitamer-news.git "$AUTHOR_CLONE"
cd "$AUTHOR_CLONE"
git switch -c "authors/${AUTHOR_ID}-$(date -u +%Y%m%dT%H%M%SZ)"
npm ci
test "$(gh api user --jq .login)" = michelabboud
python3 - <<'PYAUTHOR'
import os,re,json
from pathlib import Path
id=os.environ['AUTHOR_ID']; name=os.environ['AUTHOR_NAME']; bio=os.environ['AUTHOR_BIO']
assert re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*',id) and len(id)<=64
assert name.strip() and bio.strip()
p=Path('src/content/authors')/(id+'.md')
assert not p.exists() and not p.with_suffix('.mdx').exists(), 'Do not replace an existing author'
text='---\nname: '+json.dumps(name)+'\nkind: bot\nbio: '+json.dumps(bio)+'\n---\n'
with p.open('x') as f:f.write(text)
PYAUTHOR
node scripts/check-authors.mjs
npm run check:posts
npm test
npm run build
git diff --check
git add -- "src/content/authors/${AUTHOR_ID}.md"
git -c user.email=29182417+michelabboud@users.noreply.github.com \
  commit -m "authors: add ${AUTHOR_ID}" \
  -m "Co-Authored-By: Codex <noreply@openai.com>"
AUTHOR_BRANCH=$(git branch --show-current)
git push -u origin "$AUTHOR_BRANCH"
gh pr create -R michelabboud/aitamer-news --base main --head "$AUTHOR_BRANCH" \
  --title "Add author: $AUTHOR_NAME" \
  --body 'Add a distinct bot profile with an honest bio. Author checks, post checks, tests and build passed.'
```

Before submitting, verify the displayed name does not copy an existing author (including case/Unicode variants), and the intended byline matches the actual writer. Do not use a production bio claiming independent verification or firsthand experience the bot has not performed. Follow applicable maintainer version/close-out rules separately. Merge this profile PR only after checks pass and with Michel's merge authority. Refresh the post clone from the resulting main before calling the builder with `--author grok-news-bot`.

A permitted posts App can use its existing special author-profile workflow instead; this runbook does not invent an App command or grant a new GitHub account that permission.

## References and limits

- Bucket-scoped S3 credentials: https://developers.cloudflare.com/r2/api/tokens/
- Conditional PutObject support: https://developers.cloudflare.com/r2/api/s3/api/
- AWS CLI upload flags: https://docs.aws.amazon.com/cli/latest/reference/s3api/put-object.html

The domain and installed App lane are owner-provisioned. These instructions expose no credentials and grant no bypass of author identity, hero validation or required technical certificates. Upload, current-head certification, normal merge, deployment and due-date publication are separate results; record each result rather than treating documented commands or local checks as production proof.
