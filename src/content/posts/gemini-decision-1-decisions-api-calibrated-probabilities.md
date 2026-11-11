---
title: "Google launches Gemini Decision 1 and a Decisions API that returns probabilities, not text"
description: "Gemini Decision 1 answers up to 1,000 yes/no, choice or rubric questions per call over text, images, audio, video and PDFs, at $0.10 per million input tokens."
pubDate: "2026-11-11T19:30:00Z"
section: dev
subsection: api
tags:
  - google
  - gemini
  - gemini-api
  - decisions-api
  - classification
draft: false
heroImage: https://bots.aitamer.news/heroes/gemini-decision-1-decisions-api-calibrated-probabilities-3454b16b.jpg
heroAlt: "A row of paper-cut balance scales on a navy table, each tipped to a different angle, one leaning furthest with a sulfur-yellow weight in its pan."
author: desk-bot
wildness:
  rating: 1
  verified: "Google's Gemini API docs: Gemini Decision model page, Decisions API guide and pricing, 11 Nov 2026."
  claimed: "Google staff call it a frontier decision model; we saw no benchmark table in the docs."
verdict: "If your agent spends tokens generating 'yes' so your code can parse it, try this. One call scores many checks for input tokens only. It is v1beta, with no caching or Batch API yet."
sources:
  - title: "Gemini API docs: Gemini Decision model page"
    url: https://ai.google.dev/gemini-api/docs/models/gemini-decision-1
  - title: "Gemini API docs: Decisions API guide"
    url: https://ai.google.dev/gemini-api/docs/decisions-api
  - title: "Gemini API docs: pricing (Gemini Decision)"
    url: https://ai.google.dev/gemini-api/docs/pricing
  - title: "Google AI Studio on X: introducing the Gemini Decisions API (11 November 2026)"
    url: https://x.com/GoogleAIStudio/status/2120581284690801060
---

Google has added a new kind of model to the Gemini API. **Gemini Decision 1** (`gemini-decision-1`) does not write text. You send it shared input and a set of typed questions, and it returns calibrated probabilities that your code can branch on directly. Google AI Studio [announced it on X](https://x.com/GoogleAIStudio/status/2120581284690801060) on the evening of 11 November, and the [model page](https://ai.google.dev/gemini-api/docs/models/gemini-decision-1), [Decisions API guide](https://ai.google.dev/gemini-api/docs/decisions-api) and pricing entry are live.

## What a call looks like

One request carries an `input` (text, images, video, audio or PDFs, up to 262,144 tokens) and up to **1,000 questions**. Each question has one of three types:

| Type | Use it for | Returns |
|---|---|---|
| `noul` (yes/no) | Does this statement hold? | A probability from 0.01 to 0.99, plus confidence |
| `choice` | Pick one of 2 to 255 options | The top option, per-option probabilities, confidence |
| `score` | Rate against 2 to 255 ordered rubric levels | A probability-weighted score, per-level probabilities, confidence |

Google's guide says every question runs against the shared input in one forward pass, questions cannot see each other, and latency "stays nearly flat" as you add more. The docs list the uses as request routing, policy checks across many rules, scoring candidates against a rubric, tool selection and low-latency classification of live media. The quickstart uses `client.decisions.create(...)` in the `google-genai` Python SDK and `@google/genai` for JavaScript, and needs SDK 3.2 or later.

## Price and limits

Output is always zero tokens, so you pay for input only: **$0.10 per million input tokens** on the paid tier, for every modality. The shared input is billed once however many questions you ask, and each question adds the tokens of its own instructions and criteria. The free tier costs nothing, but the pricing table marks free-tier data as used to improve Google's products and paid-tier data as not.

The limitations section is worth reading before you design around it:

- Gemini Developer API only, on `v1beta`.
- Question instructions are text only. Media goes in the input, not in a question.
- No YouTube URLs or `gs://` URIs. Use a Files API URI, a public or signed HTTPS URL, or inline bytes.
- No conversation history, thought or tool-call blocks as input. Serialize multi-turn context as text.
- No context caching, Batch API, or Flex or Priority inference, so repeated input is billed in full every time.
- When input safety filters fire, you get HTTP 400 with a code such as `safety` or `prohibited_content`, not answers.

## How it compares

The shape is close to OpenAI's [Decisions API](/posts/openai-decisions-api-public-beta/), which also prices input at $0.10 per million tokens and returns structured judgments instead of prose. Smaller vendors have shipped dedicated decision models too, such as [Sarvam's Prism](/posts/sarvam-prism-open-weights-decision-model/). Google's version stands out for native video, audio and PDF input and for 1,000 questions over one input in a single call. Google staff posted that it is state of the art on many benchmarks, but the docs we read publish no benchmark table, so treat that as Google's claim for now.

## Why this matters

Many agent pipelines still ask a chat model a yes/no question and parse the reply, paying for output tokens and handling formatting failures. A typed probability with a confidence score lets code send uncertain cases to a person, which is the pattern Google's guide recommends. Probabilities are not proof against manipulation, though: [HiddenLayer showed](/posts/hiddenlayer-decision-model-prompt-injection/) a decision model in a checkout agent giving a planted button 91 percent, so keep untrusted page content in mind when it feeds the input. Mind the v1beta label, and remember that free-tier inputs can be used for training.
