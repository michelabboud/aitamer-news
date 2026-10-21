---
title: "Kling 4.0 is out of beta, and its API now has a per-second price"
description: "Kling 4.0 opened to all kling.ai users on 15 October. Today Kling said the 4.0 API is rolling out and listed $0.157 a second at 720p. HDR and 4K wait."
pubDate: "2026-10-21T19:07:00Z"
section: tools
subsection: movie-gen
tags:
  - kling
  - kling-4-0
  - kuaishou
  - video-generation
  - api-pricing
draft: false
heroImage: "https://bots.aitamer.news/heroes/kling-4-0-general-availability-39a16e39.jpg"
heroAlt: "Paper-cut illustration of a film reel unwinding its strip into a blank-faced stopwatch, with a small stack of round paper tokens beside it."
author: desk-bot
wildness:
  rating: 2
  verified: "Kuaishou 16 Oct release, Kling feature page, Kling API price table, Kling posts on X 21 Oct."
  claimed: "Motion and quality claims are Kling's. 1080p, 4K, HDR, 21:9 and 2-minute extension are not confirmed live."
verdict: "If you were waiting for an API, it has a price now: about $0.16 a second at 720p, so a 30 second take is roughly $4.70. Treat 1080p, 4K and HDR as coming soon until Kling's own pages say otherwise."
sources:
  - title: "Kuaishou Technology: Kling AI officially launches next-generation Kling 4.0 (16 October 2026)"
    url: https://ir.kuaishou.com/news-releases/news-release-details/kling-ai-officially-launches-next-generation-kling-40-raising/
  - title: "Kling AI: Kling 4.0 feature page (read 21 October 2026)"
    url: https://kling.ai/feature/kling-4-ai-video-generation
  - title: "Kling AI Open Platform: video pricing (read 21 October 2026)"
    url: https://kling.ai/document-api/pricing/base/video
  - title: "Kling AI on X: Kling 4.0 API rolling out (21 October 2026)"
    url: https://x.com/Kling_ai/status/2112946255257084260
---

Kling 4.0 is no longer a beta. Kuaishou's [investor release](https://ir.kuaishou.com/news-releases/news-release-details/kling-ai-officially-launches-next-generation-kling-40-raising/) says the full model "officially launched on October 15" on kling.ai, two weeks after the faster Flash variant went to a closed group ([our Flash story](/posts/kling-4-0-flash-closed-beta/)). On 21 October Kling added the piece developers asked for: its account [posted](https://x.com/Kling_ai/status/2112946255257084260) that the Kling 4.0 API is "officially rolling out now", and Kling's own API price table now carries a Kling 4.0 row.

## What is live

Per the [feature page](https://kling.ai/feature/kling-4-ai-video-generation) and Kuaishou's release:

- **3 to 30 seconds in one pass**, up from 15 seconds on Kling 3.0, with no stitching.
- **Omni Reference with up to 15 inputs**: up to 10 images, up to 5 reference videos (30 seconds combined) and up to 7 subject elements, plus voice references.
- **Up to 10 keyframes** placed along the timeline.
- **Prompts up to 8,000 tokens**, targeted editing of an existing clip, and "creative recreation" that reuses a reference video's pacing with your own product or character.
- **MCP and CLI access**: Kuaishou says Kling 4.0 is integrated with Kling MCP and CLI, so agents can call Omni Reference and keyframe-to-video.

## What the API costs

Kling's [video pricing table](https://kling.ai/document-api/pricing/base/video) bills Kling 4.0 per second of total duration:

| Kling 4.0 API | 720p | 1080p |
|---|---|---|
| No input video | $0.157/s | $0.235/s |
| With input video | $0.094/s | $0.141/s |

The input video rate is not a discount. When your reference video is no longer than the output, Kling charges for twice the output length; when it is longer, it charges input plus output seconds. That works out to about $0.188 a second at 720p for a short reference. For comparison, Kling 3.0 without audio is $0.084 a second at 720p on the same table. No 4K price is listed for 4.0.

Kling's [API changelog](https://kling.ai/document-api/updates/api) had no Kling 4.0 entry when we checked on the evening of 21 October, and its API docs index still lists 3.0 endpoints only, so expect the reference pages to land after the price.

## What is still "coming soon"

Kling's pages are not fully consistent, so we follow the cautious wording. The feature page says native 4K and 1080p output with 10-bit HDR is "coming soon". Kuaishou's release says Kling 4.0 "will also support" 4K, 1080p and 21:9, and that extension to two minutes will "soon" arrive. The API table quoting a 1080p rate does not by itself show 1080p renders are available, and we have not tested it.

Kling's account also says 4.0 is available on partner platforms such as fal and Higgsfield. Those listings are the partners' products, not Kling's own API.

Our full Kling explainer, with plans, rights and what users report, follows in the AI movie models series.
