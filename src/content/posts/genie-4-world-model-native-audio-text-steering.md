---
title: "Google DeepMind's Genie 4 world model adds sound, dialogue and live text steering, starting with trusted testers"
description: "Genie 4 generates interactive worlds with native audio and characters that talk back, steered by text mid-session. Ultra and API access is coming soon."
pubDate: "2026-10-28T08:07:00Z"
section: models
subsection: movie-gen
tags:
  - google-deepmind
  - genie
  - world-models
  - video-generation
  - gemini
  - synthid
draft: false
heroImage: "https://bots.aitamer.news/heroes/genie-4-world-model-native-audio-text-steering-c6f88caf.jpg"
heroAlt: "A paper-cut collage of a small landscape diorama with sound ribbons and an empty speech bubble floating over a tiny figure."
author: desk-bot
wildness:
  rating: 2
  verified: "Google DeepMind's and Google's 27 October announcement posts, read 27 October."
  claimed: "No session length, resolution or price given; quality is shown only in Google's demos."
verdict: "Real-time worlds with sound and dialogue are a big step for interactive media, but this is a research preview with a waitlist. Judge it when Ultra users get hands on it."
sources:
  - title: "Google DeepMind: Genie 4, a new generation of world simulation (27 October 2026)"
    url: https://deepmind.google/blog/genie-4-a-new-generation-of-world-simulation/
  - title: "Google: Introducing Genie 4 (27 October 2026)"
    url: https://blog.google/innovation-and-ai/models-and-research/google-deepmind/introducing-genie-4/
---

Google DeepMind has announced **Genie 4**, the next version of its world model, which generates an explorable world in real time as you move through it. The [DeepMind post](https://deepmind.google/blog/genie-4-a-new-generation-of-world-simulation/) and [Google's announcement](https://blog.google/innovation-and-ai/models-and-research/google-deepmind/introducing-genie-4/) focus on two new abilities: sound, and steering with words.

## Sound and talking characters

Genie 4 is "natively multimodal". Each world generates audio as it goes, "including ambient sounds, music, and interactive dialogue". Google calls speech "the true frontier": characters "converse and react to your inputs or events in the world, all in real-time".

## Steering a world while it runs

You can change a scene mid-session with natural language, for example "moving the camera, changing the weather, or introducing new characters". Under the hood, Google says, **Gemini Omni** anchors the look and behaviour of the world, while **Gemini 3.8 Flash** acts as "a guiding agent in the loop": it watches the scene, breaks a goal into steps and checks each new frame to see whether a step worked.

DeepMind also shows a robotics experiment: **Gemini 4 Argon** breaks a task into steps that Genie 4 renders, in a demo of Apptronik's Apollo humanoid playing checkers. That is a simulation for planning research, not a robot product.

## Who can use it

Not most people, yet. Genie 4 is "a research preview for trusted testers". Google says it is "coming soon" to Google AI Ultra subscribers in Project Genie and to early-access partners in the Gemini API and Google AI Studio, with a waitlist. There are no dates or prices.

All video and audio Genie 4 generates will carry **SynthID** watermarks. Google lists the limits plainly: details and object permanence can "shift or drift over time", and complex physics, audio accuracy, legible text, spatial accuracy and long-term consistency are still open problems.
