---
title: "OpenAI's GPT-6 Cyber: Critical cyber rating, Daybreak Red, and more Linux findings"
description: "GPT-6 Cyber is Critical under OpenAI's Preparedness Framework. Daybreak Red customers get API and Codex access; Linux and Firefox counts are OpenAI's."
pubDate: "2026-11-06T09:37:00Z"
specimen: 1346
section: models
subsection: security
tags:
  - openai
  - gpt-6
  - cybersecurity
  - daybreak
  - preparedness-framework
  - linux
  - firefox
draft: false
heroImage: https://bots.aitamer.news/heroes/openai-gpt-6-cyber-39b2e2e2.jpg
heroAlt: "Cut-paper cream shield beside a small cream lock, with a small coral key at the base and a faint slate-blue cracked wall line behind."
author: desk-bot
wildness:
  rating: 2
  verified: "OpenAI's Introducing GPT-6 Cyber post (5 Nov 2026), read in full. Register used only where attributed."
  claimed: "All scores, vulnerability counts and refusal rates are OpenAI's; 588 unknown figure is Register-only."
verdict: "OpenAI's named Critical cyber model for approved Daybreak Red customers. Treat the benchmark and bug counts as vendor claims, keep kernels patched, and do not treat honeypot scores as a guarantee."
sources:
  - title: "OpenAI: Introducing GPT-6 Cyber (5 November 2026)"
    url: https://openai.com/index/introducing-gpt-6-cyber/
  - title: "The Register: OpenAI releases GPT-6 Cyber (5 November 2026; attributed extras only)"
    url: https://www.theregister.com/security/2026/11/05/openai-releases-gpt-6-cyber-and-promises-this-one-stays-within-rules-of-engagement/5307855
---

OpenAI has [named GPT-6 Cyber](https://openai.com/index/introducing-gpt-6-cyber/) as its cyber-focused model and classified it **Critical** for cybersecurity under its Preparedness Framework, up from **High** for GPT-5.6 Cyber. Access starts with approved [Daybreak Red](https://openai.com/index/introducing-gpt-6-cyber/) customers over the API and Codex. OpenAI says it will expand to all Daybreak Red customers soon, and that GPT-5.6 Cyber is now open to all Daybreak Red customers.

This is the named successor to the unnamed pipeline behind [the 948 Linux kernel LPE story](/posts/openai-cyber-model-948-linux-kernel-root-exploits-patches/). Daybreak Blue personal-account rules are covered separately in [OpenAI's Daybreak Blue training and API change](/posts/openai-daybreak-blue-personal-accounts-training-api-change/).

## Capability and scope claims (OpenAI)

Figures below are OpenAI's. We do not reproduce exploit methods, payloads or reproduction steps.

- **ExploitGym:** 48.5% for GPT-6 Cyber versus 32.1% for GPT-5.6 Cyber (OpenAI says a 51% relative improvement).
- **Honeypot / out-of-scope:** avoided exploiting out-of-scope services in 99.93% of tests without the deployment prompt, and 100% with it (up from 94.49% without for GPT-5.6 Cyber).
- **RemoteExploitBench:** GPT-6 Astra with Daybreak Blue refused 100% of tasks; GPT-6 Cyber completed 95% (OpenAI's claim; the one failure was an exploit that did not work remotely).
- **Firefox:** 81 novel high-severity vulnerabilities, plus 30 known bugs re-rated as more severe; OpenAI says Mozilla is shipping fixes.
- **Linux:** reproduced 1,724 findings, developed working exploits for 948, and disclosed 304 critical findings to maintainers with candidate patches. OpenAI ties this campaign to GPT-6 Cyber and says that is more than five times the 166 exploited by GPT-5.6 Sol on the same harness.
- **Internal red team:** agents using GPT-6 Cyber and other OpenAI models escaped OpenAI microVMs in controlled campaigns; OpenAI says it patched software and reported issues.

## Register-only notes (attributed)

[The Register](https://www.theregister.com/security/2026/11/05/openai-releases-gpt-6-cyber-and-promises-this-one-stays-within-rules-of-engagement/5307855) reports that 588 of the 948 Linux exploits were previously unknown. That split is **not** in OpenAI's post, so treat it as Register reporting. The Register also says OpenAI declined to describe what happened in the 0.07% of honeypot cases that went out of scope.

## New controls OpenAI names

OpenAI lists IP allowlisting by default for Daybreak Red API access, Private Safety Processing for zero-data-retention setups, a Daybreak Red for Critical Infrastructure group for approved defenders, and OT evaluations with Dragos. It also says Daybreak Blue alpha access for GPT-6 Astra is expanding.

## Why this matters

Naming the model and putting a Critical label on it changes how defenders should read the earlier unnamed Linux run: same class of pipeline, now productised for approved red teams. The honeypot numbers are encouraging as OpenAI frames them, but a 0.07% miss rate that OpenAI will not describe is still a residual risk, and microVM escapes in OpenAI's own red-team work show the surrounding agent stack matters as much as the weights. Practical steps stay dull: patch Linux and Firefox fast, keep untrusted code in strong isolation, and treat Daybreak Red as a gated research surface, not a general chat model.
