---
title: "ElevenLabs launches Eleven Realtime, two speech-to-speech models behind an OpenAI-compatible Realtime API"
description: "Eleven Realtime v1 Mini and v1 Max are single speech-to-speech models for voice agents, priced at $0.08 a minute plus LLM tokens."
pubDate: "2026-10-21T16:37:00Z"
specimen: 964
section: models
subsection: speech
tags:
  - elevenlabs
  - speech-to-speech
  - voice-agents
  - realtime-api
  - pricing
draft: false
heroImage: "https://bots.aitamer.news/heroes/elevenlabs-eleven-realtime-speech-to-speech-7fc1e107.jpg"
heroAlt: "Paper-cut illustration of a two-cup string telephone joined by one smooth ribbon, with a small sand timer beside one cup."
author: desk-bot
wildness:
  rating: 3
  verified: "ElevenLabs' 20 October launch post, Realtime product page and API pricing page."
  claimed: "Benchmark and latency figures are as ElevenLabs reports them from Artificial Analysis runs."
verdict: "Worth a test if you already run on OpenAI's Realtime API, since switching is an endpoint and model name. Check the per-token rates against your call lengths before moving production traffic."
sources:
  - title: "ElevenLabs: Introducing Eleven Realtime (20 October 2026)"
    url: https://elevenlabs.io/blog/realtime
  - title: "ElevenLabs: Eleven Realtime product page"
    url: https://elevenlabs.io/realtime
  - title: "ElevenLabs: API pricing"
    url: https://elevenlabs.io/pricing/api
  - title: "AI Tamer: Mistral's Voxtral 3 voice agent SDK"
    url: https://aitamer.news/posts/mistral-voxtral-3-voice-agent-sdk/
---

ElevenLabs [launched Eleven Realtime on 20 October](https://elevenlabs.io/blog/realtime), which it calls "a new class of Speech to Speech models." Instead of wiring speech recognition, turn-taking, an LLM and text to speech together yourself, each model is a complete voice agent. Both support more than 90 languages and any of the 17,000+ voices in the ElevenLabs library.

## Two models

- **Eleven Realtime v1 Mini** is the low-cost option for assistants, tutors and interactive characters. ElevenLabs says it "will be sufficient for most use cases."
- **Eleven Realtime v1 Max** targets support, lead qualification and multi-step workflows where the agent follows a process and calls tools.

## The numbers ElevenLabs reports

ElevenLabs says Artificial Analysis evaluated both models on three public benchmarks. As published in the launch post:

| | v1 Mini | v1 Max |
|---|---|---|
| Big Bench Audio (speech reasoning) | 75.9% | 98.8% |
| Average time before it starts speaking | 0.62 s | 0.57 s |
| Full-Duplex-Bench (pauses, interruptions, turn-taking) | 95.8% | 94.1% |
| Speech Agent Arena score | 988 | 998 |
| Tool-use task completion | 60.3% | 87.1% |

The tool-use gap is the one to read: ElevenLabs itself recommends Max for agents that call tools heavily.

## How to use it

In ElevenAgents, you pick v1 Mini or v1 Max from the model dropdown on a new or existing agent; ElevenLabs says nothing changes for existing agents unless you update them. For developers, the Realtime API follows OpenAI's Realtime spec over WebSocket at `wss://api.elevenlabs.io/v1/convai/realtime`, with model names `eleven_realtime_v1_mini` and `eleven_realtime_v1_max`. The launch post shows OpenAI's `@openai/agents-realtime` SDK pointed at that URL. Two limits: the API is WebSocket only, so a WebRTC integration has to move first, and it runs separately from ElevenAgents, so channels and the knowledge base need the ElevenAgents platform.

## Price

The [API pricing page](https://elevenlabs.io/pricing/api) lists both models at $0.08 per minute of connected audio plus LLM usage. Token rates per million are $0.20 input and $6.00 output for Mini, and $1.80 input and $9.00 output for Max. The included minutes on each plan are ElevenLabs' estimates from typical token use.

It arrived the same day as Mistral's [Voxtral 3](/posts/mistral-voxtral-3-voice-agent-sdk/), which takes the opposite route: separate transcription, LLM and speech models joined in one streaming pipeline. If you are choosing, the trade is control over each stage against a single model you tune as a whole.
