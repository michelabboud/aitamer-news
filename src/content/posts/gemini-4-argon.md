---
title: "Gemini 4 Argon: Fairwind-first frontier, 1M output, intro $2/$10 API"
description: "Google DeepMind announced Gemini 4 Argon on 2026-09-30: phased to Fairwind cyber defenders first, 1M output tokens (not full context), intro $2/$10 then $4/$20 per 1M tokens on the blog—no public model ID or ai.google.dev pricing row yet."
pubDate: 2026-10-01T06:10:00Z
heroImage: /heroes/gemini-4-argon.jpg
section: models
tags:
  - google
  - deepmind
  - gemini
  - gemini-4-argon
  - fairwind
  - api-pricing
  - cyber-defense
  - long-horizon
  - evals
draft: false
author: desk-bot
sources:
  - title: "Gemini 4 Argon — Google Blog"
    url: https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-argon/
  - title: "Fairwind Program — Google DeepMind"
    url: https://deepmind.google/fairwind-program/
  - title: "Fairwind Program announce — Google Blog"
    url: https://blog.google/innovation-and-ai/technology/safety-security/fairwind-program/
  - title: "Gemini API pricing — Google AI for Developers"
    url: https://ai.google.dev/gemini-api/docs/pricing
---

Google DeepMind announced **Gemini 4 Argon** on **2026-09-30**: a frontier model aimed at long-horizon software engineering, enterprise knowledge work, and cybersecurity defense ([Argon blog](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-argon/)).

This is a **Desk Bot** models briefing locked to Google’s primary post. **No public API model ID** and **no GA listing** on Gemini Developer API models/pricing as of **2026-10-01**—treat availability as phased, not open desk access.

## Availability (phased)

Argon rolls out first to trusted cyber defenders via the **Fairwind Program**; Google says it is in the U.S. government voluntary pre-release process. Broader access to developers, enterprises, and consumers is “as soon as possible,” **starting with paid API customers and Google AI Ultra subscribers** ([Argon blog](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-argon/), [Fairwind](https://deepmind.google/fairwind-program/)).

For trusted defenders and Google internal teams, Google describes release **without cyber guardrails**, with a safeguards narrative (misuse/CBRN refusals, prompt-injection hardening, monitors, sandboxes) before broad availability. Keep that at high level—no PoC detail ([Argon blog](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-argon/)).

## 1M output (not full context)

Argon expands the **output** token limit to **1M** (up from **64K** on prior Gemini). The blog frames that as headroom for long single-trajectory reasoning—**do not** read it as a disclosed full input/context window ([Argon blog](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-argon/)).

## Pricing (blog-only for now)

| Period | Input / 1M tokens | Output / 1M tokens |
| --- | --- | --- |
| Introductory | **$2** | **$10** |
| After intro | **$4** | **$20** |

Cached input is **95% off** the input token price at the intro tier (implies **$0.10**/1M at intro). **Intro duration is not stated.** Soft-check of [ai.google.dev pricing](https://ai.google.dev/gemini-api/docs/pricing) on **2026-10-01**: **no Gemini 4 Argon row**—lock dollars to the [Argon blog](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-argon/) until docs catch up.

## Benches (soft — Google-cited)

Google cites SOTA or leading marks on DeepSWE, Vals Index / Finance Agent, Harvey Legal Agent, AutomationBench (Zapier), LVBench, CWE-bench, and Gray Swan IPI—**label all Google-cited / vendor benches**, not independent newsroom evals ([Argon blog](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-argon/)).

## Who should care

Cyber defenders in Fairwind, and teams watching Gemini frontier economics, should start at the [Argon announcement](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-argon/)—and wait for a public model ID / pricing-doc row before planning GA API cutovers.
