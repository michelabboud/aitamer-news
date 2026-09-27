---
title: "Gemini managed agents get a new Antigravity harness, a Files API and a Credentials API"
description: "Google's antigravity-preview-09-2026 brings Antigravity coding-agent tools to the Gemini API on Gemini 3.8 Flash, with new APIs to move files in and out of the sandbox and keep secrets away from the model."
pubDate: 2026-09-27T20:16:14Z
specimen: 28
section: dev
subsection: agents
tags:
  - google
  - gemini-api
  - managed-agents
  - antigravity
  - interactions-api
  - gemini-3-8-flash
  - credentials
  - sandboxes
draft: false
heroImage: /heroes/gemini-managed-agents-09-2026-update.jpg
heroAlt: "A paper-cut robot hand in coral reaches into a cream sandbox, while beside it a soft blue paper hand turns a key in a padlock."
author: desk-bot
sources:
  - title: "Gemini API Managed Agents Update — Google AI Studio"
    url: https://aistudio.google.com/learn/managed-agents-updated-harness-files-credentials
  - title: "Gemini API changelog (September 17, 2026) — Google AI for Developers"
    url: https://ai.google.dev/gemini-api/docs/changelog
  - title: "Antigravity agent — Gemini API docs"
    url: https://ai.google.dev/gemini-api/docs/antigravity-agent
  - title: "Environments in managed agents — Gemini API docs"
    url: https://ai.google.dev/gemini-api/docs/agent-environment
  - title: "Credentials in managed agents — Gemini API docs"
    url: https://ai.google.dev/gemini-api/docs/agent-credentials
  - title: "Deprecations — Gemini API docs"
    url: https://ai.google.dev/gemini-api/docs/deprecations
wildness:
  rating: 3
  verified: "Release, tools, APIs, default model and Oct 5 date are in Google's docs and changelog"
  claimed: "Token, caching and task-completion gains are Google's internal evals only"
verdict: "If you run Gemini managed agents, switch to the 09-2026 harness before October 5 and move tokens into the Credentials API. The efficiency gains are Google's own numbers until you measure them."
---

Google released **`antigravity-preview-09-2026`** on **2026-09-17**, a new harness for managed agents in the Gemini API. It brings the tools of its Antigravity coding agent to the Interactions API and AI Studio, runs on **Gemini 3.8 Flash** by default, and ships with a new **Files API** and **Credentials API** ([announcement](https://aistudio.google.com/learn/managed-agents-updated-harness-files-credentials), [changelog](https://ai.google.dev/gemini-api/docs/changelog)).

This is a **Desk Bot** briefing from Google's announcement, API docs, changelog and deprecations page. Managed agents themselves are not new: the first harness, `antigravity-preview-05-2026`, launched in preview in May.

## A new harness, and a deadline for the old one

The [Antigravity agent docs](https://ai.google.dev/gemini-api/docs/antigravity-agent) say the new version defaults to Gemini 3.8 Flash; `agent_config` can switch the model and cap a run with `max_total_tokens`. Built-in tools cover code execution, Google Search, URL fetching and filesystem work. The [changelog](https://ai.google.dev/gemini-api/docs/changelog) lists the changes: tool parameters are now PascalCase, file edits replace line ranges instead of rewriting whole files, and two search tools arrive, `find_by_name` and `grep_search`.

Google says requests that worked on the old harness keep working, but tool names in step events changed, so code that filters on them needs an update. The [deprecations page](https://ai.google.dev/gemini-api/docs/deprecations) sets **October 5, 2026** as the shutdown date for `antigravity-preview-05-2026`. The announcement says requests to it will be redirected to the new harness after that date.

Google also reports gains from its own internal evals, compared with the 05-2026 harness. They are vendor claims, not independent tests:

| Claim (Google, internal) | Figure |
| --- | --- |
| Output tokens on file edits | 40% fewer |
| Task completion, multi-turn coding and research | up to ~8% higher |
| Cost, multi-turn coding (from better caching) | 30% lower |

Google says pricing is unchanged: pay-as-you-go for model tokens and tools, and sandbox compute is not billed during the preview.

## Files API: data in, results out

A first interaction creates a sandbox and returns an `environment_id`. From then on the [environment docs](https://ai.google.dev/gemini-api/docs/agent-environment) let you list the files, upload into the sandbox, and download single files or whole directories as tar archives. The environment persists, so a later interaction can build on what the agent wrote. Each sandbox gets 4 CPU cores and 16 GB of memory.

## Credentials API: secrets the model never sees

The [Credentials docs](https://ai.google.dev/gemini-api/docs/agent-credentials) describe secrets stored on Google's servers and referenced by ID. They are write-only: no endpoint returns them. Three types exist: bearer tokens, environment variables and OAuth2 with automatic refresh.

Google's examples show both routes. A GitHub token is attached to a remote MCP server, and the Gemini API adds the header itself. A Slack token becomes an environment variable, where the sandbox sees only a placeholder that an egress proxy swaps for the real value on requests to trusted domains. A request to any other domain is rejected, so a tricked agent cannot send the token elsewhere, according to Google.

## Who should care

Teams already on Gemini managed agents have until October 5 to test the new harness, especially if they parse tool steps. Anyone who held back because agents needed raw API tokens in the sandbox should look at the Credentials API first.
