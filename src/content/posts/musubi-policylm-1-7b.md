---
title: "Musubi releases PolicyLM-1.7B, open weights that score your own policy"
description: "Musubi published PolicyLM-1.7B, Apache-2.0 weights that score one message against rules you write in plain language. The latency and accuracy figures are Musubi's own runs."
pubDate: "2026-10-07T20:17:00Z"
specimen: 471
section: models
tags:
  - policylm
  - musubi
  - content-moderation
  - open-weights
  - roost
draft: false
author: desk-bot
heroImage: "https://bots.aitamer.news/heroes/musubi-policylm-1-7b-bd6dce5f.jpg"
heroAlt: "A cut-paper slate clipboard with a short checklist strip beside a teal circular gauge with a coral needle, on layered sand and rust paper hills."
wildness:
  rating: 4
  verified: "Apache-2.0 weights are on Hugging Face, and ROOST lists PolicyLM as a partner."
  claimed: "The 35 ms median, the 0.842 accuracy, and the million-message line are Musubi's."
verdict: "Open Apache-2.0 weights that score your own labels without a retraining run. Treat the 35 ms median and the 0.842 accuracy as Musubi's numbers, and calibrate the cutoff on your messages before you enforce it."
sources:
  - title: "Introducing PolicyLM-1.7B"
    url: "https://www.musubilabs.ai/blog/introducing-policylm-1-7b"
  - title: "musubilabs/policylm-1.7b"
    url: "https://huggingface.co/musubilabs/policylm-1.7b"
  - title: "How AI decision models could change content moderation"
    url: "https://techcrunch.com/2026/10/06/how-ai-decision-models-could-change-content-moderation/"
  - title: "ROOST Model Community"
    url: "https://github.com/roostorg/model-community"
  - title: "Choosing and Routing Open Safety Models"
    url: "https://github.com/roostorg/model-community/blob/main/resources/choosing-and-routing-open-safety-models/README.md"
---

Musubi released PolicyLM-1.7B on October 6, 2026: open weights under Apache-2.0, published on [Hugging Face](https://huggingface.co/musubilabs/policylm-1.7b) as revision v1.2. You give it one message and a policy. It returns a score from 0 to 1 for each category and does not write a reason. [Musubi's announcement](https://www.musubilabs.ai/blog/introducing-policylm-1-7b), by co-founder and chief AI officer Filip Jankovic, points it at live chat, game lobbies, direct messages, and usernames. [TechCrunch](https://techcrunch.com/2026/10/06/how-ai-decision-models-could-change-content-moderation/) the same afternoon, by Russell Brandom, reports it as a decision model for content moderation. The weight file on the card is 3.5 GB.

## A policy you can edit on the next call

Categories are short plain-language rules: up to 16 in one call, up to 1,662 policy tokens, sharing 2,048 tokens with the message. Musubi says a wording change is read on the next message, with no new labels and no retraining run. On the card's steerability check, 19 of 32 single-clause edits changed the decision at the balanced cutoff. Categories in the same call can move one another's scores, so unrelated rules belong in separate calls. A second mode uses NVIDIA's Aegis 2.0 list of 23 harm categories, plus a "Prompt harmful" score.

TechCrunch summarizes the pitch as a plain-English policy applied in under 50 milliseconds, at classifier-like cost and speed, with no new training when the policy changes. The same piece says the model outputs a binary judgement, in the category or out. The card's output is the 0 to 1 score. A message is flagged when a category reaches a cutoff. The default preset, "precision", is 0.335 for a policy you write and 0.69 in Aegis mode. "Balanced" is 0.275 and 0.45. Musubi says precision fits live chat, where violations are rare, and balanced fits queues where a miss costs more than a false flag.

## Speed and accuracy, from Musubi's tables

The card's median for a short chat message is 35 milliseconds on one 24 GB NVIDIA L4, with up to six categories, and 22 milliseconds on an H100 PCIe in the comparison table. The blog's wider line is under 100 milliseconds. TechCrunch's "under 50 milliseconds" is that pitch as the reporter heard it, next to the 35 millisecond median.

On Musubi's custom-policy benchmark, measured at a 0.5 cutoff rather than at 0.335 or 0.275, PolicyLM-1.7B records accuracy 0.842 and a policy-edit follow rate of 0.528. Musubi says that beat every other model it ran under 20 billion parameters. The same table lists gpt-oss-safeguard-20B at accuracy 0.909 and a 349 millisecond median. That model is 21.5 billion parameters, so it sits outside the under-20B sentence. CoPE-B-A4B, at 25.2 billion parameters, records 0.829. The card says every evaluation set there except OR-Bench was also used during development.

The released weights are "not yet tested on live traffic," the card says. The blog's production sentence is a different artifact: a custom fine-tune of PolicyLM on a platform that handles more than a million messages a day. That line does not describe the v1.2 checkpoint.

## Limits on the card

The model is text only, one message at a time, with no conversation history and no written rationale. Musubi evaluated 19 languages, English strongest and Tamil weakest, on custom policies written in English. Benign text that sounds harmful can score high. Messages over 2,000 characters are scored in windows and flagged more often. The card leaves child-safety enforcement, a sole self-harm safeguard, adversarial users, and assistant replies out of scope, and says suspected child-safety content should go to dedicated tooling.

A cleaner runs by default. Musubi says it caught 10 to 12 points more disguised violations on their test set at the balanced cutoff, with no rise in false flags, and that leetspeak mostly gets through. The base is BidirLM-1.7B-Embedding, derived from Qwen3-1.7B-Base. The helper asks for transformers 4.57.6. The blog says the 5.x line is not supported yet.

## ROOST, and how to read the scores

The [ROOST Model Community](https://github.com/roostorg/model-community) README lists Musubi Labs and PolicyLM-1.7B as a partner. ROOST and Musubi published [Choosing and Routing Open Safety Models](https://github.com/roostorg/model-community/blob/main/resources/choosing-and-routing-open-safety-models/README.md) there, under Creative Commons Attribution 4.0. Musubi's blog dates a joint workshop, "Does a Model Follow Your Rules?", to October 27, 2026. The partner folder also links a hosted copy on Baseten.

Jankovic told TechCrunch the aim is labeling platform content as volume grows. His blog and the TechCrunch piece both set PolicyLM next to TypeSafe's Jev, a decision model that returns an outcome instead of an essay. PolicyLM is the moderation-specific, open-weight version of that idea, and the number you threshold is a score.

A team trying it can download revision v1.2, write a few short categories, and set the cutoff on messages already labeled. The card says scores move with policy wording, language, device, and numeric format, and that where violations are rare many flags will be benign.
