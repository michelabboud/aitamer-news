---
title: "Honeycomb Canvas Connectors GA: a dozen tools for agent context"
description: "Honeycomb (Sep 29, 2026) made Canvas Connectors generally available—“12 connectors and growing”—plus Anomaly Detection GA. AI Ecosystem and LLM cost tracking stay early access."
pubDate: 2026-10-01T20:30:00Z
specimen: 125
section: tools
subsection: agents
tags:
  - honeycomb
  - canvas
  - connectors
  - agents
  - observability
  - anomaly-detection
  - mcp
  - ga
draft: false
heroImage: https://media.aitamer.news/heroes/honeycomb-canvas-connectors-ga.jpg
heroAlt: "Paper-cut collage of a shared investigation canvas linked to small connector ports, slate blue and cream with a coral pulse on the anomaly ribbon."
author: desk-bot
wildness:
  rating: 3
  verified: "Connectors GA Sep 29 2026 — 12 and growing; Anomaly Detection GA; AI Ecosystem + LLM cost = early access"
  claimed: "Writes ask permission each time = Honeycomb vendor claim; named connectors are examples only"
verdict: "Canvas Connectors GA (a dozen and growing) plus Anomaly Detection GA. AI Ecosystem and LLM cost tracking remain early access—not GA."
sources:
  - title: "Agents Need Context: Introducing Canvas Connectors, Fleet-wide AI Agent Visibility, and More — Honeycomb"
    url: https://www.honeycomb.io/blog/agents-need-context-canvas-connectors-ai-agent-visibility
---

Honeycomb’s blog (**2026-09-29**, Dan Juengst) made **Canvas Connectors** **generally available**—framed as **“12 connectors and growing”** / **a dozen**, available to **all Honeycomb customers** under **Settings > Connectors**—and shipped **Anomaly Detection** to GA in the same post ([Honeycomb blog](https://www.honeycomb.io/blog/agents-need-context-canvas-connectors-ai-agent-visibility)).

## Canvas Connectors (GA)

Connectors let the Canvas agent reach context **outside** Honeycomb telemetry: code, incidents, runbooks, tickets, and similar sources. Honeycomb says connectors are built on **MCP**, the same open protocol as Honeycomb’s own MCP server, which is why the roster “will keep growing” ([Honeycomb blog](https://www.honeycomb.io/blog/agents-need-context-canvas-connectors-ai-agent-visibility)).

Named **examples from this GA post** (Honeycomb does not list all twelve): **GitHub**, **PagerDuty**, **Jira**, **Amplitude**, and **Confluence**. Count framing here stays at “12 and growing.”

As Honeycomb states: **reads** are allowed by default once a tool is connected; **writes ask for permission each time**, with a human approving the action—a **vendor claim** about the permission UX ([Honeycomb blog](https://www.honeycomb.io/blog/agents-need-context-canvas-connectors-ai-agent-visibility)).

## Anomaly Detection (GA)

**Anomaly Detection is generally available.** Honeycomb says it learns a statistical baseline per service for error rate and presence, with nothing to configure manually, auto-onboards services with enough steady traffic, and is available for every team. Request rate, latency, and seasonality-aware detection are framed as **coming soon**—not this GA ([Honeycomb blog](https://www.honeycomb.io/blog/agents-need-context-canvas-connectors-ai-agent-visibility)).

## AI Ecosystem = early access (not GA)

**AI Ecosystem** (fleet-wide AI agent performance and cost views) and **LLM cost tracking** are **early access only**—not generally available in this announcement. Honeycomb says cost figures are **estimates** from model/token spans and public list prices, useful to see what drives spend, not to reconcile a provider invoice ([Honeycomb blog](https://www.honeycomb.io/blog/agents-need-context-canvas-connectors-ai-agent-visibility)).

## Related products

Also in the same post (not the lead): Canvas extensions to create/update triggers, SLOs, and boards (edits need human approval); onboard instrumentation via Honeycomb MCP from Claude Code, Cursor, Codex, and others; and a donation of adaptive tail-sampling algorithms to the OpenTelemetry Collector, with Refinery still described as the more complete sampling proxy ([Honeycomb blog](https://www.honeycomb.io/blog/agents-need-context-canvas-connectors-ai-agent-visibility)).

## Who should care

Honeycomb customers who want Canvas agents to pull stack context beyond telemetry should start at [Settings > Connectors](https://www.honeycomb.io/blog/agents-need-context-canvas-connectors-ai-agent-visibility) via the [GA post](https://www.honeycomb.io/blog/agents-need-context-canvas-connectors-ai-agent-visibility). Lead with Connectors and Anomaly Detection GA; treat AI Ecosystem and LLM cost tracking as early access.
