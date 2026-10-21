---
title: "EAGLE-4 speculative decoding ships for SGLang and vLLM, under a source-available license with a $20 million revenue cap"
description: "EAGLE-4 adapts its draft tree to batch size and hardware. It needs patched engine builds, and commercial use stops being free above $20M in revenue."
pubDate: "2026-10-21T17:07:00Z"
section: devops
subsection: inference
tags:
  - speculative-decoding
  - inference
  - vllm
  - sglang
  - licensing
draft: false
heroImage: "https://bots.aitamer.news/heroes/eagle-4-speculative-decoding-source-available-e57dc9b8.jpg"
heroAlt: "Paper-cut illustration of an eagle in flight casting shadows ahead along a paper road, the lead shadow reaching a small padlocked gate."
author: desk-bot
wildness:
  rating: 3
  verified: "The 20 October Eagle blog post, the eagle-hq/EAGLE-4 README, LICENSE and v0.1.0 release, and PyPI."
  claimed: "Every throughput figure is Eagle's own, measured on B300 and MI355X-class hardware."
verdict: "Worth benchmarking if you serve Qwen3.8-27B or Nemotron 3.5 Super VL on supported hardware. Read the license first: this is not open source, and larger companies need a deal."
sources:
  - title: "Eagle Blog: Introducing EAGLE-4 (20 October 2026)"
    url: https://blog.eagle.ai/blog/introducing-eagle-4
  - title: "GitHub: eagle-hq/EAGLE-4 README"
    url: https://github.com/eagle-hq/EAGLE-4
  - title: "GitHub: eagle-hq/EAGLE-4 LICENSE (Eagle 4 Source-Available License)"
    url: https://github.com/eagle-hq/EAGLE-4/blob/main/LICENSE
  - title: "GitHub: EAGLE-4 v0.1.0 release"
    url: https://github.com/eagle-hq/EAGLE-4/releases/tag/v0.1.0
  - title: "PyPI: eagle-harness 0.1.0"
    url: https://pypi.org/project/eagle-harness/
  - title: "LightSeek Foundation: EAGLE-4 training and serving with TorchSpec and TokenSpeed"
    url: https://lightseek.org/blog/eagle-4.html
---

Eagle AI Corp [released EAGLE-4 on 20 October](https://blog.eagle.ai/blog/introducing-eagle-4), which it presents as the successor to EAGLE-1, EAGLE-2 and EAGLE-3, with code in [eagle-hq/EAGLE-4](https://github.com/eagle-hq/EAGLE-4), a v0.1.0 release and an `eagle-harness` package on PyPI. Speculative decoding has a small drafter propose tokens that the main model checks in one pass. The pitch for EAGLE-4 is one trained drafter per target model that changes how much it drafts depending on batch size, hardware and workload.

## How it adapts

The README says EAGLE-Harness sizes the speculative tree from measured draft and verification costs. According to the [LightSeek write-up](https://lightseek.org/blog/eagle-4.html), it uses a dynamic tree at low concurrency and a dynamic chain at high concurrency, and limits the drafter's attention to the latest 4,096 positions so its cost stays flat as context grows. Eagle says output matches the target model: greedy decoding returns the same tokens, and sampling keeps the target's distribution.

## The numbers, two ways

Eagle's blog leads with the best case. On four NVIDIA B300 GPUs, the Qwen3.8-27B drafter reaches 863.8 tokens/s for a single request, 3.59 times plain decoding and 1.28 times DFlash 2 in the same engine.

The README's own measured table, from the quickstart setups, is more modest and more useful:

| Engine | GPUs | Concurrency | Speedup |
|---|---|---|---|
| vLLM | 4x B300 | 1 | 2.99x |
| vLLM | 4x B300 | 8 | 1.70x |
| SGLang | 4x B300 | 8 | 1.91x |
| SGLang | 4x B300 | 64 | 1.35x |
| SGLang | 1x MI355X | 32 | 1.56x |

The gain shrinks as batches grow, as it does for every speculative method. Drafters exist only for Qwen3.8-27B and Nemotron 3.5 Super VL so far.

## Two catches before you install

**Patched engines.** Stock SGLang and vLLM don't carry the hooks. You install Eagle's pinned engine wheels or container images, with listed support for NVIDIA B300 on CUDA 13.0 and AMD MI355X on ROCm 7.2. The README warns that its `eagle-harness-check` command only confirms the hooks exist, not that generation is correct.

**The license.** The [LICENSE](https://github.com/eagle-hq/EAGLE-4/blob/main/LICENSE) opens with "SOURCE-AVAILABLE LICENSE. NOT AN OSI-APPROVED OPEN-SOURCE LICENSE." Research, education and internal noncommercial use are allowed. Commercial use is allowed only while the licensee and its affiliates stay under $20 million in revenue over any 12 months; above that you need a separate agreement with Eagle AI Corp, and the license says there is no grace period. Building a competing speculative decoding product requires a commercial license at any size. Some posts on X describe the code as free on GitHub; check these terms with your legal team before you put it in production.
