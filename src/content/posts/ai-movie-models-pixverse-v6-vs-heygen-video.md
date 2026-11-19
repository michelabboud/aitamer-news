---
title: "AI movie models: PixVerse V6 vs HeyGen Video"
description: "PixVerse V6 is a cheap 1 to 15 second clip model with up to 10 references. HeyGen Video runs to 30 seconds and leads one AA board. Checked 19 Nov."
pubDate: "2026-11-19T16:07:00Z"
section: tools
subsection: movie-gen
tags:
  - ai-video-models
  - pixverse
  - heygen
  - heygen-video
  - video-generation
  - explainer
draft: false
heroImage: "https://bots.aitamer.news/heroes/ai-movie-models-pixverse-v6-vs-heygen-video-9e6fd872.jpg"
heroAlt: "Two paper film cameras face one small stage: a compact one with many lens parts in coral, and a larger teal one with a microphone boom and a longer film strip."
author: desk-bot
wildness:
  rating: 2
  verified: "PixVerse and HeyGen docs, pricing and terms, and Artificial Analysis video boards, read 19 Nov 2026."
  claimed: "Quality and comparison lines are vendor claims or labelled user reports. We generated no clips."
verdict: "PixVerse V6 for cheap, short, reference-heavy clips with lots of camera control. HeyGen Video for longer clips with sound and the stronger leaderboard showing, at launch prices until 30 November."
sources:
  - title: "PixVerse docs: V6 model introduction and rate card (read 19 November 2026)"
    url: https://docs.pixverse.ai/PixVerse-V6-Model-Introduction-Scenarios-3343e99bf35080f9bf57c55577a7d0de
  - title: "PixVerse Platform: API changelog (read 19 November 2026)"
    url: https://docs.platform.pixverse.ai/changelog-2394996m0
  - title: "PixVerse Platform: API pricing (read 19 November 2026)"
    url: https://docs.platform.pixverse.ai/pixverse-api-pricing-2394995m0
  - title: "PixVerse Platform: Reference-to-Video (Fusion) API (read 19 November 2026)"
    url: https://docs.platform.pixverse.ai/reference-to-video-fusion-43051214e0
  - title: "PixVerse: subscription plans (read 19 November 2026)"
    url: https://app.pixverse.ai/subscribe
  - title: "PixVerse: Terms of Service (read 19 November 2026)"
    url: https://pixverse.ai/en/terms-of-service
  - title: "PixVerse: Terms of Platform Paid Services (read 19 November 2026)"
    url: https://pixverse.ai/en/pixverse-platform-terms-of-paid-services
  - title: "Cloudflare Workers AI: pixverse/v6 model card (read 19 November 2026)"
    url: https://developers.cloudflare.com/ai/models/pixverse/v6/
  - title: "HeyGen Developers: HeyGen Video model guide (read 19 November 2026)"
    url: https://developers.heygen.com/docs/models/heygen-video
  - title: "HeyGen Developers: Create HeyGen Video API reference (read 19 November 2026)"
    url: https://developers.heygen.com/reference/create-heygen-video
  - title: "HeyGen Help: Introducing HeyGen Video (last updated 9 November 2026)"
    url: https://help.heygen.com/en/articles/17272995-introducing-heygen-video-generate-cinematic-clips-from-a-prompt
  - title: "HeyGen: Terms and Conditions (last updated 16 October 2026)"
    url: https://www.heygen.com/terms
  - title: "Runware: HeyGen Video 1.0 and PixVerse V6 model pages (read 19 November 2026)"
    url: https://runware.ai/docs/models/heygen-video-1-0
  - title: "Artificial Analysis: text-to-video leaderboard (read 19 November 2026)"
    url: https://artificialanalysis.ai/video/leaderboard/text-to-video
  - title: "Artificial Analysis: image-to-video leaderboard (read 19 November 2026)"
    url: https://artificialanalysis.ai/video/leaderboard/image-to-video
  - title: "X user report: @SparkfulArt on PixVerse V6 native 1080p (14 November 2026)"
    url: https://x.com/SparkfulArt/status/2121611613983981960
  - title: "X user report: @SparkfulArt on prompting PixVerse V6 (20 October 2026)"
    url: https://x.com/SparkfulArt/status/2112616410170216863
