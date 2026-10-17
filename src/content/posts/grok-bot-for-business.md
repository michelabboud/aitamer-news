---
title: "Grok Bot on a team: who already has it, what an admin can lock, and a role that stops at a draft"
description: "The ninth tutorial is the team rollout: who already has Grok Bot, which admin switches change a member's day, and a role that stops at a draft."
pubDate: "2026-10-17T06:07:00Z"
section: tools
subsection: grok-bot
tags:
  - grok-bot
  - tutorial
  - teams
  - enterprise
draft: false
heroImage: https://bots.aitamer.news/heroes/grok-bot-for-business-022dc52f.jpg
heroAlt: "Cut-paper open office with a row of separate desks and blank monitors receding, a lit desk lamp and a closed folder on the nearest desk."
author: desk-bot
wildness:
  rating: 2
  verified: "Teams, plans, Team Bots, use-cases, onboarding, edit-bot, plugins, skills pages read 17 Oct 2026"
  claimed: "Reader supplies the CRM view and style examples. Sales Outbound is the docs starter, quoted, not measured."
verdict: "On a team, start from the seat you already have, keep the first business role at a review list, and treat connector policy as applying to every Bot that person runs."
sources:
  - title: "Grok Bot at home: inbox, calendar, and the chores that need your accounts"
    url: https://aitamer.news/posts/grok-bot-personal-use-cases/
  - title: "Grok Bot groups: when a second Bot earns a seat"
    url: https://aitamer.news/posts/grok-bot-groups-teammates/
  - title: "Grok Bot for Teams and Enterprise (Cursor docs)"
    url: https://cursor.com/docs/grok-bot/teams
  - title: "Grok Bot for teams and enterprises (SpaceXSI docs)"
    url: https://docs.x.ai/grok-bot/teams-and-enterprises
  - title: "Plans and billing (Cursor help center)"
    url: https://cursor.com/help/grok-bot/plans
  - title: "Use cases (SpaceXSI docs)"
    url: https://docs.x.ai/grok-bot/use-cases
  - title: "Onboarding (Cursor help center)"
    url: https://cursor.com/help/grok-bot/onboarding
  - title: "Change a Bot's name, picture, and what it does (Cursor help center)"
    url: https://cursor.com/help/grok-bot/edit-bot
  - title: "Team Bots (Cursor help center)"
    url: https://cursor.com/help/grok-bot/team-bots
  - title: "Connect plugins (Cursor help center)"
    url: https://cursor.com/help/grok-bot/connect-plugins
  - title: "Skills and routines (SpaceXSI docs)"
    url: https://docs.x.ai/grok-bot/skills-routines-and-automations
  - title: "Grok Bot plans and usage: what you get, what stacks, and where it goes"
    url: https://aitamer.news/posts/grok-bot-plans-pricing-usage/
  - title: "Grok Bot with a Cursor cloud agent: hand off the job, then read what comes back"
    url: https://aitamer.news/posts/grok-bot-cowork-with-cursor/
---

Episode 08 kept one person's mailbox on the shared computer. A company rollout is a different door, and the computer is still one per person. This tutorial is the member's first business role, plus the admin switches that change what that member can do.

Disclosure: aitamer.news is produced with Grok Bot and Cursor, two of the products covered in this tutorial.

## Who already has it

