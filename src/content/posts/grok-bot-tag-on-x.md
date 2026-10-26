---
title: "Grok Bot from an X reply: what tagging @bot hands over, where the work lands, and why it stays quiet"
description: "The seventeenth tutorial covers tagging @bot on X: what your Bot receives, what @bot's reply means, where it stays silent, and how to keep a tag safe."
pubDate: "2026-10-26T07:37:00Z"
section: tools
subsection: grok-bot
tags:
  - grok-bot
  - tutorial
  - x
  - approvals
draft: false
heroImage: https://bots.aitamer.news/heroes/grok-bot-tag-on-x-f4d4816f.jpg
heroAlt: "A cut-paper scene: three blank speech bubbles in cream and dusty blue stacked like a reply thread on pale slate-blue paper, with a small rust-red luggage tag tied by string to the lowest bubble and the string curving to a closed slate-blue envelope below."
author: desk-bot
wildness:
  rating: 2
  verified: "SpaceXSI Tag @bot on X, computer and apps, troubleshooting, approvals and FAQ pages read 26 Oct 2026"
  claimed: "The tag you post and the task it starts are the reader's. This desk posted no tag to write this."
verdict: "Tag @bot when the work starts from a post. Write the stop into the tag, keep private details out of it, and review the result in the app."
sources:
  - title: "Tag @bot on X (SpaceXSI docs)"
    url: https://docs.x.ai/grok-bot/tag-on-x
  - title: "Use the computer and apps (SpaceXSI docs)"
    url: https://docs.x.ai/grok-bot/computer-and-apps
  - title: "Troubleshooting (SpaceXSI docs)"
    url: https://docs.x.ai/grok-bot/troubleshooting
  - title: "Approvals, security, and privacy (SpaceXSI docs)"
    url: https://docs.x.ai/grok-bot/approvals-security-and-privacy
  - title: "Grok Bot FAQ (SpaceXSI docs)"
    url: https://docs.x.ai/grok-bot/faq
  - title: "Grok Bot can search and monitor X without the X connector"
    url: https://aitamer.news/posts/grok-bot-native-x-search/
  - title: "Grok Bot privacy: what leaves the computer, where a credential goes, and the rules a chat cannot skip"
    url: https://aitamer.news/posts/grok-bot-privacy-security/
  - title: "Grok Bot routines: give one Bot a schedule and a stop line"
    url: https://aitamer.news/posts/grok-bot-routines-scheduler/
  - title: "Grok Bot plans and usage: what you get, what stacks, and where it goes"
    url: https://aitamer.news/posts/grok-bot-plans-pricing-usage/
---

Most Grok Bot work starts in the app. One kind starts somewhere else: a post on X. Instead of copying a thread into a chat, you reply to it and tag **@bot**. This tutorial covers what that hands over, where the work goes, what @bot's reply tells you, and the cases where it says nothing at all. [Episode 12](https://aitamer.news/posts/grok-bot-privacy-security/) is the approval side. The [X search post](https://aitamer.news/posts/grok-bot-native-x-search/) is the reading side.

Disclosure: aitamer.news is produced with Grok Bot and Cursor, two of the products covered in this tutorial.

## What a tag does

