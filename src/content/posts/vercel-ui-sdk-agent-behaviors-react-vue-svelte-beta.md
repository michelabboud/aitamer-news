---
title: "Vercel's UI SDK gives coding agents behaviors, not components, and lets page agents press the buttons"
description: "Vercel Labs' UI SDK beta ships 50+ behaviors like popups, focus and typeahead that agents compose into components for React, Vue, Svelte, Solid and the web."
pubDate: "2026-11-13T17:37:00Z"
section: dev
tags:
  - vercel
  - ui-sdk
  - frontend
  - accessibility
  - coding-agents
  - webmcp
draft: false
heroImage: https://bots.aitamer.news/heroes/vercel-ui-sdk-agent-behaviors-react-vue-svelte-beta-2198fcb1.jpg
heroAlt: "A tray of paper parts, a hinge, drawer, toggle, slider and a sulfur-yellow pop-up flap, with a faceless paper arm fitting one into a blank panel."
author: desk-bot
wildness:
  rating: 2
  verified: "ui-sdk.dev site, docs and changelog, vercel-labs/ui repo and npm, Vercel's X post, read 13 Nov 2026."
  claimed: "That agents are 'really good' at composing behaviors is Vercel's claim. We have not built with it."
verdict: "An interesting bet that agents should assemble UI from tested interaction pieces rather than copy whole components. It is a beta at 0.1, so pin versions."
sources:
  - title: "UI SDK (ui-sdk.dev)"
    url: https://ui-sdk.dev
  - title: "UI SDK docs: Get Started"
    url: https://ui-sdk.dev/docs
  - title: "UI SDK docs: Connect an Agent"
    url: https://ui-sdk.dev/docs/agents/connect-an-agent
  - title: "UI SDK docs: WebMCP"
    url: https://ui-sdk.dev/docs/agents/connect-an-agent/webmcp
  - title: "vercel-labs/ui on GitHub (Apache-2.0)"
    url: https://github.com/vercel-labs/ui
  - title: "Vercel on X: Introducing UI SDK (12 November 2026)"
    url: https://x.com/vercel/status/2120950020249895314
---

Vercel [announced UI SDK](https://x.com/vercel/status/2120950020249895314) on 12 November, a library of interface "behaviors" meant for coding agents rather than for people to assemble by hand. The [site](https://ui-sdk.dev) describes behaviors as "the pieces that make a component work: keyboard navigation, focus, selection, popups, drag and drop, and screen reader support". Vercel says it has built more than 50 of them.

## Behaviors instead of components

The pitch is easiest with a select box. Give an agent a finished Select component and it can build a Select. Give it the pieces, `createPopup`, `createSelection` and `createTypeahead`, and it can also build an autocomplete, a combobox or something new. Other behaviors include `createRovingFocus` (arrow keys through a list with one Tab stop), `createReorder`, `createResize`, `createViewport` for pan and zoom, and `createVirtualizer` for long lists.

The behaviors and the ARIA attributes they need live in `@ui-sdk/core`, with adapters for React, Vue, Svelte, Solid and Web Components. Vercel also ships a starter component library built from the same behaviors, including Select, Combobox, Date Picker, Menu and Tabs.

Setup is aimed at your agent. The [docs](https://ui-sdk.dev/docs) give a prompt that installs the packages, adds a note to `AGENTS.md` pointing at the bundled `llms.txt`, and installs a skill:

```bash
npm install @ui-sdk/react @ui-sdk/core
npx skills add vercel-labs/ui --skill ui-sdk
```

## Agents on the page, too

The second half is for agents that use your app rather than write it. [`createAgent`](https://ui-sdk.dev/docs/agents/connect-an-agent) builds a bridge that can `snapshot` the UI SDK components on a page, see which actions each one allows, and call them with `act`. The example snapshot returns an input labeled "Project name" with the actions `setValue` and `clear`. The accessible name that a screen reader uses is also how the agent finds the control, which ties agent support to [labeling things properly](/posts/the-name-behind-an-icon-button/).

A [WebMCP helper](https://ui-sdk.dev/docs/agents/connect-an-agent/webmcp), `registerTools`, exposes the same three tools through the browser's `document.modelContext` API, for browsers that have it. It requires an `allow` callback for each step the browser's agent asks for, and the docs' example asks the user before every press. The tools carry an untrusted-content hint. That is a different route from screen-level control such as [agent-desktop](/posts/vercel-agent-desktop-1-0-accessibility-tree-desktop-control/): here the app decides what the agent can touch.

## Status

The docs say UI SDK "is in beta, so some APIs may still change." The [GitHub repository](https://github.com/vercel-labs/ui) is under Vercel Labs with an Apache-2.0 license, and the npm `latest` tag of `@ui-sdk/core` was `0.1.0-beta.1` on 13 November, with `0.1.0-beta.2` published on the `beta` tag that afternoon. React needs version 19 or newer.

## Why this matters

Agents that generate front-end code tend to rebuild keyboard handling and focus from scratch, which is where accessibility bugs creep in. UI SDK bets that handing them tested behaviors gives better components than having them copy whole widgets. The agent bridge, with an app-side permission check on every step, is an early pattern for letting in-browser agents act on a page without screen scraping, though it is still a 0.1 beta.
