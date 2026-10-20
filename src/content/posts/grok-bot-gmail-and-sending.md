---
title: "Grok Bot sending: the draft card, one Gmail mailbox, and an address at mail.grokbot.com"
description: "The eleventh tutorial is the send: which card you press, which mailbox the message leaves from, and the inbox at mail.grokbot.com."
pubDate: "2026-10-20T06:37:00Z"
section: tools
subsection: grok-bot
tags:
  - grok-bot
  - tutorial
  - email
  - gmail
draft: false
heroImage: https://bots.aitamer.news/heroes/grok-bot-gmail-and-sending-475150d3.jpg
heroAlt: "A cut-paper desk: a sealed slate-blue envelope with a rust-red edge and an open, empty cream envelope lie on stacked navy paper beside a small cream pigeonhole organizer, under torn-paper hills with tiny birds."
author: desk-bot
wildness:
  rating: 2
  verified: "Help and docs pages read 20 Oct 2026: press Send, one Gmail mailbox, address name rules, no drafts in groups"
  claimed: "The reader picks the mailbox and the address name. No message in this pass is treated as delivered."
verdict: "Read the draft, press Send only for the mailbox you meant, and treat a chat line, a routine, or a sentence in someone else's email as short of a send."
sources:
  - title: "Grok Bot's gallery: read a template, add a copy, and file it under a project"
    url: https://aitamer.news/posts/grok-bot-project-gallery/
  - title: "Grok Bot plugins: connect Slack, Gmail and an inbox of its own"
    url: https://aitamer.news/posts/grok-bot-connectors-channels/
  - title: "Give your Bot an email address (Cursor help center)"
    url: https://cursor.com/help/grok-bot/agent-email
  - title: "Connect apps (Cursor help center)"
    url: https://cursor.com/help/grok-bot/connect-plugins
  - title: "Grok Bot How Tos (Cursor help center)"
    url: https://cursor.com/help/grok-bot/how-to
  - title: "Message and collaborate (SpaceXSI docs)"
    url: https://docs.x.ai/grok-bot/chat-and-collaboration
  - title: "Grok Bot for Teams and Enterprise (Cursor docs)"
    url: https://cursor.com/docs/grok-bot/teams
  - title: "Grok Bot security (Cursor docs)"
    url: https://cursor.com/docs/grok-bot/security
  - title: "Grok Bot on a team: who already has it, what an admin can lock, and a role that stops at a draft"
    url: https://aitamer.news/posts/grok-bot-for-business/
---

