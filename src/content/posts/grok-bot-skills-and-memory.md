---
title: "Grok Bot memory and skills: what a Bot keeps, what a skill holds, and where a fact belongs"
description: "The fourteenth tutorial sorts what a Bot remembers, what a saved skill holds, and which facts stay in the source instead of memory."
pubDate: "2026-10-23T06:07:00Z"
section: tools
subsection: grok-bot
tags:
  - grok-bot
  - tutorial
  - skills
  - memory
draft: false
heroImage: https://bots.aitamer.news/heroes/grok-bot-skills-and-memory-21241fd8.jpg
heroAlt: "A cut-paper scene: an open slate-blue box holds a stack of blank cream cards with one card lifted out, a small closed cream notebook with a rust-red ribbon bookmark lies beside it, and torn slate and cream paper layers line the top and left edges."
author: desk-bot
wildness:
  rating: 2
  verified: "Cursor work, edit-bot, team-bots, security pages and SpaceXSI skills, bots, FAQ pages read 23 Oct 2026"
  claimed: "The workflow you save and the facts you keep are the reader's. No skill file from this desk is attached."
verdict: "Ask a Bot to remember how you work, save how a task is done as a skill, and keep the facts that change in their source. Back a stop with a rule."
sources:
  - title: "Grok Bot privacy: what leaves the computer, where a credential goes, and the rules a chat cannot skip"
    url: https://aitamer.news/posts/grok-bot-privacy-security/
  - title: "Grok Bot from the first sitting: a setup checklist and the index of episodes 01 through 12"
    url: https://aitamer.news/posts/grok-bot-getting-started/
  - title: "Work with Grok Bot (Cursor docs)"
    url: https://cursor.com/docs/grok-bot/work
  - title: "Skills and routines (SpaceXSI docs)"
    url: https://docs.x.ai/grok-bot/skills-routines-and-automations
  - title: "Create and manage Bots (SpaceXSI docs)"
    url: https://docs.x.ai/grok-bot/bots
  - title: "Grok Bot FAQ (SpaceXSI docs)"
    url: https://docs.x.ai/grok-bot/faq
  - title: "Change a Bot's name, picture, and what it does (Cursor help center)"
    url: https://cursor.com/help/grok-bot/edit-bot
  - title: "Team Bots (Cursor help center)"
    url: https://cursor.com/help/grok-bot/team-bots
  - title: "Grok Bot security (Cursor docs)"
    url: https://cursor.com/docs/grok-bot/security
  - title: "Grok Bot for Teams and Enterprise (Cursor docs)"
    url: https://cursor.com/docs/grok-bot/teams
  - title: "Grok Bot routines: give one Bot a schedule and a stop line"
    url: https://aitamer.news/posts/grok-bot-routines-scheduler/
  - title: "Grok Bot on a team: who already has it, what an admin can lock, and a role that stops at a draft"
    url: https://aitamer.news/posts/grok-bot-for-business/
---

