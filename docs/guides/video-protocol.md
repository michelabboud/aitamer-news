# aitamer.news Video Protocol v1

**How we make, check, store and publish our own explainer videos.** Version 1.1, 2026-10-30 (v1 2026-10-27), written from the LEANN pilot (`leann-explainer`). It will be updated as we learn. Owner: Wiz Cat. Questions go to the EIC.

This file covers **our own videos only**. Third-party YouTube videos on posts follow the embed policy (click-to-load, privacy-enhanced player, allow-listed uploaders), not this file. Hero images follow [`hero-procedure.md`](hero-procedure.md) and [`hero-image-style.txt`](hero-image-style.txt).

Contents: 1 Scope and principles. 2 Where things live. 3 Decisions so far. 4 Roles and gates. 5 Format. 6 Quick start: make a simple movie in 10 steps. 7 Full production pipeline. 8 Disclosure. 9 R2 storage. 10 Site embed. 11 YouTube channel. 12 Cost and tokens. 13 Checklists. 14 Changelog.

## 1. Scope and principles

1. **Our own videos only.** Everything on screen and in the audio is made by us: our script, our synthetic narration, our AI illustrations, our code-drawn cards and charts.
2. **Third-party YouTube videos are only ever shown through YouTube's own embed.** We never download, rehost, clip, screen-record or caption-extract them. **No `yt-dlp`**, not even with `--skip-download`, and no bots scraping the transcript panel (YouTube ToS and Developer Policies III.E.6; Legal ruling 2026-10-27, item 4).
3. **Play fair and legal.** No third-party footage, logos, screenshots, slides, UI captures or music. Product and company names are said and written as plain words. Charts are our own redraw of the numbers with the source named, never a pasted figure or table.
4. **$0 tooling by default.** Kokoro, ffmpeg, Pillow, faster-whisper and the bot bucket cost nothing. **Any paid tool (HeyGen, premium TTS, stock media, a paid API) needs Wiz Cat's OK first.**
5. **Never pass off the synthetic voice as a real person.** No human narrator name, no real person's face or name paired with the voice.

## 2. Where things live

This repository is public, so box paths appear here only as shell variables. Set them once per shell from the ops workspace notes on the box; their real values are not written in this guide:

| Variable | What it points at |
|---|---|
| `$VIDEO_WORK` | the root of the per-video working folders |
| `$R2_STAGING` | the root of the R2 staging folders |
| `$UPLOAD_RUNS` | the root of the per-upload run folders |
| `$KOKORO_VENV` | the Python venv with `kokoro-onnx`, `faster-whisper`, `soundfile` and Pillow |
| `$KOKORO_MODELS` | the folder holding `kokoro-v1.0.onnx` and `voices-v1.0.bin` |
| `$KOKORO_LEXICON` | the shared pronunciation lexicon (`lexicon.json`) |
| `$R2_PUT` | the create-only upload script (`node "$R2_PUT" <file> <key>`) |

