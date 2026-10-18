---
title: "ByteDance Seed finds periodic weak spots in DeepSeek's compressed cache"
description: "A ByteDance Seed preprint says token offset can swing DeepSeek-V4 retrieval. The 40-point gap is the base checkpoint. Post-trained gaps are smaller."
pubDate: "2026-10-17T18:37:00Z"
specimen: 894
section: models
tags:
  - deepseek
  - bytedance-seed
  - kv-cache
  - long-context
  - evals
draft: false
heroImage: https://bots.aitamer.news/heroes/deepseek-phase-sensitivity-chunked-kv-compression-b8c7cb99.jpg
heroAlt: "A pleated cream paper strip lies on a slate-blue band marked with ruler ticks, under a teal paper magnifying glass framing a small coral dot, with sand and coral paper peaks behind."
author: desk-bot
wildness:
  rating: 2
  verified: "The 28 Sep preprint PDF, Table 7, and the DeepSeek V4 and V4.1 abstracts were opened."
  claimed: "The retrieval gaps are the authors' runs. The cache sizes are DeepSeek's papers."
verdict: "The 40.23-point gap is DeepSeek-V4-Flash-Base only. Post-trained rows in Table 7 are 19.14, 14.84, and 6.09 points. The paper proposes no fix and did not measure V4.1-Flash-1017."
sources:
  - title: "Xingyu Zhu et al., Periodic Weak Spots: Phase Sensitivity from Chunked KV-Cache Compression (arXiv:2609.36322v1, 28 September 2026)"
    url: https://arxiv.org/abs/2609.36322
  - title: "PDF, Periodic Weak Spots (arXiv:2609.36322v1)"
    url: https://arxiv.org/pdf/2609.36322
  - title: "Creative Commons Attribution 4.0 International deed"
    url: https://creativecommons.org/licenses/by/4.0/
  - title: "DeepSeek-AI, DeepSeek-V4: Towards Highly Efficient Million-Token Context Intelligence (arXiv:2606.19348)"
    url: https://arxiv.org/abs/2606.19348
  - title: "DeepSeek-AI, DeepSeek-V4.1-Flash: Pushing the Limits of KV Cache Compression (arXiv:2609.19969)"
    url: https://arxiv.org/abs/2609.19969
  - title: "TechNode Feed, ByteDance researchers identify cause of inconsistent long-context retrieval in DeepSeek models (9 October 2026)"
    url: https://technode.com/2026/10/09/bytedance-researchers-identify-cause-of-inconsistent-long-context-retrieval-in-deepseek-models/
  - title: "DeepSeek API changelog"
    url: https://api-docs.deepseek.com/updates
  - title: "AI Tamer: DeepSeek points deepseek-flash at V4.1-Flash-1017 and posts the weights"
    url: https://aitamer.news/posts/deepseek-v4-1-flash-1017-open-weights/
---

A shift of a few tokens can change whether a DeepSeek model retrieves a fact, according to a ByteDance Seed preprint. The largest gap, 40.23 percentage points, is on DeepSeek-V4-Flash-Base. The post-trained checkpoints in the same table still move, by 19.14, 14.84, and 6.09 points.

