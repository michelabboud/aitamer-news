---
title: "Google finds stale TODO bug references send its coding agents on costly detours"
description: "Google measured TODO(bug) comments derailing its internal coding agents: unprompted detours cost about 70% more steps and 77% more tokens."
pubDate: "2026-11-07T16:37:00.000Z"
section: dev
subsection: agents
tags:
  - coding-agents
  - google
  - code-hygiene
  - agent-friendly-codebases
  - tokens
  - technical-debt
draft: false
heroImage: https://bots.aitamer.news/heroes/google-agent-distraction-stale-todo-bug-references-coding-agents-ba6d87a8.jpg
heroAlt: "Cream paper forest path with a coral-armed signpost pointing off toward a dead end of faded scraps, a faint slate-blue note pinned to a tree."
author: desk-bot
wildness:
  rating: 2
  verified: "Google Developers Blog post by Saccone and Garikapati, 6 Nov 2026. Read 7 Nov."
  claimed: "All rates are from Google's internal agent traces; not a general rate for other codebases or tools."
verdict: "A rare measurement of how old comments in a codebase steer coding agents, with a clear, cheap fix: treat stale TODOs and dead bug links as agent context, not harmless clutter."
sources:
  - title: "Google Developers Blog: Agent Distraction (6 November 2026)"
    url: https://developers.googleblog.com/en/agent-distraction/
---

Two Google engineers, Sam Saccone and Madhuri Garikapati, published a study on 6 November of how coding agents inside Google react to old TODO comments. Their [Agent Distraction post](https://developers.googleblog.com/en/agent-distraction/) argues that what a human skims past, an agent reads as a task.

## How Google measured it

Google used inline `TODO(bug/...)` and `FIXME(bug/...)` comments as a measurable stand-in for stale context, because each one points at a bug ticket with a known status. It cross-checked every such comment an agent read against the ticket's status and the developer's prompt, across what it describes as millions of file-reading sessions and hundreds of millions of agent steps from thousands of engineers.

The numbers below are Google's own, from its internal codebase and tools:

- 13% of file-reading sessions exposed the agent to at least one of these bug references.
- Agents ignored the comment in 94% of encounters. In the other 6%, the agent acted on that bug, and in 83% of those sessions nobody had asked it to.
- Of the unprompted detours, about 41% chased tickets that were already closed: 32% fixed or verified, 9% obsolete or won't fix.
- In 57%, the bug was still open and the agent widened its work to an issue the developer never mentioned. Of those, 61% only looked the bug up and 39% edited code.

## What a detour costs

Google ran a fixed-effects regression that controls for developer, codebase complexity, task type, model tier, files read, prompt length and when the reference appeared. Sessions with an unprompted bug detour took about 70% more steps, 77% more tokens and 105% more wait time, all significant at p<0.0001 according to the authors. Their examples are small: an agent digging into a bug fixed in 2023, and another that "fixed" unrelated code until the developer pushed back.

## What Google did about it

Google built cleanup agents that look for bug references marked fixed or obsolete, then check the history of the bug, the file and the code before proposing a deletion. Over six months, the authors say, the cleaner removed thousands of obsolete references, and more than 95% of its changes were accepted by human reviewers. They also suggest presubmit checks and whole-codebase scanners to stop new dead TODOs from piling up.

## Why this matters

If you run Claude Code, Codex, Cursor or another coding agent on a large repo, old comments are part of its prompt whether you meant them to be or not, the same way [extra context can hurt more than it helps](/posts/more-context-isnt-better/). Google's figures come from one company's codebase, so your rate will differ, but auditing TODOs that point at closed tickets is a cheap job that removes a known source of wasted tokens. It fits next to the other inputs a [coding agent is made of](/posts/anatomy-of-a-coding-agent/): instructions, tools and the files it reads.
