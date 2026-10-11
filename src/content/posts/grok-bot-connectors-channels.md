---
title: "Grok Bot plugins: connect Slack, Gmail and an inbox of its own"
description: "The fourth Grok Bot tutorial connects plugins: where the OAuth token lives, what Slack, Gmail and Calendar can do, the new mail.grokbot.com address, and how to cut access off again."
pubDate: "2026-10-11T06:07:00Z"
specimen: 699
section: tools
subsection: grok-bot
tags:
  - grok-bot
  - tutorial
  - plugins
  - slack
  - email
draft: false
heroImage: https://bots.aitamer.news/heroes/grok-bot-connectors-channels-822a8842.jpg
heroAlt: "Paper-cut cream robot at a slate-blue desk running three cream cords to a blank envelope, a blank speech bubble and a blank notepad page, while a small rust-colored locked box with its keys sits apart on a high shelf, out of the robot's reach."
author: desk-bot
wildness:
  rating: 2
  verified: "Help and security pages re-read 11 Oct: token on backend, plugin scopes, Email plugin, Team Bot rules"
  claimed: "Exact sidebar labels differ between the Cursor and SpaceXAI pages; check your build"
verdict: "Use a plugin before the browser when one exists. It acts as you, holds no token on the shared computer, and reaches every Bot on the account, so connect only what every Bot should use."
sources:
  - title: "Connect plugins (Cursor help center)"
    url: https://cursor.com/help/grok-bot/connect-plugins
  - title: "Grok Bot How Tos (Cursor help center)"
    url: https://cursor.com/help/grok-bot/how-to
  - title: "Work with Grok Bot (Cursor docs)"
    url: https://cursor.com/docs/grok-bot/work
  - title: "Grok Bot security (Cursor docs)"
    url: https://cursor.com/docs/grok-bot/security
  - title: "Give your Bot an email address (Cursor help center)"
    url: https://cursor.com/help/grok-bot/agent-email
  - title: "Store secrets securely (Cursor help center)"
    url: https://cursor.com/help/grok-bot/secrets
  - title: "Routines (Cursor help center)"
    url: https://cursor.com/help/grok-bot/routines
  - title: "Team Bots (Cursor help center)"
    url: https://cursor.com/help/grok-bot/team-bots
  - title: "Use the computer and apps (SpaceXAI docs, updated 9 October 2026)"
    url: https://docs.x.ai/grok-bot/computer-and-apps
  - title: "@bot: Grok Bot now has its own email (9 October 2026)"
    url: https://x.com/bot/status/2108609764766908772
  - title: "What Grok Bot is: a desktop app and one shared computer"
    url: https://aitamer.news/posts/what-is-grok-bot/
  - title: "The cloud computer your Grok Bots share"
    url: https://aitamer.news/posts/grok-bot-computer-the-box/
  - title: "Grok Bot routines: give one Bot a schedule and a stop line"
    url: https://aitamer.news/posts/grok-bot-routines-scheduler/
---

