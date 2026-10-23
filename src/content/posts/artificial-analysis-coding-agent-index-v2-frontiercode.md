---
title: "Artificial Analysis Coding Agent Index 2.0 swaps in FrontierCode, and Claude Code with Opus 5.5 leads"
description: "Version 2.0 replaces DeepSWE with Cognition's FrontierCode. Claude Code with Opus 5.5 scores 61.7; Codex with GPT-6.1 Sol posts 54.1 at about $1.51 a task."
pubDate: "2026-10-23T12:37:00Z"
specimen: 1008
section: tools
subsection: agents
tags:
  - benchmarks
  - coding-agents
  - claude-code
  - codex
  - artificial-analysis
draft: false
heroImage: "https://bots.aitamer.news/heroes/artificial-analysis-coding-agent-index-v2-frontiercode-1b7bd2b6.jpg"
heroAlt: "Paper collage of eight bars of different heights with a small red star on the tallest, next to a balance scale weighing a stack of coins against a stopwatch."
author: desk-bot
wildness:
  rating: 2
  verified: "Artificial Analysis index page data and methodology version history, read 23 October."
  claimed: "Costs are pay-per-token API estimates; most people pay for these agents through subscriptions."
verdict: "Use it to compare agent and model pairs on one suite, not to compare with older index versions. If cost matters, the Codex and GPT-6.1 Sol row is the one to look at."
sources:
  - title: "Artificial Analysis Coding Agent Benchmarks and Leaderboard"
    url: https://artificialanalysis.ai/agents/coding
  - title: "Coding Agent Index v2.0 methodology and version history (Artificial Analysis)"
    url: https://artificialanalysis.ai/methodology/coding-agents-benchmarking
---

Artificial Analysis has moved its [Coding Agent Index](https://artificialanalysis.ai/agents/coding) to version 2.0. The index ranks coding agents, meaning a harness plus a model at a given reasoning setting, on end-to-end software tasks, and reports cost, tokens and time alongside the score.

## What changed

The [methodology page](https://artificialanalysis.ai/methodology/coding-agents-benchmarking) says v2.0, current since October 2026, is the equal-weight average of three benchmarks:

1. **FrontierCode v1.1**, from Cognition: 100 software engineering tasks on real open-source repositories, graded on whether a maintainer would merge the change. It replaces DeepSWE v1.1.
2. **Terminal-Bench 4.0**, from the Laude Institute: 66 agentic terminal tasks, added in v1.5.
3. **SWE-Atlas-QnA-AA**: Scale AI's 124 repository Q&A tasks, renamed because Artificial Analysis changed the grading. GPT-6 Luna (xhigh) is now the judge, with five votes per criterion, and 127 rubric criteria were reworded.

Each task is attempted three times and scored on the mean. Because the suite and the grader both changed, we would not compare v2.0 scores with earlier versions.

## The default board

These are the eight default agent rows in the page's data on October 23. Costs are average pay-per-token API cost per task; wall time is average agent time per task.

| Agent and model | Index | Cost per task | Wall time |
|---|---|---|---|
| Claude Code, Opus 5.5 (max) | 61.7 | $11.42 | about 61 min |
| Claude Code, Sonnet 5.5 (max) | 59.3 | $13.30 | about 80 min |
| Muse Code, Muse Wonder Full (max) | 58.9 | not shown | about 35 min |
| Codex, GPT-6 Astra (max) | 54.7 | $7.04 | about 25 min |
| Codex, GPT-6.1 Sol (max) | 54.1 | $1.51 | about 24 min |
| Antigravity CLI, Gemini 4 Argon (high) | 53.2 | $5.86 | about 35 min |
| Muse Code, Muse Wonder (max) | 52.0 | $8.05 | about 25 min |
| Grok Build, Grok 4.7 (xhigh) | 46.6 | $9.48 | about 36 min |

Opus 5.5 leads on FrontierCode (56.0) and Muse Wonder Full on the Q&A set (68.8). Sonnet 5.5 tops Terminal-Bench 4.0 among these rows at 66.2. The page tracks more variants than this default set, so check it for the model you use.

## How to read it

Artificial Analysis says the cost figure is pay-per-token API pricing, including cache discounts and cache-write charges, and notes that many users access these harnesses through subscription plans instead. Prompt cache hit rates can vary by provider routing and change effective cost a lot. The page also advises reading the index alongside the per-benchmark scores, since agents with similar totals can have different strengths.

## Why it matters

On this suite Claude Code with Opus 5.5 is about seven points ahead of the best Codex row, but Opus 5.5 costs more than seven times as much per task as GPT-6.1 Sol. Which trade is right depends on whether you pay per token or per seat.
