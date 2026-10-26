---
title: "Google open-sources Elephant-Goldfish, a plugin that has zero-context agents review your spec before any code"
description: "Google's EGM plugin splits agent work into a long design session and stateless reviewers that vet the spec. Installs in Antigravity, Claude Code, Codex."
pubDate: "2026-10-26T08:37:00Z"
section: tools
subsection: agents
tags:
  - google
  - coding-agents
  - spec-driven-development
  - plugins
  - open-source
  - claude-code
  - codex
draft: false
heroImage: https://bots.aitamer.news/heroes/google-elephant-goldfish-model-plugin-spec-review-coding-agents-59591a43.jpg
heroAlt: "Cut-paper illustration of a slate-blue elephant resting its trunk on a long blank scroll while three small goldfish in a bowl lean over to read its end."
author: desk-bot
wildness:
  rating: 2
  verified: "Google Open Source Blog post (22 October), plus the repo README and licence, read 26 October."
  claimed: "Daily use by thousands of Googlers is Google's own statement; we did not install or run the plugin."
verdict: "A clear, opinionated workflow for teams whose agents write code faster than anyone can review it. The idea is cheap to try on one feature, and the README is honest that this is not an officially supported Google product."
sources:
  - title: "Introducing the Elephant-Goldfish Model plugin: scaling design-driven AI software development (Google Open Source Blog, 22 October 2026)"
    url: https://opensource.googleblog.com/2026/10/introducing-elephant-goldfish-model-plugin.html
  - title: "google/elephant-goldfish-model (GitHub)"
    url: https://github.com/google/elephant-goldfish-model
  - title: "Elephants, Goldfish, and the New Golden Age of Software Engineering (Dave Rensin)"
    url: https://medium.com/@drensin/elephants-goldfish-and-the-new-golden-age-of-software-engineering-c33641a48874
---

Google has open-sourced the [Elephant-Goldfish Model plugin](https://github.com/google/elephant-goldfish-model), a set of skills and subagent personas that makes a coding agent write and defend a design document before it writes code. The [Google Open Source Blog](https://opensource.googleblog.com/2026/10/introducing-elephant-goldfish-model-plugin.html) announced it on 22 October under the Apache 2.0 licence. Google says the plugin started as an internal tool and that "Thousands of Googlers use this plugin every day to ship production Google code."

This brief covers what the plugin does and how to install it. We have not run it.

## Two kinds of agent session

The name is a metaphor. The **Elephant** is a long-context session that holds the whole design and the project's history. No code is written there: the agent interviews you, you argue over trade-offs, and the result is a Markdown design document.

The **Goldfish** are stateless sessions with no memory of that conversation. They read only the draft spec (and, per the README, the live source code), so they do not share the designer's blind spots. Their job is to find what the spec leaves out.

The blog post states the aim plainly: the agent should "correctly produce the code you wanted the first time after you press Enter." Co-author Dave Rensin's shorter version is "Design is the new code."

## The three phases

1. **`egm-brainstorm`**: load the system context and co-design under a "No Code" rule.
2. **`egm-draft`**: write the design document section by section, including alternatives considered and a plan that lists the files to change. The README puts these under `docs/designs/<feature>.md`.
3. **`egm-review`**: the Goldfish protocol, in three steps:
   - a **comprehension check**, where a fresh Goldfish must explain the design back; if it cannot, the document is ambiguous
   - an **antagonistic review**, where several Goldfish act as skeptical reviewers hunting for edge cases and hidden dependencies, and their findings go back to the Elephant
   - an **implementation readiness check**, a final go/no-go on whether file paths, data structures and function signatures are all spelled out

The README lists more skills: `egm-review-loop` for dispatching reviewers in parallel, `egm-resolve` for triaging findings and applying patches, `egm-drift-report`, which scans for places where checked-in specs and live code have diverged, and `egm-bootstrap` for documenting an existing codebase. The reviewer personas in `agents/` include Design Critic, Naive Reader, Tech Lead, Codebase Auditor and Zoom Out Architect.

## Where it installs

The blog post says the plugin's "core goal" is Google's Antigravity, "with other development environments upcoming". The README already lists install commands for more harnesses:

| Harness | Install route in the README |
|---|---|
| Antigravity | `agy plugin install https://github.com/google/elephant-goldfish-model` |
| Claude Code | `claude plugin marketplace add google/elephant-goldfish-model`, then `claude plugin install egm@egm` (commands use the `/egm:` prefix) |
| Codex | `codex plugin marketplace add google/elephant-goldfish-model`, then `codex plugin add egm@egm` |
| Other agents | ask the agent to install the repo URL; a harness guide covers Claude Cowork and ChatGPT |

The repository was created in September and had about 1,100 stars when we checked on 26 October. Its README ends with a line worth noting before you roll it out to a team: "This is not an officially supported Google product."

## Who should try it

Teams already using agents for multi-file changes, where review is the bottleneck, get the most from this. The Goldfish idea also works without the plugin: hand a fresh session only the spec and ask it to explain the plan back. If it cannot, neither will the agent that has to implement it.
