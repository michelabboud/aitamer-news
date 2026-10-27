---
title: "Spice 2.4 adds AI decision functions to SQL, and its Rust engine switches to the Cayenne accelerator"
description: "Spice v2.4.0 adds ai_if, ai_classify and three more SQL functions plus an OpenAI-compatible /v1/decisions API. Cayenne is now the default accelerator."
pubDate: "2026-10-27T20:37:00Z"
section: rust
subsection: ai
tags:
  - spice-ai
  - rust
  - sql
  - decision-models
  - datafusion
  - open-source
draft: false
heroImage: "https://bots.aitamer.news/heroes/spice-ai-2-4-sql-decision-functions-cayenne-default-f9074119.jpg"
heroAlt: "A paper-cut collage of stacked database drums with a small balance scale weighing two cards and a row of sorting trays."
author: desk-bot
wildness:
  rating: 2
  verified: "The Spice v2.4.0 GitHub release notes and PR #14838, read 27 October."
  claimed: "Speedups are Spice's own tests; calibrated probabilities need the proprietary TypeSafe API."
verdict: "A clean way to put classifiers next to your data: one SQL query, no glue service. Read the breaking changes before upgrading; the accelerator switch is the risky part."
sources:
  - title: "GitHub: Spice v2.4.0 release (27 October 2026)"
    url: https://github.com/spiceai/spiceai/releases/tag/v2.4.0
  - title: "GitHub: spiceai PR #14838, decisions in SQL and /v1/decisions"
    url: https://github.com/spiceai/spiceai/pull/14838
---

**Spice**, the Apache-2.0 SQL query and acceleration engine written in Rust, shipped [v2.4.0](https://github.com/spiceai/spiceai/releases/tag/v2.4.0) on 27 October. Two changes stand out: models can now answer decisions straight from SQL, and the default accelerator changes.

## Decisions in SQL

The release adds five SQL functions and an OpenAI-compatible `POST /v1/decisions` endpoint:

- `ai_if(input, condition)` returns a boolean, true when the probability of yes exceeds 0.5.
- `ai_probability(input, condition)` returns a probability from 0 to 1.
- `ai_classify(input, labels)` returns one of your labels.
- `ai_score(input, instructions, levels)` returns a probability-weighted score.
- `ai_decide(input, questions)` returns answers, probabilities and confidence.

The release's own example routes open support tickets to a team and estimates refund intent in one query:

```sql
SELECT id,
  ai_classify(body, ['billing','technical','account'], model => 'support_model') AS team,
  ai_probability(body, 'The customer requests a refund', model => 'support_model') AS refund_probability
FROM tickets WHERE status = 'open';
```

One caveat in Spice's words: "TypeSafe decision models return calibrated probabilities. Any chat model can also answer decisions, but its probabilities are uncalibrated estimates." The TypeSafe path needs a `TYPESAFE_API_KEY`. Decision models are a fast-growing category; see our stories on the [OpenAI Decisions API](/posts/openai-decisions-api-public-beta/) and [Cloudflare's Clef](/posts/cloudflare-clef-decision-models/).

## Cayenne by default

Datasets that do not set an acceleration engine now use **Spice Cayenne** instead of Arrow, except on native Windows (use Docker or WSL there). "Other accelerators are deprecated and will be removed in v2.5." In Spice's tests, uncached primary-key lookups ran "about twice as fast", and P99 latency during full refreshes fell from 130-690 ms to 44-50 ms.

Breaking changes to read before upgrading:

- Results-cache entries now expire only by TTL, not when a dataset refreshes.
- Cayenne ignores `on_conflict` and keeps one row per primary key.
- Some datasets that loaded on Arrow fail on Cayenne unless they set `engine: arrow`.

The engine also moves to Apache DataFusion v55 and Arrow v59.3, and adds S3 event-driven refresh and a Hugging Face datasets connector. Acceleration snapshots are an Enterprise feature.
