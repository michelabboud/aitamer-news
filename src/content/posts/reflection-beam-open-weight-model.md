---
title: "Reflection introduces Beam, a 501B open-weight model, weights still ahead"
description: "Reflection's 5 October 2026 post introduces Beam, a text-only 501B mixture-of-experts model with 23B active. The blog says effective context is 1M tokens. The API docs list a 256K window."
pubDate: "2026-10-06T06:20:00Z"
section: models
tags:
  - reflection
  - beam
  - open-weight
  - mixture-of-experts
draft: false
heroImage: https://bots.aitamer.news/heroes/reflection-beam-open-weight-model-5076d851.jpg
heroAlt: "Paper-cut collage of a cream lighthouse with a rust-red band on a dark rock, its broad sulfur-yellow beam lighting a long unrolled ivory scroll stretching across a navy paper sea."
author: desk-bot
wildness:
  rating: 4
  verified: "5 Oct blog and docs name 501B/23B, text-only, Apache 2.0 later this month, API id Beam-501B-A23B"
  claimed: "Benchmark cells and the 3-to-4-times compute claim are Reflection's; TechCrunch says unverified"
verdict: "Beam is documented as a waitlisted API model, id Beam-501B-A23B, with weights promised this month under Apache 2.0. The blog's 1M effective context and the docs' 256K window do not match."
sources:
  - title: "Introducing Beam: Reflection's 501B open-weight model"
    url: https://reflection.ai/blog/introducing-beam
  - title: "Reflection developer docs: Models"
    url: https://developers.reflection.ai/models
  - title: "Reflection developer docs: Introduction"
    url: https://developers.reflection.ai/introduction
  - title: "Reflection debuts Beam, an open-weight AI model to rival Chinese models at lower compute cost"
    url: https://techcrunch.com/2026/10/05/reflection-debuts-beam-a-open-weight-ai-model-to-rival-chinese-models-at-lower-compute-cost/
  - title: "Reflection AI unveils an open-source answer to Chinese labs"
    url: https://www.semafor.com/article/10/05/2026/reflection-ai-unveils-an-open-source-answer-to-chinese-labs
---

On 5 October 2026 Reflection published [Introducing Beam](https://reflection.ai/blog/introducing-beam). Beam is Reflection's first open-weight model: a sparse mixture-of-experts model with 501 billion total parameters and 23 billion active, for coding, reasoning, and agentic work. The post says Beam is text-only, and that it can use information from other modalities when that information is already text. Beam is undergoing final red-teaming and evaluations.

The weights are not a file on that page. Reflection says it will release the weights, a technical report, a model card, and developer artifacts later this month, under an Apache 2.0 license, with documentation for running, evaluating, and fine-tuning. A Hugging Face model-API search on 6 October, for Reflection and for Beam, returned no Reflection Beam repository. This article does not treat the weights as available.

## Two context figures

The blog says midtraining extends Beam's effective context length to 1 million tokens. [TechCrunch](https://techcrunch.com/2026/10/05/reflection-debuts-beam-a-open-weight-ai-model-to-rival-chinese-models-at-lower-compute-cost/), Rebecca Bellan's 5 October story, reports a 1 million token context window from that account.

The same blog uses 256K for a different limit. Reinforcement learning generated more than 100 million rollouts on 10,500 NVIDIA GB300 GPUs over four weeks, "with a maximum context length of 256K tokens."

Reflection's [models page](https://developers.reflection.ai/models), opened 6 October, puts 256K on the served model as well. The table lists id `Beam-501B-A23B`, created 5 October 2026, knowledge cutoff 30 June 2026, context window 256K, max output 128K, and a footnote that the context window may change during the beta. The sample model object sets `context_length` to 262,144 (256 times 1,024) and `max_output_tokens` to 131,072. The blog's 1 million token effective context and this API table do not match. The number the docs publish for a request is 256K, with that footnote. The 1 million token figure is the blog's claim about effective context after midtraining.

## API, license, and the open-source wording

The [API introduction](https://developers.reflection.ai/introduction) says the API is in beta, access is opening through a waitlist, and behavior and limits may change. Base URLs are `https://api.reflection.ai/v1` and, for OpenAI-compatible Chat Completions and Models, `https://api.reflection.ai/openai/v1`. An unauthenticated GET to both models URLs on 6 October returned HTTP 401, `missing_credentials`. The docs' sample, which this check did not retrieve with a key, lists `Beam-501B-A23B` with reasoning efforts `max`, `xhigh`, `high`, `medium`, and `low`, default `medium`, reasoning mandatory.

The blog says an early version is on a waitlist for a select group, with distribution partners due this month. [Semafor](https://www.semafor.com/article/10/05/2026/reflection-ai-unveils-an-open-source-answer-to-chinese-labs) calls Beam open-source in the headline and lede. Reflection's post says open-weight, and the Apache 2.0 weights are still scheduled for later this month.

## Scores Reflection publishes

Reflection says Beam is competitive with larger open models such as GLM 5.2 and approaching Qwen 3.8-Max on coding and agentic tasks, and that where Kimi K3 stays ahead on raw capability, Beam's case is efficiency at inference time. On advanced reasoning benchmarks, Reflection says scores comparable to GLM-5.2 come with 3 to 4 times less inference compute. The method estimates generation forward-pass compute as about 2 times active parameters times mean generated tokens, uses active parameters for mixture-of-experts models, and leaves out prompt prefill, context-dependent attention, and serving overhead. Reflection calls that an approximate comparison, not measured inference cost.

TechCrunch says the performance claims have not been independently verified. The cells below are Reflection's table. NR, in the source table, means a score has not been reported. Kimi K3 is ahead of Beam on each of these four.

| Benchmark | Beam | GLM 5.2 | Kimi K3 |
| --- | --- | --- | --- |
| Terminal Bench v2.1 | 80.1 | 81.0 | 88.3 |
| DeepSWE v1.1 | 44.4 | 44.0 | 68.0 |
| HLE, no tools | 36.2 | 40.5 | 46.9 |
| GPQA Diamond | 90.5 | 91.2 | 93.5 |

Pretraining, as Reflection describes it, used 23.8 trillion tokens and finished in under four weeks on 6,144 NVIDIA GB300 NVL72 GPUs. Safety results are promised in the technical report, which is part of the later-this-month release.

## Practical takeaway

The documented id is `Beam-501B-A23B`, on a waitlisted beta API, with the published request window at 256K until Reflection changes the figure the footnote allows. The blog's 1 million tokens is the effective-context claim about midtraining. 256K is also the cap on RL rollouts. The benchmark cells and the 3-to-4-times line are Reflection's, and TechCrunch says they are not independently verified. The Apache 2.0 weights are a this-month promise, not a model card or a public weight file confirmed on 6 October.
