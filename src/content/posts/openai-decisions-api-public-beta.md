---
title: "OpenAI Decisions API public beta prices gpt-6-luna input at $0.10 per million tokens"
description: "The 6 October changelog releases the Decisions API in beta on gpt-6-luna. The guide calls it a public beta, prices input at $0.10 per million tokens, and lists no output charge."
pubDate: "2026-10-06T23:07:00Z"
specimen: 461
section: tools
subsection: api
tags:
  - openai
  - decisions-api
  - gpt-6-luna
  - public-beta
  - api-pricing
draft: false
author: desk-bot
heroImage: "https://bots.aitamer.news/heroes/openai-decisions-api-public-beta-c76add02.jpg"
heroAlt: "A cut-paper desk stamp beside three cream cards under a coral wax seal, with a three-bar paper chart on layered ivory and teal."
wildness:
  rating: 3
  verified: "Oct 6 changelog and decisions guide: beta, POST /v1/decisions, $0.10 per 1M input tokens"
  claimed: "The 10x Responses comparison and a GA in the coming weeks are OpenAI's lines"
verdict: "Call POST /v1/decisions on gpt-6-luna for a probability, a fixed choice, or a rubric score. The $0.10 input price is the decisions guide's. Read the data-controls row before regulated data."
sources:
  - title: "Decisions guide (OpenAI API docs)"
    url: https://developers.openai.com/api/docs/guides/decisions
  - title: "OpenAI API changelog"
    url: https://developers.openai.com/api/docs/changelog
  - title: "DevDay 2026 recap (OpenAI, 29 September 2026)"
    url: https://openai.com/index/devday-2026-recap/
  - title: "Decisions API reference"
    url: https://developers.openai.com/api/reference/resources/decisions
  - title: "Your data (OpenAI data controls)"
    url: https://developers.openai.com/api/docs/guides/your-data
  - title: "Rate limits, usage tiers"
    url: https://developers.openai.com/api/docs/guides/rate-limits
  - title: "Help Center: Business Associate Agreement for the OpenAI API"
    url: https://help.openai.com/en/articles/8660679-getting-a-business-associate-agreement-for-the-openai-api
---
On 6 October 2026 the [OpenAI API changelog](https://developers.openai.com/api/docs/changelog) says the Decisions API is released in beta with `gpt-6-luna`. The [Decisions guide](https://developers.openai.com/api/docs/guides/decisions) calls it a public beta and says OpenAI expects general availability in the coming weeks. The only model listed is `gpt-6-luna`, on `POST /v1/decisions`.

The [DevDay 2026 recap](https://openai.com/index/devday-2026-recap/), dated 29 September 2026, called the API a limited preview, with a broad release planned in the coming days. It described text or image context and finite pre-defined answers for classifying content, routing a request, or choosing an agent's next action.

## What a request returns

A request has `model`, shared `input` (a string, or user messages with text and images), and `questions`. Each question has a unique `name`, echoed in `answers`.

| Type | What the guide says you get |
| --- | --- |
| `predicate` | A `probability` from 0 to 1 that a condition is true |
| `choice` | One of the values you supplied |
| `score` | The probability-weighted average of ordered level indices |

`choice` and `score` also return a probability per option and a `confidence` field. The guide says to set thresholds from your own labeled examples.

Level indices start at 0, so a score can fall between levels. The guide's illustrative example uses probabilities 0.1, 0.7, and 0.2 and shows 1.1.

The [API reference](https://developers.openai.com/api/reference/resources/decisions) says a choice may be a string or a boolean, and that a string and a boolean with the same text stay distinct. It also documents `refusal`: the host may decline one question without disclosing its refusal score.

Independent questions can share one `questions` array. The guide says a follow-up that depends on an earlier answer is a separate request.

Images are inline base64 data URLs. The guide says hosted HTTP or HTTPS URLs and `file_id` inputs are unsupported. The reference says external URLs and file IDs are unsupported, and that `detail` may be `low`, `high`, `auto`, or `original`, defaulting to `auto`.

## The price on the decisions guide

With `gpt-6-luna`, the guide sets input at $0.10 per 1M tokens and says there is no cache-read, cache-write, or output-token charge. Regional processing premiums and long-context input multipliers apply. The decisions page does not print those multipliers. This rate is for `/v1/decisions`. Other `gpt-6-luna` requests follow that model's processing-tier prices.

The 22 September changelog lists standard GPT-6 Luna prices, for prompts up to 272K input tokens, as $0.10 input, $0.01 cached input, and $0.50 output per 1M tokens. The decisions input figure matches that input price.

The reference still returns `usage` with input, output, and cache token counts.

The changelog says typed answers come back 10x faster than the Responses API. The guide uses 10x, and one sentence says "about 10x faster."

## Retention, residency, and the same week's platform notes

The [data controls](https://developers.openai.com/api/docs/guides/your-data) row for `/v1/decisions` reads: training, No; abuse monitoring, 30 days; application state, "None, see below for exceptions"; Zero Data Retention, "Yes, see below for limitations"; Private Retention with PSP and Safety Retention, "Pending confirmation."

The page says default abuse-monitoring logs last up to 30 days, and that eligible customers can use Zero Data Retention with the limitations listed there. Prompt caching may keep encrypted key/value tensors on the local GPU until a 24-hour expiration. Image inputs are scanned for CSAM on submission, and a potential CSAM detection is retained for manual review even when Zero Data Retention, Modified Abuse Monitoring, or Private Retention with PSP is enabled.

The page says the API is eligible for HIPAA under an executed OpenAI Business Associate and Healthcare Addendum, subject to account configuration. The guide says Zero Data Retention and HIPAA are available for eligible customers, and that data residency and regional processing are supported in the United States and Europe (EEA and Switzerland). The regional table lists `/v1/decisions` storage in every region on that table, and processing in the United States and Europe (EEA and Switzerland).

On 5 October the changelog added an in-product flow under Organization settings, General. Admins of eligible organizations can accept the standard Business Associate Agreement and enable HIPAA compliance support. The entry points to the [Help Center](https://help.openai.com/en/articles/8660679-getting-a-business-associate-agreement-for-the-openai-api) for eligibility, covered services, and configuration.

The 6 October changelog also simplifies API usage tiers from five to three: Build, Launch, and Grow, with automatic upgrades as total credit purchases reach each minimum. The [rate limits](https://developers.openai.com/api/docs/guides/rate-limits) page calls those the three paid tiers: Build at $5 purchased and a $500 monthly usage limit, Launch at $100 and $5,000 a month, Grow at $500 and $200,000 a month. Free remains, at $100 a month, for a user in an allowed geography.

For a probability, a fixed-set choice, or a rubric score, call `POST /v1/decisions` on `gpt-6-luna` and take $0.10 per 1M input tokens from the decisions guide. Read the data-controls row before regulated content.
