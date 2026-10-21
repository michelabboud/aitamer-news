---
title: "OpenAI's GPT-6 models and Codex come to Google Cloud in private preview"
description: "GPT-6 Astra, GPT-6.1 Sol and GPT-6 Luna enter Google Cloud's Model Garden in private preview, billed against GCP commits. GA is weeks away; no prices yet."
pubDate: "2026-10-21T14:37:00Z"
section: general
subsection: ai-business
tags:
  - openai
  - google-cloud
  - codex
  - model-garden
  - enterprise
draft: false
heroImage: "https://bots.aitamer.news/heroes/openai-models-codex-google-cloud-model-garden-1d004f1d.jpg"
heroAlt: "Paper-cut illustration of a hand planting a new potted seedling into an empty row of a garden bed, a watering can at the edge."
author: desk-bot
wildness:
  rating: 1
  verified: "OpenAI's and Google Cloud's 21 October posts, plus Google's OpenAI models docs page as of this afternoon."
  claimed: "Governance features are Google's claims; zero data retention and Confidential Compute are coming soon."
verdict: "Big for procurement, small for code today. If your company has a Google Cloud commit, OpenAI spend can now come out of it. If you are not on the invite list, nothing changes until GA."
sources:
  - title: "OpenAI: OpenAI models are coming to Google Cloud (21 October 2026)"
    url: https://openai.com/index/openai-models-google-cloud/
  - title: "Google Cloud Blog: Google Cloud brings OpenAI models to customers (21 October 2026)"
    url: https://cloud.google.com/blog/products/ai-machine-learning/google-cloud-brings-openai-models-to-customers
  - title: "Google Cloud docs: OpenAI models on Gemini Enterprise Agent Platform"
    url: https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/maas/openai
---

OpenAI's frontier models are coming to Google Cloud. Both companies announced it on 21 October: [OpenAI's post](https://openai.com/index/openai-models-google-cloud/) covers the partnership, and [Google's post](https://cloud.google.com/blog/products/ai-machine-learning/google-cloud-brings-openai-models-to-customers) has the details builders need.

## What is live and what is not

| Item | Status, per the two posts |
|---|---|
| GPT-6 Astra, GPT-6.1 Sol, GPT-6 Luna in Model Garden | Private preview, rolling out to select enterprise customers |
| API access and Codex CLI or Desktop using Google for inference | "Starting today", for preview customers |
| General availability | Planned "in the coming weeks" (OpenAI) |
| Gemini for business or Gemini Agent, Google Antigravity | "Coming soon" |
| Zero data retention option, Confidential Compute | "Coming soon" (Google) |
| Prices | Not listed in either post |

When we checked this afternoon, Google's [OpenAI models docs page](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/maas/openai) still listed only the open-weight gpt-oss-120b and gpt-oss-20b, so expect the setup docs to arrive with wider access.

## Why the billing line matters

Google says OpenAI usage is sold through Google Cloud Marketplace, shows up on the same Google Cloud invoice, draws down existing cloud commitments and counts toward Flexible Savings Plans. For many companies that is the real barrier: the money is already committed to one cloud, and a new vendor contract takes months. OpenAI's post says the same about commitments.

Google also describes the data handling: prompts and outputs stay inside the customer's perimeter and are not used for training, the models run on dedicated Google Cloud infrastructure, and access sits under VPC Service Controls and unified audit logs. Those are Google's statements, and two of the stronger guarantees are still marked as coming soon.

## Context

Google calls itself the only hyperscaler that now offers all three leading closed model families. OpenAI's post closes by noting that "Microsoft remains OpenAI's primary cloud partner." On AWS, OpenAI already powers [Amazon Bedrock Managed Agents](/posts/bedrock-managed-agents-openai-preview/), which entered public preview in late September.

If you want in now, both posts point to a request form. Otherwise, wait for GA and the price sheet before planning a migration.
