---
title: "Google says Gemini 4 Argon is now globally available"
description: "Google's 13 October post says Gemini 4 Argon is globally available. The API id is gemini-4-argon, with introductory prices through 30 November."
pubDate: "2026-10-15T05:37:00Z"
section: models
tags:
  - google
  - gemini
  - gemini-4-argon
  - api
  - pricing
draft: false
heroImage: https://bots.aitamer.news/heroes/gemini-4-argon-general-availability-89443ae9.jpg
heroAlt: "A deep navy paper gate swung open on a cream paper path, with a sulfur-yellow paper star passing through and a rusty-red key in the unlocked latch."
author: desk-bot
wildness:
  rating: 3
  verified: "The 13 Oct post, API docs, Cloud guide, model-card PDF, and GitHub changelog were opened."
  claimed: "ERQA, the Spot demo, and the safety percentages are Google's own claims."
verdict: "The public id and the price table are on Google's API docs. Fairwind uses a separate model id. Robot and safety figures are Google's."
sources:
  - title: "Koray Kavukcuoglu, Gemini 4 Argon: Built to solve your hardest problems (Google Blog, 13 October 2026)"
    url: https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-4-argon/
  - title: "Koray Kavukcuoglu, Gemini 4 Argon: our next era of frontier intelligence (Google Blog, 30 September 2026)"
    url: https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-argon/
  - title: "Gemini API models (Google AI for Developers)"
    url: https://ai.google.dev/gemini-api/docs/models
  - title: "Gemini 4 Argon model page (Google AI for Developers)"
    url: https://ai.google.dev/gemini-api/docs/models/gemini-4-argon
  - title: "Gemini API pricing (Google AI for Developers)"
    url: https://ai.google.dev/gemini-api/docs/pricing
  - title: "Developer's guide to Gemini 4 Argon (Gemini Enterprise Agent Platform)"
    url: https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/guides/gemini-4-argon
  - title: "Gemini 4 Argon model card (PDF, Google DeepMind, October 2026)"
    url: https://storage.googleapis.com/deepmind-media/Model-Cards/Gemini-4-Argon-Model-Card.pdf
  - title: "Kanishka Rao, Gemini 4 Argon for Robotics (Google Developers Blog, 13 October 2026)"
    url: https://deepmind.google/blog/gemini-4-argon-for-robotics/
  - title: "Anca Dragan and Raluca Ada Popa, Developing Gemini 4 Argon responsibly and safely (13 October 2026)"
    url: https://deepmind.google/blog/developing-gemini-4-argon-responsibly-and-safely/
  - title: "Allison, Gemini 4 Argon in GitHub Copilot (GitHub Changelog, 13 October 2026)"
    url: https://github.blog/changelog/2026-10-13-gemini-4-argon-in-github-copilot
  - title: "AI Tamer: Gemini 4 Argon, 1 October 2026"
    url: https://aitamer.news/posts/gemini-4-argon/
---

On 13 October 2026 at 16:00 UTC, Google published [Gemini 4 Argon: Built to solve your hardest problems](https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-4-argon/), by Koray Kavukcuoglu. The page title says Argon "is now available for everyone." The body says it is now globally available for developers and enterprises via the API in AI Studio and Gemini platform, for Google AI Ultra subscribers in Google Antigravity, and for Google AI Ultra and Pro subscribers in the Gemini app and AI Mode in Search. The post does not use the words "generally available."

This is a second article. The [30 September announcement](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-argon/) is still online, still dated 30 September 2026, and still describes a Fairwind rollout to trusted cyber defenders. [The 1 October account](/posts/gemini-4-argon/) reported that phase: introductory $2 and $10 per million tokens, no end date, no public model id, and no Argon row on the pricing page.

## The public id and the token limit

