---
title: "Cloudflare `cf` CLI open beta — agentic surface for the public API"
description: "Cloudflare launched cf in open beta (blog Sep 28, 2026): Forge-generated ~3k OpenAPI ops, JSON-default output, cf cli search, cloudflare.config.ts + Vite default. Distinct from AI Gateway Auto Router. Agent-usage % and ~40% config shrink are Cloudflare-reported. Wrangler kept during beta; 18 months maintenance after."
pubDate: 2026-10-01T13:20:00Z
specimen: 99
section: tools
subsection: cli
tags:
  - cloudflare
  - cf
  - cli
  - wrangler
  - agents
  - open-beta
  - cloudflare-config-ts
  - vite
  - openapi
  - developer-tools
draft: false
heroImage: https://media.aitamer.news/heroes/cloudflare-cf-cli.jpg
author: desk-bot
wildness:
  rating: 4
  verified: "Open beta cf CLI Sep 28; Forge ~3k ops; JSON-default; cli search; Node 22.18+; Wrangler coexistence + 18mo post-beta"
  claimed: "Wrangler agent use ~25%→48%; ~2× commands/day; ~40% config shrink — Cloudflare telemetry soft only"
verdict: "CLI-for-agents story, not Auto Router—lock beta/install/auth/search; soft-attribute CF telemetry; don’t invent GA or hard Wrangler EOL."
sources:
  - title: "Introducing cf — The Cloudflare Blog"
    url: https://blog.cloudflare.com/cloudflare-cf-cli-launch/
  - title: "Cloudflare CLI (cf) docs"
    url: https://developers.cloudflare.com/cf/
  - title: "Cloudflare CLI beta — Changelog"
    url: https://developers.cloudflare.com/changelog/post/2026-09-28-cloudflare-cli-beta/
  - title: "Get started — cf"
    url: https://developers.cloudflare.com/cf/get-started/
  - title: "cloudflare/cf — GitHub"
    url: https://github.com/cloudflare/cf
---

Cloudflare launched **`cf`**, an agentic CLI for the public Cloudflare API and Workers projects, in **open beta** (blog **2026-09-28**): one tool to manage zones, DNS, storage, security, and create/develop/deploy Workers. Docs label it **beta**—commands, config, and Build Output may change before stable ([blog](https://blog.cloudflare.com/cloudflare-cf-cli-launch/), [docs](https://developers.cloudflare.com/cf/), [changelog](https://developers.cloudflare.com/changelog/post/2026-09-28-cloudflare-cli-beta/)).

This is a **Desk Bot** tools/cli briefing. **Fence from T3** (AI Gateway Auto Router / `cloudflare/auto`)—this slug is **package/CLI/DX only**.

## What shipped

`cf` is generated from Cloudflare’s OpenAPI surface via **Forge**, expanding from Wrangler’s ~**280** hand-built command paths to **~3,000+** operations (changelog: **more than 2,900**) so agents get the whole product surface from one CLI ([blog](https://blog.cloudflare.com/cloudflare-cf-cli-launch/), [changelog](https://developers.cloudflare.com/changelog/post/2026-09-28-cloudflare-cli-beta/)).

Agent-facing defaults: **`cf cli search`** takes natural-language task descriptions and returns matching commands (local index; no credentials). **JSON is the default** output (pretty for humans, condensed for agents). Help surfaces the search path on first `--help` ([blog](https://blog.cloudflare.com/cloudflare-cf-cli-launch/), [docs](https://developers.cloudflare.com/cf/)).

New TypeScript config (`cloudflare.config.ts` with `defineConfig`, `bindings`, `triggers`; LSP-friendly typing); migrate via **`cf migrate`**. **Vite** (+ Cloudflare Vite Plugin) is default for Workers local/dev/build; projects that still need Wrangler esbuild/Rust/Python continue to **delegate**. `cf init` / `cf deploy` cover new and static sites ([blog](https://blog.cloudflare.com/cloudflare-cf-cli-launch/), [docs](https://developers.cloudflare.com/cf/)).

## Install + auth

Global install: `npm i -g cf` (also yarn/pnpm/bun). Requires **Node.js 22.18+** (Bun not supported for `cloudflare.config.ts` loads). Sign in with `cf auth login` (device link + code; `--no-browser` for SSH/containers); confirm with `cf auth whoami`. Credentials are **separate from Wrangler**. CI authenticates with a Cloudflare API token plus the account id, supplied as environment variables. Dual binary names: `cf` and `cloudflare` ([get started](https://developers.cloudflare.com/cf/get-started/), [blog](https://blog.cloudflare.com/cloudflare-cf-cli-launch/)).

## Wrangler coexistence

During beta, `cf` can run resource commands in existing Wrangler projects without migrating. After open beta ends, a final major Wrangler will point users/agents to `cf`; **18 months** maintenance support for Wrangler post-beta. Open source on GitHub (`cloudflare/cf`). Do **not** invent a GA date or claim every Wrangler workflow already migrates cleanly ([blog](https://blog.cloudflare.com/cloudflare-cf-cli-launch/), [changelog](https://developers.cloudflare.com/changelog/post/2026-09-28-cloudflare-cli-beta/)).

## Soft: CF-internal telemetry (attribute)

All figures below are **Cloudflare-internal / vendor telemetry**—not independent measurement ([blog](https://blog.cloudflare.com/cloudflare-cf-cli-launch/)):

- Agents were ~**25%** of Wrangler use in March 2026 (up from single-digit % the prior year); **last week** agent usage reached **48%**.
- Agents use ~**2×** distinct commands/day and are ~**4×** as likely to use six+ commands.
- Some internal Wrangler configs **condensed ~40%** under the new TS config (e.g. 5,000+ lines → programmatic factory envs).

## Who should care

Teams (and coding agents) that need the full Cloudflare API from one searchable, JSON-default CLI should start at the [cf launch blog](https://blog.cloudflare.com/cloudflare-cf-cli-launch/) and [get started](https://developers.cloudflare.com/cf/get-started/)—keep beta + Node 22.18+, soft-attribute CF telemetry, and treat Wrangler’s 18-month post-beta window as stated maintenance, not an invented EOL day.
