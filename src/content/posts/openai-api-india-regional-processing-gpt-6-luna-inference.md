---
title: "OpenAI's API can now run GPT-6 Luna inference inside India, with Zero Data Retention required"
description: "India joins Australia and Japan for in-country API inference on gpt-6-luna. It needs Zero Data Retention, Standard pay-as-you-go and a 10% residency uplift."
pubDate: "2026-11-12T15:37:00Z"
section: dev
subsection: openai-api
tags:
  - openai
  - data-residency
  - india
  - compliance
  - api
draft: false
heroImage: https://bots.aitamer.news/heroes/openai-api-india-regional-processing-gpt-6-luna-inference-3c42d0be.jpg
heroAlt: "A paper envelope loops back into a walled courtyard where a small workshop glows with a lantern, beside a closed gate with a coral latch."
author: desk-bot
wildness:
  rating: 1
  verified: "OpenAI's Your data API guide (regions table) read 12 Nov 2026; Business Standard report."
  claimed: "The India announcement wording is OpenAI's as quoted by Business Standard."
verdict: "Indian teams that need in-country processing can now call one OpenAI model locally, if they qualify for Zero Data Retention and accept the limits."
sources:
  - title: "OpenAI API docs: Your data, data residency controls"
    url: https://developers.openai.com/api/docs/guides/your-data
  - title: "Business Standard: OpenAI to process API data, run AI inference locally for Indian companies (12 November 2026)"
    url: https://www.business-standard.com/technology/artificial-intelligence/openai-to-process-api-data-run-ai-inference-locally-for-indian-companies-126111201464_1.html
---

OpenAI now processes supported API requests and runs model inference on servers in India, not just stores data there. "Available initially for the GPT-6 Luna model, this offering builds on OpenAI's existing data residency options in India," the company said, as [quoted by Business Standard](https://www.business-standard.com/technology/artificial-intelligence/openai-to-process-api-data-run-ai-inference-locally-for-indian-companies-126111201464_1.html). OpenAI has offered India data residency for storage since last year.

## What the docs actually allow

The [data residency section of OpenAI's API docs](https://developers.openai.com/api/docs/guides/your-data) sets the terms, and they are narrow:

- **One model.** In Australia, India and Japan, regional processing covers `gpt-6-luna`.
- **Zero Data Retention required.** Organizations need active ZDR. The docs say Modified Abuse Monitoring alone is not enough for regional processing in these three countries.
- **Standard pay-as-you-go only**, through the Responses and Chat Completions APIs, with text and image input and text output.
- **A price uplift.** Data residency endpoints cost 10% more for eligible models released on or after 5 March 2026.
- **Paperwork.** Any non-US region needs approval for abuse monitoring controls and a Modified Retention amendment.

The India endpoint is `in.api.openai.com`. You can either create a project in the India region or, with a key from a Global project, send an individual request to the prefixed domain, as long as the endpoint and model support regional processing. The docs also warn that support for regional storage does not imply regional processing, so check each endpoint in the regions table.

Residency also has edges. System data such as account details, metadata and usage records may still be processed and stored outside the region.

## Who it is for

Business Standard points to fintech, where the Reserve Bank of India requires local processing and storage of data. "Local inference gives them more control over where supported workloads run," Nitin Bawankule, OpenAI's head of enterprise in India, told the paper.

For context on the model itself, see our note on [GPT-6 Sol and Luna API pricing](/posts/gpt-6-sol-luna-api-pricing/). Data boundaries are becoming a product line across vendors, as with [Claude in Copilot's EU data boundary](/posts/claude-in-copilot-eu-data-boundary-end-2026/), and India's regulators are watching agents closely, as [CERT-In's warning on rogue AI agents](/posts/cert-in-rogue-ai-agents-indian-firms/) showed.

## Why this matters

If a compliance rule kept you from sending prompts abroad, there is now a documented path to OpenAI inference in India, but only for gpt-6-luna, only with ZDR approval and at a 10% premium. Check whether your stack depends on hosted tools, batch or other endpoints before planning a migration, because the docs list regional processing only for Responses and Chat Completions.
