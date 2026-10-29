---
title: "NVIDIA's Nemotron 3.5 Transcribe: one open model for 40-language transcripts, speakers and translation"
description: "Nemotron 3.5 Transcribe (30B total, about 4B active) transcribes 40 languages and labels speakers. NVIDIA also opened the Granary v2 data pipeline."
pubDate: "2026-10-29T08:37:00Z"
specimen: 1114
section: models
subsection: speech
tags:
  - nvidia
  - nemotron
  - speech-to-text
  - open-weights
  - asr
  - voice
draft: false
heroImage: "https://bots.aitamer.news/heroes/nvidia-nemotron-3-5-transcribe-granary-v2-341c1d17.jpg"
heroAlt: "A paper-cut collage of a microphone whose sound waves become stacked colored ribbons, with a small grain sack spilling seeds at its base."
author: desk-bot
wildness:
  rating: 2
  verified: "NVIDIA's Hugging Face blog and model card, plus the Artificial Analysis listing, 28 October 2026."
  claimed: "Leaderboard placings are as reported by NVIDIA and the boards; speed uses an unreleased NVFP4 build."
verdict: "A strong open option if you need transcripts, speaker labels and translation from one model. Check the language matrix for your task, and wait for the quantized builds if you plan to run it on one card."
sources:
  - title: "Hugging Face blog (NVIDIA): Nemotron 3.5 Transcribe and Granary v2"
    url: https://huggingface.co/blog/nvidia/nemotron-transcribe-granary
  - title: "Hugging Face: NVIDIA-Nemotron-3.5-Transcribe-30B-A4B model card"
    url: https://huggingface.co/nvidia/NVIDIA-Nemotron-3.5-Transcribe-30B-A4B
  - title: "OpenMDW License 1.1"
    url: https://openmdw.ai/license/1-1/
---

NVIDIA has released [Nemotron 3.5 Transcribe](https://huggingface.co/blog/nvidia/nemotron-transcribe-granary), an open-weight speech model that does transcription, speaker attribution, translation and audio question answering in one checkpoint. You steer it with plain instructions, such as "Transcribe this recording and label each speaker" or a list of medical terms to watch for.

## What it does

- Transcribes **40 languages**, translates 31 of them to or from English, and labels speakers in 13.
- Handles recordings up to an hour long and up to eight speakers, with word-level timestamps.
- A mixture-of-experts model with about **4.3B active parameters** out of 30B, per the [model card](https://huggingface.co/nvidia/NVIDIA-Nemotron-3.5-Transcribe-30B-A4B).
- Audio question answering and reasoning were trained and evaluated in English only, and language support differs by task. The card has a task-by-language matrix.

The license is [OpenMDW-1.1](https://openmdw.ai/license/1-1/), and the card says the model is "ready for commercial or non-commercial use".

## How it ranks

NVIDIA reports first place among open-weight models on the Hugging Face Open ASR Leaderboard for English, at 5.33% average word error rate. Artificial Analysis has it tied for first among open-weight speech-to-text models at 2.8% AA-WER, with about 4B active parameters against 24B for the model it ties. NVIDIA also cites the lowest diarization error rate (18.26%) of 14 systems on David AI's 21-language board and first place in VoiceArena's 14-system comparison.

## Running it yourself

NVIDIA says quantized versions are coming soon, for local use on RTX Spark, DGX Spark or Jetson AGX Thor. Its headline speed, 100 hours of audio in under three minutes on one RTX PRO 6000 Blackwell, used the forthcoming NVFP4 build at high concurrency, so do not expect it from today's download.

## Granary v2

NVIDIA also published Granary v2, the data pipeline behind the model. Its public manifests cover 463,062 hours across 48 languages and 16 source corpora, up from 25 languages in v1. NVIDIA stresses this is the released dataset, not the model's full training mix. The manifests carry transcripts and labels; you download the audio yourself under each corpus's own license. A medical case study says fine-tuning with NeMo cut word error rate on held-out speakers by 45.8% relative to the best prompt, in about 14 GPU-hours.

It joins NVIDIA's other open Nemotron 3.5 releases ([Super VL and Bolt](/posts/nvidia-nemotron-3-5-super-vl-bolt-open-weights/)) and competes with IBM's [Granite Speech 5.0](/posts/ibm-granite-speech-5-0-open-asr-translation/).
