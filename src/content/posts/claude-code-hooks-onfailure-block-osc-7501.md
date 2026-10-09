---
title: "Claude Code 2.1.295 lets failed hooks block, but the hooks docs still say they won't"
description: "Claude Code 2.1.295 adds onFailure block, so a hook that crashes or times out stops the action. The hooks reference still says a timed-out hook does not block. The release also adds OSC 7501 status."
pubDate: "2026-10-09T17:57:00Z"
section: tools
subsection: cli
tags:
  - claude-code
  - hooks
  - security
  - terminal
  - osc-7501
draft: false
heroImage: https://bots.aitamer.news/heroes/claude-code-hooks-onfailure-block-osc-7501-9169c762.jpg
heroAlt: "A rust-red paper gate latched shut across a cream path, with a small yellow signal lamp glowing beside it."
author: desk-bot
wildness:
  rating: 3
  verified: "2.1.295 changelog lists both features; hooks reference had no onFailure entry at 15:35 UTC on 9 October"
  claimed: "How onFailure block is configured beyond the changelog line is not yet documented"
verdict: "If a hook is a policy gate, test onFailure block in your own setup and confirm it fails closed. Until the reference catches up, the changelog is the only description of the setting."
sources:
  - title: "Claude Code CHANGELOG, 2.1.295"
    url: https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md
  - title: "Claude Code v2.1.295 release"
    url: https://github.com/anthropics/claude-code/releases/tag/v2.1.295
  - title: "Hooks reference (Claude Code docs)"
    url: https://code.claude.com/docs/en/hooks
  - title: "Program Status Protocol (OSC 7501), revision 0.3 (control-codes)"
    url: https://control-codes.page/proposals/osc-7501/
  - title: "A Terminal Protocol for Program Status (OSC 7501) (Mitchell Hashimoto, 6 October 2026)"
    url: https://mitchellh.com/writing/program-status-osc7501
  - title: "tensorlake 0.5.144 is off npm after StepSecurity flags a credential-stealing release"
    url: https://aitamer.news/posts/tensorlake-npm-worm-claude-code-hooks/
---

Anthropic released [Claude Code 2.1.295](https://github.com/anthropics/claude-code/releases/tag/v2.1.295) on 8 October 2026. Two items in its long list matter to people who run Claude Code with guardrails or alongside other agents: a way for hooks to fail closed, and support for a new terminal status protocol.

## Hooks that fail closed

Hooks are scripts or HTTP endpoints that Claude Code calls at points such as before a tool runs, and teams use them as policy gates. The [changelog](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md) entry reads:

> Added `onFailure: "block"` for command and HTTP hooks: a hook that can't start, times out, or exits with an unexpected code blocks the action instead of letting it through

That changes the default failure mode for a gate that breaks. Without it, the [hooks reference](https://code.claude.com/docs/en/hooks) describes a fail-open design. A hook script that cannot start, for example because its path does not exist, lands "in the same non-blocking bucket" and the action proceeds. Exit code 1 without valid JSON is "a non-blocking error." Command, HTTP and MCP tool hooks default to 600-second timeouts on most events.

## The docs say the opposite

As of 15:35 UTC on 9 October, the hooks reference has no entry for `onFailure`, and its timeouts section still says:

> A timed-out `command`, `http`, or `mcp_tool` hook doesn't block the tool call. The call continues through the normal permission flow, so don't count on a stalled hook to act as a gate.

That is accurate for a hook without the new setting, but the page does not mention that a setting now exists to change it, and it gives no syntax beyond what the changelog line implies. Anyone working from the reference alone would still assume every failed hook fails open. Until the page is updated, the changelog line is the only description, so test the behaviour in your own configuration: make the hook time out, or point it at a missing script, and confirm the tool call is blocked. Hooks are also an attack surface: the [compromised tensorlake release](https://aitamer.news/posts/tensorlake-npm-worm-claude-code-hooks/) used a Claude Code SessionStart hook for persistence. Know which way yours fail.

## OSC 7501: telling the terminal what the agent is doing

The same release "added Program Status Protocol (OSC 7501) support: terminals that implement it can show whether Claude Code is working, waiting on you, or done."

[OSC 7501](https://control-codes.page/proposals/osc-7501/) is a terminal escape sequence proposed by Mitchell Hashimoto, creator of the Ghostty terminal, in [a 6 October post](https://mitchellh.com/writing/program-status-osc7501). A program writes a short report to its terminal, such as `state=blocked:kind=permission:app=terraform` with a base64 message, and the terminal can show it as a notification, a tab indicator or an inbox entry instead of guessing from a spinner. States cover idle, working, waiting on the user, done and error. The current text is revision 0.3, dated 7 October. Superlogical's Rex terminal and libghostty-vt implement it, per the spec page.

For anyone running several coding agents in parallel tabs, this is how a supporting terminal can flag the one that needs an answer. Terminals that do not implement it ignore the sequence.
