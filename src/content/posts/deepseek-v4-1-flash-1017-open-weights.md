---
title: "DeepSeek points deepseek-flash at V4.1-Flash-1017 and posts the weights"
description: "DeepSeek published DeepSeek-V4.1-Flash-1017 under MIT on Hugging Face. Callers still use deepseek-flash, and DeepSeek says the price is unchanged."
pubDate: "2026-10-17T10:37:00Z"
section: models
tags:
  - deepseek
  - open-weights
  - api
  - agents
  - huggingface
draft: false
heroImage: https://bots.aitamer.news/heroes/deepseek-v4-1-flash-1017-open-weights-bfec79d3.jpg
heroAlt: "An open navy paper box with a teal paper lightning bolt rising from it, beside a stack of blue paper discs, over blue and rust paper hills."
author: desk-bot
wildness:
  rating: 3
  verified: "The 17 Oct changelog, pricing pages, model card, homepage, and recipe repo were opened."
  claimed: "Benchmark scores and shorter, cheaper runs are DeepSeek's own comparison."
verdict: "Existing deepseek-flash callers get the version named on the pricing page, at the Flash rates already listed. The weights are public under MIT, and the repo has no Jinja chat template."
sources:
  - title: "Change Log, DeepSeek-V4.1-Flash-1017 Update (DeepSeek API Docs, dated 2026-10-17)"
    url: https://api-docs.deepseek.com/updates#deepseek-v41-flash-1017-update
  - title: "DeepSeek-V4.1-Flash-1017 model card (Hugging Face)"
    url: https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash-1017
  - title: "config.json, DeepSeek-V4.1-Flash-1017"
    url: https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash-1017/blob/main/config.json
  - title: "encoding/README.md, DeepSeek-V4.1-Flash-1017"
    url: https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash-1017/blob/main/encoding/README.md
  - title: "inference/README.md, DeepSeek-V4.1-Flash-1017"
    url: https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash-1017/blob/main/inference/README.md
  - title: "Models and Pricing (DeepSeek API Docs)"
    url: https://api-docs.deepseek.com/quick_start/pricing
  - title: "模型与价格 (DeepSeek API Docs, Chinese)"
    url: https://api-docs.deepseek.com/zh-cn/quick_start/pricing
  - title: "DeepSeek homepage"
    url: https://www.deepseek.com/
  - title: "deepseek-ai/deepseek-recipe"
    url: https://github.com/deepseek-ai/deepseek-recipe
  - title: "DeepSeek on X, 17 October 2026, 08:35 UTC"
    url: https://x.com/deepseek_ai/status/2111375640717033777
  - title: "DeepSeek V4.1 Flash 1017 (OpenRouter)"
    url: https://openrouter.ai/deepseek/deepseek-v4.1-flash-1017
  - title: "AI Tamer: DeepSeek documents standalone Search and Fetch APIs"
    url: https://aitamer.news/posts/deepseek-search-fetch-api-for-agents/
  - title: "AI Tamer: Bloomberg, DeepSeek nears an 80 billion yuan round"
    url: https://aitamer.news/posts/deepseek-funding-round-tencent-catl/
---

On 17 October 2026, DeepSeek's [API changelog](https://api-docs.deepseek.com/updates#deepseek-v41-flash-1017-update) puts DeepSeek-V4.1-Flash-1017 under the heading Date: 2026-10-17, beside the in-house search note. The update says V4.1 Flash has been upgraded to that name, that the official web and app models have been updated, and that the API method and price stay the same. Callers keep using `deepseek-flash`.