| Place | Path or key | What goes there | Who may write it |
|---|---|---|---|
| Box: video working folder | `$VIDEO_WORK/<slug>/` | `script.md` (narration, timed shot list, claim list, QA notes), `description.txt`, `fact-ruling.md`, `legal-ruling.md`, `art/01.jpg` to `art/08.jpg`, `build/` (scripts, `narration.wav`, `timeline.json`, `shots.json`, `plates/`, `clips/`, STT text), drafts and contact sheets. On a re-render, move the old take to `build/v1-backup/` first. | The producing desk (video bot). Fact and Legal write only their ruling files. |
| Box: R2 staging | `$R2_STAGING/videos/<slug>/` | The exact files that will be uploaded: MP4s, `.vtt` and manifest per version; posters and `art/` once per folder. Nothing else. | The producing desk. Never edit a file here after it is uploaded; make a new version. |
| Box: upload run folder | `$UPLOAD_RUNS/<slug>-r2-<date>/` | `upload-receipts.txt`, `readback.txt`, screenshots of the live player. | The producing desk. |
| Box: voice | `$KOKORO_VENV`, `$KOKORO_MODELS`, `$KOKORO_LEXICON` | Shared tooling. Add new pronunciations to the lexicon or a per-video `EXTRA_LEX`. | Any desk may use it. Changes to the venv or lexicon: note them in `script.md`. |
| R2: the post hero's bucket | `aitamer-bots` (public at `https://bots.aitamer.news/videos/<slug>/`) for a bot's post; `aitamer-media` (`https://media.aitamer.news/videos/<slug>/`) for a desk writer's post (section 9) | Per version: `<stem>-1080p.mp4`, `<stem>-720p.mp4`, `<stem>.en.vtt`, `<stem>.manifest.json` (v1 and later `-v2` stems side by side). Once per folder: `<slug>-poster.webp`, `<slug>-poster.jpg`, and `art/01.jpg` and up (backup of the source images). | The producing desk, create-only. Nobody overwrites or deletes. **Never `aitamer-media`.** |
| Repo: this guide | `docs/guides/video-protocol.md` | The protocol. | Any desk by PR. Docs-only PRs go through normal review. |
| Site: captions URL | `https://aitamer.news/videos/<slug>/<stem>.en.vtt` (bot bucket) or `https://aitamer.news/videos/media/<slug>/<stem>.en.vtt` (media bucket) | Not a file in the repo. The captions proxy (`functions/videos/[[path]].js`) fetches the R2 copy and serves it on our domain, so the `<track>` is same-origin. Never add a `.vtt` under `public/`: a static file would shadow the proxy. | Site code; changes need Wiz Cat's review. |
| Repo: post | `src/content/posts/<post-slug>.md` | The `selfHostedVideo` frontmatter block and any `corrections` entry. | The producing desk opens the PR; the EIC merges content PRs. |
| Repo: site code | `src/components/SelfHostedVideo.astro`, `src/content/post-schema.ts`, `scripts/csp-headers.mjs`, `POST.md` | The player, schema, CSP `media-src` and field docs. | Only by a site-code PR that **Wiz Cat reviews**. The EIC does not merge site code. |
| YouTube | `@aitamernews` (pending) | The same final MP4, the `.vtt` as a caption file, the description with the post link and AI note. | Wiz Cat or the EIC, by hand, at first. Bots never hold the channel password. |

## 3. Decisions so far (2026-10-27)

1. **Third-party embeds use an allowlist** (`allowlist.csv` in the ops workspace). Only rows with `verified_official = yes` qualify. Organiser-uploaded conference talks are fine without per-speaker checks. Media channels (CNBC and similar) are cleared video by video by Legal.
2. **Creators Wiz Cat likes** get their own `independent-creator` rows, verified the same way (their own site or verified socials link the channel) and cleared by EIC and Legal, one row per creator.
3. **No ads on video-centric posts.** When the site carries ads, any post built mainly around a video carries none (`noAds: true`, decided per post by the EIC; if in doubt, no ads). Sponsored posts never embed. Today the site has no ads.
4. **YouTube embeds are nocookie and click-to-load.** Nothing loads from Google or YouTube until the reader presses our labelled play button; then the player loads from `youtube-nocookie.com`. One click consents to one video; nothing is remembered.
5. **No `yt-dlp`** and no automated caption or transcript fetching from YouTube. Quotes come from the uploader's written sources or a human who watched.
6. **Our own videos go to YouTube and to R2.** R2 is the fallback and the source the site plays from. The YouTube upload waits for the channel.
7. **Source art is backed up to R2** under `videos/<slug>/art/`.
8. **Fact and Legal gates** are mandatory for every video, and YouTube gets its own Legal gate.
9. **Token-saving plan:** move the deterministic work into one `make_video` tool (section 12).
10. **Channel handle `@aitamernews`**, pending Wiz Cat creating the channel and verifying the account.

## 4. Roles and gates

Each gate writes its verdict (CLEAR, CLEAR with conditions, FIX, HOLD, STOP) into a file in the working folder. A video moves on only when the gate before it is CLEAR.

