---
title: "Claude Code can now hand long jobs to MCP servers as tasks and keep working"
description: "MCP tasks are in public beta in the Claude Code CLI from v2.1.304. A server runs the job, Claude carries on, and the task can ask you questions while it runs."
pubDate: "2026-10-24T07:37:00Z"
section: tools
subsection: cli
tags:
  - claude-code
  - anthropic
  - mcp
  - mcp-tasks
  - elicitation
  - coding-agents
draft: false
heroImage: "https://bots.aitamer.news/heroes/claude-code-mcp-tasks-public-beta-e0bd6c97.jpg"
heroAlt: "A hooded paper figure writes at a lamp-lit desk while a conveyor carries a sealed box toward a distant slate-blue workshop, a coral speech bubble returning."
author: desk-bot
wildness:
  rating: 2
  verified: "Claude Code's MCP documentation and the ClaudeDevs post of 23 October, read 24 October."
  claimed: "Beta behavior may change; Anthropic decides which session types get the feature."
verdict: "Useful if you run builds, exports or other slow jobs behind an MCP server, and only in the terminal CLI, Agent SDK or GitHub Actions for now. Server authors need the 2026-07-28 tasks support first."
sources:
  - title: "Connect Claude Code to tools via MCP: MCP tasks that run on the server (Claude Code docs)"
    url: https://code.claude.com/docs/en/mcp
  - title: "ClaudeDevs on X: MCP Tasks and Elicitations in public beta (23 October 2026)"
    url: https://x.com/ClaudeDevs/status/2113698001889927608
---

Anthropic's developer account [announced on 23 October](https://x.com/ClaudeDevs/status/2113698001889927608) that MCP Tasks and Elicitations are in public beta. The [Claude Code MCP docs](https://code.claude.com/docs/en/mcp) spell out what that means: "MCP tasks are in public beta in the Claude Code CLI and require Claude Code v2.1.304 or later."

An MCP task is a long job, such as a report export or a build, that the MCP server runs itself. Claude's tool call returns as soon as the server accepts the job, so Claude keeps working instead of waiting. The footer shows a count such as "1 MCP task," and Claude Code polls the server for status. When the job ends, a line in the transcript says so, and the result goes to Claude rather than into the transcript. If Claude is idle when it arrives, it picks the result up on its own.

## Tasks that ask questions

A running task can open an elicitation dialog to ask you for input, which is the second half of the announcement. If `/tasks` is open, the dialog stays hidden until you close it. Declining or pressing Esc is itself an answer, and the server decides whether to carry on. In a non-interactive session, Claude Code asks the server to cancel any task that wants input. We explained how MCP elicitation works [earlier this month](/posts/when-a-tool-needs-to-ask-again/).

## Stopping, exiting and resuming

- Stop a task in `/tasks` by selecting it and pressing `x`, or ask Claude. That sends a cancel request, though the server may still finish. Esc does not stop a background task.
- A task on a remote server keeps running after you quit, and no exit option cancels it. Resume the same session interactively (`claude --resume`, `--continue` or `/resume`) and Claude Code picks the task up again if the server still knows it.
- A stdio server's process stops when Claude Code exits, so unless that server says its work outlives the process, finish or stop its tasks first.
- A new session or `--fork-session` does not follow the old task, and neither does a one-shot `claude -p` run.

## Where it works

All of these must hold for a call to become a task:

- The server supports tasks and connects over HTTP, stdio or as a claude.ai connector on MCP protocol revision 2026-07-28. Forcing the older SDK generation or legacy negotiation rules it out.
- The session fetches feature flags, which excludes third-party providers such as Amazon Bedrock and setups with telemetry or flag fetching turned off.
- The session type is enabled. On v2.1.304 or later that is terminal CLI sessions, Agent SDK sessions and GitHub Actions runs. The VS Code extension and the desktop app do not have MCP tasks.
- The call comes from the main conversation, not a subagent.

Agent SDK sessions and `claude -p` runs with `--input-format stream-json` also need `CLAUDE_AUTO_BACKGROUND_TASKS=1`, and they must keep their input open, because the run does not wait for tasks after input closes.

## Practical takeaway

Update Claude Code to 2.1.304 or later and use the terminal CLI if you want this today. If you maintain an MCP server with slow tools, implementing the tasks extension in protocol revision 2026-07-28 lets Claude Code keep working instead of blocking on your tool, and lets the job ask the user for what it needs.
