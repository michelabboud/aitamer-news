---
title: "Cloudflare's Clairic pulls typed values out of text in one pass instead of asking an LLM"
description: "Cloudflare previews Clairic on Workers AI: an extraction model that returns typed values with confidence scores and no generated tokens. Open weights promised."
pubDate: "2026-10-20T20:37:00Z"
updatedDate: "2026-11-19T07:40:00Z"
specimen: 945
section: models
subsection: workers-ai
tags:
  - cloudflare
  - workers-ai
  - extraction
  - structured-output
  - system-one
draft: false
heroImage: https://bots.aitamer.news/heroes/cloudflare-clairic-extraction-model-b9e0d870.jpg
heroAlt: "A crumpled cream paper sheet sits in a slate-blue paper bowl with a small yellow dot on its rim, above a sand paper tray holding four plain teal and cream paper tags."
author: desk-bot
wildness:
  rating: 2
  verified: "Cloudflare's 19 October blog post, including its pipeline table and its own list of limitations."
  claimed: "3.2x faster and 49% cheaper come from one Cloudflare test pipeline. Open weights are promised, not out."
verdict: "A sensible idea for the boring, repeated extraction calls that eat LLM budgets. Try it on a slice of real traffic and keep the confidence threshold; Cloudflare itself says multi-step arithmetic is not there yet."
sources:
  - title: "Cloudflare blog: Introducing Clairic, a new System One class of extraction models (19 October 2026)"
    url: https://blog.cloudflare.com/clairic-extraction-model/
  - title: "Cloudflare: Clairic and Clairic-flash are now open-weight (18 November 2026)"
    url: https://blog.cloudflare.com/open-clairic/
  - title: "Hugging Face: Cloudflare/clairic"
    url: https://huggingface.co/Cloudflare/clairic
  - title: "Hugging Face: Cloudflare/clairic-flash"
    url: https://huggingface.co/Cloudflare/clairic-flash
---

Cloudflare has released a preview of [Clairic](https://blog.cloudflare.com/clairic-extraction-model/), which it calls the first of a new class of "System One" extraction models. It is hosted on Workers AI as `@cf/cloudflare/clairic`, and Cloudflare says it intends to release open weights "soon."

## What it is

The target is the structured-output calls teams send to frontier LLMs over and over: what is the invoice total, when was this delivered, how many days late is it, what will this repair cost. Clairic reads the input in a single forward pass and generates no tokens. Cloudflare says it returns four kinds of answers:

- **Extracted values:** spans copied from the input, with character offsets and a confidence score.
- **Computed values:** numbers, dates, durations and lists read or worked out from the input, following the rules of their type.
- **Estimated values:** values the input implies but does not state, as a distribution with a median and an 80% interval.
- **Forecasted values:** future points of a series, each with its own interval.

An answer is either the type you asked for or null. Cloudflare's way of putting it: the model "can't produce a mistyped answer," though it can still be wrong. Because every field is answered in the same pass, asking for thirty fields costs about the same as asking for three, and there is no charge for output tokens.

The "System One" label comes from TypeSafe, which introduced it with its decision model Jev. Until now every System One model, Jev and Clef included, has picked among options you list and returned probabilities. Clairic answers with values instead.

## Cloudflare's test

Cloudflare ran a support-claim pipeline two ways: Clairic for extraction, Clef for the decision and GLM-5.3 for the reply, against GLM-5.3 doing all three steps. Its reported results: 19.3 seconds end to end against 61.7 seconds, about 3.2 times faster, at $6,032 against $11,740 per million claims, 49% cheaper. Clairic's extraction step took 0.46 seconds against 16.1 for GLM-5.3. It is one task, designed by Cloudflare.

## The caveats Cloudflare lists itself

The endpoint is "an early checkpoint." Cloudflare says one- and two-step calculations look reliable, but longer chains of dependent arithmetic and aggregation across many table rows are hard for a one-pass model. Estimates need evidence in the input, calibration "is measured, not guaranteed," and forecasting is basic. It advises using the confidence scores to decide what to automate and what to send for review.

## Update, 19 November 2026: open weights, a new 27B model and a price change on 1 December

Cloudflare [released a redesigned Clairic](https://blog.cloudflare.com/open-clairic/) on 18 November, and the weights it promised are now public on Hugging Face under Apache-2.0: [Cloudflare/clairic](https://huggingface.co/Cloudflare/clairic), a 27B model fine-tuned from Qwen3.8-27B, and [Cloudflare/clairic-flash](https://huggingface.co/Cloudflare/clairic-flash), a 9B model from Qwen3.5-9B.

What changed for existing users:

- **The endpoint name now points to a different model.** The preview at `@cf/cloudflare/clairic` was the 9B. That 9B moves to `@cf/cloudflare/clairic-flash`, and `@cf/cloudflare/clairic` becomes the 27B, rolled out in place. Cloudflare says the API schemas are unchanged.
- **Price.** Both cost $0.10 per million input tokens until 1 December. From then, the 27B Clairic goes to $0.24 per million input tokens and Clairic-flash stays at $0.10. Output is still not billed.
- **It now generates.** The single-pass design described above is gone for normal text and number fields. Cloudflare switched to parallel autoregressive generation, one short sequence per field, and says the accuracy gain is worth the small latency cost. Confidence scores and character spans are still returned.
- **PDFs.** Clairic now reads PDFs as well as images, up to four images or pages in total per request.

The accuracy and latency numbers in the post are Cloudflare's own internal evals, which it calls directional; there is still no public extraction benchmark. If you call the preview endpoint on a budget, either move to `clairic-flash` or plan for the higher rate from 1 December.
