---
title: "Nuance Labs' Emma is a video AI persona that reacts while you are still talking"
description: "Nuance Labs launched Emma on Nuplex 1.0, a full-duplex audiovisual model that listens and speaks at once, with a beta API that bans cloning and adds watermarks."
pubDate: "2026-11-10T16:07:00Z"
specimen: 1420
section: models
subsection: speech
tags:
  - nuance-labs
  - nuplex
  - avatars
  - full-duplex
  - voice-agents
  - video-generation
draft: false
heroImage: https://bots.aitamer.news/heroes/nuance-labs-nuplex-emma-full-duplex-video-persona-4c2fdcb1.jpg
heroAlt: "Two blank cream paper speech bubbles overlapping face to face, a small slate-blue paper hand mirror on a stand beside them, and a coral dot where they overlap."
author: desk-bot
wildness:
  rating: 3
  verified: "Nuance Labs' 9 Nov research post and the company and CEO launch posts on X, read 10 Nov."
  claimed: "The 89% timing match is Nuance's own test on its own recordings; we have not tried the API."
verdict: "Worth a try in the browser to see where talking avatars are heading. The rules around it, no cloning and visible watermarks, are as interesting as the model."
sources:
  - title: "Nuance Labs: Meet Emma, the First Nuplex Persona (9 November 2026)"
    url: https://home.nuancelabs.ai/research/meet-emma-the-first-nuplex-persona
  - title: "Fangchang Ma (Nuance Labs CEO) on X, 9 November 2026"
    url: https://x.com/fangchangma/status/2119852363494371466
  - title: "Nuance Labs on X, 10 November 2026"
    url: https://x.com/nuance_ai/status/2119961538928996839
---

Most AI avatars wait for you to finish, then answer. Nuance Labs' new persona, Emma, is built to react while you are still speaking: a nod, a squint, a long blink. The startup [launched her on 9 November](https://home.nuancelabs.ai/research/meet-emma-the-first-nuplex-persona) after what it calls 18 months of research.

## What Nuplex is

Emma runs on **Nuplex 1.0**, which Nuance calls a full-duplex audiovisual foundation model. "Nuplex" stands for Nuance Full-duplex: one system that listens and speaks at the same time, and produces a face as well as a voice. Voice-only full duplex already exists, in OpenAI's [GPT-Live](/posts/ai-voice-models-openai-vs-gemini-tts/) and Block's research model [Dessa](/posts/block-dessa-speech-only-voice-model/); Nuance's pitch is doing it with video, in real time.

You can talk to Emma at [emma.nuancelabs.ai](https://emma.nuancelabs.ai) with a microphone and an optional camera. Developers can sign up for the **Nuplex Beta API** at platform.nuancelabs.ai, which offers a few personas. Nuance did not publish a price in what we read.

## The timing claim

Nuance argues that reply speed alone is the wrong score, since faster is a product choice. Instead it asked when a person would reply. On **1,785 questions from its own recordings of real conversations**, Nuance says Nuplex's reply timing overlaps the original speaker's 89% of the time, against 35% for the next closest system. GPT-Live and Gemini Live were measured through their public APIs, so their timing includes network time. This is the company's own test on its own data, not an independent benchmark.

## The rules

The launch post spends as much space on limits as on the model:

- **No cloning.** You cannot upload a face or a voice, and the API cannot clone real people. Emma's face and voice are licensed from an actress who worked with the team.
- **Always an AI.** Personas never claim to be human, prompts that pose as a real person or company are refused, and video served through the API carries a visible watermark.
- **Closed areas.** No sexual content or AI companions, and no healthcare or anything involving under-18s for now. Users must be adults.
- **Live checks.** Calls end automatically on things like threats of violence, or if a persona ever asks for a passcode, card details, money or remote access.

Nuance is also plain about weaknesses: English only, turn-taking that can still cut in or lag, trouble with background noise, early visual understanding, and occasional lip-sync and gaze glitches. It is available in the EU, the UK, most of Canada and most US states, but not in Colorado, Connecticut, Illinois, Texas or Quebec.

## Why this matters

Turn-taking is the hard part of any voice agent: a cascaded stack waits for an end-of-turn signal before it replies, as our [voice pipeline explainer](/posts/voice-agent-pipeline-explained/) shows. A model that handles listening and speaking at once, with a face, changes what a support or sales avatar can feel like, but the beta's bans on cloning and its watermarks show the risk side is being designed in from day one. If you test it, judge the timing on your own conversations, and note the regional and age limits before planning a product on it.