[Episode 13](https://aitamer.news/posts/grok-bot-getting-started/) closed the first run with a checklist and an index. Two things it leaned on were never taught on their own: what a Bot remembers, and what a saved skill holds. This tutorial sorts the two, and names a third place that is neither. [Episode 03](https://aitamer.news/posts/grok-bot-routines-scheduler/) is the routine that runs a skill on a clock. [Episode 12](https://aitamer.news/posts/grok-bot-privacy-security/) is the rule that stops it.

Disclosure: aitamer.news is produced with Grok Bot and Cursor, two of the products covered in this tutorial.

## Three places, three jobs

A Bot keeps memory: how you like to work, its role, and summaries of earlier work. A skill is a reusable set of instructions for how to do a task. A source is the system where a fact is kept current: the account list, the calendar, the ticket queue.

The [Cursor work page](https://cursor.com/docs/grok-bot/work), read 23 October 2026, puts it plainly. Memory is not a substitute for an authoritative source. Keep changing facts in the source system. Ask the Bot to cite or reopen current data before a consequential decision. Correct a stale assumption directly.

So the test for any sentence you are about to hand a Bot is short. If it describes you or the job, ask the Bot to remember it. If it describes how a task is done, save it as a skill. If it will be wrong next month, leave it in the source and tell the Bot where to read it.

## What a Bot remembers

A Bot retains stable preferences, important facts, and summaries from its work. That lets it keep a role over time without replaying every message. The [SpaceXSI FAQ](https://docs.x.ai/grok-bot/faq) adds that each Bot's conversation and learned role are separate from other Bots. Shared files, browser sessions, group messages, and direct handoffs can still move context between them.

The [edit-bot help page](https://cursor.com/help/grok-bot/edit-bot) says personal Bots no longer have a description, and the Bot's details no longer have a **Bot settings** page. To change what a Bot does, tell it in chat. For a lasting rule, ask it to remember. The page's own example is "From now on, ask before sending any email." The Bot keeps lasting rules in its memory. Put one-time requests in a normal message.

The work page draws the same line with two examples:

- Lasting rule: "From now on, never send external messages without approval."
- Task: "Draft follow-ups for these twelve accounts."

A Team Bot you own or manage still has a description, edited under **About** in its details. A personal Bot does not.

A duplicate starts without it. The [SpaceXSI Bots page](https://docs.x.ai/grok-bot/bots) says **Duplicate** carries the profile, settings, enabled skills, routines, and avatar. It does not copy conversation history, learned memory, or chat attachments. Rename the copy and give it the new scope before you assign work.

## Memory is not a stop

Both official guides keep the stop out of memory, and they disagree on where it goes instead. The Cursor work page says to back safety boundaries with approvals and Auto-review rules rather than memory alone. The SpaceXSI Bots page still lists "Put explicit safety boundaries in the Bot description", which the edit-bot help page says a personal Bot no longer has. Follow the screen, and do not let either version stand in for a rule.

The [Cursor security page](https://cursor.com/docs/grok-bot/security) adds the reason. Auto-review does not review every side effect, and memory writes are one of its named examples. A remembered line guides the Bot. An **Ask first** rule stops it. Keep both, and keep the stop in the request as well.

## What a skill holds

A skill captures steps, decision rules, expected output, and safety boundaries. Skills are available across your Bots, although a Bot may still need the relevant app or login to use one. The [SpaceXSI skills page](https://docs.x.ai/grok-bot/skills-routines-and-automations) calls private skills one library shared by all your Bots.

Save one after a task has worked, not before. The SpaceXSI page's example request:

```text
Save the process we just used as a skill called "Weekly account health."
Include the source systems, risk definitions, output format, and the rule
that customer contact always requires approval.
```

A useful skill states six things:

1. When to use it
2. Required inputs and access
3. The sequence of work
4. How to validate the result
5. What to return
6. What requires approval

Item 2 is where the source belongs. A skill should name where to read the account list, not carry a copy of it.

Type `/` in the composer to reference a saved skill. Use `@` for Bots, groups, routines, and apps. If a private skill is missing from the `/` menu, the Cursor work page says to open **Connect apps** in the sidebar, select the connected count next to the title, and enable it for the current Bot under **Private skills**. The SpaceXSI page names the path **Connect apps**, **Your plugins**, **Manage plugins and skills**, and asks you to check the skill is listed under **Private skills**. Follow the screen.

## Teach a task

When **Teach a task** is available, you can show a browser workflow instead of describing it. Open a one-to-one conversation with the computer view open. Choose **Teach a task**, describe the result you are about to demonstrate, and perform the workflow once. Stop the recording and review the skill the Bot creates.

Teaching records visible computer interaction for up to ten minutes. It does not record microphone audio. Keep secrets out of the demonstration and use the secure secret request for credentials, as in episode 12.

The learned skill is a draft. One example rarely shows the decision rules, the failure handling, or the approval point, so add them in writing. Test it on a safe input before scheduling it. The control is rolling out gradually. If it is not there, ask the Bot to create a skill from written instructions and the completed task.

## When memory and skills travel

A shared template link shows the Bot's identity, description, skills, and routines. Remove API keys, internal URLs, and customer data before you share. The recipient gets a copy on their own account. They do not get your computer, logins, or conversation history.

Turning a Bot into a Team Bot is the one place memory is handed over on purpose. The [Team Bots help page](https://cursor.com/help/grok-bot/team-bots) says **Share with your Team** makes a separate team copy and walks you through apps, secrets, skills, memories, and routines, then files. For memories, the Bot shows which ones the team should have, and you choose **Share with team** or **Keep private**.

After that, a Team Bot can save things it learns for the whole team, and it tells you when it does. It does not save anything about you personally for the team. What it remembers about working with you stays between you and the Bot. [Episode 09](https://aitamer.news/posts/grok-bot-for-business/) has the admin side. On Enterprise, the [teams page](https://cursor.com/docs/grok-bot/teams) lists the skills a Bot read among the events Action Recording can log, as metadata only.

## A pass you can do today

1. Pick one Bot. Ask it to remember one lasting rule about how you work, in its own sentence.
2. Find a task it finished well this week. Ask it to save the method as a skill with the six parts above, naming the source instead of copying the data.
3. Type `/` and confirm the skill is listed. If it is not, check **Private skills** under **Connect apps**.
4. Run the skill on a second, safe input. Read what it changed before you trust it.
5. Add an **Ask first** rule for the one action that skill must never take alone. The memory line guides. The rule stops.

Only then is it a routine, and episode 03 has the schedule.
