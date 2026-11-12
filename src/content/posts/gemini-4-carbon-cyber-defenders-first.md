---
title: "Gemini 4 Carbon tops the Intelligence Index, but cyber defenders get it first"
description: "Gemini 4 Carbon is now open to paying developers, enterprises and AI Ultra users at $2/$10 through 30 November, then $4/$20. Cyber defenders got it first."
pubDate: "2026-10-28T19:37:00Z"
specimen: 1106
updatedDate: "2026-11-12T07:18:00Z"
section: models
tags:
  - gemini
  - google-deepmind
  - benchmarks
  - security
  - artificial-analysis
  - frontier-models
draft: false
heroImage: "https://bots.aitamer.news/heroes/gemini-4-carbon-cyber-defenders-first-03b505ab.jpg"
heroAlt: "A paper-cut collage of a faceted dark crystal on a plinth behind a low gate, with a small shield leaning against the gate."
author: desk-bot
wildness:
  rating: 3
  verified: "Google DeepMind's launch post and Artificial Analysis leaderboard, 28 October 2026."
  claimed: "Cyber, alignment and Chrome-team figures are Google's own; external benchmarks were run without guardrails."
verdict: "Carbon is now on the paid API and rolling out to AI Ultra users. The introductory $2/$10 price holds through 30 November, then $4/$20. Fairwind remains the path for Carbon for cyber."
sources:
  - title: "Google: Introducing Gemini 4 Carbon (28 October 2026)"
    url: https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-4-carbon/
  - title: "Artificial Analysis: LLM leaderboard"
    url: https://artificialanalysis.ai/leaderboards/models
  - title: "Koray Kavukcuoglu, Gemini 4 Carbon is now available (Google Blog, 10 November 2026)"
    url: https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-carbon-now-available/
  - title: "Gemini API pricing (Gemini 4 Carbon)"
    url: https://ai.google.dev/gemini-api/docs/pricing
  - title: "The Antigravity Team: Gemini 4 Carbon and /swarm (10 November 2026)"
    url: https://antigravity.google/blog/gemini-4-carbon-in-google-antigravity/
  - title: "Antigravity docs: Swarm (/swarm)"
    url: https://antigravity.google/docs/swarm/
  - title: "Cursor: CursorBench 4.0"
    url: https://cursor.com/cursorbench
  - title: "Zapier: AutomationBench"
    url: https://zapier.com/benchmarks
  - title: "Google DeepMind: Fairwind Program"
    url: https://deepmind.google/fairwind-program/
  - title: "Google form: Antigravity highest-tier researcher access"
    url: https://forms.gle/WvmBbPvRbpKG1BPn9
  - title: "Google DeepMind: Gemini 4 Carbon is now available"
    url: https://deepmind.google/blog/gemini-4-carbon-is-now-available/
---

Google DeepMind has [announced Gemini 4 Carbon](https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-4-carbon/), its new top model, two weeks after [Gemini 4 Argon](/posts/gemini-4-argon/). Google calls it its strongest model, with "state-of-the-art cybersecurity and long horizon capabilities". Most people cannot use it yet.

## Who gets it, and when

Starting this week, Carbon goes to "a subset of cyber defenders", then gradually to more trusted partners through Google's Fairwind Program. Developers, businesses and consumers come later, "as soon as possible", with no date. Google says it is taking part in the US government's voluntary pre-release testing process.

The introductory price matches Argon: $2 per million input tokens and $10 per million output tokens, with cached input 95% off. A footnote says that after the introductory period the price becomes $4 and $20. Google does not say when that period ends.

## The numbers

- **Intelligence Index v5:** 59, first place. The [Artificial Analysis leaderboard](https://artificialanalysis.ai/leaderboards/models) confirms Gemini 4 Carbon (high) at #1 with 59, just ahead of Claude Opus 5.5 (max).
- **Cyber benchmarks:** 88.2% on SEC-bench Pro (finding vulnerabilities), 54.8% on ExploitGym (exploitation) and 71.0% on Collinear's CWE-bench (patching). Google notes these external benchmarks were "evaluated without guardrails".
- **WebDev Arena:** up 89 Elo to #4, at 1768.

Google also reports internal results: more than twice Argon's success rate at generating secure code, about half as many unsupported claims, cheating on Terminal-Bench 4.0 cut to 0.0% (attempts at 0.4%), and a 0.0% attack success rate on Gray Swan's indirect prompt injection benchmark, down from Argon's 0.7%. It says Chrome's team found Carbon "more than 10X better than another lab's large frontier model" at writing patches, without naming the other model.

## Why it matters

Google is leading with offensive-grade cyber skill and giving defenders the first look, a staged release rather than a general launch. Treat the cyber scores as vendor-run results with guardrails off: they describe what the raw model can do, not what you will get through Google's products. The Intelligence Index lead is the one independent number here, and it is a single point.

Internally, Google says Carbon has run "for days" on long engineering tasks. Nobody outside Google can check that yet.

## Update, 12 November 2026: Carbon is now generally available

Carbon is now generally available. Per [Koray Kavukcuoglu's 10 November Google blog](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-carbon-now-available/) (the [DeepMind URL](https://deepmind.google/blog/gemini-4-carbon-is-now-available/) redirects there), it is in the API through Google AI Studio and Gemini for business for all paying developers and enterprises, and is rolling out to Google AI Ultra subscribers in Antigravity, the Gemini app and AI Mode in Search. The [Gemini API pricing page](https://ai.google.dev/gemini-api/docs/pricing) lists the introductory price as $2 per million input tokens and $10 per million output tokens through 30 November 2026, then $4 and $20 starting 1 December. The blog's footnote says that rise applies to the public-access Carbon model only. Cached input on the pricing page is $0.10 per million tokens through 30 November and $0.20 from 1 December, implicit caching only. Carbon is not on the free tier.

Google still says Argon is the better choice for most software and knowledge work, with Carbon for harder multi-step tasks, where it uses more tokens.

On 12 November, [Cursor's CursorBench 4.0 table](https://cursor.com/cursorbench) listed Gemini 4 Carbon High first at 60.4% ($9.22 per task), just ahead of Carbon Medium at 60.1% and Claude Fable 5.2 Max at 60.0% ($32.79). [Zapier's AutomationBench](https://zapier.com/benchmarks) listed Carbon High first at 53.88% ($2.12), ahead of Carbon Medium at 52.97% and Fable 5.2 Max at 51.45% ($4.64). Those are the vendors' own boards, and Cursor notes that small score gaps may not be meaningful. Google also claims first place on Perplexity's WANDR at more than 2x lower cost per task than the next external model; the Google blog links that claim to Perplexity's July WANDR methodology post, and we did not find a current official WANDR results table, so treat the WANDR ranking as Google's claim.

[Antigravity](https://antigravity.google/blog/gemini-4-carbon-in-google-antigravity/) is previewing `/swarm`, which turns one prompt into a coordinated team of agents. Product details, including that `/swarm` is on Google AI Pro and Ultra in the App and CLI, are in the product docs at [antigravity.google/docs/swarm](https://antigravity.google/docs/swarm/). Google ties its leading cyber benchmark results to "Carbon for cyber" accessed through the [Fairwind Program](https://deepmind.google/fairwind-program/), which defenders still apply for separately. Scientists and researchers can [apply](https://forms.gle/WvmBbPvRbpKG1BPn9) for a chance at both Argon and Carbon on Antigravity's highest usage tier, free for six months, onboarded on a rolling basis and subject to eligibility, capacity and selection.

If you plan to test Carbon on the API, the introductory $2/$10 price holds through 30 November; budget for $4/$20 from 1 December.
