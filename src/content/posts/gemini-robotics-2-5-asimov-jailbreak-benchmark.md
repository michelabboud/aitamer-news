---
title: "Gemini Robotics 2.5 goes to partners, with an open robot jailbreak benchmark"
description: "Google DeepMind's new robot model reports 30% to 100% higher task success and 96% on a Mercedes-Benz line. Only partners get it; the safety benchmark is open."
pubDate: "2026-11-10T21:07:00Z"
section: models
subsection: robotics
tags:
  - google-deepmind
  - gemini-robotics
  - robotics
  - vla
  - safety
  - benchmarks
draft: false
heroImage: https://bots.aitamer.news/heroes/gemini-robotics-2-5-asimov-jailbreak-benchmark-4086b284.jpg
heroAlt: "A paper-cut robot hand placing a slate-grey bracket into a sorting tray beside a bin, with a faint slate-blue shield behind and a small coral dot on its fingertip."
author: desk-bot
wildness:
  rating: 3
  verified: "Google DeepMind's announcement and the Hugging Face dataset page it links, 10 November 2026."
  claimed: "Success rates, speedups and the 96% factory figure are DeepMind's and Apptronik's own results."
verdict: "A real step for robot dexterity on DeepMind's numbers, but you cannot run it unless you are a partner. The open jailbreak benchmark is the part anyone can use today."
sources:
  - title: "Google DeepMind: Gemini Robotics 2.5 accelerates real-world general dexterity (10 November 2026)"
    url: https://deepmind.google/blog/gemini-robotics-2-5-accelerates-real-world-physical-intelligence/
  - title: "Hugging Face: google/asimov_agentic dataset"
    url: https://huggingface.co/datasets/google/asimov_agentic
  - title: "Google DeepMind: Gemini Robotics partners"
    url: https://deepmind.google/models/gemini-robotics/#partners
---

Google DeepMind has [introduced Gemini Robotics 2.5](https://deepmind.google/blog/gemini-robotics-2-5-accelerates-real-world-physical-intelligence/), which it calls its most capable vision-language-action (VLA) model so far. It is "rolling out to our robotics partners". There is no public API, price or weights.

## What DeepMind reports

- **Breadth:** tested on more than 200 distinct tasks, such as serving food with tongs, tying a bow on a gift box and pipetting liquid.
- **Gains:** 30% to 100% higher success than previous baselines depending on task type, and tasks finished 20% to 30% faster. DeepMind does not name the baseline model in that comparison.
- **Factory pilot:** on Mercedes-Benz lines in Kecskemét, Hungary, and Sindelfingen, Germany, Apptronik's Apollo 2 humanoid sorted metal brackets from bulk bins into sequencing trays with a 96% success rate. Gemini Robotics ER tracked the workflow and Gemini Robotics 2.5 drove the hands and arms.
- **Robot types:** Apollo 2 with a five-finger hand, and the two-gripper Franka Duo.
- **Physical safety:** inference-time guidance that steers around hazards raised safe task completion by 33% around obstacles and 43% around nearby people, in DeepMind's evaluations.

DeepMind credits Gemini 4 Argon with speeding up the work by generating simulated practice runs and digital twins from real camera scenes.

## The open part: ASIMOV-Jailbreak

DeepMind is releasing **ASIMOV-Jailbreak**, a benchmark of prompts that disguise unsafe robot requests across many scenes. The announcement links it to the [google/asimov_agentic](https://huggingface.co/datasets/google/asimov_agentic) dataset on Hugging Face, which is public under CC BY 4.0 and gated behind a click-through. DeepMind says Gemini 4 Argon resists 99.5% of these jailbreaks, against 82% for its earlier Gemini Robotics ER 2. Some press reports give different figures; the ones here are from DeepMind's post.

## Why this matters

For most builders this is a direction signal, not a tool: the model is partner-only, and every performance number is self-reported. The benchmark is usable now, and if you put a language model in charge of anything with motors, disguised unsafe requests are a test you should be running. NVIDIA's [GR00T 2](/posts/nvidia-gr00t-2-world-action-model-robots/) is in a similar spot, with code due in December, and neither lab's success rates have been reproduced on an open evaluation such as [RoboColosseum](/posts/robocolosseum-open-real-robot-evaluation-hugging-face/) yet.
