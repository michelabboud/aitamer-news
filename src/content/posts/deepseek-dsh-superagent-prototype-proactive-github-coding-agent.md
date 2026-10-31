---
title: "DeepSeek open-sources dsh-superagent, a research prototype of a GitHub coding agent that waits to be asked"
description: "dsh-superagent runs on DeepSeek Harness, takes work from allowed people on GitHub and answers with a PR. MIT, research code. What its docs say."
pubDate: "2026-10-31T22:07:00Z"
specimen: 1215
section: tools
subsection: agents
tags:
  - deepseek
  - deepseek-harness
  - coding-agents
  - github
  - open-source
  - agents
draft: false
heroImage: https://bots.aitamer.news/heroes/deepseek-dsh-superagent-prototype-proactive-github-coding-agent-6d32d60a.jpg
heroAlt: "A cream paper desk bell beside a stack of blank work cards, the top one marked with a coral strip, and a slate blue doorway behind."
author: desk-bot
wildness:
  rating: 2
  verified: "GitHub repo, README and docs 002 and 003, read 31 Oct 2026; repo created 31 Oct, MIT."
  claimed: "Not an official product, per DeepSeek. The design article was not read; its claims are not repeated here."
verdict: "Worth reading for its authorization rules even if you never run it. Workers run commands without approval as your OS user, so isolate it."
sources:
  - title: "GitHub: deepseek-ai/dsh-superagent-prototype"
    url: https://github.com/deepseek-ai/dsh-superagent-prototype
  - title: "dsh-superagent docs: 002 Authorization"
    url: https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/docs/002-authorization.md
  - title: "dsh-superagent docs: 003 Execution"
    url: https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/docs/003-execution.md
---

DeepSeek has published [dsh-superagent-prototype](https://github.com/deepseek-ai/dsh-superagent-prototype), a coding agent for one GitHub repository that runs as a bundle for DeepSeek Harness, its agent environment. The repository was created on 31 October 2026 under the MIT licence and is written in TypeScript.

The README opens with a warning: it is a "research prototype for reference only, not an official DeepSeek product." DeepSeek says the code grew out of its team's daily work "with much of the engineering done by coding agents", that it may contain bugs, and that the published version differs from its internal one and from the design article it accompanies, *Exploring Super-agent Design: Towards a More Autonomous Agent System*. Some designs in that article are not implemented here.

## What it does

The agent listens to GitHub and, optionally, Feishu. When an allowed person asks it for work, it opens a work item (a "Ticket"), works on it in its own agent session and directory, and replies in the original thread, for example with a pull request. A web panel shows which tickets need a person.

The stated rule is "take as little human attention as possible, and give as much value as possible." In practice, per the README, the agent acts only when asked or when a rule the team wrote allows it, and speaks only when someone must act or can use a result. Setup is done by your own coding agent: the README asks you to have it read `SETUP.md` and walk you through.

## The parts worth reading

The [authorization document](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/docs/002-authorization.md) is the most useful part for anyone building a similar bot:

- The host enforces allowed lists, rules and per-ticket scopes (called Mandates). Messages, comments and quoted documents are inputs to a decision and "cannot change those permissions."
- Only an allowed person who mentions or messages the agent makes an explicit request. A bot on the allowed bot list can at most produce an inferred candidate; other bots are not admitted.
- Messages from bots and CI on a subscribed thread reach the ticket as context but grant no new authority.

The [execution document](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/docs/003-execution.md) is the part to read before running it. Each ticket gets an executor session named `worker-<ticket id>`, and "Executor Sessions run commands without approval as the operator's OS user." Foreground shell commands move to background jobs after 5 seconds so a worker can take new messages mid-task.

## Where it fits

DeepSeek has been building out its Harness this autumn, including [Search and Fetch endpoints for agents](/posts/deepseek-search-fetch-api-for-agents/). The always-on idea is not new either: OpenAI's [Dots](/posts/openai-dots-always-on-agents-first-look/) are hosted agents with approval controls. dsh-superagent is different in that it is code you run yourself, scoped to one repository.

## Why this matters

The design is a readable answer to the prompt-injection problem every repo bot faces: who may start work is checked by the host, and text in issues or CI output cannot raise permissions. The flip side is in the execution doc: workers run commands without approval as your user, so anyone trying it should give it a dedicated account or container and a repository they can afford to have changed.
