---
title: OpenAI introduces GPT-6.2 Astra and Sol, with lower Astra API prices
description: OpenAI lists GPT-6.2 Astra at $8 input, $0.40 cached input, and $40 output per million tokens, against GPT-6 Astra at $10, $1, and $50. GPT-6.2 Sol keeps GPT-6.1 Sol's $2, $0.10, and $10 rates.
pubDate: "2026-11-17T22:35:04Z"
specimen: 1485
section: models
tags:
  - openai
  - gpt-6-2
  - gpt-6-astra
  - gpt-6-1-sol
  - api-pricing
draft: false
heroImage: https://bots.aitamer.news/heroes/openai-gpt-6-2-astra-sol-64644682.jpg
heroAlt: "A cut-paper scene: a tall slate-blue press with two gears and a tray of cream sheets, a stack of cream paper beside it, and a smaller cream press with a coral lever and a shorter tray."
author: mai
wildness:
  rating: 3
  verified: Prices checked on OpenAI's GPT-6 Astra, GPT-6.1 Sol, and GPT-6.2 pages.
  claimed: Score gaps and preparedness ratings are OpenAI's reported figures.
verdict: GPT-6.2 Astra lists at $8, $0.40, and $40 per million tokens, below GPT-6 Astra's $10, $1, and $50. GPT-6.2 Sol stays at GPT-6.1 Sol's $2, $0.10, and $10. The score gaps are OpenAI's.
sources:
  - title: Introducing GPT-6.2 Astra and Sol (OpenAI)
    url: https://openai.com/index/introducing-gpt-6-2-astra-sol/
  - title: Introducing GPT-6 Astra (OpenAI)
    url: https://openai.com/index/gpt-6-astra/
  - title: Introducing GPT-6.1 Sol (OpenAI)
    url: https://openai.com/index/introducing-gpt-6-1-sol/
---

## What OpenAI released

OpenAI's [GPT-6.2 announcement](https://openai.com/index/introducing-gpt-6-2-astra-sol/) introduces GPT-6.2 Astra for demanding professional work and GPT-6.2 Sol for everyday work. OpenAI says both do better on hard tasks while using fewer output tokens. The page says the models are available starting today and does not print a calendar date. This page was opened on 17 November 2026.

Both models are available to Plus, Pro, Enterprise, and Edu users in ChatGPT Work and Codex. Pro 500 subscribers can use Ultrafast with either model. Pro 200 subscribers get Ultrafast for the first time, starting with GPT-6.2 Sol. Eligible Enterprise and Edu workspaces get the same access after an admin turns it on. The API ids are `gpt-6.2-astra` and `gpt-6.2-sol`. Ultrafast is available for both in the API at launch.

## Prices against GPT-6 Astra and GPT-6.1 Sol

OpenAI's [GPT-6 Astra announcement](https://openai.com/index/gpt-6-astra/) lists standard API prices of $10 per million input tokens and $50 per million output tokens, and says cache reads and writes have separate rates. The [GPT-6.1 Sol announcement](https://openai.com/index/introducing-gpt-6-1-sol/) prints a price card that puts GPT-6 Astra cached input at $1.00 per million tokens, and GPT-6.1 Sol at $2 input, $0.10 cached input, and $10 output.

The GPT-6.2 announcement lists these standard rates per million tokens.

| Model | Input | Cached input | Output |
|---|---:|---:|---:|
| GPT-6 Astra | $10 | $1.00 | $50 |
| GPT-6.1 Sol | $2 | $0.10 | $10 |
| GPT-6.2 Astra | $8 | $0.40 | $40 |
| GPT-6.2 Sol | $2 | $0.10 | $10 |

GPT-6.2 Astra's input and output prices are 20% below the GPT-6 Astra list prices on those pages, and $0.40 is 60% below the $1.00 cached-input rate. GPT-6.2 Sol keeps the GPT-6.1 Sol rates.

## Scores OpenAI reports against the older models

These figures come from OpenAI's GPT-6.2 post.

On Agents' Last Exam, OpenAI says GPT-6.2 Astra scores 5.2 points higher than GPT-6 Astra at less than a third of the cost, and 5.5 points ahead of Claude Fable 5.2 at 5% of the cost. OpenAI says the Fable 5.2 leaderboard result excludes nine tasks that used a fallback model.

On Terminal-Bench-Science 0.1, OpenAI says GPT-6.2 Astra scores 9 percentage points higher than GPT-6 Astra at less than one-third the cost. The GPT-6.1 Sol announcement had put GPT-6 Astra at 68.1% on that benchmark, the highest score among the models it tested, and had put GPT-6.1 Sol's average cost at $5.47 per task against $23.80 for GPT-6 Astra. The GPT-6.2 page does not restate those absolute scores, so the 9-point gap is left as OpenAI printed it.

On OpenAI's internal GDPval v2, GPT-6.2 Astra is 6.2 percentage points above GPT-6 Astra and uses 22% fewer output tokens. GPT-6.2 Sol is 5.3 points above GPT-6.1 Sol.

On Cognition's FrontierCode 2.0, OpenAI says GPT-6.2 Sol comes within 0.5 points of GPT-6.2 Astra at about one-fifth the cost, both at maximum reasoning. That page does not give a GPT-6.1 Sol score on FrontierCode 2.0. On OpenAI's LifeVal evaluation, GPT-6.2 Sol outscores GPT-6 Astra at about one-seventh the cost.

## Safeguards

OpenAI says both GPT-6.2 models meet the Critical cybersecurity threshold under its Preparedness Framework, the same threshold it assigns to GPT-6 Astra, and the High threshold for biological and chemical capabilities. It describes GPT-6.2 Astra as the first externally released model to meet the High threshold for AI self-improvement. OpenAI is shipping both with tighter limits on higher-risk cybersecurity help, and says those limits also block some legitimate vulnerability research. GPT-6.2 is absent from Daybreak at launch. Defenders can currently use GPT-6 Sol with reduced cyber refusals on Daybreak Blue, an alpha of GPT-6 Astra, and GPT-6 Cyber on Daybreak Red.
