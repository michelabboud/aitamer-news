---
title: "CHIMERA: a Rust voice synth that simulates an airway instead of a model"
description: "CHIMERA speaks, sings and beatboxes in the browser from a simulated airway, in Rust compiled to WebAssembly. Its own Whisper check: 37% word errors vs 2.7%."
pubDate: "2026-11-09T14:37:00Z"
section: rust
tags:
  - rust
  - webassembly
  - speech-synthesis
  - audio
  - open-source
draft: false
heroImage: https://bots.aitamer.news/heroes/chimera-rust-wasm-physical-model-voice-synth-0755a625.jpg
heroAlt: "A cream paper cutaway of a head and throat with paper tubes for lungs and mouth, sound arcs at the lips and a small coral songbird."
author: desk-bot
wildness:
  rating: 2
  verified: "README, docs/architecture.md and docs/speech-comparison.md read 9 Nov 2026; MIT; repo created 5 Nov, pushed 9 Nov."
  claimed: "Comparison numbers are the project's own runs; we did not render audio."
verdict: "Not an AI model and not a TTS replacement: a physical simulation you can play with and measure. The project's own numbers show how far it is from intelligible speech."
sources:
  - title: "jamesondh/chimera-vocal-synth (GitHub)"
    url: https://github.com/jamesondh/chimera-vocal-synth
  - title: "CHIMERA architecture notes"
    url: https://github.com/jamesondh/chimera-vocal-synth/blob/main/docs/architecture.md
  - title: "CHIMERA speech comparison against the TSP database"
    url: https://github.com/jamesondh/chimera-vocal-synth/blob/main/docs/speech-comparison.md
  - title: "CHIMERA live demo"
    url: https://chimera-vocal-synth.vercel.app
  - title: "AI Tamer: AI voice models: Kokoro vs Chatterbox vs Fish Audio Drama 3"
    url: https://aitamer.news/posts/ai-voice-models-kokoro-vs-chatterbox-vs-drama-3/
  - title: "AI Tamer: Mirai previews uzu in the browser"
    url: https://aitamer.news/posts/uzu-run-webgpu-browser-preview/
---

[CHIMERA](https://github.com/jamesondh/chimera-vocal-synth) is a voice synthesizer that runs in the browser and makes every sound from a simulated airway: lungs, vocal folds (or a bird's syrinx), a branched vocal tract, lips and nose. The README says the sound comes from that simulation, "not from samples". The engine is Rust compiled to WebAssembly for an AudioWorklet, and the same code runs natively for tests and a `chimera` CLI. The repository was created on 5 November 2026, is MIT licensed, and was trending on X on 9 November.

This is not a neural text-to-speech model, and it is worth being clear about that. If you want natural speech today, the [open-weight TTS models we compared](/posts/ai-voice-models-kokoro-vs-chatterbox-vs-drama-3/) are the tools. CHIMERA is interesting for a different reason.

## What it does

- **Play:** drag the tongue, lips and jaw in a live cutaway of a head, or use a vowel pad, keyboard or Web MIDI.
- **Speak:** English text (via the CMU Pronouncing Dictionary with a letter-to-sound fallback) or IPA, turned into articulatory gestures and prosody.
- **Sing:** a piano roll with lyrics per note.
- **Beatbox:** pads and a step sequencer, with every drum sound an articulatory gesture.
- **Bestiary:** a songbird with a two-voice syrinx, a seal, an alligator and an elephant.

Male, female and child bodies blend continuously, and the on-screen views animate from live engine state.

## How it works

The [architecture notes](https://github.com/jamesondh/chimera-vocal-synth/blob/main/docs/architecture.md) describe the airway as a branched, staggered-grid FDTD (finite-difference time-domain) transmission line. The simulation runs internally at 2 to 4 times the output rate: 96 kHz for an adult human and 192 kHz for small birds and cats. Even clicks are produced through the FDTD, "no special-cased samples".

Running it locally needs Rust with the `wasm32-unknown-unknown` target and Bun. The AudioWorklet needs a secure context, so it works on localhost or over HTTPS.

## The project measures itself, and the numbers are honest

The [speech comparison](https://github.com/jamesondh/chimera-vocal-synth/blob/main/docs/speech-comparison.md) renders the Harvard sentences read by 23 real speakers in McGill's TSP speech database and scores each render against the recording, phone by phone. It also runs Whisper as an intelligibility judge. Whisper gets 2.7% of words wrong across 1,378 adult recordings of real voices, and about 37% wrong on CHIMERA's sentences.

That is a long way from usable speech, and the project says so in its own docs.

## Why this matters

For Rust and WebAssembly builders, CHIMERA is a working example of a real-time, deterministic DSP engine shared between an AudioWorklet in the browser and a native CLI, a similar split to [in-browser inference projects like uzu](/posts/uzu-run-webgpu-browser-preview/). For voice work, the useful contrast is its scoring setup: a public speech database plus Whisper word error rate is a cheap, repeatable way to check any synthesizer's intelligibility, neural or not. The 37% against 2.7% gap is the reason to treat it as an instrument and a teaching tool, not a TTS option.
