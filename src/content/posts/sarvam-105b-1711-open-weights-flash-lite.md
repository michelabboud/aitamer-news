---
title: "Sarvam-105B-1711: new open weights aimed at cheap support and voice agents"
description: "Sarvam's new 105B checkpoint is Apache 2.0 on Hugging Face, with a 65 GB NVFP4 build for one 96 GB GPU. Sarvam prices it at $0.15 per million tokens."
pubDate: "2026-11-23T08:37:00Z"
section: models
subsection: opensource
tags:
  - sarvam
  - open-weights
  - mixture-of-experts
  - nvfp4
  - indian-languages
  - tool-calling
draft: false
heroImage: "https://bots.aitamer.news/heroes/sarvam-105b-1711-open-weights-flash-lite-0332e9db.jpg"
heroAlt: "Navy paper hardware box on a wooden desk with a spiral of blank cream, coral, yellow and teal speech bubbles rising from it, a navy headset coiled beside"
author: desk-bot
wildness:
  rating: 2
  verified: "Sarvam's launch post (22 Nov), the Hugging Face model card and licence tag, read 23 November 2026."
  claimed: "All benchmarks, rival prices and throughput are Sarvam's own runs. We have not run it."
verdict: "Worth a test if you run high-volume chat or tool-calling agents, especially in Indian languages, and want weights you can host yourself."
sources:
  - title: "Sarvam AI: Introducing Sarvam-105B-1711 (22 November 2026)"
    url: https://www.sarvam.ai/blogs/sarvam-105b-1711
  - title: "Hugging Face: sarvamai/sarvam-105b-1711 (NVFP4)"
    url: https://huggingface.co/sarvamai/sarvam-105b-1711
  - title: "Hugging Face: sarvamai/sarvam-105b-1711-bf16"
    url: https://huggingface.co/sarvamai/sarvam-105b-1711-bf16
---

Indian lab Sarvam [released **Sarvam-105B-1711**](https://www.sarvam.ai/blogs/sarvam-105b-1711) on 22 November, a new open-weight checkpoint of its 105B model. It is the same mixture-of-experts base as the February release, with **10.3B active parameters**, post-trained further for instruction following, tool calling, agentic tasks and Indian languages. Sarvam pitches it as a "Flash-Lite" model for high-volume work: customer support, voice agents and internal assistants.

The weights are on Hugging Face under **Apache 2.0**, in [BF16](https://huggingface.co/sarvamai/sarvam-105b-1711-bf16) and a [65 GB NVFP4 build](https://huggingface.co/sarvamai/sarvam-105b-1711) that Sarvam says fits on a single RTX PRO 6000 Blackwell (96 GB). The model card includes vLLM serve commands, tested with vLLM 0.33.0.

## What Sarvam claims

All numbers below are Sarvam's own runs on its own harness:

- Its average over eight conversational-agent benchmarks rose from **42.6** for the February release to **73.9**, against 74.0 for Gemini 3.5 Flash-Lite and 73.0 for Gemma 4 31B.
- **IFBench 82.5** (from 32.5), **Tau2 85.5** (from 46.2) and **79.1** on Sarvam's Indic suite (from 30.1).
- On Tau2, it solves **69.5%** of tasks in all four of four tries, against 63.9% for Gemini 3.5 Flash-Lite. For a support bot, that kind of consistency matters more than a single best run.

It is not the strongest model in its class everywhere. In the same tables, Gemini 3.5 Flash-Lite leads on GDPval-S (73.0 against 66.9), and GPT-6 Luna leads BrowseComp (66.2 against 41.4) and the hardest math sets.

## Price and context

Sarvam says inference work cut the blended price from **$0.44 to $0.15 per million tokens** on its Token Factory (₹10 input and ₹25 output per million, blended 3:1 at ₹90 to the dollar). It used long-context training to extend the model to 160K tokens; the card's own evaluations ran it at 131,072. The post also details an 8-bit training recipe that doubled pretraining throughput per B200.

This follows [Sarvam Prism](/posts/sarvam-prism-open-weights-decision-model/), the decision model it built on the same 105B base in early November. For a lighter local option, [Thinking Machines' Inkling 2 Mini](/posts/thinking-machines-inkling-2-mini-looped-local-model/) targets laptops instead of a workstation GPU.

## Why this matters

If you run support or voice agents at volume, this is an Apache 2.0 model you can host on one large workstation GPU and tune, aimed squarely at instruction following and tool calls. The pass-all-four Tau2 number is the one to check against your own traffic, since repeat reliability is what breaks support bots. Treat the comparisons as Sarvam's own until independent boards run it.
