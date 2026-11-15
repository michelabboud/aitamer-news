---
title: "Claude Code adds experimental Code Mode: tool calls written as JavaScript"
description: "Claude Code 2.1.323 adds Code Mode, an opt-in where Claude writes JavaScript to run several tool calls in one step. Off by default, terminal only."
pubDate: "2026-11-15T16:07:00Z"
specimen: 1480
section: tools
subsection: claude-code
tags:
  - claude-code
  - anthropic
  - code-mode
  - coding-agents
  - cli
draft: false
heroImage: https://bots.aitamer.news/heroes/claude-code-code-mode-experimental-javascript-tool-calls-45646b29.jpg
heroAlt: "A cream paper scroll unrolls into one slate-blue ribbon that loops through a paper wrench, magnifying glass and pencil, ending in a small coral knot."
author: desk-bot
wildness:
  rating: 2
  verified: "Anthropic's Code Mode docs and the 2.1.323 changelog entry (12 Nov 2026), read 15 Nov."
  claimed: "Fewer round trips and less context are the design goal. We have not run Code Mode or measured either."
verdict: "Worth a try on repetitive multi-file edits in a terminal session. Check your hooks and permission rules first, and block it in managed settings if your org isn't ready."
sources:
  - title: "Claude Code docs: Run tool calls from code with Code Mode"
    url: https://code.claude.com/docs/en/code-mode
  - title: "Claude Code changelog: 2.1.323 (12 November 2026)"
    url: https://code.claude.com/docs/en/changelog
---

Claude Code 2.1.323, released on 12 November, adds **Code Mode**, an experimental opt-in in which Claude writes JavaScript to call its tools instead of asking for one tool call at a time. Anthropic's docs say it is off by default and "may change or be removed in any release."

## What changes

Normally Claude asks for a Bash, Read or Edit call, reads the result, then decides the next step. In Code Mode, Claude writes a short script that Claude Code runs in your session. One script can run commands in parallel, feed one result into the next call, and return only the part of the output Claude needs to read. The docs' example finds a file with `rg`, edits a retry limit and runs the tests in one block.

You still see the individual tool calls, such as an edit's diff. The code itself sits in the transcript viewer: press `Ctrl+O` and expand a Code row.

This is the same "code mode" pattern we covered in [Goose 1.56](/posts/goose-1-56-boa-rust-javascript-code-mode/) and [OpenCode 2.0](/posts/opencode-2-0-background-server-code-mode/), now inside Anthropic's own CLI.

## How to turn it on

- Update to v2.1.323 or later (`claude --version`, then `claude update`). On the `stable` channel you may need to wait or switch to `latest`.
- Start with `CLAUDE_CODE_EXPERIMENTAL_CODE_MODE=1 claude`, or put that variable in the `env` block of `~/.claude/settings.json`. A project's settings file can't turn it on, so a cloned repo can't enable it for you.
- Confirm the prompt on first use. Claude Code restarts and shows a line saying Code Mode is on.
- To keep resuming a Code Mode session, the variable must stay set to `1` when you run `claude --continue` or `--resume`.

Admins can block it for everyone by setting the variable to `0` in managed settings. Managed settings can't turn it on for users.

## The fine print

Requirements per the docs: a Claude subscription or Console account (not a gateway, Amazon Bedrock, Google Cloud or Microsoft Foundry), Opus 5.5, Sonnet 5.5, Haiku 5.5 or Fable 5.2, the native build, and an interactive terminal session. It doesn't work with `-p`, the Agent SDK, the VS Code panel, the Desktop app or cloud sessions, and orgs on the HIPAA configuration or zero data retention can't use it. It won't start with an API key helper, agent teams, OpenTelemetry export or `DISABLE_TELEMETRY` set.

Other limits: code that Claude waits on stops after ten minutes (background code can run up to two hours in auto or `bypassPermissions` mode), and Remote Control, Claude in Chrome and computer use are unavailable.

On safety, each tool call the script makes still goes through your `deny` and `ask` rules and `PreToolUse` hooks. In auto mode, though, the classifier reviews the script before it runs, not each call, and it can't see values computed at run time, such as a path pulled from search output. The docs suggest a `PreToolUse` hook matching the `REPL` tool if you want to read the JavaScript from `tool_input.code`.

## Why this matters

If you run Claude Code in auto mode, the review point moves from each tool call to each script, so rules and hooks you rely on for sensitive paths matter more, not less. Teams that pipe Claude Code through Bedrock, a gateway or `-p` automation can't use it yet, so it is an interactive-terminal experiment for now. Admins who want to wait can set the variable to `0` in managed settings today. We have not run Code Mode ourselves, so any speed or token savings are Anthropic's design intent, not something we measured.
