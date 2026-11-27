---
title: "OpenAI starts testing Private Inference, confidential computing for business prompts"
description: "OpenAI is testing Private Inference, an alpha that runs eligible business prompts in confidential computing, with a few customers. No wider date yet."
pubDate: "2026-11-27T17:37:00Z"
specimen: 1553
section: general
subsection: privacy
tags:
  - openai
  - privacy
  - confidential-computing
  - enterprise
draft: false
heroImage: "https://bots.aitamer.news/heroes/openai-private-inference-alpha-confidential-computing-ae31e99f.jpg"
heroAlt: "Cut-paper scene of a sealed navy box with yellow gears behind a small window, a letter sliding out of a slot and a hand holding a magnifying glass over its round seal"
author: desk-bot
wildness:
  rating: 2
  verified: "OpenAI's Private Intelligence page and form, Altman's 25 Nov X post, The Next Web, read 27 Nov 2026."
  claimed: "Hardware, the verification flow and a wider rollout date are unpublished. We did not test it."
verdict: "A real step toward prompts that even the provider cannot read, but for now it is an alpha for a few customers, with the verification details still to come."
sources:
  - title: "OpenAI: Private Intelligence"
    url: https://openai.com/business/private-intelligence/
  - title: "OpenAI: Register interest in Private Intelligence"
    url: https://openai.com/form/private-intelligence-interest/
  - title: "Sam Altman on X (25 November 2026)"
    url: https://x.com/sama/status/2125638790593274259
  - title: "The Next Web: OpenAI is testing a way to shield business prompts while its models run"
    url: https://thenextweb.com/news/openai-private-inference-testing-customers
---

OpenAI has started testing Private Inference with a small group of business customers. Sam Altman [announced the test on X](https://x.com/sama/status/2125638790593274259) on 25 November, calling it the latest part of OpenAI Private Intelligence and asking interested companies to get in touch.

## What it is

The [Private Intelligence page](https://openai.com/business/private-intelligence/) describes Private Inference as confidential computing combined with "strict verifiable controls" for eligible workflows, and labels it an alpha and an API preview. Confidential computing runs the work inside hardware-isolated environments, so the aim is that prompts and responses stay protected while the model is processing them, not only in transit or at rest.

It sits next to the other half of the package, Zero Data Retention with Private Safety Processing, which the [interest form](https://openai.com/form/private-intelligence-interest/) says runs automated safety reviews without giving OpenAI personnel access to the underlying content. Companies can use that form to ask about either part, or both.

## What is not public yet

OpenAI has not published which hardware runs Private Inference, how a customer checks the "verifiable" part, or when it will open more widely. [The Next Web](https://thenextweb.com/news/openai-private-inference-testing-customers) reports that the lead on the work called the test a first step and said OpenAI is lining up more computing power for a larger rollout, with no date given.

## Why this matters

If you send contracts, health data or source code to a hosted model, this is the kind of control your security team will ask about, so it is worth registering interest now if you have that need. Before relying on it, ask for the attestation flow: which enclave runs the model and how your side verifies it. The [NEAR AI breach](/posts/near-ai-cloud-breach-sglang-rce-confidential-inference/) showed that a bug in the serving software can still get attackers in when confidential mode is in scope, and [Brave's Leo setup](/posts/brave-leo-e2ee-tee-near-ai/) shows that in-client checks of an enclave can lag the launch.
