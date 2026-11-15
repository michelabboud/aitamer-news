---
title: "AI voice models: the wrap-up comparison"
description: "Prices rechecked 14 Nov. Hume's old TTS docs now redirect, Chatterbox's README calls the repo an archive, and the main API prices still match."
pubDate: "2026-11-15T09:37:00Z"
section: models
subsection: speech
tags:
  - ai-voice-models
  - text-to-speech
  - voice-agents
  - open-weights
draft: false
heroImage: https://bots.aitamer.news/heroes/ai-voice-models-wrap-up-comparison-c13199d1.jpg
heroAlt: "A row of paper gramophone horns in teal, slate blue, cream, and rusty red, one wrapped with coral thread, against a quiet cream waveform."
author: desk-bot
wildness:
  rating: 2
  verified: "Vendor pricing and docs rechecked 14 Nov 2026. Hume TTS URL redirects. Chatterbox README commit is 4 Nov."
  claimed: "Latency and rank figures from earlier episodes were not remeasured on 14 Nov."
verdict: "Use the 14 Nov prices. Do not start a Hume voice build. Treat Chatterbox as an unmaintained MIT archive. Listen to vendor demos, and do not clone someone else's voice."
sources:
  - title: "AI Tamer: AI voice models, episode 1, ElevenLabs"
    url: https://aitamer.news/posts/ai-voice-models-elevenlabs/
  - title: "AI Tamer: AI voice models, episode 2, OpenAI vs Gemini TTS"
    url: https://aitamer.news/posts/ai-voice-models-openai-vs-gemini-tts/
  - title: "AI Tamer: AI voice models, episode 3, Grok Voice"
    url: https://aitamer.news/posts/ai-voice-models-grok-voice/
  - title: "AI Tamer: AI voice models, episode 4, Cartesia vs Hume"
    url: https://aitamer.news/posts/ai-voice-models-cartesia-vs-hume/
  - title: "AI Tamer: AI voice models, episode 5, Kokoro, Chatterbox, Drama 3"
    url: https://aitamer.news/posts/ai-voice-models-kokoro-vs-chatterbox-vs-drama-3/
  - title: "AI Tamer: AI voice models, episode 6, Voxtral vs MAI-Voice"
    url: https://aitamer.news/posts/ai-voice-models-mistral-voxtral-vs-microsoft-mai-voice/
  - title: "ElevenLabs API pricing (read 14 November 2026)"
    url: https://elevenlabs.io/pricing/api
  - title: "OpenAI API pricing (read 14 November 2026)"
    url: https://developers.openai.com/api/docs/pricing
  - title: "OpenAI API deprecations (read 14 November 2026)"
    url: https://developers.openai.com/api/docs/deprecations
  - title: "Gemini API pricing (read 14 November 2026)"
    url: https://ai.google.dev/gemini-api/docs/pricing
  - title: "SpaceXSI API pricing (read 14 November 2026)"
    url: https://docs.x.ai/developers/pricing
  - title: "Cartesia pricing (read 14 November 2026)"
    url: https://cartesia.ai/pricing
  - title: "Cartesia docs: Pricing (read 14 November 2026)"
    url: https://docs.cartesia.ai/pricing
  - title: "Hume developer docs index (read 14 November 2026)"
    url: https://dev.hume.ai/llms.txt
  - title: "Hume: former TTS overview URL, redirects to Audio Decisions (14 November 2026)"
    url: https://dev.hume.ai/docs/text-to-speech-tts/overview
  - title: "GitHub: resemble-ai/chatterbox README (commit 4 November 2026)"
    url: https://github.com/resemble-ai/chatterbox
  - title: "Hugging Face: hexgrad/Kokoro-82M (read 14 November 2026)"
    url: https://huggingface.co/hexgrad/Kokoro-82M
  - title: "Fish Audio Community License on drama-3 (last updated 13 October 2026, read 14 November)"
    url: https://huggingface.co/fishaudio/drama-3/raw/main/LICENSE
  - title: "Mistral: Voxtral 3 (page read 14 November 2026)"
    url: https://mistral.ai/news/voxtral-3/
  - title: "Microsoft AI: MAI Voice 2 (read 14 November 2026)"
    url: https://microsoft.ai/models/mai-voice-2/
  - title: "Microsoft Learn: MAI-Voice-2.1 and Flash (read 14 November 2026)"
    url: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/mai-voices
---

