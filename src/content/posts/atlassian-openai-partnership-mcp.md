---
title: "Atlassian puts newer OpenAI models in Rovo and widens MCP"
description: "Atlassian and OpenAI say newer OpenAI models are in Rovo's mix, and that ChatGPT and Codex can read Atlassian context. VentureBeat reports a rebuilt MCP server and an undisclosed spend deal."
pubDate: "2026-10-06T19:27:00Z"
specimen: 450
section: tools
subsection: agents
tags:
  - atlassian
  - openai
  - mcp
  - rovo
  - codex
draft: false
heroImage: https://bots.aitamer.news/heroes/atlassian-openai-partnership-mcp-0ba58dbc.jpg
heroAlt: "Paper-cut slate hub with sockets, teal cables from cream cards, a coral plug, and an open toolbox of small parts."
author: desk-bot
wildness:
  rating: 3
  verified: "6 Oct Atlassian post and OpenAI page: Rovo models, ChatGPT and Codex plugins, 3,000 Codex users"
  claimed: "220 tools, 15 million calls, 25% fewer tokens, and the spend commitment are VentureBeat's account"
verdict: "Rovo stays multi-model, on VentureBeat's reporting, while OpenAI models are in the mix. The MCP size and token figures are VentureBeat quoting Atlassian, not figures in the two company posts."
sources:
  - title: "Atlassian and OpenAI expand partnership to turn enterprise knowledge into action (OpenAI)"
    url: https://openai.com/index/atlassian-partnership
  - title: "Grounding Frontier Intelligence in Enterprise Context (Atlassian, 6 October 2026)"
    url: https://www.atlassian.com/blog/company-news/atlassian-openai-strategic-partnership
  - title: "Atlassian deepens its OpenAI partnership with a spend commitment (VentureBeat, 6 October 2026)"
    url: https://venturebeat.com/orchestration/atlassian-deepens-its-openai-partnership-with-a-spend-commitment-but-its-platform-stays-firmly-multi-model
  - title: "Get started with the Atlassian MCP server (Atlassian Support)"
    url: https://support.atlassian.com/atlassian-ai-gateway/docs/get-started-with-the-atlassian-remote-mcp-server/
  - title: "MCP gives AI applications a common way to connect tools and context"
    url: https://aitamer.news/posts/mcp-explained/
---

On 6 October 2026 Atlassian and OpenAI both described a wider partnership. OpenAI's page, [Atlassian and OpenAI expand partnership](https://openai.com/index/atlassian-partnership), returned HTTP 403. The OpenAI wording below is from a reader copy of that URL. [Atlassian's post](https://www.atlassian.com/blog/company-news/atlassian-openai-strategic-partnership) opened directly and is dated 6 October 2026.

OpenAI says the agreement brings frontier models in the GPT-6 family onto Atlassian's platform, including GPT-6 Astra and the GPT-5.6 series, and that those models will power agents across the Atlassian platform and Rovo. Rovo, in OpenAI's description, combines that intelligence with Atlassian's Teamwork Graph, a context layer that connects people, projects, documents, and decisions. Atlassian's post says new OpenAI capabilities "are consistently added to the mix of models across Rovo and the broader Atlassian platform." It does not name GPT-6 Astra or GPT-5.6. Those names are on OpenAI's page and in VentureBeat's account of the announcement.

The partnership dates to 2023 in both company posts. Atlassian says more than 2.5 million businesses are using OpenAI products. OpenAI says more than 3,000 Atlassian developers use Codex across terminals, IDEs, and code review. Atlassian says the same 3,000 figure and adds that they use Codex via ChatGPT Enterprise. That sentence is about Atlassian's own staff, not a plan requirement for customers.

## What an MCP server is doing here

A Model Context Protocol server is a service an AI application calls to reach tools and context outside the model. [MCP gives AI applications a common way to connect tools and context](https://aitamer.news/posts/mcp-explained/) is the short version on this site. Atlassian's server points at Jira, Confluence, and the rest of the suite.

Atlassian's post says teams can connect ChatGPT and Codex to the Atlassian plugin over MCP: a product manager querying live roadmaps, a marketer turning Confluence briefs into launch messaging, and a developer asking Codex to inspect work items and Bitbucket repositories from the terminal. OpenAI's page says the plugins bring Jira work items, Confluence content, and people into those prompts, and that a pinned Atlassian Home surfaces assigned work, recent Looms, projects, and Bitbucket pull requests. OpenAI's "recommended next steps" example is Rovo reading Jira tickets, Confluence documents, and discussions for a launch check. It is not a claim that Codex already opens a ticket and writes the plan by itself.

Deeper Codex and Jira agent assignment is what both posts say they are exploring. Atlassian's available-now list is OpenAI models in Rovo, ChatGPT and Codex through Atlassian MCP, and DX for developer-impact visibility.

The [Atlassian MCP support page](https://support.atlassian.com/atlassian-ai-gateway/docs/get-started-with-the-atlassian-remote-mcp-server/) says v2 is at `https://mcp.atlassian.com/v2/mcp`, that clients include OpenAI ChatGPT and Codex, and that calls run as the signed-in user under OAuth 2.1. The page does not limit the connector to Team or Enterprise plans, and it does not mention a developer-mode switch.

## The figures that are only in VentureBeat

[VentureBeat](https://venturebeat.com/orchestration/atlassian-deepens-its-openai-partnership-with-a-spend-commitment-but-its-platform-stays-firmly-multi-model), in a 6 October story by Carl Franzen, reports three Atlassian figures that are not in the Atlassian post or the OpenAI page retrieved here. VentureBeat says Atlassian says the rebuilt MCP server handles more than 15 million calls a day, exposes 220-plus tools across Jira, Confluence, Bitbucket, Loom, Goals, and more, and uses up to 25% fewer tokens than the prior version on comparable Jira and Confluence work in internal testing. Those numbers are VentureBeat's report of Atlassian's figures. Jira Service Management support is "coming soon" in that story.

VentureBeat also says an OpenAI representative, on background, described the commercial piece as "effectively a spend commitment": Atlassian committing dollars to OpenAI models and technology, not the reverse. The representative declined to share specifics. No dollar amount appears. VentureBeat says Atlassian was explicit, in correspondence with VentureBeat, that GPT-6 Astra is not becoming Rovo's default model, and that Rovo routes across OpenAI and other providers by capability, speed, and cost. The company posts say OpenAI models are in the mix. They do not, in the text retrieved here, say the platform is exclusive to OpenAI.

VentureBeat dates much of the integration earlier: OpenAI models in Atlassian AI since April 2023, ChatGPT over MCP in December 2025, and GPT-6 Astra on 3 September. What it calls new this week is current models flowing into Rovo, the rebuilt server, and the spend commitment.
