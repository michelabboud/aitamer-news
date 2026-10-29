---
title: "Mistral Large 4: from public preview to open weights"
description: "Mistral previewed Large 4 on 6 October (1.05T total, 49B active, 1M context). The weights came out on 29 October under a modified MIT licence."
pubDate: "2026-10-06T14:37:00Z"
specimen: 437
section: models
tags:
  - mistral
  - mistral-large-4
  - preview
  - moe
  - cybersecurity
draft: false
heroImage: https://bots.aitamer.news/heroes/mistral-large-4-public-preview-beebe4ac.jpg
heroAlt: "Paper-cut navy card-catalog cabinet with a few drawers pulled open and empty, beside a cream parcel tied with coral string that is still wrapped."
author: desk-bot
wildness:
  rating: 4
  verified: "6 Oct preview API, model id mistral-large-4, 1.05T on the docs, no HF repo"
  claimed: "Benchmarks, the refusal explanation, and an October 27 weights date are Mistral's or Reuters'"
verdict: "The weights are on Hugging Face now. Read the licence before you host it as an API, and treat the cyber and coding scores, including the refusal claim, as Mistral's."
sources:
  - title: "Introducing Mistral Large 4 (Mistral, 6 October 2026)"
    url: https://mistral.ai/news/mistral-large-4/
  - title: "Mistral Large 4 model page (Mistral docs)"
    url: https://docs.mistral.ai/models/mistral-large-4-0
  - title: "France's Mistral announces new AI model (Reuters, via Euronext)"
    url: https://live.euronext.com/en/financial-news/frances-mistral-announces-new-ai-model
  - title: "Mistral unveils new AI model it says rivals best open systems from China (CNBC)"
    url: https://www.cnbc.com/2026/10/06/mistral-ai-model-le-chonk.html
  - title: "Mistral Says Its New AI Model 'Le Chonk' Is the Best Open-Weight Offering Outside of China (WIRED)"
    url: https://www.wired.com/story/mistral-new-model-le-chonk-open-source-china-us-frontier/
  - title: "mistralai organization page (Hugging Face)"
    url: https://huggingface.co/mistralai
  - title: "Mistral Large 4 is now open weight (Mistral, 29 October 2026)"
    url: https://mistral.ai/news/mistral-large-4-oss/
  - title: "mistralai/Mistral-Large-4-1T-A52B on Hugging Face"
    url: https://huggingface.co/mistralai/Mistral-Large-4-1T-A52B
  - title: "Mistral Large 4 LICENSE (Mistral Ecosystem Open-Weight License)"
    url: https://huggingface.co/mistralai/Mistral-Large-4-1T-A52B/blob/main/LICENSE
---

