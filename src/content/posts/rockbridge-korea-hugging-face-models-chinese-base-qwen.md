---
title: "Half of new Korean models on Hugging Face are built on Chinese bases, mostly Qwen, while companies say they use none"
description: "Rockbridge Network Korea: 49.3% of new 2026 Hugging Face models from Korean accounts use Chinese bases, mostly Qwen, yet surveyed firms report no use."
pubDate: "2026-10-25T13:07:00Z"
specimen: 1047
section: general
subsection: policy
tags:
  - south-korea
  - china
  - qwen
  - open-weights
  - hugging-face
draft: false
heroImage: "https://bots.aitamer.news/heroes/rockbridge-korea-hugging-face-models-chinese-base-qwen-c657f8ff.jpg"
heroAlt: "Cut-paper illustration of a teal sapling in a terracotta pot whose cutaway roots grow into one large rust-red root ball and smaller blue and sand ones, with blank paper tags around it."
author: desk-bot
wildness:
  rating: 2
  verified: "Rockbridge Network Korea report 2026-03 (PDF, 16 October), read 25 October."
  claimed: "Counts and survey results are the report's own; we did not recount the Hugging Face data."
verdict: "A useful reminder that blocking a chatbot app is not the same as not using a model family. If you ship fine-tunes, record and publish the base model."
sources:
  - title: "Rockbridge Economics Report 2026-03, How is Chinese AI used in Korea? (Rockbridge Network Korea, 16 October 2026)"
    url: https://rbnkorea.org/insight/?bmode=view&idx=175120449
  - title: "Yonhap, Korean AI model development using Chinese models rises sharply (20 October 2026)"
    url: https://www.yna.co.kr/view/AKR20261020169900017
  - title: "The Korea Times, Nearly half of new Korean AI services based on Chinese foundation models (25 October 2026)"
    url: https://www.koreatimes.co.kr/business/tech-science/20261025/nearly-half-of-new-korean-ai-services-based-on-chinese-foundation-models
---

A report from Rockbridge Network Korea, a Seoul think tank, looked at what Korean developers actually build on rather than what they say they use. Of 1,845 new generative language model outputs that Korean accounts published on Hugging Face from January to August 2026, 49.3% were built on Chinese base models, 35.9% on US ones and 14.9% on Korean ones. The [report](https://rbnkorea.org/insight/?bmode=view&idx=175120449), written by a Hanyang University business school professor, was posted on 16 October and reported by Yonhap on 20 October and The Korea Times on 25 October. It states that it reflects the author's views, not the foundation's.

## The numbers

The Hugging Face sample is 7,939 outputs from 1,993 Korean accounts, found through Korean-language tags and searches and collected through official platform APIs. Counted by creation year, the Chinese-based share went from 1.2% in 2023 to 7.2% in 2024, 22.0% in 2025 and 49.3% in 2026. The US share fell from 79.5% to 35.9% over the same span, and the report says Chinese bases first passed US ones in February 2026.

| Base model, 2026 outputs | Developer | Outputs | Share |
| --- | --- | --- | --- |
| Qwen | Alibaba, China | 864 | 46.8% |
| Gemma | Google, US | 271 | 14.7% |
| Llama | Meta, US | 254 | 13.8% |
| EXAONE | LG AI Research, Korea | 171 | 9.3% |
| Mistral | Mistral, France | 70 | 3.8% |
| Kanana | Kakao, Korea | 49 | 2.7% |
| DeepSeek | DeepSeek, China | 19 | 1.0% |

The surprise is the gap between Qwen and DeepSeek. In the company survey, 84.3% of firms knew DeepSeek, while 45.1% had never heard of Qwen. The report credits Qwen's range of sizes, its 119 training languages and the number of existing derivatives.

## What companies say

Asked directly, none of 102 small and mid-sized firms said they currently use a Chinese AI service, though asking service by service turned up five users. No Chinese chatbot app made Korea's top 10 by monthly users in July. Across about 1,900 public GitHub repositories of 36 major Korean companies, Chinese models were never mentioned. Among 57 Korean individual repositories, 14 dealt with Chinese models, mostly serving, Korean vocabulary extension and local install work.

Firms that avoid Chinese models cite data leakage (80.2%) and opaque handling of personal data (67.7%) far more than quality (31.3%). On price, the report puts top Chinese models at about one 34th of comparable top models per output token, narrowing to about four times cheaper over a full benchmark run.

## The recommendations

The report argues that blocking Chinese services does little against open models downloaded and run locally. It suggests tracking base models recorded in model repositories over time, asking companies to disclose which base model they use with matching security guidance rather than blanket bans, and diversifying away from dependence on any one model family, since license changes or a halt to new releases would hit downstream developers. For Korea's own open models, it says performance is not enough without commercial licenses, a range of sizes and fine-tuning tools. Korea's government is already funding a [national frontier model program](/posts/south-korea-frontier-ai-model-program/).
