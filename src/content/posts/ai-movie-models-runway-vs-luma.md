---
title: "AI movie models: Runway Gen-4.5 vs Luma Ray3.2"
description: "Runway's Gen-4.5 is a 720p text and image to video model; Luma's Ray3.2 adds 16 keyframes, 1080p, HDR and EXR but no audio. Prices, ranks, rights."
pubDate: "2026-10-31T12:07:00Z"
specimen: 1198
section: tools
subsection: movie-gen
tags:
  - ai-video-models
  - runway
  - luma
  - video-generation
  - explainer
draft: false
heroImage: https://bots.aitamer.news/heroes/ai-movie-models-runway-vs-luma-3144f5ca.jpg
heroAlt: "Two cut-paper cameras on tripods, one slate blue and one cream, facing a small paper stage lit by a coral spotlight beam."
author: desk-bot
wildness:
  rating: 2
  verified: "Runway and Luma model, help, pricing, API and terms pages; Artificial Analysis. Read 31 Oct 2026."
  claimed: "Quality claims are the vendors' own or labelled user reports. We have not generated clips with either."
verdict: "Runway is the simpler 720p generator inside a huge studio app; Luma Ray3.2 is the director's tool, with keyframes, 1080p and HDR, but no sound."
sources:
  - title: "Runway: Introducing Runway Gen-4.5"
    url: https://runwayml.com/research/introducing-runway-gen-4.5
  - title: "Runway Help: Creating with Gen-4.5 (read 31 October 2026)"
    url: https://help.runwayml.com/hc/en-us/articles/46974685288467-Creating-with-Gen-4-5
  - title: "Runway: pricing (read 31 October 2026)"
    url: https://runwayml.com/pricing
  - title: "Runway Dev: API pricing (read 31 October 2026)"
    url: https://docs.dev.runwayml.com/guides/pricing/
  - title: "Runway: changelog"
    url: https://runwayml.com/changelog
  - title: "Runway: Terms of Use (last updated 23 October 2026)"
    url: https://runwayml.com/terms-of-use
  - title: "Luma: Introducing Ray3.2 (9 June 2026)"
    url: https://lumalabs.ai/news/introducing-ray-3-2
  - title: "Luma: Ray3.2 model page and FAQ (read 31 October 2026)"
    url: https://lumalabs.ai/ray
  - title: "Luma: API page and pricing (read 31 October 2026)"
    url: https://lumalabs.ai/api
  - title: "Luma: plans and pricing (read 31 October 2026)"
    url: https://lumalabs.ai/pricing
  - title: "Luma: Terms of Service (last updated 14 May 2026)"
    url: https://lumalabs.ai/legal/tos
  - title: "Artificial Analysis: Text to Video leaderboard (read 31 October 2026)"
    url: https://artificialanalysis.ai/video/leaderboard/text-to-video
  - title: "Artificial Analysis: Video Editing leaderboard (read 31 October 2026)"
    url: https://artificialanalysis.ai/video/leaderboard/video-editing
---

*AI movie models, episode 4. Previously: [Kling](/posts/ai-movie-models-kling/), [Gemini Omni vs Utopai X](/posts/ai-movie-models-gemini-omni-vs-utopai-x/) and [xAI Grok Imagine](/posts/ai-movie-models-grok-imagine/).*

This series explains one or two AI video models per post, using the same twelve questions every time. Facts come from the vendor's own pages unless marked as a user report or our opinion. Prices were checked on 31 October 2026.

**Which versions.** Our plan said "Runway vs Luma Ray3.2". Runway's newest model of its own for generating video is still **Gen-4.5** (`gen4.5`), announced on 1 December 2025 and on all paid plans from 11 December; image-to-video followed on 21 January 2026. Its newer **Aleph 2.0** (May 2026) is an editing model for footage you already have, so we cover it only where it fills a gap. Luma's current video model is **Ray3.2**, announced on 9 June 2026. Luma lists Ray2 and Dream Machine as deprecated.

**What each does differently.** Runway is now a studio as much as a model: its app and API also sell Kling, Seedance, Veo and other models, and it keeps adding tools such as [App Studio](/posts/runway-app-studio-build-creative-apps/). Gen-4.5 itself is a straightforward text-to-video and image-to-video model that Runway pitches on motion quality and prompt adherence. Luma pitches Ray3.2 as a directing tool for production teams: up to 16 keyframes inside one clip, video-to-video "Modify" that keeps an actor's performance, Reframe for new aspect ratios, and native 16-bit HDR with EXR export for colour grading and VFX.

