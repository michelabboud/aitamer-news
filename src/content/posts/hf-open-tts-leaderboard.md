---
title: "Hugging Face Open TTS Leaderboard: open/multilingual eval infra"
description: "HF (2026-09-30) launched the Open TTS Leaderboard—objective WER/CER (Qwen3 ASR), RTFx, TTFA, and WavLM SIM for open-source and multilingual TTS/voice cloning. Eval infrastructure, not a model launch: ASR/WER is a proxy for intelligibility and does not measure listener preference or naturalness. Named ranks = blog snapshot; eval scripts still “soon.”"
pubDate: 2026-10-01T10:18:00Z
specimen: 93
section: models
tags:
  - huggingface
  - open-tts-leaderboard
  - tts
  - evals
  - leaderboard
  - multilingual
  - voice-cloning
  - wer
  - asr-proxy
  - open-source
draft: false
heroImage: https://media.aitamer.news/heroes/hf-open-tts-leaderboard.jpg
author: desk-bot
wildness:
  rating: 3
  verified: "HF blog 2026-09-30 + Space: WER/CER via Qwen3 ASR, RTFx, TTFA, WavLM SIM; not a model launch"
  claimed: "English/multilingual/streaming names = HF blog snapshot only; eval scripts still soon"
verdict: "Scalable open/multilingual TTS eval board—not a model drop. Keep ASR/WER ≠ naturalness/preference; treat blog model ranks as a moving snapshot; don’t claim the eval harness is open yet."
sources:
  - title: "Open TTS Leaderboard — Hugging Face Blog"
    url: https://huggingface.co/blog/open-tts-leaderboard
  - title: "Open TTS Leaderboard Space"
    url: https://huggingface.co/spaces/hf-audio/open_tts_leaderboard
---

Hugging Face (**Eric Bezzam**, **Steven Zheng**, **Eustache Le Bihan**) announced the **Open TTS Leaderboard** on **2026-09-30**: an **objective-metrics** board for **open-source** and **multilingual** text-to-speech and voice cloning ([blog](https://huggingface.co/blog/open-tts-leaderboard), [Space](https://huggingface.co/spaces/hf-audio/open_tts_leaderboard)). This is **eval infrastructure**, complementary to human-preference arenas (TTS Arena v2, Artificial Analysis, Voice Arena)—**not** a new TTS model release.

A caveat from the authors: **ASR-based WER is a proxy for intelligibility**, and speaker similarity estimates voice-identity preservation. **Neither directly measures naturalness, expressiveness or listener preference**, so ASR/WER is not a measure of listener preference or naturalness.

## Metrics (from the blog)

| Axis | What it measures |
| --- | --- |
| Intelligibility | WER / CER vs prompt transcript via **Qwen3 ASR** (CER for zh/ja/ko; WER elsewhere) |
| Speed | **RTFx** (batched offline on H200); **TTFA** (streaming / batch-size-1 on H200; smaller set on CPU) |
| Voice cloning | Cosine **SIM** of **WavLM** speaker embeddings vs reference |

Default ranking (non-cloning): **macro-average WER** on English splits of **Seed TTS Eval** + **CV3 Eval (zero-shot)**. Multilingual toggle: Seed covers English+Chinese; other languages use CV3; cross-language “Average WER” is a **macro-average across languages**.

Streaming tab: first 3 runs dropped as warm-up; median TTFA on 50 English CV3-Eval prompts, default voice; non-streaming models timed until full utterance.

## Blog snapshot ranks (they move)

As of the [HF blog](https://huggingface.co/blog/open-tts-leaderboard) publish, English WER leaders cited: **hexgrad/Kokoro-82M**, **Supertone/supertonic-3**, **fishaudio/s2-pro**. Multilingual strong names: **k2-fsa/OmniVoice**, **fishaudio/s2-pro**, **FunAudioLLM/Fun-CosyVoice3-0.5B-2512** (CosyVoice3’s multilingual top-3 place holds only for this snapshot). Streaming callout: **kyutai/pocket-tts**; “fastest streaming” is not claimed.

**Listen** tab: side-by-side outputs + optional logged-in votes. Evaluation scripts **“will soon”** be open-sourced (Open ASR Leaderboard–style)—**not** public at announce.

## Who should care

Teams comparing open/multilingual TTS without waiting on arena Elo should start at the [blog](https://huggingface.co/blog/open-tts-leaderboard) and [Space](https://huggingface.co/spaces/hf-audio/open_tts_leaderboard).
