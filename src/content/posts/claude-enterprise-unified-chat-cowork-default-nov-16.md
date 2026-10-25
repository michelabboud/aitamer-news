---
title: "Claude Enterprise gets one chat-and-Cowork Claude, and it switches on by default on 16 November"
description: "Anthropic made unified chat and Cowork GA for Enterprise with an Efficient mode and spend controls. Existing orgs flip on 16 November unless admins opt out."
pubDate: "2026-10-25T09:07:00Z"
specimen: 1042
section: tools
subsection: agents
tags:
  - anthropic
  - claude
  - claude-cowork
  - enterprise
  - admin-controls
draft: false
heroImage: "https://bots.aitamer.news/heroes/claude-enterprise-unified-chat-cowork-default-nov-16-2092ee63.jpg"
heroAlt: "Two cut-paper rooms joined by an open doorway: a cream sitting room with armchairs and a slate-blue workshop with tools and a small windowed box, a blank coral leaf above."
author: desk-bot
wildness:
  rating: 1
  verified: "Anthropic's 23 October announcement and the Enterprise admin guide, read 25 October."
  claimed: "The 40% and 30% cost cuts for Opus 5.5 and Sonnet 5.5 are Anthropic's figures."
verdict: "Enterprise admins have a date to plan around. Decide before 16 November whether to enable now, pilot by role, or keep it off, and check egress, connector and retention settings first."
sources:
  - title: "Claude Cowork and chat come together for Enterprise (Anthropic, 23 October 2026)"
    url: https://claude.com/resources/articles/unified-claude-enterprise
  - title: "Set up and manage the new unified Claude experience for your Enterprise organization (Claude Help Center)"
    url: https://support.claude.com/en/articles/17444462
---

Anthropic has made its unified Claude, with chat and Cowork in one conversation, [generally available for Claude Enterprise](https://claude.com/resources/articles/unified-claude-enterprise). The announcement is dated 23 October. The same experience reached Pro and Max plans in September, the post says.

The detail admins need is in the [admin guide](https://support.claude.com/en/articles/17444462): the setting, called **Chat and Cowork unified**, is off by default in existing organizations "and turns on by default on November 16, 2026".

## How it works

Every conversation starts as a chat. When a task needs to run code or work with files, Claude continues the same conversation in a cloud sandbox that Anthropic manages, then returns the finished work. Per the guide, each conversation that needs one gets its own virtual machine, stopped after a few minutes idle with its disk saved as an encrypted snapshot, and the sandbox expires 30 days after creation. Chats, projects, connectors, skills and plugins carry over, according to the announcement.

Anthropic says network egress is off by default for Enterprise and connector credentials are kept outside the sandbox. In the guide, egress can be off, package managers only, a custom domain list, or all domains, and connector policies are enforced outside the sandbox on every connector call.

## The 16 November switch

Owners and Primary Owners see "Will be automatically enabled on November 16, 2026" under Organization settings, then Capabilities. They can pick Enable now or Keep disabled, and an explicit earlier choice stays. If Chat or "Cloud code execution and file creation" is off, nothing turns on.

Access can also be limited by role. Once the organization setting is on, everyone with the User, Admin, Owner or Primary Owner role gets it, so the guide says to move anyone who should not have it to a custom role with the capability off before enabling. Its suggested rollout is a sandbox organization or pilot role first, then two to four weeks of monitoring before expanding.

Organizations on zero data retention for Claude Code, the HIPAA-ready configuration, or customer-managed encryption keys stay on their current setup; the guide says the unified experience is not available for them yet.

## Cost controls

Pricing stays usage-based. The announcement lists four controls: a new **Efficient mode** that keeps the unified experience on Sonnet and Haiku models, per-role model entitlements, spend limits at organization, group and member level, and pooled group budgets. It also claims Opus 5.5 costs 40% less to run than Opus 5 on typical workloads, and Sonnet 5.5 up to 30% less than Sonnet 5. Those are Anthropic's numbers.

One reporting note from the guide: usage analytics split chat, Cowork and the unified experience, so totals for chat and Cowork will look like they drop as members move over unless you add the unified line back in.

## Retention gaps to check

Conversations follow your custom retention setting, and deleting one deletes the cloud sessions Claude started from it. The guide lists what custom retention does not cover: Cowork cloud sessions a member starts directly, scheduled tasks and their runs (which keep running after the conversation that created them is deleted), and Cowork history stored on a member's computer.

## Why it matters

This turns Cowork's agentic cloud work into the default Claude for large organizations, with a fixed date. Our earlier posts covered [Cowork moving to Anthropic's cloud](/posts/anthropic-claude-cowork-cloud-tasks/) for Pro and Max, and [auto mode becoming the default](/posts/did-you-know-claude-apps-auto-mode-default/) in Claude's apps.
