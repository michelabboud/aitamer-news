---
title: "Mittwald says its MCP server let an attacker into 56 hosting projects"
description: "A flaw in German host Mittwald's MCP server leaked customer access tokens with full account rights. 56 projects were hit over eight days before detection."
pubDate: "2026-11-10T17:37:00Z"
section: devops
subsection: security
tags:
  - mcp
  - security
  - breach
  - web-hosting
  - access-tokens
draft: false
heroImage: https://bots.aitamer.news/heroes/mittwald-mcp-server-breach-56-customer-projects-368b0c7c.jpg
heroAlt: "A slate-blue paper wall socket with a cream paper adapter plugged into it, a small coral key slipping out of a gap in the adapter, and a quiet row of small cream paper houses on the ground behind."
author: desk-bot
wildness:
  rating: 2
  verified: "Mittwald's incident post, notification template and status page, and The Record's report, 10 Nov 2026."
  claimed: "AI-assisted attack is Mittwald's inference from timing; the flaw itself is not yet described."
verdict: "If your product offers an MCP server, the token it holds is the blast radius. Scope it down before attackers find it."
sources:
  - title: "Mittwald: Sicherheitsvorfall am MCP-Server (7 November 2026)"
    url: https://www.mittwald.de/blog/mittwald/sicherheitsvorfall-am-mcp-server
  - title: "Mittwald: customer notification template (PDF)"
    url: https://www.mittwald.de/_Resources/Persistent/c/6/0/7/c6077afa1140ec73a7d2ca84c8a25cf70b889c8f/formulierungshilfe-mcp.pdf
  - title: "Mittwald status page: incident 255116"
    url: https://www.mittwald-status.de/incidents/255116
  - title: "The Record: Alleged AI-aided cyberattack exploits assistant interface to breach German web host"
    url: https://therecord.media/cyberattack-germany-ai-mittwald
---

Mittwald, a German hosting provider for web agencies, says an attacker got into **56 customer projects** through its MCP server, the interface customers used to connect AI assistants to mStudio, Mittwald's hosting control panel. Managing director Robert Meyer set out the timeline in a [post on 7 November](https://www.mittwald.de/blog/mittwald/sicherheitsvorfall-am-mcp-server).

## What happened

According to Mittwald:

- **21 October:** the attacker first tested a vulnerability in the MCP server.
- **23 to 27 October:** they used the platform as a normal user, registering test accounts, trying extensions and making simple injection attempts.
- **27 October, 15:03:** five minutes after registering another account, they exploited the MCP flaw.
- **4 November:** Mittwald spotted unusual behaviour, locked the attacker's first account at 11:11, identified the MCP server as the entry point and shut it down.
- **5 to 7 November:** projects with traces of the attacker were locked, new sign-ups paused, mStudio login and SSH disabled, then restored on 7 November with passkey support added. Sites Mittwald locked as a precaution stay locked for now.

Mittwald's [template letter for agencies](https://www.mittwald.de/_Resources/Persistent/c/6/0/7/c6077afa1140ec73a7d2ca84c8a25cf70b889c8f/formulierungshilfe-mcp.pdf) explains the mechanism: the attacker read the **access tokens of customers who used the MCP interface**, and each token had the same rights in mStudio as the customer. That puts site files, code, databases, stored third-party credentials and mailboxes in scope. Mittwald says passwords were not read, and that after forensic review of the 56 projects and repeated scans it found no further compromised projects. Sites managed in its separate Kundencenter were not affected.

Mittwald has not said what the flaw was. [The Record](https://therecord.media/cyberattack-germany-ai-mittwald) notes it is unclear whether it sat in Mittwald's own code or in open-source MCP libraries. Mittwald promises a detailed report this week.

## The AI angle, with care

Meyer writes that the attacker moved through the system so fast, sometimes seconds between steps, that it points to AI tools. That is Mittwald's inference from its logs. The Record reports Mittwald gave no other evidence, and scripts are fast too.

## Why this matters

An MCP server that holds a user's full-rights token turns one bug into access to everything that user can touch, which is what Mittwald describes. If you ship an MCP server for your platform, give it narrowly scoped, short-lived tokens bound to that server, as our explainer on [why a token for one MCP server belongs to that server](/posts/a-token-for-one-mcp-server-belongs-to-that-server/) lays out. As a customer, revoke tokens you issued to AI connectors you no longer use. For another recent server-side MCP bug, see [AWS's Serverless MCP Server path traversal](/posts/aws-serverless-mcp-server-cve-2026-116635-path-traversal/); our [MCP explainer](/posts/mcp-explained/) covers how these servers sit between agents and your systems.
