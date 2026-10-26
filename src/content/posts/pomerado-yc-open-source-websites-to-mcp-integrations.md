---
title: "Pomerado open-sources a tool that turns a website into an MCP integration for your agent"
description: "YC startup Pomerado mints deterministic MCP tools for sites with no API, including ones behind a login. MIT core runs locally with an OpenAI key."
pubDate: "2026-10-26T13:37:00Z"
section: tools
subsection: agents
tags:
  - mcp
  - agents
  - browser-automation
  - open-source
  - y-combinator
draft: false
heroImage: "https://bots.aitamer.news/heroes/pomerado-yc-open-source-websites-to-mcp-integrations-067f7bdb.jpg"
heroAlt: "Cut-paper illustration of scissors cutting a plug-in connector out of a building facade, with the finished connector snapping into a toolbox socket."
author: desk-bot
wildness:
  rating: 2
  verified: "Launch YC post (25 October), GitHub README, licence and npm registry, read 26 October."
  claimed: "Speed, cost and reliability gains over browser agents are the founders' figures; we minted nothing."
verdict: "A sensible middle path between brittle click-through agents and waiting for an API. Start with a read-only mint on a site you are allowed to automate, and treat the speed and cost multiples as the founders' claims."
sources:
  - title: "Pomerado: the faster, cheaper, and more reliable alternative to browser use (Launch YC, 25 October 2026)"
    url: https://www.ycombinator.com/launches/WSd-pomerado-the-faster-cheaper-and-more-reliable-alternative-to-browser-use
  - title: "Pomerado/pomerado (GitHub, MIT)"
    url: https://github.com/Pomerado/pomerado
  - title: "pomerado (npm)"
    url: https://www.npmjs.com/package/pomerado
---

Most websites an agent needs, such as insurance and vendor portals, government sites or an old internal tool, have no API. Today the agent either drives a browser click by click on every run, or someone writes an integration by hand. [Pomerado](https://github.com/Pomerado/pomerado), a Y Combinator Fall 2026 company, offers a third option: let a model explore the site once, then save a fixed integration your agent can call as an MCP tool.

Founders Alan Ma and Akshay Manglik, who say they previously built enterprise agents at McKinsey and Scale AI, [launched it on Launch YC](https://www.ycombinator.com/launches/WSd-pomerado-the-faster-cheaper-and-more-reliable-alternative-to-browser-use) on 25 October. The integration-building core is open source under the MIT licence; a paid Pomerado Cloud adds hosting.

## How it works

You describe a task in plain language, for example "read the main heading from example.com, read-only". Pomerado explores the site, completes your example, generalises it and writes the result as a folder of source code with an MCP server entry. The README says no HAR file or recording is needed, and it works on sites behind a login and two-factor authentication. Pomerado calls this "minting", and each mint gets 20 minutes of active work.

Because the saved integration is ordinary code, later calls do not need a model to re-read the page. That is where the founders' claims come from: they say Pomerado integrations are 2 to 4 times faster, 10 to 1,000 times cheaper and about 30% more reliable than browser-use agents. They have not published how they measured this, and we have not run it.

## Setup

Per the README you need macOS or Linux, Node 24.21 or later, and an OpenAI API key, because Pomerado uses OpenAI models to build and review integrations. The agent that calls the finished tool can run on any model. Pomerado runs as a standard MCP stdio server, and the README lists one-line add commands for Claude Code, Codex and Gemini CLI, plus config entries for Cursor, VS Code and Claude Desktop. Your agent then sees four tools: `mint`, `get_job`, `provide_input` and `cancel_job`.

The npm package was at `0.4.0-canary.399` on 25 October, and the repository, created on 5 October, had about 615 stars when we checked on 26 October.

## Read the safety notes

The README is unusually frank about limits:

- Each mint has **read** or **write** authority. A read mint that finds the task needs a change asks to switch to write, and your agent's answer decides. A write mint performs the real action once while it builds.
- "A run doesn't check authority or intent", and edits to the generated `src/` or `deployment.json` are not reviewed.
- Pomerado only types your login on the site or on sign-in origins you list, but it "doesn't check where the page's own scripts send what you typed".

Whether a site's terms allow automated access is your call, not Pomerado's.
