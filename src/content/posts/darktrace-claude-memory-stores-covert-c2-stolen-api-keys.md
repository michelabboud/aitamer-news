---
title: "Darktrace turns Claude Code into a remote-controlled agent with stolen API keys and memory stores, in a lab"
description: "A lab demo, not a Claude flaw: with a hacked machine and a stolen API key, Darktrace steered Claude Code through memory stores and pulled out a 1 GB file."
pubDate: "2026-11-12T16:07:00Z"
section: devops
subsection: security
tags:
  - claude-code
  - agent-security
  - anthropic
  - api-keys
  - detection
draft: false
heroImage: https://bots.aitamer.news/heroes/darktrace-claude-memory-stores-covert-c2-stolen-api-keys-b3bd6ced.jpg
heroAlt: "A faceless paper marionette craftsman works at a desk inside a house while its strings rise through the roof to a notebook outside, a small rusty-red key hanging beside it."
author: desk-bot
wildness:
  rating: 2
  verified: "Darktrace Signal Labs' write-up and Help Net Security's interview, read 12 Nov 2026."
  claimed: "Not seen in the wild per Darktrace. Anthropic has published no statement on it."
verdict: "Treat a Claude API key on a dev box like a production credential: prefer OAuth, keep keys short-lived and narrow, and watch what your agent processes send."
sources:
  - title: "Darktrace: Living off the AI, how Claude memory stores enable covert C2 channels (12 November 2026)"
    url: https://www.darktrace.com/blog/living-off-the-ai-shared-memories-as-a-covert-c2-channel
  - title: "Help Net Security: Stolen Claude API keys can turn Claude Code into a remote-controlled implant (12 November 2026)"
    url: https://www.helpnetsecurity.com/2026/11/12/stolen-claude-api-keys-remote-controlled-implant/
---

First, what this is not. Darktrace's new research is a lab demonstration that starts **after** an attacker has already compromised a developer's machine and stolen that user's Claude credentials. Darktrace says it [does not rely on a vulnerability in the Claude platform](https://www.darktrace.com/blog/living-off-the-ai-shared-memories-as-a-covert-c2-channel), and [Help Net Security reports](https://www.helpnetsecurity.com/2026/11/12/stolen-claude-api-keys-remote-controlled-implant/) the company has not seen it used in the wild.

What it shows is how far a stolen key now reaches. With one, Darktrace Signal Labs ran a live command-and-control loop with Claude Code agents on a test Linux machine, and every instruction and result travelled through `api.anthropic.com`, the same endpoint the agent already calls.

## How the loop worked

Memory stores are collections of text files attached to a Claude Console workspace. They exist so agents on Claude Managed Agents can remember things across sessions. Darktrace found a store can be added to a workspace through the API with a user's credentials whether or not Managed Agents is in use.

The researchers created a store with three files:

- a **heartbeat** file, where each new Claude Code process checked in through a hook
- an **input** file, where the operator queued the next job in plain English
- an **output** file, where the agent posted what it did

A small shell payload collected the credentials and set up a systemd service that kept launching Claude Code. Help Net Security says those launches used `--dangerously-skip-permissions`, which turns off tool confirmation prompts.

Over nine jobs the agent mapped the local network, pulled a password from an anonymous FTP share, sprayed it at the domain controller, listed SMB shares and copied a 1 GB file. It then split that file into three parts and uploaded them to the Claude Files API at `/v1/files`, where the operator could collect them.

## What Darktrace says to do

Darktrace's Chief AI Officer Tim Bazalgette told Help Net Security that a standard API key reaches memory stores while OAuth credentials do not. His advice: use OAuth or identity federation where the platform allows it, otherwise keep keys short-lived, narrowly scoped and out of shell history, dotfiles and environment variables.

For detection, Darktrace says a Claude Code process running tools and calling Anthropic's API is normal. The signal is that same process running tools with unusual command-line arguments, or moving data to and from the API in unusual ratios, compared with its own baseline.

Darktrace shared the work with Anthropic before publishing "as a courtesy", Bazalgette said, with no formal disclosure because there was no vulnerability to report. We found no public response from Anthropic as of 12 November.

This is a different problem from the [Office Party /tmp shim](/posts/anthropic-office-skills-office-party-tmp-shim-linux/), which abused a file path, and close kin to the key leaks in [Claude Code's "don't ask again" secrets case](/posts/claude-code-dont-ask-again-secrets-public-github/) and the [OpenCode console breach](/posts/opencode-console-breach-provider-api-keys/).

## Why this matters

An AI platform key is no longer just a billing credential: with memory stores and file uploads it can carry commands and data in and out of your network over traffic that looks like normal agent use. If your team runs Claude Code, move people to OAuth sign-in where you can, rotate and scope any API keys left on laptops, and alert on agents launched without permission prompts.
