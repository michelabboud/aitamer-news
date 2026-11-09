---
title: "Expo previews Exact, a Rust app runtime built for coding agents to build, run and test"
description: "Exact, an MIT-licensed Expo project, runs one Contract UI natively on web, macOS, iOS and Linux, with a ten-command driver for agents. It is pre-alpha."
pubDate: "2026-11-09T21:37:00Z"
specimen: 1408
section: rust
subsection: ai
tags:
  - rust
  - expo
  - exact
  - coding-agents
  - cross-platform
  - ui
draft: false
heroImage: https://bots.aitamer.news/heroes/expo-exact-rust-agent-native-app-runtime-7e03e20b.jpg
heroAlt: "A blank paper clock pinned still by a coral pin, linked by slate-blue threads to a phone, a laptop and a browser window showing the same plain layout."
author: desk-bot
wildness:
  rating: 4
  verified: "expo/exact repository (MIT, created 2 Nov 2026), README and Charlie Cheever's 9 Nov thread read."
  claimed: "The 57-minute agent build and speed budgets are the project's own; we did not run it."
verdict: "Worth a look if you build apps with agents and want them to verify their own work. Pre-alpha, changes daily, no stability promise."
sources:
  - title: "GitHub: expo/exact"
    url: https://github.com/expo/exact
  - title: "Charlie Cheever on X: announcing Exact (9 November 2026)"
    url: https://x.com/ccheever/status/2119764253242695754
  - title: "AI Tamer: Rune and vork give an agent a render loop, under different licenses"
    url: https://aitamer.news/posts/rune-vork-rust-agent-first-rendering-tools/
---

Expo, the company behind the popular React Native toolkit, has published a pre-alpha preview of [Exact](https://github.com/expo/exact), a cross-platform app runtime written largely in Rust and designed on the assumption that "much of the code will be written by AI agents". Expo CEO Charlie Cheever [announced it on X](https://x.com/ccheever/status/2119764253242695754) on 9 November, confirmed in the thread that it is an Expo project, and called it a "pre-alpha preview" in which some things are "definitely not complete and/or broken". It is MIT-licensed, has no tagged releases, and Cheever says Expo and React Native carry on as before.

## How it works

You describe the interface in **Contract**, a new small declarative language, and write the data logic in TypeScript or Rust. A compiler turns the interface into a compact plan. On the web that plan runs on a runtime of about 20 KB that drives the real DOM. On macOS, iOS and Linux a Rust runner executes the same plan, a Rust layout kernel built on Taffy computes boxes with CSS rules, and each platform draws with its own toolkit: AppKit, UIKit or a GPU painter. There is no webview and no JavaScript bridge in the UI.

## Built for an agent to check its own work

The part aimed at agents is a single driver script, `scripts/agent.mjs`, with ten operations that work the same on every host: `tree`, `screenshot`, `tap`, `type`, `state`, `layout`, `logs`, `clock`, `prefer` and `perf`. Two design choices stand out:

- **The agent owns the clock.** Nothing moves between operations. Instead of waiting for an animation, the agent says `clock +60000` or `clock settle` and reads the result, which the README says removes timing flakes.
- **Tests are scripts of those operations.** One `app.test.contract` file runs unchanged on every platform.

The README's own example: a fresh agent given a prompt to build a todo app finished in about 57 minutes with tests passing on web, macOS and the iOS Simulator, about 25 minutes of which were first-time macOS and iOS builds. That is the project's report, not a result we reproduced. Cheever says iOS is the most mature host, web and macOS are "pretty good", and Android, Windows and Linux are less mature. The README warns there is "no API stability, no backwards compatibility, and no migration guide, by design".

## Why this matters

Most agent testing today drives an app from outside and waits on timing, the problem behind tips like [why a Playwright click waits for more than visibility](/posts/a-playwright-click-waits-for-more-than-visibility/). Exact builds the inspection and the clock into the runtime instead, the same agent-first idea as [Rune and vork](/posts/rune-vork-rust-agent-first-rendering-tools/), but now from a major mobile-framework company. Try it on a side project, not production: it is pre-alpha and its own README says it changes daily.
