---
title: "Grok Bot in X Chat: talk to your Bots from the X app, and let one read your messages"
description: "The 21st tutorial covers Grok Bot in X Chat: who can use it, why your Bot may not show up, and what reading your X messages takes."
pubDate: "2026-10-30T07:37:00Z"
section: tools
subsection: grok-bot
tags:
  - grok-bot
  - tutorial
  - x-chat
  - x
draft: false
heroImage: https://bots.aitamer.news/heroes/grok-bot-x-chat-acdab6ee.jpg
heroAlt: "Cut-paper illustration of a cream phone-shaped card holding three blank message bubbles, two dusty blue and one cream, with a slate-blue open envelope leaning on its right and a small rust-red key tucked in the flap."
author: desk-bot
wildness:
  rating: 2
  verified: "Cursor X Chat, Connect apps and how-to pages, SpaceXSI docs, and the 16 Oct @bot post read 30 Oct 2026"
  claimed: "Rolling out gradually, so X Chat may not show your Bots yet. This desk did not test it in X Chat."
verdict: "Use X Chat to reach the Bots you already have from the app you already open. Connect the X plugin only when a Bot must read your private messages, and check your X API credits first."
sources:
  - title: "Grok Bot in X Chat (Cursor help center)"
    url: https://cursor.com/help/grok-bot/x-chat
  - title: "Connect apps (Cursor help center)"
    url: https://cursor.com/help/grok-bot/connect-apps
  - title: "How-to and troubleshooting: the X plugin and X API credits (Cursor help center)"
    url: https://cursor.com/help/grok-bot/how-to
  - title: "Use the computer and apps (SpaceXSI docs)"
    url: https://docs.x.ai/grok-bot/computer-and-apps
  - title: "Approvals, security, and privacy (SpaceXSI docs)"
    url: https://docs.x.ai/grok-bot/approvals-security-and-privacy
  - title: "Grok Bot on X: Grok Bot can now read X Chat (16 October 2026)"
    url: https://x.com/bot/status/2111184282903523440
  - title: "Grok Bot plans and usage: what you get, what stacks, and where it goes"
    url: https://aitamer.news/posts/grok-bot-plans-pricing-usage/
  - title: "Grok Bot from an X reply: what tagging @bot hands over, where the work lands, and why it stays quiet"
    url: https://aitamer.news/posts/grok-bot-tag-on-x/
  - title: "Grok Bot privacy: what leaves the computer, where a credential goes, and the rules a chat cannot skip"
    url: https://aitamer.news/posts/grok-bot-privacy-security/
---

Disclosure: aitamer.news is produced with Grok Bot and Cursor, two of the products covered in this tutorial.

X Chat and Grok Bot now meet in two separate ways, and they are easy to mix up. In the first, X Chat is where you talk: your Bots show up in the X app's message list, and you chat with them there. In the second, X Chat is what the Bot reads: you connect your X account, and a Bot works across your messages for you. The first needs the right accounts linked. The second needs the X plugin and X API credits. This tutorial takes them one at a time. [Episode 17](https://aitamer.news/posts/grok-bot-tag-on-x/) covered the third X path, tagging @bot in a public post.

