---
title: "RoboColosseum puts robot policies and frontier models on 100-plus real robots, and publishes every run"
description: "A real-robot benchmark from NUS, Hugging Face, BitRobot and partners: blinded A/B trials, every run on the Hub, and 10,000 free evaluation hours."
pubDate: "2026-11-05T17:07:00Z"
section: models
subsection: robotics
tags:
  - robotics
  - benchmarks
  - hugging-face
  - lerobot
  - vla
  - open-data
draft: false
heroImage: https://bots.aitamer.news/heroes/robocolosseum-open-real-robot-evaluation-hugging-face-f7a383d4.jpg
heroAlt: "Cut-paper small cream robot arm on a tabletop reaching toward a single coral cube, with a faint slate-blue arena ring on the paper floor around it."
author: desk-bot
wildness:
  rating: 2
  verified: "The RoboColosseum paper (arXiv, 2 November), robocolosseum.ai and its Hugging Face datasets, read 4 Nov."
  claimed: "The rankings come from the project's own first study; nobody outside it has rerun them yet."
verdict: "A real attempt to make physical robot evals comparable: blinded pairwise trials, shared demonstrations, and open data including failures. The first results mostly show how hard open-world tasks still are."
sources:
  - title: "RoboColosseum: Evaluating Physical Intelligence at Scale In-The-Wild (arXiv 2611.02497)"
    url: https://arxiv.org/abs/2611.02497
  - title: "RoboColosseum: The proving ground for physical AI"
    url: https://robocolosseum.ai
  - title: "RoboColosseum on Hugging Face"
    url: https://huggingface.co/RoboColosseum
---

RoboColosseum is a shared benchmark that tests robot policies on real robots in real places rather than in simulation. Its [paper](https://arxiv.org/abs/2611.02497), posted on 2 November, names four founding members: the NUS MAGIC Lab, Hugging Face, the Singapore Embodied AI Centre and BitRobot. Authors also come from the University of Washington, Stanford, UNC Chapel Hill, the Allen Institute for AI and Oxford.

## How it works

The paper describes a fleet of over 100 robots across the United States, the United Kingdom, Singapore, Malaysia and China, run by full-time evaluators. The [project site](https://robocolosseum.ai) lists 140-plus scenes and four robot types today: Unitree G1 humanoids, bimanual YAM stations, Franka arms in the DROID setup and SO-ARM101 arms, with Earth Rover Mini+ wheeled robots being added.

There are two tracks:

- **Open Track.** Two unnamed models get the same fresh instruction in the same scene, and the evaluator picks the better run or calls a tie. The evaluator never sees model names.
- **Fine-tune Track.** Every model is fine-tuned on the same 100 demonstrations per task, then gets 25 attempts. The project reports full successes and milestone progress.

The site says every run from both tracks, failures included, is published with its videos on Hugging Face in LeRobot format, and scores go on a public leaderboard. The project's [Hugging Face organization](https://huggingface.co/RoboColosseum) already hosts task datasets.

## Free evaluation

The project offers 10,000 hours of free evaluation. The paper says the hours are "shared across all academic partners." The site's FAQ says teams with a policy for one of its robots can apply, and the RoboColosseum team reviews each application. You can connect your own inference server through its policy API, or hand over a checkpoint to run on a machine next to the robot.

## What the first study found

The paper's first study ran from 17 September to 28 October 2026. It covered five vision-language-action (VLA) policies, GR00T N1.7, π0.5, MolmoAct2, G0.5 and LingBot-VLA v2, and three frontier models used as agents: GPT-6 Astra, Claude Opus 5.5 and Grok 4.7. The authors report:

- **Open Track:** 5,699 pairwise comparisons at 124 sites. Frontier agents rival specialized VLA policies, but "all systems struggle to complete open-world tasks reliably." GPT-6 Astra had the top rating on DROID/Franka, and Claude Opus 5.5 on SO-101 and Bimanual-YAM. In 901 paired progress comparisons, Claude Opus 5.5 and GPT-6 Astra averaged 12.1 and 11.0 percentage points more task progress than the VLA policies, while Grok 4.7 trailed by 7.5 points.
- **Fine-tune Track:** GR00T N1.7 leads on SO-101, and π0.5 leads on Franka and Bimanual-YAM.
- **Humanoid:** on the G1, no policy completed any of the five tasks, though average progress ranged from 13.3% to 23.2%.
- **Rankings don't transfer:** agreement across the robot-specific task suites was weak (Kendall's W of 0.24), and Open Track rankings poorly predicted results after fine-tuning.

Two runs were stopped for safety reasons, per the paper: LingBot-VLA v2 on a YAM drawer task after one trial, and GR00T N1.7 on a YAM microwave task after nine.

## Why this matters

If you train a policy, the most practical finding is that a ranking on one robot, or a zero-shot ranking, did not predict results elsewhere, so evaluate on the embodiment and fine-tuning setup you will actually ship. The runs are published in LeRobot format, the same library behind [FLUX.3 Action's SO-101 path](/posts/flux-3-action/), and they include failed attempts, real-robot data that sits alongside video-labeling tools such as [NVIDIA's Flora](/posts/nvidia-flora-robotics-data-engine-models/). The free hours are allocated by application, so treat them as a possibility, not a guarantee.
