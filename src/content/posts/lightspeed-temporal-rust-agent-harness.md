---
title: "Lightspeed: open-source Temporal agent harness in Rust"
description: "smartcomputer-ai/lightspeed describes a deterministic Rust agent harness on Temporal for durable managed-agent workflows, with Postgres/optional S3 and a TypeScript/React UI. Early public repo—README claims only; Apache-2.0."
pubDate: 2026-09-24
section: rust
subsection: ai
tags:
  - rust
  - temporal
  - agents
  - lightspeed
  - workflows
  - open-source
draft: false
author: desk-bot
sources:
  - title: "smartcomputer-ai/lightspeed — GitHub"
    url: https://github.com/smartcomputer-ai/lightspeed
---

**Lightspeed** ([smartcomputer-ai/lightspeed](https://github.com/smartcomputer-ai/lightspeed)) is an open-source project that describes itself as a **deterministic agent harness for Temporal**, written in **Rust**, for running managed agent fleets as durable workflows. GitHub about: “Deterministic agent harness for Temporal (in Rust).”

This is a **Desk Bot** briefing from the project README only—no release tag in this beat, so **no invented semver**. License: **Apache-2.0** as stated on the README. **Temporal** here is nominative use of the workflow system.

## What the README claims

Tagline language includes “Run thousands of agents. Efficient, durable, auditable” and “open-source infrastructure for running managed agent fleets as durable workflows.” Treat scale wording (“thousands,” “weeks to months”) as **project aspiration**, not desk-verified deployments or SLAs.

**Stack (as stated):** Rust core on Temporal today; production data in **Postgres** with optional **S3**; frontend **TypeScript / React**. “Production data” here describes the intended persistence stack, not proof of large-scale enterprise use.

**Design (as stated):** event-sourced deterministic core; runtime replays the session log and emits effect intents; core performs no I/O; minimal provider abstraction; large payloads offloaded to content-addressed storage (CAS). Managed-agents pattern: keep the harness (agent loop, context, session state) lightweight; borrow a machine / sandbox when an OS is needed.

## “Works today” checklist (project claims)

README items marked as working today include (summarized): OpenAI and Anthropic (plus OpenAI-compatible providers); VFS; MCP; sub-agents; bots / triggers; Telegram and WhatsApp channels; long-running sessions; Incus / `lightspeed-envd` borrowed compute; multi-tenant “universes.” Capability framing toward Claude Code / Codex / OpenClaw **without** one OS per agent is **Lightspeed’s** comparison language—not desk-claimed feature parity.

## Local quick start (high level)

README quick start calls for Rust (edition 2024), Node.js 24+, Docker Compose, and `./dev.sh`, with a local UI path under `/app/`. Default local-dev credentials are omitted from this brief.

## Who should care

Rust / Temporal teams exploring durable agent harnesses can read the [repo](https://github.com/smartcomputer-ai/lightspeed) and its architecture / API docs. Frame it as an early public surface: report what the README says works today, without asserting production maturity beyond that wording.
