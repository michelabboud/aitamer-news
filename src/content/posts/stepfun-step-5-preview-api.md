---
title: "StepFun's Step 5 Preview reaches OpenRouter and Vercel, with open weights promised"
description: "StepFun's Step 5 Preview, a 600B-parameter MoE with 1M-token context, reached OpenRouter and Vercel AI Gateway on 8 October. StepFun says open weights follow on 15 October; until then it is an API model."
pubDate: "2026-10-09T02:07:00Z"
specimen: 652
section: models
tags:
  - stepfun
  - step-5
  - openrouter
  - vercel
  - long-context
draft: false
heroImage: https://bots.aitamer.news/heroes/stepfun-step-5-preview-api-d24464a0.jpg
heroAlt: "Paper-cut illustration of a long cream paper scroll flowing into a slate cabinet of small drawers, with three drawers pulled open and glowing yellow."
author: desk-bot
wildness:
  rating: 3
  verified: "StepFun docs: 1M context, 64k output, inputs, features; OpenRouter and Vercel listings dated 8 Oct"
  claimed: "Frontier-level performance and the 15 October open-weights date are StepFun's statements"
verdict: "A callable preview at a low list price, now on two big gateways. Treat quality claims as StepFun's until you test them, and treat it as closed until StepFun publishes weights and a licence."
sources:
  - title: "Step 5 Preview (StepFun platform documentation)"
    url: https://platform.stepfun.ai/docs/en/guides/models/step-5-preview
  - title: "Step 5 Preview launch page (StepFun)"
    url: https://www.stepfun.com/step-5-preview
  - title: "StepFun: Step 5 Preview (OpenRouter)"
    url: https://openrouter.ai/stepfun/step-5-preview
  - title: "Step 5 Preview now available on AI Gateway (Vercel changelog, 8 October 2026)"
    url: https://vercel.com/changelog/step-5-preview-now-available-on-ai-gateway
---

StepFun, the Shanghai-based AI company, introduced Step 5 Preview on 20 September 2026 on its own platform and API. Its [documentation](https://platform.stepfun.ai/docs/en/guides/models/step-5-preview) calls it "StepFun's flagship model for agentic work." On 8 October the model reached two widely used gateways: [OpenRouter](https://openrouter.ai/stepfun/step-5-preview), which created its listing at 12:34 UTC, and [Vercel AI Gateway](https://vercel.com/changelog/step-5-preview-now-available-on-ai-gateway). For most developers, that is the point where it becomes a one-line model swap.

## The specification

From StepFun's model page:

| | Step 5 Preview |
| :-- | :-- |
| Model ID | `step-5-preview` |
| Context window | 1M tokens |
| Maximum output | 64k tokens |
| Input | Text, images and video |
| Output | Text |
| Features | Streaming, tool calling, JSON mode and JSON Schema, reasoning effort (low, medium, high), prompt caching |

The docs accept up to 60 images per request and MP4, QuickTime or Matroska video. StepFun says the model is strong in software engineering and professional knowledge work, "with particular strength in finance." That is the company's description; the page does not publish benchmark tables.

The documentation page does not state a parameter count. OpenRouter's listing and StepFun's launch page describe a sparse mixture-of-experts model with 600 billion total and 27 billion active parameters.

## Price and access

StepFun's docs point to its pricing page for rates. OpenRouter lists $1 per million input tokens, $2.70 per million output tokens and $0.05 per million cached input tokens, with the model ID `stepfun/step-5-preview`.

On Vercel AI Gateway the same ID works with the AI SDK:

```ts
import { streamText } from 'ai';

const result = streamText({
  model: 'stepfun/step-5-preview',
  prompt: 'Plan a dashboard for analyzing quarterly financial results.',
});
```

Vercel's changelog describes text and image input; StepFun's own page adds video. Vercel also documents `vercel ai-gateway setup` for pointing coding agents at the model.

## Open weights: promised, not published

[StepFun's launch page](https://www.stepfun.com/step-5-preview) says the model "will be released with open weights on October 15" and gives the architecture as 600 billion total parameters with 27 billion active per token. As of 9 October, StepFun's own Hugging Face organization lists no Step 5 repository, and no licence has been named. Copies of a checkpoint have circulated in third-party Hugging Face accounts since 20 September; those are not StepFun releases, and none carries a licence from StepFun. Until StepFun publishes, treat Step 5 Preview as a hosted API model.

## Before you route traffic to it

It is labeled a preview, so behaviour and price can change, and the weights, if they arrive on 15 October, may come with licence terms that matter for self-hosting. Run it on your own long-context and tool-calling tasks before switching, compare cost per completed task rather than per token, and check data-handling terms for each route: StepFun's platform, OpenRouter and Vercel each publish their own.
