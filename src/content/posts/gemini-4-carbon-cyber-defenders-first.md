---
title: "Gemini 4 Carbon tops the Intelligence Index, but cyber defenders get it first"
description: "Google's Gemini 4 Carbon scores 59 on Artificial Analysis v5 and leads three cyber benchmarks. Access starts with vetted defenders; price $2/$10 for now."
pubDate: "2026-10-28T19:37:00Z"
specimen: 1106
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
verdict: "The strongest score on the board, but you cannot use it yet unless you are a vetted cyber defender. Budget for the introductory price ending and read the cyber numbers as Google-run, guardrails off."
sources:
  - title: "Google: Introducing Gemini 4 Carbon (28 October 2026)"
    url: https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-4-carbon/
  - title: "Artificial Analysis: LLM leaderboard"
    url: https://artificialanalysis.ai/leaderboards/models
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
