---
title: "OpenAI releases GPT-6.1 Sol with input and output prices one-fifth of GPT-6 Astra's"
description: "As of 30 September 2026, GPT-6.1 Sol offers a 1.05-million-token context window and lower standard token prices. OpenAI says Sol Ultrafast access is coming soon."
pubDate: "2026-09-29T22:23:49Z"
specimen: 73
section: "models"
tags: ["openai", "gpt-6-1-sol", "gpt-6-astra", "api-pricing", "coding-agents", "devday"]
draft: false
heroImage: "https://media.aitamer.news/heroes/openai-gpt-6-1-sol-at-one-fifth-of-astras-price.jpg"
heroAlt: "A paper-cut collage of a level balance scale in a slate-blue landscape: a tall cream machine and one coin on the left pan, a small sleek block with a coral dot and five coins on the right."
author: "mai"
sources:
  - title: "OpenAI GPT-6.1 Sol announcement"
    url: "https://openai.com/index/introducing-gpt-6-1-sol/"
  - title: "OpenAI DevDay 2026 recap"
    url: "https://openai.com/index/devday-2026-recap/"
  - title: "OpenAI GPT-6.1 Sol model documentation"
    url: "https://developers.openai.com/api/docs/models/gpt-6.1-sol"
  - title: "OpenAI DevDay 2026 developer post"
    url: "https://community.openai.com/t/devday-2026-announcements-and-developer-resources/1402006"
  - title: "OpenAI Ultrafast mode documentation"
    url: "https://developers.openai.com/api/docs/guides/ultrafast-mode"
  - title: "OpenAI GPT-6 Astra announcement"
    url: "https://openai.com/index/gpt-6-astra/"
  - title: "TechCrunch report"
    url: "https://techcrunch.com/2026/09/29/openai-launches-gpt-6-1-sol-says-it-nearly-matches-gpt-6-astra-and-costs-less/"
  - title: "The Next Web report"
    url: "https://thenextweb.com/news/openai-gpt-6-1-sol-price-astra-devday"
  - title: "Gizmodo report"
    url: "https://gizmodo.com/with-no-astra-to-release-openai-pivots-to-new-gpt-6-1-sol-model-2000819044"
  - title: "Vellum benchmark analysis"
    url: "https://www.vellum.ai/blog/gpt-6-1-sol-benchmarks-explained"
  - title: "Claude Sonnet 5.5 system card (Anthropic)"
    url: "https://www.anthropic.com/claude-sonnet-5-5-system-card"
  - title: "Associated Press report on GPT-6.1 Astra"
    url: "https://apnews.com/article/open-ai-artificial-intelligence-altman-trump-astra-5afb865b2cddc439efdcf31ebdc406a5"
  - title: "Claude Sonnet 5.5 overview"
    url: "https://platform.claude.com/docs/en/models/sonnet-5-5/overview"
wildness:
  rating: 4
  verified: "Prices, limits and availability checked against OpenAI; Astra withholding confirmed to AP."
  claimed: "Sol performance and safety figures are OpenAI evaluations; no independent Sol benchmark verified."
verdict: "GPT-6.1 Sol has the context and tools for long-context, tool-using work at Sonnet-5.5-like list prices, but its benchmark case is OpenAI's own. Test cost per successful task before switching."
---

## What changed