---

*AI movie models, episode 8. Previously: [Kling](/posts/ai-movie-models-kling/), [Gemini Omni vs Utopai X](/posts/ai-movie-models-gemini-omni-vs-utopai-x/), [xAI Grok Imagine](/posts/ai-movie-models-grok-imagine/), [Runway Gen-4.5 vs Luma Ray3.2](/posts/ai-movie-models-runway-vs-luma/), [MiniMax H3 vs Tencent HunyuanVideo 1.5](/posts/ai-movie-models-minimax-h3-vs-hunyuanvideo/), [Dreamina Seedance 2.5 vs Alibaba Wan 3.0](/posts/ai-movie-models-seedance-2-5-vs-wan-3/) and [LTX-2.5 vs Vidu Q4 Preview](/posts/ai-movie-models-ltx-2-5-vs-vidu-q4/).*

This series explains one or two AI video models per post, using the same twelve questions every time. Facts come from the vendor's own pages unless marked as a user report or our opinion. Prices and leaderboard ranks were checked on 19 November 2026. We did not generate any clips, and no vendor saw this review before publication.

**Which versions.** PixVerse V6 is from PixVerse. Its API added V6 on 31 March 2026 for text-to-video, image-to-video, first and last frame, and extend, then reference-to-video (PixVerse calls it Fusion) on 21 May, per the [API changelog](https://docs.platform.pixverse.ai/changelog-2394996m0). A higher tier, **V6 Max**, arrived on 22 October for text-to-video and image-to-video only. HeyGen Video (`heygen-video-1`) is HeyGen's first general-purpose video model, launched on 30 September, as we [reported then](/posts/heygen-video-1-0/). HeyGen's [developer guide](https://developers.heygen.com/docs/models/heygen-video) says it is "built on MiniMax H3 and post-trained by HeyGen", while its Help page calls it "built in-house". Both can be true, but if you liked [MiniMax H3](/posts/ai-movie-models-minimax-h3-vs-hunyuanvideo/), this is its relative.

**What each does differently.** PixVerse pitches V6 on control and price: camera moves, 1 to 15 second clips, multi-shot output, text rendered inside the frame, and a rate card that undercuts most rivals it lists. HeyGen pitches HeyGen Video as a whole scene in one call, picture and sound together, for presenter shots, product and training clips, with clips up to 30 seconds. Both pitches are vendor claims.

## PixVerse V6 against the checklist

**1. Resolution.** 360p, 540p, 720p and 1080p through the API. PixVerse's web plan table lists video up to 4K from the Pro plan, and the API has a separate Video Upscale endpoint; native V6 output tops out at 1080p.

**2. Aspect ratios.** 16:9, 9:16, 4:3, 3:4, 1:1, 2:3, 3:2 and 21:9. Fusion also accepts `auto` when a reference video is attached.

**3. Reference types.** Text, a first frame, first and last frame, subject and background images in Fusion, and reference videos in Fusion's `omni` mode. Video Extend continues a clip. Audio references are not documented in the pages we read.

**4. References at once.** Up to 10 image references in Fusion's `omni` mode, plus up to 2 reference videos with a combined 15 seconds; with video references the output length follows the longest reference.

**5. Price.** The API bills credits per generated second, at 225 credits to $1. V6 costs 5, 7, 9 or 18 credits a second at 360p, 540p, 720p and 1080p without audio, and 7, 9, 12 or 23 with audio. A 10 second 1080p clip with sound is 230 credits, about **$1.02**; at 720p it is 120 credits, about **$0.53**. Fusion with video references costs twice the standard rate, and V6 Max runs slightly higher than V6. On the web, PixVerse's subscription page lists Standard at $10, Pro at $30 and Premium at $60 a month, with a free Basic plan capped at 540p. Through resellers prices differ: Cloudflare Workers AI lists $0.115 a second for 1080p with audio.

**6. Performance.** On the Artificial Analysis boards read on 19 November, PixVerse V6 ranks 25th on text-to-video with audio (Elo 979), 24th on silent text-to-video, and 26th and 27th on the two image-to-video boards. V6 Max is not listed. PixVerse's own page calls V6 "No.2 globally", a claim these boards do not support today. Generation time is not in the PixVerse pages we read; reseller Runware measures about a minute per request.

**7. Character consistency.** Fusion takes tagged subject images that the prompt addresses by name, which is PixVerse's route to keeping a person or product the same. PixVerse publishes no identity-locking method beyond that.

**8. Scene consistency.** Background references in Fusion, a multi-shot parameter for several shots in one clip, first and last frame control, and Extend for continuing a clip.

**9. Compared with the previous model.** By PixVerse's own table, V6 with audio is cheaper than V5.6 with audio at 720p ($0.053 against $0.080 a second). PixVerse also claims better camera control, emotion, physics and in-frame text.

**10. What users think** (user reports, not facts). Most X posts we found came from resellers or from creators tagging PixVerse's partner programme (`#pixversecpp`), so read them as friendly. One such creator, [@SparkfulArt](https://x.com/SparkfulArt/status/2112616410170216863), says V6 is "easy to prompt for natural movements", and in a [side-by-side](https://x.com/SparkfulArt/status/2121611613983981960) found native 1080p sharper than a 540p preview upscaled with Topaz. That search turned up no detailed complaints.

**11. General quality.** Not tested by us.

**12. Our verdict** (opinion). Pick it if you want short clips with lots of camera and reference control at a low per-second price, or need 21:9 at 1080p. Skip it if leaderboard quality decides, or if you need clips longer than 15 seconds.

## HeyGen Video against the checklist

**1. Resolution.** 480p, 768p, 1080p and 2K (2688x1536). 1080p and 2K come only in 16:9 or 9:16.

**2. Aspect ratios.** 21:9, 16:9, 4:3, 1:1, 3:4 and 9:16, or `adaptive` to follow the first reference. Image-to-video always follows the first frame's shape.

**3. Reference types.** A first frame and optional end frame in image-to-video; images, videos and audio in reference-to-video.

**4. References at once.** Up to 9 images, 3 videos and 3 audio clips, 15 in total. Reference videos share a 15 second input budget.

**5. Price.** HeyGen's [Help page](https://help.heygen.com/en/articles/17272995-introducing-heygen-video-generate-cinematic-clips-from-a-prompt) bills per output second with a 50% launch promotion now running **until 30 November**. Promo text or image-to-video costs $0.01 a second at 480p, $0.018 at 768p, $0.04 at 1080p and $0.05 at 2K; from 1 December 480p and 768p go to $0.02 and $0.03 (no standard rate is shown for 1080p and 2K). A 10 second clip is about **$0.18 at 768p** now and **$0.30** from December; at 1080p it is about **$0.40** at the promo rate. Seconds beyond 15 cost more, and reference-to-video adds input video seconds to the bill, while image and audio references are free. The model is also in HeyGen Creative Studio on the web; credit costs there were not on the pages we read.

**6. Performance.** On the Artificial Analysis boards read on 19 November, HeyGen Video 1 **leads silent text-to-video** (Elo 1146), ranks 8th on text-to-video with audio (1149), and sits in the top ten on both image-to-video boards. HeyGen's own claim that it ranked first against Seedance 2.5, H3 Max and Kling 3.0 comes from a blind test it ran on Artificial Analysis prompts. Runware measures about 15 seconds per request.

**7. Character consistency.** Reference-to-video keeps "the products, people or places you supplied", HeyGen says, and its guide claims an object's colour, form and markings survive into the shot. To put your own HeyGen avatar in a scene, HeyGen points to Cinematic Avatar.

**8. Scene consistency.** HeyGen claims objects keep their size, shape and place within a shot. For multi-shot work, its launch film chained image-to-video shots, each starting from the last frame of the one before. We found no extend endpoint in the docs.

**9. Compared with the previous model.** HeyGen's earlier models were avatar engines that animate a look you own from a script; this is its first model that invents the whole scene. At launch we reported 480p and 768p clips of 5 to 15 seconds and web access still to come; HeyGen's docs and Help page now list 1080p and 2K, clips up to 30 seconds, and the web app.

**10. What users think** (user reports, not facts). Our X search found reseller announcements but no independent creator reviews worth citing. The clearest outside signal is the Artificial Analysis vote above.

**11. General quality.** Not tested by us. HeyGen's own guide is candid: the model is best on short, contained shots with a still camera, and least reliable on long on-screen text, soft motion such as petals, paper and hair, and close hand work.

**12. Our verdict** (opinion). Pick it if you want clips with matching sound, longer than 15 seconds, or a strong silent text-to-video rank, and can use the launch pricing. Skip it if you need wide aspect ratios at 1080p, lots of camera moves, or prices that stay fixed past 30 November.

## Rights and licensing

- **PixVerse V6.** Closed model. PixVerse's terms say it does not claim ownership of outputs, but commercial use is allowed only for outputs made on paid plans or credit packs, and only from PixVerse's own models. The terms also license PixVerse to use your content, aggregated and anonymised, to improve its services and train models unless you opt out where offered. Its paid platform terms say the customer owns output generated for it.
- **HeyGen Video.** Closed model. HeyGen's terms, last updated 16 October, say paying users own their output and may use it commercially; free-plan output is licensed for personal, non-commercial and evaluation use only. The terms also give HeyGen a broad licence to your content, including to train its models.

This is a summary, not legal advice.

## Summary

| # | Question | PixVerse V6 | HeyGen Video |
|---|---|---|---|
| 1 | Resolution | 360p to 1080p (web upscale to 4K) | 480p to 2K |
| 2 | Aspect ratios | 8 incl. 21:9 | 6 at 480p/768p; 16:9 or 9:16 at 1080p and 2K |
| 3 | Reference types | first/last frame, subject, background, video, extend | first/end frame, images, video, audio |
| 4 | References at once | 10 images + 2 videos (15 s) | 9 images + 3 videos + 3 audio, 15 total |
| 5 | Price, 10 s (19 Nov) | about $0.53 at 720p, $1.02 at 1080p, with audio | about $0.18 at 768p promo ($0.30 from Dec), $0.40 at 1080p promo |
| 6 | Performance (AA, 19 Nov) | T2V 25th, silent T2V 24th | silent T2V 1st, T2V 8th |
| 7 | Character consistency | tagged subject references | references keep people and products (HeyGen claim) |
| 8 | Scene consistency | backgrounds, multi-shot, extend | in-shot stability claim, frame chaining |
| 9 | vs previous | cheaper than V5.6 with audio; V6 Max added | first scene model; 2K, 30 s, web added |
| 10 | Users | friendly partner reports | no independent reviews found |
| 11 | Quality | not tested by us | not tested; HeyGen lists weak spots |
| 12 | Verdict (opinion) | control and price | sound, length and rank |

## Why this matters

These two show how quickly video prices are falling: both list 10 second clips with sound for about a dollar or less, and HeyGen's launch rate is lower still until 30 November. If you are adding video to a product, HeyGen Video currently has the stronger independent ranking and longer clips, while PixVerse V6 gives you more references, aspect ratios and camera control. Either way, build against the per-second rate you will pay after the promotions end.
