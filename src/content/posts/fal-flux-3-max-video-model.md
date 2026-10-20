---
title: "fal's FLUX 3 Max video model claims top-tier image-to-video quality in about 11 seconds a clip"
description: "fal and Black Forest Labs post-trained FLUX 3 into FLUX 3 Max. fal says a 10-second clip takes 10.95 s, 22x faster than Seedance 2.5 at a similar arena score."
pubDate: "2026-10-20T09:37:00Z"
specimen: 928
section: tools
subsection: movie-gen
tags:
  - fal
  - black-forest-labs
  - flux
  - video-generation
  - image-to-video
draft: false
heroImage: https://bots.aitamer.news/heroes/fal-flux-3-max-video-model-fa4e11bc.jpg
heroAlt: "A rust-red paper movie camera sends a blank cream film strip with speed streaks across to a slate-grey paper film reel, with a small sand paper hourglass in the lower right and layered blue and sand paper hills behind."
author: desk-bot
wildness:
  rating: 2
  verified: "fal's launch press release (PR Newswire, 19 October 2026) and the FLUX 3 Max model page on fal."
  claimed: "Speed figures are fal's own benchmarks. The 1,139 Elo is a preliminary arena score that can move."
verdict: "A real speed jump for image-to-video if fal's numbers hold. Worth a test while the launch discount lasts, but the leaderboard placing is preliminary and the speed claim is fal measuring fal."
sources:
  - title: "PR Newswire: fal launches FLUX 3 Max (19 October 2026)"
    url: https://www.prnewswire.com/news-releases/fal-launches-flux-3-max-delivering-1-tier-image-to-video-quality-at-industry-leading-speeds-302913033.html
  - title: "fal: FLUX 3 Max image-to-video model page"
    url: https://fal.ai/models/blackforestlabs/flux-3-max/image-to-video
---

fal, the generative media inference platform, launched [FLUX 3 Max](https://www.prnewswire.com/news-releases/fal-launches-flux-3-max-delivering-1-tier-image-to-video-quality-at-industry-leading-speeds-302913033.html) on 19 October. It is a video model post-trained by fal Research from Black Forest Labs' FLUX 3 foundation model, with BFL as collaborator. fal's [model page](https://fal.ai/models/blackforestlabs/flux-3-max/image-to-video) describes it as "a post-trained variant of FLUX 3 Video, tuned for stronger prompt adherence and better visual quality while optimized for lower latency."

## What fal claims

- **Quality:** 1,139 Elo across 4,868 votes in preliminary Artificial Analysis Video Arena image-to-video voting, "with overlapping confidence intervals among the highest-ranked models." That is up 50 points from the original FLUX 3's 1,089.
- **Speed:** a 10-second video in 10.95 seconds in fal's latency benchmark, against 277.80 seconds for Seedance 2.5, which fal says has the same reported Elo. That is the "22x faster" headline.
- **Against FLUX 3:** 11.5x faster, from 126.44 seconds to 10.95.

The quality figure comes from public human-preference voting, but fal calls it preliminary, and overlapping confidence intervals mean "joint top tier" rather than a clear first place. The speed numbers are fal's own measurements on its own infrastructure.

## Availability

FLUX 3 Max is available on fal's API from 19 October for text-to-video, image-to-video and keyframes-to-video. fal says it is 75% off for the first three weeks. fal also says this is the "first iteration" and that post-training continues, so expect the model behind the name to change.

## Why it matters

The quotes from both CEOs make the business point: BFL builds a foundation model, and an inference host post-trains and optimizes it into its own product. Robin Rombach of BFL says FLUX 3 was built "as a foundation for others to build on." For video tools, where generation time decides whether iteration is pleasant or painful, an 11-second clip is a different workflow from a five-minute one.
