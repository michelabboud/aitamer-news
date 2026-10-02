---
title: "MongoDB Atlas Agent Engine public preview — runtime, memory, governance"
description: "MongoDB launched Atlas Agent Engine in public preview (press Sep 29, 2026): unified execution, memory, and governance on Atlas with Voyage AI retrieval. Not GA, and no GA date is given. Preview pricing subject to change. Not a substitute for Atlas Vector Search; separate from the Voyage/Atlas $rerank deep dives. Framework names are used in Atlas’s framing only."
pubDate: 2026-10-01T14:20:00Z
specimen: 105
section: devops
subsection: mongodb
tags:
  - mongodb
  - atlas
  - atlas-agent-engine
  - voyage-ai
  - ai-agents
  - agent-runtime
  - agent-memory
  - mcp
  - a2a
  - governance
  - public-preview
  - devops
draft: false
heroImage: https://media.aitamer.news/heroes/mongodb-atlas-agent-engine.jpg
author: desk-bot
wildness:
  rating: 4
  verified: "Public preview Sep 29; runtime+memory+governance on Atlas; Voyage retrieval; MCP+A2A; not GA"
  claimed: "RTEB top / preview $ rates / Paysafe–Accenture–RedMonk quotes (MongoDB’s claims)"
verdict: "Agent layer on Atlas in preview, not GA. Benchmarks, prices and quotes are MongoDB’s claims. Separate from Vector Search, $rerank and the Investor Day presentation."
sources:
  - title: "MongoDB Launches Atlas Agent Engine — Press Release"
    url: https://www.mongodb.com/company/newsroom/press-releases/mongodb-launches-atlas-agent-engine-to-put-ai-agents-in-production-without-a-new-stack
  - title: "Atlas Agent Engine — Product"
    url: https://www.mongodb.com/products/platform/atlas-agent-engine
  - title: "Get started — agentengine.mongodb.com"
    url: https://agentengine.mongodb.com
---

MongoDB launched **Atlas Agent Engine** in **public preview** (press **2026-09-29**, Investor Day / Nasdaq MarketSite): a unified **execution, memory, and governance** layer for production AI agents on Atlas, with retrieval powered by **MongoDB Voyage AI** embeddings/reranking. New and existing Atlas customers start at [agentengine.mongodb.com](https://agentengine.mongodb.com) ([press](https://www.mongodb.com/company/newsroom/press-releases/mongodb-launches-atlas-agent-engine-to-put-ai-agents-in-production-without-a-new-stack), [product](https://www.mongodb.com/products/platform/atlas-agent-engine)).

This is in **public preview / limited availability** and is **not GA**; no GA date has been given. Voyage/Atlas **`$rerank`** is covered in its own post. It is **not a substitute for Atlas Vector Search**: Engine sits on Atlas (including search and vectors) as the agent layer, and Vector Search remains its own product surface.

## What it is

Atlas Agent Engine consolidates agent **runtime**, **long-term memory**, and **governance/identity** so teams aren’t stitching a separate stack or locking into one model/cloud ([press](https://www.mongodb.com/company/newsroom/press-releases/mongodb-launches-atlas-agent-engine-to-put-ai-agents-in-production-without-a-new-stack/), [product](https://www.mongodb.com/products/platform/atlas-agent-engine)).

- **Modular adopt:** memory and governance independently or with the runtime, on models/frameworks customers already use.
- **Open stance (vendor framing):** model-, framework-, and cloud-neutral; open standards **MCP** + **A2A**; press says config change vs rebuild when switching. Named frameworks (e.g. LangGraph, CrewAI, ADK, Semantic Kernel) are Atlas’s framing only, not exclusive certified stacks beyond the “any LLM or framework” product language.
- **Governance (vendor framing):** single control plane—identity on actions (human or agent), audit/trace, org policies/guardrails/cost controls “built in, not bolted on.”
- **Retrieval:** Voyage AI embed + rerank on Atlas-native retrieval ([press](https://www.mongodb.com/company/newsroom/press-releases/mongodb-launches-atlas-agent-engine-to-put-ai-agents-in-production-without-a-new-stack/)).

**Sibling (one line):** same Investor Day window also announced MongoDB **9.0** (GA) and **Atlas Infinite** (preview)—out of scope beyond this nod.

## Pricing and claims (vendor-reported)

Consumption-based pricing for **Atlas Agent Runtime** and **Atlas Agent Memory**; usage draws on **existing Atlas commitments**. Product-page preview rates (subject to change): runtime **$0.04 / 1000s / vCPU**; memory store **$0.25 / 1000 docs**; memory retrieve **$0.50 / 1000 docs** ([product](https://www.mongodb.com/products/platform/atlas-agent-engine)).

Also **MongoDB-stated only**—not independent: Voyage **RTEB** “top” / top-ranked framing; “fewer tokens”; partner quotes (Paysafe, Accenture, RedMonk); “70,000+ customers” platform backdrop ([press](https://www.mongodb.com/company/newsroom/press-releases/mongodb-launches-atlas-agent-engine-to-put-ai-agents-in-production-without-a-new-stack/)). The Investor Day / Nasdaq MarketSite staging and the forward-looking statements are not product capabilities.

## Who should care

Teams that want governed agent runtime + memory on the Atlas data plane without a greenfield stack should start at the [press release](https://www.mongodb.com/company/newsroom/press-releases/mongodb-launches-atlas-agent-engine-to-put-ai-agents-in-production-without-a-new-stack) and [product page](https://www.mongodb.com/products/platform/atlas-agent-engine).
