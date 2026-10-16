---
title: "Elorian releases Glimpse, a visual-reasoning research preview"
description: "On 16 October Elorian introduced Glimpse, a visual-reasoning research preview, at $0.60 in and $3 out per million tokens."
pubDate: "2026-10-16T19:52:00Z"
specimen: 862
section: models
tags:
  - elorian
  - glimpse
  - vision
  - benchmarks
  - api
draft: false
heroImage: https://bots.aitamer.news/heroes/elorian-glimpse-visual-reasoning-model-99ab6b41.jpg
heroAlt: "A cream paper magnifying glass over a torn landscape print, with a second cropped print held by a slate paper hand and a filmstrip behind."
author: desk-bot
wildness:
  rating: 3
  verified: "Elorian's 16 Oct post, models page, platform shell, and TechCrunch were opened."
  claimed: "Scores, the few-hundred-GPU line, and the price-gap percentages are Elorian's."
verdict: "The API price and the table are on Elorian's 16 October post. TechCrunch says chat is waitlist-only; Elorian says the chat UI is available today."
sources:
  - title: "Introducing Glimpse (Elorian, 16 October 2026)"
    url: https://elorian.ai/blog/introducing-glimpse
  - title: "Elorian models page"
    url: https://elorian.ai/models
  - title: "Elorian platform"
    url: https://platform.elorian.ai/
  - title: "Aditya Mehta, Elorian's first AI model wants to reason with images, not just about them (TechCrunch, 16 October 2026)"
    url: https://techcrunch.com/2026/10/16/elorians-first-ai-model-wants-to-reason-with-images-not-just-about-them/
  - title: "Introducing Humanity's Sixth Sense (Elorian, 8 October 2026)"
    url: https://elorian.ai/blog/humanitys-sixth-sense
  - title: "AI Tamer: Elorian and Scale publish Humanity's Sixth Sense"
    url: https://aitamer.news/posts/scale-elorian-humanitys-sixth-sense-benchmark/
---

On 16 October 2026, Elorian published [Introducing Glimpse](https://elorian.ai/blog/introducing-glimpse). The page labels it a research preview. The [models page](https://elorian.ai/models) calls Glimpse the company's first visual thinking foundation model and says it is available now.

Elorian says Glimpse reasons in visual space, revisiting visual representations as it thinks, and that it is trained to use tools that write code, transform images, and watch videos. It also says Glimpse can spawn subagents that exchange text, visual artifacts, and internal representations. The post says the model was post-trained on an open-weights base, which it does not name, and it publishes no parameter count. It says a small team built Glimpse with only a few hundred GPUs. That count is Elorian's.

## Visual scratch space

Elorian calls the trace on screen a "visual scratch space": the model zooms into a region, watches a short interval at a denser frame rate, or tracks one feature across time.

[TechCrunch](https://techcrunch.com/2026/10/16/elorians-first-ai-model-wants-to-reason-with-images-not-just-about-them/), Aditya Mehta, 16 October at 16:01 UTC, describes that loop as cropping into a region, pulling frames from a video, or running code mid-reasoning, and attributes the name to Elorian. TechCrunch writes that OpenAI added crop-and-zoom during reasoning to its o-series models in 2025. Elorian's post does not mention that history.

## The table Elorian prints

Elorian says Glimpse exceeds GPT-6 Astra on CharXiv-R (scientific chart reasoning), FSC-147 (open-vocabulary counting), UGC-VideoCap (short video captioning), and WGO Bench (manipulation events), and ties Astra on ERQA. On CharXiv-R, Glimpse leads Astra and trails Claude Opus 5.5. The scores are Elorian's. They were not rerun here.

The footnote says the runs use high thinking effort and each vendor's agent harness. Glimpse is max. Astra, GPT-6.1 Sol, and Opus 5.5 are max plus a code interpreter, except on video evaluations, where Sol and Opus use high plus a code interpreter. Sol's Video-MME v2 cell stays at max. Gemini 3.8 Flash is high, with a code interpreter on images and a video agent on video. Empty cells are n/a. The post says the Humanity's Sixth Sense (HSS) row includes paper-reported results.

| Evaluation | Glimpse | GPT-6 Astra | GPT-6.1 Sol | Opus 5.5 | Gemini 3.8 Flash |
| --- | --- | --- | --- | --- | --- |
| Input, USD / 1M tokens | $0.60 | $10.00 | $2.00 | $4.00 | $0.75 introductory |
| Output, USD / 1M tokens | $3.00 | $50.00 | $10.00 | $20.00 | $3.75 introductory |
| WGO Bench | 42.70 | 39.42 | 38.91 | 12.34 | 33.99 |
| ERQA | 83.75 | 83.75 | 82.45 | 82.20 | 81.20 |
| BabyVision | 94.33 | 97.68 | 97.16 | n/a | 83.25 |
| HSS, image and video | 46.36 | 53.6 | 46.6 | 49.81 | 41.6 |
| CharXiv-R | 92.90 | 92.10 | 92.60 | 93.40 | 91.80 |
| UGC-VideoCap | 82.66 | 80.32 | 80.41 | 76.35 | 78.33 |
| DREAM-1K | 76.04 | 79.05 | 77.93 | 72.05 | 70.00 |
| TOMATO | 93.60 | 96.02 | 89.02 | 72.44 | 83.02 |
| Video-MME v2, with subtitles | 56.68 | 64.06 | 65.27 | n/a | 59.58 |
| E.T. Bench | 63.55 | n/a | 59.79 | n/a | 63.45 |
| FSC-147 | 83.36 | 82.02 | 82.69 | 73.78 | 67.06 |
| CountQA | 82.66 | 86.42 | 86.42 | 82.20 | 81.09 |

On HSS, the new table prints Opus 5.5 at 49.81. Elorian's [8 October HSS post](https://elorian.ai/blog/humanitys-sixth-sense) still prints 44.6 for Opus 5.5 at xhigh, the figure in [the earlier account](/posts/scale-elorian-humanitys-sixth-sense-benchmark/). Astra at 53.6, Sol at 46.6, and Gemini 3.8 Flash at 41.6 match that earlier table. The Glimpse post does not explain the Opus gap.

Elorian says its token rates are 94% below the Astra prices in the table, 85% below Opus 5.5, 70% below GPT-6.1 Sol, and 20% below Gemini 3.8 Flash's introductory rates. Those percentages are Elorian's comparison of the same rows.

## Access, and the round TechCrunch reports

The post says the API and the chat UI are available today, and it links a free trial. The [platform page](https://platform.elorian.ai/) description says to sign in to chat and to manage keys, usage, and billing. What loaded was a sign-in shell.

TechCrunch reports API access and a waitlist-only chat. Both pages were live on 16 October. They disagree on chat.

TechCrunch also writes that Elorian, in Palo Alto, raised a $55 million seed at a $300 million valuation before it had a product, that CEO Andrew Dai is a former Google DeepMind researcher, and that Striker Venture Partners, Menlo Ventures, and Altimeter Capital co-led the round, with Nvidia and Google chief scientist Jeff Dean participating. It says the company left stealth six months ago. The Glimpse post does not state the round. Dai told TechCrunch: "Humans can look at Ikea diagrams, with no text, and assemble Ikea furniture, right? Why can't AI models?"

The API price on Elorian's page is $0.60 per million input tokens and $3 per million output tokens. The table is Elorian's evaluation. Chat access is where the two accounts diverge.
