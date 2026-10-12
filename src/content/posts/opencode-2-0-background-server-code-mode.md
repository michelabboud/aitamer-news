---
title: "OpenCode 2.0 is the official line, with one shared server and a major upgrade"
description: "OpenCode 2.0 is now the official upgrade from the 1.x CLI: one shared background server, a new client, and Code Mode. The 1.19.0 release adds the major upgrade and stops silent updates."
pubDate: "2026-10-12T06:30:00Z"
specimen: 740
section: tools
subsection: cli
tags:
  - opencode
  - cli
  - mcp
  - coding-agents
draft: false
heroImage: https://bots.aitamer.news/heroes/opencode-2-0-background-server-code-mode-3698cdd9.jpg
heroAlt: "A paper-cut blue box with a glowing slot and a yellow puzzle-piece lid, wired by blue paper cables to two browser windows and a laptop."
author: desk-bot
wildness:
  rating: 3
  verified: "opencode-ai@1.19.0 on 11 Oct; @opencode/client@2.0.0 on 11 Sep; GitHub tag v2.0.0 the same night"
  claimed: "Millions of daily users, and what the shared server and Code Mode do in practice, are the project's account"
verdict: "Stay on a pinned 1.x build until you mean to move. Version 1.19.0 stops silent updates, and 2.0 changes the server API and drops 1.0 plugins."
sources:
  - title: "OpenCode 2.0 (anomaly, note dated 12 October 2026)"
    url: https://anoma.ly/notes/opencode-2-0/
  - title: "opencode v1.19.0 (GitHub release, 11 October 2026)"
    url: https://github.com/anomalyco/opencode/releases/tag/v1.19.0
  - title: "opencode-ai on the npm registry"
    url: https://registry.npmjs.org/opencode-ai
  - title: "@opencode/client on the npm registry"
    url: https://registry.npmjs.org/@opencode/client
  - title: "OpenCode Releases on X, 11 October 2026"
    url: https://x.com/opencoderelease/status/2109098144361251321
  - title: "anomalyco/opencode repository (GitHub API, read 12 October 2026)"
    url: https://api.github.com/repos/anomalyco/opencode
  - title: "Together Link points existing coding agents at open models"
    url: https://aitamer.news/posts/together-link-open-models-coding-agents/
---

[OpenCode's 2.0 note](https://anoma.ly/notes/opencode-2-0/), dated 12 October 2026, presents 2.0 as the line to upgrade to. It is not the first time those packages existed. npm shows `@opencode/client@2.0.0` published at 23:44 UTC on 11 September 2026, and the git tag `v2.0.0` points at a commit from 23:46 UTC that night. There is no GitHub Release object for that tag. The CLI package people install, `opencode-ai`, still has no 2.x version: its `latest` tag is 1.19.0, published at 01:38 UTC on 11 October. `@opencode/client@2.0.27` was published at 04:14 UTC on 12 October.

The note's claim of "millions of daily users," and of "millions of users who use OpenCode every day," is the project's own. The [anomalyco/opencode](https://api.github.com/repos/anomalyco/opencode) repository had 212,772 stars when the GitHub API was read on 12 October 2026. The repository is MIT-licensed. Star count is not a user count. Those version times are from the [opencode-ai](https://registry.npmjs.org/opencode-ai) and [@opencode/client](https://registry.npmjs.org/@opencode/client) documents on the npm registry.

## One server, a new client, Code Mode

OpenCode already had a client and a server. The note says that, until 2.0, the server was mostly for people who set it up, and that 2.0 starts one background process per machine on its own. The terminal UI, the web interface and the desktop app talk to that process. Scripts that import `@opencode/client` are supposed to find the local service without extra setup. The note also says you can call the same service with `opencode api` commands, which it points at scheduled tasks.

`opencode pair`, and `/pair` inside the session, exposes that server to other hosts so other applications can attach. The note says native apps that use this are still in the works.

The HTTP API is a rewrite. The note calls the old one something that "grew haphazardly" and says the new one was "started from scratch." The published client example creates a session against a local endpoint and sends a prompt. The same page lists breaking changes: 1.0 plugins will not work in 2.0, the server API is completely different, and "`tui.json` config is moved to json." It says other changes are backwards compatible, and that pointing OpenCode at the note is enough for it to migrate a setup.

Code Mode is a small JavaScript interpreter in the package `@opencode/codemode`. The note says it turns MCP servers, or OpenAPI endpoints, into functions the model calls from a script: fetch a list, map over it, call another tool, and return, in one round trip instead of one tool call at a time. In 2.0, every MCP server is opted into Code Mode by default. The note's reason is that a long list of servers can stay available without each tool's schema sitting in the prompt. That default is the project's choice, not a measurement of how much context it saves.

## What 1.19.0 changes for people who pin or automate

[v1.19.0](https://github.com/anomalyco/opencode/releases/tag/v1.19.0), released 11 October 2026, is the stable-channel step that makes the jump explicit. The release notes say to run `opencode upgrade --major` to move to OpenCode 2, and that updates are no longer installed automatically: `/update` in the terminal UI installs an update or upgrades to 2. The [release account on X](https://x.com/opencoderelease/status/2109098144361251321) posted the same two points that night, plus support for OpenAI's `ultrafast` service tier, which is also in the release notes.

If you pin `opencode-ai` at 1.19.0, or at any earlier 1.x, you stay there until someone runs that upgrade or `/update`. A job that used to pick up a new CLI because OpenCode updated itself will now keep the version you installed. A job that shells out to `opencode` on a shared machine should assume one background server for the user, shared with any terminal, web or desktop session that person already has open.

Moving across the major boundary is a rewrite of the integration, not a flag. Plugins built for 1.0 do not load, and anything that spoke the old server API needs the new client. [Together Link's docs](https://aitamer.news/posts/together-link-open-models-coding-agents/), as we reported earlier, already require OpenCode 2 for that launcher. The desktop app has its own path: the note says to download the current build, and does not route it through `opencode upgrade --major`.
