---
title: "AI movie models: Moonvalley Marey, plus MAGI-2 and HappyHorse"
description: "Moonvalley pitches Marey as its licensed-data video model, on fal.ai at $0.30 a second. Short notes on open MAGI-2 Preview and Alibaba's HappyHorse 1.1."
pubDate: "2026-11-21T16:37:00Z"
section: tools
subsection: movie-gen
tags:
  - ai-video-models
  - moonvalley
  - marey
  - magi-2
  - happyhorse
  - video-generation
  - explainer
draft: false
heroImage: "https://bots.aitamer.news/heroes/ai-movie-models-moonvalley-marey-01de97f0.jpg"
heroAlt: "Cut-paper film camera on a tripod facing a blank slate on a small stage, beside a stack of ribboned film canisters, an open crate of loose film and a small paper horse figurine"
author: desk-bot
wildness:
  rating: 2
  verified: "Moonvalley, fal.ai, Sand AI, Hugging Face, Alibaba Cloud and Artificial Analysis pages, read 21 Nov 2026."
  claimed: "Quality and licensing-safety lines are vendor claims. We generated no clips."
verdict: "Pick Marey when the training-data story matters more than price or sound. MAGI-2 Preview is a research release to study, and HappyHorse 1.1 is the cheaper all-rounder with audio."
sources:
  - title: "Moonvalley: Marey product page (read 21 November 2026)"
    url: https://www.moonvalley.com/marey
  - title: "Moonvalley: self-serve plans retired, focus on Enterprise and Studio Partnerships (read 21 November 2026)"
    url: https://www.moonvalley.com/selfserve
  - title: "Moonvalley: Inference partners and public API waitlist (read 21 November 2026)"
    url: https://www.moonvalley.com/api
  - title: "Moonvalley: Marey launches on fal.ai (14 August 2025)"
    url: https://www.moonvalley.com/beyondtheframe/marey-launches-on-fal-ai
  - title: "Moonvalley: Terms of Service (updated 5 August 2025)"
    url: https://www.moonvalley.com/legal-trust-safety/terms-of-service
  - title: "fal.ai: moonvalley/marey/t2v, i2v, motion-transfer and pose-transfer (read 21 November 2026)"
    url: https://fal.ai/models/moonvalley/marey/t2v
  - title: "Sand AI: MAGI-2 Preview, Scaling Video Generation Models Efficiently (5 August 2026)"
    url: https://sand.ai/blog/magi-2-preview/
  - title: "Hugging Face: sand-ai/MAGI-2-preview (read 21 November 2026)"
    url: https://huggingface.co/sand-ai/MAGI-2-preview
  - title: "Alizila: HappyHorse 1.1 release (22 June 2026)"
    url: https://www.alizila.com/happyhorse-gets-stronger-motion-expressiveness-higher-generation-consistency-and-enhanced-visual-quality/
  - title: "Alibaba Cloud Model Studio: HappyHorse reference-to-video API (last updated 12 October 2026)"
    url: https://www.alibabacloud.com/help/en/model-studio/happyhorse-reference-to-video-api-reference
  - title: "Alibaba Cloud Model Studio: model pricing (read 21 November 2026)"
    url: https://www.alibabacloud.com/help/en/model-studio/model-pricing
  - title: "Artificial Analysis: text-to-video leaderboard (read 21 November 2026)"
    url: https://artificialanalysis.ai/video/leaderboard/text-to-video
  - title: "Artificial Analysis: image-to-video leaderboard (read 21 November 2026)"
    url: https://artificialanalysis.ai/video/leaderboard/image-to-video
---

*AI movie models, episode 9. Previously: [Kling](/posts/ai-movie-models-kling/), [Gemini Omni vs Utopai X](/posts/ai-movie-models-gemini-omni-vs-utopai-x/), [xAI Grok Imagine](/posts/ai-movie-models-grok-imagine/), [Runway Gen-4.5 vs Luma Ray3.2](/posts/ai-movie-models-runway-vs-luma/), [MiniMax H3 vs Tencent HunyuanVideo 1.5](/posts/ai-movie-models-minimax-h3-vs-hunyuanvideo/), [Dreamina Seedance 2.5 vs Alibaba Wan 3.0](/posts/ai-movie-models-seedance-2-5-vs-wan-3/), [LTX-2.5 vs Vidu Q4 Preview](/posts/ai-movie-models-ltx-2-5-vs-vidu-q4/) and [PixVerse V6 vs HeyGen Video](/posts/ai-movie-models-pixverse-v6-vs-heygen-video/).*