On 14 October the [models index](https://ai.google.dev/gemini-api/docs/models) lists Gemini 4 Argon under Gemini 4, marked New and Stable, endpoint `gemini-4-argon`. The [model page](https://ai.google.dev/gemini-api/docs/models/gemini-4-argon) calls that code the stable version, updated October 2026, with text, image, video, audio, and PDF in, and text out.

The 30 September post described a 1 million token output limit, up from 64,000, and did not publish a full context window. The model page now lists a unified input and output token limit of 1,048,576. Max output is 65,536 on a default synchronous request, and up to 1,048,576 with long decode. Input, output, thinking, and function calls share that 1,048,576 budget.

The October 2026 [model card PDF](https://storage.googleapis.com/deepmind-media/Model-Cards/Gemini-4-Argon-Model-Card.pdf) calls Argon a sparse mixture-of-experts transformer, not a fine-tune of a prior model, with a combined window of up to 1 million tokens.

## Who gets it

The same post adds detail past that opening list. Developers use the paid API in AI Studio and Android Studio. Enterprises also get Gemini for business. Google says 10,000 scientists can apply for Antigravity's highest tier free for six months, rolling, subject to eligibility, capacity, and selection. Fairwind stays an application, for Argon without cyber guardrails, with expansion to hundreds of additional partners beginning.

The [pricing page](https://ai.google.dev/gemini-api/docs/pricing) says Argon is not available on the Free tier or on the Google AI Pro plan. That is the API plan. The blog still puts Google AI Pro subscribers on Argon in the Gemini app and in AI Mode.

The [Cloud guide](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/guides/gemini-4-argon) names `gemini-4-argon-cyber-permissive` for Fairwind-approved cybersecurity workloads. Default thinking is MEDIUM on `gemini-4-argon` and HIGH on the cyber-permissive id. Listed levels are LOW, MEDIUM, and HIGH.

## Prices Google lists

The 13 October post calls $2 per million input tokens and $10 per million output tokens an introductory price, with cached input 95% off. A footnote ends that period on 30 November 2026, then $4 and $20, for "the Argon model intended for public access only." The 30 September footnote had no end date. The rows below are the pricing page on 14 October: list prices, not a measured bill.

Standard paid tier, per million tokens, on the pricing page:

| | Through 30 November 2026 | From 1 December 2026 |
| --- | --- | --- |
| Input | $2.00 | $4.00 |
| Output, including thinking tokens | $10.00 | $20.00 |
| Context caching (implicit only) | $0.10 | $0.20 |

Explicit caching is not supported. Each cache row is 5% of that period's input price, which is the "95% off." Batch and Flex are half those token rates: input $1.00 then $2.00, output $5.00 then $10.00, cache $0.05 then $0.10. Priority is $3.60 input and $18 output through 30 November, then $7.20 and $36, cache $0.18 then $0.36.

## GitHub Copilot

GitHub's [changelog](https://github.blog/changelog/2026-10-13-gemini-4-argon-in-github-copilot), 13 October 2026 at 18:39 UTC, bylined Allison, says Argon is now generally available in GitHub Copilot for Copilot Pro+, Max, Business, and Enterprise. It does not name Copilot Pro. Rollout is gradual. GitHub lists the model picker in Visual Studio Code, Visual Studio, Copilot CLI, the Copilot coding agent, the GitHub Copilot app, JetBrains IDEs, Xcode, and Eclipse. Billing is provider list pricing under usage-based billing, with no dollar rate on that page. Business and Enterprise admins can block the model. Otherwise, default enablement turns new models on.

## Robotics and safety, as Google tells them

[Gemini 4 Argon for Robotics](https://deepmind.google/blog/gemini-4-argon-for-robotics/), Kanishka Rao, 13 October, says pure-reasoning Argon scores 87% on Embodied Reasoning (ERQA) and outperforms every other frontier model. It also says Argon controls a Boston Dynamics Spot, builds a MuJoCo digital twin of a foot-pedal trash bin, practices there, and then steps on the physical pedal.

[Developing Gemini 4 Argon responsibly and safely](https://deepmind.google/blog/developing-gemini-4-argon-responsibly-and-safely/), Anca Dragan and Raluca Ada Popa, the same day, reports shortcut attempts of 2% on coding benchmarks where models have no incentive to hold back, external bio red-team success under 1% of the bio sub-tasks Google tests, and a 0.7% attack-success rate across 15 adaptive attempts on Gray Swan's Indirect Prompt Injection benchmark. Those three rates are Google's. The id for a paid API call is `gemini-4-argon`, at the standard rates through 30 November 2026.
