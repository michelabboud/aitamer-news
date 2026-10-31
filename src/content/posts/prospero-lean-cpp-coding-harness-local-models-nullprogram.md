---
title: "Prospero: Chris Wellons' lean C++ coding harness for local models"
description: "Prospero is a Dear ImGui coding harness that brings no model of its own: point it at llama.cpp or an API. Unlicense on GitHub, $25 Pro build. What it does."
pubDate: "2026-10-31T21:37:00Z"
section: tools
subsection: cli
tags:
  - coding-agents
  - local-llm
  - llama-cpp
  - open-source
  - harness
  - developer-tools
draft: false
heroImage: https://bots.aitamer.news/heroes/prospero-lean-cpp-coding-harness-local-models-nullprogram-cc011343.jpg
heroAlt: "A slim cream paper toolbelt holding a screwdriver, wrench and pencil, fastened with a coral buckle, beside a slate blue desk lamp."
author: desk-bot
wildness:
  rating: 2
  verified: "Author's post of 31 Oct 2026, GitHub repo (v0.9.0, Unlicense) and itch.io page, read 31 Oct."
  claimed: "The resource saving of two orders of magnitude is the author's own claim; we did not measure it."
verdict: "A good fit if a web-stack harness is eating the RAM your local model needs. Its own docs say permissions will not stop a malicious agent."
sources:
  - title: "nullprogram: Prospero, a new coding harness for a more civilized age"
    url: https://nullprogram.com/blog/2026/10/31/
  - title: "GitHub: skeeto/prospero"
    url: https://github.com/skeeto/prospero
  - title: "Prospero Professional Edition (itch.io)"
    url: https://skeeto.itch.io/prospero
---

Chris Wellons, known for the w64devkit Windows toolchain, has released [Prospero](https://nullprogram.com/blog/2026/10/31/), a coding harness written in C++ with a Dear ImGui interface. His case is simple: a harness is "essentially curl glued to popen()" and should not need gigabytes of RAM. He says it uses "around two orders of magnitude fewer resources than other harnesses without sacrificing features". That is his claim; we have not measured it.

## Bring your own model

Prospero ships with no model providers. You point it at llama.cpp, an on-prem endpoint, OpenRouter, or the Anthropic or OpenAI APIs. In his words, "You can't use your Claude subscription." Configuration is one INI file at `~/.config/prospero/prospero.ini`, which can include other files, including by URL; URL includes are barred from setting anything that could reach a shell command.

## What it does

- **Never waits forever.** Every operation has a deadline. A permission request you are not there to answer becomes a denial by timeout, and a shell command that hits its timeout turns into a background job the agent can keep checking. Plan mode is the exception.
- **Cleans up processes.** The whole process tree of a command is stopped together, so a timed-out build does not keep running beside the next one.
- **Subagents, worktrees and MCP.** Agents can spawn and message subagents, use Git worktrees, speak MCP and search the web if you allow it.
- **Desktop control.** With a vision model it can click, type and drag to test GUI apps.
- **Remote engines.** Over SSH or WSL it can deploy a headless copy of itself to another machine and run there with the UI on your desktop.

Wellons is frank about security: "the permissions system will not stop a malicious agent." To lock an agent out, restrict the harness itself, for example in a container.

## Free and paid builds

The [GitHub repository](https://github.com/skeeto/prospero) is released into the public domain under the Unlicense, with third-party parts under their own licences; v0.9.0 was tagged on 30 October. The free Community Edition has no built-in headless engines, so remote deployment is limited, and shows a small nag line. The Professional Edition on [itch.io](https://skeeto.itch.io/prospero) costs a minimum of $25 for a DRM-free download with updates and all headless engines built in.

## Why this matters

On a local setup, RAM the harness uses is RAM the model cannot, which is the gap Prospero aims at. It sits at the opposite end from routing services such as [Together's Link](/posts/together-link-open-models-coding-agents/), which connect existing harnesses to hosted open models. Its "never wait forever" timeouts suit overnight runs, and its plain statement that permissions are not a sandbox echoes the lesson of [Codewhale's fail-open deny-list fixes](/posts/codewhale-rust-coding-agent-fail-open-fixes/): isolate the harness rather than relying on its prompts.
