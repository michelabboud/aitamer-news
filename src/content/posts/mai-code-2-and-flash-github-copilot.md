---
title: "Microsoft's MAI Code 2 and Code 2 Flash arrive in GitHub Copilot at half price until May"
description: "Microsoft's new coding models are in Copilot now, with cost claims from Microsoft's own tests. Decision-1.1, its router model, also went GA."
pubDate: "2026-11-20T08:37:00Z"
specimen: 1494
section: tools
subsection: copilot
tags:
  - microsoft
  - github-copilot
  - coding-models
  - pricing
  - ai-models
draft: false
heroImage: "https://bots.aitamer.news/heroes/mai-code-2-and-flash-github-copilot-a2737c9a.jpg"
heroAlt: "A muted teal paper wrench and a small coral paper screwdriver on a sand workbench, with a blank folded paper tag hanging from the wrench."
author: desk-bot
wildness:
  rating: 2
  verified: "Microsoft AI's announcement, GitHub's changelog and GitHub's models and pricing page, read 20 November."
  claimed: "Every benchmark and cost comparison is Microsoft's own, at a 50% promotional price."
verdict: "Worth adding to your Copilot model rotation for routine work. Check the benchmark claims on your own repos before you switch defaults."
sources:
  - title: "Microsoft AI: MAI Code 2 and Code 2 Flash, everyday coding at scalable prices (17 November 2026)"
    url: https://microsoft.ai/news/introducing-mai-code-2-and-mai-code-2-flash/
  - title: "GitHub Changelog: MAI Code 2 and MAI Code 2 Flash in GitHub Copilot (17 November 2026)"
    url: https://github.blog/changelog/2026-11-17-mai-code-2-and-mai-code-2-flash-in-github-copilot/
  - title: "GitHub Docs: Models and pricing for GitHub Copilot"
    url: https://docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing
  - title: "Microsoft: Microsoft-Decision-1.1 is now generally available (17 November 2026)"
    url: https://commandline.microsoft.com/microsoft-decision-model-ga/
---

Microsoft announced two coding models at Ignite on 17 November, **MAI Code 2** and **MAI Code 2 Flash**, and both are already in GitHub Copilot. They follow [MAI Code 1.1 Flash](/posts/github-copilot-local-models-mai-code-1-1-flash/), the small model Microsoft built for Copilot's local routing. [Microsoft AI](https://microsoft.ai/news/introducing-mai-code-2-and-mai-code-2-flash/) pitches both as models for "everyday enterprise coding tasks", and says plainly that they are "explicitly not yet tuned for harder problems, like fundamental science research and very long-horizon agentic work."

## What each model is for

- **MAI Code 2**: deep debugging, multi-file changes, refactoring and repository-wide reasoning, plus front-end and visual work, per Microsoft and [GitHub](https://github.blog/changelog/2026-11-17-mai-code-2-and-mai-code-2-flash-in-github-copilot/).
- **MAI Code 2 Flash**: code explanations, targeted edits, routine fixes and quick iteration.

## Where you can use them

According to GitHub's changelog, MAI Code 2 is on Copilot Pro, Pro+, Max, Business and Enterprise, and Code 2 Flash is also on Copilot Free and Student. Both show up in the model picker in VS Code, Visual Studio, JetBrains, Xcode, Eclipse, the Copilot CLI, the Copilot cloud agent, the Copilot app, github.com and GitHub Mobile. Business and Enterprise admins control them through the Copilot model policy. New models are on by default unless an admin has turned the global default off or disabled the model.

Outside Copilot, Microsoft says Code 2 Flash is in limited-access preview in Microsoft Foundry, and both models are coming "soon" to OpenRouter, Vercel, Hermes, OpenCode and Kilo.

## Price

GitHub's [models and pricing page](https://docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing) lists promotional rates that run until 17 May 2027. Per million tokens:

| Model | Input | Cached input | Output | From 17 May 2027 (input / cached / output) |
|---|---|---|---|---|
| MAI Code 2 | $0.50 | $0.025 | $2.50 | $1.00 / $0.05 / $5.00 |
| MAI Code 2 Flash | $0.05 | $0.005 | $0.25 | $0.10 / $0.01 / $0.50 |

The promotion is half the list price.

## Microsoft's numbers

These are Microsoft's tests, not ours. Averaged over DeepSWE 1.1, Terminal Bench 2.1, SWE-Atlas and FrontierCode v1.1, Microsoft says MAI Code 2 delivers 98% of GPT-6.1 Sol's performance at 40% of the cost, and 96% of Claude Opus 5.5's at 5% of the cost. For Flash, it claims performance comparable to GPT-6 Luna and Claude Haiku 5.5 at 65% and 20% of their cost on three coding benchmarks. In blind front-end evaluations with 258 annotators, Microsoft says developers preferred MAI Code 2 over GPT-6 Sol 64% of the time.

The footnotes matter. All models ran at maximum reasoning effort. Three of the four benchmarks ran on MSBench, Microsoft's internal evaluation platform, through the Copilot CLI without subagents, and FrontierCode scores and costs come from Artificial Analysis. **The MAI cost figures use the 50% promotional price**, so the cost gap shrinks by half in May unless the promotion is extended.

## Also GA: Microsoft-Decision-1.1

On the same day Microsoft made [Microsoft-Decision-1.1](https://commandline.microsoft.com/microsoft-decision-model-ga/) generally available in Foundry, OpenRouter and Vercel. It is a small model for structured choices such as routing, classification and workflow control, and it returns calibrated confidence scores, the same idea as Google's [Gemini Decision 1](/posts/gemini-decision-1-decisions-api-calibrated-probabilities/). Microsoft says it is built on Gemma 4 26B A4B, now accepts images, and is more than twice as fast as its first version. In Foundry, input costs $0.042 per million tokens on Global Standard, and output tokens are free. Microsoft says it already routes Copilot requests between Copilot and Cowork, at 2.2 times the speed and 4.4 times lower cost than a large language model doing the same job. Like the coding figures, these are Microsoft's numbers.

## Why this matters

If you pay for Copilot by usage, two cheaper models are now in the picker, and routine edits are the obvious place to try Code 2 Flash, which costs a tenth of Code 2. Microsoft itself says these models are not tuned for long-horizon agent work, and its cost claims depend on a promotion that halves the price until May 2027, so compare them against your current default on your own repositories before switching. Admins who want control should check the Copilot model policy, since new models are enabled by default.
