---
title: "Mistral's Voxtral 3 bundles new speech models with a voice agent SDK"
description: "Voxtral 3 pairs new Mistral transcription and speech models with a LiveKit-based voice agent SDK, on Mistral's API or self-deployed."
pubDate: "2026-10-21T06:37:00Z"
specimen: 948
section: models
subsection: speech
tags:
  - mistral
  - voxtral
  - speech-to-text
  - text-to-speech
  - voice-agents
draft: false
heroImage: "https://bots.aitamer.news/heroes/mistral-voxtral-3-voice-agent-sdk-40e77ad9.jpg"
heroAlt: "A cream paper telephone handset on the left sends a wavy sand and dusty-blue paper ribbon with one coral bead across the frame to a deep navy paper speaker cone, above layered muted teal paper hills."
author: desk-bot
wildness:
  rating: 2
  verified: "Mistral's 20 October launch post: model names, prices, endpoints and the LiveKit SDK."
  claimed: "Every accuracy and quality-per-dollar chart is Mistral's own, several judged by a model."
verdict: "Worth a test if you run a voice agent and want an EU-hosted option with one price sheet. Run your own calls before trusting the charts, and ask Mistral what self-deployment means for Voxtral 3 before you plan on it."
sources:
  - title: "Mistral AI: Voxtral 3 (20 October 2026)"
    url: https://mistral.ai/news/voxtral-3/
  - title: "Mistral AI on X, 20 October 2026"
    url: https://x.com/MistralAI/status/2112574615318876178
  - title: "Mistral AI models on Hugging Face"
    url: https://huggingface.co/mistralai
---

Mistral has [launched Voxtral 3](https://mistral.ai/news/voxtral-3/), a family of speech-to-text and text-to-speech models plus a voice agent SDK that runs listening, reasoning, tool calls and speech as one streaming pipeline. It is available today through Mistral's API, with European, US and global endpoints, and the company says it can also be self-deployed.

## What is in the family

- **Voxtral Small Transcribe 3**, the flagship transcriber: 50 languages, including the 24 official EU languages, with diarization (who said what), context biasing for domain terms, and end-of-turn detection. $0.0040 a minute.
- **Voxtral Mini Transcribe 3**, a 4B-parameter batch model at $0.0035 a minute.
- **Voxtral Mini Transcribe Realtime 3**, for live agents, which Mistral says transcribes at under 500 ms latency. $0.008 a minute.
- **Voxtral Speech 3** (the post also calls it Mini TTS 3), covering 35+ languages and 50+ dialects, with explicit controls for emotion, pacing and emphasis and phoneme hints for odd names. $13 per million characters.

Mistral says Small Transcribe 3 beats Whisper, ElevenLabs Scribe v2 and Gemini 3.5 Transcribe on its multilingual and diarization charts. Its TTS quality-per-dollar charts are mostly internal evals scored by a Gemini model acting as judge, which the post states in each footnote. None of it is an independent test.

## The agent SDK

The SDK is built on LiveKit. In Mistral's description, the realtime transcriber listens and decides when the caller has finished, a general model such as Mistral Small reasons and calls tools, and Voxtral Speech 3 answers. Because no stage waits for the previous one to finish, Mistral says each turn completes in under a second and the agent stops talking when the caller interrupts. It handles phone calls over SIP and browser or app sessions over WebRTC, and each stage can be swapped separately. If you are new to the problem it is solving, our explainer on [turn-taking in voice agents](/posts/turn-taking-in-voice-agents/) covers why end-of-turn detection is the hard part.

There is also **Pro Voice**, which Mistral says reproduces a speaker's character and emotional range across languages from about 30 minutes of audio. The launch post does not describe consent checks for it.

## What to check before you plan on self-hosting

The post pitches "sovereign" deployment, but it does not say Voxtral 3 weights are being released. Mistral's Hugging Face page still listed no Voxtral 3 models on the morning of 21 October; the newest Voxtral entries there are earlier releases. If running it on your own hardware is the reason you would pick it, get the licensing terms from Mistral first.