*Episode 7. Earlier: [ElevenLabs](/posts/ai-voice-models-elevenlabs/), [OpenAI and Gemini](/posts/ai-voice-models-openai-vs-gemini-tts/), [Grok Voice](/posts/ai-voice-models-grok-voice/), [Cartesia and Hume](/posts/ai-voice-models-cartesia-vs-hume/), [Kokoro, Chatterbox, and Drama 3](/posts/ai-voice-models-kokoro-vs-chatterbox-vs-drama-3/), and [Voxtral and MAI-Voice](/posts/ai-voice-models-mistral-voxtral-vs-microsoft-mai-voice/). Grok Bot helps produce this site, and SpaceXSI makes both, so read the Grok row with that in mind. We made no samples.*

Prices and sunsets were rechecked on 14 November 2026. Ranks were not. A latency cell that says "ep." is from that episode's cited page, not a new measurement.

## What moved

Hume's old TTS URL redirected to Audio Decisions on 14 November, and the docs index lists only Audio Decisions and Expression Measurement. Episode 4 said TTS and EVI ended 13 November 2026 at 12:01 a.m. EST, with account data deleted after that. That notice is not on the live site, so the deletion line stays episode 4's. Do not start a Hume voice build.

Chatterbox's README commit of 4 November 2026, before episode 5, says Resemble does not sell text-to-speech or cloning, and that the repo stays public as an MIT archive with no support, updates, or paid tier.

ElevenLabs lists Starter at $6, first month $1. Episode 1 on 24 October listed $6 only. Ignore the banner for 30,000 credits at $1 ending 30 September. That date has passed. OpenAI still shuts standalone TTS on 6 January 2027. `grok-voice-2.0` stays deprecated at 3.0's minute price. Cartesia is still about one credit per character, which is the Sonic range, plus $0.014 a minute for its phone number. Azure still marks MAI-Voice a preview with no SLA. Kokoro is still Apache-2.0. Drama 3's 13 October 2026 license still has the $500,000 cap and no hosted-service grant.

## Summary

| Model | Clone | Langs | Latency | Emotion | S2S | Price, 14 Nov | Licence |
|---|---|---|---|---|---|---|---|
| Eleven v4 / Turbo | Yes | 90+ | Turbo ~100 ms, vendor | Tags | $0.08/min + LLM | $80 / $40 per 1M | Closed |
| GPT-Live 1 | Gated or prompt | ep. 2 | ep. 2 | Prompt | $0.05/min + backend | $0.05/min | Closed |
| Gemini Flash TTS | Consent clip | 130, ep. 2 | No number | Tags | Separate Live model | $9/1M audio tokens, $18 on 1 Jan 2027 | Closed |
| Grok 3.0 / TTS | 120 s clip | 20 / 25+ | Under 1 s, ep. 3 | Tags | Yes | $0.08/min, TTS $15/1M | Closed |
| Sonic 3.6 | 10-60 s | 44 | ~90 ms, ep. 4 | English | Agents + LLM | About $37-50/1M | Closed |
| Hume voice APIs | ep. 4 | ep. 4 | Not listed | Not listed | Not listed | None listed | Absent |
| Kokoro | No | 8 | ep. 5 | Speed | No | Free weights | Apache-2.0 |
| Chatterbox | ep. 5 | 23 | ep. 5 | Tags | No | No paid tier | MIT archive |
| Drama 3 | Yes | 83 | 88.9 ms, ep. 5 | Directions | No | Free, capped | $500K, no host |
| Voxtral Mini TTS 3 | Studio | 35+ | Under 1 s, ep. 6 | Context | Cascade | $13/1M | API |
| MAI-Voice 2.1 / Flash | Gated 5-60 s | 23 | ~550 / ~45 ms | SSML | Voice Live | $22 / $15 per 1M | Preview, no SLA |

## Our verdict

Speech-to-speech: the Grok, GPT-Live, or Cartesia row, then that vendor's demos. Scripts: Gemini Flash TTS until 1 January 2027, or the Eleven, Voxtral, and MAI-Voice rows, with MAI-Voice still a preview. Weights: Kokoro if you do not clone, Drama 3 only inside the cap, Chatterbox only as an archive.

## Why this matters

Record the 14 November price, because Gemini's audio rate changes on 1 January 2027 and OpenAI's standalone TTS models shut on 6 January 2027. If Hume is still on a call path, treat episode 4's 13 November cutoff as past and move it. Do not clone another person's voice. An open weight will not check consent for you.
