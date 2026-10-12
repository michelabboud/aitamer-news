---
title: "Reflection introduces Beam, a 501B open-weight model, weights still ahead"
description: "Reflection's 5 October 2026 post introduces Beam, a text-only 501B mixture-of-experts model with 23B active. The blog says effective context is 1M tokens. The API docs list a 256K window."
pubDate: "2026-10-06T06:20:00Z"
specimen: 430
updatedDate: "2026-10-12T06:15:00Z"
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
  - title: "Nvidia and Reflection talks (Financial Times, 10 October 2026)"
    url: https://www.ft.com/content/052610c5-22b4-4dd4-932e-b7f9f0628b6a
  - title: "Nvidia in talks to invest further in Reflection AI or buy it, FT reports (CNA, Reuters, 11 October 2026)"
    url: https://www.channelnewsasia.com/business/nvidia-in-talks-invest-further-in-reflection-ai-or-buy-it-ft-reports-6449691
  - title: "Nvidia weighs deeper ties with Reflection AI through investment or a computing deal (The Business Times, carrying Bloomberg, 11 October 2026)"
    url: https://www.businesstimes.com.sg/international/global/nvidia-weighs-deeper-ties-open-model-developer-reflection-ai-through-investment-or-computing-deal
  - title: "Nvidia in Talks to Acquire Reflection AI: FT (Bloomberg Law)"
    url: https://news.bloomberglaw.com/mergers-and-acquisitions/nvidia-in-talks-to-acquire-reflection-ai-ft
---

## Update, 12 October 2026: Nvidia is reported in early talks

The [Financial Times reported](https://www.ft.com/content/052610c5-22b4-4dd4-932e-b7f9f0628b6a) on Saturday, 10 October 2026, that Nvidia is in early talks to deepen its investment in Reflection or to acquire it. [Reuters, carried by CNA](https://www.channelnewsasia.com/business/nvidia-in-talks-invest-further-in-reflection-ai-or-buy-it-ft-reports-6449691) on 11 October, says the paper cited people with direct knowledge, and that a deal could take several forms, including an acqui-hire in which Nvidia would hire staff and license technology rather than buy the company, a structure the paper said could avoid a lengthy regulatory review. That account says an agreement could come in the coming weeks, and that the talks could still fall apart. Reuters said it could not immediately verify the report, and that Nvidia and Reflection did not immediately respond outside regular business hours. It also says Nvidia has already invested $800 million, as the FT reported.

[Bloomberg's follow-up, published by The Business Times](https://www.businesstimes.com.sg/international/global/nvidia-weighs-deeper-ties-open-model-developer-reflection-ai-through-investment-or-computing-deal) on 11 October, says Nvidia is in talks to boost its investment or offer Reflection computing power, according to a person familiar with the matter. No terms have been reached, that account says. Nvidia did not immediately respond, and Reflection declined to comment. The piece, credited to Bloomberg, says the FT had described possible structures that include an acqui-hire, more chips, or a larger equity stake. [Bloomberg Law](https://news.bloomberglaw.com/mergers-and-acquisitions/nvidia-in-talks-to-acquire-reflection-ai-ft), summarizing the FT, says deal terms could not be established.

None of these reports says an agreement has been signed.

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
