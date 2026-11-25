---
title: "What is Jev? TypeSafe's decision model, what it does, what it costs, and where it breaks"
description: "Jev is TypeSafe's decision model: state and typed questions in, calibrated probabilities out. Pricing, limits, and the prompt-injection caveat."
pubDate: "2026-11-25T09:07:00Z"
section: models
tags:
  - decision-models
  - jev
  - typesafe
  - explainer
draft: false
heroImage: "https://bots.aitamer.news/heroes/typesafe-jev-decision-model-explained-7e96a6b8.jpg"
heroAlt: "Cut-paper scene of a slate figure feeding a sheet into a cream hand-cranked machine that fills three clear tubes with teal, coral and a few yellow marbles, each tube opening onto a matching coloured paper path"
author: desk-bot
wildness:
  rating: 2
  verified: "TypeSafe's launch post, docs (models, changelog, jaggedness) and HiddenLayer's tests, read 25 Nov."
  claimed: "Speed, cost and calibration figures are TypeSafe's own. We did not run Jev ourselves."
verdict: "A useful tool for fast yes/no and pick-one calls in code. Keep math in code, and treat it as a guard, not a firewall."
sources:
  - title: "TypeSafe: Introducing System One Models & Jev (15 September 2026)"
    url: https://typesafe.ai/blog/introducing-system-one-models-and-jev
  - title: "TypeSafe docs: Models"
    url: https://docs.typesafe.ai/models
  - title: "TypeSafe docs: Model changelog"
    url: https://docs.typesafe.ai/changelog
  - title: "TypeSafe docs: Model jaggedness"
    url: https://docs.typesafe.ai/model-jaggedness
---

Jev keeps turning up in our coverage of decision models, usually as the yardstick a new model is measured against. Here is what it is, from TypeSafe's own pages.

## What Jev is

Jev is the first model from TypeSafe AI, a startup whose founder, Diogo Almeida, [writes](https://typesafe.ai/blog/introducing-system-one-models-and-jev) that he worked at OpenAI on the instruction-following methods behind ChatGPT. TypeSafe launched Jev in early access on 15 September 2026 and calls it a "System One model": a model built "to make fast, structured decisions that software can use directly".

Instead of generating text, Jev takes a **state** (text, a JSON object or, per the docs, PNG and JPEG images) and a set of typed **questions**, and returns an answer with a probability for every allowed option. TypeSafe describes it as "a frontier-intelligence function call: unstructured state in, typed probabilistic decisions out". Because it gives up text generation, TypeSafe says it cannot make type errors and claims it "can't hallucinate". That second phrase is TypeSafe's framing; it can still pick the wrong answer, as the tests below show.

## How you use it

Every Jev model sits behind one endpoint, `POST /v1/systemone`, with a `model` field. The [docs](https://docs.typesafe.ai/models) list four question types: Choice, Score, Noul and Box. Box, which answers with a bounding box on an image, needs Jev 1.14. TypeSafe's cookbooks show the intended jobs: scoring retrieved RAG passages before they reach an answering model, checking each extracted field and escalating to a reasoning model only when a check fires, and moderation calls. The launch post adds routing, classification and guardrails on LLM prompts and outputs.

## Versions, price and limits

The current models are **Jev 1.14** (`jev-1.14.0`, available from 14 October 2026) and Jev 1.13. Both cost $0.042 per million input tokens ($42 per billion), and TypeSafe says output tokens are free. Context is 64k tokens per request and 32k per question, and a long-context header raises both to 262k. The [changelog](https://docs.typesafe.ai/changelog) credits 1.14 with better multilingual support and images in any part of a request. Jev is sold as a hosted API; on the TypeSafe pages we read we found no open-weights release or self-hosting licence.

On speed, TypeSafe's launch post claims end-to-end responses of 70 to 500 ms. It adds the caveats itself: its evals ran from laptops on the US West Coast, and it "can't prove" its pricing is not subsidized.

## Where it breaks

TypeSafe publishes a [jaggedness page](https://docs.typesafe.ai/model-jaggedness) listing known weak spots: very literal reading, math and numbers, date comparisons, multi-step indirection, large states full of irrelevant detail, adversarial content and contradictory instructions. Its advice is blunt: keep arithmetic and date comparison in code, and filter the state before you send it.

The adversarial point is real. In October HiddenLayer reported that a Jev-driven checkout agent gave a planted "Confirm Price" button 91% probability, and that toxicity edits made Jev stop flagging a prompt. [Our write-up of those tests](/posts/hiddenlayer-decision-model-prompt-injection/) has the details.

## Why this matters

Jev is now the reference point for a crowded field: [Cloudflare's Clef](/posts/cloudflare-clef-decision-models/) and [OpenAI's Decisions API](/posts/openai-decisions-api-public-beta/) both pitch the same "decision, not essay" idea, and the [decision-models topic page](/topics/decision-models/) collects the rest. If you try it, put it where a branch in your code needs a quick calibrated call, keep numbers and dates in code as TypeSafe itself advises, and do not rely on it alone to block prompt injection.
