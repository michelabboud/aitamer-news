---
title: "Grok Bot at home: inbox, calendar, and the chores that need your accounts"
description: "The eighth tutorial keeps personal work on the shared computer: one mailbox, a calendar with two limits, and a morning check that does not send."
pubDate: "2026-10-16T06:07:00Z"
section: tools
subsection: grok-bot
tags:
  - grok-bot
  - tutorial
  - inbox
  - calendar
draft: false
heroImage: https://bots.aitamer.news/heroes/grok-bot-personal-use-cases-0eab2e78.jpg
heroAlt: "Cut-paper kitchen table with a closed cream envelope, a blank slate-rimmed clock face, and a small houseplant."
author: desk-bot
wildness:
  rating: 2
  verified: "Gmail, Calendar, edit-bot, agent-email, how-to, use-cases, skills, routines read 16 Oct 2026"
  claimed: "Morning Bot stop line is this series' example. Card blurbs are public cards, not measured."
verdict: "Keep home work on the shared computer, on one mailbox, and stop before any send or calendar change until a single morning check comes back clean."
sources:
  - title: "Grok Bot with a Cursor cloud agent: hand off the job, then read what comes back"
    url: https://aitamer.news/posts/grok-bot-cowork-with-cursor/
  - title: "Onboarding (Cursor help center)"
    url: https://cursor.com/help/grok-bot/onboarding
  - title: "Change a Bot's name, picture, and what it does (Cursor help center)"
    url: https://cursor.com/help/grok-bot/edit-bot
  - title: "Connect plugins (Cursor help center)"
    url: https://cursor.com/help/grok-bot/connect-plugins
  - title: "Give your Bot an email address (Cursor help center)"
    url: https://cursor.com/help/grok-bot/agent-email
  - title: "Grok Bot How Tos (Cursor help center)"
    url: https://cursor.com/help/grok-bot/how-to
  - title: "Use cases (SpaceXAI docs)"
    url: https://docs.x.ai/grok-bot/use-cases
  - title: "Use cases (Grok Bot)"
    url: https://x.ai/bot/use-cases
  - title: "Create and manage Bots (SpaceXAI docs)"
    url: https://docs.x.ai/grok-bot/bots
  - title: "Skills and routines (SpaceXAI docs)"
    url: https://docs.x.ai/grok-bot/skills-routines-and-automations
  - title: "Routines (Cursor help center)"
    url: https://cursor.com/help/grok-bot/routines
  - title: "Grok Bot plans and usage: what you get, what stacks, and where it goes"
    url: https://aitamer.news/posts/grok-bot-plans-pricing-usage/
---

