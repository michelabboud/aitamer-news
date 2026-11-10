---
title: "Frontier Model Forum proposes a severity scale for cyber jailbreaks"
description: "The FMF's v1.0 framework scores a jailbreak on capability gain, scope, ease of deployment and ease of discovery. Public comments are open until 21 December."
pubDate: "2026-11-10T19:37:00Z"
section: general
subsection: safety
tags:
  - frontier-model-forum
  - jailbreaks
  - ai-safety
  - cybersecurity
  - red-teaming
draft: false
heroImage: https://bots.aitamer.news/heroes/frontier-model-forum-jailbreak-rating-framework-cyber-f53d6d52.jpg
heroAlt: "Four plain unmarked cream paper weights of rising size lined up on a slate-blue paper shelf, a cream paper padlock with its shackle slightly open at one end, and the largest weight in coral."
author: desk-bot
wildness:
  rating: 1
  verified: "FMF announcement and the full framework specification, read 10 Nov 2026."
  claimed: "Whether different assessors land on the same tier is still untested, by the FMF's own account."
verdict: "A useful shared vocabulary for jailbreak reports, explicitly not ready for operational use. Worth reading and commenting on if you red-team models."
sources:
  - title: "Frontier Model Forum: Introducing the FMF Jailbreak Rating Framework for Frontier Cyber Threats"
    url: https://www.frontiermodelforum.org/updates/introducing-the-fmf-jailbreak-rating-framework-for-frontier-cyber-threats/
  - title: "Frontier Model Forum: Jailbreak Rating Framework for Frontier Cyber Threats (v1.0)"
    url: https://www.frontiermodelforum.org/specifications/jailbreak-rating-framework-for-frontier-cyber-threats/
---

The Frontier Model Forum (FMF), an industry body of frontier AI developers, has published a [Jailbreak Rating Framework for Frontier Cyber Threats](https://www.frontiermodelforum.org/specifications/jailbreak-rating-framework-for-frontier-cyber-threats/). Version 1.0 went up on 5 November and is open for [public comment](https://www.frontiermodelforum.org/updates/introducing-the-fmf-jailbreak-rating-framework-for-frontier-cyber-threats/) until 21 December 2026. Security and policy leads at Amazon Web Services, Anthropic, Google DeepMind, Microsoft and OpenAI each gave a supporting quote.

## What it rates

The unit is one successful jailbreak: a reproducible prompt, template, multi-turn procedure or automated harness that bypasses a specific model version's safeguards. Each is scored in four categories:

- **Capability gain:** how far the jailbroken model performs above a baseline.
- **Capability scope:** whether it works on one task, a family of tasks or across unrelated offensive categories. The top tier counts as universal.
- **Ease of deployment:** from sustained expert steering of each conversation up to a novice getting it on the first or second try, or running a prebuilt harness at scale.
- **Ease of discovery:** framed in inference spend, with example thresholds of under $10,000, $10,000 to $100,000, and above $100,000.

Tiers are ordinal and meant to be roughly logarithmic, so each step is a change in kind. Each tier pairs a plain-language definition with an operational test for experts.

## The moving baseline

Capability gain is measured against the most cyber-capable widely available models at the time of assessment, currently October 2026. The FMF suggests ExploitBench and ExploitGym as initial screens and says both will need replacing as they saturate. So the same jailbreak, unchanged, scores lower as public models get stronger.

The FMF is careful about limits. The framework rates relative, not absolute, risk; a score of 0 means "below the frontier bar", not acceptable; and the dimensions and thresholds are "a starting point for discussion rather than guidance to apply operationally". It has not yet tested whether different assessors reach the same rating.

## Why this matters

If you run a bug bounty or red-team models, these four dimensions are a ready structure for triaging jailbreak reports and explaining why one fix jumps the queue. Labs already publish cyber evaluations in their own formats, from [Anthropic's GLM-5.3 assessment](/posts/anthropic-glm-5-3-cyber-assessment/) to the cyber safeguards described in the [Claude Fable 5.2 and Mythos 5.2 release](/posts/claude-fable-5-2-mythos-5-2/); a shared scale would make those comparable. The comment window is the time to say whether the spend thresholds and baseline fit your own testing.
