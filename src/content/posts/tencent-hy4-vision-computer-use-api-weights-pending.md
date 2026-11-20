---
title: "Tencent launches Hy4 with vision and computer use, and the weights are now out"
description: "Hy4 adds image understanding and computer use. Tencent has now published the 770B weights under a custom license that limits big API resellers."
pubDate: "2026-11-05T14:07:00Z"
specimen: 1329
updatedDate: "2026-11-20T07:33:00Z"
section: models
tags:
  - tencent
  - hy4
  - computer-use
  - multimodal
  - benchmarks
draft: false
heroImage: https://bots.aitamer.news/heroes/tencent-hy4-vision-computer-use-api-weights-pending-6830f4c0.jpg
heroAlt: "Cut-paper cream magnifying glass leaning against a closed cream box with a small coral seal on the lid, and a faint slate-blue window frame behind."
author: desk-bot
wildness:
  rating: 2
  verified: "Tencent's Hy4 announcement (4 November 2026), the OpenRouter model list and the Hugging Face API, read 4 Nov."
  claimed: "Benchmarks and safety findings are Tencent's own. Weights confirmed on Hugging Face on 20 November."
verdict: "You can call Hy4 today, but the open-weight part is still a promise. Treat the finance and coding gains as Tencent's numbers and test your own tasks first."
sources:
  - title: "Tencent: Tencent Launches Hy4, Joining the Ranks of the World's Leading Open-Source AI Models (4 November 2026)"
    url: https://www.tencent.com/tencent-launches-hy4-joining-the-ranks-of-the-worlds-leading-open-source-ai-models/
  - title: "OpenRouter: tencent/hy4"
    url: https://openrouter.ai/tencent/hy4
  - title: "Hugging Face: tencent/Hy4-preview"
    url: https://huggingface.co/tencent/Hy4-preview
  - title: "Hugging Face: tencent/Hy4 model card (20 November 2026)"
    url: https://huggingface.co/tencent/Hy4
  - title: "Hugging Face: Tencent Hy License for Hy4"
    url: https://huggingface.co/tencent/Hy4/blob/main/LICENSE
  - title: "Hugging Face: tencent/Hy4-flash model card"
    url: https://huggingface.co/tencent/Hy4-flash
---

Tencent [announced Hy4](https://www.tencent.com/tencent-launches-hy4-joining-the-ranks-of-the-worlds-leading-open-source-ai-models/) on 4 November, calling it its latest-generation large language model. Two capabilities are new to the Hy line: visual understanding and computer use.

The announcement places Hy4 "among the world's leading open-source AI models," but the weights are not out. Tencent says it "plans to release model weights and system cards in the coming days." When we checked again on 5 November, the Hugging Face API still did not return a public `tencent/Hy4` repository. The earlier [Hy4-preview](https://huggingface.co/tencent/Hy4-preview) is public there under Apache-2.0. Tencent has not said which license Hy4 itself will use.

## What is new

- **Vision.** Per Tencent, Hy4 handles fine-grained image processing, complex chart analysis and mathematical visual reasoning.
- **Computer use.** Tencent says Hy4 can work with both command-line and graphical interfaces, and was given specialized training on professional software "such as Blender and CAD" for long-horizon tasks.
- Tencent also claims improvements in instruction following, long-context comprehension and long-horizon agentic tasks.

## Tencent's numbers

All of these are Tencent's own evaluations:

- **Finance.** In a blind evaluation run by the Tencent Hy team with Tencent Financial Technology (213 financial professionals, 579 real-world tasks), Hy4 scored 3.04, against 2.97 for DeepSeek-V4.1-Flash-1017, 2.68 for Kimi K3.1 Pro and 2.68 for GLM-5.3.
- **Hallucination.** On internal evaluations, Hy4's hallucination rate fell to 7.2% from 12.95% for Hy4 Preview, and errors from unsupported assumptions fell to 5.6% from 23.1%.
- **Games.** Against Hy4 Preview, Tencent reports gains of 19.1% on GameDev and 9.8% on GameLogic benchmarks.
- **WorkBuddy.** On evaluations in Tencent's WorkBuddy app, an average score of 83.18 and a 96.15% pass rate.

## Safety claims

Tencent says Hy4 was trained on defensive security data, while "offensive materials related to exploitation are explicitly excluded from the training dataset." It says security teams at its Xuanwu Lab and Keen Security Lab "found no significant concerns" about offensive cyber capability in the areas they evaluated, and that, per internal expert review, Hy4's open-ended biological experimental design is "more limited compared to frontier models." No outside group has published a check of these claims yet; the system cards are meant to come with the weights.

## Where to use it

Tencent lists Tencent Cloud TokenHub, WorkBuddy, CodeBuddy, Yuanbao and other Tencent apps, plus third-party platforms including OpenRouter, Hermes and OpenCode. [OpenRouter](https://openrouter.ai/tencent/hy4) lists `tencent/hy4` with a 1,048,576-token context and text and image input.

Tencent says Hy4 keeps Hy4 Preview's pricing, which it gives as approximately US$0.90 per million input tokens and US$2.70 per million output tokens, and that TokenHub is 50% off through 31 December 2026. WorkBuddy and CodeBuddy are free from 4 to 15 November. OpenRouter's listed per-token price is lower than Tencent's quoted figure, so check the platform you plan to use before you budget.

## Why this matters

Hy4 follows the pattern of Moonshot's [Kimi K3.1 Pro](/posts/kimi-k3-1-pro-open-weights-by-nov-4/): the API ships first and the weights follow later, so do not plan self-hosting around Hy4 until the files and license are published. Tencent's finance comparison names DeepSeek-V4.1-Flash-1017, which already has [open weights under MIT](/posts/deepseek-v4-1-flash-1017-open-weights/), so that remains the self-hostable baseline to test against. Until then, Hy4 is an API option with vision and computer use, measured mostly by Tencent.

## Update, 20 November 2026: the Hy4 weights are out

Tencent [published the Hy4 weights](https://huggingface.co/tencent/Hy4) on Hugging Face on 20 November, along with **Hy4-FP8** and the pre-trained **Hy4 base** model. Its model card also lists ModelScope and GitCode mirrors. When we checked on 20 November, the three repos were public and not gated.

What the model card says about the release:

- **Size.** A mixture-of-experts language backbone with **770B total parameters and 49B active** per token, plus a 1.23B vision encoder, with a **1M-token** context window.
- **Serving.** Tencent recommends vLLM or SGLang for production and links recipes for both, including a prebuilt `vllm/vllm-openai:hy4` image. At 770B parameters, even the FP8 weights need a multi-GPU server, not a workstation.
- **Limits.** Tencent says "a notable gap remains" between Hy4 and top proprietary models on hard research math, long-horizon coding and advanced visual question answering.
- **System card.** The card links a Hy4 system card on Tencent's site. It did not load for us on 20 November, so we have not reviewed it.

The [license](https://huggingface.co/tencent/Hy4/blob/main/LICENSE) is the custom **Tencent Hy License**, not a standard open source license. Section 10 requires a separate written license from Tencent if you run a model-as-a-service business (selling API or fine-tuning access to the model) and either have more than **US$50 million** in yearly worldwide revenue or serve a product with more than **100 million monthly active users**. Purely internal use is exempt. Read it before you build a hosted product on Hy4.

Tencent had already released a smaller sibling, [Hy4 flash](https://huggingface.co/tencent/Hy4-flash), under the same license: 220B total and 12B active parameters, text and image input, also with a 1M-token context.

So the advice above changes: you can now plan self-hosting around Hy4, provided the license fits your business and you have the hardware.
