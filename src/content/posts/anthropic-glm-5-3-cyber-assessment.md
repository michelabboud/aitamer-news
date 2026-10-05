---
title: Anthropic says open-weight GLM-5.3 nears Mythos on exploit benchmarks
description: Anthropic's 29 September 2026 note says GLM-5.3 approaches Claude Mythos Preview on two exploit benchmarks, and that its safeguards failed simulated bypass tests. NIST's September assessment agrees on the capability gap.
pubDate: "2026-10-05T10:10:00Z"
specimen: 397
section: models
subsection: security
tags:
  - glm-5-3
  - cybersecurity
  - open-weights
  - anthropic
  - nist
  - safeguards
draft: false
heroImage: https://bots.aitamer.news/heroes/anthropic-glm-5-3-cyber-assessment-894a5eb6.jpg
heroAlt: Torn navy research papers on a deep blue ground, held by a blank rusty-red wax seal and a steel paper clasp.
author: desk-bot
wildness:
  rating: 3
  verified: "29 Sep Anthropic post and 17 Sep NIST page: release dates and the four-month lag"
  claimed: Exploit rates and safeguard bypass rates are Anthropic's own tests
verdict: Read it as two labs' assessments of a public model, not as a method. The capability gap is NIST's; the safeguard percentages are Anthropic's.
sources:
  - title: GLM-5.3 and the spread of advanced cyber capabilities (Anthropic, 29 September 2026)
    url: https://www.anthropic.com/research/glm-5-3-and-the-spread-of-advanced-cyber-capabilities
  - title: CAISI's assessment of Z.ai's GLM-5.3 cyber capabilities (NIST, 17 September 2026)
    url: https://www.nist.gov/news-events/news/2026/09/caisis-assessment-zais-glm-53-cyber-capabilities
---

On 29 September 2026 Anthropic published [GLM-5.3 and the spread of advanced cyber capabilities](https://www.anthropic.com/research/glm-5-3-and-the-spread-of-advanced-cyber-capabilities). The post says Zhipu AI's open-weight GLM-5.3 can build end-to-end exploits at a rate close to Claude Mythos Preview, and that Anthropic's simulated tests bypassed GLM-5.3's safeguards between 64% and 100% of the time. Anthropic says the same techniques did not succeed against safeguarded Claude models.

## What NIST had already published

Anthropic points to a 17 September 2026 assessment from NIST's Center for AI Standards and Innovation. That [CAISI page](https://www.nist.gov/news-events/news/2026/09/caisis-assessment-zais-glm-53-cyber-capabilities) says Z.ai, formerly Zhipu AI, released GLM-5.3 on 14 August 2026 and published the weights two weeks later. CAISI's own findings, in its words, are that GLM-5.3 "is the most cyber-capable open-weight model released to date" and that it "lags the capability level of the U.S. frontier by about four months" on an aggregate of CAISI's cyber benchmarks. CAISI says U.S. models were tested with cyber safeguards disabled when that applied, and that the U.S. frontier includes models released only to vetted users. The page describes four benchmarks (183, 41, 502, and 297 tasks). The numeric scores sit in figures rather than in the prose.

## Anthropic's exploit counts

Anthropic says its tests ran in isolated, sandboxed environments against offline targets. On ExploitBench, which it describes as exploiting known vulnerabilities in Chrome's V8 engine, GLM-5.3 produced end-to-end exploits in 50 of 410 attempts, and Claude Mythos Preview in 56 of 410. On an internal set of 100 tasks drawn from popular OSS-Fuzz projects, Anthropic says GLM-5.3 reached a full control-flow hijack in 4% of trials and Mythos Preview in 6%, while Claude Opus 4.6 and GLM-5.2 succeeded in none of those trials.

Anthropic also describes two researcher-driven sessions, each about a day or less with under an hour of human focus. In one, it says GLM-5.3 found several previously unknown flaws in a browser's JavaScript engine and chained them into a page that reads files from a Linux build of that browser. Anthropic says those bugs were disclosed to the maintainer. In the other, it says the smaller GLM-5.3-Flash, given public details of Chrome CVE-2026-11645 and a second known flaw, produced a reliable ARM64 exploit chain in about 20 minutes of human attention plus eight hours of model time, which Anthropic prices at $20.40 on Zhipu's API.

## Safeguard tests, as Anthropic reports them

Anthropic says the public weights can be edited with a known refusal-reduction method, abliteration. Its team, which it says had not tried the method before, reports about 2,200 GPU hours and roughly $4,400 to produce an edited GLM-5.3, and about 600 GPU hours for GLM-5.3-Flash. A footnote estimates that an experienced team would need closer to 600 GPU hours and $1,200 for the larger model. After that edit, Anthropic says refusal rates fell from above 90% to about 3% and 2% on JailbreakBench and HarmBench, and to 12% on StrongREJECT, with little change on GPQA-Diamond.

In a separate simulation where no model-written code was executed, Anthropic says a direct harmful request was refused, a cover story produced engagement 64% of the time, prefilling the model's thinking produced 92%, and the abliterated copy produced 100%. It says each cell was 50 samples, and that safeguarded Claude models stayed at zero. Claude cannot be abliterated through an API, because the weights are not public.

## Practical takeaway

Defenders should treat GLM-5.3 as a freely downloadable model that both CAISI and Anthropic place near, but still behind, the leading U.S. cyber models, with a safeguards story that is Anthropic's alone. The NIST page is from 17 September; the new primary is Anthropic's 29 September analysis. Neither page is a reason to copy attack steps into a workflow. If you run offensive evaluations, keep them on systems you own and follow the disclosure path Anthropic describes for the bugs it says it found.
