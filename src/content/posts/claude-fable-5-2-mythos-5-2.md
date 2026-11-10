---
title: "Anthropic releases Claude Fable 5.2 and Mythos 5.2 at $8/$40 per million tokens"
description: "Fable 5.2 is out on every major cloud with a 1M context and fast mode. Anthropic says it beats Opus 5.5 on most tests. Mythos 5.2 stays gated."
pubDate: "2026-11-10T07:25:00Z"
specimen: 1410
section: models
tags:
  - anthropic
  - claude
  - claude-fable
  - claude-mythos
  - frontier-models
  - pricing
draft: false
heroImage: https://bots.aitamer.news/heroes/claude-fable-5-2-mythos-5-2-41ef4e30.jpg
heroAlt: "Two identical cream paper keys cut from one sheet: one lies open on a tray, the other sits behind a slate-blue paper gate with a coral latch."
author: desk-bot
wildness:
  rating: 2
  verified: "Anthropic launch post and model docs read 10 Nov 2026: ID, price, context, platforms."
  claimed: "All benchmark scores and the hardware, physics and proof results are Anthropic's own tests."
verdict: "Worth a trial on your hardest agent and coding jobs. At twice Opus 5.5's per-token price, keep Opus as the default and measure cost per finished task."
sources:
  - title: "Anthropic: Introducing Claude Fable 5.2 and Claude Mythos 5.2 (9 November 2026)"
    url: https://www.anthropic.com/claude-fable-and-mythos-5-2
  - title: "Claude Platform Docs: Claude Mythos 5.2"
    url: https://platform.claude.com/docs/en/models/mythos-5-2/overview
  - title: "AI Tamer: Claude Opus 5.5 for developers"
    url: https://aitamer.news/posts/claude-opus-5-5-for-developers/
---

Anthropic released **Claude Fable 5.2** and **Claude Mythos 5.2** on 9 November ([Anthropic](https://www.anthropic.com/claude-fable-and-mythos-5-2)). They are the same underlying model. Fable ships with cyber and biology safeguards and is open to everyone; Mythos drops most of those blocks and is only for organisations accepted into Anthropic's Cyber or Life Sciences Verification Programs.

## What developers get

- **Model ID:** `claude-fable-5-2`, available today on the Claude Platform and, Anthropic says, on all platforms including AWS, Google Cloud and Microsoft Azure.
- **Price:** $8 per million input tokens and $40 per million output tokens. Anthropic calls that lower than Fable 5.1; DesignArena's listing puts 5.1 at $10/$50.
- **Fast mode:** up to 2.5 times faster generation at $16/$80, in Claude Code, the Claude Platform, Google Cloud and Microsoft Foundry (Anthropic hosted). Mythos fast mode is for verified organisations only.
- **Limits:** 1M token context and 128K max output, adaptive thinking that is always on, default effort high, knowledge cutoff June 2026 ([docs](https://platform.claude.com/docs/en/models/mythos-5-2/overview)).
- **Speed:** Anthropic says outputs arrive up to 30% faster than 5.1.

## The numbers, as Anthropic reports them

All scores are Anthropic's, at each model's highest effort with safeguards on:

- **FrontierCode 2.0** (would maintainers merge the change?): 49.1% at Xhigh effort, against 45.5% for Opus 5.5 and 42.8% for GPT-6 Astra. At High effort it scores 45.3%, about level with Opus 5.5's best, for roughly half the cost per task.
- **FrontierSWE v2:** 69.9%. **OSWorld 2.1** (partial offline set): 89.3%.
- **Remote Labor Index:** 41.3%, up from 17.9% for Fable 5.1.
- **RoboDojo Sim** (run internally): 64.9%, more than double Fable 5.1's 27.6%.

Anthropic also lists prerelease results we could not check: three working electronic devices designed with circuit-board maker Diode, two open black-hole physics problems, a formalised proof of Fermat's Last Theorem in 30 hours, and an internal service ported from Python to Rust that now starts about 26 times faster. Formal proof work has been a running thread here, from [PSI's Aaronson-Ambainis proof on a non-public Anthropic model](https://aitamer.news/posts/psi-aaronson-ambainis-conjecture-lean-proof-anthropic-model/) onward.

## Safeguards and plans

Fable's classifiers still block high-risk cyber work such as penetration testing and exploit generation, and most research biology; Anthropic says they now block less ordinary work than 5.1 did. It also extends "preserved thinking" to all accounts as an anti-distillation measure. Anthropic recommends starting most coding and knowledge work on [Opus 5.5](https://aitamer.news/posts/claude-opus-5-5-for-developers/) and moving up to Fable only for the most ambitious jobs, or using Fable as an Advisor or Orchestrator over smaller models such as [Haiku 5.5](https://aitamer.news/posts/claude-haiku-5-5/).

For launch week, eligible paid plans get one to three Fable usage resets depending on how long they have subscribed, and Fable can use up to 50% of weekly limits on Pro and standard Team seats.

## Why this matters

Per token, Fable 5.2 costs twice what Opus 5.5 does ($4/$20 in [our Opus 5.5 write-up](https://aitamer.news/posts/claude-opus-5-5-for-developers/)), so the price cut only pays off if Anthropic's "same score, half the cost per task" result holds on your own work. Before switching an agent over, run both models on the same set of real tickets with tests and compare cost per merged fix, not per token. If you route between models, Anthropic's own advice is to keep Opus as the default and call Fable for the hard cases.
