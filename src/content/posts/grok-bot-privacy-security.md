---
title: "Grok Bot privacy: what leaves the computer, where a credential goes, and the rules a chat cannot skip"
description: "The twelfth tutorial is the boundary: what leaves the computer, where a credential belongs, and which rules a chat cannot skip."
pubDate: "2026-10-21T06:07:00Z"
section: tools
subsection: grok-bot
tags:
  - grok-bot
  - tutorial
  - privacy
  - security
draft: false
heroImage: https://bots.aitamer.news/heroes/grok-bot-privacy-security-88cfd63c.jpg
heroAlt: "A cut-paper scene: a cream sealed envelope sits half out of the slot of a closed slate-blue box, a small rust-red key rests on cream paper beside it, and torn slate and cream paper layers fill the top left."
author: desk-bot
wildness:
  rating: 2
  verified: "Security, teams, approvals, secrets and how-to pages read 21 Oct 2026: three outbound paths, Ask first wins"
  claimed: "The reader supplies the mailbox to disconnect and the rule text. No audit export from this desk is attached."
verdict: "Read the three ways work leaves the computer, put secrets in the masked card, and keep Ask first on a send. A later chat line does not retire those checks."
sources:
  - title: "Grok Bot sending: the draft card, one Gmail mailbox, and an address at mail.grokbot.com"
    url: https://aitamer.news/posts/grok-bot-gmail-and-sending/
  - title: "Grok Bot security (Cursor docs)"
    url: https://cursor.com/docs/grok-bot/security
  - title: "Grok Bot security (SpaceXSI docs)"
    url: https://docs.x.ai/grok-bot/security
  - title: "Grok Bot security FAQ (Cursor docs)"
    url: https://cursor.com/docs/grok-bot/security-faq
  - title: "Approvals, security, and privacy (SpaceXSI docs)"
    url: https://docs.x.ai/grok-bot/approvals-security-and-privacy
  - title: "Grok Bot for Teams and Enterprise (Cursor docs)"
    url: https://cursor.com/docs/grok-bot/teams
  - title: "Store secrets securely (Cursor help center)"
    url: https://cursor.com/help/grok-bot/secrets
  - title: "Grok Bot How Tos (Cursor help center)"
    url: https://cursor.com/help/grok-bot/how-to
  - title: "Work with Grok Bot (Cursor docs)"
    url: https://cursor.com/docs/grok-bot/work
  - title: "Settings and notifications (SpaceXSI docs)"
    url: https://docs.x.ai/grok-bot/settings-and-notifications
  - title: "The cloud computer your Grok Bots share"
    url: https://aitamer.news/posts/grok-bot-computer-the-box/
  - title: "Grok Bot on a team: who already has it, what an admin can lock, and a role that stops at a draft"
    url: https://aitamer.news/posts/grok-bot-for-business/
---