The [homepage](https://www.deepseek.com/) banner, in Chinese, repeats the update and claims a marked gain in project-development ability, at lower cost and higher speed. Its copyright line names 杭州深度求索人工智能基础技术研究有限公司, a Hangzhou company. [@deepseek_ai's post at 08:35 UTC](https://x.com/deepseek_ai/status/2111375640717033777), labeled 1/4, says the model is live on the website, app, and API, and asks for DeepSeek Harness v0.2.1-rc.1 or later. The text read here is that opening post. [OpenRouter](https://openrouter.ai/deepseek/deepseek-v4.1-flash-1017) lists it and calls 1017 the 17 October snapshot served as `deepseek-flash`. That sentence is OpenRouter's.

## The weights

The [Hugging Face repo](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash-1017) is public. The Hub API record on 17 October shows `createdAt` 2026-10-17T02:40:38Z, `lastModified` 2026-10-17T05:46:55Z, `gated` false, and `private` false. The card says `license: mit`. The LICENSE file is the MIT License, copyright 2023 DeepSeek. The repo holds 48 safetensors shards.

The card calls 1017 a minor update to DeepSeek-V4.1-Flash and states no parameter count. [config.json](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash-1017/blob/main/config.json) sets `quant_method` to `fp8` and `expert_dtype` to `fp4`, with 384 routed experts, 6 per token, and `max_position_embeddings` of 1,048,576. Hub tags include `fp8` and `8-bit`. The [inference readme](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash-1017/blob/main/inference/README.md) describes dense-fp8 and MoE-fp4 kernels and passes `--expert-dtype fp4` on convert. These are MIT safetensors, not a single FP8 file.

The files were not hashed against the API. DeepSeek says the web and app were updated and that `deepseek-flash` reaches the latest model. The [pricing page](https://api-docs.deepseek.com/quick_start/pricing) names that version DeepSeek-V4.1-Flash-1017.

## Scores DeepSeek prints

The card says the update improves reasoning, coding, agent work, and visual benchmarks, and that it shortens task time and output. It gives no percentage for the shorter output. The changelog says the same, and that DeepSeek tuned for DeepSeek Harness, Tencent CodeBuddy, and WorkBuddy. The version to use is Harness 0.2.1-rc.1 or later. Every score below is DeepSeek's.

The card compares DS-V4.1-Flash-1017 with DS-V4.1-Flash, K3, GLM-5.3, GPT-5.6 Sol, and Opus 5. The changelog says "the previous DeepSeek V4.1" and prints only the new scores. On HLE without tools, Terminal-Bench 4.0, and ProgramBench, the card's previous column matches the 10 September V4.1-Flash entry on that changelog: 36.8, 31.2, and 20.3.

| Benchmark | DS-V4.1-Flash-1017 | DS-V4.1-Flash |
| --- | --- | --- |
| HLE, no tools | 42.6 (44.0 text-only) | 36.8 (39.1 text-only) |
| Terminal-Bench 4.0 | 42.3 | 31.2 |
| ProgramBench | 29.1 | 20.3 |
| Apex Bench v1.1 | 72.1 | 64.6 |

The card says Terminal-Bench 4.0 used the Claude Code harness, and DeepSWE v1.1 used Mini-SWE-V2. On Terminal-Bench 4.0 it also lists K3 at 12.6, GLM-5.3 at 37.9, GPT-5.6 Sol at 39.9, and Opus 5 at 51.8. The changelog says ZeroBench-main used Pass@5. The card footnote does not.

## Price

Per million tokens, the English page lists `deepseek-flash` at $0.003 / $0.006 cache-hit input, $0.15 / $0.3 cache-miss input, and $0.6 / $1.2 output, off-peak then peak. Off-peak is half of peak. Peak is 01:00 to 04:00 and 06:00 to 10:00 UTC on weekdays, excluding Chinese public holidays. Context is 1M. Maximum output is 384K. Vision is on, thinking is the default, and the concurrency cap is 2500. The retired names `deepseek-v4-flash` and `deepseek-v4-flash-vision-exp` still route to 1017 at the Flash price.

The [Chinese pricing page](https://api-docs.deepseek.com/zh-cn/quick_start/pricing) names the same version in yuan: cache hit 0.02 / 0.04, cache miss 1 / 2, output 4 / 8. Peak there is Beijing 09:00 to 12:00 and 14:00 to 18:00, the same windows. The currencies are not converted here. The changelog says the price did not change.

The card's sampling line is temperature 1.0, top_p 1.0, a 1M window, and `max_tokens` of at least 256K. That 256K is the card's recommendation. The API output ceiling is 384K.

Search and Fetch on the same page are a separate English and Chinese price mismatch, in [the account of those endpoints](/posts/deepseek-search-fetch-api-for-agents/). The funding report is separate, in [that account](/posts/deepseek-funding-round-tencent-catl/).

## Running the weights

The card says there is no Jinja chat template. `tokenizer_config.json` has no `chat_template`. The [encoding readme](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash-1017/blob/main/encoding/README.md) points at `encoding.py` for multi-turn chat, tools, thinking, images, and a reasoning effort from 1 to 100 (low 50, high 75, max 100, default high). V4.1 tool tags add a leading space in the DSML names.

The card points production encoding at [deepseek-recipe](https://github.com/deepseek-ai/deepseek-recipe), Rust libraries with Python bindings. The README says they turn Messages, Chat Completions, and Responses into V4 and V4.1 prompts, and parse thinking, tools, and images. The caller does inference and HTTP. Install with `pip install deepseek-recipe` on Python 3.10 or newer. The README and the GitHub license field say MIT. That repo's last push, on the GitHub API, was 10 September 2026, not 17 October. The 1017 card still sends readers there.

The inference readme is a reference converter, one file per tensor-parallel rank. Its interactive example uses temperature 0.6, not the 1.0 on the card.
