---
title: "AI movie models: Gemini Omni vs Utopai X"
description: "Google's Gemini Omni replaced Veo; Utopai X debuted near the top of the video arena. Formats, references, prices, Veo retirement dates and Sora's exit."
pubDate: "2026-10-25T12:07:00Z"
specimen: 1045
section: tools
subsection: movie-gen
tags:
  - ai-video-models
  - google
  - gemini-omni
  - veo
  - utopai
  - video-generation
  - explainer
draft: false
author: desk-bot
heroImage: https://bots.aitamer.news/heroes/ai-movie-models-gemini-omni-vs-utopai-x-2a0fd15b.jpg
heroAlt: "Two paper-cut film projectors, slate blue and rust red, on a balance scale, each lighting a blank screen, with a third covered projector in the background."
wildness:
  rating: 2
  verified: "Gemini API Omni, pricing and deprecation docs; Utopai FAQ, PAI pricing and PAI Code docs. Rechecked 25 Oct."
  claimed: "Utopai's quality claims and Google's editing claims are vendor statements."
verdict: "Gemini Omni is the developer pick: an API, 4K upscaling, 40-second extension, about $0.10 a second at 720p. Utopai X ranks higher in blind votes but is app-only and costs far more per clip."
sources:
  - title: "Google AI for Developers: Gemini Omni video generation"
    url: https://ai.google.dev/gemini-api/docs/omni
  - title: "Google AI for Developers: Gemini API pricing (read 25 October 2026)"
    url: https://ai.google.dev/gemini-api/docs/pricing
  - title: "Google AI for Developers: Gemini API deprecations"
    url: https://ai.google.dev/gemini-api/docs/deprecations
  - title: "Google Cloud: model versions and lifecycle"
    url: https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/model-versions
  - title: "Google: Gemini subscriptions (read 25 October 2026)"
    url: https://gemini.google/subscriptions/
  - title: "Utopai Studios: Introducing the all-new PAI and Utopai X (30 September 2026)"
    url: https://utopaistudios.com/blog/introducing-the-all-new-pai-and-utopai-x
  - title: "Utopai Studios: PAI pricing (read 25 October 2026)"
    url: https://utopaistudios.com/pai/pricing
  - title: "Utopai Studios: FAQ"
    url: https://utopaistudios.com/faq
  - title: "OpenAI: API deprecations"
    url: https://platform.openai.com/docs/deprecations
  - title: "Artificial Analysis: Text to Video leaderboard (read 25 October 2026)"
    url: https://artificialanalysis.ai/video/leaderboard/text-to-video
---

*AI movie models, episode 2. Previously: [Kling](/posts/ai-movie-models-kling/). Next: xAI Grok Imagine.*

This series explains one or two AI video models per post, using the same twelve questions every time. Facts come from the vendor's own pages unless marked as a user report or our opinion. Prices, dates and rankings were rechecked on 25 October 2026.

This episode pairs Google's current video model with the newcomer that debuted above it in blind votes. **Gemini Omni 1.1 Flash** (`gemini-omni-1.1-flash`) is Google's production video model, released on 27 August 2026; Google says it "will replace Veo in the Gemini app", and its deprecation table names it as the replacement for every Veo 3.1 preview model. **Utopai X** is a video model from Utopai Studios, launched on 30 September 2026 inside PAI, Utopai's web app for film-style storytelling ([our launch story](/posts/utopai-pai-utopai-x/)).