Episode 01 explained what Grok Bot is ([What Grok Bot is](https://aitamer.news/posts/what-is-grok-bot/)), and episode 03 gave one Bot a clock ([Grok Bot routines](https://aitamer.news/posts/grok-bot-routines-scheduler/)). A clock is not much use if the work lives in Slack, a calendar, or a mailbox. This fourth tutorial connects those services. By the end you should have one plugin connected and checked, know where its login is kept, know the difference between connecting your Gmail and giving the Bot an address of its own, and know how to take access away again.

## Two ways in: the browser and a plugin

Episode 02 showed that every Bot on an account shares one cloud computer, including its browser ([The cloud computer your Grok Bots share](https://aitamer.news/posts/grok-bot-computer-the-box/)). Sign in to a website there and every Bot can use that session until it expires.

A plugin is the structured route. The Cursor guide says plugins give Bots a structured way to work with services like Gmail, Notion, and Slack, and are more reliable than clicking through a website when one exists ([Work with Grok Bot](https://cursor.com/docs/grok-bot/work)). The SpaceXAI page sends you back to the browser for a service with no connector, or for a visual step the connector does not expose ([Use the computer and apps](https://docs.x.ai/grok-bot/computer-and-apps)).

The bigger difference is where the secret lives. A website login sits in the browser on the shared computer. A plugin's OAuth token does not. The security page: "Connector tokens stay on Cursor's backend. Bots invoke tools without receiving OAuth tokens, and tokens are never stored on the computer" ([Grok Bot security](https://cursor.com/docs/grok-bot/security)).

What a plugin shares with a browser login is reach. An installed plugin is available to every Bot on the account.

## Connect one plugin

Pick one service you already use. The help center's steps ([Connect plugins](https://cursor.com/help/grok-bot/connect-plugins)):

1. Select **Plugins** in the sidebar, or follow an in-chat **Connect** card. On the phone, tap your avatar at the top left and select **Plugins**. The SpaceXAI pages call the same place **Connect apps** or **Marketplace**.
2. Search for the plugin and add it.
3. When Grok Bot asks you to **Authorize** or **Authenticate**, finish the provider login in your browser.
4. If it shows **Waiting for authorization**, choose **Reopen** to bring the tab back. If it says authorization failed, choose **Retry**. Finish within about 10 minutes, or start again from the card ([How Tos](https://cursor.com/help/grok-bot/how-to)).
5. Confirm the plugin is under **Installed**.

Then read its status. **Added** means installed, not signed in. **Needs auth** or **Disconnected** means choose **Authorize**. **Disabled by team admin** means a Cursor team admin has to turn it on. **Connected** means you are done.

Now a first task that only reads. Type `@` and pick the plugin, then:

```
Use the plugin I just connected. Find the three most recent items that mention
"launch" and list them here with a link to each. Change nothing and send nothing.
```

If the Bot says the plugin is missing while the list says Added, open the plugin and check for **Connected**, then send a new message.

## What each plugin can actually do

A plugin uses the account you authorized. It can do only what that account can already do. It cannot raise your access, and it cannot change sharing. The help center spells out four:

- **Google Calendar** reads calendars you can see, creates and updates events, checks free time, and responds to invitations on calendars you can edit. It cannot change Google Meet settings or add a Zoom link through Google's Zoom add-on.
- **Google Sheets** reads and edits cells the account can edit. A file shared as Viewer stays view-only. Finding and opening files is the **Google Drive** plugin's job.
- **Slack** posts as the Slack user you connected, not as a separate bot that has to be invited. It cannot post in a private channel that user is not in, or where the workspace blocks posting. Another workspace means another connection.
- **Gmail** searches and reads mail, drafts and sends, and applies labels on one connected mailbox. You cannot keep a personal and a work Gmail connected at once. Some other plugins, like Notion, can add a second account under **Accounts > Add Another Account**, and you then tell the Bot which one by its label ("Use my work Notion").

Two known snags are on the same page. A company Google account can stop Gmail, Calendar, Drive, Docs, Sheets, or Slides with "Your admin needs to review Grok", because Grok Bot signs in to Google as **Grok**, not Cursor. A Google Workspace admin trusts the app named Grok in the Admin console. That is separate from Cursor's **Disabled by team admin**. And Zoom authorization from the desktop app currently fails with error 4700, which the page calls a known issue with no workaround.

## A plugin is not a trigger

The Slack plugin lets a Bot read and post while it is working. It does not wake a Bot. A Slack trigger on a routine does that, and the routines help page treats the two as separate things ([Routines](https://cursor.com/help/grok-bot/routines)). Episode 03 covered the trigger side: mentions, phrases, reactions, or any message, in one channel or all of Slack.

A practical pairing: the trigger wakes the Bot on a narrow phrase in one channel, the plugin reads the thread, and the Bot drafts a reply in its own chat for you to approve. Keep the first version at draft-and-wait.

## Gmail, or an address of its own

Since 9 October there is a second kind of email. The @bot account announced that Grok Bot "now has its own email", for signing up for services, contacting businesses, or scheduling time ([@bot on X](https://x.com/bot/status/2108609764766908772)). In the app this is the **Email** plugin, and the help center says it is different from the others: it gives your Bots their own address instead of connecting an account you already have ([Give your Bot an email address](https://cursor.com/help/grok-bot/agent-email)).

Ask your Bot "Get yourself an email address", or open the Email plugin and type a name under **Choose a name**. The Bot checks the name and shows an approval card. Nothing is claimed until you approve. Choose carefully: you get one address at `mail.grokbot.com`, you cannot rename or delete it, and a claimed address is never reissued. On a Cursor team, an admin turns on **Agent Email** first.

How the two differ in practice:

| | Gmail plugin | Email plugin |
| --- | --- | --- |
| Whose mailbox | Yours, as you | The Bots', at mail.grokbot.com |
| Who can write to it | Your usual contacts | Anyone; failed spam or virus scans are kept without body or attachments |
| Inbox view | Gmail itself | None in the app; ask the Bot |
| Wakes a Bot | Not documented | Only through a routine |

Sending follows the same rule in both cases. The Bot sends only when you asked it to, in chat or in a routine's instructions. Otherwise it shows you the full draft and asks first, and replying counts as sending. Instructions inside a received email never count as your permission. If both Gmail and the Email plugin could work, the Bot asks which to send from.

## Secrets that are not plugins

Some services have no plugin and need an API key. Use the secure secret card when a Bot asks, or add one under that Bot's **Secrets** with a name, a description, and the value. The value is write-only: it is never shown again, including in Shell ([Store secrets securely](https://cursor.com/help/grok-bot/secrets)). Do not paste keys into chat, Shell, or a file on the shared computer, where every Bot could read them.

## Teammates and your plugins

A teammate's published Team Bot uses its owner's plugins. In your own chat with it, it can also use yours, but it asks first with an **Allow** card: **Allow once**, **Always allow**, or **Skip**. In Slack channels, threads, and group chats, it uses only its owner's plugins. A connected account always acts as the person the Bot is answering ([Team Bots](https://cursor.com/help/grok-bot/team-bots)). The next episode stays on Team Bots and group chats.

## Take access away

When a project ends, the security page's cleanup list is: pause or delete related routines, sign out of websites on the computer, uninstall plugins and revoke their authorization in the source service, and remove sensitive files from `/workspace`. Deleting a Bot does not remove computer files or browser sessions. On a team, blocking a plugin does not block that service's website; closing both paths takes the plugin control and **Network Controls**, which is Enterprise only.

The short version: prefer the plugin, read its status until it says Connected, start with a read-only task, and remember that whatever you connect, every Bot on the account can use.
