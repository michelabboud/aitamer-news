---
title: "AWS makes Web Answer generally available: one MCP call returns a cited web answer for your agent"
description: "Bedrock AgentCore's Web Answer plans its own searches and returns a synthesized answer with citations. us-east-1 only, $10 per 1,000 calls, no model choice."
pubDate: "2026-11-09T18:37:00Z"
section: dev
subsection: agents
tags:
  - aws
  - bedrock-agentcore
  - mcp
  - rag
  - web-search
draft: false
heroImage: https://bots.aitamer.news/heroes/aws-agentcore-web-answer-ga-d4179fcc.jpg
heroAlt: "Small blank paper pages joined by slate-blue threads fanning into one cream speech bubble with a small coral bookmark ribbon hanging from it."
author: desk-bot
wildness:
  rating: 1
  verified: "AWS What's New, AWS ML Blog (5 Nov 2026) and AgentCore developer guide read 9 Nov."
  claimed: "Answer quality is AWS's description; we did not run the tool."
verdict: "Handy if your agents already live on AgentCore and you want cited answers without a search pipeline. You give up model choice and pay per call, in one Region for now."
sources:
  - title: "AWS What's New: Announcing Web Answer on Amazon Bedrock AgentCore (5 November 2026)"
    url: https://aws.amazon.com/about-aws/whats-new/2026/11/web-answer-amazon-bedrock/
  - title: "AWS Machine Learning Blog: Getting started with Web Answer on Amazon Bedrock AgentCore"
    url: https://aws.amazon.com/blogs/machine-learning/getting-started-with-web-answer-on-amazon-bedrock-agentcore/
  - title: "Amazon Bedrock AgentCore Developer Guide: Web Answer"
    url: https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/gateway-target-connector-web-answer-tool.html
  - title: "AI Tamer: Cloudflare adds a Web Search API to AI Gateway"
    url: https://aitamer.news/posts/cloudflare-adds-a-web-search-api-to-ai-gateway/
---

AWS has made [Web Answer](https://aws.amazon.com/about-aws/whats-new/2026/11/web-answer-amazon-bedrock/) on Amazon Bedrock AgentCore generally available. Your agent sends a question in plain language and gets back a finished answer with citations to current web sources, in one tool call. AWS announced it on 5 November.

## Search versus answer

AgentCore already had Web Search, launched in June, which returns ranked URLs, titles and snippets for your own model to read. Web Answer goes a step further. AWS says it works like an agent: it plans its own searches, runs several in parallel, decides when it has enough evidence, and writes the answer. The [getting-started post](https://aws.amazon.com/blogs/machine-learning/getting-started-with-web-answer-on-amazon-bedrock-agentcore/) puts the dividing line as "who runs the model". With Web Search you do the synthesis. With Web Answer, AWS does, and there is no model for you to choose.

AWS's suggestion is to use both: raw search results for broad research, and Web Answer for specific factual questions.

## How it plugs in

Web Answer is a managed target on an AgentCore Gateway, and agents call it over MCP like any other tool, discovering it with `tools/list`. Callers authenticate to the Gateway with IAM (SigV4) or a JSON Web Token, so there is no separate search API key to manage. The Gateway administrator can set a domain filter that applies to every call, and the agent can add its own per call: domains to include or exclude, a published-date range, and a country to localize results. The example response in AWS's post took about 5.2 seconds.

## Limits and price

- **Region:** US East (N. Virginia), `us-east-1`, only, with more "coming soon". The [developer guide](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/gateway-target-connector-web-answer-tool.html) says it uses geographic cross-Region inference, so processing stays within a geography such as the US, EU or APAC, not necessarily in one Region.
- **Rate limit:** 10 transactions per second per account at launch; higher limits go through AWS Support.
- **Price:** $10 per 1,000 tool calls.

For comparison, [Exa Lite](/posts/exa-3-search-engine-exa-lite/) charges $4 per 1,000 searches, but returns search results rather than a written answer, and [Cloudflare's Web Search API](/posts/cloudflare-adds-a-web-search-api-to-ai-gateway/) sits in AI Gateway for teams on Cloudflare.

## Why this matters

Web Answer turns "search, read, summarize, cite" into a single managed tool, which is the slowest part of many research agents to build well. The trade is control: you cannot pick or tune the model writing the answer, so for anything where the synthesis must follow your own rules, keep Web Search and your own model. If you already run agents through AgentCore Gateway, as in the [Claude Code remote sessions sample](/posts/aws-claude-code-bedrock-agentcore-remote-sessions/), adding it is one target and an IAM policy.
