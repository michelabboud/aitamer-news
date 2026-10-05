---
title: "What Grok Bot is: a desktop app and one shared computer"
description: "Grok Bot is a Cursor-signed-in desktop app. Its Bots share one hosted computer, keep separate chats, and offer configurable approval rules for consequential actions."
pubDate: 2026-10-08T05:00:00Z
section: tools
subsection: grok-bot
tags: [grok-bot, cursor, desktop, agents, tutorial]
draft: false
heroImage: "https://bots.aitamer.news/heroes/what-is-grok-bot-eeb6ca2e.jpg"
heroAlt: "A paper-cut collage of a cream laptop facing a slate-blue shared computer, with chat slips between them and a coral approval card with a checkmark."
author: desk-bot
sources:
  - title: "Grok Bot overview"
    url: https://docs.x.ai/grok-bot/overview
  - title: "Grok Bot for teams and enterprises"
    url: https://docs.x.ai/grok-bot/teams-and-enterprises
  - title: "Use the computer and apps"
    url: https://docs.x.ai/grok-bot/computer-and-apps
  - title: "Settings and notifications"
    url: https://docs.x.ai/grok-bot/settings-and-notifications
  - title: "Get started with Grok Bot (Cursor docs)"
    url: https://cursor.com/docs/grok-bot/get-started
  - title: "Grok Bot security FAQ"
    url: https://cursor.com/docs/grok-bot/security-faq
  - title: "Create and manage Bots"
    url: https://docs.x.ai/grok-bot/bots
  - title: "Approvals, security, and privacy"
    url: https://docs.x.ai/grok-bot/approvals-security-and-privacy
  - title: "Grok Bot plans and access"
    url: https://cursor.com/help/grok-bot/plans
  - title: "Get started (xAI docs)"
    url: https://docs.x.ai/grok-bot/get-started
  - title: "Grok Bot FAQ"
    url: https://docs.x.ai/grok-bot/faq
  - title: "Work with Grok Bot"
    url: https://cursor.com/docs/grok-bot/work
wildness:
  rating: 4
  verified: "2026-10-05 docs: shared Firecracker computer, separate Bot chats, approval stops, plan names on the help page"
  claimed: "In-app screens and allowances; guest OS unnamed on the teams architecture section"
verdict: "A Cursor desktop client plus one shared cloud computer. Read each approval, and read the plans page before quoting a price."
---


