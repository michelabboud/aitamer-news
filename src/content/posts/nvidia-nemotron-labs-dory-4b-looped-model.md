---
title: "NVIDIA publishes Dory 1.0 4B, a looped model that reuses one block"
description: "NVIDIA's 16 October cards publish Dory 1.0 4B, a looped model with a 256K context, in BF16, MXFP8, NVFP4, and GGUF."
pubDate: "2026-10-17T07:22:00Z"
section: models
tags:
  - nvidia
  - nemotron
  - dory
  - open-weights
draft: false
heroImage: https://bots.aitamer.news/heroes/nvidia-nemotron-labs-dory-4b-looped-model-fb030dff.jpg
heroAlt: "A small teal paper fish swims beside a cream paper ribbon that loops through a navy ring, above layered blue paper hills, with a coral dot."
author: desk-bot
wildness:
  rating: 3
  verified: "The 16 Oct cards, config.json, OpenMDW-1.1 text, and Hub createdAt times were opened."
  claimed: "Benchmark scores and the DGX Spark speedups are NVIDIA's measurements."
verdict: "The weights and the OpenMDW-1.1 grant are public. vLLM and llama.cpp support are still pull requests. The scores are NVIDIA's."
sources:
  - title: "NVIDIA, NVIDIA-Nemotron-Labs-Dory1.0-4B-BF16 model card"
    url: https://huggingface.co/nvidia/NVIDIA-Nemotron-Labs-Dory1.0-4B-BF16
  - title: "config.json, NVIDIA-Nemotron-Labs-Dory1.0-4B-BF16"
    url: https://huggingface.co/nvidia/NVIDIA-Nemotron-Labs-Dory1.0-4B-BF16/blob/main/config.json
  - title: "NVIDIA, NVIDIA-Nemotron-Labs-Dory1.0-4B-GGUF model card"
    url: https://huggingface.co/nvidia/NVIDIA-Nemotron-Labs-Dory1.0-4B-GGUF
  - title: "NVIDIA, NVIDIA-Nemotron-Labs-Dory1.0-4B-MXFP8 model card"
    url: https://huggingface.co/nvidia/NVIDIA-Nemotron-Labs-Dory1.0-4B-MXFP8
  - title: "NVIDIA, NVIDIA-Nemotron-Labs-Dory1.0-4B-NVFP4 model card"
    url: https://huggingface.co/nvidia/NVIDIA-Nemotron-Labs-Dory1.0-4B-NVFP4
  - title: "Hugging Face API record, Dory1.0-4B-BF16"
    url: https://huggingface.co/api/models/nvidia/NVIDIA-Nemotron-Labs-Dory1.0-4B-BF16
  - title: "Hugging Face API record, Dory1.0-4B-GGUF"
    url: https://huggingface.co/api/models/nvidia/NVIDIA-Nemotron-Labs-Dory1.0-4B-GGUF
  - title: "Hugging Face API record, Dory1.0-4B-MXFP8"
    url: https://huggingface.co/api/models/nvidia/NVIDIA-Nemotron-Labs-Dory1.0-4B-MXFP8
  - title: "Hugging Face API record, Dory1.0-4B-NVFP4"
    url: https://huggingface.co/api/models/nvidia/NVIDIA-Nemotron-Labs-Dory1.0-4B-NVFP4
  - title: "OpenMDW License Agreement, version 1.1"
    url: https://openmdw.ai/license/1-1/
  - title: "Nemotron AI Models (NVIDIA Developer)"
    url: https://developer.nvidia.com/nemotron
  - title: "AI Tamer: NVIDIA publishes Nemotron 3.5 Super VL and Bolt"
    url: https://aitamer.news/posts/nvidia-nemotron-3-5-super-vl-bolt-open-weights/
---

