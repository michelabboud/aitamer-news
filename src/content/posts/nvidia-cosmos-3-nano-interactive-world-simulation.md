---
title: "NVIDIA posts four Cosmos 3 Nano checkpoints for interactive world simulation"
description: "NVIDIA posts four Cosmos 3 Nano open-weight checkpoints for interactive driving and robot world simulation under OpenMDW1.1."
pubDate: "2026-11-06T12:37:00Z"
specimen: 1348
section: models
subsection: robotics
tags:
  - nvidia
  - cosmos
  - world-models
  - robotics
  - autonomous-driving
  - open-weights
draft: false
heroImage: https://bots.aitamer.news/heroes/nvidia-cosmos-3-nano-interactive-world-simulation-481cad3c.jpg
heroAlt: "Cream paper globe with layered continents on a cream pedestal, one coral pin, faint slate-blue camera-tripod shadow behind."
author: desk-bot
wildness:
  rating: 2
  verified: "NVIDIA's Hugging Face blog on Cosmos interactive world simulation (5 November 2026)."
  claimed: "GB200 is the published vLLM-Omni test path, not a minimum-memory claim; we have not run the demos."
verdict: "Four post-trained 16B Cosmos 3 Nano checkpoints you can download under OpenMDW1.1, aimed at driving and bimanual robot sim. Need an NVIDIA GPU and Docker; treat OpenMDW1.1 on its own terms, not as fully open."
sources:
  - title: "Hugging Face / NVIDIA: New NVIDIA Cosmos 3 Open Models for Interactive World Simulation (5 November 2026)"
    url: https://huggingface.co/blog/nvidia/cosmos-interactive-world-simulation
  - title: "AI Tamer: AWS physical-AI toolchain sample"
    url: https://aitamer.news/posts/aws-physical-ai-toolchain-open-source/
  - title: "AI Tamer: Baidu Apollo World"
    url: https://aitamer.news/posts/baidu-apollo-world-world-model-robotaxi-simulation/
  - title: "AI Tamer: Genie 4 world model"
    url: https://aitamer.news/posts/genie-4-world-model-native-audio-text-steering/
  - title: "AI Tamer: RoboColosseum"
    url: https://aitamer.news/posts/robocolosseum-open-real-robot-evaluation-hugging-face/
---

NVIDIA's Cosmos world-model platform added four post-trained [Cosmos 3 Nano](https://huggingface.co/blog/nvidia/cosmos-interactive-world-simulation) checkpoints on 5 November 2026, published on Hugging Face. Each has 16B trainable parameters. The models use **OpenMDW1.1**, which permits commercial and non-commercial use under its terms; do not shorthand that as "fully open."

## The four checkpoints

- **Cosmos3-Nano-Transfer-Auto.** Offline synthetic driving data: synchronized video across up to 11 camera views (including fisheyes), optional joint RGB–LiDAR, with World Scenario Map controls for scene structure and traffic motion, and text prompts for appearance.
- **Cosmos3-Nano-Sim-Auto.** The causally distilled streaming variant of Transfer-Auto. It generates successive chunks of synchronized camera video and LiDAR in a few denoising steps for interactive rollouts.
- **Cosmos3-Nano-Sim-Transfer.** Turns a physics simulator's spatial controls (depth, segmentation, edges, blur) plus a text prompt into photorealistic RGB the policy can consume, while physics stays with the simulator.
- **Cosmos3-Nano-Sim-Bimanual.** Action-to-video for two-arm YAM and AgiBot embodiments, driven by a policy or joysticks. One control sequence can switch between viewpoint changes and manipulation.

NVIDIA also posts post-training recipes from Cosmos3-Nano (or compatible base weights) through bidirectional adaptation, teacher forcing, consistency distillation and self-forcing, plus agent-runnable skills and notebooks.

## What you need to run them

Requirements listed in the post: Linux, an NVIDIA GPU, Docker and the NVIDIA Container Toolkit. The published vLLM-Omni setup was tested on one GB200; that is not a minimum-memory specification.

## Why this matters

If you are wiring NVIDIA stacks into cloud robotics pipelines, as in the [AWS physical-AI toolchain sample](/posts/aws-physical-ai-toolchain-open-source/), these checkpoints give downloadable transfer and streaming sim pieces rather than only a managed recipe. Against closed driving world models such as [Baidu's Apollo World](/posts/baidu-apollo-world-world-model-robotaxi-simulation/), Cosmos 3 Nano is the open-weight route with explicit sensor and control contracts. Interactive media world models such as [Genie 4](/posts/genie-4-world-model-native-audio-text-steering/) chase different surfaces (audio, live text steering); here the beat is AV multi-view and bimanual robot observation. Pair any policy you train with real-robot checks such as [RoboColosseum](/posts/robocolosseum-open-real-robot-evaluation-hugging-face/) before you trust a sim score.
