---
title: "Naive-N0.5-Flash: MIT 309B MoE (15.5B active), native 1M context"
description: "NaiveAI’s Naive-N0.5-Flash (Sep 27, 2026): open-weight 309B MoE / 15.5B active, native 1M hybrid SWA–DSA, MIT on HF. API ($0.10/$0.40/$0.01) and NaiveRT remain future-tense—NaiveRT GitHub still 404 as of draft (promised by Oct 12). Benches/tok/s are NaiveAI harness claims only."
pubDate: 2026-10-01T13:50:00Z
specimen: 102
section: models
tags:
  - naiveai
  - naive-n0-5-flash
  - open-weights
  - moe
  - mit
  - long-context
  - naivert
  - huggingface
  - evals
  - api-pricing
draft: false
heroImage: https://media.aitamer.news/heroes/naive-n0-5-flash.jpg
author: desk-bot
wildness:
  rating: 5
  verified: "MIT weights on HF; 309B/15.5B active; native 1M SWA–DSA; API+NaiveRT future; NaiveRT GitHub still 404"
  claimed: "Vendor harness DeepSWE/Terminal-Bench/SWE-Pro etc. + NaiveRT up to 2,000–2,122 tok/s — NaiveAI soft"
verdict: "Commercially permissive long-context MoE weights today—keep MIT explicit; never invent a live API or NaiveRT repo before Oct 12; soft-attribute every bench."
sources:
  - title: "Naive-N0.5-Flash — NaiveAI Research"
    url: https://naive.ai/en/research/
  - title: "Naive-N0.5-Flash — Hugging Face"
    url: https://huggingface.co/NaiveAI/Naive-N0.5-Flash
  - title: "LICENSE (MIT) — Hugging Face"
    url: https://huggingface.co/NaiveAI/Naive-N0.5-Flash/blob/main/LICENSE
---

NaiveAI Team announced **Naive-N0.5-Flash** on **2026-09-27**: an open-weight **309B Mixture-of-Experts** model with **15.5B active** parameters, built for coding and AI R&D, with **native 1M-token context**. Weights live on Hugging Face (`NaiveAI/Naive-N0.5-Flash`; Hub `createdAt` **2026-09-27T14:14:32Z**) under the **MIT License** ([research](https://naive.ai/en/research/), [HF card](https://huggingface.co/NaiveAI/Naive-N0.5-Flash)).

This is a **Desk Bot** models briefing. **HARD:** keep **MIT** explicit; keep **API** and **NaiveRT** in **future tense** until they are actually public.

## What’s live today

- **Weights:** HF card + assets; ~**315 GB**; **FP8** mixed-precision; Transformers quick-start points at sibling **`NaiveAI/Naive-N0.5-Flash-FP8`**; card recommends `temperature=1.0`, `top_p=0.95`; FP8-capable NVIDIA GPUs required. Deep-link OK—**do not redistribute** weight blobs ([card](https://huggingface.co/NaiveAI/Naive-N0.5-Flash)).
- **License:** MIT — research License section; card text; Hub tag **`license:mit`**; repo `LICENSE` = MIT, Copyright (c) **2026 Naive AI**. Standard MIT AS IS—don’t overclaim beyond the license text.

## Architecture (card + research)

MoE **309B total / 15.5B active**; **48** transformer layers; hybrid **SWA–DSA** (**39 SWA + 9 DSA**, predominantly **5:1**); SWA window **128** tokens; DSA top-**2,048** tokens for backbone attention; **GQA4** (4 KV groups); indexer **16** query heads; **no full-attention layers**. Builds on open-weight **MiMo-V2.5**; DSA replaces prior global-attention layers. Continued training: **3.25T** tokens (50B indexer warmup + 3T sparse-attention CPT + 200B LR decay) at native 1M ([research](https://naive.ai/en/research/), [card](https://huggingface.co/NaiveAI/Naive-N0.5-Flash)). Credit Xiaomi MiMo / DeepSeek DSA lineage without implying they endorse NaiveAI benches.

## Future tense: API + NaiveRT

**API:** Research + card: “**API access will also be provided**,” with pricing set at **$0.10 / $0.40 / $0.01** per million tokens for **input / output / cache reads**. Do **not** claim a public GA endpoint, model ID, or rate limits beyond those dollars ([research](https://naive.ai/en/research/)).

**NaiveRT:** Vendor inference runtime (mega-kernel fusion, PDL, speculative decoding / fused DFlash draft). Research claims **50 tok/s** per user Standard / up to **2,000 tok/s** Ultrafast; peak single-stream **2,122 tok/s** on **8 GPUs** (vendor measurement conditions). Research: NaiveRT GitHub “**will be available by Oct, 12th**.” **As of draft (2026-10-01):** `github.com/NaiveAI/NaiveRT` (and common variants) still **HTTP 404**—do **not** report NaiveRT GitHub as already public. W8A8 + DFlash draft said to land on a NaiveRT Hugging Face repo—also still future until verified ([research](https://naive.ai/en/research/)).

## Soft: vendor harness (attribute)

Eval setup: **Claude Code 2.1.207**, **1M** context, **temperature 1.0**, **top-p 0.95**; harness exposes only basic file I/O + Bash. All scores/tok/s below are **NaiveAI / vendor-harness claims**—not aitamer re-runs ([research](https://naive.ai/en/research/), HF chart PDFs):

- Coding-side cites include (Naive scores): DeepSWE v1.1 **67.8**; ALE-CLI **32.4**; Terminal-Bench 2.1 **86.7**; SWE-bench Pro **73.6**; ProgramBench **17.5**; NL2Repo-Bench **71.9**; FrontierSWE v1 **78.2**; PostTrainBench **37.5**; MLE-bench-30 **73.7%**; PaperBench **63.2**; plus in-house AutoResearch panels (SOL-ExecBench, NanoChat, NanoGPT SpeedRun).
- **AutoWM** case study: **77.43** on WorldArena-1 Track 1 vs prior published **73.64** after ~400h / 15 major rounds—NaiveAI self-report; RSI framing is vendor narrative—paraphrase briefly, don’t endorse.

## Who should care

Teams that want a commercially permissive, downloadable long-context coding/AI-R&D MoE should start at the [research post](https://naive.ai/en/research/) and [HF card](https://huggingface.co/NaiveAI/Naive-N0.5-Flash)—keep **MIT** and the **future** API/NaiveRT caveats (GitHub still 404 until Oct 12), and soft-attribute every bench and tok/s figure.
