---
title: "Artificial Analysis Intelligence Index v5 moves to mostly private tests, and the open-weights gap grows"
description: "Index v5 puts 60% of its weight on private or held-out tests. Claude Opus 5.5 led at launch with 58; the best open-weights model trailed by 12."
pubDate: "2026-10-28T21:37:00Z"
section: models
tags:
  - artificial-analysis
  - benchmarks
  - claude
  - gpt-6
  - open-weights
  - agents
draft: false
heroImage: "https://bots.aitamer.news/heroes/artificial-analysis-intelligence-index-v5-private-test-sets-b3014fb5.jpg"
heroAlt: "A paper-cut collage of uneven bar columns mostly wrapped in closed envelopes beside a small scale weighing a coin against pages."
author: desk-bot
wildness:
  rating: 2
  verified: "Artificial Analysis's v5 announcement and methodology page, 27 October 2026."
  claimed: "All scores are Artificial Analysis's launch-day figures and can move as models are added or re-run."
verdict: "Use v5 to compare current frontier models, but read the effort setting and cost per task next to each score. Private tests cut contamination and also mean you cannot rerun them."
sources:
  - title: "Artificial Analysis: Announcing Artificial Analysis Intelligence Index v5"
    url: https://artificialanalysis.ai/articles/artificial-analysis-intelligence-index-v5
  - title: "Artificial Analysis: Intelligence benchmarking methodology"
    url: https://artificialanalysis.ai/methodology/intelligence-benchmarking
  - title: "Artificial Analysis: LLM leaderboard (read 28 October 2026)"
    url: https://artificialanalysis.ai/leaderboards/models
---

Artificial Analysis has released [Intelligence Index v5](https://artificialanalysis.ai/articles/artificial-analysis-intelligence-index-v5), the biggest change to its composite model score since v4 in January. For the first time, most of the Index, 60% by weight, comes from evaluations with private test sets or held-out answers.

## What changed

- **New:** Cognition's FrontierCode 2.0, 132 private tasks in real open-source repositories, graded on whether a maintainer would merge the change, and Terminal-Bench-Science, 70 scientific research tasks run in a terminal.
- **Upgraded:** HLE-Diamond, a refined 1,000-question version of Humanity's Last Exam, replaces the original; AA-Omniscience moves to v1.1; CritPt v2 is scored on a private 40-question hard subset.
- **Kept:** AA-Briefcase, AutomationBench-AA, GDP.pdf and Terminal-Bench 4.0.
- **Removed:** GDPval-AA v2.1, SciCode and AA-LCR v1.1.

The Index now splits evenly into four 25% blocks: knowledge work, coding, science and general.

## Launch-day scores

At launch, Claude Opus 5.5 (max) led at 58, ahead of GPT-6 Astra (max) at 57 and GPT-6.1 Sol (max) at 55. Anthropic and OpenAI hold the top five places, and Gemini 4 Argon (high) is next at 50. No single model leads all nine evaluations: Opus 5.5 tops three, including FrontierCode 2.0 at 46%, and GPT-6 Astra leads Terminal-Bench-Science at 63%.

**Since launch:** Google's Gemini 4 Carbon, announced on 28 October, has entered the [leaderboard](https://artificialanalysis.ai/leaderboards/models) at 59, one point above Opus 5.5 (max), per Artificial Analysis on 28 October.

The open-weights gap widened from 3 points in v4.3 to 12. The best open-weights entry is Kimi K3.1 Pro at 46, but Artificial Analysis notes its weights are not yet released ([we covered the 4 November promise](/posts/kimi-k3-1-pro-open-weights-by-nov-4/)). Among models you can download today, DeepSeek V4.1 Flash 1017 (max) and GLM-5.3 (max) lead at 32, below Claude Haiku 5.5 (max) at 36.

## Cost and effort now matter more

Among the ten highest-scoring models, cost per Index task ranges from $0.96 for GPT-6.1 Terra (max) to $13.04 for Claude Fable 5.1 (max). Opus 5.5 (max) costs $10.04 a task, GPT-6 Astra (max) $6.24 and GPT-6.1 Sol (max) $1.27, so Sol lands within 4 points of the leader at about an eighth of the cost.

Effort settings swing results more than before. Opus 5.5 scores 35 at low effort and 58 at max, for $0.98 versus $10.04 a task. GPT-6.1 Sol's spread doubled from 10 to 20 points.

The tests are also heavier. The median model now writes 59,000 output tokens per Index task, up from 35,000. The agentic evaluations carry 55% of the weight but use about 90% of the output tokens, and Terminal-Bench-Science alone takes about a third.

## Why it matters

Private tests make it harder for a model to have seen the answers in training, which has been the standing complaint about public benchmarks. The trade-off, in our reading, is that outsiders cannot rerun those tasks to check a score. Artificial Analysis did publish a public subset of AA-Omniscience v1.1.

Alongside v5, it launched Progress Index v1, which places language models released since November 2022 on one scale to track capability over time. Its earlier [Coding Agent Index 2.0](/posts/artificial-analysis-coding-agent-index-v2-frontiercode/) already used FrontierCode.
