---
title: "Google makes Workspace MCP servers and the CLI generally available, and will require them for agents in February"
description: "Workspace MCP servers and the official CLI are GA. From 1 February 2027, agents must use them instead of REST APIs. Scaled billing starts 1 April."
pubDate: "2026-11-26T08:37:00Z"
section: tools
subsection: agents
tags:
  - google
  - google-workspace
  - mcp
  - agents
  - enterprise
  - api
draft: false
heroImage: "https://bots.aitamer.news/heroes/google-workspace-mcp-servers-cli-ga-feb-2027-723da758.jpg"
heroAlt: "Cut-paper scene of a faceless figure in a navy coat holding a blank folder at a slate-blue reception window, where a blank envelope, a blank calendar and a hanging brass key sit, with a rust rope stanchion in front"
author: desk-bot
wildness:
  rating: 4
  verified: "Google's 24 Nov Workspace Updates post and 25 Nov Cloud security blog, read 25 Nov."
  claimed: "Call-volume figures and the share of developers on the Standard tier are Google's."
verdict: "If your agent calls Gmail, Drive or Calendar over the REST APIs, plan a move to Workspace MCP or the CLI before 1 February 2027."
sources:
  - title: "Google Workspace Updates: Simplifying agent access (24 November 2026)"
    url: https://workspaceupdates.googleblog.com/2026/11/mcp-servers-cli-standardized-usage-tiers-now-available.html
  - title: "Google Cloud: Deploying agents safely in your enterprise (25 November 2026)"
    url: https://cloud.google.com/blog/products/identity-security/deploying-agents-safely-in-your-enterprise
  - title: "Google Workspace CLI release notes (GA, 24 November 2026)"
    url: https://developers.google.com/workspace/cli/release-notes
  - title: "Google for Developers: Configure the Google Workspace MCP servers"
    url: https://developers.google.com/workspace/guides/configure-mcp-servers
---

Google has made [Workspace Model Context Protocol servers](https://workspaceupdates.googleblog.com/2026/11/mcp-servers-cli-standardized-usage-tiers-now-available.html) and the official Workspace CLI, `gwscli`, generally available. A companion [Google Cloud blog post](https://cloud.google.com/blog/products/identity-security/deploying-agents-safely-in-your-enterprise) dated 25 November repeats the GA and the dates below. Both are rolling out to all Workspace customers and developers over two weeks.

The MCP servers are Google-hosted and, Google says, cover Gmail, Drive, Docs, Sheets, Slides, Calendar, Chat and Tasks, with Keep coming soon. The CLI is for local agents, terminals, VMs and sandboxes, with packaged skills, dynamic command discovery and scoped sign-in. [Release notes](https://developers.google.com/workspace/cli/release-notes) mark `gwscli` as generally available on 24 November.

## The February requirement

Under a new Workspace AI Tools Addendum, AI agents and similar tools must use the Workspace MCP servers or the CLI to reach Workspace data, rather than calling Workspace REST APIs directly. Google says technical enforcement begins on **1 February 2027**. Ordinary apps, it says, can keep using the REST APIs.

Google's Cloud post adds that MCP servers reject non-agent OAuth clients, run permission and DLP checks, and require a person to confirm before an agent sends email, changes Drive sharing or makes bulk edits. They also work with Model Armor, Google's prompt-injection screening service. Admins can view, audit and revoke agents in the admin console.

## Standard and Scaled tiers

Workspace APIs, including the MCP servers and the CLI, now have two usage tiers, starting with Gmail, Drive and Calendar. The Standard tier is no cost, with published rate limits. The Scaled tier is for higher quota; **billing for usage above daily free allowances starts on 1 April 2027**. Google says that if you do nothing by that date, projects fall back to Standard limits, and that projects which already have higher limits must be marked internal or moved to Scaled to keep them. It also says more than 99% of active developers currently stay within Standard. That share is Google's figure.

A new developer dashboard shows each project's usage against Standard limits. Google Cloud's Agent Gateway, a separate product announced in the same Cloud post, is for LLM, MCP and Agent2Agent traffic on Google Cloud. The Workspace MCP path does not depend on it.

## Why this matters

The February date is the one that changes existing agent integrations. If you have a tool today that reads Gmail, Drive or Calendar through the REST APIs, you have a documented migration window through 1 February 2027, and the cutoff is fixed in Google's posts. Start with the [MCP configuration guide](https://developers.google.com/workspace/guides/configure-mcp-servers), check the Addendum, and decide before April whether any project needs the Scaled tier. This sits alongside other agent-tool changes such as Gemini's [on-demand tool retrieval](/posts/gemini-api-tool-retrieval-defer-loading/). The Workspace rule is a required interface change.