1. **EIC picks the story.** Usually a live post with a strong visual idea. The EIC names the slug and the post.
2. **Script.** The producing desk writes `script.md`: narration by beat, timed shot list, on-screen text, and a numbered **claim list**.
3. **Fact.** Checks every claim against the primary source and writes `fact-ruling.md`. Keep **the paper's numbers separate from the project's own claims** (in LEANN: "below 5%" and "up to 50x" from the paper; "60 million chunks in 6 GB" from the README, labelled on screen as the project's own claim). Lock the source version (LEANN: arXiv v2 and the proceedings, never v1). Check plate text and chart labels too, not only the narration.
4. **Legal.** Checks disclosure, art (no real people, logos, brands, characters, garbled pseudo-text), voice (licence, not presented as a person) and any quotes. Writes `legal-ruling.md`.
5. **Render.** Only after Fact and Legal are CLEAR or their fixes are applied. A render after fixes gets a new version stem (`-v2`).
6. **QA look.** Contact sheet, spot frames, STT transcript check, ffprobe, loudness (section 13).
7. **Upload** to the R2 bot bucket, then read back.
8. **Post PR.** Only the `selfHostedVideo` frontmatter in the post's own `.md`; no other file. The captions are already in R2. The EIC merges content PRs only. **Site code changes need Wiz Cat's review.**

## 5. Format

1. **Explainer: 2 to 3 minutes, about 300 to 420 words** of narration (LEANN: 421 words, 2:32).
2. **Beats, in order:** hook (about 15 s), what it is, how it works, why it matters, the catch, our take, end card **"Read more at aitamer.news"**.
3. **Not a slideshow.** YouTube renamed "repetitious content" to **"inauthentic content"** on 2025-07-15; templated slideshows, scrolling text and plain readouts of a page are not monetizable. Every video has its own visuals, motion on every shot, a rewritten script (not the post read aloud), and our verdict.
4. **No third-party footage, logos, screenshots or music.** No music at all in v1.
5. **Later formats:** Shorts (30 to 60 s, 9:16, their own script, never a crop of the long audio) and a weekly roundup (4 to 6 min, chapters). Not in v1.

## 6. Quick start: make a simple movie in 10 steps

This is the shortest path that meets the protocol: narration, still plates with a slow zoom, hard cuts, separate captions. The full LEANN pipeline (section 7) adds crossfades, eased pans and pronunciation fixes. Run on the box, on CPU.

**Step 1. Set up the folders.**

```bash
SLUG=my-explainer                     # lowercase slug, also the R2 folder name
STEM=$SLUG                            # a re-render after fixes becomes $SLUG-v2
W=$VIDEO_WORK/$SLUG
OUT=$R2_STAGING/videos/$SLUG
RUN=$UPLOAD_RUNS/$SLUG-r2-$(date +%F)
mkdir -p "$W/art" "$W/build/plates" "$W/build/clips" "$OUT" "$RUN"
cd "$W/build"
```

**Step 2. Write the script.** Put `script.md` in `$W` (beats, shot list, claim list), and the spoken text in `$W/narration.txt`: one sentence per line, a blank line between beats. Write numbers as spoken ("twenty twenty-six"). Get Fact and Legal CLEAR before step 4.

**Step 3. Synthesize the voice** (Kokoro-82M, voice `af_heart`, speed 1.0).

```bash
source "$KOKORO_VENV/bin/activate"
python3 - <<'PY'
import json, os, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
M = os.environ["KOKORO_MODELS"].rstrip("/") + "/"
k = Kokoro(M + "kokoro-v1.0.onnx", M + "voices-v1.0.bin")
SR = 24000; LEAD, GAP_S, GAP_B, TAIL = 0.6, 0.32, 0.85, 4.0
beats = [b.strip().split("\n") for b in open("../narration.txt").read().strip().split("\n\n")]
out, t, tl = [np.zeros(int(LEAD * SR), np.float32)], LEAD, []
for bi, sents in enumerate(beats):
    for si, s in enumerate(sents):
        a, sr = k.create(s, voice="af_heart", speed=1.0, lang="en-us")
        a = a.astype(np.float32); d = len(a) / sr
        tl.append({"b": bi, "s": si, "text": s, "start": round(t, 3), "end": round(t + d, 3)})
        g = GAP_S if si < len(sents) - 1 else (GAP_B if bi < len(beats) - 1 else TAIL)
        out += [a, np.zeros(int(g * SR), np.float32)]; t += d + g
sf.write("narration.wav", np.concatenate(out), SR)
json.dump(tl, open("timeline.json", "w"), indent=1, ensure_ascii=False)
print("duration", round(t, 2))
PY
```

Listen to it. If a word is wrong, respell it in `narration.txt` or use the lexicon path in `render_audio.py` (section 7).

**Step 4. Make the art.** 5 to 8 text-free 16:9 images in the house hero style ([`hero-image-style.txt`](hero-image-style.txt): paper-cut collage, no text, no logos, no people). Save as `$W/art/01.jpg` and up. No site mark in video art; the end card carries the address.

**Step 5. Make the plates** (one PNG per shot, 3840x2160, text drawn by code in DejaVu fonts). The simplest plate is art with one label:

```bash
python3 - <<'PY'
from PIL import Image, ImageDraw, ImageFont
W, H = 3840, 2160; FD = "/usr/share/fonts/truetype/dejavu/"
def plate(n, art, text):
    im = Image.open(f"../art/{art}.jpg").convert("RGB").resize((W, H), Image.LANCZOS)
    d = ImageDraw.Draw(im); f = ImageFont.truetype(FD + "DejaVuSerif-Bold.ttf", 150)
    x0, y0, x1, y1 = d.textbbox((220, 1700), text, font=f)
    d.rectangle((x0 - 60, y0 - 50, x1 + 60, y1 + 50), fill=(241, 232, 214))
    d.text((220, 1700), text, font=f, fill=(31, 42, 68))
    im.save(f"plates/p{n:02d}.png")
plate(1, "01", "Your hook in five words")
plate(2, "02", "What it is")
# ... one call per shot; the last plate is the end card "Read more at aitamer.news"
PY
```

For number cards and charts, copy `make_plates.py` from the LEANN build and edit its plate list.

**Step 6. Turn each plate into a clip with a slow zoom.** Set each shot's length in seconds from `timeline.json` (start of its first sentence to start of the next shot); the lengths must add up to the narration length.

```bash
clip () {  # clip <plate> <seconds> <out>
  N=$(python3 -c "print(round($2*30))")
  ffmpeg -y -v error -i "plates/$1.png" -vf "zoompan=z='1+0.06*on/($N-1)':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=$N:s=1920x1080:fps=30,format=yuv420p" \
    -frames:v "$N" -c:v libx264 -preset medium -crf 16 -pix_fmt yuv420p "clips/$3.mp4"
}
clip p01 14.8 00
clip p02 15.0 01
# ...
ls clips/*.mp4 | sed "s/^/file '/; s/$/'/" > clips.txt
```

**Step 7. Render the movie** (1080p CRF 22 and 720p CRF 23, H.264 High, yuv420p, 30 fps, AAC 128k 48 kHz stereo, loudness normalized, `+faststart`, no burned-in captions).

```bash
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 narration.wav)
ENC="-c:v libx264 -profile:v high -preset slow -pix_fmt yuv420p -r 30 -g 60 -c:a aac -b:a 128k -ar 48000 -ac 2 -movflags +faststart -t $DUR"
AF="loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000"
ffmpeg -y -v error -f concat -safe 0 -i clips.txt -i narration.wav -map 0:v -map 1:a -af "$AF" $ENC -crf 22 "$OUT/$STEM-1080p.mp4"
ffmpeg -y -v error -f concat -safe 0 -i clips.txt -i narration.wav -map 0:v -map 1:a -vf "scale=1280:720:flags=lanczos" -af "$AF" $ENC -crf 23 "$OUT/$STEM-720p.mp4"
```

If any MP4 ever lacks faststart, fix it without re-encoding: `ffmpeg -i in.mp4 -c copy -movflags +faststart out.mp4`.

**Step 8. Captions and poster.**

```bash
python3 - <<'PY'
import json
def ts(t): return f"{int(t//3600):02d}:{int(t%3600//60):02d}:{t%60:06.3f}"
T = json.load(open("timeline.json"))
with open("captions.srt", "w") as f:
    for i, x in enumerate(T, 1):
        f.write(f"{i}\n{ts(x['start']).replace('.', ',')} --> {ts(x['end']).replace('.', ',')}\n{x['text']}\n\n")
PY
ffmpeg -y -v error -i captions.srt "$OUT/$STEM.en.vtt"
# Posters belong to the folder, not the version: make them for the first version only.
if [ ! -e "$OUT/$SLUG-poster.jpg" ]; then
  ffmpeg -n -v error -ss 3 -i "$OUT/$STEM-1080p.mp4" -frames:v 1 -vf scale=1280:720 "$OUT/$SLUG-poster.jpg"
  ffmpeg -n -v error -i "$OUT/$SLUG-poster.jpg" -c:v libwebp -quality 82 "$OUT/$SLUG-poster.webp"
fi
```

The site builds the poster address from the folder (`key`) alone, so every version of a video shares one poster. A re-cut never regenerates it; once uploaded it is permanent. If a video truly needs a new poster, it needs a new `key` (a new R2 folder).

If you respelled a word for the voice ("A I tamer dot news"), fix the cue text back to the written form. Long sentences: split them into cues of at most two 42-character lines (`make_captions.py` does this).

**Step 9. Check it.**

```bash
ffprobe -v error -show_entries stream=codec_name,profile,width,height,pix_fmt,r_frame_rate,sample_rate,channels:format=duration -of compact "$OUT/$STEM-1080p.mp4"
ffprobe -v trace "$OUT/$STEM-1080p.mp4" 2>&1 | grep -m2 -oE "type:'(moov|mdat)'"     # moov must come first
ffmpeg -hide_banner -nostats -i "$OUT/$STEM-720p.mp4" -vn -af ebur128 -f null - 2>&1 | grep -A1 "Integrated"   # about -15 LUFS
ffmpeg -y -v error -i narration.wav -ar 16000 -ac 1 stt.wav    # faster-whisper gets a 16 kHz array (its own file decoder fails in this venv)
python3 -c "import soundfile as sf; from faster_whisper import WhisperModel as M; a,_=sf.read('stt.wav',dtype='float32'); s,_=M('base.en',device='cpu',compute_type='int8').transcribe(a); open('stt.txt','w').write(' '.join(x.text.strip() for x in s))"
ffmpeg -y -v error -i "$OUT/$STEM-1080p.mp4" -vf "fps=1/6,scale=480:-1,tile=5x6" -frames:v 1 "$W/$STEM-contact-sheet.png"
```

Read `stt.txt` against `narration.txt` (homophones and numerals may differ; words may not). Look at the contact sheet: no garbled text, no cut-off labels, no black frames.

**Step 10. Manifest, upload, read back.** Write `$OUT/$STEM.manifest.json` (section 9), upload this version's files create-only (plus posters and `art/` if this is the folder's first version), read each one back, then open the post PR (section 10).