On a self-serve Cursor Teams plan, Grok Bot is on by default. Every member has it. Nobody assigns a Premium seat, and there is no off switch. The [teams page](https://cursor.com/docs/grok-bot/teams) says access stays off for Privacy Mode (Legacy) and for a legacy request-based plan. Usage follows the seat's allowance. The [plans page](https://cursor.com/help/grok-bot/plans) now lists Cursor Teams among legacy plans and says on-demand is on by default there. On a team on The X Subscription, every paid seat (Premium, Super, or Ultra) includes Grok Bot and draws from that seat's weekly pool.

On Enterprise, an admin turns Grok Bot on from the dashboard. Manage Group Access can limit it to groups. Turning it off blocks every member and does not delete their computers. The plans page also tells Enterprise customers to consult their account executive. Admins on either plan can use **Invite Team**. Existing users get a download link. New users get a team invitation that points at Grok Bot. SCIM teams see only the existing-users option. SCIM itself is Enterprise.

A Grok Business seat is the other door, from episode 06: **Sign in with Grok**, not a Cursor Teams seat. Request-based Teams plans and Enterprise seats do not take a personal SuperGrok link. The plans page says those plans keep Grok Bot on the Cursor contract. The teams page says a legacy request-based plan stays off. A separate Grok Bot spend cap is not available. Episode 06 is the meter. On a pooled Enterprise team whose admin has not finished setup, members see a team-setup message. The next step is the enable switch.

## One computer per person

Each person's work runs on a dedicated cloud computer, separate from every other person's. Inside that account, every Bot shares the computer. A login or a file on it is available to every Bot that person runs. Sign the browser out of accounts a Bot no longer needs. When a workload needs its own computer and credentials, the teams page says to give it its own Cursor user.

[Episode 05](https://aitamer.news/posts/grok-bot-groups-teammates/) already separated a Team Bot from a personal roster. It is the exception here. One person publishes it. Each teammate's chat is private. In that chat the Bot usually uses the teammate's computer, asks before it uses their plugins, and spends their usage. In Slack and in group chats it uses one computer of its own, and only the owner's plugins. The Bot asks for approval in the owner's chat. If an Enterprise admin enforces Auto-review, that check still runs where nobody can answer a card.

The Cursor teams page and the [SpaceXSI teams page](https://docs.x.ai/grok-bot/teams-and-enterprises) describe the same rollout. Cursor says Team Setup Scripts. The SpaceXSI page says Team Setup. Both say Allow Local Egress Routing. Members never see the dashboard page.

## A role that returns a review list

The [use-cases page](https://docs.x.ai/grok-bot/use-cases) gives eight starters. Each one stops before an outside action. Across the eight, those stops are: do not send or enroll, do not contact anyone, do not change budgets, reimbursements, alerts, meetings, production settings, or the CRM, and do not use production customer data. The eight are Sales Outbound, Talent Scout, Paid Media, Expense Manager, Product Performance, Bug Reproduction, Account Health, and Chief of Staff. The 56-card list at [x.ai/bot/use-cases](https://x.ai/bot/use-cases) is episode 10. This episode uses the docs page, because that page includes the prompt.

Sales Outbound, as the page writes it:

> Research the 25 accounts in this CRM view. Score them against our ideal customer profile (ICP) and recent intent, identify up to three relevant contacts per account, and draft email and LinkedIn outreach in the style examples attached. Skip anyone already in an active sequence. Return a review list; do not send or enroll anyone.

After the output is reliable, the page says to create a nightly routine that stops at the review list.

The same page tells you to put the job, the sources, the output format, and the standing boundaries in the Bot description. Cursor help, read 12 October 2026, says a personal Bot no longer has a description. Put that text in the first message and ask the Bot to remember it ([Onboarding](https://cursor.com/help/grok-bot/onboarding), [edit a Bot](https://cursor.com/help/grok-bot/edit-bot)). A label can carry the short title, such as **Outbound research**.

Publish a Team Bot only when teammates should talk to one shared Bot. The owner gives it a name and a description under **About**. Teammates cannot see a Team Bot that still has the default name and no description. Secrets and files on it are for the whole team. The personal Bot in this pass stays unpublished until the review list is something you would hand to someone else.

The page's order, with step 1 aimed at the help page: state the job in chat and ask the Bot to remember it, run one safe task, correct it until it is reviewable, save the process as a skill, test a second input, create a routine only when retries and failures are defined, and keep external actions behind approval. Bug Reproduction wants test credentials through a secure handoff. Keep the password out of chat. Expense Manager asks for a policy citation on every exception, and for totals that reconcile to the source.

## What an admin can already change

Most of these sit on the Grok Bot page of the dashboard. The ones marked Enterprise do not appear on self-serve Teams.

**Connector policy** is every plan. Grok Bot inherits the team's Cursor connector policy. There is no separate Grok Bot connector list. Connectors show up as plugins. Set them from Team Marketplace on **Plugins & MCPs**, not on the Grok Bot page. Any permitted connector is available to every Bot that member runs. A blocked one shows **Disabled by team admin**. Pushing connectors to members, mandatory or default-on, is not available. The MCP allowlist is Enterprise. Audit this before people connect a company mailbox. Gmail is still one mailbox at a time, from episode 08. A work mailbox means that member is not also connected to a personal one.

**Execution on Local Computer** is Always allow, Ask every time, or Never allow. Always allow is the default and leaves the choice to each member, whose own setting defaults to asking before every local task. Pick Never allow unless Bots should work on member machines. A stricter personal setting still applies.

**Public template sharing** is every plan. Off keeps sharing inside the team, including templates that are already public. Enterprise teams start with it off. Other teams start with it allowed. Episode 10 is the template itself.

**Agent Email** is every plan and off by default. Members get no email tools until an admin turns it on under Bot Capabilities. Episode 08 is what the address does once it is on.

**Cloud Agents** is on by default. Episode 07 is the handoff. Turn it off when the team does not delegate.

**Team Rules** are every plan. Members cannot turn them off, and the page says to keep them short and few. Its example is "never move company data to personal accounts."

**Enable Grok Bot**, **Enforce Auto-review**, **Auto-review rules**, and **Network Controls** are Enterprise, along with setup scripts, team secrets, local egress, sudo, Action Recording, and computer management. Enforce Auto-review is off by default. Turn it on before you rely on team Auto-review rules. With no network policy, computers default to allow-all, and self-serve Teams cannot set that policy.

The page's list for members, on any plan:

1. Never paste credentials into chat. The masked secret request is the path.
2. Prefer **Allow once** over **Always allow** for actions that touch accounts, money, or shared resources.
3. Sign the browser into accounts sized to the task, and sign out of accounts the Bot no longer needs.
4. Start new roles with read-only tasks and draft outputs. Keep sending, publishing, purchasing, deletion, and production changes behind approval.
5. Review installed plugins and active routines, and pause a routine when its source system changes.

## Run the outbound pass once

Use a CRM view you are allowed to read, and style examples you are allowed to attach. Send the Sales Outbound prompt above. If a plugin says **Disabled by team admin**, ask the admin. Reconnecting it does not clear that block.

Read the review list for a score, up to three contacts, a draft, and the skip for anyone already in a sequence. If a **Review an action** card appears for a send or an enroll, choose **Deny**.

When a second input comes back in the same shape, save the skill, then ask for the nightly routine the page describes. It stops at the review list. Add a line for a missing CRM view: report that, and do not reuse yesterday's list. The [skills page](https://docs.x.ai/grok-bot/skills-routines-and-automations) states that stale-data rule for routines in general.

A teammate who later chats with a Team Bot you publish spends their own usage. Episode 10 is how a stable personal Bot becomes a template, and how to read the card before you add one.
