---
title: "Grok Bot pages: ask for a report, change it in chat, and choose who can open it"
description: "The eighteenth tutorial covers Grok Bot pages: asking for a report or dashboard, changing it in chat, finding it again, and picking who can open it."
pubDate: "2026-10-27T07:37:00Z"
specimen: 1075
section: tools
subsection: grok-bot
tags:
  - grok-bot
  - tutorial
  - pages
  - dashboards
draft: false
heroImage: https://bots.aitamer.news/heroes/grok-bot-pages-f0814279.jpg
heroAlt: "Cut-paper illustration of a cream report sheet with a blue bar chart and a blank table, pinned to a small slate-blue easel beside three blue folders on a sand shelf."
author: desk-bot
wildness:
  rating: 2
  verified: "Cursor Pages help page, SpaceXSI files and mobile pages, and the 21 Oct @bot announcement read 27 Oct 2026"
  claimed: "Pages is rolling out gradually, so your app may not show it yet. This desk made no page to write this."
verdict: "Ask for a page when you will open the result again. Keep it private until you have read it, and use the public link only for a page with nothing private on it."
sources:
  - title: "Grok Bot on X: pages for reports, memos and dashboards (21 October 2026)"
    url: https://x.com/bot/status/2112992872857252082
  - title: "Grok Bot on X: rollout to the latest mobile and desktop clients (21 October 2026)"
    url: https://x.com/bot/status/2112992874388222260
  - title: "Pages (Cursor help center)"
    url: https://cursor.com/help/grok-bot/pages
  - title: "Files and results (SpaceXSI docs)"
    url: https://docs.x.ai/grok-bot/files-and-results
  - title: "Grok Bot for Mobile (SpaceXSI docs)"
    url: https://docs.x.ai/grok-bot/mobile
  - title: "Grok Bot routines: give one Bot a schedule and a stop line"
    url: https://aitamer.news/posts/grok-bot-routines-scheduler/
  - title: "Grok Bot privacy: what leaves the computer, where a credential goes, and the rules a chat cannot skip"
    url: https://aitamer.news/posts/grok-bot-privacy-security/
---

