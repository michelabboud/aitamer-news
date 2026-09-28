---
title: "What a coding agent is made of"
description: "A coding agent combines a model loop, tools, project instructions, and rules for what it may do. Here is how four CLIs arrange those parts."
pubDate: "2026-09-29T17:00:00Z"
specimen: 52
section: "tools"
tags: ["coding-agents", "claude-code", "codex-cli", "gemini-cli", "opencode"]
draft: false
heroImage: "https://media.aitamer.news/heroes/anatomy-of-a-coding-agent.jpg"
heroAlt: "A paper-cut collage of a code file inside a loop linking project notes, an edit tool, and a terminal."
author: "ari"
sources:
  - title: "Claude Code overview"
    url: "https://code.claude.com/docs/en/overview"
  - title: "Claude Code memory and project instructions"
    url: "https://code.claude.com/docs/en/memory"
  - title: "Claude Code permissions"
    url: "https://code.claude.com/docs/en/permissions"
  - title: "Claude Code sandboxing"
    url: "https://code.claude.com/docs/en/sandboxing"
  - title: "Claude Code plugins"
    url: "https://code.claude.com/docs/en/plugins"
  - title: "Claude Code MCP connections"
    url: "https://code.claude.com/docs/en/mcp"
  - title: "Codex CLI"
    url: "https://developers.openai.com/codex/cli"
  - title: "OpenAI agent loop"
    url: "https://developers.openai.com/api/docs/guides/agents/running-agents"
  - title: "Codex project instructions with AGENTS.md"
    url: "https://developers.openai.com/codex/guides/agents-md"
  - title: "Codex approvals and security"
    url: "https://developers.openai.com/codex/agent-approvals-security"
  - title: "Codex Model Context Protocol connections"
    url: "https://developers.openai.com/codex/mcp"
  - title: "Codex plugins"
    url: "https://developers.openai.com/codex/plugins"
  - title: "Gemini CLI tools reference"
    url: "https://github.com/google-gemini/gemini-cli/blob/main/docs/reference/tools.md"
  - title: "Gemini CLI GEMINI.md context files"
    url: "https://geminicli.com/docs/cli/gemini-md/"
  - title: "Gemini CLI sandboxing"
    url: "https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/sandbox.md"
  - title: "Gemini CLI approval policy"
    url: "https://geminicli.com/docs/reference/policy-engine/"
  - title: "Gemini CLI MCP servers"
    url: "https://geminicli.com/docs/tools/mcp-server/"
  - title: "Gemini CLI extensions"
    url: "https://github.com/google-gemini/gemini-cli/blob/main/docs/extensions/writing-extensions.md"
  - title: "OpenCode tools"
    url: "https://opencode.ai/docs/tools"
  - title: "OpenCode rules"
    url: "https://opencode.ai/docs/rules"
  - title: "OpenCode permissions"
    url: "https://opencode.ai/docs/permissions"
  - title: "OpenCode MCP servers"
    url: "https://opencode.ai/docs/mcp-servers"
  - title: "OpenCode plugins"
    url: "https://opencode.ai/docs/plugins"
wildness:
  rating: 5
  verified: "The cited documentation and links were checked; product behavior was not tested."
  claimed: "Feature, security, and reliability descriptions come from first-party documentation."
verdict: "Choose by how its tools, project guidance, and approval boundary fit your repository and risk tolerance."
---

A coding agent is software that lets a language model inspect a codebase, take actions through tools, and use the results to decide what to do next. The model proposes tool calls and responses; the surrounding program supplies the working loop and the boundaries. Looking at Claude Code, OpenAI Codex CLI, Gemini CLI, and OpenCode makes those pieces easier to see.

The product details below reflect their official documentation as of September 2026. Documentation explains intended behavior. It does not, by itself, prove how well a tool performs on every repository or whether its safeguards resist every attack.

## The loop turns suggestions into work

