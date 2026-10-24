---
title: "Tencent's Hy-Nomas is an open-weight world model you steer with text and camera moves, segment by segment"
description: "Hy-Nomas, under Apache-2.0, generates 720p video at 24 fps one segment at a time. The default setup wants eight GPUs; a low-memory mode targets one RTX 4090."
pubDate: "2026-10-24T08:07:00Z"
section: models
subsection: movie-gen
tags:
  - tencent
  - hunyuan
  - world-model
  - video-generation
  - open-weights
  - camera-control
draft: false
heroImage: "https://bots.aitamer.news/heroes/tencent-hy-nomas-open-interactive-world-model-56218b92.jpg"
heroAlt: "A paper film strip of mountain frames unrolls into a layered teal and sand valley, with a small camera on a dotted path and a coral sun above."
author: desk-bot
wildness:
  rating: 3
  verified: "The Hy-Nomas model card, license and GitHub repo, plus TencentHunyuan's 23 October post."
  claimed: "No quality scores yet, the technical report is marked coming soon, and 4090 speed is not stated."
verdict: "One of the few open-weight interactive world models with a permissive license and a camera interface. Try the demo first; running it yourself means eight GPUs or a patient 4090 with lots of system RAM."
sources:
  - title: "tencent/Hy-Nomas model card (Hugging Face)"
    url: https://huggingface.co/tencent/Hy-Nomas
  - title: "Tencent-Hunyuan/Hy-Nomas code repository (GitHub)"
    url: https://github.com/Tencent-Hunyuan/Hy-Nomas
  - title: "Hy-Nomas-Bench (Hugging Face dataset)"
    url: https://huggingface.co/datasets/tencent/Hy-Nomas-Bench
  - title: "Tencent Hy on X: Introducing Hy-Nomas (23 October 2026)"
    url: https://x.com/TencentHunyuan/status/2113676827114053892
---

Tencent's Hunyuan team has released [Hy-Nomas](https://huggingface.co/tencent/Hy-Nomas), a "video world generation model" that you direct as it goes. Instead of one prompt and one clip, it builds a world one video segment at a time. Between segments you can add objects, change the style or scene, describe actions, or move the camera. The team [announced it on X](https://x.com/TencentHunyuan/status/2113676827114053892) on 23 October, and the weights and code are out under Apache-2.0.

## How it works

The model card describes a segment-autoregressive diffusion transformer:

- **Backbone.** A dense multimodal diffusion transformer with 54 double-stream blocks and a hidden size of 2,048.
- **Text.** The language part of Qwen2.5-VL-7B-Instruct encodes prompts, and each segment can have its own prompt.
- **Camera.** You pass camera trajectories as 4x4 extrinsic matrices, which feed cross-attention in every block.
- **Memory.** A persistent key/value cache carries earlier segments forward, so the world stays consistent as it grows.
- **Output.** A fine-tuned PixelUMM decoder turns latents into video. The distilled checkpoint uses 8 denoising steps and outputs 720x1280 at 24 fps.

Offline runs take a JSON list of requests, each split into timed segments (the example uses two 5-second segments). The repo also ships two LoRA adapters: a "cinematic" quality adapter and a robotics adapter trained on a real-world robotic-arm dataset, meant to improve robot simulation in the generated worlds.

## What it takes to run

- **Standard setup:** 8-way sequence parallelism, so eight GPUs in one inference group. It keeps the full history, and cache memory grows as the world gets longer.
- **Low-memory setup:** aimed at a single NVIDIA GeForce RTX 4090. It uses an INT8 DiT and an FP8 decoder, keeps up to 18 historical latent frames on the GPU, archives the rest in system RAM and moves models on and off the GPU per stage. The card warns that this adds latency and needs a lot of system RAM.
- **Web demo:** needs a separate prompt-enhancement service, Nomas-PE, with its own serving resources. The single-GPU claim covers video inference only.

The card says 24 fps is the playback rate, not generation speed, which "depends on hardware, resolution, segment length, history" and configuration. Tencent gives no generation-time figures.

## How good is it

We cannot say yet. Tencent released [Hy-Nomas-Bench](https://huggingface.co/datasets/tencent/Hy-Nomas-Bench), 280 test cases across free-form text interaction, camera navigation, mixed text and camera control, and spatial memory. But the card publishes no scores, and the technical report is marked "coming soon." The promo video and the gallery are Tencent's own picks.

## License

The code and weights are under Apache-2.0, which allows commercial use. Tencent notes that third-party components keep their own licenses, which the LICENSE file lists, so check those before you ship anything built on it.

## Practical takeaway

If you work on interactive video, game prototyping or robot simulation, Hy-Nomas is worth a look for its camera control and segment-by-segment steering. Start with the [hosted demo](https://hy-nomas.hy.tencent.com/), then try the single-GPU config on a 4090 box with plenty of RAM. Wait for the technical report and outside tests before comparing it with closed video models.
