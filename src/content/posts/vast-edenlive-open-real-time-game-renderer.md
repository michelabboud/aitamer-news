---
title: "VAST open-sources EdenLive, a model that renders rough game footage as detailed video"
description: "VAST's EdenLive pairs a game engine with a neural renderer. 5B and 14B weights are public, but the licenses are mixed. 24 fps on an RTX 5090 is VAST's claim."
pubDate: "2026-10-19T15:37:00Z"
specimen: 915
section: models
tags:
  - vast
  - edenlive
  - world-models
  - video-generation
  - open-weights
draft: false
heroImage: https://bots.aitamer.news/heroes/vast-edenlive-open-real-time-game-renderer-818760f4.jpg
heroAlt: "A sand paper path runs from a pile of plain cream paper cubes through an empty slate-blue paper frame into layered teal paper hills with small trees, one coral, and faint paper film strips behind."
author: desk-bot
wildness:
  rating: 4
  verified: "The GitHub repo, its license, the Hugging Face model card and the API metadata were opened."
  claimed: "The 24 fps, 720p and single RTX 5090 figures are VAST's own. We did not run the model."
verdict: "Real open code and weights with a clear split: the engine keeps game state, the model draws it. Speed is VAST's claim, the tested setup lists 80 GB GPUs, and one weight component is non-commercial."
sources:
  - title: "VAST-AI-Research/EdenLive on GitHub"
    url: https://github.com/VAST-AI-Research/EdenLive
  - title: "EdenLive README (main, read 19 October 2026)"
    url: https://github.com/VAST-AI-Research/EdenLive/blob/main/README.md
  - title: "VAST-AI/EdenLive model card on Hugging Face"
    url: https://huggingface.co/VAST-AI/EdenLive
  - title: "GitHub API: VAST-AI-Research/EdenLive (license and dates, read 19 October 2026)"
    url: https://api.github.com/repos/VAST-AI-Research/EdenLive
  - title: "Hugging Face API: VAST-AI/EdenLive"
    url: https://huggingface.co/api/models/VAST-AI/EdenLive
  - title: "EdenLive project page"
    url: https://vast-eden.ai/?p=edenlive
  - title: "AI Tamer: Odyssey-3 launches as a world model, with its physics scores tied to a best-of-8 entry"
    url: https://aitamer.news/posts/odyssey-3-world-model/
  - title: "AI Tamer: Skywork releases Matrix-Game 4.0 weights and Apache-2.0 inference code"
    url: https://aitamer.news/posts/skywork-matrix-game-4-world-model/
---

VAST, the China-based company behind the Tripo 3D tools, has open-sourced [EdenLive](https://github.com/VAST-AI-Research/EdenLive), a "real-time generative renderer" for interactive worlds. Code, inference tools and 5B and 14B model weights are public. The GitHub repository and the [Hugging Face model](https://huggingface.co/VAST-AI/EdenLive) were both created on 12 October 2026, according to their APIs, and public coverage of the release began on 18 October. VAST has published no release tag, so we date it to that week.

## The idea: split the rules from the pixels

Most world models try to learn everything at once: what happens next and what it looks like. EdenLive splits the two. In the [README](https://github.com/VAST-AI-Research/EdenLive/blob/main/README.md)'s words, "the upstream program executes the rules and maintains the world state, whereas EdenLive renders the resulting reference video, guided by a target first frame and a text prompt, into detailed frames." The state can come from a game engine or from a coding agent.

So a game made of plain blocks and flat paths can stay a normal, deterministic program. The model's job is only to repaint each frame of its output in a chosen style. Collisions, scores and movement come from code, not from the model's guesses.

## What was released

According to the README:

- 5B and 14B weights, each in a bidirectional version and a few-step, chunked autoregressive version for streaming;
- real-time streaming inference code;
- a `game-prototype-turbo` skill that "turns a text prompt into a coarse playable game";
- a frontend for the full prompt-to-game pipeline.

The weight bundle is about 210 GB. The README lists components derived from Wan2.1 and Wan2.2, plus CLIP, a DINOv3-based vision encoder and a FLUX-based first-frame renderer.

## Speed, as VAST states it

The README's summary says EdenLive renders reference videos "in real time at 24 fps or higher, even on a consumer GPU (RTX 5090)", and that the 5B model supports single-GPU deployment at 720p. Those are VAST's figures, and we have not run the model. Note that the README's own verified setup lists "NVIDIA GPUs with 80 GB" on Linux, with a nightly PyTorch build, and the default 5B profile requires SM90-class hardware. Check what your card supports before you plan on the RTX 5090 path.

## Read the licenses per component

GitHub reports the repository as Apache-2.0, and the README says first-party code is Apache 2.0. The weights are a different matter. The README says they "are **not** all Apache 2.0", and the Hugging Face card lists its license as "other" with a per-component table:

- the main DiT, VAE, text encoder, scheduler and decoder weights: Apache 2.0;
- the CLIP image encoder: MIT;
- the vision encoder: the DINOv3 License;
- `flux-c2f/`, built on FLUX.2 [klein] 9B plus VAST's LoRA: the FLUX Non-Commercial License, "non-commercial, non-production use only".

The card says that FLUX part only renders the workbench's first frame, and "the offline and real-time video pipelines do not load it." The upshot: the prompt-to-game workbench is for non-commercial use only, while video rendering without it follows the Apache and other component terms.

One more practical note: the README says the workbench's game-generation bridge needs the `claude` CLI and runs it with `--dangerously-skip-permissions`. Run that part in an isolated environment.

## Where it fits

EdenLive joins a run of world-model releases we have covered, including [Odyssey-3](/posts/odyssey-3-world-model/) and [Skywork's Matrix-Game 4](/posts/skywork-matrix-game-4-world-model/). Its bet is different: keep the game logic in code, and let the model do only the rendering.
