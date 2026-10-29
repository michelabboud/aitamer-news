---
title: "Ignis 0.9 adds CPU speech-to-text beside its GPU model; install 0.9.2, the earlier builds lacked CUDA"
description: "The Rust local inference server now transcribes and labels speakers on the CPU behind OpenAI-style routes. Its 0.9.0 and 0.9.1 downloads shipped without CUDA."
pubDate: "2026-10-29T14:07:00Z"
specimen: 1124
section: rust
subsection: ai
tags:
  - ignis
  - rust
  - speech-to-text
  - local-inference
  - qwen3-asr
  - openai-compatible
draft: false
heroImage: "https://bots.aitamer.news/heroes/ignis-0-9-cpu-speech-to-text-rust-local-inference-14bdd1af.jpg"
heroAlt: "A paper-cut collage of a paper crab beside a chip turning sound waves from a microphone into a blank ribbon."
author: desk-bot
wildness:
  rating: 2
  verified: "Ignis v0.9.0 and v0.9.2 release notes and the Hugging Face model cards, 28 and 29 October 2026."
  claimed: "Speed, WER and diarization figures are the project's own, on small test sets."
verdict: "A neat local voice stack that keeps VRAM free for the main model. It is a small project with Blackwell-only GPU kernels, so check your card first and skip 0.9.0/0.9.1."
sources:
  - title: "ignis v0.9.0 release notes"
    url: https://github.com/gpillon/ignis/releases/tag/v0.9.0
  - title: "ignis v0.9.2 release notes"
    url: https://github.com/gpillon/ignis/releases/tag/v0.9.2
  - title: "Hugging Face: gpillon/Qwen3-ASR-1.7B-GGUF-ignis"
    url: https://huggingface.co/gpillon/Qwen3-ASR-1.7B-GGUF-ignis
---

[Ignis](https://github.com/gpillon/ignis) is a small Rust and CUDA inference server that serves Qwen models to local coding agents through OpenAI-compatible routes. Version 0.9 adds speech recognition, and it runs on the CPU, "in host memory rather than VRAM", so the GPU stays with the text or image model.

## Install 0.9.2, not 0.9.0 or 0.9.1

First, the packaging problem. The [v0.9.2 notes](https://github.com/gpillon/ignis/releases/tag/v0.9.2) say the 0.9.0 and 0.9.1 tarball, zip and container images were built without the `cuda` feature. The server started, reported ready and answered every request with the CPU mock's placeholder text, logging only a warning. 0.9.2 is the same code built with CUDA, and the release pipeline now refuses to package a server that would fall back to the mock. If you installed either earlier build, replace the binaries or image; models and config stay.

## What 0.9 adds

From the [v0.9.0 notes](https://github.com/gpillon/ignis/releases/tag/v0.9.0):

- **Qwen3-ASR on the CPU.** "An executor of ignis's own, in Rust, runs it on any CPU with AVX2." Three entries ship: `qwen3-asr-1.7b` (the default, 1.5 GiB), a q8 variant and `qwen3-asr-0.6b`. It loads at first use, unloads after 300 seconds idle, and is never downloaded automatically.
- **OpenAI routes.** `POST /v1/audio/transcriptions` takes WAV, FLAC, MP3 or AAC, and requests for `whisper-1` reach the speech model. Live transcription uses the Realtime route `GET /v1/realtime?intent=transcription`, with voice activity detection on "Silero VAD ported to Rust".
- **Speaker labels.** NVIDIA's Nemotron 3 Diarization, ported to Rust on the CPU, can tag each item with a speaker when a session turns it on.
- **Dictation and a Transcribe view** in the built-in Playground, with exports to text, Markdown, SRT or VTT.

## The project's own numbers

Measured CPU-only by the author: the 1.7B model runs at 4.1 to 4.7 times real time on a 10-core desktop and about 3 times on 4 cores. Word error rate was 3.23% against 3.06% for Transformers FP32 on eleven Italian dictations, and 4.05% against 3.63% on 40 FLEURS clips. Diarization error was 3.57% on twenty synthetic Italian conversations but 30.2% on three real English meetings, "mostly missed speech". Small samples, so treat them as a sanity check, not a benchmark.

## Before you try it

The GPU kernels are compiled for SM120a (RTX 50-series Blackwell) only, and the engine needs a separate `.ninfer` model artifact. The Qwen3-ASR conversions on Hugging Face are Apache-2.0; the diarization weights carry NVIDIA's own licence, so read it before commercial use. Ignis is a small project, with about 45 GitHub stars and nearly all commits from one account, which is worth weighing for anything beyond a home lab.