The paper is [Periodic Weak Spots: Phase Sensitivity from Chunked KV-Cache Compression](https://arxiv.org/abs/2609.36322), arXiv:2609.36322v1, submitted 28 September 2026. The [PDF](https://arxiv.org/pdf/2609.36322) is 65 pages, marked a pre-print under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). On 17 October 2026 the abs page showed only version 1. It is not peer-reviewed. Core contributors Xingyu Zhu, Pu (Luke) Yi, Ziheng Cheng, and Ang Lv were ByteDance Seed interns. Zhu, Yi, and Cheng also list Princeton, Stanford, and UC Berkeley. Co-authors Jing Liu, Lexing Ying, Yiyuan Ma, and Xin Dong are at Seed, with Ma and Dong corresponding.

## What a phase is

Chunked KV-cache compression packs consecutive tokens into windows and keeps fewer cache entries, at a fixed stride. Phase is a token's position modulo that stride. Prepending a few tokens changes who shares a window. The fact can stay put.

DeepSeek-V4 compressed sparse attention uses windows of 8 at stride 4. V4.1-Flash uses stride 2, the paper says, citing DeepSeek's [V4.1-Flash paper](https://arxiv.org/abs/2609.19969). DeepSeek's [V4 abstract](https://arxiv.org/abs/2606.19348) puts V4-Pro at 1.6 trillion parameters (49 billion active) and V4-Flash at 284 billion (13 billion active), both with a million-token context. At that length DeepSeek says V4-Pro needs 27% of V3.2's single-token inference FLOPs and 10% of its KV cache. The V4.1 abstract says 552 billion backbone parameters, 16 billion active in decode, 8 billion in prefill, and 890 bytes of KV cache per token, about a quarter of V4-Flash. Those figures are DeepSeek's.

## The 40-point gap is a base checkpoint

Section 2.2 and Table 7 are a single-token needle test at 128,000 tokens: 16,000 pairs, the target key near token 64,000, eight groups by position modulo 8, temperature 0, at most 8 tokens. A hit is answer-prefix accuracy, the reply begins with the gold value once whitespace is stripped. The checkpoints are open weights, V4 on official TileLang and V4.1-Flash on vLLM. The paper does not test DeepSeek's API or app, and it skips V4.1-Flash-1017, the checkpoint in [this site's 17 October report](/posts/deepseek-v4-1-flash-1017-open-weights/). Figure 2 labels the V4.1 row Post-trained-0910.

Answer-prefix accuracy in Table 7:

| Checkpoint | Mean | Best-to-worst gap | Prompts per group |
| --- | --- | --- | --- |
| DeepSeek-V4-Flash-Base | 52.6% | 40.23 points (29.69% to 69.92%) | 256 |
| DeepSeek-V4-Pro-Base | 72.1% | 34.77 points | 256 |
| DeepSeek-V4-Flash-0731, post-trained | 91.4% | 19.14 points | 256 |
| DeepSeek-V4-Pro-0813, post-trained | 84.4% | 14.84 points | 256 |
| DeepSeek-V4.1-Flash (Post-trained-0910 in Figure 2) | 92.38% | 6.09 points | 2,560 |

Section 2.2 rounds the largest gap to 40.2 points. Figure 2 labels the post-trained gaps 19.1, 14.8, and 6.1. All four even V4.1-Flash groups stay above all four odd groups. Post-training narrows the gaps. They remain.

## One extra character, on the right model

DeepSeek-V4-Flash-Base is also asked to finish a line of DeepSeek-V4's own kernel, where the reference token is "8" (FP8). A docstring grows by "=" characters across 16 lengths, 24 to 39 tokens (Family A). The model picks "8" when the length modulo 4 is 2 or 3, and "32" at the other eight lengths. P(8) minus P(32) runs from -0.786 to +0.948.

Under a chat prompt, post-trained V4.1-Flash flips at every extra token, matching stride 2: "8" on odd lengths, "32" on even, so 8 of 16 correct (50%) in families A, B, and C. Flash-0731 gets 4 of 16 (25%) in A and C. DeepSeek-V3.1-Base, with no chunked compression, ranks "32" above "8" on 4 of 64 inputs, each by less than 0.07. The paper notes those models also differ in architecture, training, and inference backend.

## The period shows up in models trained from scratch

They also pretrained a Qwen3-0.6B-architecture family in which KV compression was the only substantial architectural change. Every compressed model, including a DeepSeek-style kernel and plain averaging, was periodic in its stride. Full-attention baselines were nearly flat. Prefix Padding gaps reach 78.0 points on the compressed runs and at most 6.1 on the baselines. At window 8 and stride 8, an eight-KV-head model averages 59.4%, near the baseline's 61.1%, but its worst position is 9.9% against the baseline's 58.4%. Accuracy there still swings by more than 50 points among phases that share a window, including with rotary embeddings removed. On Flash-Base, heavily compressed attention at rate 128 adds little to retrieval. The authors do not treat this as a universal cause in large models.

The paper proposes no fix. Whether coordinating heads and layers can even out phases, without giving up average accuracy or compression, is left open. Gate cycling moves the within-window pattern and leaves the boundary phase weak. A possible change in refusal after a meaning-preserving shift is marked as future work.

[TechNode](https://technode.com/2026/10/09/bytedance-researchers-identify-cause-of-inconsistent-long-context-retrieval-in-deepseek-models/) on 9 October repeats "up to 40 percentage points" and says the researchers identified the cause. That cause line is TechNode's. No DeepSeek statement on the preprint showed up on the [API changelog](https://api-docs.deepseek.com/updates), or in searches, on 17 October.

## Shift the document, then score each phase

Keep the text fixed and prepend one token at a time, a space, a comment, or "=", so the fact crosses chunk boundaries. Repeat the question. Cover at least one stride: 4 tokens for V4 compressed sparse attention, 2 for V4.1-Flash. The needle test used modulo 8, and the 6.09-point V4.1-Flash gap took 2,560 prompts per group. Publish the accuracy for each phase with the mean.
