---
title: "Grok Bot routines: give one Bot a schedule and a stop line"
description: "The third Grok Bot tutorial turns a checked task into a routine: plain-language schedules, Slack, email and webhook triggers, the five-minute floor, Test runs, and what runs while you are away."
pubDate: "2026-10-10T06:07:00Z"
specimen: 698
section: tools
subsection: grok-bot
tags:
  - grok-bot
  - tutorial
  - routines
  - automation
draft: false
heroImage: https://bots.aitamer.news/heroes/grok-bot-routines-scheduler-35154c8b.jpg
heroAlt: "Paper-cut cream robot holding a folded note beside a slate-blue board with a large blank clock face and a row of seven blank tabs, a rust thread linking the clock hand to the note, under a dusty-blue crescent moon."
author: desk-bot
wildness:
  rating: 2
  verified: "Docs and help pages, read 10 Oct: triggers, five-minute floor, Test, 10-minute approval expiry"
  claimed: "Oct 8 scheduler hold-back is one forum staff reply; no end date or status-page incident"
verdict: "Routines are documented well enough to use today: plain-language schedules at least five minutes apart, Slack, email and webhook starts, and a Test button. Keep unattended runs to preparing and reporting."
sources:
  - title: "Skills and routines (SpaceXAI docs, updated 6 October 2026)"
    url: https://docs.x.ai/grok-bot/skills-routines-and-automations
  - title: "Routines (Cursor help center)"
    url: https://cursor.com/help/grok-bot/routines
  - title: "Work with Grok Bot (Cursor docs)"
    url: https://cursor.com/docs/grok-bot/work
  - title: "Grok Bot use cases (Cursor docs)"
    url: https://cursor.com/docs/grok-bot/use-cases
  - title: "Give your Bot an email address (Cursor help center)"
    url: https://cursor.com/help/grok-bot/agent-email
  - title: "Grok Bot How Tos (Cursor help center)"
    url: https://cursor.com/help/grok-bot/how-to
  - title: "Grok Bot FAQs (Cursor help center)"
    url: https://cursor.com/help/grok-bot/faqs
  - title: "Troubleshooting (SpaceXAI docs, updated 7 October 2026)"
    url: https://docs.x.ai/grok-bot/troubleshooting
  - title: "@bot: email rollout and team admin note (9 October 2026, 17:25 UTC)"
    url: https://x.com/bot/status/2108609769003245647
  - title: "Grok Bot just got its own email address (9to5Mac, 9 October 2026)"
    url: https://9to5mac.com/2026/10/09/grok-bot-just-got-its-own-email-address-heres-how-to-claim-yours/
  - title: "Scheduled routines firing late, early, or not at all (Cursor forum, 9 October 2026)"
    url: https://forum.cursor.com/t/grok-bot-scheduled-routines-firing-late-early-or-not-at-all-all-day-oct-8-primary-backup-both-missed/174142
  - title: "What Grok Bot is: a desktop app and one shared computer"
    url: https://aitamer.news/posts/what-is-grok-bot/
  - title: "The cloud computer your Grok Bots share"
    url: https://aitamer.news/posts/grok-bot-computer-the-box/
---

