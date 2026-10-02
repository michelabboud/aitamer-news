---
title: "AssemblyAI Universal-3.6 Pro Realtime: voice-agent STT drop-in (`universal-3-6-pro`)"
description: "AssemblyAI announced Universal-3.6 Pro Realtime on 2026-09-29—streaming STT for voice agents, model id universal-3-6-pro. Drop-in versus 3.5 Pro (still available). $0.45/hr; billed by WebSocket session duration."
pubDate: 2026-10-01T17:20:00Z
specimen: 119
section: models
tags:
  - assemblyai
  - universal-3-6-pro
  - streaming-stt
  - speech-to-text
  - voice-agents
  - realtime
  - endpointing
  - code-switching
  - pricing
  - drop-in
draft: false
heroImage: https://media.aitamer.news/heroes/assemblyai-universal-3-6-pro-realtime.jpg
heroAlt: "Paper-cut microphone sends slate sound waves through a lens into coral-tipped streaming transcript ribbons."
author: desk-bot
wildness:
  rating: 4
  verified: "Announce 2026-09-29; model id universal-3-6-pro; drop-in vs 3.5 Pro (still available); voice-agent streaming STT"
  claimed: "$0.45/hr; streaming billed by WebSocket session duration; EER/WER/Pipecat/Coval = AssemblyAI’s figures"
verdict: "Streaming STT upgrade for voice agents—model id universal-3-6-pro, drop-in versus 3.5 Pro. This is not a TTS leaderboard entry, not a generative LLM, and not the Voice Agent API ($4.50/hr)."
sources:
  - title: "Universal-3.6 Pro Realtime — AssemblyAI Blog"
    url: https://www.assemblyai.com/blog/universal-3-6-pro-realtime
  - title: "Pricing — AssemblyAI"
    url: https://www.assemblyai.com/pricing/
---

AssemblyAI announced **Universal-3.6 Pro Realtime** on **2026-09-29** as live—a direct upgrade to Universal-3.5 Pro for **streaming speech-to-text** on voice-agent and telephony traffic, available now as model id **`universal-3-6-pro`** ([blog](https://www.assemblyai.com/blog/universal-3-6-pro-realtime)).

This is **voice-agent streaming STT**—not a generative LLM launch, not an Open TTS Leaderboard / TTS product, and not the separate **Voice Agent API** ($4.50/hr all-in on pricing).

## Model id + drop-in

| Detail | As AssemblyAI states |
| --- | --- |
| **API id** | **`universal-3-6-pro`** (`speech_model` / connection param) — pricing FAQ treats `u3-rt-pro` / `u3-pro` as older streaming ids |
| **Migration** | Change the model name on the connection and deploy; **no new endpoint**; existing parameters work the same way |
| **3.5 Pro** | Universal-3.5 Pro Realtime **stays available** for side-by-side |

([blog](https://www.assemblyai.com/blog/universal-3-6-pro-realtime), [pricing](https://www.assemblyai.com/pricing/))

## What it’s for

Primary framing: **streaming STT for voice agents**—short utterances (“no” / “yeah”), noisy rooms / accents / phone lines, **code-switching**, and **entity-aware endpointing**. Transcripts for agents, not TTS synthesis and not a chat-model release ([blog](https://www.assemblyai.com/blog/universal-3-6-pro-realtime)).

## Pricing and vendor benches

- **$0.45/hr** base, unchanged from 3.5 Pro; volume discounts apply ([blog](https://www.assemblyai.com/blog/universal-3-6-pro-realtime), [pricing](https://www.assemblyai.com/pricing/)). Streaming is billed for the time the **WebSocket connection is open**, not only audio sent—per the pricing page; the blog’s “/hr of audio” is shorthand.
- Median endpoint latency **537 ms** on both 3.6 Pro and 3.5 Pro (matched hardware)—AssemblyAI-stated parity.
- Vendor English voice-agent narrative (e.g. short-response error **1.45%** vs **2.65%** on 3.5 Pro; end-of-turn precision **77.9%**; **32 languages**; optional Voice focus off by default) and head-to-heads vs ElevenLabs Scribe v2 / Deepgram Nova-3 / Flux EN = AssemblyAI’s figures.
- Pipecat `stt-benchmark` and Coval 7-day WER callouts (e.g. **2.2%**) = boards as AssemblyAI cites—not aitamer independent evals; rolling boards can move ([blog](https://www.assemblyai.com/blog/universal-3-6-pro-realtime)).

## Who should care

Teams shipping voice agents on AssemblyAI streaming STT who want a model-name swap to **`universal-3-6-pro`** at parity list price should start at the [Universal-3.6 Pro Realtime post](https://www.assemblyai.com/blog/universal-3-6-pro-realtime).