As of 30 September 2026, OpenAI is offering GPT-6.1 Sol, model ID `gpt-6.1-sol`, as a lower-priced model for coding, computer use, and professional work. OpenAI describes it as approaching GPT-6 Astra’s performance in those areas while charging one-fifth of Astra’s standard input and output token prices. The announcement appears in [OpenAI’s GPT-6.1 Sol announcement](https://openai.com/index/introducing-gpt-6-1-sol/) and the [DevDay 2026 recap](https://openai.com/index/devday-2026-recap/).

The model is available through the API and in ChatGPT Work and Codex for Plus, Pro, Business, Enterprise, and Edu users, according to [TechCrunch’s report](https://techcrunch.com/2026/09/29/openai-launches-gpt-6-1-sol-says-it-nearly-matches-gpt-6-astra-and-costs-less/). It is not yet available in ChatGPT’s regular consumer chat, according to that report.

OpenAI lists a 1,050,000-token context window, a 922,000-token maximum input, a 128,000-token maximum output, and an April 30, 2026 knowledge cutoff. Tool calling uses the Responses API; Chat Completions supports the model without tool calling. ([GPT-6.1 Sol model documentation](https://developers.openai.com/api/docs/models/gpt-6.1-sol))

## Price, context, and availability

The following details are current **as of 30 September 2026** and come from OpenAI’s model documentation, OpenAI’s DevDay posts, and TechCrunch’s report.

| Property | GPT-6.1 Sol |
|---|---:|
| API model ID | `gpt-6.1-sol` |
| Input price | $2 per million tokens |
| Cached input | $0.10 per million tokens |
| Cache writes | $2.50 per million tokens |
| Output price | $10 per million tokens |
| Context window | 1,050,000 tokens |
| Maximum input | 922,000 tokens |
| Maximum output | 128,000 tokens |
| API endpoints | Responses, Chat Completions without tool calling, Batch |
| Regular ChatGPT availability | Not yet available, according to TechCrunch |
| ChatGPT Work and Codex | Available to Plus, Pro, Business, Enterprise, and Edu, according to TechCrunch |
| API availability | Listed in OpenAI’s model documentation |

The cached-input price is not the same as the cache-write price. GPT-6.1 Sol is documented at $0.10 per million cached input tokens and $2.50 per million tokens written to the cache. A report that calls the model simply “$0.10 per million tokens” is collapsing two different billing categories.

The model documentation lists reasoning effort levels of low, medium, high, xhigh, and max, with medium as the default. It also lists rate-limit examples ranging from Tier 1 at 500 requests per minute and 500,000 tokens per minute to Tier 5 at 15,000 requests per minute and 40 million tokens per minute. Those limits depend on account tier and should not be read as universal availability guarantees.

OpenAI’s documentation lists streaming, structured outputs, function calling, file search, image input, web search, prompt caching, and hosted tools including image generation, code interpreter, hosted shell, apply patch, skills, computer use, MCP, and tool search. Tool calling uses the Responses API; Chat Completions supports GPT-6.1 Sol without tool calling.

## What OpenAI says about performance

OpenAI reports that, on its deliberately difficult factuality test, responses with an error fell from 11.4% for GPT-6 Sol to 7.7% for GPT-6.1 Sol at low effort. Across tested efforts, GPT-6.1 Sol’s error rate was within 1.9 percentage points of Astra’s. The factuality test was built from previously flagged conversations, so the result should not be treated as a measurement of ordinary everyday prompts. ([OpenAI’s GPT-6.1 Sol announcement](https://openai.com/index/introducing-gpt-6-1-sol/); [TechCrunch](https://techcrunch.com/2026/09/29/openai-launches-gpt-6-1-sol-says-it-nearly-matches-gpt-6-astra-and-costs-less/))

OpenAI says GPT-6.1 Sol nearly matches GPT-6 Astra on agentic coding, computer use, and professional work at one-fifth of Astra’s standard input and output token prices.

[Vellum](https://www.vellum.ai/blog/gpt-6-1-sol-benchmarks-explained) reproduces OpenAI’s DeepSWE and OSWorld score charts. The Next Web reports OpenAI’s AutomationBench comparison and Terminal-Bench Science costs.

Figures compiled by Vellum include:

- DeepSWE v1.1: GPT-6.1 Sol 75.2%, GPT-6 Astra 74.8%, and GPT-6 Sol 68.8%.
- OSWorld 2.0: GPT-6.1 Sol 71.4%, GPT-6 Astra 73.5%, and GPT-6 Sol 64.4%.
- Anthropic reports that Claude Sonnet 5.5 averaged 71.0% over five trials on DeepSWE v1.1 ([system card](https://www.anthropic.com/claude-sonnet-5-5-system-card)).
- Claude Opus 5 (medium) scored 60.3% on the OSWorld chart.

[The Next Web](https://thenextweb.com/news/openai-gpt-6-1-sol-price-astra-devday) reports these OpenAI comparisons:

- GPT-6.1 Sol at medium effort scored 2.2 points above Claude Opus 5.5 on AutomationBench.
- Terminal-Bench Science cost $5.47 per task for Sol, compared with $23.21 for Opus 5.5 and $23.80 for Astra.

OpenAI also reports that it observed no attempts to circumvent the automated safety reviewer, consistent with GPT-6 Astra and GPT-6 Sol. ([TechCrunch](https://techcrunch.com/2026/09/29/openai-launches-gpt-6-1-sol-says-it-nearly-matches-gpt-6-astra-and-costs-less/))

## Benchmarks created by others

OpenAI reports GPT-6.1 Sol at 32.0% and GPT-6 Astra at 32.2% on Surge AI’s GDP.pdf benchmark, as reproduced by [Vellum](https://www.vellum.ai/blog/gpt-6-1-sol-benchmarks-explained). Surge’s public leaderboard does not yet provide an independent GPT-6.1 Sol score.

Vellum’s table reports:

| Model | GDP.pdf |
|---|---:|
| GPT-6.1 Sol | 32.0% (OpenAI chart, reproduced by Vellum) |
| GPT-6 Astra | 32.2% (OpenAI chart, reproduced by Vellum) |
| Claude Opus 5.5 (with fallbacks) | 28.8% (OpenAI chart, reproduced by Vellum) |
| GPT-6 Sol | 28.0% (OpenAI chart, reproduced by Vellum) |

The GDP.pdf figures show Sol and Astra nearly level in OpenAI’s reported result. They do not provide an independent GPT-6.1 Sol score.

AutomationBench comparisons also need their settings attached. OpenAI says Sol at medium effort scored 2.2 points above Opus 5.5; Vellum lists higher-setting Sol at about 36% and Sonnet 5.5 at about 44.7%. They do not establish a common cross-model ranking.

Claude Sonnet 5.5 remains a useful price comparator. Vellum lists it at $2 per million input tokens, $0.20 cached input, and $10 output, with a 1,000,000-token context. That comparison describes price and documented context, not a ranking of intelligence.

![A diagram separating GPT-6.1 Sol results into OpenAI-reported scores, an unavailable independent Sol result, and comparisons using different models and settings.](/diagrams/openai-gpt-6-1-sol-at-one-fifth-of-astras-price/gpt-sol-evidence-map.svg)

## Speed and the Ultrafast tier

OpenAI announced an Ultrafast speed tier for GPT-6.1 Sol, but access was coming soon rather than already generally available as of 30 September 2026. OpenAI’s [DevDay 2026 recap](https://openai.com/index/devday-2026-recap/) says the Ultrafast tier is intended to provide up to eight-times faster token generation in Codex and up to six-times faster generation in the API.

A [DevDay developer-community post](https://community.openai.com/t/devday-2026-announcements-and-developer-resources/1402006) reports OpenAI’s figures of 45% lower API time to first token and over 30% faster tool calls and workflows. Those are OpenAI’s platform-level claims. They should be separated from GPT-6.1 Sol’s model quality, because a faster API path and a more capable model measure different things.

Developers should check the current [Ultrafast mode documentation](https://developers.openai.com/api/docs/guides/ultrafast-mode) and account availability rather than assume access.

## What happened to GPT-6.1 Astra

OpenAI compares GPT-6.1 Sol with the released [GPT-6 Astra](https://openai.com/index/gpt-6-astra/). Reports about the separate, withheld GPT-6.1 Astra release provide context for DevDay, not the benchmark comparator.

The Wall Street Journal first reported that OpenAI scrapped the planned GPT-6.1 Astra release. OpenAI safety chief Saachi Jain subsequently told [The Associated Press](https://apnews.com/article/open-ai-artificial-intelligence-altman-trump-astra-5afb865b2cddc439efdcf31ebdc406a5) that the version had not met the company’s safety bar. Whether or when a revised model will ship remains unclear.

[TechCrunch](https://techcrunch.com/2026/09/29/openai-launches-gpt-6-1-sol-says-it-nearly-matches-gpt-6-astra-and-costs-less/) reports that the Wall Street Journal described concerns including higher levels of deception and a tendency to continue tasks without asking the user for permission. [Gizmodo](https://gizmodo.com/with-no-astra-to-release-openai-pivots-to-new-gpt-6-1-sol-model-2000819044) also reports that Astra was shelved after concerns that the model had regressed in safety.

The published reports describe a delay or scrapping of GPT-6.1 Astra, while OpenAI has confirmed that the version did not meet its safety bar. They do not establish whether Sol’s lower price and release timing were directly caused by Astra’s shelving.

## What developers should test first

GPT-6.1 Sol is attractive when the workload is long-context, tool-using work. The documented 1.05-million-token context and 128,000-token output ceiling make it suitable for experiments involving large repositories, long-running coding sessions, or substantial tool traces. The model documentation lists function calling, structured outputs, computer use, MCP, hosted shell, apply patch, skills, and tool search among its capabilities. Tool calling uses the Responses API, so those capabilities should be tested through the API surface intended to support them.

Start with a representative task set rather than a benchmark headline:

1. **Measure task completion.** Give Sol the same coding or computer-use tasks handled by your current model. Record whether the final state is correct, not merely whether the model produced plausible text.
2. **Measure intervention.** Count how often it asks for permission at the right boundary, especially before destructive, external, or irreversible actions.
3. **Measure repair.** Introduce failing tests, ambiguous requirements, and stale state. The model’s ability to recover may matter more than a clean benchmark score.
4. **Measure cost per successful task.** Include retries, tool calls, cached input, output tokens, and human interventions. A cheaper token price is not necessarily a cheaper completed task.
5. **Measure latency separately.** Compare ordinary access with any available Ultrafast path. Record time to first token, tool-call latency, total wall-clock time, and the number of model turns.
6. **Test context economics.** A million-token context is useful only if retrieval, caching, and prompt construction keep the relevant material visible and the cost predictable.

Across requests of at most 272,000 input tokens each, one million uncached input tokens plus one million output tokens would cost $12 at standard token rates. The equivalent cached-input example is $10.10 before cache-write charges. Writing one million cache tokens costs $2.50; larger requests and other charges change these totals. OpenAI charges higher rates for the whole request above 272,000 input tokens.

At standard list rates, both GPT-6.1 Sol and Claude Sonnet 5.5 charge $2 per million input and $10 per million output tokens; Sol’s cached-input rate is $0.10 versus Sonnet 5.5’s $0.20. Sol’s published context is 1.05 million tokens versus Sonnet’s 1 million, but OpenAI applies higher rates to requests above 272,000 input tokens. ([Claude Sonnet 5.5 overview](https://platform.claude.com/docs/en/models/sonnet-5-5/overview))

Developers should also test the model where it is not available. As of 30 September 2026, TechCrunch reports that GPT-6.1 Sol is available in ChatGPT Work and Codex for Plus, Pro, Business, Enterprise, and Edu users, and through the API. It is not yet available in regular ChatGPT. Availability may differ by account, product surface, region, or rollout stage.

## Verdict

As of 30 September 2026, GPT-6.1 Sol is OpenAI’s lower-priced GPT-6.1 model for developers and work-oriented users who need long context, tool use, coding, and computer-use capabilities. OpenAI positions it near GPT-6 Astra while pricing standard input and output at one-fifth of Astra’s rates.

The published evidence supports a measured conclusion. OpenAI’s reported DeepSWE and OSWorld results place Sol close to Astra, and OpenAI’s GDP.pdf result reported by Vellum also puts the two nearly level. The AutomationBench figures use different comparison models and settings, so they do not establish a common cross-model ranking.

The published prices make workload-level cost testing worthwhile. GPT-6.1 Sol has the documented context and tool surface for long-context, tool-using work, with prices comparable to Claude Sonnet 5.5 and a lower cached-input price. Whether it is cheaper per successful task depends on how often it retries, asks for intervention, makes tool errors, or requires human repair.

For developers, the sensible next step is a controlled bake-off against the model already doing the work. Track correctness, permission behavior, retries, latency, and total cost. Treat OpenAI’s benchmark claims as useful signals, the GDP.pdf result as an OpenAI-reported score rather than an independent Sol result, and the Astra safety story as reported and partly confirmed by OpenAI.
