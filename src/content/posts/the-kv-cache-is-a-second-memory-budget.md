---
title: The KV Cache Is a Second Memory Budget
description: A model’s weights are only part of its memory needs. The attention cache grows with the conversation, and saving space can slow generation.
pubDate: "2026-10-07T00:00:00Z"
specimen: 335
section: models
tags:
  - inference
  - attention
  - memory
  - kv-cache
draft: false
heroImage: https://media.aitamer.news/heroes/the-kv-cache-is-a-second-memory-budget-58c31073.jpg
heroAlt: A model pulls blocks from one cabinet while a separate drawer fills with growing context cards.
author: ari
wildness:
  rating: 2
  verified: KV storage grows with retained tokens; offloading and quantization can reduce GPU use.
  claimed: Cache-aware sizing should be a standard check before setting a context limit.
verdict: Treat the KV cache as a separate, growing memory budget. Measure a realistic long request before choosing offloading, quantization, or a context limit.
sources:
  - title: How caching works — Hugging Face Transformers
    url: https://huggingface.co/docs/transformers/cache_explanation
  - title: Cache strategies — Hugging Face Transformers
    url: https://huggingface.co/docs/transformers/kv_cache
  - title: Llama 3.1 memory requirements — Hugging Face
    url: https://huggingface.co/blog/llama31
---

A model may fit in GPU memory when it loads, then run out of room while answering a long prompt. Its weights occupy one memory budget. Generation builds another: the key-value, or KV, cache. The cache saves work, but it takes space for the tokens the model must still attend to. [Hugging Face’s cache explanation](https://huggingface.co/docs/transformers/cache_explanation) describes how each attention layer stores those values as generation proceeds.

## What the cache keeps

An autoregressive model produces one token at a time. To produce the next one, its attention layers use information from earlier tokens. Without a cache, the model would calculate the earlier keys and values again at each step. A KV cache retains them so the next step can reuse them. Each attention layer has its own stored keys and values, and each new token adds to them. The prompt also contributes tokens: the cache can already be large before the first word of the answer appears. [Hugging Face explains the per-layer update](https://huggingface.co/docs/transformers/cache_explanation) and the reuse of earlier values.

The cache is working memory for this generation. It is separate from the model weights stored in GPU memory. Shrinking the weights therefore does not give a complete answer to how much memory a long conversation will need.

## Why a longer context takes more space

For a full-attention layer, the cache holds a key and a value for each retained token. Its size depends on the number of layers, the number and width of the key-value heads, the length of the retained sequence, the precision of the stored values, and the number of sequences being processed. The [tensor shapes in Hugging Face’s explanation](https://huggingface.co/docs/transformers/cache_explanation) show why the sequence-length dimension grows as tokens are added.

That gives a useful planning rule: with the other factors fixed, doubling the retained tokens roughly doubles the KV storage for full-attention layers. It is a rule for sizing, not a promise about total GPU use. Other allocations also need room. Some architectures use sliding-window or chunked attention, and their affected layers stop growing after reaching a set window or chunk size. [Hugging Face’s cache strategies guide](https://huggingface.co/docs/transformers/kv_cache) calls out that limit.

The scale can be surprising. In [Hugging Face’s Llama 3.1 memory estimates](https://huggingface.co/blog/llama31), the 8B model’s FP16 weights take about 16 GB. Its FP16 KV cache is estimated at 1.95 GB for 16,000 tokens and 15.62 GB for 128,000 tokens. Those are estimates for that model and precision, not universal cache sizes. They show why a long context can consume memory comparable to the weights.

## Moving the cache to CPU memory

Cache offloading makes GPU room by keeping most layers’ cached keys and values in CPU memory. During a forward pass, the current layer’s cache is on the GPU. The next layer’s cache is fetched ahead of time, and the current one is sent back after its attention calculation. [Hugging Face describes this flow](https://huggingface.co/docs/transformers/kv_cache) and recommends considering it when a small GPU runs out of memory.

The cost is movement. Keys and values must travel between CPU and GPU while generation runs. Hugging Face warns that throughput can fall, with the effect depending on the model, context length, generated length, and generation settings. Offloading also needs enough CPU memory to hold what leaves the GPU. It changes where the cache lives; it does not make the stored context disappear.

In Transformers, the documented dynamic option is `cache_implementation="offloaded"`; a static-cache variant is also available. Those names are useful when trying the library, but the choice is broader than a setting: trade some generation speed for GPU capacity, then measure whether the result is usable for the intended workload. [The cache strategies guide](https://huggingface.co/docs/transformers/kv_cache) documents both options.

## Storing the cache at lower precision

Quantization reduces the precision of cached keys and values so they need less space. This is a separate choice from quantizing model weights. A model with smaller weights can still build a large KV cache; cache quantization addresses that growing allocation. [Hugging Face’s cache guide](https://huggingface.co/docs/transformers/kv_cache) documents a quantized cache and its lower-precision backends.

Less cache memory does not guarantee faster answers. The guide warns that quantization can harm latency when the context is short and the unquantized cache already fits. Its advice is to balance memory use against latency. For a workload near the GPU’s memory limit, the saved space may enable a longer context. For a short exchange with ample memory, the extra processing may offer little benefit. Those outcomes need measurement on the model and hardware that will actually serve the request.

## What to do

1. **Size both budgets.** Record memory for the loaded weights and for the KV cache at the longest prompt and answer you intend to support. Include room for other GPU allocations. Use a model-specific estimate where available, then check it against a real run.
2. **Start with the normal cache.** Measure memory use and generation speed at short and long context lengths. The default dynamic cache grows as generation proceeds, so a short prompt alone cannot establish the long-context limit. [Hugging Face documents that behavior](https://huggingface.co/docs/transformers/kv_cache).
3. **If GPU memory is the limit, try one change at a time.** Compare CPU offloading and cache quantization against the same prompts, answer lengths, and generation settings. Record whether each run fits and how long it takes.
4. **Set a context limit from the result.** Choose the longest context that fits with acceptable speed and memory headroom. Recheck it when the model, precision, cache strategy, or number of simultaneous sequences changes.
