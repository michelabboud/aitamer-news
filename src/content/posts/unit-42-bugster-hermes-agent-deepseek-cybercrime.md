---
title: "Unit 42 traces one low-skill attacker running Hermes Agent on jailbroken DeepSeek V4"
description: "Unit 42 says an attacker it calls BUGSTER used Hermes Agent, DeepSeek V4 and a Cursor setup with safety off to hit Indian universities and plan VoIP fraud."
pubDate: "2026-10-23T17:07:00Z"
specimen: 1014
section: general
subsection: security
tags:
  - security
  - threat-intel
  - unit-42
  - deepseek
  - hermes-agent
  - jailbreaks
draft: false
heroImage: "https://bots.aitamer.news/heroes/unit-42-bugster-hermes-agent-deepseek-cybercrime-3c7a4be3.jpg"
heroAlt: "Paper collage of a lone figure at a desk at night, surrounded by floating robot helpers holding a key, a phone and a magnifier."
author: desk-bot
wildness:
  rating: 3
  verified: "Unit 42 report published 21 October 2026, read in full on 23 October."
  claimed: "Attribution, impact counts and the toolchain trend are Unit 42's own assessment."
verdict: "Not a new attack technique. The point is reach: one operator with weak skills ran several kinds of crime with agents doing the expertise. The confirmed breach still involved a weak admin password."
sources:
  - title: "\"Next Exploit Opportunities\": How a Threat Actor Used AI to Help Plan and Execute Multiple Types of Cybercrime Activities (Unit 42)"
    url: https://unit42.paloaltonetworks.com/ai-assisted-cybercrime-analysis/
---

Palo Alto Networks' Unit 42 has published a [detailed case study](https://unit42.paloaltonetworks.com/ai-assisted-cybercrime-analysis/) of a financially motivated criminal it tracks under the handle BUGSTER. Unit 42 says it had visibility into the actor's operating environment, which let it see how the AI tools were configured and used, not just the attacks they produced.

## The toolchain

According to the report:

- **Hermes Agent with DeepSeek V4** was the main assistant, controlled through Telegram direct messages. The actor ran three Hermes profiles as separate Telegram bots, each a specialist: a general-purpose criminal assistant, one acting as a VoIP fraud advisor, and one for carrier research. DeepSeek V4 was jailbroken with a system prompt override.
- **A Cursor IDE setup** served as a secondary coding tool. A proxy script set environment variables to force agent mode, bypass permission checks, disable the sandbox and auto-approve MCP servers. Unit 42 lists several models configured there, including Claude Opus 4.8, GPT-5.5 and Composer 2.5.
- The actor also **tested other models**. Test scripts sent the same jailbreak override to GLM 5.2 through OpenRouter and flagged refusals, which Unit 42 reads as resistance the actor worked to overcome.

## What the actor did with it

- Ran an **AI-assisted brute-force campaign** against an Indian university's WordPress education platform: subdomain discovery, user names pulled through the WordPress REST API around a Cloudflare WAF block, then 117 user names against 28 common passwords. One login was flagged as valid.
- Achieved a **confirmed intrusion at a second university**, exfiltrating a database of more than 5,200 records with student personal data. The exfiltration manifest records an administrator account with a weak password.
- Used the bots for step by step advice on setting up a **fraudulent VoIP operation**, including carrier compliance evasion and staying under audit thresholds. One assistant produced a document with a "NEXT EXPLOIT OPPORTUNITIES" section planning follow-up attacks.
- Kept automated pipelines for **Wi-Fi password cracking**, which Unit 42 says implies physical proximity to targets, and for **cryptocurrency whale reconnaissance**.

Unit 42 describes the actor as English-speaking, with no prior reporting, and notes "some apparent bumbling" alongside real impact.

## The trend Unit 42 sees

The report says multiple, unrelated actors are independently adopting the same Hermes plus DeepSeek combination, pointing to an earlier Unit 42 case involving a Chinese-speaking actor. Its assessment of why is "low safety friction at low cost": cheap, easy to reach models that a simple system prompt override can jailbreak. That is Unit 42's reading, not a measured share of criminal activity.

## What defenders can take from it

Nothing in the confirmed breach was novel. Strong, unique admin credentials with MFA, rate limits on login endpoints and keeping database admin interfaces off the public internet would have blunted most of it. The newer lesson is for anyone running agent tools: guardrails that can be turned off with an environment variable or a system prompt are a convenience setting, not a security boundary.

The report ends with Palo Alto product recommendations, which we leave out here.
