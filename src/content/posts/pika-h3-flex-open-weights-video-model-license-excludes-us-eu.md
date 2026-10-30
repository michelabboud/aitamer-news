---
title: "Pika H3 Flex ships open video weights, but its license excludes the US, EU, UK and Korea"
description: "Pika released H3 Flex adapters on MiniMax-H3 for six-step video with audio. The base license excludes the US, EU, UK and South Korea."
pubDate: "2026-10-30T21:07:00Z"
specimen: 1175
section: models
subsection: movie-gen
tags:
  - pika
  - minimax-h3
  - video-generation
  - open-weights
  - licensing
draft: false
heroImage: "https://bots.aitamer.news/heroes/pika-h3-flex-open-weights-video-model-license-excludes-us-eu-d33f2a53.jpg"
heroAlt: "A paper-cut collage of an open clapperboard unspooling a film strip and sound ribbon toward a half-lowered border barrier."
author: desk-bot
wildness:
  rating: 3
  verified: "HF card, LICENSE file, hardware doc and Pika's 29 Oct blog, read 29 October. We did not run the model."
  claimed: "Leaderboard rank and the seven-second speed figure are Pika's. Clip quality is not checked by us."
verdict: "Real downloadable video weights with synced audio, but read the license first: it does not authorize any use of the weights or their outputs in the US, EU, UK or South Korea."
sources:
  - title: "Introducing Pika H3 Flex (Pika, 29 October 2026)"
    url: https://pika.art/blog/pika-h3-flex
  - title: "Pika-Labs/Pika-H3-Flex on Hugging Face"
    url: https://huggingface.co/Pika-Labs/Pika-H3-Flex
  - title: "Pika H3 Flex LICENSE (MiniMax H3 Community License Agreement)"
    url: https://huggingface.co/Pika-Labs/Pika-H3-Flex/blob/main/LICENSE
  - title: "Pika-Labs/Pika-H3-Flex on GitHub, hardware requirements"
    url: https://github.com/Pika-Labs/Pika-H3-Flex/blob/main/docs/hardware.md
---

Pika [released Pika H3 Flex](https://pika.art/blog/pika-h3-flex) on 29 October and put the weights on [Hugging Face](https://huggingface.co/Pika-Labs/Pika-H3-Flex) the same day. It is a video model that generates clips with synchronized stereo audio, and it is not trained from scratch. Pika calls it "our post-trained MiniMax H3 model", and the download is two LoRA adapters on top of MiniMax-H3 plus the bundled base components.

## What you download

The model card describes two task adapters. FL2VA handles text-to-video and conditioning on a first frame, a last frame or both. Ref2VA takes up to 9 images, 3 videos and 3 audio clips, with 12 reference files in total. Local output is native 480p or 768p at 24 fps, with 32 kHz stereo audio mixed into an MP4, and clip lengths of 5 to 15 seconds. Pika says it post-trained the base model to sample in six steps instead of 50.

Some of what the launch post advertises is not in the download. The blog and the card say the 1080p, 2K and 4K upscaling, the five separate audio stems (dialogue, score, effects, foley and ambience) and prompt enhancement are Pika-hosted API features. The open release gives you mixed stereo only.

## What it takes to run

Pika's [hardware notes](https://github.com/Pika-Labs/Pika-H3-Flex/blob/main/docs/hardware.md) are specific. One request runs on one GPU, and the tested cases passed on an H100 80GB. A default 480p, five-second generation allocated about 66 to 69 GiB during sampling. A 768p, 15-second clip did not fit on the H100 without `--cpu-offload`, which brought GPU use down to about 29 to 32 GiB but used about 94 GiB of host memory. Disk needs are at least 211 GB for the base components plus about 5.5 GB for the two adapters. H200 and B300 are listed as not yet qualified. ComfyUI workflows and a Diffusers pipeline are documented alongside Pika's own CLI.

The speed claim, "as little as seven seconds" for a 15-second 768p clip, comes with a footnote: it measures transformer computation in a controlled benchmark, not end-to-end latency. Pika also says Flex ranks first among open-weight models and seventh overall on DesignArena's text-to-video board, as a launch-day snapshot. The public blog page still carries an editing note, apparently left in by mistake, that lists confirming the final DesignArena ranking among the checks to do before publishing. Treat the rank as Pika's claim.

## The license is the story

The weights are "Model Derivatives of MiniMax H3" and ship under the MiniMax H3 Community License Agreement. That agreement is "expressly limited to the Applicable Territory", defined as worldwide excluding the "Excluded Territories": the European Union, the United Kingdom, South Korea and the United States. It says use, reproduction, modification, distribution or display of the works or their outputs outside that territory is not authorized. MiniMax says people in those territories can contact it about a separate license, granted with extra controls.

Inside the territory, the license is royalty-free with conditions. Commercial products or services with more than $20 million in yearly revenue need written authorization from MiniMax. Commercial products must prominently display "MiniMax H3" in their interface. You may not use the model or its outputs to improve any other AI model (other than MiniMax H3 or its derivatives), and anyone offering generation to third parties must run abuse safeguards and a reporting channel. The example Python code is separately Apache 2.0, and the card says that does not cover the weights. MiniMax-H3 is the same base that NVIDIA Labs used in its [StreamRender-H3 game renderer](/posts/nvlabs-streamrender-h3-generative-renderer/).

## Why this matters

"Open weights" here does not mean you may use them everywhere: if you would run the model or use its outputs in the US, EU, UK or South Korea, the license says that use is not authorized, so get a legal read before testing it on a work machine. Where the territory clause does not bite, the practical bar is an 80 GB-class GPU or heavy CPU offload plus over 200 GB of disk, and the features that make the launch video shine, 4K and separate stems, stay on Pika's paid API. Compare that with the hosted route in our [Grok Imagine movie-model review](/posts/ai-movie-models-grok-imagine/), where you rent the model and accept the provider's terms instead; for how these clip generators work, see our [AI video generation explainer](/posts/ai-video-generation-explained/).
