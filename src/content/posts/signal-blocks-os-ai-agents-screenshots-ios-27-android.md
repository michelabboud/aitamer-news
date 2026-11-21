---
title: "Signal will block screenshots on iOS 27 and some Android phones to keep OS AI agents out of chats"
description: "Signal will block screenshots against Siri AI and Gemini agents on iOS 27 and some Android phones. macOS is not covered, and Signal wants an OS opt-out."
pubDate: "2026-11-21T17:07:00Z"
section: general
subsection: privacy
tags:
  - signal
  - privacy
  - ai-agents
  - apple
  - google
draft: false
heroImage: "https://bots.aitamer.news/heroes/signal-blocks-os-ai-agents-screenshots-ios-27-android-a921b7dc.jpg"
heroAlt: "Cut-paper phone with a rusty red shutter sliding over its screen as a magnifying glass on a jointed arm leans in, with an uncovered laptop in the background"
author: desk-bot
wildness:
  rating: 2
  verified: "Signal's blog post by Meredith Whittaker, dated 20 November 2026, read 21 November."
  claimed: "How the OS agents capture and store screen data is Signal's account from its own testing."
verdict: "If you build a privacy-sensitive app, check today which OS agents can read your screens. Signal found no clean opt-out on any of the big three platforms."
sources:
  - title: "Signal: Signal is Serious About Protecting Your Privacy (Meredith Whittaker, 20 November 2026)"
    url: https://signal.org/blog/protecting-your-privacy/
---

Signal [said on 20 November](https://signal.org/blog/protecting-your-privacy/) that it will restrict the AI agents built into phone operating systems from capturing Signal chats. On **iOS 27** it will block screenshots inside the app. On **Android**, where it can detect an AI assistant trying to read the screen, it will switch on its existing "Screen security" setting automatically. The post, signed by Meredith Whittaker, names Gemini Intelligence on Android and Onscreen Awareness with Siri AI on Apple devices.

## What changes for users

- **iOS 27:** screenshots are blocked in Signal by default. You can turn the protection off in Signal's settings, but Signal warns that doing so may expose your and your contacts' messages to these agents.
- **Android:** Signal says many vendor builds give it no reliable way to tell when a screenshot was attempted, so instead it watches for an AI assistant accessing the screen and then enables Screen security.
- **macOS:** not covered. Signal says it cannot reliably block screenshots on macOS because Apple offers no clearly documented API for it. Its only advice for macOS 27 users is to add Signal to the Excluded Apps list in System Settings, under Siri.

This repeats what Signal did on Windows last year, when it used screenshot blocking by default to keep Microsoft Recall from capturing messages.

## Why Signal says it has to

Signal's argument is that end-to-end encryption stops at the screen. Once an OS agent "scans" what is shown, the data sits in "whatever local database or remote server an OS-level AI agent is using at that moment", outside Signal's control, and it affects everyone in a conversation, not just the person who turned the agent on. Signal also calls its fix "incomplete": blocking screenshots does nothing about agents reading app data through the filesystem.

The post makes two asks of Apple, Google and Microsoft. First, a simple, documented way for developers to opt an app out of AI data access, covering screen reading, filesystem access, notifications and other OS frameworks. Second, real documentation of how these agents access and process data. Signal says it spent "considerable developer time" on forensic testing because that documentation does not exist, and that confidential computing does not solve the problem. It also flags third-party agents such as Meta's Muse, which it says lean on accessibility permissions "meant to empower actual people". Signal adds that it is "cautiously optimistic" because Google and Apple are talking with it.

For background on the agents in question, see our coverage of [Apple's Siri AI App Intents preview](/posts/apple-siri-ai-app-intents-developer-preview-xcode-copilot/) and of how [Android isolates some on-device AI in a protected enclave](/posts/android-on-device-ai-enclave-pkvm/). Meta's own Muse data choices came up in our piece on [Muse and friends' data consent](/posts/meta-muse-friends-data-consent/).

## Why this matters

OS-level agents read whatever is on screen, which quietly removes the privacy line that apps like Signal draw with encryption. Signal's own testing found no documented opt-out on iOS, Android or macOS, so any app handling health, finance or private messages faces the same gap. Until the platforms ship an opt-out API, check what screen protection your platform offers, decide whether to turn it on by default, and tell users what it costs them.
