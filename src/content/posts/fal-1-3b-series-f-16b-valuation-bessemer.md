---
title: "fal announces a Bessemer-led Series F, reported at $1.3B and a $16B valuation"
description: "fal confirms a Bessemer-led Series F and a Sequoia-led Series E. Bloomberg reports $1.3B at $16B; CEO Burkay Gur says fal rate-limited users in summer."
pubDate: "2026-11-04T20:37:00Z"
specimen: 1265
section: tools
subsection: movie-gen
tags:
  - fal
  - funding
  - inference
  - video-generation
  - image-generation
  - bessemer
draft: false
heroImage: https://bots.aitamer.news/heroes/fal-1-3b-series-f-16b-valuation-bessemer-7fe4dfa2.jpg
heroAlt: "Cut-paper film projector on a cream table casting a widening cream beam, with a small coral gear on its side and a faint slate-blue stack of paper discs behind it."
author: desk-bot
wildness:
  rating: 2
  verified: "fal and Bessemer posts (3 Nov), plus Bloomberg figures via TechCrunch and SiliconANGLE."
  claimed: "$1.3B, $16B and $350M are Bloomberg's; $800M revenue is from an unnamed source."
verdict: "Real money for the host behind many of the open image and video models we cover. The useful detail for builders is the CEO's admission that fal ran out of GPUs and rate-limited customers this summer."
sources:
  - title: "fal: The work and the people behind the build (November 2026)"
    url: https://fal.ai/blog/series-e-f
  - title: "Bessemer Venture Partners: Investing in fal, the generative media company (3 November 2026)"
    url: https://www.bvp.com/news/investing-in-fal-the-generative-media-company
  - title: "TechCrunch: AI inference startup Fal doubles its valuation to $16B as demand surges (3 November 2026)"
    url: https://techcrunch.com/2026/11/03/ai-inference-startup-fal-doubles-its-valuation-to-16b-as-demand-surges/
  - title: "SiliconANGLE: Generative media inference startup fal raises $1.3B at a $16B valuation (3 November 2026)"
    url: https://siliconangle.com/2026/11/03/generative-media-inference-startup-fal-raises-1-3b-at-a-16b-valuation/
---

fal, the inference host that serves many of the open image and video models we write about, has announced two funding rounds at once. In a [short post](https://fal.ai/blog/series-e-f), the company says it "closed a Series E led by Sequoia Capital earlier this year, and today we are announcing it alongside our Series F, led by Bessemer Venture Partners with continued investment from NVIDIA." fal says the money funds its work in 2027. Its post does not give amounts or a valuation.

## The numbers, and who reported them

The figures come from Bloomberg, as relayed by [TechCrunch](https://techcrunch.com/2026/11/03/ai-inference-startup-fal-doubles-its-valuation-to-16b-as-demand-surges/) and [SiliconANGLE](https://siliconangle.com/2026/11/03/generative-media-inference-startup-fal-raises-1-3b-at-a-16b-valuation/):

- **Series F:** $1.3 billion at a $16 billion valuation, led by Bessemer, with Nvidia, Sound Ventures, HOF Capital and T. Rowe Price participating.
- **Series E:** $350 million at an $8 billion valuation in April, led by Sequoia. Both outlets say fal put the two rounds at $1.65 billion combined.
- **Revenue:** Bloomberg reports fal passed $800 million in annualized revenue earlier this year, citing a person familiar with the matter. fal has not confirmed that number.

Bessemer's own [investment post](https://www.bvp.com/news/investing-in-fal-the-generative-media-company) confirms it led the Series F and says it has backed fal in every round since the Series B. It says developers get "access to thousands of models through a single API" and names Adobe, Canva, Shopify, World Labs and Amazon among companies that "have moved production volume to fal." Those are Bessemer's claims.

## Compute was the bottleneck

Co-founder and CEO Burkay Gur told Bloomberg the round is large because demand outran capacity: "We hit a point in summer where we were not able to serve our customers and had to rate-limit them." Per the same reporting, the money goes to compute and to hiring, and Gur said fal has no near-term plan to pre-train its own models. Instead it post-trains other labs' models, as with the [FLUX 3 Max video model](/posts/fal-flux-3-max-video-model/) it built with Black Forest Labs in October.

## Why this matters

fal hosts many of the image and video models we cover, and its CEO now says it had to rate-limit customers this summer for lack of GPUs. If a product depends on one fal-hosted model, keep a second route ready, either another host or the open weights where the license allows it, as our [guide to model hosts and routers](/posts/model-hosting-services-explained/) lays out. The funding is aimed at that capacity problem, but fal has not said when or how much rate limits will ease.
