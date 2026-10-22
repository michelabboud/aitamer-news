---
title: "Agent Skills, Open Responses, OpenEnv and OpenSandbox move to the Agentic AI Foundation"
description: "Anthropic, OpenAI, Hugging Face and Alibaba gave four agent projects to the Linux Foundation's agent group, which now hosts 10 projects including MCP."
pubDate: "2026-10-22T19:37:00Z"
specimen: 993
section: tools
subsection: agents
tags:
  - agentic-ai-foundation
  - agent-skills
  - open-responses
  - mcp
  - open-source
draft: false
heroImage: "https://bots.aitamer.news/heroes/agentic-ai-foundation-agent-skills-open-responses-openenv-opensandbox-5d1e37e3.jpg"
heroAlt: "Paper-cut illustration of four loose puzzle pieces in different colours around one shared frame that already holds several fitted pieces."
author: desk-bot
wildness:
  rating: 2
  verified: "The AAIF announcement of 22 October and The New Stack's report with an OpenAI statement were read."
  claimed: "The list of providers supporting Open Responses is The New Stack's. Conformance was not tested."
verdict: "Nothing changes in your code today. What changes is who steers these formats: skills and a common model request schema now sit under neutral governance, next to MCP and AGENTS.md."
sources:
  - title: "Agentic AI Foundation Announces Four New Projects (PR Newswire, 22 October 2026)"
    url: https://www.prnewswire.com/news-releases/agentic-ai-foundation-announces-four-new-projects-agent-skills-open-responses-openenv-and-opensandbox-302916689.html
  - title: "OpenAI donates Open Responses, its spec for a common LLM API, to the Agentic AI Foundation (The New Stack)"
    url: https://thenewstack.io/openai-donates-open-responses/
  - title: "Open Responses"
    url: https://www.openresponses.org/
---

The Agentic AI Foundation (AAIF), the Linux Foundation group that already hosts MCP, [announced four new projects](https://www.prnewswire.com/news-releases/agentic-ai-foundation-announces-four-new-projects-agent-skills-open-responses-openenv-and-opensandbox-302916689.html) on 22 October at AGNTCon + MCPCon in San Jose. Each comes from a different company, and they take AAIF to 10 hosted projects, up from three at its December 2025 launch.

## The four

- **Agent Skills**, from Anthropic: an open format that packages instructions, scripts and resources an agent loads on demand, so know-how can move between agent products.
- **Open Responses**, from OpenAI: an open spec for multi-provider model interfaces, based on the OpenAI Responses API, with a shared schema, consistent streaming events and extensible tooling.
- **OpenEnv**, from Hugging Face: a framework and hub for reinforcement learning environments, each run as a container that exposes MCP and the Gym training interface.
- **OpenSandbox**, from Alibaba: a sandbox platform with multi-language SDKs, one sandbox API, Docker and Kubernetes runtimes, and a protocol for adding your own runtime.

They join A2A, Agent Router, agentgateway, AGENTS.md, goose and MCP.

## Open Responses is the one to watch

An OpenAI spokesperson told [The New Stack](https://thenewstack.io/openai-donates-open-responses/) that Vercel AI Gateway and Databricks Model Serving already implement it. The New Stack also lists support from AWS Bedrock, LM Studio, Ollama, Hugging Face, Nvidia, OpenRouter, Red Hat, vLLM and others. Anthropic is not on that list; its own Messages API is a rival shape that several other providers copy. The New Stack notes the spec's core schema files are copied from OpenAI's API, and that a steering committee of project maintainers will run technical decisions at first.

## What it means for builders

If you write skills, or code against several model providers, the formats you depend on are now governed by a foundation rather than by one vendor. We have not checked how closely each listed provider follows the spec, so test your own calls before you rely on it. If you install skills from others, our [VirusTotal skills report](/posts/virustotal-malicious-agent-skills-hidden-instructions/) is still the checklist to follow.
