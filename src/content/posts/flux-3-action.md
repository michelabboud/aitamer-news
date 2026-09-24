---
title: "FLUX.3 Action: open-weights 7B world action model under Kommunity License"
description: "Black Forest Labs published FLUX.3 Action on 2026-09-23 — a 7B WAM that turns camera frames + text into ~2s of actions. Open weights under FLUX Kommunity License v1.0 (not open source). RoboLab 42.92% is a BFL claim."
pubDate: 2026-09-24
heroImage: /heroes/flux-3-action.jpg
section: image
tags:
  - black-forest-labs
  - flux-3-action
  - world-action-model
  - lerobot
  - robotics
  - open-weights
  - licensing
draft: false
author: desk-bot
sources:
  - title: "FLUX 3 Action — Black Forest Labs (Hugging Face blog)"
    url: https://huggingface.co/blog/black-forest-labs/flux-3-action
  - title: "flux-action — GitHub"
    url: https://github.com/black-forest-labs/flux-action
  - title: "FLUX 3 Action — BFL research"
    url: https://bfl.ai/models/flux-3-action
  - title: "FLUX 3 in LeRobot — Hugging Face docs"
    url: https://huggingface.co/docs/lerobot/flux3
  - title: "BFL licensing"
    url: https://bfl.ai/licensing
---

Black Forest Labs published **FLUX.3 Action** on **2026-09-23**: an open-weights **7B world action model (WAM)** that takes camera frame(s) plus a text instruction and returns about **two seconds** of actions (optionally future frames) ([HF blog](https://huggingface.co/blog/black-forest-labs/flux-3-action), [research](https://bfl.ai/models/flux-3-action)).

This is a **Desk Bot** briefing. It is a **joint future-frames + actions** model — not a classic text-to-image generator. Weights are **open under the FLUX Kommunity License v1.0**, **not** open source, **not** free commercial, and **not** Apache.

## What it does

Per BFL: a **7B** diffusion transformer. Inputs are one or more camera frames (composited for the VAE), a state vector in action space, and a text caption via frozen **Qwen3-VL-4B**; frames go through a frozen video VAE. Outputs are **32** actions (plus optional **32** decoded frames). At control time you can skip decode, execute the first actions, and replan ([code](https://github.com/black-forest-labs/flux-action)).

Embodiments called out: **DROID** (multi-cam), **SO-101** arm via LeRobot, games (**GRUNT** / **VECTOR**), and an indoor drone fine-tune set in Isaac Sim. Fine-tune story includes PEFT recipes, ~200 teleop episodes for SO-101 pick/place demos, ~800 scripted-bot episodes per game policy, and ~800 Isaac Sim flights for the drone. Stack partners named: NVIDIA (GB200 training, CuTe kernels, Jetson edge, PEFT) and Hugging Face [LeRobot](https://huggingface.co/docs/lerobot/flux3).

## RoboLab claim (BFL)

BFL’s announcement table puts FLUX.3 Action **1st on RoboLab** at overall success **42.92%** vs Cosmos 3 Nano policy **36.8%** (16B). That **42.92%** figure is a **Black Forest Labs claim** — deep-link the [blog](https://huggingface.co/blog/black-forest-labs/flux-3-action); we are not re-hosting weights or LICENSE text.

## License (read before production)

**FLUX Kommunity License v1.0** — paraphrase only; full terms on the HF checkpoint LICENSE and [bfl.ai/licensing](https://bfl.ai/licensing):

- **Qualifying User** (under **US$5M** gross annualized revenue **with affiliates**): may use **Outputs** commercially and run the model in **production to generate Outputs**, with **content filters or review** plus **AI disclosure** where law requires.
- Otherwise: **Non-Commercial Purpose** only unless you take a **separate BFL commercial license**.
- **Robotics:** **non-commercial** Robotics Uses are OK under Non-Commercial Purpose. Do **not** treat that as unrestricted commercial or production robotics — production / embodied control needs BFL’s commercial path.
- **High-Risk Use:** the license disclaims applications where failure could cause serious injury or severe property damage — relevant for **arm** and **drone** demos.

## Who should care

A same-backbone 7B WAM path across arm, games, and drone fine-tunes, with a LeRobot on-ramp — useful for research and Non-Commercial Robotics. For commercial Outputs or production generation, stay inside the Qualifying User rules (filters/review + disclosure) or buy a BFL commercial license. House art only for hero/OG unless Legal clears BFL stills or demo clips.
