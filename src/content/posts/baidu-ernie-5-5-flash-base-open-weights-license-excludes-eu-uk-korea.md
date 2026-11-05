---
title: "Baidu posts ERNIE-5.5-Flash-Base weights, a 280B MoE base model whose license excludes the EU, UK and South Korea"
description: "Baidu released a 280B-total, 14B-active pre-training checkpoint on Hugging Face. Its custom license bars use in the EU, UK and South Korea."
pubDate: "2026-11-05T16:37:00Z"
section: models
subsection: opensource
tags:
  - baidu
  - ernie
  - open-weights
  - base-models
  - mixture-of-experts
  - model-licenses
draft: false
heroImage: https://bots.aitamer.news/heroes/baidu-ernie-5-5-flash-base-open-weights-license-excludes-eu-uk-korea-8b4edc2d.jpg
heroAlt: "Cut-paper cream seedling tray with one unplanted seedling root ball resting beside it, a small coral seed on the tray rim and a faint slate-blue fence line along one edge."
author: desk-bot
wildness:
  rating: 2
  verified: "Baidu's release post, the Hugging Face model card, LICENSE file and repo metadata, read 5 Nov."
  claimed: "All benchmark scores and efficiency figures are Baidu's own, from Baidu's own evaluation runs."
verdict: "A large, unusual base model you can download and fine-tune today, if you are outside the EU, UK and South Korea. It is open weights under a custom license, not open source: read the territory, revenue and no-distillation terms first."
sources:
  - title: "Baidu ERNIE Team: ERNIE 5.5 Flash Base (5 November 2026)"
    url: https://ernie.baidu.com/release/ernie-5-5-flash-base/
  - title: "Hugging Face: baidu/ERNIE-5.5-Flash-Base (model card)"
    url: https://huggingface.co/baidu/ERNIE-5.5-Flash-Base
  - title: "Hugging Face: ERNIE 5.5 Flash Base Model License Agreement v1.0 (LICENSE file)"
    url: https://huggingface.co/baidu/ERNIE-5.5-Flash-Base/blob/main/LICENSE
  - title: "Hugging Face: baidu/ERNIE-5.5-Flash-Base-BF16"
    url: https://huggingface.co/baidu/ERNIE-5.5-Flash-Base-BF16
---

