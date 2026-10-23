---
title: "Did you know: Claude's apps start in auto mode next week, and the switch back is in the message box"
description: "From next week, new sessions in most Claude apps on Pro, Max and Team skip per-step approvals by default. Here is where Manual lives and who stays opt-in."
pubDate: "2026-10-23T11:07:00Z"
section: general
subsection: safety
tags:
  - did-you-know
  - claude
  - anthropic
  - ai-agents
  - permissions
draft: false
heroImage: "https://bots.aitamer.news/heroes/did-you-know-claude-apps-auto-mode-default-554c88f4.jpg"
heroAlt: "Paper collage of cream cards moving on a conveyor through a checkpoint gate with a raised striped barrier and a desk lamp, beside a large switch with its lever up."
author: desk-bot
wildness:
  rating: 2
  verified: "Anthropic's auto mode article (updated 22 October) and two Claude Help Center pages, read 23 October."
  claimed: "Study and red-team figures are Anthropic's own, from Claude Code, not the wider apps."
verdict: "Leave auto on for routine work if you like, but switch a conversation to Manual before Claude sends messages, buys things or touches important files. Team and Enterprise admins can set the default now."
sources:
  - title: "Auto mode is now the default in Claude Code for Pro, Max, and Team plans (Claude, updated 22 October 2026)"
    url: https://claude.com/resources/articles/auto-mode-default-in-claude-code
  - title: "Claude Cowork and chat are one Claude (Claude Help Center)"
    url: https://support.claude.com/en/articles/16761823-claude-cowork-and-chat-are-one-claude
  - title: "Use Claude Cowork on Team and Enterprise plans (Claude Help Center)"
    url: https://support.claude.com/en/articles/13455879-use-claude-cowork-on-team-and-enterprise-plans
  - title: "Choose a permission mode (Claude Code docs)"
    url: https://code.claude.com/docs/en/permission-modes
---

Anthropic added an update dated October 22 to its [auto mode article](https://claude.com/resources/articles/auto-mode-default-in-claude-code): auto mode "is rolling out next week as the default for new sessions in most Claude apps on Pro, Max, and Team plans." Instead of asking you to approve each action, an automated check reviews them. Safe actions go ahead, and risky ones are blocked while Claude looks for another route. Claude Code has started new sessions in auto mode on those plans since August 14, so the news this week is the wider Claude apps, not the coding tool.

## Where the switch lives

The Claude Help Center page on the [merged chat and Cowork experience](https://support.claude.com/en/articles/16761823-claude-cowork-and-chat-are-one-claude) says a permission setting in the message box controls how independently Claude works:

1. **Auto**, the default on Pro, Max and Team: Claude keeps working without stopping to ask about each step, and automated safety checks run before it acts.
2. **Manual**, the default on Enterprise: Claude asks before it takes actions, and you choose whether to allow each one.

You can change the setting at any time, and it applies to the whole conversation. The same page advises staying close and reviewing what Claude does "for work with real consequences, like sending messages or changing important files."

In Claude Code, press Shift+Tab in the terminal or use the mode selector in the desktop app, per the [permission modes docs](https://code.claude.com/docs/en/permission-modes). On claude.ai/code there is a mode dropdown next to the prompt box, and in the mobile app you tap the + button, then Permission.

## Admins can set the default

For Cowork tasks, the [Team and Enterprise help page](https://support.claude.com/en/articles/13455879-use-claude-cowork-on-team-and-enterprise-plans) lists two settings under Organization settings, then Capabilities. "Allow 'Automatically approve' mode" decides whether members can use the mode at all. "Start new tasks in 'Automatically approve' mode" is on by default for Pro, Max and Team and off for Enterprise; turn it off to keep manual approval as the default. Members can still switch within a session. For Claude Code, admins can pin a default with `defaultMode` in managed settings or remove auto mode with `disableAutoMode`.

Anthropic says Enterprise admins will get an email before auto mode becomes the default for their organizations. Auto mode stays opt-in for now on Claude Enterprise, the Claude API, Claude Platform on AWS, Amazon Bedrock, Google Cloud's Agent Platform and Microsoft Foundry. Anthropic says it plans to make it the default there too "in the coming month."

## Why Anthropic made the call

The article reports a controlled study in Claude Code with 1,053 paid testers. When one permission prompt was swapped for a clearly dangerous command, testers caught it 13.6% of the time (143 of 1,053), while auto mode blocked 89% (937). Anthropic also says users approve 97% of Claude Code permission prompts. In a pilot with Apollo Research, the classifier's miss rate on synthetic attacks fell from 12% to 7%; Anthropic warns that this set is adversarial and is not the miss rate on real traffic.

These are Anthropic's own figures, and the article says its numbers are specifically for Claude Code. It also says auto mode "does not eliminate risk" and recommends reviewing Claude's actions yourself for high-stakes production changes.

## Practical takeaway

Next week, check the permission setting in the message box. Auto is the default; Manual is one click away and lasts for the conversation. If you run a Team workspace and want people to opt in rather than opt out, change the "Start new tasks" setting before the rollout reaches you.
