---
title: "OpenAI opens GPT-6 Rosalind to approved life sciences labs, at $15 and $75 per million tokens"
description: "GPT-6 Rosalind uses GPT-6 Astra's weights with biology safeguards and fewer dual-use refusals. Trusted access only; API for internal research."
pubDate: "2026-10-31T14:07:00Z"
section: models
tags:
  - openai
  - gpt-6
  - rosalind
  - life-sciences
  - trusted-access
  - pricing
draft: false
heroImage: https://bots.aitamer.news/heroes/openai-gpt-6-rosalind-research-life-sciences-model-api-2fc9e391.jpg
heroAlt: "A navy and teal paper double helix rising from an ivory flask inside an open ring of paper fence slats, with a yellow paper key in front, on sand and cream layers."
author: desk-bot
wildness:
  rating: 2
  verified: "OpenAI API changelog and pricing page, Help Center article and the Rosalind-6 system card addendum, 30-31 Oct."
  claimed: "Benchmark gains over Rosalind 5.5 are OpenAI's own, on its internal or rubric-scored life sciences sets."
verdict: "Only relevant if your organization already has or can win Rosalind Research approval. Everyone else keeps using general models."
sources:
  - title: "OpenAI API changelog"
    url: https://developers.openai.com/changelog
  - title: "OpenAI Help Center: GPT-Rosalind for life sciences research"
    url: https://help.openai.com/en/articles/20001193-gpt-rosalind-for-life-sciences-research
  - title: "OpenAI Deployment Safety Hub: GPT-Rosalind-6 System Card Addendum"
    url: https://deploymentsafety.openai.com/gpt-rosalind-6/cyber-boundaries
  - title: "OpenAI API pricing"
    url: https://developers.openai.com/api/docs/pricing
---

OpenAI's [API changelog](https://developers.openai.com/changelog) for 30 October lists a new model, `gpt-6-rosalind`, "bringing specialized biological reasoning with scientific tool use to complex life sciences research." It is the GPT-6 generation of the Rosalind family, which until now ran on GPT-5.5, and it is only for organizations approved through OpenAI's trusted-access program.

## What it is

The [system card addendum](https://deploymentsafety.openai.com/gpt-rosalind-6/cyber-boundaries) says GPT-Rosalind-6 "uses the same weights as GPT-6 Astra," with no added training data or extra post-training for this release. The difference is in deployment: it "has fewer refusals on dual-use biological queries" but still refuses requests for biological weaponization, and is wrapped in access controls, monitoring and contract terms. OpenAI treats it as High capability in the Biological and Chemical domain, below Critical, and as Critical in Cybersecurity on the strength of GPT-6 Astra's assessments.

OpenAI's own comparisons against GPT-Rosalind-5.5 at the highest reasoning budget tested:

- **MedChemBench v7** (99 problems): 49.6% against 28.9%.
- **GeneBench Pro v13** (129 problems): 37.7% against 16.7% single-attempt success, with a benchmark-specific setup that differs from production.
- **LifeSciBench Gold** (94 problems): 61.3% against 44.0%.

## Who can use it, and where

Per the [Help Center article](https://help.openai.com/en/articles/20001193-gpt-rosalind-for-life-sciences-research), GPT-6 Rosalind Research is rolling out to a limited set of approved Research organizations in Work and Codex, and in the API where separately approved. It is not in the Chat tab. Approval for the Discovery tier, which stays on the 5.5 model, does not include it. In Enterprise workspaces it starts in a two-week Admin Preview, off by default. API access covers internal research tools only, not customer-facing products, and GPT-Rosalind is not available through Amazon Bedrock. The [U.S. academic plan](/posts/openai-rosalind-academic-plan/) still includes no API access or credits.

## Price

The [API pricing page](https://developers.openai.com/api/docs/pricing) lists `gpt-6-rosalind` at $15 per million input tokens, $75 per million output and $1.50 for cached input, on short context. That is three times the $5 and $25 of the existing Rosalind Research and Discovery models, and 50% above the $10 and $50 the same page lists for GPT-6 Astra, which has the same weights.

## Why this matters

For approved teams the choice is now a price-for-capability trade: by OpenAI's numbers GPT-6 Rosalind scores 17 to 21 points above 5.5 on its three life sciences benchmarks, at three times the token price, so the old model stays the cheaper option for routine literature and data work. The premium over Astra buys the looser dual-use limits and the access review, not new weights. Combined with the [Orchestra Bio purchase](/posts/openai-acquires-orchestra-bio-rosalind/), OpenAI is building Rosalind into a gated product line rather than a model anyone can call.
