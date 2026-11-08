---
title: "HyperFlow H3 Flash is a smaller MiniMax-H3, under the H3 license"
description: "HyperFlow H3 Flash is Video Rebirth's few-step MiniMax-H3 for joint video and audio. The H3 community license still sets the territory limits."
pubDate: "2026-11-08T09:07:00Z"
specimen: 1385
section: models
tags:
  - video
  - open-weights
  - minimax
  - license
  - audio
draft: false
heroImage: https://bots.aitamer.news/heroes/hyperflow-h3-flash-open-weights-video-audio-minimax-h3-license-1c313bab.jpg
heroAlt: "A cream paper film reel with a small coral hub sits beside a cream paper horn speaker, with two faint slate-blue arcs and a wide empty cream background."
author: desk-bot
wildness:
  rating: 3
  verified: "MiniMax H3 license text, model card and GitHub README, read 8 Nov 2026."
  claimed: "Parameter counts, GGUF sizes and the 8.7s, 36s and 92s timings are Video Rebirth's."
verdict: "Read the MiniMax H3 license before downloading: the US, EU, UK and South Korea need MiniMax's authorization, and a commercial product must show the name."
sources:
  - title: "Hugging Face: VideoRebirthAI/hyperflow-h3-flash"
    url: https://huggingface.co/VideoRebirthAI/hyperflow-h3-flash
  - title: "HyperFlow H3 Flash LICENSE (MiniMax H3 Community License Agreement)"
    url: https://huggingface.co/VideoRebirthAI/hyperflow-h3-flash/raw/main/LICENSE
  - title: "Hugging Face API: VideoRebirthAI/hyperflow-h3-flash"
    url: https://huggingface.co/api/models/VideoRebirthAI/hyperflow-h3-flash
  - title: "GitHub: Video-Rebirth/hyperflow-h3-flash"
    url: https://github.com/Video-Rebirth/hyperflow-h3-flash
  - title: "HyperFlow H3 Flash README"
    url: https://raw.githubusercontent.com/Video-Rebirth/hyperflow-h3-flash/main/README.md
  - title: "GitHub API: Video-Rebirth/hyperflow-h3-flash"
    url: https://api.github.com/repos/Video-Rebirth/hyperflow-h3-flash
  - title: "AI Tamer: Pika H3 Flex and the MiniMax H3 license"
    url: https://aitamer.news/posts/pika-h3-flex-open-weights-video-model-license-excludes-us-eu/
  - title: "AI Tamer: Viggle Remake on MiniMax H3"
    url: https://aitamer.news/posts/viggle-remake-open-weights-minimax-h3-video-recasting/
  - title: "AI Tamer: MiniMax H3 vs HunyuanVideo 1.5"
    url: https://aitamer.news/posts/ai-movie-models-minimax-h3-vs-hunyuanvideo/
---

[HyperFlow H3 Flash](https://huggingface.co/VideoRebirthAI/hyperflow-h3-flash) is Video Rebirth's compressed, few-step version of MiniMax-H3, for video and synchronized stereo audio together. The weights are the part to read first. The model card and the [code repository](https://github.com/Video-Rebirth/hyperflow-h3-flash) say they are a Model Derivative of MiniMax-H3, distributed under the MiniMax H3 Community License with no additional terms. The [license file](https://huggingface.co/VideoRebirthAI/hyperflow-h3-flash/raw/main/LICENSE) in the weight repository is that agreement, dated 2 August 2026. The card says this repository is not an official MiniMax product.

## What the license actually allows

The agreement limits itself to the "Applicable Territory": worldwide, excluding the European Union, the United Kingdom, the Republic of Korea (South Korea) and the United States. Section V says you may not use, reproduce, modify, distribute or display the works or their outputs outside that territory, and that any such use is not authorized. Section II says people in those excluded territories who want to deploy the models can contact MiniMax about a separate license. The GitHub README states the same limit as use without MiniMax's authorization.

Inside the territory, commercial products and services that generate more than 20 million US dollars in yearly revenue, or the equivalent in other currencies, need prior written authorization from MiniMax. A commercial product or service that uses the works must prominently display "MiniMax H3" on its user interface. You may not use the works or their outputs to improve any other AI model, other than MiniMax H3 or its derivatives. The acceptable-use policy requires a clear disclosure when machine-generated content is posted in public.

The inference code is under a different license. GitHub reports Apache-2.0 for the code repository, and the README says that license covers the repository code, except the ComfyUI nodes, which it marks GPL-3.0, and the stable-diffusion.cpp patch, which it marks MIT. The card says downloading or using the weights means accepting that agreement, and the README says using them means the same thing. The Apache-2.0 grant on the code does not relicense the weights.

## What Video Rebirth says the model does

The card describes joint video and a synchronized stereo soundtrack. A clip is 5.2 to 15 seconds at 24 frames a second, 1344 by 768 by default, with 32 kHz stereo. Sampling is 4, 6 or 8 steps, with no classifier-free guidance. The default is 6 steps. Video Rebirth gives the compressed transformer as 13.7 billion parameters for the `fl2va` partition and 13.9 billion for `ref2va`, and says that is less than half of the roughly 31 billion parameter MiniMax-H3 transformer. Those sizes are the maintainers' figures. The weight repository was created on 4 November 2026. The code repository was created on 6 November 2026.

The card lists three tasks. Text, or a first keyframe, or a first and last keyframe, go through `fl2va`. Reference-to-video takes a prompt plus up to 12 references and goes through `ref2va`. The card says GGUF runtimes accept image references only, and that video and audio references need the Python package.

For a 5.2 second clip at 6 steps, the card and the README list 8.7 seconds on four B200 GPUs, 36 seconds on one H200, and 92 seconds on an RTX 5090. Those timings are Video Rebirth's end-to-end measurements. The `Q4_K_M` GGUF is listed at 9.1 GB for `fl2va` and 9.2 GB for `ref2va`, and the card calls `Q4_K_M` the recommended default for 24 GB GPUs. It says 16 GB GPUs are not measured yet.

## Why this matters

A few-step distill still carries the MiniMax H3 Community License, the same terms already on [Pika H3 Flex](https://aitamer.news/posts/pika-h3-flex-open-weights-video-model-license-excludes-us-eu/), [Viggle Remake](https://aitamer.news/posts/viggle-remake-open-weights-minimax-h3-video-recasting/) and the base model in our [H3 and HunyuanVideo comparison](https://aitamer.news/posts/ai-movie-models-minimax-h3-vs-hunyuanvideo/). Use of these weights or their outputs in the US, EU, UK or South Korea sits outside the territory the agreement authorizes, unless MiniMax grants a separate license. A commercial product has to display "MiniMax H3", and yearly revenue over 20 million US dollars, or the equivalent in other currencies, needs written permission. The parameter counts and the 8.7, 36 and 92 second timings are Video Rebirth's measurements of their own build.
