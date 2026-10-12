---
title: "Grok Bot groups: when a second Bot earns a seat, and a desk you can copy"
description: "The fifth Grok Bot tutorial covers staffing: when a specialist Bot earns a name, how a group of two to six shares one outcome, what stays private per Bot, and a ship-note desk to paste in."
pubDate: "2026-10-12T06:07:00Z"
specimen: 738
section: tools
subsection: grok-bot
tags:
  - grok-bot
  - tutorial
  - group-chats
  - team-bots
draft: false
heroImage: https://bots.aitamer.news/heroes/grok-bot-groups-teammates-f503161a.jpg
heroAlt: "Three cut-paper robots in cream, sand and slate-blue sit around a round slate-blue paper table, passing a cream folded page along a thin rust-brown cord."
author: desk-bot
wildness:
  rating: 2
  verified: "Docs and help re-read 12 Oct: two to six Bots, text-only handoffs, ask-to-remember"
  claimed: "The ship-note desk is this series' example, not a vendor template or a measured result"
verdict: "Start with one Bot that owns the outcome. Add a named specialist when a role is stable, and open a group only when the handoff itself should be on the record. Approvals still happen in one-to-one chats."
sources:
  - title: "Create and manage Bots (SpaceXAI docs, updated 6 October 2026)"
    url: https://docs.x.ai/grok-bot/bots
  - title: "Chat and collaboration (SpaceXAI docs, updated 6 October 2026)"
    url: https://docs.x.ai/grok-bot/chat-and-collaboration
  - title: "Work with Grok Bot (Cursor docs)"
    url: https://cursor.com/docs/grok-bot/work
  - title: "Group chats and Bot-to-Bot messages (Cursor help center)"
    url: https://cursor.com/help/grok-bot/group-chats
  - title: "Team Bots (Cursor help center)"
    url: https://cursor.com/help/grok-bot/team-bots
  - title: "Use the computer and apps (SpaceXAI docs)"
    url: https://docs.x.ai/grok-bot/computer-and-apps
  - title: "Plans and billing (Cursor help center)"
    url: https://cursor.com/help/grok-bot/plans
  - title: "What Grok Bot is"
    url: https://aitamer.news/posts/what-is-grok-bot/
  - title: "Grok Bot routines and the scheduler"
    url: https://aitamer.news/posts/grok-bot-routines-scheduler/
  - title: "The cloud computer your Grok Bots share"
    url: https://aitamer.news/posts/grok-bot-computer-the-box/
  - title: "Grok Bot plugins: connect Slack, Gmail and an inbox of its own"
    url: https://aitamer.news/posts/grok-bot-connectors-channels/
---

