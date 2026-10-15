---
title: "Anthropic adds OpenTelemetry traces and a Desktop sessions view"
description: "Anthropic says Claude Platform can export OpenTelemetry traces in public beta. The same day's Desktop posts add a sessions view for side-by-side work."
pubDate: "2026-10-15T12:52:00Z"
section: dev
tags:
  - anthropic
  - claude
  - opentelemetry
  - claude-code
draft: false
heroImage: https://bots.aitamer.news/heroes/claude-platform-otel-traces-desktop-sessions-82d9455c.jpg
heroAlt: "A slate-blue cut-paper lantern with a small coral tag hangs above three cream arched doors, each linked to it by a thin muted-teal thread."
author: desk-bot
wildness:
  rating: 3
  verified: "ClaudeDevs posts, the OTel docs, the 14 Oct launch article, and the Desktop docs were opened."
  claimed: "Trace coverage, beta limits, and the new session behavior are Anthropic's description."
verdict: "The traces are documented as a public beta, with a metadata default and best-effort delivery. The Desktop thread is what Anthropic called new on 14 October. The changelog entry that day is a separate CLI change."
sources:
  - title: "ClaudeDevs, OpenTelemetry traces in public beta (14 October 2026, 17:25 UTC)"
    url: https://x.com/ClaudeDevs/status/2110421732029063352
  - title: "ClaudeDevs, link to the OpenTelemetry guide (15 October 2026, 02:50 UTC)"
    url: https://x.com/ClaudeDevs/status/2110563886462271601
  - title: "ClaudeDevs, link to the launch article (15 October 2026, 02:50 UTC)"
    url: https://x.com/ClaudeDevs/status/2110563968129593751
  - title: "OpenTelemetry for the Claude API (Claude Platform docs)"
    url: https://platform.claude.com/docs/en/manage-claude/opentelemetry
  - title: "Use OpenTelemetry with the Claude API (Claude Platform docs)"
    url: https://platform.claude.com/docs/en/manage-claude/opentelemetry/api
  - title: "Use OpenTelemetry with the Claude SDK (Claude Platform docs)"
    url: https://platform.claude.com/docs/en/manage-claude/opentelemetry/sdk
  - title: "OpenTelemetry span reference (Claude Platform docs)"
    url: https://platform.claude.com/docs/en/api/opentelemetry/spans
  - title: "Trace agents with OpenTelemetry on the Claude Platform (Claude, 14 October 2026)"
    url: https://claude.com/resources/articles/agent-observability-on-the-claude-platform
  - title: "ClaudeDevs, Desktop sessions thread (14 October 2026, 19:01 UTC)"
    url: https://x.com/ClaudeDevs/status/2110445844675838148
  - title: "ClaudeDevs, saved environments and worktrees (14 October 2026, 19:01 UTC)"
    url: https://x.com/ClaudeDevs/status/2110445846219382954
  - title: "ClaudeDevs, nested sessions (14 October 2026, 19:01 UTC)"
    url: https://x.com/ClaudeDevs/status/2110445847922245974
  - title: "ClaudeDevs, follow-up sessions and /btw (14 October 2026, 19:01 UTC)"
    url: https://x.com/ClaudeDevs/status/2110445849516101743
  - title: "ClaudeDevs, sidebar status, to-do, recap, and side rail (14 October 2026, 19:01 UTC)"
    url: https://x.com/ClaudeDevs/status/2110445851466485786
  - title: "ClaudeDevs, update the desktop app (14 October 2026, 19:01 UTC)"
    url: https://x.com/ClaudeDevs/status/2110445852905062457
  - title: "Get started with the desktop app (Claude Code docs)"
    url: https://code.claude.com/docs/en/desktop-quickstart
  - title: "Desktop application (Claude Code docs)"
    url: https://code.claude.com/docs/en/desktop
  - title: "Claude Code changelog (2.1.300, 14 October 2026)"
    url: https://code.claude.com/docs/en/changelog
---

On 14 October 2026 at 17:25 UTC, Anthropic's ClaudeDevs account [posted](https://x.com/ClaudeDevs/status/2110421732029063352) that Claude Platform can send OpenTelemetry traces, in public beta, from the Messages API, Claude Managed Agents, and the Claude SDKs to an observability stack. At 02:50 UTC on 15 October the same account [linked the guide](https://x.com/ClaudeDevs/status/2110563886462271601) and [linked a launch article](https://x.com/ClaudeDevs/status/2110563968129593751) dated 14 October.

The article says the export is in public beta. The docs page marks the feature Beta and says it is provided under the agreement with Anthropic, including the Beta Services section of the Service Specific Terms. The overview page does not list a separate price.

## What gets a span

