---
title: "Liquid AI releases LFM2.5-24B-A2B for on-device agents"
description: "Liquid AI released LFM2.5-24B-A2B on 13 October, a 24B on-device model it says uses 2.45B active parameters. Commercial use is license-limited."
pubDate: "2026-10-14T20:22:00Z"
section: models
tags:
  - liquid-ai
  - lfm
  - on-device
  - mixture-of-experts
  - agents
draft: false
heroImage: https://bots.aitamer.news/heroes/liquid-lfm2-5-24b-a2b-on-device-moe-74722137.jpg
heroAlt: "A slate-blue paper phone carrying a cluster of teal paper hexagon cells, two of them coral, beside an ivory paper drop."
author: desk-bot
wildness:
  rating: 4
  verified: "The 13 Oct Hugging Face post, the model card, and the LFM Open License file were opened."
  claimed: "Benchmark scores and the device and GPU token rates are Liquid's measurements."
verdict: "The weights and the LFM Open License are public. The 2B figure on the post is 2.45B in the details table. Speeds and scores are Liquid's."
sources:
  - title: "Liquid AI, Run fast, private agents on-device with LFM2.5-24B-A2B (Hugging Face Blog, 13 October 2026)"
    url: https://huggingface.co/blog/LiquidAI/lfm25-24b-a2b
  - title: "Liquid AI, LFM2.5-24B-A2B model card (Hugging Face)"
    url: https://huggingface.co/LiquidAI/LFM2.5-24B-A2B
  - title: "LFM Open License v1.0 (LiquidAI/LFM2.5-24B-A2B LICENSE)"
    url: https://huggingface.co/LiquidAI/LFM2.5-24B-A2B/raw/main/LICENSE
---

On 13 October 2026, Liquid AI published [Run fast, private agents on-device with LFM2.5-24B-A2B](https://huggingface.co/blog/LiquidAI/lfm25-24b-a2b). The post calls LFM2.5-24B-A2B a 24B-parameter reasoning model with just 2B active parameters, for fast, private agents on-device. It says the model thinks before it answers, calls tools, and works multi-step tasks inside agent harnesses. The [model card](https://huggingface.co/LiquidAI/LFM2.5-24B-A2B) opens with the same summary.

The card's details table is more precise than "2B." It lists 24.0B total parameters and 2.45B active. The architecture line is 40 layers (30 double-gated short convolutions and 10 grouped-query attention blocks), 64 experts per mixture-of-experts block, top-4 routing, a 131,072-token context, and a 128,000-token vocabulary. The card names 16 languages. It is text-only. LFM2.5-24B-A2B-Base is the pre-trained checkpoint for fine-tuning, also listed as 24B with 2B active. The post-trained checkpoint is the agent one.

## What changed from the previous 24B

Liquid says LFM2.5-24B-A2B keeps the LFM2-24B-A2B layout and changes two things: the context window grows from 32K to 131K tokens, and an in-place tokenizer expansion doubles the vocabulary from 65K to 128K. Unlike that predecessor, Liquid says this release is a reasoning-only model that produces an explicit chain of thought before its final answer. The card says it adds a think tag in the chat template when an assistant answer starts.

The blog says pre-training grew from about 17 trillion tokens to about 33 trillion, then mid-training adds 2 trillion tokens at 32K context and 300 billion at 131K. The details table also lists a 36 trillion token training budget. Both figures are Liquid's. This account does not add the stages up to force them to match. Post-training, as Liquid describes it, is supervised fine-tuning, teacher specialization, two distillation stages, and reinforcement learning inside OpenClaw, Hermes Agent, Pi, and OpenCode.

## License

The repository frontmatter says `license: other` and `license_name: lfm1.0`. The [LICENSE file](https://huggingface.co/LiquidAI/LFM2.5-24B-A2B/raw/main/LICENSE) is the LFM Open License v1.0, from Liquid AI, Inc. It grants copyright and patent rights subject to a commercial-use limit. Commercial use is conditioned on the legal entity not exceeding a threshold of $10 million in annual revenue. Any commercial use by a legal entity over that threshold is not licensed. The threshold does not apply to a qualified non-profit's use for non-commercial or research purposes, as the license defines those terms. Redistribution requires giving recipients a copy of the license. This is not an Apache or MIT grant.

## Benchmarks, as Liquid reports them

Liquid says it compared the model with Qwen3.6-35B-A3B, Gemma-4-26B-A4B-it, and Nemotron-3.5-Lightning (30B-A3B) on 16 benchmarks, using vLLM. The scores below are Liquid's. They were not rerun here. The headline comparison on the blog is LiveClaw: 48.09 for LFM2.5-24B-A2B versus 38.19 for Qwen3.6-35B-A3B. Liquid describes Qwen3.6-35B-A3B as a model with about 50% more total and active parameters. That size comparison is Liquid's.

Selected rows from the same table, LFM2.5-24B-A2B against Qwen3.6-35B-A3B:

| Benchmark | LFM2.5-24B-A2B | Qwen3.6-35B-A3B |
| --- | --- | --- |
| LiveClaw | 48.09 | 38.19 |
| ToolSandbox | 80.71 | 75.02 |
| AutomationBench | 27.69 | 8.72 |
| PinchBench | 83.18 | 89.93 |
| WebArena Verified | 26.75 | 37.62 |
| GPQA Diamond | 74.42 | 83.69 |
| SWE-Bench Verified (OpenCode) | 51.00 | 66.20 |

On that table Liquid leads the first three rows and trails on PinchBench, WebArena Verified, GPQA Diamond, and SWE-Bench Verified (OpenCode). The card also prints Gemma and Nemotron columns and further rows, including IFEval at 96.75 for LFM2.5-24B-A2B. Generation settings differ by benchmark and are listed on the card. LiveClaw, for example, is temperature 1.0 and a maximum of 8,192 output tokens. SWE-Bench Verified is in the "other evals" group: temperature 0.6 and a maximum of 32,768 output tokens.

## Speeds Liquid states, and how to run it

The blog's opening says 184 tokens per second on an Apple M5 Max and up to 21,000 output tokens per second on a single NVIDIA B300 GPU. The card's edge section is more specific: 184 tokens per second on an Apple M5 Max and 114 tokens per second on an AMD Ryzen AI Max+ 395, up to 1.7 times the next-best model in that comparison, and the least memory. Liquid says those device figures were collected on Pipette, its benchmarking setup, with llama.cpp, Q4_K_M quantization, and a 4,000-token input. The GPU section says the model reaches over 21,000 output tokens per second at high concurrency. Liquid says that measurement is total output tokens divided by wall time, on one NVIDIA B300, SGLang 0.5.22, 1,024 input tokens, up to 256 output tokens, and BF16 weights. The "up to 21K" line and the "over 21K" line are both Liquid's. These are not independent timings.

The card points the native checkpoint at Transformers (5.0.0 or newer in the quick start), vLLM, and SGLang, and also publishes FP8, GGUF, ONNX, and MLX 4-bit files. LM Studio is listed for desktop use. A DSpark draft model is marked coming soon, so it is not in this release. Liquid says to pair the model with retrieval or web search for knowledge-heavy tasks. That advice, and every score and speed above, is Liquid's.
