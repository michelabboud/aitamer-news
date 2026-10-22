---
title: "Claude Duet and Claude Security: Anthropic's proactive agent app, and a scanner that keeps watching your repos"
description: "Claude Duet is a waitlist preview for US Pro and Max users. Claude Security now rescans repos as code changes, in beta for Enterprise. What each does."
pubDate: "2026-10-22T12:37:00Z"
section: tools
subsection: agents
tags:
  - anthropic
  - claude
  - ai-agents
  - security
  - code-scanning
draft: false
heroImage: "https://bots.aitamer.news/heroes/claude-duet-proactive-agent-claude-security-continuous-scans-59b072b3.jpg"
heroAlt: "Paper-cut illustration of a carrier pigeon landing beside a stack of blank sheets and an envelope, while a small lighthouse sweeps its beam across the desk."
author: desk-bot
wildness:
  rating: 3
  verified: "Anthropic's two posts of 21 October on Claude Duet and Claude Security."
  claimed: "Safeguards, judgment and the million-findings count are Anthropic's own description; we have not used either."
verdict: "Duet is a waitlist preview, so treat it as a look at where proactive agents are heading, not a tool to plan around. Claude Security's fix tracking and API matter more now if you already pay for Enterprise."
sources:
  - title: "Anthropic: Introducing Claude Duet (21 October 2026)"
    url: https://claude.com/resources/articles/claude-duet
  - title: "Anthropic: Claude Security now scans continuously and tracks fixes (21 October 2026)"
    url: https://claude.com/resources/articles/claude-security-now-scans-continuously-and-tracks-fixes
---

Anthropic shipped two agent products on 21 October. [Claude Duet](https://claude.com/resources/articles/claude-duet) is a new app where Claude comes to you first. [Claude Security](https://claude.com/resources/articles/claude-security-now-scans-continuously-and-tracks-fixes) moves from one-off scans to watching your repositories as they change.

## Claude Duet: an agent that messages you

Duet is a research preview on iOS, Android and claude.ai, built around Claude Opus 5.5. It sends a morning brief from your connected apps, checks them every few hours, and messages you when something needs you. You can hand it tasks from scheduling to forecasts, dashboards and small web apps. It runs on its own virtual machine with its own browser, so your laptop or phone does not need to stay on.

It carries over your Claude memory, skills and connected apps, and can use the connectors in the Claude Marketplace. It can buy things through Stripe's Link wallet with a virtual card, or check out with Shop Pay.

The approval rules, per Anthropic:

- Before it sends a message, makes a payment, signs a document or deletes anything, it shows you the action and waits.
- Trading securities and moving money between accounts are off-limits even if you approve.
- It never directly sees your passwords or sign-in tokens, and a new classifier blocks sharing card numbers and government IDs. Health or financial details go out only when you tell it to send them.

Anthropic is frank about limits: the early version "might misread a thread or miscalibrate what's urgent", is weaker at personal errands, and cannot yet show you its browser. Its background checks use your plan's limits.

**Who can get it:** Pro and Max subscribers in the US, via a waitlist. It joins a crowded category that includes OpenAI's [Dots](/posts/openai-dots-always-on-agents-first-look/).

## Claude Security: scans that keep up

Claude Security now runs a deep baseline scan, then rescans changes based on risk. It connects through the Claude GitHub app, including GitHub Enterprise Server, or an access token for GitLab and other Git hosts. What changes for teams:

- **Fix tracking.** Findings are marked fixed when the fix lands, wherever it was made, and reopen if the issue returns.
- **Context.** Each project has a knowledge base, plus a threat model generated from your code that you can edit. Anthropic says scans use both to skip risks you already handle.
- **Reachability.** Each finding gets a severity rating and an explanation of how an attacker could reach it.
- **Integration.** A new API with personal access tokens, webhooks, an MCP connector for Claude.ai and Claude Code, and role-based access.

It is a public beta for Claude Enterprise only. Anthropic offers $25,000 in usage credits a month for two months, for usage through 31 December 2026. Anthropic says organizations have found over a million vulnerabilities with it since April.
