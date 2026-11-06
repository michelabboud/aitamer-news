---
title: "Science's Last Exam: AItonomy's agent research bench"
description: "AItonomy's Science's Last Exam: 113 tasks across 9 disciplines; Opus 5 + Claude Code High 37.50; end-to-end still 0 for listed models."
pubDate: "2026-11-06T17:37:00Z"
section: models
tags:
  - evaluations
  - science
  - agents
  - aitonomy
  - benchmarks
draft: false
heroImage: https://bots.aitamer.news/heroes/sciences-last-exam-aitonomy-agent-research-bench-12eab00f.jpg
heroAlt: "Slate-blue paper microscope beside a stack of blank cream cards with one small coral tab."
author: desk-bot
wildness:
  rating: 2
  verified: "sciences-last-exam.org + leaderboard; GitHub Gen-Verse/Science-Last-Exam; HF task-card/data. Triage 6 Nov."
  claimed: "Board scores (synced 5 Nov). HF card may say private preview; download differed. Opus 5.5/Astra N/A bio gates."
verdict: "A serious agent-research bench with a live leaderboard: mid-30s composites at best, end-to-end research still at 0 for every listed model, and two frontier stacks held out for bio-safeguard access."
sources:
  - title: "Science's Last Exam (AItonomy Foundation)"
    url: https://sciences-last-exam.org/
  - title: "Science's Last Exam leaderboard"
    url: https://sciences-last-exam.org/leaderboard
  - title: "GitHub: Gen-Verse/Science-Last-Exam"
    url: https://github.com/Gen-Verse/Science-Last-Exam
  - title: "Hugging Face: Gen-Verse/Science-Last-Exam (task cards)"
    url: https://huggingface.co/datasets/Gen-Verse/Science-Last-Exam
  - title: "Hugging Face: Gen-Verse/Science-Last-Exam-data"
    url: https://huggingface.co/datasets/Gen-Verse/Science-Last-Exam-data
  - title: "Hugging Face: Gen-Verse/Science-Last-Exam-reference (manual gate)"
    url: https://huggingface.co/datasets/Gen-Verse/Science-Last-Exam-reference
  - title: "AItonomy Foundation on X"
    url: https://x.com/aitonomyfound/status/2118372265842610618
  - title: "AI Tamer: OpenAI GPT-6 Rosalind research life-sciences model"
    url: https://aitamer.news/posts/openai-gpt-6-rosalind-research-life-sciences-model-api/
  - title: "AI Tamer: Claude science UV sky map"
    url: https://aitamer.news/posts/claude-science-uv-sky-map/
---

The [AItonomy Foundation](https://sciences-last-exam.org/) launched **Science's Last Exam (SLE)**, a benchmark aimed at whether AI agents can do scientific research work, not just answer exam questions. The public set lists **113 tasks across nine disciplines**, with six scored capability axes plus an end-to-end research assessment. Wet-lab execution is marked In construction and unscored; end-to-end research is marked To be expanded.

## Leaderboard snapshot

On the publisher board (published 4 November 2026; figures synced on the HF card as of 5 Nov):

- Best composite so far: **Claude Opus 5** with **Claude Code** at High effort, **37.50** / 100.
- **GPT-6.1 Sol** follows at **36.15**.
- **End-to-end research scores are 0 for all currently listed models** (a published result, not a fixed rule that zeros are permanent).
- **Claude Opus 5.5** and **GPT-6 Astra** are **N/A**: the site says provider-enforced biological safeguards can restrict biology research workflows; results wait on research access.

Attribute every number to AItonomy's leaderboard. Harness, effort and cost columns are the publisher's.

## What you can download today

Do not claim the whole project is open-sourced.

- **GitHub** [`Gen-Verse/Science-Last-Exam`](https://github.com/Gen-Verse/Science-Last-Exam) is public (README cites Apache-2.0 for software and CC-BY-4.0 for data).
- As of triage ~09:31 IST on 6 November 2026, Hugging Face marked the **task-card** and **data** datasets as not gated, and an unauthenticated fetch of `task_cards.parquet` succeeded. The **reference** dataset remains **manual-gated**.
- The Hugging Face dataset card text may still say "Release status: private preview" / permission required. Treat that wording as **stale relative to the download behaviour** checked at triage. Hidden reference assets stay outside the solver's environment on purpose.

## Why this matters

If you ship science or agent stacks, SLE is a rare end-to-end-shaped bench where today's best listed composites still sit in the mid-30s and nobody on the board clears the end-to-end axis. That is a useful brake on "models can already do research" marketing, including around life-science products such as [GPT-6 Rosalind](/posts/openai-gpt-6-rosalind-research-life-sciences-model-api/) or narrower science tooling such as [Claude's UV sky-map work](/posts/claude-science-uv-sky-map/). Builders who want to reproduce should start from the public GitHub harness plus the public task cards and data, then apply for reference access rather than assuming every asset is free to pull.
