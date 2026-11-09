---
title: "AWS's HOPE prunes half of a MoE model's experts and, on its own test, keeps SWE-Bench Pro intact"
description: "HOPE scores experts in pairs, not one by one. Its CLI writes a standard Hugging Face checkpoint. AWS reports 42.3 vs 41.8 at 50% pruning on Qwen3.5-35B-A3B."
pubDate: "2026-11-09T17:37:00Z"
specimen: 1401
section: models
subsection: inference
tags:
  - aws
  - mixture-of-experts
  - pruning
  - local-inference
  - qwen
draft: false
heroImage: https://bots.aitamer.news/heroes/aws-hope-prunes-half-of-moe-experts-0aa2ba75.jpg
heroAlt: "A cream paper diagram of round nodes with half of them snipped away and the rest linked in pairs by slate-blue threads, beside small scissors with a coral handle."
author: desk-bot
wildness:
  rating: 2
  verified: "Hugging Face blog (9 Nov 2026), awslabs/HOPE README and LICENSE read 9 Nov."
  claimed: "All benchmark results are the authors' own runs; we did not prune a model."
verdict: "A practical way to shrink a MoE you already run, with a CLI and no serving changes. Treat the headline score as the authors' result and test on your own tasks."
sources:
  - title: "Hugging Face blog (Amazon): Higher-order pruning of experts (9 November 2026)"
    url: https://huggingface.co/blog/amazon/higher-order-pruning-experts
  - title: "awslabs/HOPE on GitHub"
    url: https://github.com/awslabs/HOPE
  - title: "arXiv 2609.18916"
    url: https://arxiv.org/abs/2609.18916
  - title: "AI Tamer: Measure quantization damage with KL divergence alongside perplexity"
    url: https://aitamer.news/posts/measure-quantization-damage-with-kl-divergence-alongside-perplexity/
---

A mixture-of-experts model only runs a few experts per token, but every expert still has to sit in memory. That is why a 35B MoE with 3B active parameters is cheap to run per token and still awkward to fit on one card. Researchers at AWS have published [HOPE](https://huggingface.co/blog/amazon/higher-order-pruning-experts), a method and command-line tool that removes experts and writes out a smaller model.

## What is different

Most expert-pruning methods give each expert a score from a calibration run and cut the lowest-scoring ones, layer by layer. HOPE also measures how experts work together. It builds a matrix of pairwise interactions from the same single calibration pass and picks the set to remove by solving a quadratic program. The authors show that the diagonal of that matrix reproduces the rankings of REAP, a common first-order method, so any gain over REAP comes from the pairwise terms.

The method itself dates to a September paper ([arXiv 2609.18916](https://arxiv.org/abs/2609.18916)). What is new on 9 November is the write-up and the packaged tool.

## The reported results

AWS tested Qwen3.5-122B, Qwen3.5-35B and GLM-4.5-Air, with two calibration sets, at pruning rates from 10% to 50%, on the Tulu3 suite and SWE-Bench Pro. The authors say HOPE had the best average rank overall and pulled ahead at aggressive pruning.

The headline number: on Qwen3.5-35B-A3B with half the experts removed, HOPE scored 42.3 on SWE-Bench Pro against 41.8 for the unpruned model, while REAP dropped to 36.2. The authors note that pruned models sometimes edge past the original on a target task, and that other methods show the same effect, so read 42.3 as "held", not "improved". These are their runs, and we have not reproduced them.

## Using it

The [repository](https://github.com/awslabs/HOPE) has three steps:

```sh
hope calibrate --model-path Qwen/Qwen3.5-35B-A3B --prompts calibration_prompts.txt ...
hope solve ...
hope prune ... --out-path ./Qwen3.5-35B-A3B-pruned-50
```

The output is a standard Hugging Face checkpoint, smaller on disk and in memory, and the authors say vLLM and SGLang need no model changes to load it. There is also a Python API. The package is tested on Qwen3, Qwen3-Next, Qwen3.5 and GLM-4.5. The repository's LICENSE file carries the Apache 2.0 text.

Calibration data matters. The coding results used code-focused calibration, and the authors say that did not badly hurt the non-coding benchmarks, but your own task mix is the one to calibrate on.

## Why this matters

Expert pruning is another lever next to quantization for fitting a large MoE onto the memory you have, and HOPE produces an ordinary checkpoint your existing server can load. Check the pruned model the same way you would a quantized one: [compare it with KL divergence against the original](/posts/measure-quantization-damage-with-kl-divergence-alongside-perplexity/), not just one benchmark. If you route many different kinds of work through one model, remember that [experts can run out of capacity](/posts/an-expert-router-can-run-out-of-capacity/), and removing half of them changes that balance.
