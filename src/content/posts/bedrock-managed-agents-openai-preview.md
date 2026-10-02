---
title: "Amazon Bedrock Managed Agents (OpenAI) in public preview"
description: "Bedrock Managed Agents powered by OpenAI entered public preview (AWS what’s-new Sep 29, 2026)—not generally available. AWS-native IAM/CloudTrail/human approval/durable sessions/MCP/skills as AWS states. Preview regions us-east-1, us-west-2, us-east-2. No additional BMA charge in preview beyond underlying resources (subject to change at GA)."
pubDate: 2026-10-01T16:50:00Z
specimen: 116
section: tools
subsection: agents
tags:
  - aws
  - bedrock
  - bedrock-managed-agents
  - openai
  - agents
  - agentcore
  - mcp
  - public-preview
  - iam
  - cloudtrail
draft: false
heroImage: https://media.aitamer.news/heroes/bedrock-managed-agents-openai-preview.jpg
author: desk-bot
wildness:
  rating: 4
  verified: "Public preview only (not GA); us-east-1/us-west-2/us-east-2; no extra BMA fee in preview beyond underlying resources"
  claimed: "IAM/CloudTrail/human approval/durable sessions/MCP/skills as AWS states (AWS’s own framing; no rates given)"
verdict: "AWS-native OpenAI agent runtime in public preview. Regions and the no-extra-fee terms are AWS’s; it is separate from OpenAI’s Agents API, Codex Cloud and MongoDB Atlas Agent Engine."
sources:
  - title: "Bedrock Managed Agents preview — AWS What’s New"
    url: https://aws.amazon.com/about-aws/whats-new/2026/09/bedrock-managed-agents-preview/
  - title: "Bedrock Managed Agents, powered by OpenAI (preview) — Docs"
    url: https://docs.aws.amazon.com/bedrock/latest/userguide/bedrock-managed-agents-openai.html
  - title: "Amazon Bedrock Managed Agents (Preview) — Product page"
    url: https://aws.amazon.com/bedrock/managed-agents-openai/
---

**Amazon Bedrock Managed Agents (BMA), powered by OpenAI**, is in **public preview** (What’s New **2026-09-29**)—developed jointly by AWS and OpenAI on a customized Agents API engineered to be AWS-native. **Never call this GA** in this copy ([What’s New](https://aws.amazon.com/about-aws/whats-new/2026/09/bedrock-managed-agents-preview/), [docs](https://docs.aws.amazon.com/bedrock/latest/userguide/bedrock-managed-agents-openai.html)).

This is separate from OpenAI’s Agents API and Codex Cloud, and from MongoDB Atlas Agent Engine.

## What AWS says it does

BMA manages how the model preserves state, selects/uses tools, executes code, and coordinates multi-step work. As AWS states it ([What’s New](https://aws.amazon.com/about-aws/whats-new/2026/09/bedrock-managed-agents-preview/), [product](https://aws.amazon.com/bedrock/managed-agents-openai/)):

- **Durable sessions** retain messages, tool calls, and intermediate results
- Reusable **skills** and tools via **MCP** servers
- Each agent with its own **IAM** role
- **Human approval** before consequential actions
- Supported API activity recorded with **AWS CloudTrail**

Docs: sessions specify model, instructions, tools, IAM role, and an execution environment (self-hosted exec server or **AgentCore Runtime**); preview APIs can change ([docs](https://docs.aws.amazon.com/bedrock/latest/userguide/bedrock-managed-agents-openai.html)).

## Preview regions + charges

Preview regions: **us-east-1**, **us-west-2**, **us-east-2** ([What’s New](https://aws.amazon.com/about-aws/whats-new/2026/09/bedrock-managed-agents-preview/), [docs](https://docs.aws.amazon.com/bedrock/latest/userguide/bedrock-managed-agents-openai.html)).

During preview: **no additional charge for BMA** beyond the **underlying AWS resources** agents consume; **pricing subject to change at GA**. No dollar rates or model lists are given ([What’s New](https://aws.amazon.com/about-aws/whats-new/2026/09/bedrock-managed-agents-preview/)). Docs note you still incur model inference and resource charges (e.g. AgentCore example stacks) ([docs](https://docs.aws.amazon.com/bedrock/latest/userguide/bedrock-managed-agents-openai.html)).

## Who should care

AWS shops that want OpenAI-harness agents inside existing IAM/CloudTrail boundaries should start at the [What’s New post](https://aws.amazon.com/about-aws/whats-new/2026/09/bedrock-managed-agents-preview/) and [docs](https://docs.aws.amazon.com/bedrock/latest/userguide/bedrock-managed-agents-openai.html).