## 7. Full production pipeline (as in LEANN)

The LEANN build lives in `$VIDEO_WORK/pilot-leann/build/`. Copy it as the starting point for a polished video.

1. **Storyboard.** `script.md` with narration per beat, a timed shot list (time, beat, visual, on-screen text, motion), pronunciation notes and the claim list. `beats.py` holds the same narration as `BEATS = [(beat_name, [sentences])]` plus `EXTRA_LEX` pronunciations.
2. **Voice.** `render_audio.py`: Kokoro-82M through `kokoro-onnx` in `$KOKORO_VENV` on CPU, voice `af_heart`, speed 1.0, `lang="en-us"`, phonemes from the shared lexicon plus `EXTRA_LEX`, edges trimmed and faded, 0.6 s lead, 0.32 s between sentences, 0.85 s between beats, 4 s tail. Writes `narration.wav` (24 kHz) and `timeline.json` (sentence start and end times).
3. **Fix-ups without a full re-take.** `render_audio_v2.py` re-synthesizes only changed sentences and reuses the old take sample for sample. Back up the old take to `build/v1-backup/` first.
4. **Art.** 5 to 8 text-free images in the house hero style (LEANN used 6). Legal checks them on a contact sheet.
5. **Plates.** `make_plates.py` draws 3840x2160 plates: art with baked-on labels, number cards, bar charts and the end card. Fonts: DejaVu Serif Bold for titles, DejaVu Sans and Sans Bold for labels, DejaVu Sans Mono for commands. House colours are in the file. Every chart names its source on the plate.
6. **Clips.** `build_clips_v2.py` cuts each shot between sentence boundaries from `timeline.json`, renders a zoompan clip per plate with smoothstep easing (start and end zoom and centre per shot), and writes `shots.json` (shot bounds).
7. **Render.** `render_nocaps_r2_v2.py` chains the clips with 0.6 s `xfade` crossfades, normalizes audio (`loudnorm=I=-14:TP=-1.5:LRA=11`, measured about -15 LUFS integrated on LEANN v2), and encodes 1920x1080 30 fps H.264 High yuv420p CRF 22 plus 1280x720 CRF 23, AAC 128k 48 kHz stereo, `+faststart`, `-preset slow`, `-g 60`. **Caption-free.** Captions ship as a separate `.vtt`.
8. **Captions.** `make_captions.py` builds cues from `timeline.json` (at most two 42-character lines); convert the SRT to WebVTT.
9. **QA.** faster-whisper `base.en` transcript (`stt.txt`), contact sheet, spot frames at the timestamps Fact names, ffprobe, loudness. Record the results in `script.md`.
10. **Versioning.** A re-render after fixes gets a new stem: `<slug>-v2-1080p.mp4`, `<slug>-v2-720p.mp4`, `<slug>-v2.en.vtt` and its own `<slug>-v2.manifest.json`, which names the stem it supersedes. Old files and old manifests stay in R2 unchanged; nothing already uploaded is edited to mark it superseded. The posters and `art/` from the first version are reused.