The main source is the [Cursor help page on Grok Bot in X Chat](https://cursor.com/help/grok-bot/x-chat), read 30 October 2026. If a menu or label below disagrees with your app, follow the app.

## Your Bots, inside X Chat

The help page says you can chat with your Grok Bots in X Chat, in the X app on iOS and Android and on x.com. They are the same Bots you use in the Grok Bot app, not a separate X-only assistant.

It is rolling out gradually, so it may not show up for you yet even if your plan includes it. It also needs the latest version of the X app. If you don't see your Bots, update the app before you look for any other cause.

## Who can use it

Two things must be true.

**Your plan includes Grok Bot.** On The X Subscription that means Premium, Super, or Ultra. Plus does not include Grok Bot. Legacy Cursor plans and linked SuperGrok or X Premium+ accounts that include Grok Bot also work. [Episode 06](https://aitamer.news/posts/grok-bot-plans-pricing-usage/) covers which plan gives what.

**Your Grok account is connected to a Cursor account.** Connecting from X Chat works only for personal accounts. The help page lists three cases where it is not available:

- your email is on a domain your company manages,
- your Cursor account is on a team,
- your Cursor account is on a legacy request-based plan.

If a Cursor account already uses your email, you have to agree before it is connected. For work accounts, the help page's answer is plain: use Grok Bot in the Grok Bot app instead.

## When your Bot doesn't show up

The help page has a table of causes. Reordered here, roughly in the order worth checking:

- **Your Bots don't show up at all.** Update the X app to the latest version, then quit and reopen it.
- **Your plan doesn't include Grok Bot.** Choose Premium or higher on The X Subscription.
- **You've used up your Grok Bot usage.** The help page points to its article on how Grok Bot usage works.
- **Your Cursor account, or its team, uses Privacy Mode (Legacy).** Switch the account to Privacy Mode. On a team, a team admin changes the team's privacy setting.
- **Your Cursor account is on a legacy request-based plan.** Grok Bot isn't available on those plans.
- **Your email is on a company-managed domain, or your Cursor account is on a team.** Connecting from X Chat isn't available.
- **Your Grok account's email isn't verified.** Verify it on Grok, then try again.
- **More than one Cursor account uses your email.** Contact support with that email address.

If none of these match, the page says to contact support with your X handle and the email on your Grok account.

## You see a new Bot, or "Something went wrong"

One failure gets its own section, and it is the one people with several accounts will meet. X Chat uses the Grok account your X account is connected to. If you have more than one Grok account, that may not be the one you use with Grok Bot. Then you might see a new Bot instead of your own, or tapping your Bot shows **Something went wrong** and trying again doesn't help.

The fix is to connect your X account to the right Grok account. The help page's steps:

1. In a browser, sign in at `accounts.x.ai` with the Grok account you use with Grok Bot.
2. In the same browser, sign in to x.com with your X account.
3. Open `x.com/i/jf/grok/entry`, choose to link another account, and allow access for the Grok account you signed in with.
4. Quit and reopen the X app, or reload x.com, and open your Bots again.

There is one dead end. If that Grok account is already connected to a different X account, these steps don't work. Contact support with your X handle and the email on your Grok account.

## Letting a Bot read your messages

On 16 October the Grok Bot account [posted](https://x.com/bot/status/2111184282903523440): "Grok Bot can now read X Chat. Connect X, then ask Bot to work across your messages."

The docs describe the same path in terms of the X plugin. The [SpaceXSI apps page](https://docs.x.ai/grok-bot/computer-and-apps) says Bots can search and read public X without you connecting anything, and that this access is read-only and doesn't sign in as you. For your DMs, bookmarks, home timeline, or who liked your posts, you add the X plugin from **Connect apps** and sign in with X.

The Cursor [how-to page](https://cursor.com/help/grok-bot/how-to) adds the part that trips people up. The X plugin is only for account-private data, and it runs on your own X developer account, which needs X API credits. Public X stays built in and needs no credits.

If private requests fail after you connect X, the help page's steps are:

1. Open `console.x.com` and sign in with the same X account you connected in Grok Bot.
2. Check your X API credit balance. If it shows $0.00, add prepaid credits there. You buy these from X.
3. Retry the request in Grok Bot. You don't need to reconnect the plugin.

Reconnecting the plugin and changing your Grok Bot or Cursor plan do not add X API credits. The page calls this a known issue: connecting X does not always apply starter credits, so the console can show $0.00 until you add some.

## Who else gets your messages

The [Connect apps page](https://cursor.com/help/grok-bot/connect-apps) says a connected app is available to every Bot on that Grok Bot account. Connect X once, and every Bot on your roster can reach your DMs. A teammate's shared Bot asks before it uses your accounts.

So think before you connect. If one Bot handles your inbox and another runs public research, both can now read private conversations. That is often fine. It is a choice you should make on purpose, not one that happens because you connected X for a single task.

## Set the stop line in the request

The bigger risk is what a Bot does with what it read. The [SpaceXSI approvals page](https://docs.x.ai/grok-bot/approvals-security-and-privacy) says to tell the Bot which actions it can take and where it must stop, and it puts sending messages or invitations first on its list of actions that deserve an explicit boundary.

Write that into the ask:

> Read my X messages from the last two days. List the requests that need a reply from me, with who sent each and what they want. Draft nothing and send nothing.

When you do want replies, ask for drafts and approve each one. [Episode 12](https://aitamer.news/posts/grok-bot-privacy-security/) is the longer version of these rules.

## A pass you can do today

1. Update the X app, then open X Chat and look for your Bots.
2. If a new Bot appears instead of yours, run the four `accounts.x.ai` steps above.
3. Decide whether a Bot needs your private messages. If not, stop here: public X already works without connecting anything.
4. If it does, connect the X plugin from **Connect apps**, then check `console.x.com` for credits before your first request.
5. Ask for a read-only summary with "draft nothing and send nothing" in the request.
6. Remember that every Bot on the account can now read those messages.

After that, your Bots are one tap away in the app you already open, and you know exactly what you handed over.
