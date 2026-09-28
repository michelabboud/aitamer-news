---
title: "What an agent harness actually is"
description: "The model proposes; the harness executes, remembers, and gates. Most of what makes an agent safe or unsafe lives in the software around the model."
pubDate: "2026-09-30T21:00:00Z"
specimen: 68
section: "dev"
tags: ["agents", "agent-harness", "mcp", "tool-use", "permissions", "sandboxing"]
draft: false
heroImage: "https://media.aitamer.news/heroes/what-an-agent-harness-is.jpg"
heroAlt: "A paper-cut diagram: a small faceted shape sends a cream line into a loop of slate-blue gears and levers. A single coral latch at the midpoint stands ready to stop the flow, while another line exits the loop."
author: "mai"
sources:
  - title: "Tool use with Claude"
    url: "https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview"
  - title: "Function calling | OpenAI API"
    url: "https://platform.openai.com/docs/guides/function-calling"
  - title: "Model Context Protocol specification"
    url: "https://modelcontextprotocol.io/specification/2025-06-18"
  - title: "Tools — Model Context Protocol"
    url: "https://modelcontextprotocol.io/specification/2025-06-18/server/tools"
  - title: "Resources — Model Context Protocol"
    url: "https://modelcontextprotocol.io/specification/2025-06-18/server/resources"
  - title: "Agent runtime — OpenClaw"
    url: "https://github.com/openclaw/openclaw/blob/main/docs/concepts/agent.md"
  - title: "Persistent Memory — Hermes Agent"
    url: "https://hermes-agent.nousresearch.com/docs/user-guide/features/memory/"
  - title: "goose Architecture"
    url: "https://github.com/block/goose/blob/main/documentation/docs/goose-architecture/goose-architecture.md"
  - title: "Tools — OpenCode"
    url: "https://opencode.ai/docs/tools/"
  - title: "Compaction — OpenAI API"
    url: "https://developers.openai.com/api/docs/guides/compaction"
  - title: "Configure permissions — Claude Code"
    url: "https://code.claude.com/docs/en/permissions"
  - title: "Sandbox security — OpenAI Agents API"
    url: "https://developers.openai.com/api/docs/guides/agents-api/environments/security"
  - title: "How we contain Claude across products — Anthropic Engineering"
    url: "https://www.anthropic.com/engineering/how-we-contain-claude"
  - title: "Running agents — OpenAI Agents SDK"
    url: "https://openai.github.io/openai-agents-python/running_agents/"
wildness:
  rating: 4
  verified: "Each behaviour is quoted from the primary documentation of the system it describes."
  claimed: "No independent tests; several pages are undated and cited as fetched on 2026-09-28."
verdict: "An agent is mostly harness: the loop that decides when to stop, the tools it can and cannot reach, the memory it loads as a frozen snapshot, and the permission and sandbox layers that turn requests into enforced limits."
---

The cleanest way to see what a harness is, is to watch one tool call move through it. Anthropic's documentation calls tool use "also called function calling" ([Anthropic tool use](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview)). For a client tool, the model emits "a structured call that your application executes" ([Anthropic tool use](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview)). Anthropic also runs some server tools on its own infrastructure. The application runs the function, then "sends back a `tool_result`" that returns to the model in another conversation step ([Anthropic tool use](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview)).