## 8. Disclosure

1. Legal's exact line, shown **on the page directly under the player** (the `disclosure` field), and in the YouTube description:

   > AI use: narration is a synthetic voice (Kokoro-82M). The illustrations were made with AI for aitamer.news. The script was written and checked by the aitamer.news desk.

2. Do not shorten it. "Visuals generated for aitamer.news" was rejected because it does not say the visuals are AI-made.
3. If the tools change (another voice, a presenter, footage), Legal writes a new line before render.
4. **Never present the voice as a real person.** No narrator name, no "I'm ..." lines, no real face or name paired with the voice.
5. On YouTube, also set the Studio "AI use" (altered or synthetic content) setting when a video could look realistic. Our illustrations are not realistic, but Legal decides per video.

## 9. R2 storage

1. **Bucket:** the post hero's bucket (Michel, 2026-11-01). A bot's post, with its hero on `bots.aitamer.news`, uses the bot bucket `aitamer-bots`, public at `https://bots.aitamer.news/`; a bot never writes to `aitamer-media`. A desk writer's post, with its hero on `media.aitamer.news`, uses the media bucket `aitamer-media` under the same `videos/<slug>/` keys. The site picks the host from `heroImage`.
2. **Keys** under `videos/<slug>/`. Every key is written exactly once, so each one is either per version (contains the stem) or per folder (uploaded with the first version and reused by every later one):
   - per version: `<stem>-1080p.mp4`, `<stem>-720p.mp4`, `<stem>.en.vtt`, `<stem>.manifest.json`;
   - per folder: `<slug>-poster.webp` and `<slug>-poster.jpg` (1280x720), and `art/01.jpg` and up (a backup of the source images).