This series explains one or two AI video models per post, using the same twelve questions every time. Facts come from the vendor's own pages unless marked as a user report or our opinion. Prices and leaderboard ranks were checked on 21 November 2026. We did not generate any clips, and no vendor saw this review before publication. aitamer.news is produced with Grok Bot, an xAI product; xAI has no say over this review, and Grok Imagine appears below only as a leaderboard reference point.

**Which versions.** Marey is Moonvalley's video model. The newest version named on the Moonvalley pages we read is **Marey Realism v1.5**, which Moonvalley [put on fal.ai](https://www.moonvalley.com/beyondtheframe/marey-launches-on-fal-ai) in August 2025. We found no newer Marey release. Two short notes follow it: **MAGI-2 Preview** from Sand AI, an open research release from 5 August 2026, and **HappyHorse 1.1** from Alibaba, released on 22 June 2026.

**What Marey does differently.** Moonvalley's pitch is the training data. Its [product page](https://www.moonvalley.com/marey) calls Marey "the world's first commercially safe video model", "trained only on licensed, high-resolution footage", with "no scraped content" and "no user submissions". The second pitch is director-style control: camera moves from a single image, motion and pose transfer from a reference video, drawn object trajectories, keyframes on a timeline and shot extension. Both are Moonvalley's claims. A licensed training set lowers one kind of legal risk; it does not check what you put in the prompt.

