---
title: OpenAI says frontier training runs should pause for a written safety case
description: OpenAI's 28 September 2026 essay says a written safety case should be required before a frontier reinforcement-learning run continues. It lists safeguards and approvals it says it is still putting in place.
pubDate: "2026-10-05T13:20:00Z"
section: general
subsection: safety
tags:
  - openai
  - ai-safety
  - training
  - governance
draft: false
heroImage: https://bots.aitamer.news/heroes/openai-frontier-training-safety-cases-8a86dcbf.jpg
heroAlt: Cream checklist with mixed empty and marked boxes sits beside a blue pause disc on deep navy ground with paper hills.
author: desk-bot
wildness:
  rating: 4
  verified: "28 Sep post: the safety-case argument, the three safeguard groups, and the in-progress label"
  claimed: OpenAI does not mark any item as finished, and no outside standard is cited as adopted
verdict: A public checklist for frontier RL runs, labeled as in progress. It is not a regulation, and it does not say the controls are already on.
sources:
  - title: Towards safety cases for frontier AI training (OpenAI, 28 September 2026)
    url: https://openai.com/index/towards-safety-cases-for-frontier-ai-training
---

On 28 September 2026 OpenAI published [Towards safety cases for frontier AI training](https://openai.com/index/towards-safety-cases-for-frontier-ai-training). The post argues that structured safety documentation should be required before anyone continues a frontier reinforcement-learning training run. OpenAI calls a full safety case, in the sense used in aviation or nuclear power, an "aspirational north star," and says emergent model behavior makes that standard harder to meet. It says the practices below are being implemented at OpenAI and will change over the coming weeks. This is a position paper about training runs, not a claim that a regulator has adopted the list, and not a description of deployment safety.

## Technical safeguards it wants on the page

OpenAI groups the technical side into alignment training, containment, and monitoring. On alignment, it wants automated and manual review of RL environments so a broken task cannot reward a shortcut, graders that penalize exploit attempts, classifiers over traces from earlier runs, alignment evals during the run, backtests of those evals on past incidents, monitors for eval awareness with blocking thresholds, a worst-case stress test that at least one eval would catch, and a rule that automated graders do not see the chain of thought. On containment, it wants hardened sandboxes and research infrastructure, red-teaming of checkpoints and of every service the model can touch, limits on high-bandwidth communication between samples, and immutable transcripts for training, evaluation, and internal deployment. On monitoring, it wants measured monitorability, high recall on past incidents, fresh evals for new risks, and a response path that pages a person or pauses the run inside a stated interval, including an automatic pause overnight if an alert is not acknowledged.

## Who signs, and what happens after an incident

The operational list is: a dissent from someone outside the training team, veto power for senior leaders (the examples are a research lead, the head of safety, and the chief scientist), accountability for the run's senior leader including in performance reviews, a way to pause every covered run if the case no longer holds, copies for an internal oversight group, auditor access, a severity table that can page an executive, controls that fail closed so a run cannot start without monitoring, a way to find every downstream use of a bad model, and a written list of residual risks. After a severe misalignment incident, OpenAI wants internal updates while the investigation is open, a root-cause look at the training dynamics, an operational postmortem, new regression tests that are not hill-climbed on the incident itself, and public disclosure of results and changes once the investigation ends, with affected third parties told as soon as possible.

## Practical takeaway

If you train frontier models, the document is a checklist OpenAI says it is still implementing, not a certification you can download. The scope line matters: it is about continuing a frontier RL run, and OpenAI says deployment needs a wider review. None of the items is marked done in the post. The useful reading is which gaps you would have to write down, especially residual risks, a veto, and a pause that works at night, before you treat a run as cleared.
