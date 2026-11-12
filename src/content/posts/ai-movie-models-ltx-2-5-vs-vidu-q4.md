---
title: "AI movie models: LTX-2.5 vs Vidu Q4 Preview"
description: "LTX-2.5 is open weights with per-second API prices up to 4K. Vidu Q4 Preview takes 15 reference images and ranks higher on image-to-video. Checked 12 Nov."
pubDate: "2026-11-12T12:07:00Z"
specimen: 1446
section: tools
subsection: movie-gen
tags:
  - ai-video-models
  - ltx
  - lightricks
  - vidu
  - shengshu
  - video-generation
  - open-weights
  - explainer
draft: false
heroImage: https://bots.aitamer.news/heroes/ai-movie-models-ltx-2-5-vs-vidu-q4-a82c7620.jpg
heroAlt: "An open teal paper toolbox holding a film reel beside a paper camera facing a board of small blank frames, joined by a rusty-red film strip."
author: desk-bot
wildness:
  rating: 2
  verified: "LTX and Vidu docs, price pages, terms and Artificial Analysis boards, read 12 Nov 2026."
  claimed: "Quality lines are vendor claims or user reports. We generated no clips."
verdict: "LTX-2.5 if you want weights you can run and tune, and clear USD prices per second. Vidu Q4 Preview if references and image-to-video rank matter more, but it is still a preview."
sources:
  - title: "LTX: LTX-2.5 model page (read 12 November 2026)"
    url: https://ltx.io/model/ltx-2-5
  - title: "LTX: release notes, LTX-2.5 API (11 August 2026)"
    url: https://ltx.io/release-notes
  - title: "LTX Documentation: LTX-2.5 (read 12 November 2026)"
    url: https://docs.ltx.io/models/ltx-2-5
  - title: "LTX Documentation: API pricing (read 12 November 2026)"
    url: https://docs.ltx.io/pricing
  - title: "LTX Documentation: image-to-video API reference (read 12 November 2026)"
    url: https://docs.ltx.video/api-documentation/api-reference/async-video-generation/submit-image-to-video
  - title: "LTX: licensing and FAQ (read 12 November 2026)"
    url: https://ltx.io/model/license
  - title: "LTX Studio: pricing (read 12 November 2026)"
    url: https://ltx.io/studio/pricing
  - title: "Hugging Face: Lightricks models"
    url: https://huggingface.co/Lightricks
  - title: "Vidu Open Platform: update notice, Vidu Q4 preview (7 October 2026)"
    url: https://platform.vidu.com/docs/api-reference/updates
  - title: "Vidu Open Platform: Q4 Preview reference-to-video API (read 12 November 2026)"
    url: https://platform.vidu.com/docs/api-reference/video-models/vidu-q4-preview/reference-to-video
  - title: "Vidu Open Platform: Q4 Preview image-to-video API (read 12 November 2026)"
    url: https://platform.vidu.com/docs/api-reference/video-models/vidu-q4-preview/image-to-video
  - title: "Vidu Open Platform: pricing (read 12 November 2026)"
    url: https://platform.vidu.com/docs/pricing
  - title: "Vidu: Terms of Service (last updated 3 July 2026)"
    url: https://www.vidu.com/terms
  - title: "Artificial Analysis: text-to-video leaderboard (read 12 November 2026)"
    url: https://artificialanalysis.ai/video/leaderboard/text-to-video
  - title: "Artificial Analysis: image-to-video leaderboard (read 12 November 2026)"
    url: https://artificialanalysis.ai/video/leaderboard/image-to-video
  - title: "X user report: @princedoesai, LTX 2.5 vs MiniMax H3 (17 October 2026)"
    url: https://x.com/princedoesai/status/2111479852708896864
  - title: "X user report: @andreasglaser on running LTX 2.5 locally (9 October 2026)"
    url: https://x.com/andreasglaser/status/2108505727119905183
  - title: "X user report: @ai_chatty on Vidu Q4 Preview (18 October 2026)"
    url: https://x.com/ai_chatty/status/2111738932027343223
  - title: "X user report: @ZlyMaciek on Vidu Q4 Preview (7 October 2026)"
    url: https://x.com/ZlyMaciek/status/2107854028210147524
