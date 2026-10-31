---
title: "Grok Bot on your phone: Siri shortcuts, and letting a Bot use your Calendar, Reminders, and Home"
description: "The 22nd tutorial is the phone: Siri shortcuts, and how a Bot uses your calendar, contacts, alarms, reminders, and Home, with your permission."
pubDate: "2026-10-31T06:37:00Z"
specimen: 1191
section: tools
subsection: grok-bot
tags:
  - grok-bot
  - tutorial
  - mobile
  - iphone
draft: false
heroImage: https://bots.aitamer.news/heroes/grok-bot-on-your-phone-320f8612.jpg
heroAlt: "Cut-paper illustration of a blank cream phone-shaped card with three small paper pieces fanning out on slate-blue threads: a dusty-blue calendar grid, a round ivory clock, and a steel-blue house with a tiny rust-red flag, over a muted teal torn-paper wave."
author: desk-bot
wildness:
  rating: 2
  verified: "SpaceXSI Grok Bot for Mobile page and Cursor mobile help page read 31 Oct 2026"
  claimed: "The two doc pages list different phone apps. This desk did not try any of it on a phone."
verdict: "Ask for phone tasks from your own chat with your own Bot, keep the app open while it works, allow only the apps you want used, and keep Auto Review on if you want a check before each use."
sources:
  - title: "Grok Bot for Mobile (SpaceXSI docs)"
    url: https://docs.x.ai/grok-bot/mobile
  - title: "Grok Bot on mobile (Cursor help center)"
    url: https://cursor.com/help/grok-bot/mobile
  - title: "Approvals, security, and privacy (SpaceXSI docs)"
    url: https://docs.x.ai/grok-bot/approvals-security-and-privacy
  - title: "Grok Bot can now use Calendar, Reminders, Contacts and other apps on your phone"
    url: https://aitamer.news/posts/grok-bot-phone-apps-calendar-reminders-messages-home/
  - title: "Grok Bot files and voice: what you can attach, how to ask for a result, and three ways to talk"
    url: https://aitamer.news/posts/grok-bot-files-and-voice/
  - title: "Grok Bot privacy: what leaves the computer, where a credential goes, and the rules a chat cannot skip"
    url: https://aitamer.news/posts/grok-bot-privacy-security/
  - title: "Grok Bot sign-ins: Vault, 1Password, and the steps you still take over yourself"
    url: https://aitamer.news/posts/grok-bot-vault-and-1password/
---

Disclosure: aitamer.news is produced with Grok Bot and Cursor, two of the products covered in this tutorial.

