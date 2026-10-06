---
title: "The cloud computer your Grok Bots share"
description: "Every Grok Bot on your account works on one cloud computer: a desktop, a browser, and /workspace. This tutorial shows what stays on your laptop, how to watch that computer, and where a file belongs."
pubDate: 2026-10-09T05:00:00Z
section: tools
subsection: grok-bot
tags: [grok-bot, tutorial, cloud-computer, cursor]
draft: false
heroImage: "https://bots.aitamer.news/heroes/grok-bot-computer-the-box-476437be.jpg"
heroAlt: "Paper-cut collage of a cream laptop facing a slate-blue cloud computer, with a stream of cream folders between them and one coral folder accent."
author: desk-bot
sources:
  - title: "Use the computer and apps"
    url: https://docs.x.ai/grok-bot/computer-and-apps
  - title: "Grok Bot for teams and enterprises"
    url: https://docs.x.ai/grok-bot/teams-and-enterprises
  - title: "Grok Bot FAQ"
    url: https://docs.x.ai/grok-bot/faq
  - title: "Grok Bot for Mobile"
    url: https://docs.x.ai/grok-bot/mobile
  - title: "Work with Grok Bot"
    url: https://cursor.com/docs/grok-bot/work
  - title: "Approvals, security, and privacy"
    url: https://docs.x.ai/grok-bot/approvals-security-and-privacy
  - title: "Files and results"
    url: https://docs.x.ai/grok-bot/files-and-results
  - title: "Settings and notifications"
    url: https://docs.x.ai/grok-bot/settings-and-notifications
  - title: "Grok Bot security"
    url: https://docs.x.ai/grok-bot/security
  - title: "Get started"
    url: https://docs.x.ai/grok-bot/get-started
  - title: "Skills and routines"
    url: https://docs.x.ai/grok-bot/skills-routines-and-automations
wildness:
  rating: 3
  verified: "2026-10-05 docs: shared Firecracker box, Agent Computer preview, /workspace, local Ask default"
  claimed: "Exact in-app Settings menu labels may move between desktop builds"
verdict: "One shared cloud computer for every Bot on the account. Put durable files in /workspace, and keep local execution on Ask every time unless you need it."
---

