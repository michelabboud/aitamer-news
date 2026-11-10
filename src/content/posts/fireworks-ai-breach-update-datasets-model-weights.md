---
title: "Fireworks AI says its October breach reached customer datasets and model weights"
description: "Fireworks' 9 Nov update widens its October incident: billing data, and for some accounts secrets, datasets and incomplete model weights. Inference unaffected."
pubDate: "2026-11-10T08:07:00Z"
specimen: 1411
updatedDate: "2026-11-10T11:15:00Z"
section: general
subsection: security
tags:
  - fireworks-ai
  - security
  - breach
  - llmjacking
  - inference-platforms
  - incident-response
draft: false
heroImage: https://bots.aitamer.news/heroes/fireworks-ai-breach-update-datasets-model-weights-6eeb5130.jpg
heroAlt: "A half-open cream paper drawer of stacked sheets with a torn corner, slate-blue footprints leading in from a side door and a coral tag on the handle."
author: desk-bot
wildness:
  rating: 2
  verified: "Fireworks' updated security bulletin (last updated 9 Nov 2026) read 10 Nov."
  claimed: "Scope and 'no impact' findings are Fireworks' own; investigation ongoing, customers unnamed."
verdict: "If you use Fireworks for fine-tuning or batch jobs, check for a notice, rotate any secrets you stored there and review what datasets you uploaded."
sources:
  - title: "Fireworks AI: Update on October 2026 security incident"
    url: https://fireworks.ai/security/bulletins/october-2026-security-incident-update
  - title: "Unite.AI: Fireworks AI expands breach disclosure to datasets and model weights"
    url: https://www.unite.ai/fireworks-ai-expands-breach-disclosure-to-datasets-and-model-weights/
  - title: "AI Tamer: Wiz counts nine AI developer platforms breached in October"
    url: https://aitamer.news/posts/wiz-black-october-ai-developer-platform-breaches-llmjacking/
  - title: "Notion: Security incident involving a third-party AI vendor"
    url: https://www.notion.com/en-gb/security/advisories/security-incident-involving-a-third-party-ai-vendor
---

Fireworks AI has widened its account of the security incident it first disclosed in October ([Fireworks bulletin](https://fireworks.ai/security/bulletins/october-2026-security-incident-update)). Its 9 October bulletin said only secrets stored at Fireworks, such as those used in evaluation jobs, were known to have been accessed. The 9 November update says investigators have since found impact to **account and billing information**, and for a limited set of accounts to **secrets, datasets and incomplete models**.

## What Fireworks says was accessed

- **Resource metadata:** identifiers, display names, descriptions and creation times.
- **Billing data:** billing and shipping addresses, invoice and payment history, account balance and credit usage. Fireworks does not store card numbers, and says they were not affected.
- **Model weights and datasets:** for certain customers, a subset of incomplete model weights and datasets.

Fireworks is notifying affected customers directly and has not said how many there are.

## A second way in

The update describes a separate route. A third-party cloud provider that hosted Fireworks research and development machines had its own security incident on 23 October, and on 24 October the attacker used it to reach Fireworks development machines and run an unauthorised workload that caused more customer data impact. Fireworks says it detected that the same day and has seen no further successful access to its customer platform since 25 October. It does not name the provider.

Fireworks says the evidence links the activity to a financially motivated group that sells stolen LLM access to illicit routing gateways, the "LLMjacking" trade that [Symantec](https://aitamer.news/posts/symantec-skynet-llmjacking-agent-exposed-ai-endpoints/) and Wiz have both tracked. Fireworks was the first of the nine platforms in [Wiz's "Black October" count](https://aitamer.news/posts/wiz-black-october-ai-developer-platform-breaches-llmjacking/).

## What changed for customers

- Self-serve dataset uploads and downloads for Batch Inference and dataset-based training are **switched off** while the investigation continues.
- Fireworks says it has found no impact to Inference, the Training SDK or Nexus, which keep no data by default, but adds that its findings are only as of now.
- Credentials and service accounts were revoked and replaced, affected systems isolated, and Palo Alto Networks Unit 42 is helping with forensics. Law enforcement has been told.

## Why this matters

The first bulletin pointed customers at rotating secrets; this one means anything you uploaded for training or batch jobs may be in scope too. If you use Fireworks, check for a direct notice, rotate every key or token you ever stored in its evaluation or job settings, and list which datasets and fine-tunes you kept there. If those include customer or licensed data, involve your own security and legal teams now rather than waiting for a final report.

**Update, 10 November 2026:** Notion is the first customer to name its exposure. In a [security notice](https://www.notion.com/en-gb/security/advisories/security-incident-involving-a-third-party-ai-vendor) updated 9 November, Notion says Fireworks told it on 6 November that customer data may have been accessed, and confirmed on 8 November a dataset that included Notion AI chat transcripts used for its Insights feature, affecting fewer than 1% of workspaces. Notion says most were "unattributable", with no author or workspace labels and no tool-call results. It has disabled Insights, stopped serving open-weight models through Fireworks, and tells affected customers to rotate any passwords, API keys or other credentials they pasted into Notion AI during the incident window.