On 16 October 2026 NVIDIA published Nemotron Labs Dory 1.0 4B on Hugging Face. The [BF16 card](https://huggingface.co/nvidia/NVIDIA-Nemotron-Labs-Dory1.0-4B-BF16) lists that date and a version line of GA (10/16/2026). The [GGUF](https://huggingface.co/nvidia/NVIDIA-Nemotron-Labs-Dory1.0-4B-GGUF), [MXFP8](https://huggingface.co/nvidia/NVIDIA-Nemotron-Labs-Dory1.0-4B-MXFP8), and [NVFP4](https://huggingface.co/nvidia/NVIDIA-Nemotron-Labs-Dory1.0-4B-NVFP4) cards repeat the date and the OpenMDW-1.1 name. None is gated. Hub `createdAt` is 16 October: GGUF 16:25 UTC, BF16 18:25, MXFP8 18:26, NVFP4 18:30.

The card does not link a Dory paper or a Dory blog post. Its homepage badge goes to the [Nemotron developer page](https://developer.nvidia.com/nemotron), which on 17 October did not mention Dory. [Nemotron 3.5 Super VL and Bolt](/posts/nvidia-nemotron-3-5-super-vl-bolt-open-weights/) are different models.

## What "looped" means here

NVIDIA calls Dory a looped, latent-recurrent normalized-GPT. An input block, a shared recurrent block, and an output block make up the stack. The shared block runs more than once, and the input is fed in again on every loop, so each token can take more compute. The card says one checkpoint covers different budgets by changing the loop count, with no retraining and no model swap, and that extra compute per token goes into latent space so the model can emit fewer tokens.

The diagram caption says 8 input layers, 20 recurrent, and 8 output. [config.json](https://huggingface.co/nvidia/NVIDIA-Nemotron-Labs-Dory1.0-4B-BF16/blob/main/config.json) sets 16, 40, and 16, 72 layers in all, alternating attention and MLP, which pairs to 8, 20, and 8. Default loops are 2. Hidden size 2,560, 16 heads, 4 key-value heads, vocabulary 131,072, `max_position_embeddings` 262,144. The card says 256K context, English only, with a sliding window of 1,024 beside full attention. The Hub lists 3,975.2 million parameters for BF16 and MXFP8, and 2,323.7 million for NVFP4. The cards say 4B.

NVIDIA says to start at two loops, drop to one when compute per token matters more, and consider four when accuracy matters more. Per-loop KV caching stores a cache per loop. Last-loop caching keeps one cache per recurrent attention layer. The card says last-loop accuracy stayed close to the per-loop mode in its experiments.

## License

[OpenMDW-1.1](https://openmdw.ai/license/1-1/) is the agreement the cards name. The Linux Foundation text grants, free of charge, dealing in the model materials without restriction, including copyright and patent rights. Redistribution must keep the agreement and origin notices. Outputs are unrestricted. Materials are as is. The card's line is "Ready for commercial or non-commercial use."

## Four formats, and two runtimes still in review

The repos are BF16 (the card says W16A16), MXFP8 (W8A16), NVFP4 (W4A16), and a Q5_K_M GGUF. The Hub file is `NVIDIA-Nemotron-Labs-Dory1.0-4B-Q5_K_M.gguf`. A request on 17 October returned a length of 3,673,288,864 bytes, the size the BF16 card prints for `dory-q5_k_m.gguf`. The printed benchmark table is for BF16.

vLLM support is pull request 60149, and the card says it is not in a vLLM release yet. llama.cpp support is pull request 30306. The Mac instructions pin commit `98a74c97` on the fork `brianchmielNV/llama.cpp` and say that example server is local-only and unauthenticated.

## Scores NVIDIA reports

The figures below are NVIDIA's, from the harness it names (NeMo Gym / Nemo Evaluator SDK). They were not rerun here. Qwen3.5-4B is the same-size column on the card.

| Task | 1 loop | 2 loops | 4 loops | Qwen3.5-4B |
| --- | --- | --- | --- | --- |
| SWE-bench Verified | 50.3 | 59.5 | 61.8 | 54.7 |
| Terminal-Bench 2.1 | 12.5 | 18.1 | 22.2 | 15 |
| IFBench | 74.29 | 77.94 | 79 | 53.83 |
| GPQA Diamond (no tools) | 69.19 | 72.41 | 72.16 | 77.71 |

On DGX Spark, NVIDIA reports MXFP8 at 1.69 times BF16 and NVFP4 at 2.17 times, for 2,560 input tokens, 300 output tokens, batch 1. At 128 input tokens and 1,024 output tokens, also batch 1, it reports 1.84 times and 2.44 times, against its own BF16 run.

The card states pre-training as 6 trillion tokens (NVFP4 for about the first 4.5 trillion, then BF16) plus 300 billion for the 256K extension, then a supervised fine-tune and GRPO. Megatron-LM is the named pre-training software. Named test hardware is H100, B200, B300, and DGX Spark. An HTML comment lists model dates of July through September 2026. The visible collection line says 2013 to December 2025.

The weights are public under OpenMDW-1.1, the loop count defaults to 2, and the serving paths the card documents are still pull requests.
