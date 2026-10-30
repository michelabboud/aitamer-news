---
title: "Factory Droid 1.0 makes the agent write JavaScript to batch its own tool calls"
description: "Droid 1.0 turns programmatic tool calling on by default: the model writes a sandboxed Script that runs many tool calls in one request."
pubDate: "2026-10-30T16:37:00Z"
specimen: 1147
section: tools
subsection: agents
tags:
  - factory
  - droid
  - coding-agents
  - tool-calling
  - harness
  - javascript
draft: false
heroImage: "https://bots.aitamer.news/heroes/factory-droid-1-0-script-tool-programmatic-tool-calling-6655b5c5.jpg"
heroAlt: "Small paper tools hang together on threads from one clip above an unrolled ivory scroll."
author: desk-bot
wildness:
  rating: 2
  verified: "Factory's Droid 1.0 post and changelog (CLI and Desktop v1.0.0), 29 Oct 2026."
  claimed: "Terminal-Bench 4 margins and the 15% cost cut are Factory's own runs, not independent results."
verdict: "The idea is sound and spreading: fewer model round trips and less raw output in context. The benchmark lead over rival agents is self-reported, so measure on your repo."
sources:
  - title: "Factory: Droid 1.0, Building a Frontier Harness"
    url: https://factory.com/news/frontier-harness
  - title: "Factory Docs: Changelog"
    url: https://docs.factory.com/changelog/release-notes
---

Factory [released Droid 1.0](https://factory.com/news/frontier-harness), its coding agent, with the CLI and Desktop app both at v1.0.0 in the [changelog](https://docs.factory.com/changelog/release-notes) on 29 October. The main change to how it works: programmatic tool calling (PTC) is now on by default.

## The Script tool

Instead of asking for one tool call at a time, the model writes a short JavaScript program, which Droid runs as a "Script." The program can read files, run commands and call other tools through Droid, but the sandbox itself has no file, network or system access of its own. One Script can make hundreds of tool calls in a single model request. Calls that do not depend on each other run in parallel, printed output is capped, and full results are logged where the model can search them later.

Factory gives three reasons for the default. Raw files, search results and logs stay inside the program as variables, so the context window stays clean. Fewer model requests means the instructions and history are re-sent less often. And independent work finishes sooner.

## Factory's examples

In one cleanup task the agent moved 151 Linear issues between queues and checked each move, 312 tool calls in all. Factory models the direct approach at 36 requests and about 3.1 million input tokens; the Script did it in 2 requests and roughly 61,000 tokens. A CI sweep checked 5,384 jobs in 2 requests, and the model only saw a five-number summary. Across tasks, Factory says Script mode cuts Droid's cost by 15% on Claude Opus 5.5.

Factory also ran Terminal-Bench 4 itself. It reports Droid with GPT-6.1 Sol scoring 3.5 points above Codex at 12% lower cost, and with Opus 5.5 scoring 3.0 to 7.6 points above Cursor, OpenCode, Devin and Claude Code at up to 24% lower cost. These are Factory's runs of its competitors. For a third-party comparison, see [the Artificial Analysis Coding Agent Index](/posts/artificial-analysis-coding-agent-index-v2-frontiercode/).

## Why this matters

Batching tool calls in code is becoming a standard harness feature: [goose](/posts/goose-1-56-boa-rust-javascript-code-mode/) and [OpenCode](/posts/opencode-2-0-background-server-code-mode/) both ship a code mode. The savings are real for long, repetitive jobs where an agent would otherwise re-send its whole history every few calls. If you build your own agent, the sandbox rule is the part worth copying: the script gets tools, never raw file or network access. If you are new to the term, start with [what an agent harness is](/posts/what-an-agent-harness-is/).
