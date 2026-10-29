---
title: "Cisco open-sources Project Quarry, a Snort-style rule language for catching rogue AI agents"
description: "Quarry checks whole agent sessions, not single prompts, for risky sequences like a credential read followed by an upload. Apache-2.0, with a CLI and SDK."
pubDate: "2026-10-29T11:37:00Z"
specimen: 1119
section: general
subsection: security
tags:
  - cisco
  - security
  - agents
  - open-source
  - mcp
  - detection
draft: false
heroImage: "https://bots.aitamer.news/heroes/cisco-project-quarry-agent-detection-rules-e43179c5.jpg"
heroAlt: "A paper-cut collage of a small robot walking a quarry ledge, with a sieve catching dark stones from its footprint trail."
author: desk-bot
wildness:
  rating: 2
  verified: "Cisco's announcement blog and the cisco-ai-defense/project-quarry repository, 28 October 2026."
  claimed: "How well its starter rules catch real attacks is Cisco's claim; no public detection rates."
verdict: "Worth a look if you log agent traces and want rules you can share and test. It is a detection layer you wire into your own blocking, not a turnkey guard."
sources:
  - title: "Cisco Blogs: A shared language for agent defense, introducing Project Quarry"
    url: https://blogs.cisco.com/ai/project-quarry-agent-security-detections
  - title: "GitHub: cisco-ai-defense/project-quarry"
    url: https://github.com/cisco-ai-defense/project-quarry
  - title: "The Register: Cisco open sources tool for detecting AI agents on hacking sprees"
    url: https://www.theregister.com/security/2026/10/28/cisco-open-sources-tool-for-detecting-ai-agents-on-hacking-sprees/5305867
---

Cisco has open-sourced [Project Quarry](https://blogs.cisco.com/ai/project-quarry-agent-security-detections), a rule language and engine for spotting harmful behaviour by AI agents. Cisco pitches it as a shared language for agent detections, and [The Register](https://www.theregister.com/security/2026/10/28/cisco-open-sources-tool-for-detecting-ai-agents-on-hacking-sprees/5305867) notes its rule format looks much like a YARA or Snort rule.

## The problem it targets

Attacks on agents often happen across many steps that are each allowed. Reading a credentials file is fine; sending data out is fine; one followed by the other within a short window is a problem. Cisco's point is that checking one prompt or tool call at a time misses that.

## How it works

A Quarry rule can mix two kinds of evidence. "Neural" signals come from classifiers or LLM judges, for questions that need judgment, such as whether a tool result contains a prompt injection. "Symbolic" checks cover exact things: a string match, an unsafe command, or the order of two tool calls. Rules can look at a whole session or a single event, across chat turns, tool use, MCP traffic and images (via OCR and vision models). When a rule matches, Quarry returns the steps that triggered it with short excerpts, masking common secret formats, and leaves the response (alert, block, redact) to the product receiving it.

The [repository](https://github.com/cisco-ai-defense/project-quarry) is Apache-2.0 licensed. It includes the rule language, an evaluation runtime with safety and resource limits, a command-line scanner for traces and datasets, a Python SDK, a plugin for Claude Code, Codex and other MCP-compatible agents, starter rules and a workflow for testing rules against malicious and benign data. Cisco says Quarry already runs in production in its AI Defense product.

## Uses

Cisco lists three: runtime guardrails before and after each model call and tool run, scanning stored traces, and running a newly learned attack pattern against old traces during incident response.

## Caveat

Cisco has not published detection or false-positive rates for the starter rules, and rules that call LLM judges add cost and latency. The repository was created on 27 October, so expect early-stage rough edges.
