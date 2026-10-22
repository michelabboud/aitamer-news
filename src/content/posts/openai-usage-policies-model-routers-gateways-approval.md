---
title: "OpenAI will require approval for model routers and AI gateways from 20 November"
description: "OpenAI's updated Usage Policies say services that give third parties direct access to its models need prior review. Training limits also tighten. From 20 Nov."
pubDate: "2026-10-22T09:37:00Z"
section: general
subsection: policy
tags:
  - openai
  - policy
  - ai-gateways
  - model-routers
  - api
draft: false
heroImage: "https://bots.aitamer.news/heroes/openai-usage-policies-model-routers-gateways-approval-78c9a74c.jpg"
heroAlt: "Paper-cut illustration of several railway tracks merging at a gatehouse with a lowered barrier, a small train waiting and a stamp on the ledge."
author: desk-bot
wildness:
  rating: 2
  verified: "OpenAI's 21 October post and the updated Usage Policies page with its changelog."
  claimed: "How OpenAI will run reviews, and who it will approve, is not published yet."
verdict: "If you resell or route OpenAI models to other people, plan for an approval process before 20 November. If you only build OpenAI into your own app, the text says this rule does not apply to you."
sources:
  - title: "OpenAI: Broad access through consistent standards (21 October 2026)"
    url: https://openai.com/index/broad-access-through-consistent-standards
  - title: "OpenAI: Usage policies (effective 20 November 2026)"
    url: https://openai.com/policies/usage-policies/
---

OpenAI published an [update to its Usage Policies](https://openai.com/policies/usage-policies/) on 21 October that takes effect on **20 November 2026**. The change developers will notice first is aimed at the services in between: model routers, AI gateways and resellers that pass OpenAI models on to other people.

## The new access rule

The policy text reads: "If you operate a model-access intermediary platform or other service that enables third parties to directly access OpenAI models, you must obtain our prior review and approval." It adds that the rule "does not apply solely because an application integrates OpenAI models to power its features or functionality."

In its [announcement](https://openai.com/index/broad-access-through-consistent-standards), OpenAI names the targets more plainly: "services that provide direct access to our models such as model routers or AI gateways" must get its review and approval "before offering that access". The same post says partners that host or resell its models must keep safeguards "consistent with our own", investigate possible violations and coordinate on enforcement, so that a restriction on one service holds on the others.

OpenAI has not published how the review works, how long it takes, or what happens to services already offering access on 20 November. It also does not say whether a company's internal gateway serving its own staff counts as giving "third parties" access.

## SafetyIDs

OpenAI is also introducing **SafetyIDs**, which customers can send so OpenAI can tell individual end users apart during an investigation "without OpenAI learning those users' identities". The point, OpenAI says, is to act on one abusive user rather than a customer's whole account. It also mentions Private Safety Processing as an option for customers with sensitive data.

## The rest of the update

According to the page's changelog, the update also:

- spells out limits on using OpenAI models or outputs to build substitutes for OpenAI, including making training data, rubrics, reinforcement-learning environments, labels, scores or preferences for such models, and bars attempts to extract protected reasoning;
- clarifies protections for children and teens and the rules for automating high-stakes decisions without human review;
- folds in OpenAI's national security principles, with an approval requirement for national security and law enforcement uses.

## What to do

- **Run a router, gateway or reseller service on OpenAI models?** Contact OpenAI before 20 November and find out what review it expects.
- **Run a self-hosted gateway for your own apps?** Read the exact wording above against your setup; the exemption covers apps that integrate the models, and the "third parties" question is open.
- **Use OpenAI outputs in a training pipeline?** Check it against the training section before the date.
