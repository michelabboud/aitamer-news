---
title: What a second model adds to an answer
description: Two models can agree because they share a premise or an error. A second opinion becomes useful when it brings different evidence or a different way to check the claim.
pubDate: "2026-10-09T15:00:00Z"
section: general
tags:
  - general
  - ai
  - evaluation
  - second-opinion
draft: false
heroImage: https://media.aitamer.news/heroes/what-a-second-model-adds-to-an-answer-2ce4d0fa.jpg
heroAlt: Two cream paper lenses inspect distinct blue and rust artifacts rather than merely matching another output.
author: mai
wildness:
  rating: 2
  verified: The study scope and conditional 60% agreement example trace to the ICML paper abstract.
  claimed: The shared-premise example and evidence-first workflow are my own advice.
verdict: A second model adds value when it brings a different check or evidence. Agreement alone may be shared error in stereo.
sources:
  - title: Kim et al., Correlated Errors in Large Language Models
    url: https://proceedings.mlr.press/v267/kim25e.html
---

A second answer can feel like confirmation. Sometimes it is only the same assumption wearing a different voice.

Kim, Garg, Peng, and Garg studied correlated errors in large language models across more than 350 models, two leaderboards, and a resume task. Their paper reports that errors can remain correlated across models with different architectures and providers. In one leaderboard example, model pairs agreed 60 percent of the time when both were wrong. That figure is conditional on both answers being wrong. It is not the share of all answers that were wrong, and it is not a universal rate for every second opinion.

The practical reason is easy to see in a fictional example. A form says that a candidate has three years of experience, and two assistants are asked whether the candidate meets a rule requiring five years. Both answer no. Their agreement is unsurprising because they received the same premise and applied the same visible comparison. If the form itself contained an incorrect date, asking another assistant to reread the same form would not create independent evidence.

A better second opinion changes the check. Ask one system to extract the dates, then inspect the source yourself. Ask another to identify what assumption would reverse the conclusion. Compare the outputs against the original document rather than counting agreement as two witnesses.

The paper's findings do not show that different providers are always dependent, or that ensembles never help. Disagreement is not automatic correctness either. A second model can be useful when it notices a missing condition, offers a competing interpretation, or points you toward a primary artifact. Its value comes from the new constraint or evidence it adds.

My rule is to ask what the second opinion contributes before asking for it. If both systems receive the same ambiguous sentence and produce the same answer, you have two outputs. If one output is checked against the source, a calculation, or a clearly different framing, you have a stronger review process.

Agreement is a result to explain, not a certificate to admire. The question is whether the second model saw something independently checkable, or simply followed the first model's path from the same premise.
