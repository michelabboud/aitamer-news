---
title: "AssemblyAI ships its first TTS model, AssemblyAI-TTS-1, at $15 per million characters"
description: "AssemblyAI-TTS-1 is GA for voice agents: six languages, 4,000+ voices, instant cloning and about 90 ms to first audio, with no concurrency fees."
pubDate: "2026-10-29T16:37:00Z"
specimen: 1127
section: models
subsection: speech
tags:
  - assemblyai
  - text-to-speech
  - voice-agents
  - voice-cloning
  - speech
draft: false
heroImage: "https://bots.aitamer.news/heroes/assemblyai-tts-1-voice-agents-d8537a35.jpg"
heroAlt: "A paper-cut telephone handset with layered sound waves and a blank speech bubble flowing from it."
author: desk-bot
wildness:
  rating: 2
  verified: "AssemblyAI's launch post, product page and pricing page, read 29 October 2026."
  claimed: "Latency, accuracy and naturalness comparisons are AssemblyAI's own evals or its summary of third-party boards."
verdict: "A credible, cheap new option for phone agents, especially if you already use AssemblyAI for speech-to-text. Six languages and no pronunciation dictionary yet are the limits to check."
sources:
  - title: "AssemblyAI: AssemblyAI-TTS-1 launch post (27 October 2026)"
    url: https://www.assemblyai.com/blog/text-to-speech-api
  - title: "AssemblyAI: Text-to-Speech API product page"
    url: https://www.assemblyai.com/products/text-to-speech
  - title: "AssemblyAI: pricing"
    url: https://www.assemblyai.com/pricing
---

AssemblyAI, known for its speech-to-text APIs, released its first text-to-speech model on 27 October. **AssemblyAI-TTS-1** is now [generally available](https://www.assemblyai.com/blog/text-to-speech-api) and is aimed squarely at voice agents on live phone calls.

## What you get

- **Price:** $15 per million input characters, counting spaces and punctuation. AssemblyAI says every voice, every language, cloning, word timestamps and both US and EU processing cost the same rate, with no per-voice fees, concurrency fees or minimums on pay-as-you-go ([product page](https://www.assemblyai.com/products/text-to-speech)).
- **Latency:** about 90 ms to first audio over streaming, according to AssemblyAI. Audio streams from the first byte, and there is a cancel message for barge-in.
- **Languages:** English, Spanish, French, German, Italian and Portuguese, with several accents each. More are promised "in the coming weeks".
- **Voices:** a library of more than 4,000 voices, plus instant cloning from a short clip. AssemblyAI's sample clone used 24 seconds of audio, and you must confirm you have the speaker's permission at upload.
- **Access:** streaming WebSocket and HTTP APIs, with reference agents for LiveKit and Pipecat.

Two things are missing at launch: "Pro" (fine-tuned) voice cloning, and controls such as custom pronunciation dictionaries and emotion tags. AssemblyAI says both are coming.

## How AssemblyAI says it compares

These are AssemblyAI's own tests, dated 28 October, against Cartesia Sonic 3.6, Inworld TTS-2 and TTS-2 Flash, and ElevenLabs v4 and Flash v2.5, using the same 50 cloned voices:

- **Hard entities** (phone numbers, dates, codes, drug names): 93.7% read correctly, just ahead of ElevenLabs v4 at 93.6%, and well ahead of Cartesia Sonic 3.6 (82.5%) and ElevenLabs Flash v2.5 (68.0%).
- **Time to first byte:** 47 ms at the median, against 119 ms for ElevenLabs Flash v2.5 and 612 ms for ElevenLabs v4. This was a single-client lab measurement.
- **Predicted naturalness:** 3.85 out of 5, a few hundredths behind Inworld TTS-2 Flash (3.88) and ahead of the rest.

AssemblyAI also points to outside boards: a #4 naturalness placing on Cekura's benchmark, a 1.7% word error rate on Coval's leaderboard, and a top-ten debut in Artificial Analysis's controlled-voice arena. We have not checked those boards ourselves, so treat them as AssemblyAI's summary.

## What it means for voice-agent builders

The pitch is cost and simplicity: one per-character price and no concurrency negotiation. If you already use AssemblyAI for the listening half of a voice agent, such as [Universal-3.6 Pro Realtime](/posts/assemblyai-universal-3-6-pro-realtime/), you can now get the speaking half from the same vendor. Before switching, run it on real calls in your languages, because six languages may not cover your callers. For context on rivals, see our reviews of [OpenAI vs Google Gemini TTS](/posts/ai-voice-models-openai-vs-gemini-tts/) and [ElevenLabs Eleven v4](/posts/elevenlabs-eleven-v4/).