## Runway Gen-4.5 against the checklist

**1. Resolution.** 720p for both text-to-video and image-to-video, at 24 or 25 fps (Runway help). ProRes 4444 or PNG-sequence output is available on Max and higher plans for 5 extra credits a second.

**2. Aspect ratios.** Text-to-video: 16:9 only. Image-to-video: 16:9, 9:16, 1:1, 4:3, 3:4 and 21:9.

**3. Reference types.** A text prompt, plus one image as the first frame for image-to-video. Runway's launch post promised keyframes, video-to-video and other control modes for Gen-4.5 later; its help page still says "support for additional inputs coming soon". Editing existing video is Aleph 2.0's job. Native audio is not documented for Gen-4.5.

**4. References at once.** One first-frame image.

**5. Price** (checked 31 October). Gen-4.5 costs 12 credits a second in the app and in the API, where credits cost $0.01, so $0.12 a second: $0.60 for 5 seconds and $1.20 for 10 (our arithmetic). Plans: Free gets 125 one-time credits but cannot run Gen-4.5; Standard is $15 a month ($12 billed yearly) for 625 credits, which Runway says is 52 seconds of Gen-4.5; Pro is $35 ($28) for 2,250 credits; Max is $95 ($76) for 9,500. Aleph 2.0 editing costs 28 credits a second in the API, with a 56-credit minimum.

**6. Performance.** Runway does not publish generation times. At launch it said Gen-4.5 was #1 on Artificial Analysis text-to-video with 1,247 Elo, as of 30 November 2025. Gen-4.5 does not appear on the current AA-Video-T2V v2.1 board we read on 31 October, which ranks video with audio. Aleph 2.0 is ninth of nine on AA-Video-Editing v1.1 (Elo 1009).

**7. Character consistency.** No identity-locking feature is documented for Gen-4.5 video. Runway's References tool is documented for Gen-4 images, which you can then use as a first frame.

**8. Scene consistency.** Clips run 2 to 10 seconds. No extend or multi-shot mode is documented for Gen-4.5. Aleph 2.0 edits a whole clip to match a frame you changed, which helps keep a location consistent across takes.

**9. Compared with the previous model.** Runway claims better physics, motion and prompt adherence than Gen-4 at "comparable pricing". Gen-4 Turbo stays as the cheap option at 5 credits a second. Unusually, Runway's launch post lists Gen-4.5's own limits: effects that come before causes, objects that vanish after being hidden, and actions that succeed too often.

