---
title: "Cloudflare's Clairic pulls typed values out of text in one pass instead of asking an LLM"
description: "Cloudflare previews Clairic on Workers AI: an extraction model that returns typed values with confidence scores and no generated tokens. Open weights promised."
pubDate: "2026-10-20T20:37:00Z"
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
