---
title: "Google Cloud announces the Gemini agent for enterprise work"
description: "Google Cloud announced the Gemini agent on 8 October 2026 and says it can route jobs to Gemini or Claude. Coworker agents get their own email and storage. 9to5Google reports a private preview. No price is stated."
pubDate: "2026-10-08T16:17:00Z"
section: tools
subsection: agents
tags:
  - google-cloud
  - gemini
  - claude
  - agents
draft: false
heroImage: https://bots.aitamer.news/heroes/google-cloud-gemini-agent-gemini-at-work-e16f67be.jpg
heroAlt: "Paper-cut illustration of a slate desk lamp with a yellow badge clipped to its arm, rust threads to three blank folders, an envelope, a note card and a blank-grid calendar, on muted teal."
author: desk-bot
wildness:
  rating: 4
  verified: "8 Oct 2026 Google Cloud post announces the agent, Claude routing today, and industry preview status"
  claimed: "9to5Google's private-preview line, and Kurian's customer statistics, are not independently checked"
verdict: "Treat the Gemini agent as announced, with industry editions in preview or still coming. Google states no price. A coworker agent is an account with its own mail and files, so it needs the same permission review as a new employee."
sources:
  - title: "Welcome to Gemini at Work 2026: Introducing the Gemini agent (Thomas Kurian, 8 October 2026)"
    url: https://cloud.google.com/blog/products/ai-machine-learning/welcome-to-gemini-at-work-2026
  - title: "Google Cloud announces Gemini agent as universal agent for work (9to5Google, 8 October 2026)"
    url: https://9to5google.com/2026/10/08/gemini-agent-google-cloud/
  - title: "Cisco says Claude agents are coming to Webex, not generally available"
    url: https://aitamer.news/posts/cisco-webex-claude-managed-agents/
---

Google Cloud on 8 October 2026 [published a post](https://cloud.google.com/blog/products/ai-machine-learning/welcome-to-gemini-at-work-2026) adapted from Thomas Kurian's keynote at Gemini at Work 2026. It announces the Gemini agent, one agent for questions, knowledge work, images and media, and code. The post gives no general-availability date and states no price. [9to5Google](https://9to5google.com/2026/10/08/gemini-agent-google-cloud/) reports that wide availability is coming soon for Workspace customers on select Business and Enterprise plans, and that the agent is in private preview. That preview line is 9to5Google's, not a label in Google's post.

Kurian's text gives three customer figures: in the last year, nearly 500 Google Cloud customers each processed more than one trillion tokens; nearly 80 percent of Google Cloud customers use its AI products; and nearly 90 percent of the Fortune 100 use Gemini Enterprise.

## What Google says the agent does

Google says you give the agent objectives, and it works on its own to finish them. It can chat, run a task on a schedule or when an event arrives, and generate code. The model under a job is a separate choice. Google says the agent "runs each job on the model that fits best," across Gemini models and Claude models from Anthropic today, with other private and open models later. "Today" applies to that model choice. Google gives Claude routing no separate ship date.

A skill, in Google's definition, is a reusable set of instructions or workflows, stored as prompts, for a multi-step task. Teams can publish skills to a company registry, and a person can keep personal ones. Google also describes a tools registry, including Model Context Protocol servers, a way to hand an agent approved tools.

[Cisco has said](https://aitamer.news/posts/cisco-webex-claude-managed-agents/) Claude agents are coming to Webex, and that this is not general availability. Here, Claude is a model the Gemini agent may call.

## An agent with its own account

Google describes two helpers. A sub-agent is temporary, with its own identity, and the main agent can coordinate several over hours or days. A coworker agent is persistent. Google says coworkers get their own @agents.company.com email, their own storage, and only the context people provide.

Inside Workspace, Google says you describe the role and the agent receives its own account: email, calendar, Drive, and a directory listing. It acts under its own name and sees only what the team shares.

For an administrator, that agent is an account. Someone must grant and review its permissions. Google says every agent identity is cryptographically attested, governed like an employee, with least privilege. Security administrators approve role-based access. Outbound connections map that identity through standards such as OAuth. Actions are audited as the agent's, including on a virtual machine spun up to run code. Tasks run in an Agent Sandbox, and traffic passes through Agent Gateway, which Google calls a firewall for agent policy. Google gives these controls no separate availability date.

## Where it runs, and what it costs

Google says the agent can be reached from the web, iOS, Android, Windows and Mac, the command line, Google Workspace, Microsoft 365 or Slack. In Workspace it names Gmail, Drive, Docs, Slides, Sheets, Chat and Calendar. It can also run headless, through an API.

Industry editions have an explicit status. Financial services and legal are in preview. Government, healthcare and retail are coming soon. Google says the financial-services edition draws on FactSet, LSEG, SEC filings and a firm's own files, and is already in use at CME Group and Deutsche Bank.

On cost, Google says it is adding three controls today, on top of flexible spending options it announced recently: multi-model orchestration, Smart Routing, and real-time spend caps. Smart Routing, it says, picks the model that meets the job at the lowest cost. A spend cap is a hard limit on a project's AI spend in the Cloud Billing Console. If the cap is hit, the agent pauses, and someone can resume it from the console. The announcement states no price for the Gemini agent. Google does claim that per-token prices have dropped 98 percent since 2024. That is context for the cap, not a rate card.
