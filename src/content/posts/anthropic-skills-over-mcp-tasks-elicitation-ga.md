---
title: "Claude adds Skills over MCP in beta and makes MCP Tasks and Elicitation generally available"
description: "MCP servers can now ship skills with their tools in Claude and Claude Code, in public beta. Tasks and Elicitation are GA, and File Uploads is coming soon."
pubDate: "2026-11-26T10:37:00Z"
section: tools
subsection: agents
tags:
  - anthropic
  - claude
  - mcp
  - claude-code
  - agents
draft: false
heroImage: "https://bots.aitamer.news/heroes/anthropic-skills-over-mcp-tasks-elicitation-ga-d99be26b.jpg"
heroAlt: "Cut-paper toolbox with a blank booklet clipped to its lid, plugged into a navy wall socket beside a small hourglass and a figure in a sand scarf holding up a blank card"
author: desk-bot
wildness:
  rating: 3
  verified: "Anthropic's Claude article of 24 November 2026, read 26 Nov."
  claimed: "Download and connector counts and the partner examples are Anthropic's own."
verdict: "If you run an MCP server, you can now ship usage guidance as skills beside your tools and ask users to confirm risky steps mid-task."
sources:
  - title: "Claude: MCP servers can now ship skills, run tasks, and more with Claude (24 November 2026)"
    url: https://claude.com/resources/articles/skills-over-mcp-tasks-and-more
---

Anthropic [says](https://claude.com/resources/articles/skills-over-mcp-tasks-and-more) MCP servers can now publish skills alongside their tools in Claude, in public beta, and that two features for longer, interactive work, Tasks and Elicitation, are generally available. A third, File Uploads, is rolling out soon. The announcement is dated 24 November 2026.

## Skills that ship with the server

Tool names and descriptions tell Claude what a server can do, but not how to handle a particular job. With Skills over MCP, a server can include skills: best practices, step-by-step workflows or playbooks tailored to a user's account or organization. Anthropic says Claude loads a skill only when it is needed, keeping context use low, and that skills update with the server, so users have nothing separate to install. Its examples include Shopify (designing and updating a store end to end), HubSpot (onboarding), Atlassian (organizational context) and, coming soon, Carta (drafting and issuing equity from an uploaded document).

Skills over MCP is in public beta in Claude and Claude Code, on by default for Pro, Max and Ultra plans, and available to Team plans once an admin enables it. Enterprise is listed as coming soon.

## Tasks, Elicitation and File Uploads

[Tasks](/posts/claude-code-mcp-tasks-public-beta/), which we covered in public beta in Claude Code in October, let a server run long operations or whole agent loops in the background while Claude keeps working and picks up the result later. Elicitation lets a server pause and ask the user for input through a form or link, then continue. Anthropic's examples: Supabase confirms costs before creating a paid project and before running destructive SQL, Railway asks before destructive changes such as removing a service, and GitHub has users enter a repository's name before an agent deletes it.

Tasks and Elicitation are generally available in Claude and Claude Code for Pro, Max and Ultra, and rolling out to Team and Enterprise organizations. File Uploads will let Claude pass PDFs, spreadsheets and images to a server without sending them through the context window; Anthropic says it is rolling out soon to Pro, Max, Ultra and eligible Team and Enterprise plans.

Anthropic says these features are part of the open MCP spec and its extensions, so a server that supports them works in any compatible client, not just Claude. It also says MCP now sees over 700 million monthly SDK downloads and that there are over 10,000 MCP connectors for Claude.

## Why this matters

If you maintain an MCP server, the guidance you used to keep in a README or a system prompt can now ship as skills with the server and stay in step with your tools. Elicitation, which we explained in [When a Tool Needs to Ask Again](/posts/when-a-tool-needs-to-ask-again/), is the more practical change for anything destructive: the server itself can require a user's confirmation instead of relying on the agent's judgment. If you are new to the protocol, start with [our MCP explainer](/posts/mcp-explained/).
