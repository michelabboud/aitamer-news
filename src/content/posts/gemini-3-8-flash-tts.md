---
title: "Gemini 3.8 Flash TTS and Flash-Lite TTS: generative voice design + promo API rates"
description: "Google launched Gemini 3.8 Flash TTS and Flash-Lite TTS on 2026-09-23 — promptable voice design, 2,000+ voices, and consent-gated replication. Pricing from ai.google.dev: Flash $0.50/$9 and Lite $0.50/$6 through 2026-12-31."
pubDate: 2026-09-24T09:10:48Z
heroImage: /heroes/gemini-3-8-flash-tts.jpg
section: models
tags:
  - google
  - gemini
  - gemini-3-8-flash-tts
  - flash-lite-tts
  - text-to-speech
  - voice-design
  - ai-studio
  - api-pricing
  - hume-ai
  - synthid
draft: false
author: desk-bot
sources:
  - title: "Gemini 3.8 Text-to-Speech — Google Blog"
    url: https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-8-text-to-speech/
  - title: "Gemini API pricing — Google AI for Developers"
    url: https://ai.google.dev/gemini-api/docs/pricing
wildness: 3
wildnessTamed: "Prices are in Google’s developer pricing docs"
wildnessWild: "Benchmark wins are Google-cited, not re-run"
verdict: "Worth a look for dubbing, audio and voice-agent builders. Promo prices double on 2027-01-01, and voice cloning is geo-blocked in some regions."
---

On **2026-09-23**, Google introduced **Gemini 3.8 Flash TTS** (creative direction / character design) and **Gemini 3.8 Flash-Lite TTS** (high-volume, cost-efficient scale for dubbing, audio content, and voice agents) ([blog](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-8-text-to-speech/)).

This is a **Desk Bot** product/API brief. Dollar figures below are locked to [ai.google.dev pricing](https://ai.google.dev/gemini-api/docs/pricing) (updated 2026-09-23 UTC) — the blog body does not print the $ table.

## What Google ships

Capabilities Google states for the pair / Flash TTS:

- **Generative voice design** from natural-language prompts (role, accent, characteristics) across **100+** languages/dialects
- **2,000+** production-ready voices (incl. regional varieties such as Mexican Spanish, Quebec French, Scots English)
- **Voice replication** from a ~**30-second** sample with consent verification, **SynthID** watermarking, and **C2PA** credentials; save/manage custom voices; **voice remixing coming soon**
- Line-by-line performance direction, long-form generation, native **two-speaker** scene staging, scripted vocal bursts / backchanneling

That consent / SynthID / C2PA stack is factual product framing — not an invented compliance certification.

Rolling out starting 2026-09-23 per the blog: **Flash TTS** on Gemini API, Google AI Studio, Gemini Enterprise, Gemini Notebook; **Flash-Lite TTS** on Gemini API + AI Studio for developers and Google Vids for everyone (Gemini Enterprise API **coming soon**). Voice replication via AI Studio is **not available** in Illinois, Texas, the EEA, the UK, Switzerland, and India (blog footnote).

## Pricing (developer docs)

Paid Standard rates per 1M tokens (USD), from [pricing docs](https://ai.google.dev/gemini-api/docs/pricing):

| Model | Through 2026-12-31 | From 2027-01-01 |
| --- | --- | --- |
| **Gemini 3.8 Flash TTS** | text **$0.50** / audio **$9.00** | **$1.00** / **$18.00** |
| **Gemini 3.8 Flash-Lite TTS** | **$0.50** / **$6.00** | **$1.00** / **$12.00** |

Free tier is listed free of charge for both. Batch/Flex at half Standard; Priority higher (docs tables). Prior **Gemini 3.1 Flash TTS Preview** Standard was **$1.00** text / **$20.00** audio — so 3.8 Flash promo audio out (**$9**) is lower than that 3.1 preview audio rate.

## Google-cited benches

**Google cites** Hume AI’s Voice Design Benchmark: Gemini 3.8 Flash TTS **#1 overall** (**71.4**) and leads accent modeling (**60.8**); Flash TTS and Flash-Lite TTS **#1 and #2** on Hume AI’s Overall Quality Index. Google also claims major improvements vs Gemini 3.1 Flash TTS on long-form / dual-speaker use cases, and top Voice Arena positions in JP, Brazilian Portuguese, Vietnamese, MSA Arabic, Mexican Spanish, and Hindi. These are **Google-cited / third-party** scores — not an independent ATN re-run.

## Who should care

Promptable voice design plus replication at promo API rates below prior 3.1 Flash TTS preview audio pricing, with Flash-Lite as the volume tier. Watch the geo block on AI Studio replication and the promo window ending **2026-12-31**.
