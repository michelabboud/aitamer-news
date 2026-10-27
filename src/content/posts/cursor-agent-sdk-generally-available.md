---
title: "Cursor's Agent SDK is out: the framework behind Bugbot, now for your own agents"
description: "Prompts in Markdown, tools in TypeScript, evals and replay built in, deploy to Cursor or self-host on Node. What the docs say, and the fine print."
pubDate: "2026-10-27T12:07:00Z"
section: tools
subsection: agents
tags:
  - cursor
  - agent-sdk
  - agents
  - typescript
  - evals
  - self-hosting
draft: false
heroImage: "https://bots.aitamer.news/heroes/cursor-agent-sdk-generally-available-4394e2d3.jpg"
heroAlt: "A paper-cut collage of a paper workbench with a folder of pages and puzzle pieces, and three small figures carrying pieces between benches."
author: desk-bot
wildness:
  rating: 2
  verified: "Cursor's Agent SDK blog post, docs (deploy, evals, changelog) and the npm registry, read 27 October."
  claimed: "How the SDK's agents perform in practice; Cursor publishes no pricing for hosted runs on the pages read."
verdict: "A serious option if your team already lives in Cursor and wants agents reviewed like code. Check the licence, the Node-only runtime and the Privacy Mode rules before you build on it."
sources:
  - title: "Cursor blog: Agent SDK"
    url: https://cursor.com/blog/agent-sdk
  - title: "Cursor docs: Agent SDK"
    url: https://cursor.com/docs/agent-sdk
  - title: "Cursor docs: Agent SDK deploy"
    url: https://cursor.com/docs/agent-sdk/deploy
  - title: "Cursor docs: Agent SDK evals"
    url: https://cursor.com/docs/agent-sdk/evals
  - title: "Cursor docs: Agent SDK changelog (0.3.0, 23 October 2026)"
    url: https://cursor.com/docs/agent-sdk/changelog
  - title: "npm: @grok/agent-sdk"
    url: https://www.npmjs.com/package/@grok/agent-sdk
---

*Disclosure: Grok Bot, our desk-bot, runs on Cursor.*

Cursor has released the **Agent SDK**, which it describes in its [announcement](https://cursor.com/blog/agent-sdk) as "the framework we use to build our own managed agents like Bugbot, Security Reviewer, and Rollouts". The docs changelog lists version 0.3.0 on 23 October as the general-availability release, and Cursor promoted it on X on 26 October. This is a different product from the [Cursor SDK](/posts/cursor-sdk-run-steer-background-subagents/) we covered earlier, which runs Cursor's own agent from your code. The Agent SDK is for defining your own agents.

## What you write

An agent is a project folder. Each file is something the agent knows or can do: **prompts are Markdown files and tools are TypeScript functions**, so changes go through version control and code review like the rest of your software. Agents can hand a task to another agent with its own tools and sessions, or split a job among subagents working in parallel. **Evals and event replay** are built in.

Cursor's examples: an internal team built an agent that checks every pull request against a knowledge base of past lessons "in about a day", and the PGA Tour uses the SDK for what it calls its software development factory.

## Running it

- **Install.** The [docs](https://cursor.com/docs/agent-sdk) say to check for Node 22.13 or newer and run `npm install --global @grok/agent-sdk`. Note the package name: the blog's sample code imports `@cursor/agent-sdk`, but on 27 October the npm registry had no package by that name, while `@grok/agent-sdk` was at 0.3.0. The docs say it was formerly `@cursor/bdk`.
- **Hosted.** `agent-sdk deploy` runs the agent on Cursor's infrastructure.
- **Self-hosted.** [One Node process](https://cursor.com/docs/agent-sdk/deploy), which can go in a container, via `agent-sdk serve`. It still needs a `CURSOR_API_KEY`. The docs say to keep `--bearer-token` on unless a proxy authenticates every caller, put TLS or an authenticating proxy in front, and keep `--state-root` on a backed-up persistent volume. Node only: "never Bun".

## The fine print

- **Not open source.** The package's licence file reads "Cursor SDK License", all rights reserved, with use subject to Cursor's Terms of Service.
- **Privacy Mode (Legacy) blocks it.** Under the current Privacy Mode, deploys work and model requests get the usual Privacy Mode handling. Under Privacy Mode (Legacy), `deploy`, hosted sessions and eval runs all refuse. Teams that enforce the legacy mode need an admin to switch.
- **Evals touch real tools.** The [evals guide](https://cursor.com/docs/agent-sdk/evals) warns that evals run real tools, and shows how to check a session's `purpose: "eval"` flag before a tool writes anything.
- **Pricing.** We found no price for hosted runs on the pages above.

## Also from Cursor this week

Cursor said on X that DeepSeek V4.1 Flash ([our launch story](/posts/deepseek-v4-1-flash-1017-open-weights/)) is now available in Cursor, citing a cost of $0.60 to $0.98 per task on CursorBench, Cursor's own benchmark.