Episode 07 left repository work with a Cursor cloud agent. This episode stays on the shared computer. The jobs are the ones that need your mailbox, your calendar, a login on that computer, or a chore at home. The [use-cases page](https://docs.x.ai/grok-bot/use-cases) states the order: start with read-and-prepare work, review the result, then add an approved action or a routine.

Disclosure: aitamer.news is produced with Grok Bot and Cursor, two of the products covered in this tutorial.

## One job, said in the chat

Create the Bot from **New chat**, then **Create new Bot**. To name it up front, type the name and choose **Create "Name" Bot** ([Onboarding](https://cursor.com/help/grok-bot/onboarding)).

Cursor help, read 12 October 2026, says a personal Bot has a name, a picture, and a label. It does not have a description. The first message is where the job goes: what the Bot should do, which sources it should use, and when it should ask. Ask it to remember that for future work. The label under the name is the short title. On the phone the label is called Title. Click the Bot's name at the top of the chat, then the name or the label, to edit either one ([Change a Bot's name, picture, and what it does](https://cursor.com/help/grok-bot/edit-bot)).

The [create-and-manage page](https://docs.x.ai/grok-bot/bots) still says to put standing rules in the description. Follow the help page for the clicks. A Team Bot you own still has a description under **About**. These Bots are personal, so the rule lives in the message you ask the Bot to remember. Onboarding's first task is a short result that does not change an external service.

## Two inboxes

Gmail and the Bot's own address are different.

The Gmail plugin can search and read mail, draft and send, and apply labels on the connected mailbox. It can do only what that account can already do. It cannot raise your access, and it cannot change sharing. Gmail connects one mailbox at a time. To use another, disconnect the current one and authorize the next. A personal mailbox and a work mailbox cannot both stay connected to Gmail. An installed plugin is available to every Bot on the account. Disconnect Gmail if a Bot should not use that mailbox ([Connect plugins](https://cursor.com/help/grok-bot/connect-plugins)).

The [use-cases list](https://x.ai/bot/use-cases) files **Inbox Manager** under General. The card says it triages the inbox into categories, surfaces urgent and blocked threads, and drafts replies and cleanup, and that every send stays behind your approval. The preview at [x.ai/bot/s4f048c7b7da9e010c2c3](https://x.ai/bot/s4f048c7b7da9e010c2c3) repeats that sentence and says the bot was created by a third-party user. Adding it accepts the terms. You can also skip the card and tell a Bot you created the same stop line.

The other address is one you claim at `mail.grokbot.com`. Ask the Bot, or open **Connect apps**, then **Email**, then **Create address**. Nothing is claimed until you approve. You get one address. You cannot rename or delete it, and a claimed name is never reissued. Use lowercase letters, digits, dots, hyphens, and underscores, at most 64 characters, and avoid reserved words such as support, admin, and billing ([Give your Bot an email address](https://cursor.com/help/grok-bot/agent-email)).

The address belongs to you. Every Bot can use it in your own chats and in routines you set up. There is no inbox view. Ask what arrived. New mail does not wake a Bot. A routine is the only incoming trigger, and it cannot filter by subject. The Bot sends only when you asked, in chat or in the routine. Otherwise it shows the full draft. Replying counts as sending. Text inside an email never counts as your permission. If Gmail or Outlook could also send, the Bot asks which account. On a Cursor team, an admin has to turn **Agent Email** on first. That switch is episode 09.

## Calendar, with two hard edges

The Google Calendar plugin can read calendars you can see, create and update events, check free time, and respond to invitations on calendars you can edit. It cannot change Google Meet settings, such as the waiting room or host controls. It also cannot add a Zoom link. A Zoom link added from the Calendar website uses Google's Zoom add-on, and that add-on is not available to the plugin. Put the Zoom link in the event location or description yourself, or create the event in Calendar and ask the Bot to update the other fields.

A company Google account can block Gmail, Calendar, Drive, Docs, Sheets, or Slides. Grok Bot signs in to Google as Grok, and an admin may have to trust that app. A personal Gmail account does not need that review.

**Calendar Coordinator** is filed under Recruiting & People. The card says it schedules across calendars and chases holds. **Travel Coordinator**, under Life & Leverage, compares flights and hotels to your rules, confirms before booking, and drops an itinerary plus calendar. Any event it creates still cannot change Meet host controls or add a Zoom link.

## Research that has to use your accounts

The docs page's **Chief of Staff** prompt is the shape for research that needs your own channels. It is quoted here as written:

> Review activity since yesterday across my approved channels, inbox, calendar, and meeting notes. Return only items that map to the priorities in this document. For each item, include the source, why it matters, the proposed next step, and whether I owe a decision. Do not send messages or change meetings.

The page says to mark what was useful and what was noise, then schedule the digest for a time you can review it. The priorities document is yours.

For a site with no plugin, open the Bot's computer and sign in yourself. The Bot does not see the password. Every Bot on the account shares that session until it expires, so skip the sign-in if one of them should not have it. The card is **Action needed**, then **Take over**, then **I'm done** ([Grok Bot How Tos](https://cursor.com/help/grok-bot/how-to)). Laptop biometrics and passkeys saved on your own device do not work there. Keep passwords and API keys out of chat. Use the secure prompt.

## Home chores, still a draft first

Life & Leverage on the use-cases list is four cards, read 12 October 2026:

- **Apartment Scout.** Filters listings, emails to book tour times, and applies for the ones you pick.
- **Personal Site Builder.** Scaffolds a personal site from a description, untangles domain issues, and leaves a live starting point.
- **Subscription Cleaner.** Collates receipt and newsletter mail, suggests what to kill, and unsubscribes what you approve.
- **Travel Coordinator.** The confirm-before-booking card above.

Apartment Scout's blurb includes emailing and applying. Subscription Cleaner unsubscribes what you approve. Those are sends. The first run is still read-and-prepare: the shortlist, or the receipts and newsletters, and a stop before any email goes out. Pick one source, Gmail or the Bot's own address, so you know which inbox the list came from. **Meeting Prep Buddy** is filed under Sales. Leave it until the CRM and call notes are actually yours.

## Paste this morning check

One Bot. Name it **Morning**. Label it **Morning check**. Send:

> Read my connected Gmail and Google Calendar. List today's events with their times. Then list unread threads that need a decision from me, with the sender and one line on why. If you have a mail.grokbot.com address, list receipts and newsletters that arrived there since yesterday. Cite the mailbox or calendar on every item. Do not send email. Do not create, update, or decline events. Do not unsubscribe. Remember this stop line for future work.

Read the list against the inbox and the calendar yourself. If a row has no source, say so in the next message. If the Bot drafted a send, that draft is the failure. Choose **Deny** on any approval card you did not ask for. Onboarding says to use **Allow once** while you are still learning the workflow.

When a morning comes back in the shape you wanted, the [skills page](https://docs.x.ai/grok-bot/skills-routines-and-automations) says to save the method as a skill, and only then to automate it. Ask it to save a skill called "Morning check" that includes the sources, the list format, and the approval rule. The [routines page](https://cursor.com/help/grok-bot/routines) calls that button **Test**, and a test performs real work. The skills page says a Bot can own up to 50 routines, with schedules at least five minutes apart. The help page does not repeat those two limits. Each run spends usage ([episode 06](https://aitamer.news/posts/grok-bot-plans-pricing-usage/)). A routine that never runs spends nothing. The skills page also says Grok Bot may pause routines after a long time away if you do not answer. Read them when you come back.

## What stays off this pass

A repository fix belongs with the cloud agent in episode 07. This pass is one Bot, one mailbox, and a stop line in the chat. Episode 09 takes that stop line onto a team account, where an admin can turn plugins and agent email off.
