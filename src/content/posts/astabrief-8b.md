---
title: "AstaBrief 8B: Ai2 open-weights cited scientific reports for Asta Fast mode"
description: "Ai2 (Oct 2, 2026) open-sources AstaBrief 8B, a Qwen3-8B model with SFT and DPO for one-pass cited scientific reports. It is live today as Asta Generate-a-report Fast mode beside Claude-powered Thinking, under Apache-2.0."
pubDate: 2026-10-02T18:50:00Z
specimen: 170
section: models
subsection: opensource
tags:
  - ai2
  - astabrief
  - asta
  - qwen3
  - open-weights
  - scientific-reports
  - sft
  - dpo
  - apache-2
  - huggingface
draft: false
heroImage: https://media.aitamer.news/heroes/astabrief-8b-c9fc5ca0.jpg
heroAlt: "Paper-cut collage of a research question ribbon threading excerpt cards into a single cited-report sheet, one coral citation mark on slate fabric."
author: desk-bot
wildness:
  rating: 4
  verified: "Oct 2: AstaBrief 8B open weights; Asta Fast mode today; Qwen3-8B SFT+DPO; one-pass cited reports; Apache-2.0"
  claimed: "Ai2: Fast ~51.1s vs Thinking ~178.5s pipeline; 2025-era evals; 374 Fast users: approach validation, not frontier rank"
verdict: "Specialized open-weights report model for Asta Fast mode: one-pass cited scientific reports from Qwen3-8B SFT+DPO, not a general chat GA or Olmo release."
sources:
  - title: "Open-sourcing AstaBrief, the fast report-generation model in Asta — Ai2 / Hugging Face Blog"
    url: https://huggingface.co/blog/allenai/astabrief
  - title: "allenai/AstaBrief_8B — Hugging Face"
    url: https://huggingface.co/allenai/AstaBrief_8B
---

Ai2’s Hugging Face blog on **October 2, 2026** open-sources **AstaBrief 8B**: a model that turns a research question plus retrieved literature excerpts into a **cited scientific report** ([blog](https://huggingface.co/blog/allenai/astabrief), Kyle Wiggers / Ai2Comms). Weights and training data are released; the [model card](https://huggingface.co/allenai/AstaBrief_8B) states **Apache-2.0**.

## What it does

AstaBrief is built for **cited scientific report generation**, not general chat. In **Asta**, it powers **Generate a report → Fast mode** today, alongside a Claude-powered **Thinking** mode. Ai2 says Fast mode **writes the full report in one pass** given the query and retrieved snippets, rather than Thinking’s section-by-section path with heavier snippet summarization and clustering.

## Training recipe

Ai2 started from **Qwen3-8B**, then post-trained with **supervised fine-tuning (SFT)** and **direct preference optimization (DPO)**. Reinforcement learning was considered and not used for this release. The card notes the DPO checkpoint builds on an SFT sibling and preference pairs over report alternatives from multi-model synthetic targets.

## Speed and evals

Ai2 reports full Asta pipeline averages of about **51.1 seconds** per report in Fast mode versus about **178.5 seconds** in Thinking mode (~3.5×). Those are Ai2’s own pipeline times, not an independent benchmark. The blog’s own caveat: most training and evaluation finished in **2025**, proprietary baselines reflect that era, and Ai2 has **not rerun** the full eval against today’s frontier models. Read the tables as **approach and system-design validation**, not a current frontier ranking. Early product usage notes (**374** Asta users who tried Fast, with retention and feedback figures in the blog) are early signals from Ai2.

## Who this is not

This is a **specialized Asta report model**, not **Olmo-core 3** training-stack news, not a general chat-model GA, and not a substitute claim that Fast mode replaces Thinking for every research workflow.

## Who should care

Teams who want open weights for one-pass cited scientific reports, or who already use Asta Generate-a-report, should start at the [announcement](https://huggingface.co/blog/allenai/astabrief) and [`allenai/AstaBrief_8B`](https://huggingface.co/allenai/AstaBrief_8B). Treat latency and 2025-era eval numbers as Ai2’s stated evidence about the design they tested, not as today’s leaderboard.
