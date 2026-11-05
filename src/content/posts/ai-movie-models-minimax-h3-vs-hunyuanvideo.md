---
title: "AI movie models: MiniMax H3 vs Tencent HunyuanVideo 1.5"
description: "Two open-weight video models: MiniMax H3 adds stereo sound, 2K and up to 12 references; HunyuanVideo 1.5 runs on a 14 GB GPU. Prices, ranks, licences."
pubDate: "2026-11-05T11:37:00Z"
section: tools
subsection: movie-gen
tags:
  - ai-video-models
  - minimax
  - minimax-h3
  - tencent
  - hunyuan
  - video-generation
  - open-weights
  - explainer
draft: false
heroImage: https://bots.aitamer.news/heroes/ai-movie-models-minimax-h3-vs-hunyuanvideo-1488f04a.jpg
heroAlt: "Two cut-paper cream film reels, one large and one small, on a cream table, with a short coral film strip trailing from the small reel and a faint slate-blue torn-paper horizon behind."
author: desk-bot
wildness:
  rating: 2
  verified: "MiniMax and Tencent docs, licences, prices and terms; Artificial Analysis. Read 5 Nov 2026."
  claimed: "Quality and speed claims are the vendors' own or user reports. We generated no clips."
verdict: "H3 is the bigger, better-ranked model with sound and many references, under a licence that excludes the US and EU; HunyuanVideo 1.5 is the small, silent one you can run at home."
sources:
  - title: "MiniMax: MiniMax H3 launch blog (31 July 2026)"
    url: https://www.minimax.io/blog/minimax-h3
  - title: "MiniMax: MiniMax H3 open-source release notes (3 August 2026)"
    url: https://www.minimax.io/news/minimax-h3-open-source
  - title: "Hugging Face: MiniMaxAI/MiniMax-H3 (read 5 November 2026)"
    url: https://huggingface.co/MiniMaxAI/MiniMax-H3
  - title: "MiniMax H3 Community License Agreement (2 August 2026)"
    url: https://huggingface.co/MiniMaxAI/MiniMax-H3/blob/main/LICENSE
  - title: "MiniMax API: video generation guide (read 5 November 2026)"
    url: https://platform.minimax.io/docs/guides/video-generation
  - title: "MiniMax API: create video generation task (read 5 November 2026)"
    url: https://platform.minimax.io/docs/api-reference/video-generation-v2-create
  - title: "MiniMax API: pricing (read 5 November 2026)"
    url: https://platform.minimax.io/docs/pricing/overview
  - title: "MiniMax Open Platform: Terms of Service (effective 30 March 2026)"
    url: https://platform.minimax.io/docs/guides/terms-of-service
  - title: "Tencent Hunyuan: HunyuanVideo-1.5 on GitHub (read 5 November 2026)"
    url: https://github.com/Tencent-Hunyuan/HunyuanVideo-1.5
  - title: "Tencent Hunyuan Community License for HunyuanVideo-1.5"
    url: https://github.com/Tencent-Hunyuan/HunyuanVideo-1.5/blob/main/LICENSE
  - title: "HunyuanVideo 1.5 Technical Report (arXiv 2511.18870)"
    url: https://arxiv.org/abs/2511.18870
  - title: "Tencent Cloud TokenHub: Hy video generation API (last updated 16 October 2026)"
    url: https://www.tencentcloud.com/document/product/1300/83716
  - title: "Tencent Cloud TokenHub: pricing (last updated 4 November 2026)"
    url: https://www.tencentcloud.com/document/product/1300/78937
  - title: "Artificial Analysis: Text to Video leaderboard (read 5 November 2026)"
    url: https://artificialanalysis.ai/video/leaderboard/text-to-video
  - title: "Artificial Analysis: Image to Video leaderboard (read 5 November 2026)"
    url: https://artificialanalysis.ai/video/leaderboard/image-to-video
---