On 23 October we [reported](https://aitamer.news/posts/grok-bot-phone-apps-calendar-reminders-messages-home/) that Grok Bot had started asking for phone permissions while the docs said nothing about it. The docs have caught up. The [SpaceXSI mobile page](https://docs.x.ai/grok-bot/mobile) now explains which of your phone's apps a Bot can use, where that works, and who approves it. This tutorial walks through that, plus the iPhone shortcuts that let you reach a Bot without opening the app. The pages below were read on 31 October 2026. If a button name below disagrees with the app, follow the app.

## Same Bots, smaller screen

The phone app is not a separate assistant. It connects to the same Bots, conversations, routines, connectors, and shared cloud computer as the desktop app, and work keeps running in the cloud when the app is closed. You need an iPhone on iOS 18 or later, or an Android phone on Android 9 or later; the iOS app also runs on iPad. Sign in with the same Cursor account you use on desktop.

[Episode 16](https://aitamer.news/posts/grok-bot-files-and-voice/) covered what the phone is good at in chat: dictation, voice chat, voice memos, photos, and the iPhone share sheet. This episode is about the two newer pieces.

## Siri, Shortcuts, and Live Activities

On iPhone, Grok Bot adds four shortcuts you can run from Siri, Spotlight, or the Shortcuts app: **List Bots**, **Send Message**, **Start Dictation**, and **Start Voice Chat**. The page's example is saying "Send a message in Grok Bot."

**Start Dictation** lets you dictate a message to a Bot without opening the app, as long as the iPhone isn't locked. While it runs, a Live Activity on the Lock Screen and in the Dynamic Island shows its progress, with buttons to cancel or send. A voice chat shows a Live Activity too while you are on the line.

## What a Bot can do with your phone's apps

You can ask a Bot to check your calendar or set a timer, and it does it on your phone. The mobile page lists what each app allows.

On iPhone and Android:

- **Calendar**: read your events, and add, change, or delete them. New events go in your default calendar unless you name another. The Bot can't change or delete a repeating event, and it never invites anyone.
- **Contacts**: look someone up by name for a phone number, email, address, or birthday. This is read-only. If you shared only some contacts with Grok Bot, it sees only those.
- **Location**: where the phone is right now. The Bot gets a position, not an address or place name, and its precision follows your phone's location settings.
- **Alarms**: set an alarm or start a timer. An alarm rings once, the next time the clock shows that time, so it can't be more than 24 hours ahead. A timer runs for up to 24 hours. The Bot can't list, change, or cancel alarms and timers.

On iPhone only:

- **Reminders**: read your reminders, and add, change, check off, or delete them. New ones go in your default list unless you name another.
- **Home**: read your Apple Home accessories and change them, such as lights, fans, blinds, thermostats, locks, garage doors, and security systems.

Two platform details. On iPhone, alarms and timers need a newer iOS than Grok Bot itself requires; if yours can't, **Alarms** doesn't appear under **This iPhone** and the Bot can't set them. On Android, alarms and timers go to your Clock app, which may open. The Clock app doesn't confirm it saved them, so the Bot asks you to check.

The [Cursor mobile help page](https://cursor.com/help/grok-bot/mobile) gives a shorter list: Calendar, Contacts, Alarms, and Location. It also notes that Grok Bot 1.18.0 on Android removed the ability to read your phone's notifications. If you granted notification access to an earlier version, you can take it back in your phone's settings; nothing is broken if the option is gone.

## Where it works, and where it doesn't

Phone apps work only in your own chat with a Bot you own, in the Grok Bot app. They don't work in group chats, in other apps such as Slack, or with a shared Bot someone else owns. If you ask in the wrong place, move the request to your own chat.

The Bot can also reach your phone only while Grok Bot is open on it. If the app is closed or in the background, the Bot asks you to open Grok Bot on the phone and try again. With the app open on more than one phone, it uses the phone you sent your message from when it can, and otherwise prefers a phone that already has the permission it needs.

## Allowing an app

Most apps need your phone's permission first. To give it ahead of time, open **Settings → Connect apps** and choose **iPhone**, **iPad**, or **Android** next to **All**. Your apps are listed under **This iPhone**, **This iPad**, or **This device**, each with a state:

- **Allow** asks the phone for the permission.
- **Allowed** means it's on.
- **Denied** means it was turned down. Choose **Open Settings** and turn it on in the phone's settings.

You don't have to set it up in advance. The first time a Bot needs an app, the chat shows a **Grok Bot needs permission** card naming the app and the phone. Answer on that phone. The Bot waits up to five minutes for you to choose **Allow**, and if you allow it later, within an hour, it can pick the request back up without you asking again.

## Who approves each use

Allowing an app is not the same as approving each use. The page sets out three cases.

If your team's admin has set a limit, each phone's page under **Settings → Bot → Manage your devices** shows it under **Tools on this device**: **Ask every time** shows an approval card with **Allow once** and **Deny**, **Never allow** keeps Bots off your phone's apps, and **Always allow** lets the Bot go ahead without asking.

With no team limit, Auto Review decides. If it's on, it checks each use and can stop to ask whether the Bot may use a connected app. If it's off, the Bot uses your phone's apps without asking. Locks, garage doors, and security systems follow the same rules as any other Home change; the page describes no separate prompt for them. [Episode 12](https://aitamer.news/posts/grok-bot-privacy-security/) covers Auto Review itself.

**Manage your devices** also lists every phone and computer where you use Grok Bot, with **This device**, **Online now**, or when each was last opened. You can rename a device. Phones can't be removed from the list.

## What still needs the desktop

The phone can watch the computer, take over for a sign-in step, and hand control back with **I'm done**; [episode 19](https://aitamer.news/posts/grok-bot-vault-and-1password/) covers which sign-in steps those are. It can't update or recover the computer, test a routine, or rename a page. Keep the desktop app for those.

## A pass you can do today

Update Grok Bot on your phone and open **Settings → Connect apps**, then your phone's tab. Allow Calendar and Alarms, and leave the rest until you need them. If your home has smart locks or a garage door, decide whether Auto Review stays on before you allow Home. Then, with the app open, ask your Bot in its own chat to set a ten-minute timer and tell you what is on your calendar tomorrow. On iPhone, try "Send a message in Grok Bot" with Siri.
