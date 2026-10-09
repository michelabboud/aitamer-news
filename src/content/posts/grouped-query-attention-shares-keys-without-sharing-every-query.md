---
title: Grouped-Query Attention Shares Keys Without Sharing Every Query
description: Grouped-query attention gives several query heads one key-value head pair. That shrinks decoding caches, with speed and quality gains that depend on the model and workload.
pubDate: "2026-10-10T10:00:00Z"
specimen: 617
section: models
tags:
  - transformers
  - attention
  - inference
  - kv-cache
draft: false
heroImage: https://media.aitamer.news/heroes/grouped-query-attention-shares-keys-without-sharing-every-query-97396bce.jpg
heroAlt: Four distinct paper birds inspect two shared blue seedpods in one teal nest.
author: ari
wildness:
  rating: 1
  verified: The GQA paper defines grouped key-value sharing and reports T5 checkpoint uptraining results.
  claimed: Cache ratios are conditional arithmetic; no deployment speedup is claimed.
verdict: Size the key-value cache from groups and workload, then measure speed and task quality. The paper's favorable tradeoff is specific to its converted T5 models.
sources:
  - title: "GQA: Training Generalized Multi-Query Transformer Models from Multi-Head Checkpoints"
    url: https://arxiv.org/abs/2305.13245
---

A coding assistant serving several long repository prompts can run out of key-value cache capacity before it runs out of arithmetic capacity. Every generated token adds cached keys and values for later attention steps. Grouped-query attention (GQA) changes how many distinct key and value heads the decoder stores while retaining separate query heads.

In ordinary multi-head attention, each of `H` query heads has a corresponding key head and value head. Each query head computes its own scores against the keys from its partner head, then uses those scores to combine values. Multi-query attention keeps the multiple query heads but gives all of them one key head and one value head. The [GQA paper](https://arxiv.org/abs/2305.13245) places a configurable number `G` of key-value pairs between those endpoints: each group of query heads shares one key head and one value head. `G = H` recovers multi-head attention; `G = 1` recovers multi-query attention.

Consider a decoder layer with 32 query heads and eight key-value groups. Four query heads use each key-value pair. The query heads remain distinct: they have different query projections and can assign different attention weights to the same shared keys. The group shares what content can be represented in its keys and values. If head dimensions and storage precision are held fixed, this layer stores one quarter as many cached key and value elements per token as a 32-pair multi-head layer. A one-group design stores one thirty-second as many. These are cache-element ratios, not predictions of end-to-end latency.

For a single sequence in a conventional autoregressive decoder, a useful decoder self-attention cache estimate is `2 × layers × cached tokens × key-value groups × head dimension × bytes per element`. The factor of two counts keys and values. Multiply by concurrent sequences for a simple batch estimate, then account for the serving system's padding, paging, metadata, and other allocations. The estimate is a logical tensor size. Implementations that replicate key-value groups across devices can consume more physical memory, so inspect the serving topology before turning it into a capacity promise. This calculation can show why reducing `G` helps a long-context service admit more concurrent requests. It does not say how much faster prefill or generation will be: weight reads, attention kernels, batching, memory layout, and hardware bandwidth also matter.

The quality tradeoff comes from the same sharing. With fewer key-value heads, several query heads inspect a narrower set of key and value projections. Keeping query heads separate preserves multiple ways to ask for information, but the shared representations can limit what they find or retrieve. More groups recover representational freedom while increasing cache capacity and memory traffic. The best point depends on model width, head dimensions, task distribution, output length, and serving hardware.

The paper offers a conversion route for existing multi-head checkpoints. It averages the original key projection matrices within each proposed group and does the same for value projections, then continues pretraining so the model can adapt. In its T5 encoder-decoder experiments, an eight-group converted model came close to the original multi-head model on the paper's task averages while approaching multi-query inference time. That result is evidence for the tested checkpoints and setup. It is not a promise that changing a head-count flag in an arbitrary model will preserve quality, and conversion still has a training cost.

The architecture boundary matters. The authors applied GQA to decoder self-attention and cross-attention, leaving encoder self-attention unchanged. Their limitations state that the experiments did not evaluate decoder-only models or compare the converted large GQA model with one trained from scratch. A decoder-only coding assistant may have a different quality curve. The paper also notes that summarization scores do not capture the entire quality picture, especially when long generated sequences are involved. Claims about exact speedups or quality for another model need fresh measurements.

For a deployment choice, calculate the cache budget using the actual layer count, key-value group count, head dimension, precision, context length, and concurrency target. Then benchmark time to first token, tokens per second during generation, and peak memory with representative prompt and output lengths. Evaluate outputs on tasks where missed context is costly, such as preserving a repository constraint across a long patch or citing a fact from an early document section. If a smaller `G` improves capacity but fails those tasks, increase groups or reconsider the model. GQA buys a tunable cache tradeoff; the right setting is established by the workload.