OpenAI describes the same division from the other side: a tool call is "a multi-step conversation between your application and a model," with the instruction to "Execute code on the application side" ([OpenAI function calling](https://platform.openai.com/docs/guides/function-calling)). Both vendors place the model on one side of a line and the software that actually does the work on the other. That software is the harness.

### The loop

A single request-and-response is only the smallest unit. What makes an agent an agent is the loop: the model proposes an action, the harness runs it, the result goes back, and the model proposes again. OpenAI notes that after tool output the conversation can continue with "or more tool calls" rather than ending in one answer ([OpenAI function calling](https://platform.openai.com/docs/guides/function-calling)). The goose architecture gives its agent component "managing the interactive loop," with extensions that "provide specific tools and capabilities," and after running a tool it "sends the results back to the model," which can repeat ([goose architecture](https://github.com/block/goose/blob/main/documentation/docs/goose-architecture/goose-architecture.md)).

The loop is where the harness's most consequential knobs sit. OpenAI's Agents SDK runs whatever tool calls the model produces, feeding another iteration, and it also stops "If we exceed the `max_turns` passed" ([OpenAI Agents SDK](https://openai.github.io/openai-agents-python/running_agents/)). The same page is blunt about how reversible that guardrail is: "Pass `max_turns=None` to disable this turn limit" ([OpenAI Agents SDK](https://openai.github.io/openai-agents-python/running_agents/)). OpenClaw, for its part, ships "a built-in agent loop, tool wiring, and prompt assembly" as one embedded runtime ([OpenClaw docs](https://github.com/openclaw/openclaw/blob/main/docs/concepts/agent.md)). The loop is not a property of the model; it is a piece of harness logic with a configurable stop condition.

### Tools

The harness also decides what the model can reach. The Model Context Protocol specification separates three things a server offers, one of them "Tools: Functions for the AI model to execute" ([MCP spec](https://modelcontextprotocol.io/specification/2025-06-18)) — "tools that can be invoked by language models" ([MCP tools](https://modelcontextprotocol.io/specification/2025-06-18/server/tools)). Crucially, the model never invokes one directly: "clients send a `tools/call` request" ([MCP tools](https://modelcontextprotocol.io/specification/2025-06-18/server/tools)). The tool runs because the host application made a request over the protocol, not because the model executed code.

Availability is an explicit configuration surface. OpenCode states its role plainly — "Manage the tools an LLM can use" — and adds that "By default, all tools are enabled" ([OpenCode tools](https://opencode.ai/docs/tools/)). The default matters, because it means the safe configuration is not the automatic one; it is the one someone deliberately set.

### Memory and context

An agent that only had the current message would forget everything between turns, so harnesses carry state. The MCP specification has a second category, resources: "Each resource is uniquely identified by a URI," read through a "`resources/read` request," with the host application deciding how resource content enters context ([MCP resources](https://modelcontextprotocol.io/specification/2025-06-18/server/resources)). Resources are "application-driven" — the harness, not the model, controls what gets loaded.

Durable memory is a different mechanism. Hermes describes "bounded, curated memory that persists across sessions," which is "injected into the system prompt as a frozen snapshot" at session start ([Hermes Agent docs](https://hermes-agent.nousresearch.com/docs/user-guide/features/memory/)). That phrase is worth lingering on: memory arrives as a snapshot, loaded at the start and not continuously refreshed — and "Memory does not auto-compact" ([Hermes Agent docs](https://hermes-agent.nousresearch.com/docs/user-guide/features/memory/)). OpenClaw says it injects specified workspace files into the system prompt's Project Context on the first turn of a session ([OpenClaw docs](https://github.com/openclaw/openclaw/blob/main/docs/concepts/agent.md)).

Conversation context, by contrast, is compressed on purpose. OpenAI's compaction guide frames it as a way to "reduce context size while preserving state," balancing "quality, cost, and latency," where "The latest compaction item carries the necessary context" for continuation ([OpenAI compaction](https://developers.openai.com/api/docs/guides/compaction)). In the systems documented here, three mechanisms show up: the live conversation, optional compaction, and, in Hermes, a memory snapshot taken at session start.

### Permissions and sandboxing

The heaviest part of the harness is the part that says no. OpenCode's permission model can "allow, deny, or require approval" ([OpenCode tools](https://opencode.ai/docs/tools/)). Claude Code adds "fine-grained permission rules, modes, and managed policies," and makes the distinction the rest of the machinery depends on: "Permission rules are enforced by Claude Code, not by the model" ([Claude Code permissions](https://code.claude.com/docs/en/permissions)). A prompt telling the model to be careful is not the same mechanism as a runtime that refuses the call; only the second is enforcement.

Below that sits the sandbox. Claude Code documents an OS-enforced sandbox for shell commands and their child processes ([Claude Code permissions](https://code.claude.com/docs/en/permissions)). The MCP specification's own guidance is softer but points the same way: "there SHOULD always be a human in the loop" able to deny a tool invocation ([MCP tools](https://modelcontextprotocol.io/specification/2025-06-18/server/tools)). And OpenAI's security guidance for agent environments is concrete: "Agent-generated code can access the files, credentials, and network," so the guidance is to "Isolate workloads" and "Keep your application API key outside the environment" ([OpenAI sandbox security](https://developers.openai.com/api/docs/guides/agents-api/environments/security)). The threat model is what the environment lets that code touch.

### Where harnesses fail

Anthropic's engineering writeup is explicit that containment cannot live in the model alone: "protection in the model layer will never be 100% effective" ([Anthropic engineering](https://www.anthropic.com/engineering/how-we-contain-claude)). The attack surfaces are the harness's own affordances — "External attackers" reach the agent "through external vectors," and Anthropic's example is a connector that can carry a poisoned README into the model's context despite its checks ([Anthropic engineering](https://www.anthropic.com/engineering/how-we-contain-claude)). That is the precise shape of a prompt injection: a trusted retrieval path delivering untrusted content.

Each of those failures has a counterpart in the defaults above. All tools enabled ([OpenCode tools](https://opencode.ai/docs/tools/)). A turn limit that one argument removes ([OpenAI Agents SDK](https://openai.github.io/openai-agents-python/running_agents/)). A memory snapshot loaded once at session start. Anthropic's own write-up argues that the model layer alone can't contain every attack, so the rest has to come from the harness.