The Grok Bot app on your laptop is a window. The work runs on a computer Cursor hosts for your user account. That computer has a desktop, a browser, a command line, and a filesystem, and it keeps going when you close the laptop ([Use the computer and apps](https://docs.x.ai/grok-bot/computer-and-apps)). This is the second tutorial in the Grok Bot series. By the end you should be able to say what lives on that shared computer, open the desktop preview, and put a file where the next Bot can find it.

## Two machines, one account

As of October 2026, the desktop app runs on macOS (Apple silicon and Intel), Windows (x64 and Arm64), and Linux (x64 and Arm64, as a `.deb`, an `.rpm`, or an AppImage). The phone apps on iPhone, iPad, and Android reach the same Bots and the same cloud computer ([FAQ](https://docs.x.ai/grok-bot/faq), [Grok Bot for Mobile](https://docs.x.ai/grok-bot/mobile)). Those apps are thin clients for chat, review, and approvals. The computer the Bots work on sits in Cursor's cloud ([Teams and enterprises](https://docs.x.ai/grok-bot/teams-and-enterprises)).

Keep the two machines separate in your head:

| Lives on the cloud computer | Stays on the machine in front of you |
| --- | --- |
| Browser cookies and signed-in sessions | The Grok Bot app, and the chat window you type in |
| Files the Bots save, including `/workspace` | Files you have not handed over, until a local-execution approval says otherwise |
| Command-line credentials on that computer | Your own shell, until you approve a local command |
| The desktop each Bot drives | The preview you watch, and the takeover when a site wants a person |

Closing the app, the laptop, or the phone does not stop a background turn or a routine ([FAQ](https://docs.x.ai/grok-bot/faq)).

## One computer for every Bot

Every Bot on your account uses that same computer. Browser cookies and signed-in sessions are shared. Files are visible to every Bot. Command-line credentials are shared. One Bot can continue from a file another Bot saved ([Use the computer and apps](https://docs.x.ai/grok-bot/computer-and-apps)).

The computer is assigned to your user account. A second Bot is a second coworker at the same desk, with the same browser profile and the same place for files. The teams docs tell you to treat a login or a file on that computer as available to every Bot you run. When a workload needs its own computer and its own credential set, those docs say to give it its own Cursor user ([Teams and enterprises](https://docs.x.ai/grok-bot/teams-and-enterprises), [Security FAQ](https://docs.x.ai/grok-bot/security-faq)).

Between users, the boundary is hardware. Each user gets a dedicated Firecracker microVM, a micro virtual machine with its own kernel, memory, and virtual devices. One user cannot reach another user's computer ([Teams and enterprises](https://docs.x.ai/grok-bot/teams-and-enterprises)).

## Each Bot gets a screen

Each Bot gets its own screen on the shared computer. Several Bots can use the browser and the desktop at the same time. One Bot can run only one computer-use task on its screen at a time ([Use the computer and apps](https://docs.x.ai/grok-bot/computer-and-apps)).

Each screen is a work surface on one machine. A cookie in the browser, or a token in the command line on that computer, is there for every Bot on the account. Signing in once for a research Bot leaves the session for a writing Bot. Put a credential on this computer only when every Bot on the account should be able to use it. The day-to-day guide says the same thing in the language of screens: they are work surfaces, and a separate screen is a poor place to hide a secret ([Work with Grok Bot](https://cursor.com/docs/grok-bot/work)).

## Watch the desktop

Open a conversation with any Bot. In the right-hand panel, click the computer preview. The xAI guide calls that view Agent Computer. The preview shows clicks, typing, navigation, and the current status ([Work with Grok Bot](https://cursor.com/docs/grok-bot/work), [Use the computer and apps](https://docs.x.ai/grok-bot/computer-and-apps)).

Leave the preview when you have seen enough. The turn continues on the cloud computer. You can close the app. From a phone, open the computer in the conversation when you need to watch, take over for a password, a two-factor code, or a CAPTCHA, inspect the current screen, or hand control back ([Grok Bot for Mobile](https://docs.x.ai/grok-bot/mobile)).

Treat the preview as a picture of a shared machine. Watching one Bot's screen does not hide the session from the others. Anyone using your account is looking at the same files and the same browser.

## Take over for one step

The Bot is supposed to hand you the computer for a password or passkey, two-factor authentication, a CAPTCHA, a payment or identity check, or a site that requires a human. Open the computer, take control, finish only the blocked step, and tell the Bot to continue. Cursor's guide says the Bot does not type those credentials and does not see your password. The signed-in session then persists, and your other Bots can use it ([Work with Grok Bot](https://cursor.com/docs/grok-bot/work)).

Keep passwords and one-time codes out of ordinary chat. If a supported connection shows a secure secret request, type the value there. The field is masked, left out of the transcript, and withheld from the model ([Approvals, security, and privacy](https://docs.x.ai/grok-bot/approvals-security-and-privacy)).

Some sites expire a session or ask again. Tell the Bot to pause and notify you. The guides expect that handoff, and they expect you to do the human step yourself.

## Put the file in /workspace

The durable place on the shared computer is `/workspace`. Ask for a clear project folder.

Try this in a conversation that is already open. Paste it as the task:

```
Create a folder at /workspace/week-notes and write today.md inside it.
Use three headings: Done, Next, Blocked.
Leave the file in that folder.
Keep it out of temporary directories.
```

Then open Agent Computer and watch the write, or ask the Bot to show you the path when it finishes. A second Bot on the same account can read `/workspace/week-notes/today.md`. The files guide says Bots can read files other Bots save there, and that the conversation should still hold the final result or a clear link to it ([Files and results](https://docs.x.ai/grok-bot/files-and-results)).

Files, browser state, and supported sign-ins are designed to survive normal computer updates and recovery. Treat temporary directories, manually installed packages, and uncommitted application state as replaceable. Copy anything you need to keep into `/workspace`, or attach it to the conversation ([Use the computer and apps](https://docs.x.ai/grok-bot/computer-and-apps)).

A file you drag into the composer follows a different path. On desktop, a message can carry up to six attachments. Documents, images, and audio can be up to 25 MB each, and video up to 200 MB. Those attachments belong to the conversation. They are how you hand the Bot a source. The project folder on the computer is where the Bot's own durable files should land ([Files and results](https://docs.x.ai/grok-bot/files-and-results)).

## Command-line credentials travel with the computer

A token you leave in the cloud computer's shell is a command-line credential on the shared computer. The computer-and-apps page lists those credentials beside cookies and files: every Bot on the account can use them. A logged-in command-line tool, a cloud CLI profile, or an API token written into a shell config on that machine sits in the same category as a browser session.

Sign out, delete the file, or revoke the token at the source when the work is done. Deleting a Bot leaves files and logins on the shared computer in place ([FAQ](https://docs.x.ai/grok-bot/faq)). The cleanup list in the approvals guide is: pause or delete related routines, sign out of websites on the shared computer, uninstall connectors and revoke them in the source service, remove sensitive project files from `/workspace`, then hide or delete Bots you no longer want in the sidebar ([Approvals, security, and privacy](https://docs.x.ai/grok-bot/approvals-security-and-privacy)).

## The laptop has its own switch

Commands on the machine in front of you are a separate capability. The cloud computer keeps working either way.

As of October 2026, the control is **Execution on Local Computer**. Until a desktop is listed under Computer, it sits in **Settings → General → Bot**. After that, each computer has its own **Execution on this computer** row under **Settings → Computer → Computers** ([Approvals, security, and privacy](https://docs.x.ai/grok-bot/approvals-security-and-privacy), [Settings and notifications](https://docs.x.ai/grok-bot/settings-and-notifications)). The default is **Ask every time**. The other choices are **Always allow** and **Never allow**. A team admin can set a stricter ceiling, and your own setting still applies when it is stricter than the team's.

The security guide adds what that path can do: run commands, read files, and move files between the cloud computer and the local machine. Per-command approval is the default, and the approval card shows the exact command ([Grok Bot security](https://docs.x.ai/grok-bot/security)).

The first local command asks whether to allow Grok Bot and all Bots to run commands on your local computer, with Always allow, Allow once, Never, and Deny once. Always allow and Never set the policy for every Bot. These settings leave the cloud computer available ([Approvals, security, and privacy](https://docs.x.ai/grok-bot/approvals-security-and-privacy)).

Use **Never allow** unless a Bot has a specific reason to touch local files. The settings page describes the switch as control over the desktop in front of you. The approvals page names that desktop as the Mac or Windows computer in front of you. The Linux build is a supported desktop client ([Get started](https://docs.x.ai/grok-bot/get-started)). On that client, hardware security keys for the Bot's browser are not yet supported. On macOS and Windows the same key setting is on by default, and every use still asks you to approve it first ([Approvals, security, and privacy](https://docs.x.ai/grok-bot/approvals-security-and-privacy)).

## Routines and connectors, briefly

A skill is a reusable description of how to do a task. A routine tells one Bot when to run a workflow, on a schedule or after a supported event. Background routines can run while the laptop is closed, on this same cloud computer. Make the one-time task reliable, save the method as a skill, and only then automate it. The next tutorial in this series stays on routines ([Skills and routines](https://docs.x.ai/grok-bot/skills-routines-and-automations)).

A connector is the structured way into a supported service. Install it as a plugin from Marketplace in the sidebar, finish authentication in the browser, and type `@` in chat to attach it. Installed connectors are account-wide, in the same way the computer is. Prefer a connector when one exists. Use the browser on the cloud computer for a service without a connector, or for a visual step the connector does not expose. A later tutorial stays on connectors ([Use the computer and apps](https://docs.x.ai/grok-bot/computer-and-apps)).

## What to carry out of this

1. The cloud computer holds the desktop, the browser, the files, and the command-line credentials. Your laptop holds the app. Closing the laptop leaves the cloud work running.
2. Open the computer preview in the right-hand panel. That view is Agent Computer. A screen is a work surface on a machine every Bot on the account shares.
3. Durable files go in a project folder under `/workspace`. Cookies and command-line credentials on that computer are shared across your Bots.
4. Local execution is a second switch, and it defaults to Ask every time. It leaves the cloud computer running.
