---
title: "Nous Research releases Arete-27B, a Qwen3.8-27B fine-tune aimed at removing state-aligned answers"
description: "Nous fine-tuned Qwen3.8-27B on 52.8M tokens and says propaganda answers fell from 22% to 0.9%. Apache-2.0 weights, eval and data are public."
pubDate: "2026-11-07T20:07:00Z"
specimen: 1377
section: models
subsection: opensource
tags:
  - nous-research
  - qwen
  - open-weights
  - fine-tuning
  - evaluation
  - bias
draft: false
heroImage: https://bots.aitamer.news/heroes/nous-research-arete-27b-qwen-post-train-51ef5ce4.jpg
heroAlt: "Sharp cream paper mountain ridge between two valleys with a small chisel at its foot, one coral facet, faint slate-blue glaciers."
author: desk-bot
wildness:
  rating: 2
  verified: "Nous Arete post; HF model card (Apache-2.0, created 6 Nov), Propaganda_Eval and training data. Read 7 Nov."
  claimed: "Scores come from Nous's own eval with an LLM judge (Grok 4.7); no independent replication yet."
verdict: "A cheap, documented example of changing a model's political framing with plain supervised fine-tuning, with the eval released so anyone can check it. The results are Nous's own so far."
sources:
  - title: "Nous Research: Introducing Arete-27B"
    url: https://nousresearch.com/arete
  - title: "Hugging Face: NousResearch/Arete-27B"
    url: https://huggingface.co/NousResearch/Arete-27B
  - title: "Hugging Face dataset: NousResearch/Propaganda_Eval"
    url: https://huggingface.co/datasets/NousResearch/Propaganda_Eval
  - title: "Hugging Face dataset: NousResearch/arete-data-pairs"
    url: https://huggingface.co/datasets/NousResearch/arete-data-pairs
---

Nous Research has [released Arete-27B](https://nousresearch.com/arete), a fine-tune of Alibaba's open Qwen3.8-27B. Nous says it post-trained the model to remove refusals, deflections and answers framed the way the Chinese government frames sensitive topics, which it observed in the base model. The [weights](https://huggingface.co/NousResearch/Arete-27B) went up on Hugging Face on 6 November under Apache-2.0, alongside the [evaluation set](https://huggingface.co/datasets/NousResearch/Propaganda_Eval) and the [training data](https://huggingface.co/datasets/NousResearch/arete-data-pairs).

## How Nous measured it

Nous built an evaluation of 803 prompts in seven areas: freedom of expression, state ideology, state versus free market, education, data privacy and surveillance, democracy, and the environment. Each prompt comes with two to four required facts from a dated English-language source. An LLM judge, xAI's Grok 4.7, marks each fact as stated, missed or contradicted, and flags any answer that adopts the official line, quoting the phrase as evidence. The judge is not told which model answered. Nous says it tuned the rubric against 25 prompts it graded by hand and removed training prompts that overlapped the eval.

## What changed

On that eval, Nous reports the fact score rising from 2.32 to 2.98 out of 5 and answers with any propaganda falling from 22% to 0.9%, both at temperature 0 with thinking off. The largest shift was in freedom of expression, where the propaganda rate went from 60% to 1%. In the same table, GLM 5.3 scored 15% and DeepSeek V4.1 Flash 16%, while the Western models Nous tested sat between 0.3% and 0.6%.

Nous says general ability held. On its internal Hermes Bench, Arete scored 65.60% against 65.77% for the base model. On Terminal-Bench 2.1 it scored 70% against 67%, which Nous attributes to its own harness rather than an improvement.

## How it was trained

The method is ordinary supervised fine-tuning: about 52.8 million tokens over two epochs and 1,202 steps, with no reinforcement learning or preference tuning. The teacher answers came from Thinking Machines' open Inkling model, which Nous chose to avoid terms-of-use limits on distillation. Nous says it considered NVIDIA's Nemotron 3 Ultra as a teacher but found it also had "a checkered record on China-related topics", which it suspects came from training on Chinese open models.

## The caveats

Every number here comes from Nous's own benchmark and judge, and the topic list and the idea of "correct" framing are Nous's choices. Nous itself says it has not fixed every behaviour tied to the base model's viewpoint. Because the eval and judge prompt are public, others can now rerun it on this model or any other.

## Why this matters

If you deploy open-weight models from any lab, values and framing are a property you can measure and change, not a fixed trait: Nous moved them with about 50 million tokens of supervised data. Run a domain eval like this one on whatever model you ship, rather than trusting its origin either way. Nous has been building out its own models and business, as we covered when it [raised $90 million for Hermes](/posts/nous-research-90m-hermes-for-businesses/), and Qwen3.8 is already supported in local runtimes such as [mistral.rs](/posts/mistral-rs-qwen3-8-flash-next/).