3. **Manifest, one per version** (`<stem>.manifest.json`): slug, stem, version, title, prefix, captions key, poster keys, the disclosure line, the article URL, `supersedes` (the previous stem, or `null` for the first version), and for every file of this version its `key`, `bytes`, `sha256`, `mime`, `duration_s` (video and captions), width and height, codecs, `faststart`, `burned_in_captions: false`. List the shared posters and `art/` keys too, with their sha256, so each manifest is complete on its own. A manifest is never rewritten: the newest manifest is the current version, and older ones stay as they were. Get the numbers with `stat -c %s` and `sha256sum`. (LEANN's v1 used a single `manifest.json` key, written before this rule; it describes v1 only and stays as it is.)
4. **Upload create-only.** The upload script (`node "$R2_PUT" <file> <key>`) signs a PUT with `If-None-Match: *`, the right `Content-Type` per extension (`video/mp4`, `image/webp`, `image/jpeg`, `text/vtt`, `application/json`) and `Cache-Control: public, max-age=31536000, immutable`. The bucket keys come from the environment; never print them. Upload the per-folder files only with a folder's first version.
5. **No HEAD or GET before upload.** Just PUT. **A 412 means the key exists: stop.** Do not retry under force. Then read the existing key back and compare its sha256 with your local file:
   - **Same sha256:** that file was already uploaded (for example, an upload that stopped half-way). Record it in the receipts and carry on with the next file.
   - **Different sha256, per-version key:** you are reusing a stem. Render again under a new stem.
   - **Different sha256, per-folder key** (poster, `art/`): you regenerated a file that must be reused. Restore the uploaded copy into staging from the public host and use it; a truly new poster needs a new `key` (a new folder).
6. **Never overwrite or delete** anything in the bucket.
7. **Read back after upload**, for every key you uploaded in this run, from the public host. The script writes `readback.txt` in the run folder and exits non-zero if any check fails:

   ```bash
   HOST=https://bots.aitamer.news        # the post hero's host: https://media.aitamer.news for a desk writer's post
   U=$HOST/videos/$SLUG
   KEYS=("$STEM-1080p.mp4" "$STEM-720p.mp4" "$STEM.en.vtt" "$STEM.manifest.json")
   if [ "$FIRST_VERSION" = yes ]; then              # this run also uploaded the per-folder files
     KEYS+=("$SLUG-poster.webp" "$SLUG-poster.jpg")
     for a in "$OUT"/art/*.jpg; do KEYS+=("art/$(basename "$a")"); done
   fi
   RB=$(mktemp -d)
   {
     fail=0
     for f in "${KEYS[@]}"; do
       case "$f" in
         *.mp4) want=video/mp4 ;; *.webp) want=image/webp ;; *.jpg) want=image/jpeg ;;
         *.vtt) want=text/vtt ;; *.json) want=application/json ;; *) want=unknown ;;
       esac
       code=$(curl -sS -D "$RB/head" -o "$RB/body" -w '%{http_code}' "$U/$f") || code=000
       type=$(grep -i '^content-type:' "$RB/head" | tr -d '\r' | cut -d' ' -f2- | cut -d';' -f1)
       cache=$(grep -i '^cache-control:' "$RB/head" | tr -d '\r' | cut -d' ' -f2-)
       remote=$(sha256sum < "$RB/body" | cut -d' ' -f1)
       local_=$(sha256sum < "$OUT/$f" | cut -d' ' -f1)
       if [ "$code" = 200 ] && [ "$type" = "$want" ] && [ "$remote" = "$local_" ] && [[ "$cache" == *immutable* ]]; then r=PASS; else r=FAIL; fail=1; fi
       echo "$r $f status=$code type=$type cache=\"$cache\" bytes=$(stat -c %s "$RB/body") sha256=$remote local=$local_"
     done
     for f in "$STEM-1080p.mp4" "$STEM-720p.mp4"; do
       code=$(curl -sS -o /dev/null -r 0-1023 -w '%{http_code}' "$U/$f") || code=000
       if [ "$code" = 206 ]; then echo "PASS range $f 206"; else echo "FAIL range $f $code"; fail=1; fi
     done
     [ "$fail" = 0 ] && echo "result: PASS" || echo "result: FAIL"
   } > "$RUN/readback.txt"
   rm -r "$RB"
   cat "$RUN/readback.txt"
   grep -qx 'result: PASS' "$RUN/readback.txt"
   ```

   Pass: every line PASS: status 200, the expected Content-Type, `immutable` caching, sha256 equal to the staged file, and 206 on a Range request for both MP4s.
8. **Captions live in R2 next to the video** (`videos/<slug>/<stem>.en.vtt`). The page loads them from our own domain at `/videos/<slug>/<stem>.en.vtt`, where the captions proxy serves the R2 copy (GET and HEAD only, caption paths only, upstream 200 only, at most 1 MB). The bucket has no CORS policy and does not need one. Read back `https://aitamer.news/videos/<slug>/<stem>.en.vtt` after the deploy: 200, `text/vtt`, same sha256 as R2.

## 10. Site embed

Uses the site code from PR #357, merged through #361 on 2026-10-28 (`SelfHostedVideo` component, `selfHostedVideo` frontmatter schema, captions proxy, CSP `media-src 'self' https://bots.aitamer.news`).

1. **Frontmatter** in the post (the LEANN example from PR #358):

   ```yaml
   selfHostedVideo:
     key: leann-explainer
     stem: leann-explainer-v2
     title: "This vector index throws away its vectors (LEANN, an MLSys 2026 best paper)"
     description: "A 2:32 aitamer.news explainer: how LEANN keeps a pruned graph instead of stored embeddings and recomputes the few it needs at search time."
     durationSeconds: 152
     uploadDate: "2026-10-27"
     disclosure: "AI use: narration is a synthetic voice (Kokoro-82M). The illustrations were made with AI for aitamer.news. The script was written and checked by the aitamer.news desk."
   ```

   `key` is the R2 folder (posters are `<key>-poster.webp` and `.jpg`). `stem` defaults to `key`; set it for a re-cut. The `.vtt` must be in R2 at `videos/<key>/<stem>.en.vtt` before the post merges; nothing goes in the repo besides the post. Field docs: `POST.md`.
2. **The component** (`src/components/SelfHostedVideo.astro`) renders a plain `<video>` above the body with both MP4 sources, the poster, the captions track and the disclosure line under the player. No third-party player, no script, no tracker, no analytics pixel for the video.
3. **CSP:** `media-src 'self' https://bots.aitamer.news https://media.aitamer.news` (in `scripts/csp-headers.mjs`). Any change is site code. Captions load from `/videos/<key>/<stem>.en.vtt` for the bot bucket and `/videos/media/<key>/<stem>.en.vtt` for the media bucket.
4. **JSON-LD:** the component emits a `VideoObject` (name, description, thumbnail, upload date, duration, content URL) from the frontmatter.
5. **Corrections:** when a video changes facts on a live post, add a dated entry to the post's `corrections` list (ISO time, plain sentence of what changed), as in #358. A re-cut video also gets a new stem.

## 11. YouTube channel (pending)

Waiting for Wiz Cat to create **`@aitamernews`** under a **Brand Account** with **2-Step Verification**, then advanced features access. Until then, nothing is uploaded to YouTube.

1. **Every video goes to YouTube and to R2.** R2 is the fallback and what our site plays.
2. The **description links back to the post** and carries the sources, chapters and the AI-use line (`description.txt` in the working folder).
3. A **YouTube upload needs its own Legal gate.** The site CLEAR does not cover YouTube.
4. Upload as Private, check, then schedule Public. Wiz Cat or the EIC does it by hand at first. Bots never hold the channel password; any later automation uses narrowly scoped OAuth.
5. Upload the `.vtt` as a caption file. Do not burn in captions.
6. **Ads:** none on posts built mainly around a video. **Monetization (YouTube Partner Program)** needs 1,000 subscribers plus 4,000 watch hours in 12 months (or 10 million Shorts views in 90 days). Plan for zero revenue in year one.
7. Once the channel exists, add it to the allowlist (`own` section) so our own videos can also be embedded under the embed policy.

## 12. Cost and tokens

1. **Rendering is free:** CPU on the box, open models, ffmpeg, the bot bucket.
2. **Tokens are the real cost**, spent on agent steps: writing, reading build scripts, re-running commands, checking frames.
3. **Roadmap:**
   - a deterministic **`make_video` tool or MCP**: a storyboard JSON in (beats, sentences, shots, plate specs, slug, stem), one line out (paths, duration, sizes, sha256, QA pass or fail);
   - **local image generation on Wiz Cat's GPUs** for the art;
   - a target of **tens of thousands of tokens per video**, end to end.

## 13. Checklists

**Before render**
- [ ] EIC picked the story and slug.
- [ ] `script.md` has narration (300 to 420 words), timed shot list and claim list.
- [ ] Fact CLEAR, with paper numbers and project claims labelled apart, on screen and in narration.
- [ ] Legal CLEAR: disclosure line, art, voice, quotes.
- [ ] No third-party footage, logos, screenshots, slides or music anywhere.
- [ ] Every chart names its source.
- [ ] Any paid tool approved by Wiz Cat (default: none).

**After render (QA)**
- [ ] 1080p and 720p exist, H.264 High, yuv420p, 30 fps, AAC 128k 48 kHz stereo.
- [ ] `moov` before `mdat` (faststart).
- [ ] Integrated loudness about -15 LUFS (-14 target).
- [ ] No burned-in captions; `.vtt` matches the narration word for word.
- [ ] faster-whisper transcript matches the script.
- [ ] Contact sheet looked at: no garbled text, no clipped labels, no black frames.
- [ ] End card says "Read more at aitamer.news".
- [ ] Re-render after fixes uses a new stem (`-v2`); posters and `art/` were not regenerated.

**Upload**
- [ ] Bucket is the hero's: `aitamer-bots` for a bot's post, `aitamer-media` for a desk writer's; keys under `videos/<slug>/`.
- [ ] This version's MP4s, `.vtt` and `<stem>.manifest.json`; posters (webp and jpg) and `art/` only with the folder's first version.
- [ ] Manifest has bytes, sha256, mime, duration for each file, and `supersedes`.
- [ ] Create-only PUT, no HEAD or GET first; on any 412, stopped and compared sha256 (section 9, item 5).
- [ ] Readback script ended `result: PASS`: 200, Content-Type, `immutable`, sha256, 206 on Range for both MP4s; `readback.txt` saved in the run folder.

**Post PR**
- [ ] `selfHostedVideo` block with the exact disclosure line.
- [ ] `<stem>.en.vtt` is in R2 (read back 200); nothing added under `public/`. The PR changes only the post's `.md`.
- [ ] Dated `corrections` entry if facts changed on a live post.
- [ ] No site code in a content PR. Site code goes in its own PR for Wiz Cat's review.

**YouTube (when the channel exists)**
- [ ] Separate Legal CLEAR for YouTube.
- [ ] Description links the post and carries the AI-use line.
- [ ] Captions uploaded as a file; uploaded Private first.

## 14. Changelog

| Version | Date | Change |
|---|---|---|
| v1 | 2026-10-27 | First version, from the LEANN pilot (`leann-explainer`, v1 and v2 renders, R2 upload, PRs #357 and #358). |
| v1.1 | 2026-10-30 | Create-only made consistent: one manifest per version (`<stem>.manifest.json`, with `supersedes`) instead of rewriting `manifest.json`; posters and `art/` are per folder, uploaded once and never regenerated; what to do on a 412; readback script now checks status, type, caching, sha256 and Range for both MP4s and every uploaded key, writes `readback.txt` and fails on any miss; box paths replaced by variables; #357 status updated. |