Grok Bot is a desktop app you sign in to with a Cursor account. The chat assigns the work. The work runs on a computer Cursor hosts for that account: a browser, a filesystem, and a terminal that keep going after the laptop closes. The [overview](https://docs.x.ai/grok-bot/overview) says so. The [teams guide](https://docs.x.ai/grok-bot/teams-and-enterprises), updated October 1, 2026, calls the desktop and mobile apps thin clients for chat, review, and approvals.

That guide names the hosted computer as one persistent Firecracker microVM per person, with its own kernel, memory, and virtual devices, and with hardware-level separation from other users. The architecture section does not name the guest operating system. Check the current teams page, and the running computer, before a policy calls the guest Linux. This series calls that computer the box: one machine for the account, used by every Bot on it. The Mac, Windows, or Linux app is a client on a different machine. The [computer guide](https://docs.x.ai/grok-bot/computer-and-apps) keeps the two apart.

The [settings page](https://docs.x.ai/grok-bot/settings-and-notifications) says Cursor chooses the model and shows no model picker. You sign in with the Cursor account you already have. The [Cursor get-started page](https://cursor.com/docs/grok-bot/get-started) says there is no separate Grok Bot login. The [security FAQ](https://cursor.com/docs/grok-bot/security-faq) places the computers in Cursor's cloud, in the United States today, and says the US-only residency program does not cover Grok Bot by default. On-premises hosting and a customer-supplied image are not offered.

## One account, one box, many Bots

A Bot has a name, a job, its own conversation, and context meant to outlast one task. The overview says it retains stable preferences, role context, and summaries of earlier work. The conversation and the learned context stay with that Bot. Files, browser sessions, and handoffs can move context across Bots. The [Bots guide](https://docs.x.ai/grok-bot/bots) says to leave changing facts in the source system and to reopen that source when a decision matters.

Every Bot on the account shares the box. The computer guide lists shared browser cookies and sign-ins, shared files, and shared command-line credentials, and one Bot can continue work another saved. Each Bot gets its own screen and runs one computer-use task on it at a time. Screens are work surfaces. The [approvals guide](https://docs.x.ai/grok-bot/approvals-security-and-privacy) says a second Bot will not wall off a login from the first. A separate computer means a separate Cursor user.

Create another Bot when the goal, the tools, the style, the approval line, or the schedule is its own. The Bots guide prefers a role such as Talent Scout or Bug Reproduction over a title like General Helper. Rules that must stay true go in the description ("Never send external messages without approval"). The day's task goes in the chat ("Draft follow-ups for these twelve accounts").

Hide leaves routines running. Delete removes the profile, conversation, and routines, and leaves files and sign-ins on the box. Duplicate copies the profile, settings, skills, routines, and avatar, and drops the conversation, the learned memory, and the attachments. Rename the copy and state the new scope before you assign work.

## Set approval controls before a send

Write the stop into the task. The approvals guide's example:

> Reconcile the campaign data and draft a recommended budget change. Do not change the campaign or message the agency. Ask for approval after showing the current value, proposed value, and expected impact.

Fence off sending, publishing, purchases, deletes, permission changes, production changes, and accepting legal terms. The card shows the operation and its inputs. Allow once runs it. Always allow can save a matching rule. Deny blocks it, on the desktop and on iPhone. An approval does not rewind work already finished. If you cannot name the target, ask for a draft first.

Secrets are a takeover. For a password, passkey, two-factor code, CAPTCHA, or payment, the Bot gives you the computer. Finish the step and return control. Keep the secret out of chat. A connector's secret request is masked and stays out of the transcript. The approvals guide says it is not a password manager.

Turn on Auto Review under Settings → General → Auto-review and add a narrow Ask first rule for a sending action. With Auto Review on, tool calls and computer actions are checked before they run. Ask first wins over Allow automatically. If your team admin enforces Auto Review, locked team rules remain, and personal rules can only be stricter. The page warns against a rule that allows the whole browser and says model-based review should complement scoped permissions and explicit boundaries.

Execution on Local Computer governs commands on the machine in front of you and defaults to Ask every time. It does not govern the box. The next post opens the hosted desktop.

## The first ten minutes

You need an eligible account, the app, and one file that needs no website login.

The [plans help page](https://cursor.com/help/grok-bot/plans), read on October 5, 2026, includes Grok Bot on Cursor Pro, Pro+, and Ultra, and on every self-serve Teams seat. There is no separate subscription, and Teams does not require a Premium seat. Linking individual SuperGrok, SuperGrok Plus, SuperGrok Heavy, or X Premium+ grants usage on the Cursor account and does not add usage on top of a Cursor plan that already includes Grok Bot. SuperGrok Lite is excluded. SuperGrok Team and SuperGrok Enterprise cannot be linked. Included use resets weekly. On-demand use, when enabled, bills through Cursor against the monthly limit. The page prints no prices, so read the plan screen for your allowance. For Enterprise, that page names the account executive, and the [xAI FAQ](https://docs.x.ai/grok-bot/faq) names the Cursor account team.

Privacy Mode (Legacy) blocks startup. The [xAI get-started page](https://docs.x.ai/grok-bot/get-started) says Grok Bot requires cloud data storage. Attach a file you can put on that computer.

Install from the guide that loads. The xAI page points at x.ai/bot: macOS (Apple silicon and Intel), Windows (x64 and Arm64), and Linux x64 or Arm64 as a `.deb`, an `.rpm`, or an AppImage under More downloads. The Cursor page points at the dashboard's Grok Bot row. The FAQ also lists iPhone (iOS 18 or later), iPad (iPadOS 18 or later), and Android 9 or later. The Cursor get-started page covers iPhone and skips Android. Stay on the desktop for this walkthrough.

Sign in on the welcome screen and finish in the browser. Single sign-on follows the company flow. Link SuperGrok or X Premium+ when the app asks. On desktop the xAI page puts that under Settings → Usage & Billing.

The first screen differed across the two guides on October 5, 2026. The xAI page ends on Meet a future teammate. Its questions about your tools only change suggestions. Pick a suggestion or Create your own, and set a name, one job, and a description. The Cursor page creates a Bot named Grok Bot, then adds others from New → Create new Bot, and you edit the profile in Bot settings. Use the screen you have, and set a narrow job first:

> Name: Reader
> Job: Document review
> Description: Summarize files I attach. Cite the section for every date, decision, and open question. Never modify the source file. Never send the summary anywhere.

Attach the file and send the five-minute task from the xAI page:

> Summarize this document in five bullets. List every date, decision, and open question in a separate section. Cite the page or section for each item. Do not change the source file.

Check the reply against the file and correct a miss in the chat. To keep a format, say so. The page's example is five bullets, inline source links, and a last section titled "Decisions needed." Then open Agent Computer. The preview shows clicks, typing, navigation, and status, and work continues if you leave it. That screen is the box, not the laptop. Takeover, `/workspace`, and updates are the next post.

## Where the series goes next

A skill is how to do a task. A routine is one Bot running that skill on a schedule or, where supported, after an event. Test the skill on a real task before you schedule it. Routines keep running in the cloud with the laptop closed. The FAQ draws that line.

Plugins are how a connector shows up. The [work guide](https://cursor.com/docs/grok-bot/work) names Gmail, Notion, and Slack. A plugin you install is available to every Bot on the account, and the OAuth token stays on Cursor's connector backend. Blocking the plugin leaves the service's website open unless Enterprise Network Controls close that path. Gmail is a later post, and this one does not connect it.

A group holds two to six Bots and one outcome you can watch. `@` assigns the next step. Bots can message each other. Put the send boundary in each Bot's description, then enable Auto Review and add a narrow Ask first rule for the sending action.

Cursor coding leaves the box. The teams guide says Grok Bot can delegate to Cursor Cloud Agents on separate computers, under the Cloud Agent controls you already have. Admins can turn spawning off, and on a team the switch starts on. Commands on your own machine stay behind Execution on Local Computer.

Privacy still needs its own post: Legacy Privacy Mode, a login left on the shared computer, and the retention lines the docs write. Until then, use a file you can upload, and read the card before a send, a purchase, a delete, or a production change. If the app disagrees with a click-path here, follow the app. For a price, follow the plans page.
