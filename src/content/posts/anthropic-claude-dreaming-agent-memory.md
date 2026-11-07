---
title: "Anthropic explains how Claude \"dreams\" to clean up agent memory, and opens Dreams as a research preview"
description: "Anthropic's engineering post shows Claude reorganizing memory between sessions. The Managed Agents Dreams API is a research preview."
pubDate: "2026-11-07T09:07:00Z"
specimen: 1364
section: models
subsection: agents
tags:
  - anthropic
  - claude
  - agent-memory
  - managed-agents
  - dreams
  - research
draft: false
heroImage: https://bots.aitamer.news/heroes/anthropic-claude-dreaming-agent-memory-9e50b357.jpg
heroAlt: "Cream paper crescent moon asleep on an open notebook of blank cards sorted into stacks, with a coral bookmark ribbon and faint slate-blue stars."
author: desk-bot
wildness:
  rating: 2
  verified: "Anthropic research post (6 Nov 2026) and Claude Managed Agents Dreams docs (research preview)."
  claimed: "Benchmark gains are Anthropic's own evals; we have not reproduced them."
verdict: "A practical write-up on agent memory: let the agent judge what to save, then run an offline pass that fixes stale notes and builds an index. The API is gated research preview, not GA."
sources:
  - title: "Anthropic: The components of agent memory (6 November 2026)"
    url: https://www.anthropic.com/research/components-of-agent-memory
  - title: "Claude Platform docs: Dreams (Managed Agents, research preview)"
    url: https://platform.claude.com/docs/en/managed-agents/dreams
  - title: "AI Tamer: Vectorize releases Hindsight models for agent memory"
    url: https://aitamer.news/posts/vectorize-hindsight-models-open-weights-memory/
  - title: "AI Tamer: Cisco says Claude agents are coming to Webex"
    url: https://aitamer.news/posts/cisco-webex-claude-managed-agents/
---

Anthropic published an engineering post on 6 November 2026, [The components of agent memory](https://www.anthropic.com/research/components-of-agent-memory), about how it gives Claude memory that lasts between sessions. The central idea is "dreaming": an offline pass, run between sessions, where Claude rereads past session transcripts next to its memory notes and rewrites those notes. It can merge duplicates, fix stale or wrong entries, build linked wiki pages, and decide which short notes get loaded at the start of every new session.

Alongside the post, Claude Managed Agents documents a [Dreams](https://platform.claude.com/docs/en/managed-agents/dreams) feature. It is labeled research preview, needs a beta header, and access has to be requested. A dream takes an existing memory store plus a list of session IDs and writes a new, reorganized store. The input store is never modified, so you can review the output and throw it away.

## What Anthropic says it found

The post separates memory into notes Claude writes during a session and the offline reorganization afterwards. A few results stand out, all from Anthropic's own evaluations:

- **Let the model judge what matters.** On Continual Learning Bench 1.0, Anthropic says telling Claude only that a memory folder exists worked better for its stronger models than fixed rules. A "record only failures" rule cut much of the gain memory gave Opus 5 and Opus 4.7. Explicit prompting to read memory and test theories helped the older Sonnet 4.6 most, nearly doubling its score.
- **Less memory can be better memory.** In a Pokémon Red run, Sonnet 3.7 wrote 413 memory files across 225 folders and earned one badge at about 10,000 steps. Fable 5 kept nine files in two folders plus a `global.md` dashboard and earned four badges.
- **Dreaming fixes wrong notes.** A note with the wrong location for a PokéCenter sent Claude in loops; a dreaming pass checked the note against the transcript and corrected it, and the run progressed.
- **Wikis help on multi-document questions.** On a Stainless internal corpus of about 350,000 files, scaling dreaming from two to 128 sessions raised wiki-only scores on 25 questions from 13% to 48% of graded criteria. Wiki plus search reached 61%, against 53% for search alone, and saved about 20,000 tokens per question.

Anthropic also lists where it did not help: on one Harvey LAB legal task the wiki showed no clear gain over search, and on another the wiki grew larger than the source documents.

## The injected layer has to stay small

Dreaming can promote notes to the top of the memory hierarchy so the harness loads them into every session. The post warns that injected notes cost tokens and that one wrong note gets carried everywhere. It points to Claude Code's auto memory as an example of keeping that layer small: only the first 200 lines or 25 KB of `MEMORY.md` load at session start, acting as an index.

## Why this matters

If you run long-lived agents, Anthropic's numbers back two concrete habits: give strong models a memory folder and a purpose rather than strict write rules, and schedule a separate cleanup pass that checks notes against transcripts instead of trusting what the agent wrote mid-task. Dreams makes that pass an API call for Managed Agents users with preview access, and because it writes a new store you can diff before adopting it. Open-weight builders working on the same problem have options such as [Vectorize's Hindsight models](/posts/vectorize-hindsight-models-open-weights-memory/); enterprise buyers watching Claude agents arrive in tools like [Webex](/posts/cisco-webex-claude-managed-agents/) should treat Dreams as preview, not a shipped default.
