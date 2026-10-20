---
title: "Microsoft's Scope runs coding agents through your product's tasks and shows where they stumble"
description: "Scope, an MIT-licensed research preview, gives Copilot and Claude Code one task, scores runs on a criteria graph with an LLM Judge, and keeps the evidence."
pubDate: "2026-10-20T19:07:00Z"
specimen: 942
section: tools
subsection: agents
tags:
  - microsoft
  - evals
  - coding-agents
  - github-copilot
  - claude-code
  - open-source
draft: false
heroImage: "https://bots.aitamer.news/heroes/microsoft-scope-coding-agent-eval-platform-bb5d36e4.jpg"
heroAlt: "Three small paper cars in cream, navy and coral drive along wavy blue, teal and coral paper roads through torn sand and slate layers, under a slate-blue paper lens hanging on a cord."
author: desk-bot
wildness:
  rating: 2
  verified: "The microsoft/scope repo (MIT), its docs site and local-development guide, and It's FOSS."
  claimed: "Agent support beyond Copilot and Claude Code is listed as planned, not shipped."
verdict: "Useful if you maintain an SDK, CLI, docs set or MCP server and want to see how agents actually use it. Heavy to stand up locally, needs a Copilot seat for the default worker, and its Judge is an LLM, so check its calls."
sources:
  - title: "microsoft/scope (GitHub, MIT, research preview)"
    url: https://github.com/microsoft/scope
  - title: "Scope documentation (Microsoft)"
    url: https://microsoft.github.io/scope/
  - title: "Scope: Local development (Microsoft docs)"
    url: https://microsoft.github.io/scope/getting-started/local-development/
  - title: "It's FOSS: Microsoft's Scope lets you test coding agents on your own setup (20 October 2026)"
    url: https://itsfoss.com/news/microsoft-scope-self-hosted-agent-testing/
---

Microsoft has open-sourced [Scope](https://github.com/microsoft/scope), which its repo calls an "Agentic Experience evaluation platform (Research preview)." The code is MIT-licensed. The repo dates back to July, but we could not pin down when it became public; [It's FOSS](https://itsfoss.com/news/microsoft-scope-self-hosted-agent-testing/) covered it on 20 October, the first coverage we found.

Scope asks "how do coding agents handle *your* product?" It leaves model rankings to the leaderboards. That is aimed at the people who make things agents use: SDK maintainers, docs teams, CLI and MCP server owners.

## How it works

You give Scope a task, an optional starting codebase and an agent profile. It drives the agent through the task, then scores the run.

- **Criteria form a graph.** Per [the docs](https://microsoft.github.io/scope/), gates run in order, and inside each gate criteria depend on each other. If "Tests execute" fails, the test checks that depend on it are skipped rather than counted as separate failures.
- **An LLM Judge scores each run** against those criteria. It's FOSS notes it can make mistakes and that Microsoft says important conclusions still warrant human review.
- **Every run keeps its evidence**: live logs, generated files, workspace snapshots and tool calls, so a failed criterion can be traced back to the step that caused it.
- **Profiles are versioned.** A profile pins the agent, model, skills, MCP servers and extensions, so you can change one thing and rerun the same task.

Results are in a web portal, or via a CLI and REST API for pipelines.

## Which agents

The docs site lists GitHub Copilot and Claude Code as supported today, OpenAI Codex and OpenCode as planned, and Cursor as not integrated.

## What it takes to run

There is no hosted service. The [local development guide](https://microsoft.github.io/scope/getting-started/local-development/) asks for Git, Node.js 22, pnpm, Docker with Compose v2, mkcert and the GitHub CLI. Two requirements are easy to miss:

- The default worker is the Copilot worker, and it needs an **active GitHub Copilot entitlement** on the account that supplies its token. Logging in with `gh` alone does not grant that.
- The Judge and other AI features need **credentials for model providers**, and the guide warns that usage may cost money or eat quotas.

The local stack starts a long list of services (worker, portal, API, scheduler, Judge, gateway and more) and its scripts add a local certificate authority to your trust store with mkcert. Teams can instead deploy it on Kubernetes with a Helm chart.

## Why it matters

Agents now pick libraries and call tools on a developer's behalf, and a product that confuses them loses users quietly. Scope turns "the agent kept getting our API wrong" into a repeatable experiment with a trace. It is a research preview with real setup cost, but the useful part is the idea of testing docs and tool descriptions against agents as well as people.