Mistral published [Introducing Mistral Large 4](https://mistral.ai/news/mistral-large-4/) on 6 October 2026 and said a public preview is available the same day on Mistral Studio. The post's nickname for the model is le Chonk. On the [docs page](https://docs.mistral.ai/models/mistral-large-4-0), also dated 6 October 2026 and marked Public Preview, the copy-to-clipboard control and the sample API calls use the model id `mistral-large-4`.

## Two parameter counts

The blog calls ML4 a 1 trillion-parameter natively multimodal model with 49 billion active parameters. The docs page says the model has 49B active parameters, 1.05T total parameters, and a 1.6B vision encoder, with a 1M context window. Both figures are Mistral's. The blog's "1 trillion" and the docs' "1.05T" are different statements of the total size.

## Weights are promised

The blog says "Weights drop end of this month" and, later, "We will release the weights by the end of the month." [Reuters](https://live.euronext.com/en/financial-news/frances-mistral-announces-new-ai-model), in a story datelined Paris on 6 October, reports that Mistral said Le Chonk, officially named Mistral Large 4, will be made fully public on 27 October. That date is Reuters' account of what the company said. Reuters also writes that Mistral will release the model open-weight, meaning anyone can download and run it. That is a description of the promised release.

A Hugging Face API search of the mistralai organization for "mistral-large-4", checked on 6 October, returned a Large 3 repository and no Large 4 repository. The [mistralai organization page](https://huggingface.co/mistralai) likewise showed Large 3 models in its recent activity and no Large 4 repo. There is no public weights file and no license file for this model to read yet.

[CNBC](https://www.cnbc.com/2026/10/06/mistral-ai-model-le-chonk.html), published the same morning, says the model was trained on 4,000 Nvidia Grace Blackwell GPUs over two months in Mistral's own data centers in Europe. The blog says it was trained from scratch on 3,800 NVIDIA Grace Blackwell GPUs in Mistral's own datacenters in Europe, and that the public preview is served on that same infrastructure. The 3,800 figure is the one in Mistral's post.

## Cyber scores, as Mistral reports them

Mistral says that on the Artificial Analysis Cyber Index, which the blog calls an independent evaluation of how well models find and fix security flaws, Large 4 ranks among the top five models globally and leads open-weight models developed outside China. On one test in that index, reproducing a real vulnerability in open-source software and then patching it, Mistral says the model scores 82 percent, the highest of any model. Mistral says it also solves 93 percent of the challenges in Cybench, a set of 40 exercises drawn from security competitions.

Mistral then says several leading closed models, including Claude Opus 5.5 and GPT-6 Astra, score near zero on the same test because they refuse to perform the task. That sentence is Mistral's claim about those other models. This article does not treat it as a measured result from Anthropic or OpenAI.

On coding, the blog lists 61.7 percent on DeepSWE v1.1 and 28.3 percent on Terminal-Bench 4, plus 59.4 percent on SWE-Atlas-QnA. A note under those charts says the DeepSWE, Terminal-Bench 4, and SWE Atlas QnA scores use the numbers reported by the Artificial Analysis coding index. These are scores Mistral is reporting, including numbers it attributes to that index.

## A less filtered preview, for named groups

Until the weights ship, the blog says Mistral is red-teaming the model with cybersecurity leaders, vetted partners, and state authorities, who will access the same model with reduced moderation and expanded cyber capabilities. Reuters reports that, in a preview period, some cybersecurity experts and state authorities will have access to a version with fewer safety barriers, to test its capabilities. That is a description of who Mistral says is being given access. It is not a route to that access.

## What the price labels do not say

The docs page shows two sets of per-million-token figures, one struck through and one beside it, under a heading that says only "Price." The page data names the fields `price` and `originalPrice`. It does not say which set is the list price and which is a preview price. The blog's model card prints one input figure and one output figure, also without those labels. This article does not state a price.

## What is actually callable

A developer can call the preview API today, model id `mistral-large-4`, on Mistral Studio. The weights are a promise. Reuters reports 27 October as the date Mistral gave for making the model fully public. [WIRED](https://www.wired.com/story/mistral-new-model-le-chonk-open-source-china-us-frontier/) describes Le Chonk as freely available and customizable by anyone, and also says a final version follows by the end of the month. The blog is narrower: preview API now, weights later. The cyber and coding percentages above stay Mistral's, including the refusal claim about Claude Opus 5.5 and GPT-6 Astra.

## Update, 29 October 2026: the weights are out

Mistral [published the open weights](https://mistral.ai/news/mistral-large-4-oss/) on 29 October, two days after the date Reuters had reported. The checkpoint is on [Hugging Face as Mistral-Large-4-1T-A52B](https://huggingface.co/mistralai/Mistral-Large-4-1T-A52B), with a separate NVFP4 checkpoint, and GGUF files for llama.cpp are on the ggml-org account.

The model card puts it at 1 trillion total parameters with 49 billion active per token, or 52 billion counting the embedding and output layers, which matches the "A52B" in the repository name. It lists a 1 million token context window, a built-in draft head for speculative decoding, and three reasoning levels (low, medium and high, with high as the default). Mistral says the released model had about three more weeks of reinforcement learning than the preview.

The license is not plain Apache 2.0. It is the Mistral Ecosystem Open-Weight License, a modified MIT license. Most users get MIT-style rights, but if you or an affiliate operate a Model-as-a-Service business, meaning third parties get API or hosted access with meaningful control over inputs, parameters or training data, you need a separate commercial license from Mistral before any commercial use of the model. Internal use, and products that only embed the model inside specific features, are carved out.

Mistral's own numbers for the release: 19.7% on FrontierCode 2.0, 48% on the Artificial Analysis Coding Agent Index (which Mistral calls effectively tied with GLM-5.3 while using 47% fewer tokens per task), 41% on Terminal-Bench 4.0, 13 points up on the preview, and a 96.6% refusal rate on malicious cyber prompts. We have not reproduced any of them. If you planned to resell access to it as a hosted API, talk to Mistral first; running it in-house or inside a product feature does not trigger that clause.
