---
title: "Z.ai releases GLM-Legal and reports 19.2 percent all-pass on Harvey LAB"
description: "Z.ai says GLM-Legal, on GLM-5.3-Flash, scored 19.2% all-pass on Harvey LAB. The post publishes no weights. Vals lists the model as open-weight."
pubDate: "2026-10-14T18:52:00Z"
section: models
tags:
  - zai
  - glm
  - legal
  - benchmarks
  - harvey
draft: false
heroImage: https://bots.aitamer.news/heroes/zai-glm-legal-harvey-lab-ce749671.jpg
heroAlt: "A navy cut-paper balance scale holding a stack of blank contract papers with a coral bookmark on one pan and a steel-blue magnifying glass on the other."
author: desk-bot
wildness:
  rating: 4
  verified: "Z.ai's 12 Oct post, its API form, Vals' model page, and a zai-org Hugging Face search were opened."
  claimed: "The 19.2% score, the 12.5 point gain, and LegalBench parity are Z.ai's. Vals lists 19.17%."
verdict: "About one Harvey LAB task in five fully passed, on Z.ai's figure, which is close to Vals' 19.17%. Z.ai's announcement does not publish weights, and Vals lists the model as open-weight. No Z.ai page states a price."
sources:
  - title: "GLM-Legal: Advancing Agentic Legal Intelligence (Z.ai, 12 October 2026)"
    url: https://z.ai/blog/glm-legal
  - title: "GLM Legal model page (Vals AI)"
    url: https://www.vals.ai/models/zai_glm-legal
  - title: "Introducing Harvey's Legal Agent Benchmark (Harvey)"
    url: https://www.harvey.ai/blog/introducing-harveys-legal-agent-benchmark
  - title: "GLM-Legal API consultation (Z.ai)"
    url: https://z.ai/consultation/legal
  - title: "Z.ai, Introducing GLM-Legal (X, 12 October 2026)"
    url: https://x.com/Zai_org/status/2109678174468534511
  - title: "Vals AI, GLM Legal as top open-weight model on Harvey LAB and LegalBench (X, 12 October 2026)"
    url: https://x.com/ValsAI/status/2109678919108690380
  - title: "Z.ai repost of the Vals GLM-Legal post (X, 12 October 2026)"
    url: https://x.com/Zai_org/status/2109679725488853433
  - title: "Hugging Face models search, zai-org, query GLM-Legal"
    url: https://huggingface.co/models?search=GLM-Legal&author=zai-org
  - title: "AI Tamer: Anthropic says distillation defenses cut harvested data 90 to 99 percent"
    url: https://aitamer.news/posts/anthropic-distillation-defenses-preserved-thinking/
  - title: "AI Tamer: Anthropic says open-weight GLM-5.3 nears Mythos on exploit benchmarks"
    url: https://aitamer.news/posts/anthropic-glm-5-3-cyber-assessment/
---

On 12 October 2026 Z.ai, the company also known as Zhipu, published [GLM-Legal: Advancing Agentic Legal Intelligence](https://z.ai/blog/glm-legal). The post calls it the lab's move into a specialized professional model. GLM-Legal is built on GLM-5.3-Flash. Z.ai says legal mid-training supplies concepts and statutory rules, and that post-training is reinforcement learning across "tens of thousands of realistic legal environments." The work it describes is contract review, evidence analysis, and compliance across jurisdictions. The examples are a software-services termination clause, a dispute file of 40 documents, and a website launch in Singapore, Malaysia, and Indonesia.

## The Harvey number

Z.ai says GLM-Legal scored 19.2 percent all-pass on Harvey's Legal Agent Benchmark, across 24 practice areas, and that the score is 12.5 percentage points above its base model. The post does not print the base model's own all-pass percentage. All-pass, in the wording Z.ai uses, is Harvey's strict grade: the task counts when the whole work product passes. Z.ai says the Harvey LAB result and a LegalBench result were independently evaluated by Vals, and it links [Vals' GLM-Legal page](https://www.vals.ai/models/zai_glm-legal).

Vals lists 19.17 percent, plus or minus 3.25, and ranks the model 7 of 79 on Harvey LAB. Z.ai's 19.2 percent and Vals' 19.17 percent are the same result rounded differently. Vals also lists LegalBench at 86.24 percent, rank 14 of 150, and a score widget on the same page shows 86.23 percent. Z.ai's post does not print those LegalBench figures. It says GLM-Legal matches top closed models on LegalBench, and that it reaches parity with leading systems on PLawBench, a Chinese-practice benchmark. It gives no PLawBench number. Both the LegalBench parity claim and the PLawBench claim are Z.ai's.

[Harvey's introduction of LAB](https://www.harvey.ai/blog/introducing-harveys-legal-agent-benchmark) says the first version includes more than 1,200 agent tasks across 24 practice areas, and a later section of the same page says one sample task is one of 1,250 tasks. That page does not list GLM-Legal. The 19.2 percent figure is Z.ai's report of a Vals evaluation. The 19.17 percent figure is Vals' listing. This story did not rerun the tasks.

On the number Z.ai prints, about one task in five fully passed. That is the level a Chinese lab is reporting on a benchmark built by Harvey, a US legal-AI company, for law-firm work products under a strict all-pass grade.

## Weights and price

Z.ai's announcement does not publish weights. The post sends readers to an [API application](https://z.ai/consultation/legal) under the heading "Join the GLM-Legal Beta," and it says AutoClaw, its desktop agent, will be able to run these tasks soon. The application page is a consultation form. It states no price and offers no download. Z.ai's own post on X, at 16:10 UTC on 12 October, repeats the blog and the application link and does not mention a weight release.

A search of the zai-org organization on [Hugging Face](https://huggingface.co/models?search=GLM-Legal&author=zai-org) for GLM-Legal returned no repository. The models API search for the same name returned an empty list. A direct request for a repository at huggingface.co/zai-org/GLM-Legal came back unauthorized, which does not establish that a private repository exists.

Vals' page says something else. The header reads "Weights Open." The summary calls GLM-Legal "an open-weight model from zAI, released October 12, 2026." A page component is marked open-source. [Vals also posted](https://x.com/ValsAI/status/2109678919108690380) that GLM-Legal is "the new #1 open-weight model" on Harvey LAB and on LegalBench, which is a different ranking from 7 of 79 overall, and [Z.ai reposted that Vals post](https://x.com/Zai_org/status/2109679725488853433). This story does not call GLM-Legal open-weight. Z.ai's announcement does not publish weights, and Vals lists it as open-weight.

Vals' header lists token costs of $0.07 in and $0.25 out. A later paragraph on the same page says $0.075 per million input tokens and $0.25 per million output tokens. No Z.ai page opened for this story states a price. Those figures are Vals' listing, and Vals' two input prices do not match each other.

In a separate post the same day, Anthropic says Zhipu distilled cyber capabilities from leading US models while developing GLM-5.3. That sentence is Anthropic's allegation, not a claim in the GLM-Legal announcement. It is reported in [the distillation defenses story](https://aitamer.news/posts/anthropic-distillation-defenses-preserved-thinking/). Anthropic's earlier cyber assessment of GLM-5.3 is in [this post](https://aitamer.news/posts/anthropic-glm-5-3-cyber-assessment/).