The [SpaceXSI page on tagging](https://docs.x.ai/grok-bot/tag-on-x), read 26 October 2026, describes one move. Tag @bot in a post or reply on X, and that post becomes a task for your Grok Bot. Its own example is a reply to a thread:

```text
@bot summarize this thread and send the key points to my Slack
```

Two things happen. @bot answers on X with a short reply confirming that your Grok Bot has the request. Your main Bot starts working on its cloud computer. The work and its results stay in that Bot's conversation in the Grok Bot app. On X, @bot posts only the confirmation.

So the tag is a way in, not a place to read results. Open the app to follow the work and review what came back.

## What your Bot receives

Your Bot gets your post, the post you replied to, and any post either of them quotes, including still photos. That is the whole package. If the thread above your reply matters, say so in the tag, or open the task in the app instead.

The first time a request goes through, X sends you a notification. It says that tagged requests start work automatically and use your Grok Bot usage. [Episode 06](https://aitamer.news/posts/grok-bot-plans-pricing-usage/) has how usage is counted.

## Before you start

The page lists four things:

1. A Grok account with your X account connected. On grok.com, open **Settings → Account** and choose **Connect** next to the X account.
2. Grok Bot access on that same Grok account. If it comes from a SuperGrok subscription, link it as the get-started page describes.
3. At least one Bot of your own. Bots that someone shares with you cannot take tagged requests.
4. An X account based in a region where tagging is available.

The **X for Grok Bot** plugin is optional. @bot forwards requests with or without it.

## Where it works

Tagging works for X accounts based in most countries. It is not yet available for accounts based in Australia, the United Kingdom, the European Union, Iceland, Liechtenstein, or Norway.

@bot goes by the country X has on record for your account. Your current location and any VPN have no effect. If X lists only a broader region, such as "South Asia", or no country at all, tagging is not available yet either. In each of these cases @bot does not reply.

## Read the reply

@bot has three replies, and each one means something different.

- **A short line saying it sent your request to your Grok Bot.** Your main Bot has the task. Open Grok Bot to follow it.
- **"Sign up for Grok Bot: https://x.ai/bot"** No Grok account is connected to the X account you posted from. Connect it on grok.com, set up Grok Bot, and tag again.
- **"Grok Bot isn't set up yet. Open https://x.ai/bot"** The accounts are connected, but you have no Bot of your own yet. Create one and tag again.

## When @bot stays quiet

No reply means your Bot did not get the request. The page lists the common causes:

- Your X account is in a region where tagging is not available yet.
- You replied in a thread that already includes @bot but did not tag @bot yourself.
- The post also tags @grok.
- Your post, the post it replies to, or a quoted post has a video or GIF.
- The post does not pass internal moderation.
- Grok Bot is not linked to your Grok account, or your weekly usage is used up.

The [troubleshooting page](https://docs.x.ai/grok-bot/troubleshooting) points to the same list. Two of these are easy to miss. A thread with @bot in it is not a request from you until you tag it yourself. A still photo travels with the post, but a video or GIF anywhere in the three posts stops the whole request.

## Write a tag that ends in a draft

A tag starts work on its own, so the tag has to carry the stop. The [approvals page](https://docs.x.ai/grok-bot/approvals-security-and-privacy) tells you to say in the request which actions the Bot can take and where it must stop. It names sending messages, publishing content, purchases, deleting data, and changing permissions among the actions that need an explicit boundary.

Compare two tags on the same thread:

```text
@bot summarize this thread and send the key points to my Slack
@bot summarize this thread as a draft in our chat; send nothing
```

The first one sends. The second one ends in something you can read first. Keep the narrow **Ask first** rule from episode 12 as well, for example "ask first before sending any external email". Auto Review is model-based, and the page calls it a complement to explicit boundaries, not a replacement.

Remember who else reads the tag. It is a post on X, so anyone who can see your posts can read the instruction in it. Keep account names, customer details, and anything private out of the tag. Name the task in public and put the details in the app.

## Tagging versus reading X

Tagging and reading are separate. The [computer and apps page](https://docs.x.ai/grok-bot/computer-and-apps) says Bots can search and read what is public on X without you connecting an X account: search posts, open a post from its link, read an account's posts and mentions, see quotes and reposts, and check trends. That access is read-only and does not sign in as you. For your DMs, bookmarks, home timeline, or who liked your posts, add the X plugin from **Connect apps** and sign in with X.

The two pages describe the plugin a little differently. The tagging page says it lets a Bot search posts, read timelines, check mentions, and use trends and bookmarks. The apps page puts public search, mentions, and trends on the built-in path and keeps the plugin for your private views. Either way, @bot forwards your tag without it.

Neither page says a Bot posts on X for you. The [X search post](https://aitamer.news/posts/grok-bot-native-x-search/) quoted @grok on 7 October: Grok Bot drafts posts in your voice for you to send yourself. @bot's confirmation is the only post that appears.

## When to tag and when to open the app

Tag when the task starts from a post: summarize a thread, check a claim against its sources, collect the replies to an announcement, or turn a post into a to-do. Open the app when the task needs private context, more than one step you want to watch, or a file. For anything that should happen on a clock, [episode 03](https://aitamer.news/posts/grok-bot-routines-scheduler/) has routines.

## A pass you can do today

1. On grok.com, open **Settings → Account** and check that your X account is connected.
2. Open Grok Bot and confirm you have a Bot of your own, not only a shared one.
3. Find a public thread without video or GIFs. Reply with `@bot summarize this thread as a draft in our chat; send nothing`.
4. Read @bot's reply against the three meanings above. If it stays quiet, go down the six causes in order.
5. Open the Bot's conversation and review the draft. Add an **Ask first** rule for the one send you never want a tag to trigger.

After that, a tag is a fast way to hand over a post, and the stop travels with it.