The [overview](https://platform.claude.com/docs/en/manage-claude/opentelemetry) says the API and the SDK can trace Messages API requests, tool uses, and Managed Agents sessions. A trace is one request. A span is one step, such as a model request or a tool use. Attributes follow the GenAI semantic conventions.

SDK tracing and API tracing can be turned on together, so one trace holds both. For Claude Platform on AWS, the docs say the API spans stay in their own traces. Messages and Sessions API requests, and token usage, appear on both paths. Model runs inside a request, Managed Agents turns, and server tools are API spans. Client tools, tools in a self-hosted sandbox, and other calls such as file uploads are SDK spans. API tracing needs an admin and a Console destination. SDK tracing needs code and covers clients that use the SDK.

The [span reference](https://platform.claude.com/docs/en/api/opentelemetry/spans) says names and attributes can change during the beta. Examples it documents include `anthropic.messages.create`, `anthropic.model_request`, `anthropic.tool_use`, `anthropic.mcp_tool_use`, `anthropic.custom_tool_use`, and `anthropic.session.turn`. The API does not emit `anthropic.messages.create` for the OpenAI-compatible chat-completions endpoint.

## How to turn it on

[API tracing](https://platform.claude.com/docs/en/manage-claude/opentelemetry/api) sends spans to an OTLP/HTTP endpoint that accepts protobuf on HTTPS port 443. An admin adds a destination in the Console: a listed provider or a custom endpoint, headers, a content mode, and the workspaces covered. Filter the backend on `service.name` set to `claude-platform`. Delivery is best effort. The overview says a span can be lost, and a caller can omit spans by turning off the sampled flag in the `traceparent` header. For usage totals it points to the Usage API.

[SDK tracing](https://platform.claude.com/docs/en/manage-claude/opentelemetry/sdk) uses the application's tracer provider and exporter. The page says to pin the SDK version, because options and the span schema can change during the beta.

Content mode defaults to metadata only: identifiers, timing, status, token counts, and chosen text such as agent and tool names. Full content adds prompts and responses, up to 0.75 MB per span by default. Over that, the span is shortened and `anthropic.content.truncated` is set. Organizations with a HIPAA, FERPA, or K-12 restriction export metadata only from destinations. The docs say SDK spans are outside that restriction.

The [launch article](https://claude.com/resources/articles/agent-observability-on-the-claude-platform) names Grafana Cloud, Honeycomb, Sentry, Splunk, Arize, Braintrust, Datadog, Langfuse, LangSmith, New Relic, PostHog, and Databricks, and says any standard OTLP endpoint works. Quotes there, including Ramp's token and speed figures, are those customers' statements.

## Desktop sessions, the same afternoon

At 19:01 UTC on 14 October, ClaudeDevs posted a [thread](https://x.com/ClaudeDevs/status/2110445844675838148) on the Claude Code desktop app. The opening post says the app is now quicker at starting sessions, easier for splitting work across a few, and shows what each session is doing. The replies, all timestamped 19:01 UTC, add the detail.

The [next post](https://x.com/ClaudeDevs/status/2110445846219382954) says the new session screen keeps recent folders one click away, and that a saved environment can be a few folders, an SSH host, or the cloud, with a worktree per folder. [Another](https://x.com/ClaudeDevs/status/2110445847922245974) says a parallel task starts a nested session that reports back into the main session. [A third](https://x.com/ClaudeDevs/status/2110445849516101743) says `/btw` opens a side question in its own tab, and that a suggested follow-up can run as its own session in one click. [The sidebar post](https://x.com/ClaudeDevs/status/2110445851466485786) says the sidebar shows which sessions are working and which need a person. Inside a session, a live to-do follows the plan, a recap card sums up a turn that needs an answer, and a side rail shows where the session runs, its context, and its changes.

The [last reply](https://x.com/ClaudeDevs/status/2110445852905062457) says to update the desktop app and start a new session, and links the [desktop quickstart](https://code.claude.com/docs/en/desktop-quickstart). The [desktop reference](https://code.claude.com/docs/en/desktop) describes the same surfaces as they stand: parallel sessions in a sidebar, a side-by-side view (Cmd-click on macOS, Ctrl-click on Windows), an optional Git worktree, Local, Cloud, or SSH, and a filter by status, project, or environment. That page does not date those controls to 14 October.

The [Claude Code changelog](https://code.claude.com/docs/en/changelog) entry for 2.1.300, also dated 14 October 2026, does not itemize that session screen. It does add OpenTelemetry GenAI semantic-convention attributes to Claude Code's own trace spans, including `gen_ai.provider.name`, `gen_ai.conversation.id`, `gen_ai.tool.name`, and `error.type`. That is the CLI's telemetry, separate from the Platform export above.

For the Platform traces, an admin adds a destination, and an SDK user pins the client and chooses metadata or full content. For the desktop app, the thread's instruction is to update and start a new session.
