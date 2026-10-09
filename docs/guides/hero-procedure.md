# Hero image procedure

**One procedure for every writer and bot** (Codex, Claude, Cursor, the Grok bots, a human with an image tool). It is the only place these steps are written; every other guide points here and must not carry its own copy. What the image model is told is [`hero-image-style.txt`](hero-image-style.txt). This file is what you do with the result.

Every hero carries **exactly one** site mark, `© https://aitamer.news`, at the bottom-right, so a copied image still carries the address. There are two supported ways to get it there. Pick one per hero; the shared rules below apply to both.

| | Path A: the model draws the mark | Path B: a deterministic stamp |
|---|---|---|
| Who uses it | Codex imagegen, and any model that can draw the mark reliably | The Grok bots, Claude, Cursor, anyone whose model cannot; **and the fallback for path A** |
| Prompt | `hero-image-style.txt` as it stands (its SITE MARK paragraph is the spec) | The same file with the SITE MARK, EXCLUDE and OUTPUT paragraphs swapped for the no-lettering ones (see its `CALLER INSTRUCTIONS`) |
| The mark | Drawn in the same generation | Burnt in last by `node scripts/stamp-hero.mjs` |

**Needs (path B, and the tests):** `ffmpeg` with the `drawtext` filter (libfreetype), `ffprobe`, and DejaVu Sans or Liberation Sans (`sudo apt-get install ffmpeg fonts-dejavu-core`; measured on ffmpeg 6.1.1, Ubuntu 24.04), Node 22.18+.

**Variables used below** (set them once per run; use a folder the run states in its hand-off):

```bash
WORK=/path/the/run/states
SLUG=your-post-slug
ORIGINAL="$WORK/hero-original.jpg"   # path A: the generated file. Path B: the clean generated file.
PACKED="$WORK/hero-packed.jpg"       # path B only
FINAL="$WORK/hero.jpg"               # the one file that is uploaded: path B writes it; path A sets FINAL to $ORIGINAL, or to $PACKED if it had to be packed
RECEIPT="$WORK/hero-stamp-receipt.json"
```

## Path A: the model draws the mark

1. **Generate** from `hero-image-style.txt` plus one truthful `SUBJECT:` line. Save the model's output **untouched** as `$ORIGINAL` and record its SHA-256 (`sha256sum "$ORIGINAL" | tee "$WORK/hero-original.sha256"`).
2. **Inspect it** at full size and at card size (`ffmpeg -v error -nostdin -y -i "$ORIGINAL" -vf scale=320:-1 -update 1 "$WORK/card.png"`):
   - the text is exactly `© https://aitamer.news`: the © symbol, the whole address, no misspelling, no second line;
   - it sits at the bottom-right (about 24 px in from both edges), reads clearly, is not cropped and covers nothing important;
   - it is the **only** lettering in the picture, and the art meets the style guide (paper-cut style, illustrates the article, legible at card size, no pseudo-text or logos).
3. **Regenerate** if any of that fails, up to **three** times in all. If the third try still fails, **go to path B** (generate clean art with no lettering). Do not patch a faulty mark by painting, cropping or stamping over it.
4. **Pack** (below) only if the file is not already exactly 1600 x 900, then look at the packed file again: the mark must still be whole and at the bottom-right. The file to upload is `$PACKED` if you packed, else `$ORIGINAL` itself; set `FINAL` to it.
5. Continue with **the shared rules**. Never run the stamp tool on this file: it already carries a mark, and the tool refuses.

## Path B: the deterministic stamp

1. **Generate clean art:** the model draws **no lettering at all**. Save the output untouched as `$ORIGINAL` and record its SHA-256. Inspect it: style guide met, and not a single letter, number, pseudo-text or logo anywhere. If it has any, regenerate.
2. **Pack** it to exactly 1600 x 900 (below) into `$PACKED`, unless it already is, in which case `$PACKED` is `$ORIGINAL`.
3. **Stamp**, as the last step:

   ```bash
   node scripts/stamp-hero.mjs --in "$PACKED" --out "$FINAL" --receipt "$RECEIPT"
   ```

   The mark is exactly `© https://aitamer.news`, bottom-right, 20 px, inset 24 px, white or dark ink chosen from the picture under it. The tool refuses (exit 2, writes nothing) an existing `--out` or `--receipt`, a file that is not a 1600 x 900 JPEG, and any picture that already carries a mark or other lettering in the bottom-right corner (it checks the marker it leaves in stamped files, the exact box, and a search of the corner for a line of lettering in any place, size and ink).
