---
title: "Cursor cloud agents can scaffold, host, and share a live app from a prompt"
description: "Paid Cursor plans with cloud agents: scaffold a web app, optional Postgres, Cursor SSO, security checks, then publish a shareable URL."
pubDate: "2026-11-06T19:37:00Z"
section: tools
subsection: agents
tags:
  - cursor
  - cloud-agents
  - apps
  - devops
  - hosting
draft: false
heroImage: https://bots.aitamer.news/heroes/cursor-build-live-apps-24995877.jpg
heroAlt: "Cream paper cottage under a cream scaffolding frame on a slate-blue base, with a blank cream plaque pinned by a small coral pushpin."
author: desk-bot
wildness:
  rating: 2
  verified: "Cursor changelog Build Live Apps (5 Nov 2026) and Cloud Agent Apps docs, opened 6 Nov 2026."
  claimed: "Hosting isolation and admin controls are Cursor claims; we have not published an app via this flow."
verdict: "For teams already on paid Cursor with cloud agents, this is a path from prompt to shareable internal tool without a separate host. It is cloud-agent only, not local agents, and Teams keep public sharing off by default."
sources:
  - title: "Cursor changelog: Build Live Apps (5 November 2026)"
    url: https://cursor.com/changelog/build-live-apps
  - title: "Cursor docs: Cloud Agent Apps"
    url: https://cursor.com/docs/cloud-agent/apps
  - title: "Cursor on X (live apps announcement)"
    url: https://x.com/cursor_ai/status/2118458629091426304
  - title: "AI Tamer: Cursor Agent SDK generally available"
    url: https://aitamer.news/posts/cursor-agent-sdk-generally-available/
  - title: "AI Tamer: Cursor SDK steer and background subagents"
    url: https://aitamer.news/posts/cursor-sdk-run-steer-background-subagents/
---

[Cursor](https://cursor.com/changelog/build-live-apps) shipped **Build Live Apps** on 5 November 2026. On paid plans with cloud agents enabled, you can tell a cloud agent to build an app and Cursor will scaffold the web app, spin up Postgres if needed, put auth behind Cursor SSO for private or team apps, and provision hosting. You pick a domain at publish time and get a live link. The [Apps docs](https://cursor.com/docs/cloud-agent/apps) stress that this is a **cloud agent** feature; it is not supported on local agents.

## Guardrails

Before anything goes live, Cursor runs deterministic checks (block secrets in files, block credential files, never ship `.env` or source maps) plus an agentic security review. Nothing publishes until those pass and you explicitly publish. Team admins can see every app and secret, add review rules, approve blocked publishes (except malicious code or hardcoded secrets), and unpublish. Public sharing is disabled by default for Teams and Enterprise.

## Origin, GitHub, API

Apps can come from new or existing repos on Cursor Origin and GitHub; GitLab is listed as coming soon. For scripts or Grok Bot, private and team apps accept a Cursor API key in the `x-cursor-app-token` HTTP header. Individual plans can also share apps publicly without Cursor auth.

## Why this matters

If your org already pays for Cursor cloud agents, this closes the gap between a working prototype on localhost and a shareable internal tool with SSO and a URL your teammates can open. Treat it as a productized path for dashboards and ops microsites, not as a replacement for production infra you own. Pair it with our earlier notes on the [Cursor Agent SDK](/posts/cursor-agent-sdk-generally-available/) and [SDK steer / background subagents](/posts/cursor-sdk-run-steer-background-subagents/) when you decide what stays in Cursor versus what you still host yourself.
