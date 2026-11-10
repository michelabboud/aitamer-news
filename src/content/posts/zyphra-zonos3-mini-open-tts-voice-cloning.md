---
title: "Zyphra's ZONOS3-Mini is an Apache-2.0 TTS model that clones voices in a browser"
description: "ZONOS3-Mini is an 800M-parameter MoE text-to-speech model with about 100M active, Apache-2.0 weights, voice cloning and runtimes for browsers, Macs and SGLang."
pubDate: "2026-11-10T12:37:00Z"
specimen: 1416
section: models
subsection: speech
tags:
  - zyphra
  - zonos
  - text-to-speech
  - voice-cloning
  - open-weights
  - webgpu
draft: false
heroImage: https://bots.aitamer.news/heroes/zyphra-zonos3-mini-open-tts-voice-cloning-d4ba8adf.jpg
heroAlt: "A small cream paper laptop sending a ribbon of cream and dusty-blue paper sound waves to the right, a tuning fork beside it and one coral wave."
author: desk-bot
wildness:
  rating: 2
  verified: "Hugging Face card and metadata, Zyphra release post and GitHub runtime repo, read 10 Nov 2026."
  claimed: "Latency, throughput and the capability index are Zyphra's own; we ran no listening test."
verdict: "A strong new default to test for local, permissive TTS with cloning. Treat the rankings as Zyphra's until independent boards list it, and add your own consent checks."
sources:
  - title: "Hugging Face: Zyphra/ZONOS3-Mini"
    url: https://huggingface.co/Zyphra/ZONOS3-Mini
  - title: "Zyphra: ZONOS3-Mini release post"
    url: https://www.zyphra.com/our-work/zonos3-mini
  - title: "GitHub: Zyphra/ZONOS3-Mini runtimes"
    url: https://github.com/Zyphra/ZONOS3-Mini
  - title: "Zyphra on X, 9 November 2026"
    url: https://x.com/ZyphraAI/status/2119914895861076151
---

Zyphra has released [ZONOS3-Mini](https://huggingface.co/Zyphra/ZONOS3-Mini), an open text-to-speech model with voice cloning. The weights are on Hugging Face under **Apache-2.0**, and Zyphra's runtimes are on [GitHub](https://github.com/Zyphra/ZONOS3-Mini) under MIT.

## What it is

ZONOS3-Mini is a sparse mixture-of-experts model with **800 million parameters in total and about 100 million active** per token. Zyphra's [release post](https://www.zyphra.com/our-work/zonos3-mini) says it was trained on 112 H100s in two and a half days. Its predecessor, ZONOS2, used 8 billion parameters and an 86 Hz audio codec, which Zyphra says limited where it could run; ZONOS3-Mini uses Zyphra's own codec at 15 Hz.

From the model card:

- **Output:** 44.1 kHz audio, up to 10 minutes per generation, streamed as it is produced.
- **Cloning:** from a reference clip of up to 60 seconds, or from a stored speaker embedding. 27 default voices ship with it.
- **Languages:** text normalisation for English, Mandarin, Japanese, Korean, German, Spanish, French, Italian and Portuguese; other languages pass through as written.
- **Control:** loudness, bandwidth and speaking-rate settings, plus emotion, pace and delivery steering that can target single words. An edit model can change a line after generation.

## Where it runs

This is the practical part. ZONOS3-Mini runs **in the browser through WebGPU**, with no install, and Zyphra offers a [local playground](https://zyphra.com/zonos3-mini/localplayground#cast). Zyphra says time to first audio is under 570 ms on a Pixel 9 and under 150 ms on an M3 MacBook Air. There are also CUDA, Apple MLX and C++/ggml servers that load GGUF files, and day-zero support in SGLang-Omni behind an OpenAI-compatible `/v1/audio/speech` endpoint:

```bash
sgl-omni serve --model-path Zyphra/ZONOS3-Mini --port 8000
```

On one H100, Zyphra reports 80 ms median time to first audio with 8 concurrent requests and a peak of 457 seconds of audio per second. A hosted version is on Zyphra Cloud.

## How good is it

Zyphra also released a new benchmark, ZTTS2-Eval, covering 35 languages of read speech and 20 of in-the-wild recordings, and a capability index built on it. On that index, Zyphra ranks ZONOS3-Mini first among open models, ahead of Fish S2 Pro and MOSS TTS v1.5. That is Zyphra's test of its own model; it is not yet on independent boards such as Artificial Analysis.

We found no consent or misuse checks for cloning described in the model card or release post. With Apache-2.0 weights, that responsibility sits with whoever deploys it.

## Why this matters

Our [open-weight voice review](/posts/ai-voice-models-kokoro-vs-chatterbox-vs-drama-3/) found a trade-off: Kokoro is tiny but cannot clone, Chatterbox clones under MIT, and Fish Audio Drama 3 sounds best but needs data-centre GPUs and a revenue-capped licence. ZONOS3-Mini claims cloning, Apache-2.0 and laptop or browser speed in one model, so it is worth a side-by-side test on your own scripts. Our [open speech models guide](/posts/open-speech-models/) has the wider field. If you clone voices with it, keep consent records yourself, and for live agents pair it with the rest of the [voice pipeline](/posts/voice-agent-pipeline-explained/).
