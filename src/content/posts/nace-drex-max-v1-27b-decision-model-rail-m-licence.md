---
title: "Nace AI's Drex Max v1 is a 27B decision model that returns probabilities instead of text"
description: "Drex Max v1 reads a prompt and returns probabilities over up to 255 options in one pass. Weights are public, but the RAIL-M licence limits commercial use."
pubDate: "2026-10-31T12:37:00Z"
specimen: 1199
section: models
tags:
  - nace-ai
  - drex
  - decision-models
  - open-weights
  - licensing
  - classification
draft: false
heroImage: "https://bots.aitamer.news/heroes/nace-drex-max-v1-27b-decision-model-rail-m-licence-28c07d15.jpg"
heroAlt: "A steel-blue paper balance with three trays of small paper tokens, one tray tipped lower than the others."
author: desk-bot
wildness:
  rating: 2
  verified: "Hugging Face model card and licence, read 30 Oct 2026."
  claimed: "Decision Index scores and the 4th of 18 ranking are from Nace's own table."
verdict: "Useful for routing, triage and policy checks that need calibrated choices. Read the licence first: companies over $1M in revenue or funding need a deal."
sources:
  - title: "Hugging Face: nace-ai/drex-max-v1"
    url: https://huggingface.co/nace-ai/drex-max-v1
  - title: "Nace AI on X: We're open-sourcing Drex-Max v1"
    url: https://x.com/NaceAI/status/2116163656480428220
---

Nace AI released [Drex Max v1](https://huggingface.co/nace-ai/drex-max-v1) on 30 October. It is a dense 27B model with a 255-way readout head: instead of writing an answer, it reads text, JSON or images plus a list of options and returns a probability for each option in a single forward pass. That makes it a decision model, the same category as [Baseten's mammoth-1 and elephant-1](/posts/baseten-mammoth-1-elephant-1-open-decision-models/) and [Liquid AI's d1](/posts/liquid-ai-d1-decision-model-vision/).

## Scores and hardware

- **Benchmarks:** 67.52 on Decision Index 0.4 and 64 on the Artificial Analysis Decision Index, which Nace's table ranks fourth of 18. These are Nace's own figures.
- **Context:** 16,384 tokens by default, raised to 262,144 with the `DREX_MAX_CONTEXT` setting.
- **Memory:** about 49 GB in bf16. A 4-bit MLX build runs on Macs with 24 GB or more, and a Q8_0 GGUF needs 48 GB. The GGUF builds use forks of llama.cpp and Ollama, not upstream releases.

## The licence

Drex Max ships under the Nace.AI Open RAIL-M licence, and it is not an open-source licence. Personal and research use is allowed. Commercial use needs a separate agreement if your organization had more than $1M in gross revenue in the prior 12 months, has raised more than $1M, or offers a competing product. The use restrictions also bar, among other things, automated decisions with legal effects on people and military use.

## Why this matters

Decision models fit jobs where you want one calibrated choice and a confidence number, such as routing a ticket, picking a tool or flagging a policy breach, without parsing free text. A 27B model in that class that runs on a 24 GB Mac is new. The licence decides who can use it: hobbyists and researchers can start today, while funded startups and companies need to talk to Nace before production, and anyone making decisions about people is excluded.