*AI movie models, episode 5. Previously: [Kling](/posts/ai-movie-models-kling/), [Gemini Omni vs Utopai X](/posts/ai-movie-models-gemini-omni-vs-utopai-x/), [xAI Grok Imagine](/posts/ai-movie-models-grok-imagine/) and [Runway Gen-4.5 vs Luma Ray3.2](/posts/ai-movie-models-runway-vs-luma/).*

This series explains one or two AI video models per post, using the same twelve questions every time. Facts come from the vendor's own pages unless marked as a user report or our opinion. Prices and leaderboard ranks were checked on 5 November 2026.

**Which versions.** Both models in this episode have open weights you can download. MiniMax announced **H3** on 31 July 2026 and published the weights on Hugging Face on 3 August; it follows MiniMax's Hailuo 01 and 02 models and also runs in MiniMax's Hailuo app and API. Tencent released **HunyuanVideo 1.5** on 20 November 2025. It is still the newest HunyuanVideo: Tencent's later OmniWeaving model (April 2026) is built on top of it, and its GitHub repo was last updated on 10 April 2026.

**What each does differently.** H3 is a large all-in-one model: MiniMax describes a 33-billion-parameter "Omni-Transformer" that reads text, images, video and audio together and makes clips with native stereo sound. MiniMax pitches it on following instructions, rendering text and brand marks, and copying motion from a reference video, and claims that at 2K it costs "less than a third" of mainstream models per second. HunyuanVideo 1.5 goes the other way: an 8.3-billion-parameter model that Tencent says needs only 14 GB of GPU memory with offloading, makes silent clips from text or one image, and upscales to 1080p. Third parties are already building on H3, as with [Pika's H3 Flex](/posts/pika-h3-flex-open-weights-video-model-license-excludes-us-eu/) and [Pruna's P-H3 Image](/posts/pruna-p-h3-image-open-weights-minimax-h3/).

## MiniMax H3 against the checklist

**1. Resolution.** 768p by default (the short side is 768 pixels) and 2K through MiniMax's API, at 24 fps. The API's cheaper Highspeed, Lite and Max variants offer 480p and 768p only. The open weights generate 768p; MiniMax's 2K "Regenerate" model is API-only and not yet open.

**2. Aspect ratios.** 21:9, 16:9, 4:3, 1:1, 3:4 and 9:16. Image-to-video takes its ratio from the input image, and reference-to-video can pick one automatically.

**3. Reference types.** Text, first and last frame images, reference images, reference videos and reference audio. MiniMax's guide says references can carry a "character, motion, camera, style, voice, or editing rhythm", and H3 also edits existing video. Audio references must come with an image or a video.

**4. References at once.** In reference mode: up to 9 images, up to 3 videos (2 to 15 seconds each, 15 seconds in total) and up to 3 audio clips, with a maximum of 12 files. First-and-last-frame mode takes 0, 1 or 2 images.

**5. Price** (checked 5 November). MiniMax's API is pay-as-you-go only for H3. Output costs $0.08 a second at 768p and $0.13 at 2K, so $0.40 or $0.65 for 5 seconds and $0.80 or $1.30 for 10 (our arithmetic). H3-Highspeed costs $0.06 a second at 768p, H3-Lite $0.04 at 768p and $0.025 at 480p, and H3-Max $0.08 at 768p plus $0.143 a second for input video. Upscaling a finished 768p clip to 2K costs $0.05 a second on top. The first five reference images are free, then $0.04 each. We could not read the Hailuo app's plan prices on 5 November, because the page only renders in a browser. Running the open weights costs nothing in licence fees, within the licence terms below.

**6. Performance.** MiniMax does not publish generation times for its API. Its open-source notes run the full model across four GPUs. On Artificial Analysis's text-to-video board (v2.1, read 5 November), H3 at 768p ranks third of 31 with an Elo of 1160, behind Wan 3.0 (1172) and Utopai X (1169); H3 Max ranks seventh (1148). On the image-to-video board H3 ranks fourth (1131) and H3 Max eighth (1116).