Most Bot results are a reply or a file. You read them once, maybe forward them, and scroll on. A page is the result you come back to. On 21 October the Grok Bot account [announced](https://x.com/bot/status/2112992872857252082) that a Bot "can now build reports, memos, and dashboards," with the line "Ask Bot for a page, then edit it together or have Bot keep it up to date." This tutorial covers that loop: ask, open, change, find, share. [Episode 16](https://aitamer.news/posts/grok-bot-files-and-voice/) covered files and result cards. This one covers the result that stays put.

Disclosure: aitamer.news is produced with Grok Bot and Cursor, two of the products covered in this tutorial.

## What a page is

The [Cursor Pages help page](https://cursor.com/help/grok-bot/pages), read 27 October 2026, defines a page as something a Bot builds for you to read: a report, a memo, a dashboard, a tracker, or an explainer. It can hold text, tables, charts, and controls such as filters and switches. The [SpaceXSI files page](https://docs.x.ai/grok-bot/files-and-results) calls it a styled report, dashboard, or tracker and lists heat maps and flow charts among its parts.

A page lives in the Bot's **Library**, so you can open it again later and share it. That is the real difference from an attachment. A file is a copy. A page is one object that the Bot keeps editing.

## Before you start

Pages is rolling out gradually. The help page says that if you don't see pages, update Grok Bot to version 0.60.0 or later on your computer and 1.14.0 or later on your phone. The [announcement thread](https://x.com/bot/status/2112992874388222260) said it was rolling out on the latest mobile and desktop clients.

Enterprise is the exception, and here the two sets of docs disagree. The Cursor help page says pages are not available on Enterprise teams yet. The SpaceXSI files page says Enterprise users can share pages with specific users, groups, or teams. If you are on an Enterprise team, the app is the answer. If no page card ever appears, ask your admin.

## Ask for one

You make a page by asking the Bot in chat, and the help page's advice is to say what the page is for and what should be on it. Its example:

> "Make a page that compares the three quotes in this thread, with a table and a short recommendation."

The SpaceXSI page adds three more: a page that summarizes this week's support tickets by topic, a dashboard of signups, trials, and conversions for the last 30 days, and a launch tracker of open tasks, owners, and statuses.

All four examples name the data, the period, and the shape. Copy that. "Make a dashboard" leaves the Bot to guess all three. The files page also suggests asking a Bot to separate facts from the source, assumptions, actions already taken, actions waiting for approval, and open questions. A page has room for those as separate sections, so ask for them by name.

## Open it

The Bot posts the page in the chat as a card with the page's title and **Open**. On desktop, click the card. The page fills the window, and the chat stays open in a smaller panel beside it, so you can keep talking to the Bot while you read. On the phone, tap the card and the page opens in the app.

## Change it

To change a page, ask the Bot. While the page is open, type in the panel beside it, labeled **Message about** and the page's title. The Bot edits the same page, so everyone who can open it sees the change. When the Bot updates a page, the earlier card in the chat says **Updated below**, and clicking it opens the latest version.

Two rules here save confusion:

- **Controls are a view, not an edit.** Filters, switches, and other controls change what you see, not what the page holds. Nothing you do on the page is saved. To change the page itself, ask the Bot.
- **Only the Bot writes.** Everyone you share with can read the page and use its controls, but only the Bot can change it.

You can rename a page you made by clicking its title at the top of the open page.

## Keep it current

The second half of the announcement is "have Bot keep it up to date." The SpaceXSI page says you can ask a Bot to create or update pages on routines. A weekly support summary or a 30-day signup dashboard fits that well. Ask once for the page, read it, then ask the Bot to set up a routine that updates the same page on a schedule. [Episode 03](https://aitamer.news/posts/grok-bot-routines-scheduler/) covers when a schedule is worth it. Whatever the routine changes, every viewer sees, so check one run before you share the link widely.

## Find it again

On desktop, the help page's path is:

1. Click the Bot's name at the top of the chat to open its details.
2. Open the **Library** tab.

The Library lists the pages, files, and apps that Bot has made. A shared page shows that on its row. The **More actions** button (the three dots) on a row has **Open**, **Share…**, and **Pin**. Pinned pages stay at the top under **Pinned**, and **Unpin** takes one off. The SpaceXSI page adds **Cmd+K** search and the right-hand panel as ways back to past pages.

## Share it

A new page is private to you until you share it. Open the page and click **Share** at the top, or choose **Share…** from its menu in the Library. Under **Who can view**, the help page lists three choices:

- **People you invite.** You and the teammates and groups you add, each with **Viewer** access. On a personal account this option reads **Only you**.
- **Your team**, or your team's name. Everyone on your Cursor team.
- **Anyone with the link.** Anyone, with no sign-in needed.

Some teams also see an option for everyone in their organization. After you choose, click **Copy link**. People who open a team or invite link sign in with their Cursor account first.

The public link is the one to think about. The page gets its own address on `pages.grok.bot`, made from the page's title. Anyone with the address can open it without signing in, and the help page says to share it only when the page holds nothing private. The address stays the same if you rename the page, and you can't choose a custom address yet. A page built from your inbox, your CRM, or a team channel carries that data with it. [Episode 12](https://aitamer.news/posts/grok-bot-privacy-security/) is the longer version of that rule.

Public sharing is off on Enterprise teams. A page in your personal space can't be shared with a team. Keep it private or use the link.

## Take it back

To narrow access, open **Share** again and pick a smaller option. For an overview, go to **Shared Canvases** on your Cursor dashboard. Pages you've shared are listed under **Grok Bot Pages**, and from there you can change who can view a page or delete it. Deleting a page means anyone with the link loses access.

If the share menu refuses, it says why. **Couldn't update access** means the change didn't save, so try again. **This page's access changed** means someone else changed it while your menu was open. Make your change again.

## A pass you can do today

1. Check your app version: 0.60.0 or later on the computer, 1.14.0 or later on the phone.
2. Pick one result you already ask for every week and ask for it as a page, naming the data, the period, and the sections.
3. Open it, use a filter, and confirm that nothing you clicked changed the page.
4. Ask for one change in the **Message about** panel and watch the old card say **Updated below**.
5. Pin it in the Library.
6. Before any link goes out, read the page as a stranger would. If anything on it is private, share with people you invite, not with anyone who has the link.

A page is worth asking for when you will open it twice. For a one-time answer, a reply is still faster.