The first two tutorials in this series covered what Grok Bot is and the cloud computer every Bot on an account shares ([What Grok Bot is](https://aitamer.news/posts/what-is-grok-bot/), [The cloud computer your Grok Bots share](https://aitamer.news/posts/grok-bot-computer-the-box/)). This third one gives a Bot a clock. By the end you should have a weekday morning brief that runs on that cloud computer while your laptop is shut, know which events can start a routine instead of a clock, and know what to check when 8:00 comes and goes in silence.

## Skill first, routine second

The docs split recurring work into two pieces. A skill is a reusable set of instructions for how to do a task. A routine tells one Bot when to run a workflow, on a schedule or, where supported, after an event ([Skills and routines](https://docs.x.ai/grok-bot/skills-routines-and-automations)). Both official guides give the same order: do the task once, make it reliable, save the method as a skill, and only then automate it ([Work with Grok Bot](https://cursor.com/docs/grok-bot/work)). The use-cases guide is stricter: test the skill on a second input, and create a routine only after retries and failure cases are defined ([Grok Bot use cases](https://cursor.com/docs/grok-bot/use-cases)).

A routine runs while nobody is watching, so a vague stop line in the skill gets repeated every weekday.

## Step 1: run the task once

Use a file on the cloud computer as the input, so the run never depends on your laptop being open. Episode 02 explained why `/workspace` is the durable place for it. Paste this into a one-to-one chat with the Bot that will own the job:

```
Create /workspace/morning-brief.md with three lines: a date heading for today,
one open decision as a single sentence, and one https link I should read.
Then reply in this chat with exactly four lines: the date, the decision,
the link, and "No messages sent." Leave the file unchanged after you write it.
```

If you would trust the reply while you are away, keep going. If not, correct it and run it again.

## Step 2: save it as a skill

```
Save the process we just used as a skill called "Weekday morning brief".
When to use it: a weekday read of /workspace/morning-brief.md.
Inputs: that file on the cloud computer.
Steps: take the date heading, the decision sentence, and the link.
Validation: all three are present and the link starts with https.
Return: four lines in this conversation, ending with "No messages sent."
If the file is missing or a line is empty, say which and stop.
Leave the file unchanged. Send no email and post nothing outside this
conversation without my approval.
```

That shape follows the checklist on both skills pages: when to use it, required inputs and access, the sequence of work, how to validate the result, what to return, and what requires approval. Type `/` in the composer and confirm the skill is listed. If it is missing, the Cursor guide says to enable it for the current Bot under **Settings > Plugins > Yours**. The xAI page points to **Marketplace > Your plugins > Manage plugins and skills**, under **Private skills**. Private skills are one library shared by all your Bots.

## Step 3: give the Bot a clock

Check the time zone first. Schedules use **Timezone** in Settings, under **Bot**. **Auto-detect** follows the computer you are on. Pick a zone when the work belongs to another office ([Routines](https://cursor.com/help/grok-bot/routines)).

Then ask the owning Bot:

```
Every weekday at 8:00 AM, run the "Weekday morning brief" skill against
/workspace/morning-brief.md. Post the four-line brief in this conversation.
If the file is missing or a required line is empty, report that here and stop.
Send no email and post nothing outside this conversation.
```

Schedules are sentences. The help page's examples are "every weekday at 8:00 AM" and "every 2 hours". Neither official guide documents a cron field or a shorthand such as `@daily`, so this tutorial does not teach one. A user's bug report on Cursor's forum describes a cron-style schedule with a time-zone prefix ([forum thread](https://forum.cursor.com/t/grok-bot-scheduled-routines-firing-late-early-or-not-at-all-all-day-oct-8-primary-backup-both-missed/174142)). That is one report, not documentation. Write the sentence, then read back what was saved.

The xAI page, updated 6 October, sets three numbers. Routine schedules must be at least five minutes apart. A Bot can own up to 50 routines. The app keeps the 20 most recent run records for each routine.

A new routine waits for its next scheduled time. It does not run when it is created. Set up "every day at 8:00 AM" at 8:05 and the first run is tomorrow at 8:00 ([Routines](https://cursor.com/help/grok-bot/routines)). The xAI page says the Bot shows the next run when it creates the routine.

Confirm the six items both guides list: owning Bot, schedule and time zone, input source, expected result, approval boundary, and what happens when a source is missing.

## Step 4: read it back, then test it

On desktop, click the Bot's name at the top of the chat, choose **Tasks**, and look under **Routines**. The xAI page reaches the same list through **View conversation details**. Each row shows the routine's name and when it runs, or **Paused**, with a switch to pause or resume. Open the routine and read its fields:

- **Instruction** is what the Bot does on each run.
- **When to run** lists the schedule and any events that start it, in words. If it is wrong, choose **Edit**. The app starts a message that begins "Edit your routine:" with the routine's name. Add the fix and send it.
- **Webhook** appears only for a routine that a webhook call starts.

Now choose **Test** (the xAI page calls it Test run). The button says **Running…** until the run finishes, and the result shows up in the Bot's chat. A test does real work. It can change files, use connected plugins, and it spends usage. This one should only read and reply. Review it against the xAI checklist: current inputs, the required format, a source or audit trail, a stop at the approval point, and an explicit failure state. Then rename the file and test again to see the missing-file report.

The buttons at the bottom are **Pause** or **Resume**, **Test**, **Edit**, and **Delete routine**. Deleting asks you to confirm, stops future runs, and cannot be undone. On the phone, open the Bot's profile: each routine shows **Active**, **Schedule**, **Next run**, **Instruction**, and **Run history**, and **Add routine** starts a message that begins "Set up a routine to ".

## Events instead of a clock

A schedule is one way to start a routine. The help page lists the others: a Slack message, a GitHub, Linear, Sentry, or PagerDuty event, an email, or a webhook call. The xAI page is more cautious. It names Slack and GitHub as examples, says "where supported", and notes that these Cursor account integrations are separate from the Slack or GitHub plugins and may need their own connection flow. Ask for the trigger, then check **When to run**.

Three triggers are documented in enough detail to use today.

**Slack.** A routine can start when the Bot is mentioned, when a word or phrase appears, when you react to a message, or on any message, in one channel or across Slack. Only new activity counts. The trigger and the Slack plugin are separate: the plugin lets the Bot read and post as the user you connected, and the trigger only starts the run.

**Email.** Since 9 October a Bot can claim its own address at `mail.grokbot.com`, rolling out to users that day, with team admins enabling it first ([@bot on X](https://x.com/bot/status/2108609769003245647), [9to5Mac](https://9to5mac.com/2026/10/09/grok-bot-just-got-its-own-email-address-heres-how-to-claim-yours/)). New mail does not wake a Bot by itself. Only a routine does. The help page says a routine can watch mail from anyone, from specific addresses, or from a whole domain such as `*@example.com`. By default it runs only for senders that pass standard email authentication, it cannot filter by subject, and mail that fails the spam or virus scan never starts one ([Give your Bot an email address](https://cursor.com/help/grok-bot/agent-email)). The help page's example request is "When an email arrives from billing@example.com, summarize it and tell me."

**Webhook.** Ask the Bot to add a webhook trigger, then open the routine on desktop. The **Webhook** section shows **POST to** (the URL), **key** (the secret), and **header** (the full `Authorization: Bearer` line). A JSON body reaches the Bot along with the routine instruction:

```
curl -X POST "$ROUTINE_URL" \
  -H "Authorization: Bearer $ROUTINE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"note": "nightly export finished"}'
```

A **200** means Grok Bot accepted the call and started a run, not that the Bot finished. Any other response means no run started. Keep the key out of chat.

Keep every matching rule narrow. Both guides warn against listeners like "every new message". The help page says an hourly schedule, a short interval, or a Slack trigger on a busy channel can use a week of usage in a day. A paused routine spends nothing.

## What runs while you are away

Routines run in the cloud, so closing the app, the laptop, or the phone does not stop them ([FAQs](https://cursor.com/help/grok-bot/faqs)). Results land in the owning Bot's chat. To hear about them, turn on **Notifications** in that Bot's **Bot settings**, described as "Get notified when this Bot finishes or needs input", and allow Grok Bot notifications on your phone ([How Tos](https://cursor.com/help/grok-bot/how-to)). A hidden Bot stays active and keeps its routines, but it does not send notifications.

Approvals behave differently when you are not there. One raised in a chat you are in waits for you. One raised by a routine, a trigger, or another Bot expires after about 10 minutes, the card shows **Expired**, and the action does not run. That is the practical reason this brief posts in chat and sends nothing: a routine that needs you to approve a send at 8:00 will usually be stuck at 8:10.

After a long period away, Grok Bot may ask whether to keep routines running, and pause them if you do not answer. Neither guide says how long that period is. Review paused routines when you come back.

## When 8:00 comes and goes

Check, in this order: the routine is not **Paused** (on the phone, **Active** is on); **When to run** shows the schedule you expect, in the right time zone; a routine created after 8:00 is waiting for tomorrow; the owning Bot still exists; required plugins are still signed in; usage has not run out ([Troubleshooting](https://docs.x.ai/grok-bot/troubleshooting), [Routines](https://cursor.com/help/grok-bot/routines)). On the phone, **Run history** shows each recent run as **Running**, **Succeeded**, or **Failed**, with a reason on failure. **No runs yet** means nothing has started it. The help center asks for a bug report when a routine is not paused, has not run for 24 hours or more, and shows no error.

Sometimes the delay is not yours. Replying on Cursor's forum on 9 October, a Cursor team member called late and missing schedules "a known issue on our side": since Thursday morning US time, scheduled routines had been held back during a period of very high demand. While one run is held, the next slot for that routine is skipped, and missed runs are not replayed. The reply asked users to leave routines on, because editing, pausing, or recreating them would not help, and said manual runs are not held back the same way ([forum thread](https://forum.cursor.com/t/grok-bot-scheduled-routines-firing-late-early-or-not-at-all-all-day-oct-8-primary-backup-both-missed/174142)). The thread gave no end date. If a run is time-critical, ask the Bot directly or start it with **Test**, and do not count on a second routine as a backup: in that report it waited in the same queue.

## What you still do by hand

Your direct message takes priority over background work and can redirect the current turn. "Stop now" ends that turn without undoing finished actions, and it leaves the routine scheduled. **Pause** stops future runs. The skill stays in the library, so `/` and "Weekday morning brief" still runs it on demand.

The short version: task, skill, second input, then schedule. Read **When to run** back. Keep triggers narrow. Make unattended runs prepare and report, and keep sends for when you are there.

Episode 04 covers connectors and channels: the plugins most routines end up reading from, and how they sign in.