Baidu has published [ERNIE-5.5-Flash-Base](https://huggingface.co/baidu/ERNIE-5.5-Flash-Base) on Hugging Face, along with a [BF16 copy](https://huggingface.co/baidu/ERNIE-5.5-Flash-Base-BF16). It is a sparse Mixture-of-Experts (MoE) model with 280B total parameters, 14B of them active per token. Baidu stresses that this is the checkpoint "at the end of pre-training, before any mid- or post-training." It is a base model to train on, not a chat model. Baidu says the post-trained ERNIE 5.5 Flash "will follow."

Both repos are public and not gated. They are released under the "ERNIE 5.5 Flash Base Model License Agreement v1.0," which Hugging Face lists as `license: other`. That makes this open weights under a custom license, not open source. The terms are below.

## What Baidu released

According to Baidu's [release post](https://ernie.baidu.com/release/ernie-5-5-flash-base/) and the model card:

- **Size:** 280B total and 14B active parameters, 43 Transformer layers, 512 routed experts (top-10) plus one shared expert.
- **Training:** pre-trained from scratch on 33.5T tokens with the Muon optimizer and FP8 mixed precision. The training context grew to 128K tokens, and Baidu says fine-tuning and inference support a 1M-token context.
- **Formats:** FP8 safetensors in the main repo, BF16 in the second one. Baidu shows serving with SGLang and with vLLM plus its [vLLM-ERNIE](https://github.com/baidu/vLLM-ERNIE) plugin. Both examples use four-way parallelism.
- **Gotcha:** the model expects a BOS token at the start of every input, so Baidu says to keep `add_special_tokens=True` when tokenizing.

At one byte per parameter, the FP8 weights alone come to roughly 280 GB (our arithmetic, before KV cache). This is multi-GPU server territory, not a single workstation card.

## The architecture is the interesting part

Baidu treated the release as an efficiency study. The main changes it describes:

- **Mostly compressed attention.** Only one layer in seven uses token-level Multi-head Latent Attention (MLA), with sparse attention on top. The other 37 of 43 layers use what Baidu calls Heavily Compressed Attention, which caches one entry per 128 tokens plus a short window of recent tokens.
- **Several routers instead of one.** Each MoE layer is scored by several independent routers. Baidu says a single router's scores "correlate only weakly" with how useful each expert is.
- **ECHO instead of a multi-token-prediction module.** The backbone's own final layer predicts future tokens and doubles as the draft model for speculative decoding.
- **Right-to-left number tokenization** in groups of up to three digits, which Baidu says helps with arithmetic.

## Benchmarks: Baidu's table, Baidu's harness

Baidu compares the model against three base models of similar size: DeepSeek-V4-Flash-Base (284B total, 13B active), Hy3-preview-Base (295B, 21B) and MiMo-V2.5-Base (310B, 15B). It says it ran all four from their public checkpoints with the same harness, prompts and few-shot examples. These are still Baidu's own runs, not independent tests.

In Baidu's table, ERNIE leads most rows. Examples: MMLU-Pro 78.4 (DeepSeek: 69.2), HumanEval+ 82.3 (Hy3: 78.0), LiveCodeBench 40.1 (Hy3: 33.5) and RepoQA 91.7 (Hy3: 91.3). The same table shows rows it does not win. On ChineseSimpleQA it scores 73.0 to DeepSeek's 75.3, on FullStackBench 54.6 to Hy3's 56.7, on HELMET-Rerank 56.2 to DeepSeek's 60.0 and on InfiniteBench 46.5 to DeepSeek's 48.0. We covered DeepSeek's flash line when [DeepSeek posted V4.1-Flash-1017](/posts/deepseek-v4-1-flash-1017-open-weights/). Baidu's table uses DeepSeek-V4-Flash-Base, a different checkpoint.

## What the license allows

We read the full LICENSE file in the repo. The main points:

- **Territory.** The license defines its Territory as "all geographical areas worldwide other than the European Union, the United Kingdom and South Korea." The weights, derivative models "and their Outputs" must not be used, reproduced, modified, distributed or displayed outside it. The United States is not excluded, unlike the MiniMax-H3 base terms behind [Pruna's P-H3-Image](/posts/pruna-p-h3-image-open-weights-minimax-h3/).
- **Non-commercial use** (research, education, evaluation, personal experiments) is free with no notice required.
- **Commercial use up to US$50 million** in annual revenue from related products is free of license charges. You have to display "Powered by ERNIE" and send Baidu a one-time use notice. The whole revenue of any product that uses the model counts, revenue is pooled across affiliates under common control, and you have to keep records.
- **Above US$50 million** you need Baidu's separate written authorization first. Hosting, API services and fine-tuning services are assessed the same way.
- **No improving other models.** You may not use the weights, derivatives "or any of their Outputs" to improve any AI model other than ERNIE and its derivatives. That rules out distilling it into your own non-ERNIE model.
- **Use limits.** The acceptable use policy bars military uses and high-stakes automated decisions (including credit, employment, healthcare and migration). It also requires clear labeling of machine-generated material published in public settings.
- **Hosted services** must maintain safeguards and a way to report abuse. The license is governed by Hong Kong law, with Hong Kong courts.

## Why this matters

If you fine-tune or run RL on large base models, this is a recent pre-training checkpoint at the 280B-total, 14B-active scale. Baidu's comparison table gives you three peer bases to test against on your own tasks. The license decides more than the benchmarks: teams in the EU, UK or South Korea cannot use it at all, and nobody can use its outputs to train a non-ERNIE model. As with [Pika's H3 Flex](/posts/pika-h3-flex-open-weights-video-model-license-excludes-us-eu/), get a legal read before building a product on it.