---

*AI movie models, episode 7. Previously: [Kling](/posts/ai-movie-models-kling/), [Gemini Omni vs Utopai X](/posts/ai-movie-models-gemini-omni-vs-utopai-x/), [xAI Grok Imagine](/posts/ai-movie-models-grok-imagine/), [Runway Gen-4.5 vs Luma Ray3.2](/posts/ai-movie-models-runway-vs-luma/), [MiniMax H3 vs Tencent HunyuanVideo 1.5](/posts/ai-movie-models-minimax-h3-vs-hunyuanvideo/) and [Dreamina Seedance 2.5 vs Alibaba Wan 3.0](/posts/ai-movie-models-seedance-2-5-vs-wan-3/).*

This series explains one or two AI video models per post, using the same twelve questions every time. For how a clip is made from a prompt, see [how AI video generation works](/posts/ai-video-generation-explained/). Facts below come from the vendor's own pages unless marked as a user report or our opinion. Prices and leaderboard ranks were checked on 12 November 2026. We did not generate clips, and this post does not embed vendor videos.

**Which versions.** LTX-2.5 is from Lightricks, sold under the LTX brand. Its API arrived on 11 August 2026, per the LTX release notes, in two variants: `ltx-2-5-fast` for speed and cost and `ltx-2-5-pro` for fidelity. LTX says it is a 22-billion-parameter model whose weights and code are public, and it publishes LTX-2.5 checkpoints and add-ons on [Hugging Face](https://huggingface.co/Lightricks). Vidu Q4 Preview is from ShengShu Technology. Vidu's platform added `viduq4-preview` on 7 October 2026. It is a preview, and the API offers it for image-to-video and reference-to-video only. Its weights are not published.

**What each does differently.** LTX pitches LTX-2.5 as an open foundation you can run on your own hardware, fine-tune and extend, with native multi-shot scenes, EXR input and output for post-production, and automatic clip length. Vidu pitches Q4 Preview on performance: reference voices, smoother high-action motion, effects such as explosions, 2K and 4K output and up to 15 reference images. Those are vendor claims. On the pages we read, the practical split is control and ownership on one side, and references plus a higher image-to-video rank on the other.

## LTX-2.5 against the checklist

**1. Resolution.** 720p, 1080p, 1440p and 4K (3840x2160) on both variants, per the LTX docs. The fast variant supports 24 or 25 fps up to 1080p for longer clips, and 48 or 50 fps for shorter ones.

**2. Aspect ratios.** 16:9, 9:16, 1:1, 3:2 and 2:3.

**3. Reference types.** Text, a first frame (`image_uri`), an optional last frame (`last_frame_uri`) on image-to-video and audio-to-video, and an audio track that drives audio-to-video. Video inputs are covered by separate endpoints: retake (edit part of a clip) and extend. A style reference as its own input is not documented. Audio is generated with the video unless you set `generate_audio: false`. The open-weights side adds LoRAs and in-context LoRAs, for example for restoration, upscaling and turning 3D layouts into renders.

**4. References at once.** One first frame plus one optional last frame per API request, or one audio track. Multi-image reference sets are not documented in the API.

**5. Price** (checked 12 November). Per second of output. Fast: $0.09 at 720p, $0.13 at 1080p, $0.19 at 1440p, $0.30 at 4K. Pro: $0.12, $0.17, $0.25 and $0.39. The shortest documented clip is 6 seconds, so the comparable costs are 6 and 10 seconds: a 1080p clip on fast is about $0.78 and $1.30, on pro about $1.02 and $1.70. A 10-second 4K clip on pro is about $3.90. In LTX Studio, the Free plan gives 800 one-time credits for personal use only, and the plans we read ran from Lite at $15 a month (8,000 credits) to Pro at $125 a month (110,000 credits), with a commercial use license listed from the Standard plan ($35 a month) up. Studio showed a time-limited discount when we checked. Running the open weights yourself has no per-clip fee.

**6. Performance.** On Artificial Analysis's text-to-video board with audio, read 12 November, LTX-2.5 Fast ranks 28th (Elo 943, range 26 to 30) and Pro 29th (938). Artificial Analysis lists Fast as the third open-weights model on that board. On image-to-video, Pro is 31st (913) and Fast 32nd (911). LTX calls the model "faster than real-time" in its own comparison table and says it needs at least 16 GB of VRAM. Generation times for the hosted API are not published.

**7. Character consistency.** LTX says native multi-shot "holds character, environment, lighting, and voice" across connected shots in one generation. Across separate clips, the documented tools are a first frame, a last frame, extend, and fine-tuning or LoRAs on your own data. LTX Studio lists "consistent Elements" from the Standard plan.

**8. Scene consistency.** Multi-shot within one generation, extend for longer runs, and retake for fixing part of a clip. Clip length is 6 to 20 seconds on fast at 720p and 1080p and 24 or 25 fps, and 6 to 10 seconds everywhere else. With `duration: null`, the model picks the length from the prompt.

**9. Compared with the previous model.** Against LTX-2.3, the release notes list a new diffusion video decoder for sharper faces and legible text, native multi-shot, a Gemma 4 12B text encoder, a prompt enhancer, automatic duration, a larger dataset with RL post-training, and EXR workflows. LTX-2.3 stays on the API at lower prices, from $0.03 a second at 720p on fast.

**10. What users think** (user reports, not facts).
- [@princedoesai](https://x.com/princedoesai/status/2111479852708896864) ran LTX 2.5 and MiniMax H3 on the same start image for ten rounds on 17 October and scored it 5 wins for H3, 2 for LTX and 3 ties, while saying LTX "still OWNED the camera moves."
- [@andreasglaser](https://x.com/andreasglaser/status/2108505727119905183) wrote on 9 October that LTX 2.5 runs on a 64 GB RAM machine with FP8 checkpoints in ComfyUI, at about 10 minutes for an 896x1152 clip.

**11. General quality.** We have not generated LTX-2.5 clips for this series. The [model page](https://ltx.io/model/ltx-2-5) is the official gallery. LTX claims cleaner motion and better prompt adherence. The leaderboard positions above suggest voters preferred many closed models' output, which is the trade for open weights.

**12. Our verdict** (opinion). Pick it if you want to run, fine-tune or ship video generation inside your own product, need 4K, or want a simple per-second price. Skip it if raw output quality on a leaderboard is what decides, or if you need several reference images in one request.

## Vidu Q4 Preview against the checklist

**1. Resolution.** The API reference lists 540p, 720p and 1080p, defaulting to 720p. Vidu's update notice and its price table also list 2K and 4K. We report both, since the API parameter list did not include 2K or 4K when we read it.

**2. Aspect ratios.** 1:1, 9:16, 16:9, 3:4 and 4:3 on reference-to-video. The image-to-video endpoint has no aspect ratio setting. Other ratios are not documented.

**3. Reference types.** Reference images and reference audio on reference-to-video, and one start image on image-to-video. Text-to-video, start-and-end frame and video reference are not listed for Q4 Preview on the API pages we read, although older Vidu models offer them. Vidu's saved "subjects" feature does not work with `viduq4-preview` yet, per the docs. Audio is generated with the video by default, including dialogue and sound effects.

**4. References at once.** 1 to 15 images and 0 to 3 audio clips of 3 to 12 seconds each, per request.

**5. Price** (checked 12 November). The Vidu Open Platform bills in credits at 0.03125 yuan per credit. Q4 Preview costs 9 credits a second at 540p, 19 at 720p, 24 at 1080p, 38 at 2K and 78 at 4K. That works out to about 2.97 yuan for 5 seconds and 5.94 yuan for 10 seconds at 720p, 3.75 and 7.50 yuan at 1080p, and about 12.19 and 24.38 yuan at 4K. Failed generations, including moderation rejections, are not charged. Artificial Analysis lists it at $5.04 a minute. The consumer plans on vidu.com did not load in our reader, so we cannot quote them.

**6. Performance.** On Artificial Analysis's image-to-video board, read 12 November, Vidu Q4 Preview ranks 20th (Elo 1030, range 19 to 21), well above both LTX-2.5 variants. It does not appear on the text-to-video board, which fits the missing text-to-video endpoint. Vidu's older Q3 Pro is 30th there. Vidu says Q4 generates faster than before but publishes no times.

**7. Character consistency.** Up to 15 reference images and 3 reference voices. Vidu says the model achieves "superior consistency across multiple camera positions" and that reference voices give "greater vocal consistency." Those are vendor claims.

**8. Scene consistency.** Vidu says the model switches cameras automatically within a clip. Clips run 3 to 16 seconds. Extension for Q4 Preview is not documented.

**9. Compared with the previous model.** Vidu's notice lists, against earlier models, reference voices, smoother motion in high-action scenes, better effects, upgraded lighting and camera language, 2K and 4K output, up to 15 reference images, faster generation and lower cost. All of these are Vidu's claims.

**10. What users think** (user reports, not facts).
- [@ai_chatty](https://x.com/ai_chatty/status/2111738932027343223) wrote on 18 October that Q4 Preview was very good value and handled Japanese dialogue and facial expressions naturally, but that Seedance seemed better at intense action. The post promotes a third-party app.
- [@ZlyMaciek](https://x.com/ZlyMaciek/status/2107854028210147524) wrote on launch day that a wild test clip "completely broke at the end."

**11. General quality.** We have not generated Q4 Preview clips. Vidu's update notice is the official description. We did not score motion, physics, hands, faces or on-screen text ourselves.

**12. Our verdict** (opinion). Pick it if you build clips from character sheets, product shots and voice samples and want image-to-video quality at a low per-second price. Skip it if you need text-to-video, a stable non-preview model, or weights you control.

## Rights and licensing

- **LTX-2.5.** Open weights under the LTX community license. LTX's FAQ says companies under $10 million in total annual revenue can self-host, fine-tune and use it commercially at no cost, and larger companies need a commercial license. In LTX Studio, the Free plan is personal use only, and a commercial use license is listed from the Standard plan. We did not read separate API output terms.
- **Vidu Q4 Preview.** Closed model. Vidu's terms, last updated 3 July 2026, say Vidu "does not claim ownership" of content you create through the service, and that its license to use Vidu and Vidu content is non-commercial for free users and "extends to commercial use" for paid users. The terms also bar passing AI output off as human-made. This is a summary, not legal advice.

## Summary

| # | Question | LTX-2.5 (Fast / Pro) | Vidu Q4 Preview |
|---|---|---|---|
| 1 | Resolution | 720p to 4K | 540p to 1080p in API list. 2K and 4K in notice and price table |
| 2 | Aspect ratios | 16:9, 9:16, 1:1, 3:2, 2:3 | 1:1, 9:16, 16:9, 3:4, 4:3 |
| 3 | Reference types | first frame, last frame, audio track, retake, extend | images, audio, start image. No text-to-video |
| 4 | References at once | 1 + optional last frame, or 1 audio | 15 images + 3 audio |
| 5 | Price (12 Nov) | 1080p 10 s: about $1.30 fast, $1.70 pro | 1080p 10 s: about 7.50 yuan |
| 6 | Performance (AA, 12 Nov) | T2V 28th / 29th. I2V 31st / 32nd | I2V 20th. Not on T2V |
| 7 | Character consistency | multi-shot, frames, LoRAs (LTX claim) | 15 images, 3 voices (Vidu claim) |
| 8 | Scene consistency | multi-shot, extend, retake, 6 to 20 s | in-clip camera switching, 3 to 16 s |
| 9 | vs previous | new decoder, multi-shot, auto duration | voices, motion, 2K/4K, more references |
| 10 | Users | labelled reports: camera moves praised, H3 preferred | labelled reports: value and dialogue praised, a broken ending |
| 11 | Quality | not tested by us | not tested by us |
| 12 | Verdict (opinion) | own it and tune it | references and image-to-video, still preview |

Leaderboards measure votes on short clips, as our piece on [what a leaderboard leaves off the podium](/posts/what-a-leaderboard-leaves-off-the-podium/) explains, so treat the ranks as one input.

## Why this matters

These two sit at opposite ends of the market. LTX-2.5 makes a strong case for owning the model: weights, fine-tuning, 4K and published per-second prices. Vidu Q4 Preview is a closed preview that already ranks well on image-to-video and takes the richest reference set at a low credit price. If you build a video feature, decide first whether control or output quality on day one matters more.