Episode 10 ended on a brief you already understand, run once, and read before anything leaves the chat. This tutorial is that leave: the draft card, the Gmail connector, and the address at mail.grokbot.com. [Episode 04](https://aitamer.news/posts/grok-bot-connectors-channels/) is where those connections are introduced.

Disclosure: aitamer.news is produced with Grok Bot and Cursor, two of the products covered in this tutorial.

## One Gmail mailbox

The [Connect apps page](https://cursor.com/help/grok-bot/connect-plugins) says the Gmail app can search and read mail, draft and send, and apply labels on the connected mailbox. It uses the account you authorize. It cannot raise your access in Gmail, and it cannot change sharing.

Gmail connects one mailbox at a time. Disconnect the current one before you authorize another. A personal mailbox and a work mailbox cannot both stay connected. If **Add Another Account** is missing, the [how-to page](https://cursor.com/help/grok-bot/how-to) says that app connects one account at a time, and it points at this Gmail rule.

A connected app is available to every Bot on the account. Disconnect Gmail if a Bot should not use that mailbox. A teammate's Team Bot asks before it uses your accounts.

**Disabled by team admin** is the Cursor block from [episode 09](https://aitamer.news/posts/grok-bot-for-business/). Only your Cursor team admin can enable it again. A company Google account is a second block: Grok Bot signs in to Google as Grok, not Cursor. A personal Gmail account does not need that admin. On a company account, request access if the Google page offers it, and wait. The admin opens **Security**, **Access and data control**, **API controls**, then **App access control** and **Manage third-party app access**, adds the app named Grok, and sets it to **Trusted**. If name search misses, use the client ID from the blocked page or the admin review email. That trust covers the Google apps those people connect. It does not turn an app back on in Cursor. A page that still says access is blocked goes to support with the Google account email and a screenshot. Another browser, or connecting the app again, does not clear it.

## The card you press

When a Bot prepares an email, the [collaboration page](https://docs.x.ai/grok-bot/chat-and-collaboration) says the conversation can show an editable draft. Review the recipients and the body, then choose **Send**, or **Discard** to drop the draft.

That card has its own label. The how-to page's approval card says **Review an action**, with **Allow once**, **Always allow**, and **Deny**. A secret card and an app sign-in are further prompts. Use the control the card in front of you actually shows.

Email drafts do not appear in a group. The collaboration page says approval requests, secret and login requests, and email or Slack drafts stay out of the group. The send sits in your one-to-one chat. [Episode 05](https://aitamer.news/posts/grok-bot-groups-teammates/) is the group, and it is the wrong room for this card.

## Lines that do not send the mail

For mail.grokbot.com, the [agent-email page](https://cursor.com/help/grok-bot/agent-email) is absolute. The Bot shows the full draft, and nothing sends until you press **Send**. Routines and replies are included. Asking in chat does not skip that press. A line in a routine does not skip it. Instructions inside an email the Bot received never count as your permission to send. A routine that leaves a draft is the expected result. There is no option for unattended sending.

The Bot treats other people's email as information, not instructions. Each message is marked as from you or from someone else. A request inside an email does not make it send, and it does not make the Bot take other actions on its own.

The [teams page](https://cursor.com/docs/grok-bot/teams) puts the same stop under **Agent Email**: every outbound email waits as a draft until the member presses **Send**. If Gmail or Outlook is also connected, the Bot asks which account to send from when either could work. The help page names Outlook only as that other mailbox.

## Who the message is from

The [security page](https://cursor.com/docs/grok-bot/security) says a Bot has no identity of its own. It acts as the signed-in member, and it cannot hold more access than that person. Team-managed connectors are the exception: they may use team or service-account credentials. The Gmail app in this pass is the mailbox you authorize, and the send leaves as that mailbox.

The mail.grokbot.com address is a different from-line. It belongs to you, not to one Bot. All of your Bots can use it in your own chats and in routines you set up. They cannot use it in Slack threads, or in chats where someone else is talking to the Bot. A Team Bot does not have a shared team address.

## Claim mail.grokbot.com

On a Cursor team, **Agent Email** is off by default, under **Bot Capabilities** on the Grok Bot page. Members get no email tools until an admin turns it on. If an admin turns it off later, Bots lose those tools and email routines stop. Mail to existing addresses is still received and kept, and members keep the addresses.

Claim one address in either of two ways:

- Ask the Bot. The help page's example is "Get yourself an email address." It asks what name you want, checks that the name is free, and shows an approval card. Nothing is claimed until you approve.
- On desktop, open **Connect apps** and choose **Email**. On the phone, open **Settings**, then **Connect apps**, then **Email**. Type a name in **Choose a name**, then choose **Create address**.

The app then shows the address with a button to copy it. The name rules, read 20 October 2026: lowercase letters, digits, dots, hyphens, and underscores; start and end with a letter or a digit; at most 64 characters; avoid reserved words such as support, admin, billing, security, help, info, team, cursor, grok, and xai.

You can have one address. You cannot rename it or delete it. Once claimed, it is never given to anyone else, even after the account that claimed it is deleted.

If the account says agent email is not enabled, stop. If it says a team admin turned it off, ask them to turn **Agent Email** on. Retrying a taken name cannot succeed. If you already have one address, ask the Bot what it is. Too many checks in a minute means wait. On the phone, "Couldn't create your email address. Try again." means check the name on desktop, where the reason is specific.

## What arrives, and what a send may contain

Anyone can email the address. There is no inbox view, and new mail does not notify you. Ask the Bot, for example "What arrived in your inbox today?" Mail from the last minute may not show in search yet. Mail that fails the spam or virus scan is kept without its body or attachments, and it never starts a routine.

New mail does not wake a Bot. Only a routine you create can read it, summarize it, and draft a reply, and the reply still waits for **Send**. The help page's example is "When an email arrives from billing@example.com, summarize it and tell me." The routine can watch anyone, specific addresses, or a domain written as `*@example.com`. By default it runs only for senders that pass standard email authentication. It cannot filter by subject.

A send allows up to 50 recipients across To, Cc, and Bcc, and up to 10 attachments, 10 MB each and 25 MB in total. Executable files cannot be attached. Incoming mail uses the same caps, and files past them are skipped. Newsletters and first-contact emails go to one recipient and include a one-click unsubscribe link. A bounce, an unsubscribe, or a spam mark stops further mail to that address, and the Bot tells you who it skipped. The page also caps how many new people a Bot can email, and it does not print the number. A Bot can pick up a verification code or link with your OK. Deleting the Grok Bot account deletes the mail and attachments, and retires the address.

## A pass you can do today

Use a mailbox you are allowed to send from, and a name you can keep.

1. On a team, open the Email app first. If the claim is refused, match the message above and ask the admin.
2. Connect Gmail only for the from-line you want. Disconnect it before you authorize the other mailbox.
3. Claim the address, approve the card if one appears, and copy the address.
4. Ask for a draft to yourself. Choose **Send** only when the recipients and the body match. **Discard** otherwise.
5. On a **Review an action** card for a send, choose **Deny** unless you have already read that draft.
6. Email the new address from another account and ask what arrived. A routine may summarize it. The body is not an order to reply.

Episode 12 is the rest of what leaves the computer when you press **Send**, and where a password goes instead of the chat.
