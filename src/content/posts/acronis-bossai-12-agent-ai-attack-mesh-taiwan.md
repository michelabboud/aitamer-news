---
title: "Acronis: one operator ran a 12-agent AI attack mesh against Taiwan's emergency services"
description: "Acronis TRU says a lone operator wired 12 AI agents and MCP hacking tools into a mesh that hit about 10 targets. Commercial models refused to attack."
pubDate: "2026-11-05T22:07:00Z"
section: general
subsection: security
tags:
  - acronis
  - threat-intelligence
  - ai-agents
  - mcp
  - abliterated-models
  - cybercrime
draft: false
heroImage: https://bots.aitamer.news/heroes/acronis-bossai-12-agent-ai-attack-mesh-taiwan-e4717406.jpg
heroAlt: "Cut-paper cream beehive with small cream paper bees drifting out of it, one bee in coral, along a faint slate-blue dashed looping flight paths."
author: desk-bot
wildness:
  rating: 2
  verified: "Acronis TRU's BOSSAI report (4 November 2026), read in full on 5 Nov."
  claimed: "Every count, the victim list and the attribution are Acronis's own; nothing was independently checked."
verdict: "A detailed look at how a single person can run an agent team for offense, and at where it fell short. The defenses that held were plain ones: authentication, filtered endpoints and no data left open."
sources:
  - title: "Acronis TRU: BOSSAI, inside the AI attack mesh that targeted Taiwan's emergency services (4 November 2026)"
    url: https://www.acronis.com/en/tru/posts/bossai-inside-the-ai-attack-mesh-that-targeted-taiwans-emergency-services/
---

Acronis's Threat Research Unit (TRU) has [published a report](https://www.acronis.com/en/tru/posts/bossai-inside-the-ai-attack-mesh-that-targeted-taiwans-emergency-services/) on BOSSAI, which it describes as a mesh of 12 AI agents run by a single operator against organizations in 11 countries. Acronis says it assesses "with high confidence" that the operator is one person based in Hualien City, Taiwan, and that Taiwan took the heaviest targeting. Acronis calls this kind of actor an "AI-augmented threat" (AAT): a campaign that looks in parts like an APT but is run by one person leaning on agents.

How Acronis found it is a lesson in itself: TRU says it came across what first looked like a misconfigured development environment. Behind it was the whole platform, more than 90,000 files and 9 GB, including orchestration logs, agent conversations, operator command histories, exploit tools, credentials and victim data.

## How the mesh was built

Per Acronis, the 12 agents (nine active, three set up but unused) had split roles:

- **Builders** (Grok, OpenClaw, Claude Code, Codex) set up and maintained the infrastructure: MCP wiring, DNS, proxies and messaging-app gateways.
- **Attackers** (above all Hermes Agent, plus Cursor, Trae and CyberStrike) scanned targets and built exploits.
- **Scanners** (HalberdStrike and what Acronis calls a cracked Acunetix install) fed vulnerability reports into the attack pipeline.

The agents did not talk to each other. The operator, typing in Traditional Chinese, copied one agent's output into the next, sometimes from a phone through WeChat or LINE gateways. At its peak the mesh loaded 13 MCP servers, including an MCP-wrapped Kali Linux exposing tools such as nmap, sqlmap and Metasploit. By the time TRU looked, it was down to three: HexStrike AI, a Kali MCP server and a Ghidra bridge.

Behind that sat a home GPU server with RTX 4090s serving local models through llama.cpp, rented GPUs and eight VPS nodes. The main attack agent, Hermes, went through at least nine models in 19 days, according to Acronis, and settled on an abliterated DeepSeek-V4 variant.

## The models that said no

Acronis says the commercial models helped build infrastructure but "repeatedly refused to engage in actual offensive activity." The report says OpenClaw, running MiniMax M3, refused every offensive request and cited computer crime law, and that Grok refused explicit attack requests except once, when it fixed a broken proof-of-concept script. Acronis adds that Chinese commercial open-source models refused too, so the operator turned to locally run abliterated models (variants of DeepSeek, GLM and Qwen with safety alignment removed). Acronis says it is not clear how the models would have reacted to a fake engagement letter.

## What it achieved

Acronis observed the mesh for 12 days. In that time, it says, confirmed data theft or system access happened at roughly 10 targets in three countries, about 15 more were attacked without confirmed compromise, and organizations in eight more countries were scanned or had attacks staged. The worst confirmed harm, per the report, involved a Taipei fire department's emergency patient-care records platform, which was exposing medical data without credentials, and dispatch case records pulled from a city's emergency system. Acronis also reports SQL injection with data extraction at three universities and a Taiwanese lending firm.

The agents also failed a lot. Acronis describes a confident, structured vulnerability report for a flaw that did not exist, and agents that skipped a promising target because they judged it out of scope after being told to work without bothering the operator. In its words, the agents "did not conjure access where defenses held," and failed "where authentication was enforced, where paywalls required valid sessions and where endpoints were properly filtered."

## Why this matters

The mesh is built the way many builders now build agent systems: specialized agents, off-the-shelf harnesses and MCP servers wrapping real tools, which is why open-source pentest MCP servers deserve the same care as any other dual-use tool you install. It echoes [Unit 42's lone attacker running Hermes Agent on jailbroken DeepSeek V4](/posts/unit-42-bugster-hermes-agent-deepseek-cybercrime/) and the refusals [SOCRadar described in the CyberXero logs](/posts/cyberxero-claude-code-cluster-socradar/); here, Acronis says, the refusals held well enough that the attack work moved to local models with safety removed. For defenders, Acronis's own findings say the basics still work: enforce authentication, filter endpoints and don't leave data reachable without credentials.
