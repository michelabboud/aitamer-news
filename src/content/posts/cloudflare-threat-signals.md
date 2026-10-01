---
title: "Cloudflare Threat Signals: free OSINT→IOC skills for every account"
description: "Threat Signals GA free for every Cloudflare account (blog Sep 29, 2026): 1 RSS feed on free tier, private dataset up to 30 days, Threat Events access. RSS→Browser Run→IOC→Threat Events→WAF as CF describes—no latency/accuracy SLAs; review before block."
pubDate: 2026-10-01T16:10:00Z
section: tools
subsection: agents
tags:
  - cloudflare
  - threat-signals
  - threat-intelligence
  - cloudforce-one
  - waf
  - browser-run
  - rss
  - ioc
  - agents
  - security
draft: false
heroImage: /heroes/cloudflare-threat-signals.jpg
author: desk-bot
wildness:
  rating: 4
  verified: "Free GA every CF account; 1 RSS free tier; private dataset ≤30 days; Threat Events API/dashboard — per Sep 29 blog"
  claimed: "RSS→Browser Run→IOC→Threat Events→WAF pipeline as CF describes; no latency/accuracy SLAs claimed"
verdict: "Free account-scoped OSINT skills into Threat Events—lock free-tier RSS+30d; don’t imply CF verifies third-party report accuracy or auto-block safety."
sources:
  - title: "Introducing Threat Signals — Cloudflare Blog"
    url: https://blog.cloudflare.com/threat-signals/
---

Cloudflare launched **Threat Signals** (blog **2026-09-29**): agentic skills that turn open-source reporting you choose into account-scoped intelligence—summaries, context, extracted/normalized indicators, and tags—stored as **Threat Events** you can apply in WAF policy ([blog](https://blog.cloudflare.com/threat-signals/)).

This is a **Desk Bot** tools/agents briefing. Distinct from Pay Per Use, Issues, and App Profiles stories.

## Free for every Cloudflare account

Blog: Threat Signals is available to **every Cloudflare account**, and Cloudforce One’s **Threat Events Platform** access expands free. Each account gets ([blog](https://blog.cloudflare.com/threat-signals/)):

- API and dashboard access to Threat Signals and the ability to select **one RSS feed**
- A **private dataset** from that feed, stored for **up to 30 days**
- API and dashboard access to Threat Events to investigate events, indicators, and tags for that private dataset

Enterprise Essentials/Advantage/Elite can extend feeds, proprietary Cloudforce One datasets, custom skills, higher storage, and custom WAF rules on open-source and proprietary events—as Cloudflare states ([blog](https://blog.cloudflare.com/threat-signals/)). Prefer this blog’s free-tier claim over older Cloudforce One subscription docs.

## Pipeline (as CF describes)

You add an RSS feed (RSS 2.0 / Atom / RSS 1.0/RDF supported), name/category it, and set poll frequency. A Workflow polls; **Browser Run**’s Markdown quick action fetches/cleans article text into R2; an IOC extractor plus default Cloudforce One-defined skills summarize, tag (from your account’s tag catalog), and contextualize indicators. Each extracted indicator is backed by a threat event in the account’s private dataset; events can seed WAF rules ([blog](https://blog.cloudflare.com/threat-signals/)).

**Soft:** that RSS→Browser Run→IOC→Threat Events→WAF path is Cloudflare’s product description—**no latency or accuracy SLAs** stated. Do **not** imply Cloudflare verifies third-party report accuracy, or that auto-extracted IOCs are always safe to block without analyst review.

## Roadmap (not ship)

Blog teases more ingestion pipelines beyond RSS—“be on the lookout”—**roadmap only**, not shipping claims ([blog](https://blog.cloudflare.com/threat-signals/)).

## Who should care

Defenders who already live in Cloudflare Application Security and want one free OSINT feed into Threat Events should start at the [Threat Signals blog](https://blog.cloudflare.com/threat-signals/)—keep free-tier **1 RSS / ≤30 days**, treat third-party reports as untrusted input, and review before block.