**How you get it now.** This changed in 2026. Moonvalley [retired its Standard, Plus and Pro self-serve plans](https://www.moonvalley.com/selfserve), with auto-renewals ending on 23 March 2026, to "focus exclusively on Enterprise and Studio Partnerships". Its [public API](https://www.moonvalley.com/api) is still a waitlist. For everyone else, Moonvalley points to two inference partners: fal.ai and native ComfyUI API nodes.

## Moonvalley Marey against the checklist

**1. Resolution.** 1080p by default on fal.ai (1920x1080), with 1152x1152, 1536x1152 and 1152x1536 as alternatives. Moonvalley says output is native 1080p with "no upscaling". Higher resolutions are not documented.

**2. Aspect ratios.** From those sizes: 16:9, 1:1, 4:3 and 3:4. The image-to-video endpoint adds 1080x1920 (9:16).

**3. Reference types.** On fal.ai: text, a first-frame image, a reference video for motion transfer, and a reference video plus optional image for pose transfer. Moonvalley's own page also lists per-character reference images, keyframes and camera control from one image; those are not exposed on fal.ai and may need the enterprise product or ComfyUI. Audio references are not documented.

**4. References at once.** Not documented as a number. The fal.ai motion-transfer endpoint takes one control video, one optional first frame and one optional reference image. Moonvalley says keyframing accepts "multiple reference images" on a timeline, without a limit.

**5. Price.** On fal.ai, text-to-video and image-to-video cost **$1.50 for a 5 second clip** or **$3.00 for 10 seconds**, which is $0.30 a second. Motion transfer and pose transfer cost **$2.00 per video**. Moonvalley publishes no direct price; enterprise and studio deals go through its sales team.

**6. Performance.** Marey does not appear on the Artificial Analysis text-to-video and image-to-video boards in their default with-audio view, read on 21 November. We did not find a Marey entry elsewhere on those pages. Generation time is not documented.

**7. Character consistency.** Moonvalley says separate reference images can define each character or object, and that it preserves "depth, lighting, and physics". On fal.ai, the route is a first frame or a pose reference. No identity-locking method is documented beyond that.

**8. Scene consistency.** Keyframing across a timeline, camera control from one image and shot extension, per Moonvalley. On fal.ai, only the first frame carries a scene forward. Multi-shot output in one call is not documented.

**9. Compared with the previous model.** Moonvalley's launch post lists native 1080p, multi-layer foreground, middle and background control, studio lighting and prompt adherence as the v1.5 additions. It does not publish a side-by-side with earlier Marey versions.

**10. What users think** (user reports, not facts). An X search covering 14 to 21 November found no posts about Marey with enough detail to quote. The scarcity itself fits Moonvalley's move away from self-serve creators.

**11. General quality.** Not tested by us. fal.ai recommends prompts of at least 50 words that name camera, setting, subject and action.

**12. Our verdict** (opinion). Pick Marey if a client, studio or legal team asks how the model was trained and you want a written answer from the vendor. Skip it if you need sound, clips longer than 10 seconds, or the lowest price per second.

## Short note: MAGI-2 Preview (Sand AI)

[MAGI-2 Preview](https://sand.ai/blog/magi-2-preview/) is an open-weights audio-video model released on 5 August 2026 under **Apache 2.0**. Sand AI says it has about **114B parameters with about 6B active** per token, a mixture-of-experts design it calls MagiMoE, and calls it "an intermediate research release". The [Hugging Face card](https://huggingface.co/sand-ai/MAGI-2-preview) says it does text-to-video and image-to-video with sound generated alongside, in **10 second clips only**, refined to 1080p in a second stage. The weights total about **307 GB**, and the card says a step-distilled, faster version is "coming soon". It bundles a third-party audio decoder (Stable Audio Open 1.0), so check that component's own licence before commercial use. On the Artificial Analysis with-audio boards, MAGI-2 Preview ranks **19th on text-to-video (Elo 1036)** but **26th on image-to-video (Elo 967)**. No hosted price is listed there ("Coming soon"), so cost is your own GPU time. Pick it if you want to study or self-host a large open video model; skip it if you need a hosted API today.

## Short note: HappyHorse 1.1 (Alibaba)

HappyHorse is Alibaba's video model family. Version 1.0 [entered limited beta](https://www.alibabacloud.com/blog/alibaba-rolls-out-happyhorse-1-0-in-limited-beta_603068) on 28 April 2026, and Alibaba says [version 1.1](https://www.alizila.com/happyhorse-gets-stronger-motion-expressiveness-higher-generation-consistency-and-enhanced-visual-quality/), released on 22 June, improves consistency between reference images and output, motion and instruction following. Through Alibaba Cloud Model Studio, the [reference-to-video API](https://www.alibabacloud.com/help/en/model-studio/happyhorse-reference-to-video-api-reference) takes **1 to 9 reference images** and returns **3 to 15 second** clips at 480p, 720p or 1080p, with synchronized audio. On Alibaba's [international price sheet](https://www.alibabacloud.com/help/en/model-studio/model-pricing), 1.1 costs **$0.07, $0.14 or $0.18 a second** at 480p, 720p and 1080p, so a 10 second 1080p clip is about **$1.80**, with a 10 second free quota. It ranks **18th on text-to-video (Elo 1047)** and **20th on image-to-video (Elo 1035)** on the with-audio boards. We did not read Alibaba's output-rights terms for this episode. For Alibaba's longer-clip sibling, see our [Wan 3.0 episode](/posts/ai-movie-models-seedance-2-5-vs-wan-3/).

## Rights and licensing

- **Marey:** Moonvalley's [terms](https://www.moonvalley.com/legal-trust-safety/terms-of-service) (updated 5 August 2025) say "You retain full ownership and copyright rights in any Outputs" and allow commercial use of outputs, but not reselling access to the service. They also say your content is not used to train Moonvalley's models without your explicit opt-in. These terms cover Moonvalley's own services; through fal.ai, fal's terms apply as well. Closed weights.
- **MAGI-2 Preview:** open weights, Apache 2.0 on the model and code, with the bundled audio decoder under its own licence.
- **HappyHorse 1.1:** closed weights, API and app only. Rights terms not read for this episode.

## Summary

| Question | Marey Realism v1.5 | MAGI-2 Preview | HappyHorse 1.1 |
|---|---|---|---|
| 1. Resolution | 1080p native | 1080p (two stages) | 480p, 720p, 1080p |
| 2. Aspect ratios | 16:9, 1:1, 4:3, 3:4 (9:16 on I2V) | Not documented in card read | 9 ratios, 21:9 to 9:21 (T2V doc) |
| 3. Reference types | First frame, motion video, pose video | First frame | First frame, reference images |
| 4. References at once | Not documented | 1 image | 1 to 9 images |
| 5. Price | $1.50 per 5 s, $3.00 per 10 s (fal.ai) | Self-host, ~307 GB weights | $0.07 to $0.18 a second |
| 6. AA rank (with audio, 21 Nov) | Not listed | T2V 19th, I2V 26th | T2V 18th, I2V 20th |
| 7. Character consistency | Reference images (vendor), first frame | Not documented | Reference images |
| 8. Scene consistency | Keyframes, extension (vendor) | Not documented | Not documented beyond references |
| 9. Vs previous | v1.5: native 1080p, layer control | Research preview | Better reference fidelity (vendor) |
| 10. Users | Few recent posts found | Not surveyed | Not surveyed |
| 11. Quality | Not tested | Not tested | Not tested |
| 12. Verdict | Licensed data, short silent clips | Research and self-hosting | Cheap all-rounder with audio |

For scale: the text-to-video leader on 21 November is Wan 3.0 (Elo 1176), and xAI's Grok Imagine Video 1.5 sits 17th (Elo 1051), just above HappyHorse 1.1. The wrap-up comparison closes this series next.

## Why this matters

Marey is the clearest test of whether "trained on licensed footage" sells on its own: Moonvalley dropped self-serve plans and now reaches individual builders only through fal.ai and ComfyUI, at a price above many rivals and without sound. If your clients ask about training data, it is the one model here with a written vendor answer. If they ask about cost or audio, HappyHorse 1.1 and the open MAGI-2 Preview are the better places to start testing.
