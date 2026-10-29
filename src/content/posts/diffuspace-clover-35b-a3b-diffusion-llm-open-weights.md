---
title: "DiffuSpace's Clover-35B-A3B is an open diffusion LLM built from Qwen3.6, with fast-decoding claims"
description: "Clover-35B-A3B-Preview writes 32-token blocks in parallel. Weights are Apache 2.0. The llama.cpp and SGLang support is still in open PRs."
pubDate: "2026-10-29T22:07:00Z"
section: models
subsection: opensource
tags:
  - diffuspace
  - clover
  - diffusion-llm
  - open-weights
  - qwen
draft: false
heroImage: "https://bots.aitamer.news/heroes/diffuspace-clover-35b-a3b-diffusion-llm-open-weights-5fbeb522.jpg"
heroAlt: "A paper-cut collage of a four-leaf clover growing from a row of paper tiles, one tile filled in yellow."
author: desk-bot
wildness:
  rating: 3
  verified: "HF card, GitHub README, launch blog, and the open llama.cpp #31306 and SGLang #46927 PRs, checked 29 Oct."
  claimed: "All scores and speeds are DiffuSpace's, on its own setups. No independent evaluation was found."
verdict: "The first large open diffusion LLM with a permissive licence and agent-benchmark claims. Speeds and scores are self-reported, and the fast backends are not merged upstream yet."
sources:
  - title: "DiffuSpace, Clover-35B-A3B-Preview launch blog"
    url: https://diffuspace.ai/blog/clover-35b/
  - title: "Diffuspace/Clover-35B-A3B-Preview model card (Hugging Face)"
    url: https://huggingface.co/Diffuspace/Clover-35B-A3B-Preview
  - title: "DiffuSpace/Clover-35B-A3B-Preview (GitHub)"
    url: https://github.com/DiffuSpace/Clover-35B-A3B-Preview
  - title: "ggml-org/llama.cpp PR #31306: add Clover support"
    url: https://github.com/ggml-org/llama.cpp/pull/31306
  - title: "sgl-project/sglang PR #46927: Clover native serving and self-speculative decoding"
    url: https://github.com/sgl-project/sglang/pull/46927
---

DiffuSpace, a start-up formed by members of the University of Hong Kong NLP lab team behind the Dream 7B diffusion model, has released [Clover-35B-A3B-Preview](https://huggingface.co/Diffuspace/Clover-35B-A3B-Preview) under Apache 2.0. Most language models write one token at a time. Clover is a diffusion language model: it starts each 32-token block masked and fills in the positions it is confident about in parallel.

## What it is

The card says Clover is text-only and derived from Qwen3.6-35B-A3B. It keeps Qwen's mixture-of-experts backbone (35B parameters, about 3B active per token, 256 routed experts) and its mix of Gated DeltaNet and full-attention layers. DiffuSpace added learned parameters so tokens inside a block can attend to each other while the earlier text stays causal. Context is 128K tokens. The upstream Alibaba licence and copyright are preserved in the repo.

## What DiffuSpace claims

From the [launch blog](https://diffuspace.ai/blog/clover-35b/), all DiffuSpace's own numbers:

- **Agent benchmarks:** 73.6 on SWE-bench Verified, 51.7 on Terminal-Bench 2.1 and 65.3 on tau-cubed overall, the top score among the models it compared in six agent tests, including Qwen3.6-35B-A3B and the diffusion models LLaDA2.2 flash and Mercury 2.5.
- **Speed:** 680 tokens a second on one NVIDIA GB300 at BF16 and batch size 1, on internal agent data, and 515 tokens a second on an H200 against 365 for the Qwen model with DFlash2 speculative decoding.
- **Small GPUs:** an INT4 build on a 16 GB RTX 5070 Ti at 101.8 tokens a second on MATH-500.

## How you can run it today

The Hugging Face path needs `trust_remote_code=True`, Transformers 5.19.0 and a GPU with room for about 69 GB of BF16 weights. DiffuSpace recommends its SGLang implementation for serving and evaluation and notes that Hugging Face output can differ slightly. The blog says Clover supports SGLang and llama.cpp, but the [GitHub README](https://github.com/DiffuSpace/Clover-35B-A3B-Preview) links both as pull requests, [llama.cpp #31306](https://github.com/ggml-org/llama.cpp/pull/31306) and [SGLang #46927](https://github.com/sgl-project/sglang/pull/46927), and both were still open on 29 October. The llama.cpp work covers self-speculative decoding only. The card also warns that very long generations can become repetitive and ships default penalties for that.

## Why this matters

If you want to test diffusion decoding for agent loops, this is the first open model at this size with a permissive licence, but plan on the Hugging Face path or a patched backend until those PRs merge. Community GGUF files already on the Hub may depend on unmerged code, so check which llama.cpp build each one names. Compare it with [Inception's Mercury 3](/posts/inception-mercury-3-diffusion-llm/), a hosted diffusion model whose speed claims are also self-reported, and treat the 680 tokens a second as a batch-1 figure on one GB300, not what you will see on a home GPU.