In a chat-only interaction, the model returns text and waits. A coding agent can instead ask its host to call a tool: read a file, search the tree, edit a file, or run a shell command. The host executes the action, returns its result to the model, and the model can make another request. That cycle continues until it responds to the developer or reaches a limit. ([OpenAI agent loop](https://developers.openai.com/api/docs/guides/agents/running-agents))

The tools are ordinary software interfaces. Gemini CLI documents separate file-reading, replacement, file-writing, and shell tools; its default policy generally asks for confirmation before write tools and shell commands run. OpenCode documents read, edit, write, and `bash` tools, and describes edit as its primary way for a model to change existing code. Claude Code and Codex CLI similarly present repository exploration, edits, and local commands as one terminal workflow. ([Claude Code overview](https://code.claude.com/docs/en/overview), [Codex CLI](https://developers.openai.com/codex/cli), [Gemini CLI tools reference](https://github.com/google-gemini/gemini-cli/blob/main/docs/reference/tools.md), [Gemini CLI approval policy](https://geminicli.com/docs/reference/policy-engine/), [OpenCode tools](https://opencode.ai/docs/tools))

This is why two agents using the same model can feel different. Tool names and input formats affect the actions a model can request. The host decides which calls to run, which results to show, and whether a human must approve a call. A file edit can be applied as a patch or as a precise replacement; either way, it is the host’s implementation that touches the file.

## Project files give the model local knowledge

For a particular repository, the agent needs current guidance on test commands, subsystem locations, and team conventions. [Context files](https://code.claude.com/docs/en/memory) can provide that guidance between prompts.

Codex documents an `AGENTS.md` hierarchy that combines global and project guidance, with more local files later in the instruction chain. Gemini CLI says it defaults to `GEMINI.md` and combines global, workspace, and just-in-time context found as tools access directories. Claude Code says it reads `AGENTS.md` by default only when no `CLAUDE.md` or `CLAUDE.local.md` is found in or above the working directory, including `.claude/CLAUDE.md`; it can be configured to read both, alongside path-scoped rules. OpenCode says it uses `AGENTS.md` as its main rule file, supports `CLAUDE.md` as a fallback, and can be configured to load other instruction files. ([Codex AGENTS.md guide](https://developers.openai.com/codex/guides/agents-md), [Gemini CLI GEMINI.md guide](https://geminicli.com/docs/cli/gemini-md/), [Claude Code memory guide](https://code.claude.com/docs/en/memory), [OpenCode rules](https://opencode.ai/docs/rules))

The filename `AGENTS.md` appears in several tools' documentation, but their discovery rules differ. Gemini’s context filename is configurable; Claude can combine `CLAUDE.md` with `AGENTS.md` when configured to do so; OpenCode’s `AGENTS.md` takes precedence over its Claude-compatible fallback. Check which directories your chosen agent actually reads. Keep durable project facts in these files, and leave task-specific requests in the prompt.

## Approval and sandboxing are different controls

An approval policy asks whether a person should authorize a particular action. A sandbox restricts what the process can technically reach, even if an action is attempted. One is a decision point; the other is an execution boundary. A “yes” to a prompt does not necessarily grant access beyond the sandbox, and a sandbox alone may not explain a risky action to its operator.

Codex documents these as separate layers: its CLI sandbox can limit writes to the workspace and disable network access, while its approval policy governs actions such as going outside that boundary. Gemini CLI documents approval modes and optional tool sandboxing, including container-based approaches; its sandbox expansion flow can request extra permissions for one run. Claude Code documents tool permission rules and a Bash sandbox, and recommends both as defense in depth. OpenCode documents configurable rules that can allow, deny, or ask per tool; it says its defaults allow most tools while asking for actions involving external directories. ([Codex security guide](https://developers.openai.com/codex/agent-approvals-security), [Gemini CLI approval policy](https://geminicli.com/docs/reference/policy-engine/), [Gemini CLI sandbox guide](https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/sandbox.md), [Claude Code permissions guide](https://code.claude.com/docs/en/permissions), [Claude Code sandbox guide](https://code.claude.com/docs/en/sandboxing), [OpenCode permissions](https://opencode.ai/docs/permissions))

This comparison does not rank their safety. The exact prompts and defaults vary with configuration and execution mode. For a real project, inspect what the CLI can read, where it may write, whether network access is available, and what needs approval. Treat those as four separate questions.

## Extensions add tools and reusable behavior

The Model Context Protocol (MCP) is a standard for connecting an agent to external tools and data. An MCP server might expose issue tracking or documentation search. It may require access to other systems, so it adds another component to trust. All four products document MCP connections, although their configuration and supported transports differ. ([Claude Code MCP](https://code.claude.com/docs/en/mcp), [Codex MCP](https://developers.openai.com/codex/mcp), [Gemini CLI MCP servers](https://geminicli.com/docs/tools/mcp-server/), [OpenCode MCP servers](https://opencode.ai/docs/mcp-servers))

Plugins package extensions for reuse. Claude Code plugins can bundle skills, agents, hooks, and MCP servers. Codex plugins can bundle skills and MCP servers, with support varying by Codex surface. Gemini CLI extensions can add tools, commands, and context, and can package an MCP server. OpenCode plugins are code that can hook into events and tool execution. Each product uses its own plugin format and permission system. ([Claude Code plugins](https://code.claude.com/docs/en/plugins), [Codex plugins](https://developers.openai.com/codex/plugins), [Gemini CLI extensions](https://github.com/google-gemini/gemini-cli/blob/main/docs/extensions/writing-extensions.md), [OpenCode plugins](https://opencode.ai/docs/plugins))

## Choose a boundary that matches the task

When evaluating an agent, start with a small repository task. Ask it to explain a change, then make a contained edit and run a relevant check. Watch what it reads, what it tries to execute, and how it handles denied or failed tool calls. Review the final diff yourself.

Then write the project instructions the next session will need. Configure a sandbox boundary that matches the repository’s risk, and keep approvals for actions that affect external systems or leave that boundary. Add MCP servers or plugins only when a task benefits from the extra access, and review their permissions as carefully as you review the agent’s own.

Choose the CLI whose combination of file tools, context discovery, permission rules, and extension model matches how your team works. The model is one part of the agent; the host and its controls shape what that model can actually do.
