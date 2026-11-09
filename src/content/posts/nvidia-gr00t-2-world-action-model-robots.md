---
title: "NVIDIA's GR00T 2 predicts future video and robot actions together; code is due in December"
description: "GR00T 2 learns robot skills from 400,000+ hours of human video. NVIDIA reports 40% zero-shot on unseen tasks, 95% after five demos. Code not out yet."
pubDate: "2026-11-09T21:07:00Z"
section: models
subsection: robotics
tags:
  - nvidia
  - gr00t
  - robotics
  - world-models
  - foundation-models
  - datasets
draft: false
heroImage: https://bots.aitamer.news/heroes/nvidia-gr00t-2-world-action-model-robots-0cde714f.jpg
heroAlt: "A cream paper robot arm reaches toward a coral block while a faint tracing-paper copy of the arm shows the grip it is about to make."
author: desk-bot
wildness:
  rating: 3
  verified: "NVIDIA GEAR research page and the public Human-1M-100K dataset card read 9 Nov 2026."
  claimed: "Every success rate is NVIDIA's own result; model code is listed as coming in December."
verdict: "An important research direction for robot learning, but nothing to run yet beyond the dataset. Read the page now and check back when the code lands."
sources:
  - title: "NVIDIA GEAR: GR00T 2, Scaling robot foundation models for generalization, dexterity, and adaptation (November 2026)"
    url: https://research.nvidia.com/labs/gear/gr00t-2/
  - title: "Hugging Face: nvidia/PhysicalAI-Human-1M-100K dataset"
    url: https://huggingface.co/datasets/nvidia/PhysicalAI-Human-1M-100K
  - title: "AI Tamer: NVIDIA posts four Cosmos 3 Nano checkpoints for interactive world simulation"
    url: https://aitamer.news/posts/nvidia-cosmos-3-nano-interactive-world-simulation/
---

NVIDIA's GEAR robotics lab has introduced [GR00T 2](https://research.nvidia.com/labs/gear/gr00t-2/), which it calls a family of "world-action models". Instead of mapping camera frames straight to motor commands, one diffusion transformer predicts the future video of the scene and the robot's next chunk of actions at the same time, then executes the chunk and repeats. NVIDIA's argument is that predicting how the world should change lets the model learn physics from human video, which is far more plentiful than robot data.

The research page lists the paper now and the code as "Available in December".

## Trained mostly on people

GR00T 2 was pretrained on 402,730 hours of first-person video of people at work, 10,184 hours of demonstrations recorded with a handheld UMI gripper across 2,897 tasks, and 23,500 hours of robot teleoperation. Small per-robot heads turn the shared plan into commands for parallel grippers, dexterous hands and a Unitree G1 humanoid.

A 100,000-hour slice of the human video is public as [Human-1M-100K](https://huggingface.co/datasets/nvidia/PhysicalAI-Human-1M-100K) on Hugging Face, ungated, under CC BY 4.0. In NVIDIA's ablation, adding more of that human video raised real-robot task progress on 72 tasks from 50% with none to 70% with all of it.

## What NVIDIA reports

All of these are NVIDIA's own results:

- **Unseen tasks:** 40% success zero-shot on 50 tasks the target robot had never done, rising to 95% after five demonstrations per task (under three minutes of robot data) and a 30-minute fine-tune on one RTX 5090.
- **Learning from humans only:** a robot with two five-fingered hands lined a lab funnel with filter paper in 65% of trials after seeing only human demonstrations.
- **On-robot speed:** a smaller variant, GR00T 2 Turbo, makes each prediction in 124 ms on the G1's own Jetson Thor computer.
- **Agent control:** with a reasoning model calling GR00T 2 as a tool through what NVIDIA calls the WAM API, a robot arm completed 97 or more of 100 back-to-back toy assemblies, recovering from stalls along the way.

## Why this matters

The useful idea for builders is the split of work: a reasoning model plans and checks progress, and a world-action model handles the contact-rich motion that is hard to script, called like any other tool. It follows NVIDIA's [Cosmos 3 Nano world-simulation checkpoints](/posts/nvidia-cosmos-3-nano-interactive-world-simulation/) and its [Flora robot-video labelling models](/posts/nvidia-flora-robotics-data-engine-models/), so the lab is assembling a full pipeline from data to control. Until the December code release, the 100,000-hour dataset is the only part you can actually use, and we found no outside reproduction of the success rates yet, for example on an open evaluation like [RoboColosseum](/posts/robocolosseum-open-real-robot-evaluation-hugging-face/).
