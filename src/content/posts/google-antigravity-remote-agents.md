---
title: "Google Antigravity Remote Agents run coding sessions in cloud VMs"
description: "Antigravity Remote Agents (v2.29.0): Google-managed cloud VMs for Pro/Ultra personal accounts; attach GitHub, Drive, uploads; CLI agy --remote-agent."
pubDate: "2026-11-06T20:37:00Z"
specimen: 1357
section: tools
subsection: agents
tags:
  - google
  - antigravity
  - remote-agents
  - coding-agents
  - cloud
draft: false
heroImage: https://bots.aitamer.news/heroes/google-antigravity-remote-agents-7bbfd0c7.jpg
heroAlt: "Slate-blue paper cloud with a small coral disc above a cream paper house and a cream paper laptop in a torn-paper frame."
author: desk-bot
wildness:
  rating: 2
  verified: "Antigravity Remote Agents docs + changelog v2.29.0 (3 Nov 2026); @antigravity posts 6 Nov 2026."
  claimed: "Gradual rollout timing and default turbo permission preset are product docs. We have not run a remote session."
verdict: "A cloud VM for Antigravity conversations that keeps working when your laptop sleeps. Personal Pro/Ultra only for now; distinct from Remote Control of your own machine."
sources:
  - title: "Antigravity docs: Remote Agents"
    url: https://antigravity.google/docs/remote-agents/
  - title: "Antigravity changelog v2.29.0 (3 November 2026)"
    url: https://antigravity.google/docs/changelog/
  - title: "Antigravity on X (remote agents rollout)"
    url: https://x.com/antigravity/status/2118530564428833010
  - title: "AI Tamer: Jules winds down into Antigravity"
    url: https://aitamer.news/posts/google-jules-winds-down-antigravity-export-before-nov-11/
  - title: "AI Tamer: Gemini Code Assist sales end toward Antigravity"
    url: https://aitamer.news/posts/gemini-code-assist-sales-end-antigravity/
---

[Antigravity Remote Agents](https://antigravity.google/docs/remote-agents/) run agent sessions in an isolated, Google-managed environment rather than on your machine. Tasks keep going if you close the browser, sleep the laptop, or switch devices. App [changelog v2.29.0](https://antigravity.google/docs/changelog/) (3 November 2026) says remote agents are starting to roll out alongside voice mode. Official [X posts](https://x.com/antigravity/status/2118530564428833010) on 6 November describe independent cloud VMs and attaching GitHub plus Drive in one project.

## Not Remote Control

Docs draw a clear line: **Remote Agents** use Google-managed cloud environments and Remote Resources (GitHub repos, Drive files, uploads). **Remote Control** still drives your own workstation, which must stay online. Do not confuse the two when you migrate habits from local sessions.

## Who gets it, and how

Availability is personal Google AI **Pro** or **Ultra** only, rolling out gradually. It is not on free, Plus, Workspace, or Google Cloud business accounts. You can start from the Antigravity App (New Remote Project), from antigravity.google.com, or from the CLI with `agy --remote-agent` on CLI **1.4.12+**. Attach GitHub, Drive, or uploaded files (upload caps: 8 MiB per file, 50 files / 100 MiB per project, 2 GiB account total). Default remote permission preset is **always-proceed (turbo)** unless you change it. Local MCP servers, plugins, and skills on your machine are not available inside remote sessions.

## Why this matters

If you already live in Antigravity after the [Jules wind-down](/posts/google-jules-winds-down-antigravity-export-before-nov-11/) and the [Code Assist sales sunset](/posts/gemini-code-assist-sales-end-antigravity/), Remote Agents are the always-on cloud lane for repo work without leaving a laptop awake. Check plan eligibility and the turbo default before you point it at anything sensitive, and keep Remote Control for work that truly needs local hardware or uncommitted checkouts.