4. **A refusal about existing lettering means the art is not clean.** Regenerate it with no lettering and start again. **Never bypass it**: do not crop, blur, paint over or re-encode the picture to get past the check. There is no override flag, on purpose. Detection is deliberately cautious: a false refusal costs one regeneration, a missed one costs two marks on a live page.
5. **Verify the stamped image:** open it and look. The mark is exact, legible, not cropped and covers nothing important, also at card size:

   ```bash
   ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height -of csv=p=0 "$FINAL"   # must print mjpeg,1600,900
   ffmpeg -v error -nostdin -y -i "$FINAL" -vf "crop=700:140:900:760" -update 1 "$WORK/stamp-corner.png"   # corner at full size
   ffmpeg -v error -nostdin -y -i "$FINAL" -vf "scale=320:-1" -update 1 "$WORK/stamp-card.png"            # roughly card size
   ```

   Keep `$RECEIPT` (input and output SHA-256, ink, box, ffmpeg version, time).

## Pack to exactly 1600 x 900

Image models return their own sizes (live heroes often are 1672 x 941 or 1280 x 720), and the stamp tool accepts only a JPEG of exactly 1600 x 900, so every final file must be that size. Check the source:

```bash
ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "$ORIGINAL"
```

- **A 16:9 source** (width x 9 within 1% of height x 16: 1600 x 900, 1672 x 941, 1280 x 720, 1920 x 1080): scale to cover, centre-crop, write a **new** file. The original is never touched and an existing `$PACKED` is never replaced:

  <!-- test:pack-command (scripts/stamp-hero.test.mjs runs this exact block) -->
  ```bash
  test ! -e "$PACKED" && ffmpeg -v error -nostdin -i "$ORIGINAL" -vf "scale=1600:900:force_original_aspect_ratio=increase:flags=lanczos,crop=1600:900" -frames:v 1 -q:v 2 -map_metadata -1 -update 1 "$PACKED"
  ```

- **Any other ratio** (square, portrait, 4:3, ultra-wide): **regenerate** with a 16:9 request. Never stretch or squash, and never crop away the subject.

A 1280 x 720 source is enlarged; if it looks soft, regenerate larger.

## Shared rules (both paths)

1. **Exactly one mark.** Never stamp an image that already carries a mark; never leave two. The tool refuses such an image, including marks an image model drew at another size, position or colour.
2. **The final file is exactly 1600 x 900 and a genuine JPEG** (`ffprobe` prints `mjpeg,1600,900`).
3. **Keep the raw original and its SHA-256.** Path A: the generated file. Path B: the clean generated file plus `$RECEIPT`. Originals are **never edited, overwritten or deleted**. Keep them where the editor collects them (a path the run states in its hand-off) until the editor says otherwise. Long-term storage for originals is an **open decision** (`BACKLOG.md`).
4. **Upload only the final file** under a **new content-hashed key**, `heroes/<slug>-<first 8 hex of its SHA-256>.jpg`. Never overwrite or delete a prior object; never upload an original or a packed file.

   ```bash
   HASH=$(sha256sum "$FINAL" | cut -c1-8)
   KEY="heroes/${SLUG}-${HASH}.jpg"
   ```

   How the bytes reach the bucket depends on your lane (the Grok bot bucket: [`grok-news-posting.md`](grok-news-posting.md) section 4; the main media bucket: `POST.md` section 3; the posts MCP uploads it itself).
5. **Read the public URL back before any post references it:** the same bytes, `image/jpeg`, 1600 x 900.

   ```bash
   HERO="https://<media host>/$KEY"
   curl --fail --silent --show-error --dump-header "$WORK/hero-headers.txt" "$HERO" -o "$WORK/downloaded-hero.jpg"
   cmp "$FINAL" "$WORK/downloaded-hero.jpg"
   grep -i '^content-type: image/jpeg' "$WORK/hero-headers.txt"
   ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "$WORK/downloaded-hero.jpg"   # must print 1600,900
   ```
6. **Alt text** (`heroAlt`) is one true sentence describing what is visibly in the **uploaded** image, written after looking at it: not the prompt, not the headline, not an imagined scene.
7. **A live hero is never re-stamped and never re-uploaded** to add, move or fix the mark.

## Who keeps what

| File | Where it lives |
|---|---|
| The final `hero.jpg` | **The media host, and only it**, under its hashed key. |
| The original, its `.sha256`, the packed file, the stamp receipt, the verification crops | **With the run** (its bundle or hand-off), kept until the editor says otherwise. Never on the media host, never in the repository. |

## Known gap: the Grok bots' Newsroom stamp script

The Grok bots stamp today with their own post-render script on the Newsroom box, not with `scripts/stamp-hero.mjs` (their live heroes are identical in size, position and look). It is **not assumed** to match this repo's tool: either replace it with `node scripts/stamp-hero.mjs`, or make it match the spec (exact text `© https://aitamer.news`, 24 px inset, about 20 px type, bottom-right, 1600 x 900). Either way a hero is stamped once, and `stamp-hero.mjs` will refuse a picture that already carries such a mark. Tracked in `BACKLOG.md`.
