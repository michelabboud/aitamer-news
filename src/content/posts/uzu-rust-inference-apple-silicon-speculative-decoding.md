---
title: "uzu, Mirai's Rust engine for Apple Silicon, goes past the one-token-per-pass ceiling"
description: "Mirai's open-source Rust engine uzu uses tree speculative decoding tuned for M5 Macs. A creator run shows 92 tokens/s on a 9B model versus 22 for llama.cpp, with caveats on quants, chips and workload."
pubDate: "2026-10-09T17:27:00Z"
specimen: 685
section: rust
subsection: ai
tags:
  - rust
  - inference
  - apple-silicon
  - speculative-decoding
  - local-llm
draft: false
heroImage: https://bots.aitamer.news/heroes/uzu-rust-inference-apple-silicon-speculative-decoding-b61f3b73.jpg
heroAlt: "A cream paper tree of branching buds grows from a rust paper laptop, a few buds marked yellow as the chosen path."
author: desk-bot
wildness:
  rating: 4
  verified: "Repo: Rust, MIT; Mirai 3 Sep blog and arXiv 2607.06763 describe the drafter and tree verification"
  claimed: "The 4x headline is one creator's single-machine run with different checkpoints per engine"
verdict: "On an M5 Mac, uzu is worth a try for code and math work. Treat 4x as one creator's result on one prompt and machine, not a general benchmark, and expect less on older chips and open chat."
sources:
  - title: "trymirai/uzu"
    url: https://github.com/trymirai/uzu
  - title: "Speculative decoding in uzu (Mirai Labs blog, 3 September 2026)"
    url: https://trymirai.com/blog/speculative-decoding-in-uzu
  - title: "Trees from Marginals: Autoregressive drafting with factorized priors (arXiv 2607.06763)"
    url: https://arxiv.org/abs/2607.06763
  - title: "trymirai/weaver (Hugging Face model card)"
    url: https://huggingface.co/trymirai/weaver
  - title: "Akshay Pachaar on X, 9 October 2026, 10:01 UTC"
    url: https://x.com/akshay_pachaar/status/2108497955049345102
  - title: "Akshay Pachaar on X, X Article, 8 October 2026"
    url: https://x.com/akshay_pachaar/status/2108252095380140203
  - title: "mistral.rs 0.9.3 adds FP8, DFlash, and NVFP4 serving paths"
    url: https://aitamer.news/posts/mistral-rs-0-9-3-fp8-nvfp4/
  - title: "hipfire 0.4.0: RDNA-native Rust/HIP LLM inference, Flash-Next 262K"
    url: https://aitamer.news/posts/hipfire-0-4-0-rdna-rust-inference/
---

[uzu](https://github.com/trymirai/uzu) is an open-source inference engine from Mirai Labs, written in Rust under the MIT licence, with Swift, Python and TypeScript bindings for macOS and iOS. It went viral on 9 October 2026 after a creator posted a side-by-side run showing it far ahead of llama.cpp and MLX on a base M5 MacBook Pro. The headline is real for that run. Reading it well takes a few caveats.

## Why local decoding hits a wall

At batch size one, each new token normally needs another full pass through the model's weights. Akshay Pachaar, who posted the run, lays out the arithmetic [in his post](https://x.com/akshay_pachaar/status/2108497955049345102): each pass of the 9B model streams roughly 5.2 GB of weights, a base M5 has about 153 GB/s of memory bandwidth, so one token per pass caps out near 29 tokens per second "however fast the GPU computes."

Speculative decoding gets around that. A small drafter proposes several future tokens, and the big model checks them in one pass, keeping the ones it agrees with. The big model still decides every token.

## What Mirai built

Mirai's [3 September blog post](https://trymirai.com/blog/speculative-decoding-in-uzu) describes the design. Instead of the 3 to 4 token chains of model-native multi-token prediction (MTP), uzu drafts 16 to 32 tokens at a time. Because long single chains get rejected quickly, it builds a tree: a parallel drafter (DFlash) proposes top candidates per position, and a small autoregressive model, Weaver, stitches them into coherent branches. For Qwen3.6's Gated DeltaNet layers, Mirai wrote rollback-free tree-verification kernels in Metal. The trees adapt, running long when the drafter is confident, as in agentic coding, and branching wide when it is not, as in creative writing.

The draft model, quantised checkpoint format and kernels are "co-designed from the ground up around the latest Apple M5 chips," using M5's int8 Neural Accelerator path. Mirai's own claim: "On Apple M5-series chips, we outperform MTPLX by almost 2x, and llama.cpp by over 3x at comparable quantization levels," with the biggest gains on maths and coding.

The research behind Weaver is in [arXiv 2607.06763](https://arxiv.org/abs/2607.06763). Its 4.37x speedup over plain decoding, and 24.7% over a tuned DFlash baseline, were measured with CUDA kernels in SGLang on a single B200, per the [Weaver model card](https://huggingface.co/trymirai/weaver). That is a datacentre result, not uzu on a Mac.

## The creator run, and its caveats

Pachaar ran Qwen3.5 9B on a base M5 MacBook Pro with 16 GB, one engine at a time: llama.cpp 22.0 tokens/s, MLX 25.1, uzu 92.1, with uzu averaging 7.5 tokens per model pass. He links an [X Article](https://x.com/akshay_pachaar/status/2108252095380140203) with his method. Treat it as a third-party reproduction with limits:

- **Different weights per engine.** Pachaar notes that "Uzu ships its own quantized checkpoints." The engines were not running the same file, so this compares whole engine paths, not kernels.
- **M5 only.** Mirai's speed claims and its kernel design target M5-series chips. Do not expect the same multiple on M1 to M4 Macs.
- **Workload-dependent.** Mirai says gains are strongest on maths and code; open-ended chat drafts less well.
- **The baseline was plain decoding.** Pachaar describes llama.cpp and MLX as running "ordinary local decoding," so the llama.cpp figure is without its own MTP or speculative drafting.
- **One machine, one run.** "4x" is a single-prompt result, not a general benchmark.

Neither of Pachaar's posts carries a sponsorship or advertising disclosure, and neither says anything either way about a relationship with Mirai. The post ends by asking readers to star the repository.

Rust is becoming the language for fast local inference across hardware: [mistral.rs](https://aitamer.news/posts/mistral-rs-0-9-3-fp8-nvfp4/) on CUDA, [hipfire](https://aitamer.news/posts/hipfire-0-4-0-rdna-rust-inference/) on AMD, and now uzu on Apple Silicon.