**7. Character consistency.** Reference mode is the method: MiniMax's own example asks for a character whose "appearance follows reference images 1 and 2" while copying the motion in reference video 1. To keep one character across separate clips you reuse the same reference images. No other identity-locking feature is documented.

**8. Scene consistency.** Clips run 4 to 15 seconds. MiniMax claims "native multi-shot modeling", meaning several shots inside one clip, and references can carry a style or an "editing rhythm". An extend mode for continuing a clip is not documented.

**9. Compared with the previous model.** MiniMax says it "set aside the Hailuo-02 architecture" to build one general model instead of separate ones for each task, and rebuilt its video tokenizer. New against Hailuo 02 are joint stereo sound, the multi-reference mode, video editing and 2K output.

**10. What users think** (user reports, not facts).
- Praise: [@whichchineseai](https://x.com/whichchineseai/status/2115791699616150004) called H3 the "best deal" on Artificial Analysis's image-to-video board, given its price per minute.
- Complaints: In a same-prompt test using one H3 frame as an image, [@non_stop_slop](https://x.com/non_stop_slop/status/2112956977470943720) reported that H3 "hollowed out her eyes" on an upside-down face. [@AnkitKumar65837](https://x.com/AnkitKumar65837/status/2113902303870865712) asked MiniMax for a successor with "seedance level quality".

**11. General quality.** We have not generated H3 clips for this series. MiniMax's [launch blog](https://www.minimax.io/blog/minimax-h3) shows official examples alongside their prompts.

**12. Our verdict** (opinion). Pick H3 if you want sound, 2K, or a shot built from several reference images, videos and voices, from $0.08 a second at 768p. Skip the open weights if you are in the US, EU, UK or South Korea, or if your company earns over $20 million a year. The hosted API has its own, separate terms.

## Tencent HunyuanVideo 1.5 against the checklist

**1. Resolution.** 480p and 720p natively, with a separate super-resolution step that upscales to 1080p. Tencent's hosted API on Tencent Cloud TokenHub offers 720p only.

**2. Aspect ratios.** The open-source code defaults to 16:9 and lists no fixed set of ratios. The hosted API offers 16:9, 9:16, 1:1, 4:3 and 3:4 for text-to-video; image-to-video follows the image.

**3. Reference types.** A text prompt, or one image as the first frame. Reference video, last frames, style references and audio input are not documented, and neither is sound output.

**4. References at once.** One image.

**5. Price** (checked 5 November). The weights are free to run under the licence. Tencent Cloud TokenHub charges $1.60 per million tokens for 720p, which it counts as 30,000 tokens a second, so $0.048 a second. Hosted clips are fixed at 5 seconds, so about $0.24 a clip (our arithmetic). A free tier is not documented. Third-party host fal lists $0.075 a second at 480p.

**6. Performance.** Tencent says its step-distilled 480p image-to-video model makes a clip "within 75 seconds" on one RTX 4090. The hosted API says generation takes "approximately several minutes". HunyuanVideo 1.5 is not listed on Artificial Analysis's text-to-video or image-to-video boards.

**7. Character consistency.** Not documented. Image-to-video starts from the subject in your image. Tencent has released training code and a LoRA fine-tuning script, but does not present them as a character-consistency feature.

**8. Scene consistency.** The code makes 121 frames by default, about 5 seconds at 24 fps; Tencent's technical report describes 5 to 10 second clips. Multi-shot and extend modes are not documented.

**9. Compared with the previous model.** Tencent pitches 1.5 as "lightweight", at 8.3 billion parameters with a new sparse attention scheme. In Tencent's own human ratings of 720p image-to-video, viewers preferred it more often than Wan 2.2 (45.60% against 32.95%) and Kling 2.1 Master, and less often than Seedance Pro and Veo 3. Those rivals are now a year old. The repo's plan still lists a 720p text-to-video distilled model as "coming soon".

**10. What users think** (user reports, not facts).
- Praise: An [r/StableDiffusion poster](https://www.reddit.com/r/StableDiffusion/comments/1rhpsx9/hunyuan_15_vs_wan22/) who tested both models on a modest PC wrote that "hunyuan really amazed me while wans outputs were mehh".
- Complaints: The same poster asked why it gets less attention than Wan 2.2. We could not open other Reddit threads on 5 November, so we found no complaint we could quote.

**11. General quality.** We have not generated HunyuanVideo 1.5 clips for this series. Tencent's [GitHub page](https://github.com/Tencent-Hunyuan/HunyuanVideo-1.5) shows official examples, and its prompt handbook explains how to write prompts for the model.

**12. Our verdict** (opinion). Pick HunyuanVideo 1.5 if you want to generate and fine-tune video on your own 16 to 24 GB graphics card, or want a hosted 720p clip for about 24 cents. Skip it if you need sound, more than one reference, clips longer than about 10 seconds, or you are in the EU, UK or South Korea.

## Rights and licensing

**MiniMax H3.** The open weights come under the [MiniMax H3 Community License](https://huggingface.co/MiniMaxAI/MiniMax-H3/blob/main/LICENSE), dated 2 August 2026, which is not an open-source licence. It excludes the EU, the UK, South Korea and the US: using the model or its outputs there is not authorised. Companies earning over $20 million a year need written permission, commercial products must show "MiniMax H3" prominently, and outputs may not be used to improve other AI models. MiniMax "claims no rights over the Outputs", and its use policy requires labelling machine-generated content. For the hosted API, MiniMax's [Terms of Service](https://platform.minimax.io/docs/guides/terms-of-service) (effective 30 March 2026) say you keep ownership of your inputs and generated content, but MiniMax may use both "to provide, maintain, develop, and improve" its services. Customers who build services on the API must add a visible mark to generated content, and MiniMax promises to defend customers against patent and copyright claims, within limits.

**Tencent HunyuanVideo 1.5.** The weights come under the [Tencent Hunyuan Community License](https://github.com/Tencent-Hunyuan/HunyuanVideo-1.5/blob/main/LICENSE), which excludes the EU, the UK and South Korea but, unlike H3's, not the US. Services with over 100 million monthly active users on the release date must ask Tencent for a licence, and outputs may not be used to improve other AI models. Tencent "claims no rights in Outputs", and its use policy also requires disclosing machine-generated content. The hosted API lets you add your own short watermark text; we did not review Tencent Cloud's general terms for this episode.

## Summary

| # | Checklist | MiniMax H3 | HunyuanVideo 1.5 |
|---|---|---|---|
| 1 | Resolution | 768p; 2K via API | 480p/720p; 1080p upscale |
| 2 | Aspect ratios | 6, 21:9 to 9:16 | 5 in the API; 16:9 default locally |
| 3 | Reference types | frames, images, video, audio | first-frame image |
| 4 | References at once | 9 images, 3 videos, 3 audio; 12 total | 1 image |
| 5 | Price (5 Nov) | $0.40 per 5 s at 768p; $0.65 at 2K | $0.24 per 5 s clip hosted; free weights |
| 6 | Performance | AA T2V #3 (1160), I2V #4 | under 75 s on an RTX 4090 at 480p (Tencent); not on AA |
| 7 | Character consistency | reference images | not documented |
| 8 | Scene consistency | 4 to 15 s; multi-shot (MiniMax) | about 5 to 10 s; no extend |
| 9 | vs previous | new architecture after Hailuo 02 | small 8.3B model (Tencent) |
| 10 | Users | value praised; face glitch, quality wishes | praised on a modest PC; less attention than Wan |
| 11 | Quality | not tested by us | not tested by us |
| 12 | Verdict (opinion) | sound, 2K, many references | silent, small, runs at home |