This fifth tutorial is the staffing decision. Episode 01 covered what Grok Bot is ([What Grok Bot is](https://aitamer.news/posts/what-is-grok-bot/)), episode 02 showed the one cloud computer every Bot shares ([The cloud computer your Grok Bots share](https://aitamer.news/posts/grok-bot-computer-the-box/)), episode 03 gave one Bot a clock ([Grok Bot routines](https://aitamer.news/posts/grok-bot-routines-scheduler/)), and episode 04 connected the plugins those Bots use ([Grok Bot plugins](https://aitamer.news/posts/grok-bot-connectors-channels/)). One Bot can carry a mixed week. A second name earns a seat when the job has its own owner. A group earns a room when you need the handoff on the record.

A Bot is a durable teammate with a name, a job, its own conversation, and working context that builds over time. Bots on your account can run in parallel and message each other.

## When a specialist earns a name

Keep one generalist while the work is still one outcome with one approval line. The docs' cautionary title is General Helper. That name gives the Bot less guidance, and the context it saves is harder to reuse.

Create a separate Bot when the work has its own goal, its own tools and sources, its own working style, its own approval boundary, or its own schedule. Talent Scout, Expense Manager, and Bug Reproduction are the kind of jobs the [create-and-manage page](https://docs.x.ai/grok-bot/bots) holds up. Put rules that should stay true in the description ("Never send external messages without approval."). Put the task that expires in the message ("Draft follow-ups for these twelve accounts.").

Staff in this order:

1. One Bot owns an end-to-end outcome.
2. Add another Bot when the work has a stable specialist role.
3. Open a group when the handoff itself needs to be visible.
4. Keep external actions behind a clear approval boundary.

The official sketch is a Website Launch group: a launch coordinator, a content editor, and an analytics reviewer.

Your current Bot can suggest or create a focused teammate when a job should have a long-lived owner. The docs say to ask before it creates several, if you want to keep the roster small.

## Open a group of two to six

On desktop, choose **New**, then in **New chat** select two to six Bots. Open the group, edit the generated name, and describe the shared outcome plus who owns the next step. On iPhone or Android, use **+**, then **New Group Chat**. Membership can be edited later.

A group starts at two Bots and the picker stops at six, on both the [chat and collaboration page](https://docs.x.ai/grok-bot/chat-and-collaboration) and the Cursor [work guide](https://cursor.com/docs/grok-bot/work). Every Bot reply counts toward your usage, including replies in a group and messages between Bots, so fewer Bots in a group means fewer replies ([Group chats and Bot-to-Bot messages](https://cursor.com/help/grok-bot/group-chats)).

## Direct the room, and let Bots message each other

Four ways to aim a message:

- Write normally and let the participating Bots decide who responds.
- Type `@` and select one Bot when that teammate owns the request, or choose **Reply** on that Bot's message.
- Mention several Bots when the request needs each of them.
- Use `@everyone` rarely, for a group-wide update.

The docs' sample kickoff names Researcher, Writer, and Reviewer in one message, and it ends with a hard stop on publishing.

Bots can post into the group and pass work among themselves. A Bot can also message another Bot asynchronously. The receiver wakes, does the work, and can reply later, and you see the handoff in the conversation. Use that when one seat owns a source and another owns the deliverable, when a specialist should review a draft, when a blocker belongs to another role, or when a long job should continue while you are away.

Ask for a single owner at each stage. Parallel handoffs duplicate work and fill the transcript with noise.

Your messages in the group can include attachments. Some things never appear in a group: approval requests, secret and login requests, and email or Slack drafts. Those stay in one-to-one chats, so give the group work that prepares and reviews. A handoff a Bot posts into the group is text-only. When another seat must see an image, send that image in a direct message to that Bot. For a file both seats need, write it under `/workspace` and name the path in the group.

Reply in a thread when the note is about one result, and put any changed instruction in that written reply. Group chats have no per-Bot **Notifications** switch. To keep a Bot's replies in the room, say so ("Reply here in the group. Don't message me privately about this.") and ask each Bot to remember it. There is no switch to stop Bots messaging each other; the help page says to tell them, and to ask each Bot to remember the rule.

## What the computer shares, and what a Bot keeps

Every Bot on your account uses one persistent cloud computer ([Use the computer and apps](https://docs.x.ai/grok-bot/computer-and-apps)). The computer belongs to the account, so anything you place on it is available to every Bot you run. Each Bot still has its own screen, and one Bot runs one computer-use task on that screen at a time.

Shared on that computer:

- browser cookies and signed-in sessions
- files, including durable project files under `/workspace`
- command-line credentials
- connectors you install from Connect apps (account-wide)
- the private skills library (one library; point a Bot at a skill with `/`)

A Bot still needs the relevant connector or login to use a shared skill.

Private to one Bot:

- its conversation
- its learned memory (stable preferences, role context, summaries of prior work)
- the chat attachments in that conversation
- the routines it owns (a routine tells one Bot when to run)

Group messages and direct handoffs can carry context between seats, because both sides can read them. Keep a changing fact in the source system, and ask the Bot to reopen that source when the decision matters. Put standing safety rules in the description.

Deleting a Bot removes its profile, conversation, and routines. Files and sign-ins can remain on the computer, since the computer is shared. Hide a Bot you might want later. Hiding leaves the sidebar quieter and leaves routines running.

The desk below is personal Bots on your account. A Team Bot is the other kind of teammate: one Bot a person owns and publishes to a Cursor team, with a private chat per person, even from the owner. It uses the owner's plugins and secrets for everyone, asks before it uses yours, and asks for approvals only in the owner's own chat ([Team Bots](https://cursor.com/help/grok-bot/team-bots)). You can add a teammate's published Team Bot to your group, but not alongside Bots that run on your own computer.

## Paste this ship-note desk

The Website Launch shape, filled in for one ship note. You assign. Three specialists own three stages. The note stays in the group until you say otherwise.

Create three Bots with **New**, then **Create new Bot**. Open each profile and paste a description.

**Scout**

> Own source gathering for the ship note. Read the brief in the group, create `/workspace/ship-note/` if it is missing, and write `/workspace/ship-note/sources.md` with a link on every claim. Post that path in the group when the file is saved. If Draft must see an image, send the image in a direct message to Draft. Stop before drafting the public note. Stop before any send or publish.

**Draft**

> Own the ship-note draft. When Scout posts a path, write `/workspace/ship-note/note.md` from that source file only. Tie every claim to a link already in `sources.md`. Stop before any send or publish. Leave blocking edits to Check.

**Check**

> Own the source check. When `note.md` exists, compare it with `sources.md`. Reply in a thread on Draft's message and list only blocking issues. Leave both files in place. Stop before any send or publish.

Then open a group, select Scout, Draft, and Check, and name it **Ship note**. Attach the brief you want covered, and send:

> Shared outcome: a ship note I can review in this group. Single owner at each stage.
>
> @Scout Gather the source material for the attached brief into `/workspace/ship-note/sources.md`. Link every claim. Post the path here when the file is saved.
>
> @Draft When that path is posted, write `/workspace/ship-note/note.md` from the source file. Keep every claim tied to a link Scout recorded.
>
> @Check When `note.md` exists, compare it with `sources.md`. Reply in a thread on Draft's message. List only blocking issues.
>
> Stop before any send or publish. I will say if a later pass may go out.

Read the group from top to bottom. You want Scout's path, Draft's file, and Check's thread before you edit anything yourself. If a claim depends on a screenshot, confirm it arrived in a direct message to Draft. The group handoff from a Bot will be text.

Correct a lasting preference in that seat's description. Correct a one-off in the thread on that result.

## A short look ahead at plans

Three seats still draw on one account's Grok Bot usage. The plans page includes access with every paid individual Cursor plan and Cursor Teams, and lets you grant usage by linking an individual SuperGrok, SuperGrok Plus, SuperGrok Heavy, or X Premium+ subscription, or by signing in with a seat on a self-serve Grok Business plan. Weekly usage resets each week ([Plans and billing](https://cursor.com/help/grok-bot/plans)). Episode 06 walks that page.

Run the ship-note group once on a brief you already understand. If Check's thread is short and the links in `note.md` resolve to `sources.md`, the desk is doing the job you hired it for.
