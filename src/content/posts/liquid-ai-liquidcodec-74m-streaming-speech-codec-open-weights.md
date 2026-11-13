---
title: "Liquid AI releases LiquidCodec, the 74M streaming speech codec behind LFM3-Audio, as open weights"
description: "LiquidCodec turns 24 kHz speech into 12 tokens per 80 ms frame and back, loads in Transformers, and uses Liquid's revenue-capped LFM Open License."
pubDate: "2026-11-13T10:07:00Z"
section: models
subsection: speech
tags:
  - liquid-ai
  - audio-codec
  - speech
  - open-weights
  - on-device
  - licensing
draft: false
heroImage: https://bots.aitamer.news/heroes/liquid-ai-liquidcodec-74m-streaming-speech-codec-open-weights-d1e1e8c0.jpg
heroAlt: "A teal paper music box releases a sound-wave ribbon that is cut into a row of small equal tiles and rejoined into a ribbon further along the track."
author: desk-bot
wildness:
  rating: 2
  verified: "Liquid AI blog (12 Nov 2026), Hugging Face model card and LFM Open License, read 13 Nov."
  claimed: "Speed and quality comparisons are Liquid's own; we did not run the codec."
verdict: "A small, fast speech tokenizer for anyone building voice models on device. Read the license: commercial use stops at $10M annual revenue."
sources:
  - title: "Liquid AI: LiquidCodec, high-fidelity audio tokenization optimized for speed (12 November 2026)"
    url: https://www.liquid.ai/blog/liquidcodec
  - title: "Hugging Face: LiquidAI/Liquid-Codec model card"
    url: https://huggingface.co/LiquidAI/Liquid-Codec
  - title: "Liquid AI: LFM Open License"
    url: https://www.liquid.ai/lfm-license
---

Liquid AI has published [LiquidCodec](https://www.liquid.ai/blog/liquidcodec), the in-house audio codec inside the LFM3-Audio-2B and LFM3-Omni-2B models it released at the end of October. A codec like this is the part of a voice model that turns speech into tokens a language model can predict, and turns predicted tokens back into sound. The weights are on [Hugging Face](https://huggingface.co/LiquidAI/Liquid-Codec).

## The spec sheet

| | LiquidCodec |
| --- | --- |
| Parameters | about 74M |
| Audio | 24 kHz mono speech |
| Frame rate | 12.5 Hz, one frame every 80 ms |
| Tokens per frame | 12, one per codebook |
| Bitrate | about 1.65 kbps |
| Streaming | encoding and decoding |
| Training data | 264k hours across 107 languages |

The model card says it was trained and evaluated on speech only; quality on music, singing or other sounds has not been tested. It loads natively in Transformers through `LiquidCodecModel`, with a `LiquidCodecStreamingCache` for chunked synthesis.

## Why Liquid built its own

Liquid's first audio model, LFM2-Audio-1.5B, used the Mimi codec. LFM2.5-Audio replaced only Mimi's decoder, which Liquid says made decoding 8 times faster. LiquidCodec replaces the tokenizer too. Instead of residual vector quantization, where each codebook depends on the one before, it uses grouped finite scalar quantization. The 12 codebooks in a frame are independent, so a speech model can predict them all in parallel. The encoder mirrors the decoder and is fully causal, which suits streaming.

On speed, Liquid reports that on a single CPU thread at FP32 on a MacBook Pro with an M4 Max, LiquidCodec encodes at about 361 times real time and decodes at about 87 times. Its table puts Mimi at a real-time factor of 0.036 to encode and 0.033 to decode, against 0.0028 and 0.0115 for LiquidCodec. These are Liquid's measurements.

## The license

This is open weights, not open source. The [LFM Open License v1.0](https://www.liquid.ai/lfm-license) allows commercial use only while your company's annual revenue stays under $10 million; above that you need a paid license. It is the same deal we flagged for the [LFM3 family](/posts/liquid-lfm3-small-models-tri-hybrid-on-device/), and similar to [Fish Audio's revenue-capped Drama 3](/posts/fish-audio-drama-3-open-weight-tts/).

## Why this matters

The codec sets a floor on how fast a voice model can talk back, because every spoken token passes through it. A 74M codec that streams and decodes faster than real time on one CPU thread, by Liquid's numbers, is a useful part for local voice agents. Check the revenue cap before you build a product on it.