Episode 11 ended on a draft you press yourself. This tutorial is the rest of the boundary: what leaves the hosted computer, where a credential belongs, and which rules a later message cannot skip. [Episode 02](https://aitamer.news/posts/grok-bot-computer-the-box/) is the computer. [Episode 09](https://aitamer.news/posts/grok-bot-for-business/) is the admin page.

Disclosure: aitamer.news is produced with Grok Bot and Cursor, two of the products covered in this tutorial.

## What leaves the computer

The [Cursor security page](https://cursor.com/docs/grok-bot/security), read 21 October 2026, draws three paths. The desktop and mobile apps send each request to Cursor's servers. Work then runs on your hosted computer. Prompts go to model providers. Tool calls reach third-party services through connected apps. The [teams page](https://cursor.com/docs/grok-bot/teams) gives each person one Firecracker microVM that no other user can reach. Every Bot on the account shares it, including logins and files.

OAuth tokens stay on Cursor's connector backend. The Bot calls the tool without receiving the token, and the token is never stored on the computer. Blocking a plugin leaves that service's website open. Closing it takes Network Controls, Enterprise only. Self-serve Teams have no destination list, so computers default to allow-all. Restricting egress limits where data can be sent. Dedicated per-customer addresses are not available. The shared static ranges come from your account team. Computers run in the United States today. Cursor's US-only data residency program does not apply to Grok Bot by default.

Both security pages say there is no model picker. With Privacy Mode enabled, customer data is not used for training. The teams page adds that Cursor enforces this on its servers, and that an unverifiable setting defaults to not training. Under Zero Data Retention, providers do not keep prompts or outputs. Abuse and safety classifiers may store flagged data. A contract that restricts subprocessors goes to the account team. The pages disagree on the model allowlist: Cursor says it does not govern Grok Bot and records usage as Grok Bot usage, not by model. SpaceXSI says the allowlist is Enterprise only, enforcement is not guaranteed, and analytics show the serving model. [Episode 06](https://aitamer.news/posts/grok-bot-plans-pricing-usage/) is the meter.

Local execution reaches the machine in front of you. The card shows the exact command. Choose **Ask every time**, **Always allow**, or **Never allow**. Prefer **Never allow** unless a Bot should touch local files. A stricter personal setting still applies under an admin ceiling, and the cloud computer keeps working. The label is **Execution on Local Computer**, or **Execution on this computer** once registered.

Action Recording is Enterprise only and off by default: metadata, not the message. Commands are secret-scrubbed, browser addresses drop query strings and credentials, and computer-use records skip screenshots and typed text. The Cursor security page keeps that store 90 days, says Privacy Mode (Legacy) forces recording off, and leaves the events off the Audit Log page. The SpaceXSI page adds **Conversation content export**, absent from that Cursor logging section. It stays off until an admin allows it for a destination, and it can then send prompts, responses, and hosted tool-call arguments and results. Known credential shapes, PEM blocks, and email addresses are redacted. The page says the match cannot catch every secret. Chats sit outside the computer. The [work page](https://cursor.com/docs/grok-bot/work) says a reset leaves them in place.

## Where a credential goes

Keep passwords, API keys, and one-time codes out of chat, Shell, and ordinary files. When a Bot asks for a secret, the [secrets page](https://cursor.com/help/grok-bot/secrets) is the path. The field on the secure card is masked. Choose **Save securely**. The card says **Saved** and **Saved securely and kept private**. The value is not written into the chat. The footer says **Stored securely, never shown to your Bot**. Saved values are write-only. A blank field later is not proof the secret was deleted.

On a Team Bot you own, **Add secret** takes an environment variable name, a short description, and the value. Teammates' chats can use it. The description is visible. The value is not, and **Replace value** is how you change it. A setup-script license is a **Team Secret** an Enterprise admin stores, and it never reaches your Bots directly. Leave secrets out of **Teach a task**, which records the screen.

For a password, passkey, two-factor code, CAPTCHA, or payment, the how-to card says **Action needed**. Choose **Take over**, finish the step, then **I'm done**. The Bot does not see the password, and the session stays for every Bot on the account until it expires. Fingerprint, Face ID, Windows Hello, and passkeys stored on your phone or laptop do not work there. Choose **Skip** if you do not want to sign in now. A YubiKey uses **Use hardware security keys** under **Settings**, **General**, **Security Key**, and each use asks you to approve it. The [approvals page](https://docs.x.ai/grok-bot/approvals-security-and-privacy) says that switch defaults on for macOS and Windows, and that Linux is not supported yet.

A page that needs a login, a checkout address, or a phone number can show one form per step and fill your answers in. That form is separate from the secret card. A password still belongs on **Take over** or in the masked card. **Filled into the page** means the value was not shown to the Bot.

## Auto-review

Auto Review evaluates shell commands, plugin calls, computer use, automation writes, and delegation such as a Cloud Agent or subagent launch. It can proceed, ask, or deny. It does not review memory writes or most settings changes.

The how-to card says **Review an action**. **Allow once** runs it this time. **Always allow** can save a matching rule. **Deny** blocks it. The same three are on iPhone. An approval does not undo finished work. Do not approve a card whose target you cannot identify.

Help puts the switch at **Settings**, then **Bot**, under **Custom Rules**. The docs put the rules at **Settings**, then **General**, then **Auto-review**. Follow the screen. **Required by your admin** means you cannot turn the switch off.

**Ask first** always stops a match. **Allow automatically** proceeds only when the review finds no other reason to stop, and **Ask first** wins if both match. Use a narrow line, such as "ask first before sending any external email." Avoid a broad browser rule, and keep the stop in the request as well.

**Enforce Auto-review** is Enterprise only and off by default. While it is on, members cannot turn Auto-review off, unless a group lifts the lock with **Don't enforce for this group**. Team rules appear locked. Personal rules on top can only be stricter. Turning enforcement off stops applying the team rules. The Cursor security page says a personal rule is saved to the account and applies on every desktop and on mobile. The SpaceXSI security page and its settings page say it lives on the current desktop, synced to that desktop's computer, so another desktop needs its own. Follow the screen.

A card in a chat you are in waits. A card from a routine, a trigger, or another Bot expires after about 10 minutes, shows **Expired**, and does not run. **Always allow this in the future** on that card adds an **Allow automatically** rule and does not run the expired action. Ask the Bot to try again, and turn notifications on for routines.

## Rules a chat cannot skip

The mail stop is [episode 11](https://aitamer.news/posts/grok-bot-gmail-and-sending/). On mail.grokbot.com, a chat line, a routine, and text inside a received email do not press **Send**.

Web pages, plugin results, command output, and other people's email are marked untrusted. The defenses reduce that risk and do not remove it, so a send, a purchase, a delete, and a production change stay on a card.

**Team Rules** scoped to Grok Bot are always required. The teams page's example is "never move company data to personal accounts." They guide the Bot. Approval is the Auto-review rule. Without **Enforce Auto-review**, a Team Bot in a teammate's chat or in Slack runs where nobody can answer a card. Memory is not a stop either. Back the boundary with a rule, not with a remembered line. "Stop now" ends the turn and leaves a finished action as it is.

## A pass you can do today

1. Open Auto-review. If it says **Required by your admin**, leave the switch.
2. Add one **Ask first** rule: ask first before sending any external email.
3. Disconnect a plugin, and sign the browser out, when that account should not be available to every Bot you run.
4. Put the next API key in the secret card.
5. On an expired card, read **Always allow this in the future** before you use it. It saves a rule and does not finish that action.

To take access back, pause the routines, revoke the connector in the source service, clear sensitive files from `/workspace`, and hide or delete Bots you no longer want listed. Deleting a Bot leaves the files and the browser sessions. Hibernation is not deletion. Under the Data Processing Agreement, data is deleted or returned within 30 days of written direction after the service ends.

Episode 13 is the first sitting, and the index of episodes 01 through 12.