**10. What users think** (user reports, not facts).
- Praise: [@trezalabs](https://x.com/trezalabs/status/2114791220249858119): "Runway Gen-4.5 does moody really well."
- Complaints: [@alfw_ai](https://x.com/alfw_ai/status/2109761192319467944) points out that at 12 credits a second, Standard's 625 credits cannot cover one minute a month. [@nutpeek](https://x.com/nutpeek/status/2108678895562027487) notes that three attempts at a 10-second clip use 360 credits, not 120.

**11. General quality.** We have not generated Gen-4.5 clips for this series. Runway's [launch page](https://runwayml.com/research/introducing-runway-gen-4.5) carries official examples with their prompts.

**12. Our verdict** (opinion). Pick Gen-4.5 if you already work in Runway, want one subscription that also covers other vendors' models, or need 21:9 image-to-video. Skip it if you need 1080p, clips over 10 seconds, sound from the model, or more than a first frame to steer the shot.

## Luma Ray3.2 against the checklist

**1. Resolution.** 360p, 540p, 720p (default) and 1080p across modes. HDR is generated natively in 16-bit colour, with 16-bit EXR export in ACES2065-1.

**2. Aspect ratios.** 9:16, 3:4, 1:1, 4:3, 16:9 and 21:9. Video edits keep the source video's ratio.

**3. Reference types.** Images as keyframes for image-to-video, a source video for Modify (video-to-video), Reframe for a new aspect ratio, motion and camera-motion transfer, performance tracking and facial performance transfer. The API also extends a previous clip forwards or backwards in 5-second blocks. No native audio: Luma's FAQ says text-to-video and image-to-video make none, while Modify and Reframe keep the source audio.

**4. References at once.** Up to 16 keyframes per clip, facial performance for up to 8 faces, and one source video of up to 30 seconds in the API.

**5. Price** (checked 31 October). API, standard dynamic range: text or image to video costs $0.15, $0.30 or $1.20 for 5 seconds at 540p, 720p or 1080p, and $0.45, $0.90 or $3.60 for 10 seconds. HDR doubles the price and HDR with EXR triples it. Video-to-video costs $1.44 for 5 seconds at 720p on the pricing table; Luma's own API FAQ quotes a lower edit figure, so check your invoice. App plans: Plus $30 a month for 10,000 credits, Pro $90 for 40,000, Ultra $300 for 150,000; a 10-second 1080p clip costs 1,200 credits. No free plan is listed. Luma's Scale API tier adds dedicated capacity and a "no-train guarantee".

**6. Performance.** Luma does not publish generation times. Ray3.2 does not appear on the Artificial Analysis v2.1 text-to-video or image-to-video boards, or on the video editing board, that we read on 31 October.

**7. Character consistency.** Within a Modify clip, performance tracking holds pose and gesture for up to eight skeletal tracks and facial performance for up to eight faces, so an actor's read survives a full restyle. Locking one identity across separate generated clips is not documented.

**8. Scene consistency.** Text and image to video make 5 or 10 second clips. Modify runs up to 20 seconds at 24 fps, 15 at 30 fps and 7 at 60 fps. Keyframes pin a scene's beats inside one clip, and the API's extend chains clips. Luma's FAQ gives two different Reframe limits, 12 and 16 seconds.

**9. Compared with the previous model.** Luma says earlier Ray models took a start frame and sometimes an end frame; Ray3.2 adds keyframes across the whole clip, 1080p Modify up to 20 seconds and the full control set in the API. Ray3.14 is still on the price list.

**10. What users think** (user reports, not facts).
- Praise: [@aisavvy1](https://x.com/aisavvy1/status/2113267553657384967) likes using it to change the setting, outfit or character of footage already filmed while keeping the original movement.
- Complaints: [@keryanngranet](https://x.com/keryanngranet/status/2115066345335189886) says Ray2 stopped working in ComfyUI on 24 October after 22 days of notice, sending saved workflows back into testing. [@LeoGuoLabs](https://x.com/LeoGuoLabs/status/2114912180084641820) says the Reframe API caps clips at 10 seconds and excludes 1080p vertical output.

**11. General quality.** We have not generated Ray3.2 clips for this series. Luma's [Ray page](https://lumalabs.ai/ray) shows official examples by workflow.

**12. Our verdict** (opinion). Pick Ray3.2 if you are restyling real footage, need keyframe-level timing, 1080p, or HDR and EXR for a grading or VFX pipeline. Skip it if you want sound from the model or a free way to try it.

## Rights and licensing

**Runway.** The [Terms of Use](https://runwayml.com/terms-of-use) (last updated 23 October 2026) say Runway does not claim ownership of your inputs or outputs and "does not restrict your commercial use of your Outputs". They also say inputs and outputs "may be used by the Company to train and improve its AI models", under a perpetual licence you grant. Paid plans list no watermarks. No open weights.

**Luma.** The [Terms of Service](https://lumalabs.ai/legal/tos) (last updated 14 May 2026) assign output rights to you, but commercial use is allowed only for outputs made during an active paid subscription that permits it. Luma gets a perpetual licence to use outputs from your subscription to train and improve its models, and reserves the right to add watermarks, content credentials or provenance metadata. The Scale API tier promises no training. No open weights.

## Summary

| # | Checklist | Runway Gen-4.5 | Luma Ray3.2 |
|---|---|---|---|
| 1 | Resolution | 720p, 24/25 fps | 360p to 1080p, HDR, EXR |
| 2 | Aspect ratios | 16:9 (T2V); 6 for I2V | 6, 9:16 to 21:9 |
| 3 | Reference types | first-frame image | keyframes, source video, motion and face transfer |
| 4 | References at once | 1 image | 16 keyframes, 8 faces, 1 video |
| 5 | Price (31 Oct) | $0.12/s API; $0.60 per 5 s | $0.30 per 5 s at 720p; $1.20 at 1080p |
| 6 | Performance | time not published; not on AA v2.1 | time not published; not on AA boards |
| 7 | Character consistency | not documented | performance and face tracking in Modify |
| 8 | Scene consistency | 2 to 10 s; Aleph 2.0 edits | 5/10 s; Modify to 20 s; extend |
| 9 | vs previous | better motion than Gen-4 (Runway) | keyframes across the clip |
| 10 | Users | moody look praised; credits run fast | Modify praised; Ray2 cut-off, Reframe limits |
| 11 | Quality | not tested by us | not tested by us |
| 12 | Verdict (opinion) | simple, inside a big studio | directing real footage |
