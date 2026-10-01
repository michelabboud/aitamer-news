---
title: "GitHub Copilot computer use: public preview on macOS and Windows"
description: "GitHub Changelog (Oct 1, 2026): Copilot computer use is in public preview for Copilot CLI and the Copilot app on macOS and Windows—local GUI click/type/scroll with approval; orgs can disable. Not cloud remote control."
pubDate: 2026-10-01T22:50:00Z
specimen: 138
section: tools
subsection: cli
tags:
  - github-copilot
  - copilot-cli
  - computer-use
  - public-preview
  - macos
  - windows
  - desktop
  - cli
  - agents
draft: false
heroImage: /heroes/github-copilot-computer-use-preview.jpg
heroAlt: "Paper-cut collage of a local desktop with layered abstract app windows and a coral cursor across them."
author: desk-bot
wildness:
  rating: 4
  verified: "Oct 1 Changelog: public preview; Copilot CLI + app; macOS/Windows; approval before control; /computer on|show|off"
  claimed: "Org disable + macOS Accessibility/Screen Recording as GitHub states; preview policies may change"
verdict: "Local Copilot desktop computer use in public preview on Mac/Windows—approval-gated GUI control, not a cloud remote-control product."
sources:
  - title: "GitHub Copilot can now interact with desktop apps with computer use — GitHub Changelog"
    url: https://github.blog/changelog/2026-10-01-github-copilot-can-now-interact-with-desktop-apps/
---

GitHub’s Changelog for **October 1, 2026** says **computer use** is available in **public preview** in **GitHub Copilot CLI** and the **GitHub Copilot app** on **macOS and Windows** ([Changelog](https://github.blog/changelog/2026-10-01-github-copilot-can-now-interact-with-desktop-apps/)).

That means Copilot can act on **local desktop apps** on your machine—not a phone-to-cloud remote computer session. Preview status can change; treat this as early access, not a finished generally available product.

## What Copilot can do (as GitHub lists)

On your behalf, Copilot can **read accessible app content and visual context**, **click** controls, **enter and edit text**, **press keys**, **scroll**, **drag**, and **move across multi-app workflows**—including **legacy and GUI-only** software that has no API, CLI, or MCP ([Changelog](https://github.blog/changelog/2026-10-01-github-copilot-can-now-interact-with-desktop-apps/)).

GitHub names **macOS and Windows** only. Do not assume Linux support from this announce.

## You stay in control

Copilot **asks for approval before controlling an app**, and you can **review or reset** apps you marked **always allow**. On macOS, computer use **guides** you through required **Accessibility** and **Screen Recording** permissions. **Organization-managed settings can disable** the feature—this write-up does not invent whether orgs start on or off ([Changelog](https://github.blog/changelog/2026-10-01-github-copilot-can-now-interact-with-desktop-apps/)).

## How to turn it on

- **Copilot CLI:** `/computer on` to enable, `/computer show` for status, `/computer off` to disable.
- **Copilot app:** Settings → **Computer Use** → turn on **Enable Computer Use** (the app also accepts `/computer on`).

## Not remote cloud control

This is **local** Copilot CLI / Copilot app control of apps on your Mac or Windows desktop. It is **not** a Manus-style remote or cloud computer you drive from another device.

The Changelog includes a marketing demo of an expense-report flow in Safari—treat that as an illustrative clip, not a verified capability matrix for Safari or expense software.

## Who should care

Developers on **macOS or Windows** who want Copilot to drive GUI-only or multi-app desktop workflows should start at the [Oct 1 Changelog](https://github.blog/changelog/2026-10-01-github-copilot-can-now-interact-with-desktop-apps/)—keep **public preview**, check org policy, and use approval / always-allow review before handing Copilot the mouse.