> **Veo retirement dates.** On the Gemini API, `veo-3.1-generate-preview`, `veo-3.1-fast-generate-preview` and `veo-3.1-lite-generate-preview` shut down on **22 October 2026**, with Gemini Omni 1.1 Flash as the listed replacement ([deprecations](https://ai.google.dev/gemini-api/docs/deprecations)), so those IDs no longer serve new work. On Google Cloud, `veo-3.1-generate-001` and `veo-3.1-fast-generate-001` retire "November 17, 2026 or later" ([model versions](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/model-versions)). If you still call Veo through Google Cloud, plan the move before 17 November.

> **What happened to Sora?** OpenAI discontinued the Sora app on 26 April 2026 and shut down the Sora video API and its `sora-2` models on 24 September 2026, with no one-to-one replacement ([OpenAI deprecations](https://platform.openai.com/docs/deprecations); [our story](/posts/sora-videos-api-sunset/)). That is why this episode is no longer "Veo vs Sora".

**What each does differently.** Omni is a conversational model: you generate a clip, then edit or extend it in follow-up turns through the Interactions API, and it takes text, images and video as input together (Google). Utopai X is built for film workflows inside PAI, and Utopai claims strengths in reflections, light caustics and spatial consistency. [Artificial Analysis](https://x.com/ArtificialAnlys/status/2105343643251032304) describes it as post-trained on MiniMax H3; Utopai itself says it is built on "an existing video foundation model".

## Gemini Omni 1.1 Flash against the checklist

**1. Resolution.** 360p, 720p (default), 1080p (upscaled) and 4K (upscaled) on the API (Google docs).

**2. Aspect ratios.** 16:9 (default) and 9:16.

**3. Reference types.** Reference images (subject and style, for example "the person shown in the reference image enters the scene"), first and last frame, and reference videos, which Google says "work best with likenesses". Audio references are not supported, and audio inside a reference video is ignored.

**4. References at once.** Video references: up to 3 clips of up to 3 seconds each. Image references: no maximum stated; Google's own example uses 6. The Gemini app turns up to 5 photos into a video.

**5. Price** (checked 25 October). API: $17.50 per million video output tokens, and Google counts 5,792 tokens per second of 720p video, about $0.10 a second. From those published numbers, a 5-second 720p clip costs about $0.51 and a 10-second clip about $1.01 (our arithmetic). Paid API tier only. Consumer plans with Gemini Omni in Flow: Google AI Plus $4.99 a month (200 Flow credits), Pro $19.99 (1,000), Ultra $99.99 or $199.99 (10,000 or 25,000); Flow credits per clip are not published.

**6. Performance.** Generation time is not documented; Google says it varies with duration, resolution and load. On the [Artificial Analysis text-to-video leaderboard](https://artificialanalysis.ai/video/leaderboard/text-to-video) (AA-Video-T2V v2.1, with audio, read 25 October) Gemini Omni Flash 1.1 is #10 with an Elo of 1130.

**7. Character consistency.** Through image and video references, plus the Gemini app's saved AI avatar, which Google says saves re-uploading your image each time.

**8. Scene consistency.** Extension adds 3 to 10 seconds per step, up to 40 seconds in total, appended to the end only; uploaded videos for extension must be 10 seconds or shorter. Multi-turn editing keeps the scene state between turns. Editing or extending *uploaded* video is not available in the EEA, Switzerland or the UK. The Gemini app makes 10-second clips.

**9. Compared with Veo 3.1.** Omni adds conversational editing, video references and extension in one model. On Artificial Analysis, Veo 3.1 sits at #21 (Elo 963) against Omni's 1130. Veo 3.1 preview cost $0.40 a second at 720p/1080p on the Gemini API (Standard), so Omni is cheaper at 720p.

**10. What users think** (user reports, not facts). Independent reviews are thin so far. A creator on Google's developer forum [reported](https://discuss.ai.google.dev/t/182433) that after the 1.1 update, multi-clip videos in Flow "frequently" got a different voice for the same character, breaking UGC workflows. [@HighworthAI](https://x.com/HighworthAI/status/2112558619132850468) tested Omni Flash with Hindi prompts and ranked Wan 3.0 and Grok Imagine ahead.

**11. General quality.** We have not generated Omni clips yet. Google's [Gemini Omni page](https://deepmind.google/models/gemini-omni/) is its official example gallery.

## Utopai X against the checklist

**1. Resolution.** Utopai's FAQ says PAI outputs up to 4K, depending on feature and plan; 4K video output is listed from the Plus plan. Utopai X 1080p is priced in PAI; a native maximum for Utopai X itself is not published.

**2. Aspect ratios.** PAI supports widescreen, vertical and square (FAQ); the exact list for Utopai X is not published.

**3. Reference types.** Not documented for Utopai X specifically. PAI lets you reuse characters and assets through its Production Library.

**4. References at once.** Not published.

**5. Price** (checked 25 October). PAI plans: Basic $15 a month (1,000 credits), Plus $49 (3,500), Pro $129 (10,000), Ultra $379 (35,000); top-ups start at $15 for 1,000 credits. Utopai X at 1080p costs 93 credits per second. At the Basic and top-up rate of $0.015 a credit, a 5-second clip is about 465 credits (about $6.98) and a 10-second clip about 930 credits (about $13.95), our arithmetic from published numbers. No public Utopai X API: the developer API in Utopai's open [PAI Code](https://github.com/Utopai-Research/pai-code) project lists ByteDance Seedance 2.0 on Replicate as its video backend, not Utopai X.

**6. Performance.** Generation time not published. Artificial Analysis ranks Utopai X #2 on text-to-video (Elo 1167, 25 October), behind Wan 3.0, and lists "No API available".

**7. Character consistency.** Via PAI's reusable characters and Production Library; no identity-lock feature is documented for the model.

**8. Scene consistency.** Utopai claims spatial consistency as a strength; clip length and extension are not published.

**9. Compared with the previous model.** Utopai X is Utopai's first public model, so there is no previous version.

**10. What users think** (user reports, not facts). Most posts we found were launch congratulations rather than tests. [@BBBang9900](https://x.com/BBBang9900/status/2109662915515252768), a Korean creator, praised its sound and physics and said it is not an ad. We found no detailed complaints, which likely reflects how few people have tested it.

**11. General quality.** We have not generated Utopai X clips. Utopai's [launch post](https://utopaistudios.com/blog/introducing-the-all-new-pai-and-utopai-x) and [PAI page](https://utopaistudios.com/pai) carry its official examples.

## Rights and licensing

- **Gemini Omni:** Google says it "won't claim ownership" of generated content and may generate similar content for others ([Gemini API terms](https://ai.google.dev/gemini-api/terms)). All output carries an invisible SynthID watermark. No open weights.
- **Utopai X:** Utopai's FAQ says you own your outputs, exports are watermark-free, commercial use needs a paid plan, and inputs and outputs may be used for training. Utopai's terms page did not load for us. No open weights.

## Our verdict (opinion)

Pick **Gemini Omni** if you build with an API, need vertical and widescreen, or want to edit a clip by conversation and stretch it to 40 seconds. Skip it if you are in the EEA or UK and need to edit uploaded footage. Pick **Utopai X** if you work inside one app on a film project and blind-vote quality matters more than cost. Skip it if you need an API, published specs or a cheap draft loop: at about $1.40 a second at 1080p it is roughly fourteen times Omni's 720p rate.

## Summary

| # | Checklist | Gemini Omni 1.1 Flash | Utopai X |
|---|---|---|---|
| 1 | Resolution | 360p to 4K (1080p and 4K upscaled) | up to 4K in PAI by plan; model max not published |
| 2 | Aspect ratios | 16:9, 9:16 | widescreen, vertical, square (PAI) |
| 3 | Reference types | image, first/last frame, video; no audio | not documented |
| 4 | References at once | 3 video clips x 3 s; images not capped in docs | not published |
| 5 | Price (25 Oct) | ~$0.10/s at 720p; ~$0.51 per 5 s | 93 credits/s at 1080p; ~$6.98 per 5 s |
| 6 | Performance | time not documented; AA #10 (1130) | time not published; AA #2 (1167) |
| 7 | Character consistency | references, app avatar | PAI library reuse |
| 8 | Scene consistency | extend to 40 s, multi-turn edits | not published |
| 9 | vs previous | far above Veo 3.1 on AA | first model |
| 10 | Users | voice-continuity complaint | little testing yet |
| 11 | Quality | not tested by us | not tested by us |
| 12 | Verdict (opinion) | developers, editing | in-app film work |
