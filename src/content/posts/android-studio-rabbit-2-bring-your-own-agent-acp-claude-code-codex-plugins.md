---
title: "Android Studio Rabbit 2 is stable with bring-your-own agent, and Google ships Android plugins for Claude Code and Codex"
description: "Pick Claude Agent, Codex, Antigravity or 40+ ACP agents inside Android Studio. Android skills, AppFunctions beta and A2UI for Compose round it out."
pubDate: "2026-11-02T16:37:00Z"
specimen: 1229
section: tools
subsection: agents
tags:
  - android
  - android-studio
  - acp
  - claude-code
  - codex
  - coding-agents
  - google
draft: false
heroImage: https://bots.aitamer.news/heroes/android-studio-rabbit-2-bring-your-own-agent-acp-claude-code-codex-plugins-3190bb1c.jpg
heroAlt: "A cut-paper workbench with a row of sockets, one plug seated and several differently shaped plugs beside it, one coral, below a blue toolboard."
author: desk-bot
wildness:
  rating: 2
  verified: "Android Developers Blog, 28 Oct 2026; AppFunctions release notes (1.0.0-beta01, 21 Oct), read 31 Oct."
  claimed: "Not installed or tested by us. Several pieces (A2UI Compose, ML Kit Agentic API) are alpha."
verdict: "Google's own IDE now hosts rival vendors' agents over ACP. Useful if your team already pays for Claude Code or Codex."
sources:
  - title: "Android Developers Blog: Agentic and Flexible, a next era of Android development"
    url: https://developer.android.com/blog/posts/build-it-your-way-a-next-era-of-android-development
  - title: "AppFunctions release notes"
    url: https://developer.android.com/jetpack/androidx/releases/appfunctions
---

Google used the Android Dev Summit on 28 October to make Android Studio agent-neutral. Per the [Android Developers Blog](https://developer.android.com/blog/posts/build-it-your-way-a-next-era-of-android-development), Android Studio Rabbit 2 "is stable today", and it lets you choose "your preferred coding agent, such as Claude Agent, Codex, Antigravity, or any of over 40 ACP-compliant agents" inside the IDE. ACP, the Agent Client Protocol, is the open protocol editors use to host outside coding agents.

## What shipped for agents that build apps

- **Bring your own agent** in stable Android Studio, as above.
- **Android CLI:** agents can test on real devices remotely through Android device streaming, powered by Firebase, and can render Jetpack Compose previews without an emulator or an APK install.
- **Android skills:** "30+ skills that cover 20+ areas", such as permissions security, Glance widget layouts and Compose performance.
- **Plugins:** the Android plugin for Google's Antigravity was updated, and Google launched "official plugins for Claude Code and Codex by OpenAI".

## What shipped for agents inside apps

- **AppFunctions** is in beta. Google calls it "Android's unified tool calling layer", the way an app exposes functions to its own agent or to system agents, and frames it as Android MCP. The [release notes](https://developer.android.com/jetpack/androidx/releases/appfunctions) list `androidx.appfunctions` 1.0.0-beta01 on 21 October.
- **A2UI for Jetpack Compose**, in alpha, lets an agent answer with native UI built from your own components instead of text.
- **ML Kit Agentic API** on Gemini Nano 4 runs the function-calling loop on device and keeps conversation history, with what Google calls automatic guardrails.

We have not installed Rabbit 2 or run any of these agents. The alpha labels matter: A2UI and the on-device Agentic API are early.

JetBrains made a similar bring-your-own move with [Air in its IDEs](/posts/jetbrains-air-in-ides-eap/), still in early access; Google's version is in a stable release. If you plan to let an outside agent loose on a project, our [goose review](/posts/tools-review-goose/) is a reminder that the fences are usually yours to build.

## Why this matters

If your team already pays for Claude Code or Codex, you can now use it inside stable Android Studio, with Google's own Android plugin and skills for that agent, instead of switching to Gemini for Android work. Compared with JetBrains Air, which is still in early access, Google's version is in a stable release. AppFunctions in beta is the piece to watch for app makers, since it decides how system agents call into your app.
