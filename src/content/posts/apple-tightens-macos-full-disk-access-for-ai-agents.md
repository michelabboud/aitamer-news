---
title: Apple plans new consent controls for macOS Full Disk Access
description: Apple says it will add controls so users can grant Full Disk Access only with very explicit action. The post names no macOS version and no date. Here is what developers who ship agents on Mac should check.
pubDate: "2026-10-04T11:30:00Z"
specimen: 219
section: dev
tags:
  - apple
  - macos
  - full-disk-access
  - privacy
  - coding-agents
  - security
draft: false
heroImage: https://media.aitamer.news/heroes/apple-tightens-macos-full-disk-access-for-ai-agents-6c087069.jpg
heroAlt: A quiet paper cut collage of a cream door secured by a coral latch, with a blue key waiting outside.
author: quill
wildness:
  rating: 3
  verified: Apple's own developer post confirms the plan and its reasons
  claimed: How the controls work, which macOS version and when are not stated
verdict: If your coding agent, terminal or IDE helper asks for Full Disk Access on Mac, audit that request now. Apple has given no version or date, so expect a change and watch its developer news.
sources:
  - title: Updates to Full Disk Access in macOS - Apple Developer News
    url: https://developer.apple.com/news/?id=p6zjojqw
  - title: Change Privacy & Security settings on Mac - Apple Support
    url: https://support.apple.com/guide/mac-help/control-access-to-your-mac-mchl211c911f/mac
  - title: Control access to files and folders on Mac - Apple Support
    url: https://support.apple.com/guide/mac-help/control-access-to-files-and-folders-on-mac-mchld5a35146/mac
---

Apple says it will add controls around Full Disk Access on macOS, and it names AI agents as a growing risk. The announcement is a post on Apple's developer news site dated 2 October 2026 ([Apple](https://developer.apple.com/news/?id=p6zjojqw)).

## What Apple says

Apple says Full Disk Access largely sidesteps the controls that protect private data, so that backup apps can work on the Mac. It says some developers use it in ways that could put users at risk. Apple says this can expose files, mail, messages and browsing history without users' full knowledge and understanding. For communication apps, Apple says it can also compromise the privacy of the people users talk to.

Apple says it will introduce additional controls so that users who want to grant this access can only do so with "very explicit user action". It also says that as AI agents become more capable and autonomous, the risks of this access will grow substantially.

## What Apple has not specified

Apple gives no macOS version or rollout date. Its post does not describe how the new controls will work or say whether existing Full Disk Access grants will be affected. Those implementation details remain open.

## What to check now

Apple's user guide says Full Disk Access lets apps reach all files on your computer, including data from Mail, Messages, Safari and Home, Time Machine backups, and certain administrative settings ([Apple Support](https://support.apple.com/guide/mac-help/control-access-to-your-mac-mchl211c911f/mac)). You find it in System Settings under Privacy & Security.

If you ship or run coding agents, terminals or IDE helpers on a Mac:

1. Open Full Disk Access and list every app that has it. Remove the ones that no longer need it.
2. Check whether your own tool asks for it. If it does, write down which feature needs it.
3. Try the narrower Files & Folders setting, which controls access to locations such as Desktop, Downloads and Documents ([Apple Support](https://support.apple.com/guide/mac-help/control-access-to-files-and-folders-on-mac-mchld5a35146/mac)). See whether your tool works with that alone.
4. Tell your users in your docs why you ask for the access and what you read with it.

These steps are our suggestions. Apple has not issued them. Watch [Apple Developer News](https://developer.apple.com/news/?id=p6zjojqw) for the version and the date.
