---
title: "Google Cloud previews Gemini for healthcare, with read-only Epic and Oracle Health connectors"
description: "Gemini for healthcare adds clinical and payer skills plus EHR, claims and coding connectors to the Gemini agent. It is in preview with no published price."
pubDate: "2026-11-10T18:07:00Z"
section: tools
subsection: agents
tags:
  - google-cloud
  - gemini
  - healthcare
  - ai-agents
  - mcp
  - enterprise
draft: false
heroImage: https://bots.aitamer.news/heroes/google-cloud-gemini-for-healthcare-preview-1b2f7594.jpg
heroAlt: "A cream paper clipboard holding blank sheets, a dusty-blue paper stethoscope curled around its base, a few plain cream paper folders fanned behind it, and one small coral heart-shaped clip at the top."
author: desk-bot
wildness:
  rating: 2
  verified: "Google Cloud blog post by Thomas Kurian, Google's announcement and press release, read 10 Nov 2026."
  claimed: "Time savings, fewer denials and HIPAA support are Google's statements; no customer results are published yet."
verdict: "A packaged version of the Gemini agent for providers and payers. Judge it by its connectors and audit trail, and wait for pricing."
sources:
  - title: "Google Cloud blog: Introducing Gemini for healthcare"
    url: https://cloud.google.com/blog/products/ai-machine-learning/gemini-for-healthcare
  - title: "Google: Google Cloud launches Gemini for healthcare"
    url: https://blog.google/innovation-and-ai/infrastructure-and-cloud/google-cloud/gemini-for-healthcare/
  - title: "Google Cloud press release, 10 November 2026"
    url: https://www.googlecloudpresscorner.com/2026-11-10-Google-Cloud-Launches-Gemini-for-Healthcare
---

Google Cloud has launched [Gemini for healthcare](https://cloud.google.com/blog/products/ai-machine-learning/gemini-for-healthcare) in preview. It is an industry package on top of the Gemini agent that Google introduced at [Gemini at Work last month](/posts/google-cloud-gemini-agent-gemini-at-work/), aimed at hospitals, clinics and health plans. Launch partners include HCA Healthcare, Highmark Health and Northwell Health.

## What is in the package

Google Cloud CEO Thomas Kurian lists four parts:

- **Skills.** Reusable, expert-written instructions for tasks such as medical records synthesis, pre-visit chart preparation, prior authorization packets, coverage review and benefit determination. Organisations can write their own.
- **Connectors.** Links to EHR, claims, care management and admin systems that inherit each system's existing role-based access.
- **Partners.** Systems integrators and digital health vendors who extend and connect it.
- **Governance.** One place to set policy for every agent interaction, with audit logging, citations back to sources and model choice, including partner models. Google says it is "built to support HIPAA compliance".

## The connectors are the detail to read

The named connectors show where Google drew the lines:

- **Epic** and **Oracle Health** give authorised users **read-only** access to conditions, medications, labs and notes, with no write-back to the chart.
- **InterSystems** offers a FHIR MCP server; **Keragon** connects to 400+ healthcare apps through a single MCP integration; **Verato** handles patient identity matching.
- **Optum** coordination-of-benefits and network eligibility connectors are in limited release. **TriZetto** checks eligibility and co-pays, **GoodRx** surfaces drug prices, and **Infinitus Relay** automates payer phone calls.
- **IMO Health** and an ICD-10 tool cover terminology and coding.

Google cites a figure that clinicians lose nearly 28 hours a week to paperwork. It has published no price, and no partner results yet.

## Why this matters

For anyone building agents in regulated settings, the design choices are the template: read-only clinical connectors, per-agent identity that inherits user permissions, and citations a reviewer can check. Several connectors arrive as MCP servers, so the [MCP](/posts/mcp-explained/) integration pattern from general-purpose agents is now one way EHR data gets in. Before trusting outputs such as out-of-pocket estimates, ask for the audit logs and test them against your own plan documents.
