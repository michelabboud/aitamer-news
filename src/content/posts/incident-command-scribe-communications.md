---
title: Assign an incident commander, a scribe and a communications lead
description: Split incident duties into named roles with explicit handover rules, so the people fixing the problem are not also writing updates and keeping the timeline.
pubDate: "2026-10-14T08:00:00Z"
section: devops
tags:
  - incident-response
  - sre
  - on-call
  - postmortems
  - team-process
draft: false
heroImage: https://media.aitamer.news/heroes/incident-command-scribe-communications-2c16fb2c.jpg
heroAlt: A blue paper band connects a blank notebook and red pencil, a large blue compass, and a coral megaphone.
author: quill
wildness:
  rating: 1
  verified: Role duties, handoff wording and declare-early triggers quoted from the SRE book and PagerDuty.
  claimed: No team size or severity threshold for the full role set; the sources leave it open.
verdict: Well-established practice from two primary sources. Name a commander, scribe and comms lead, hand over explicitly, and scale roles down for small incidents.
sources:
  - title: "Google SRE book: Managing Incidents"
    url: https://sre.google/sre-book/managing-incidents/
  - title: "PagerDuty Incident Response: Different Roles"
    url: https://response.pagerduty.com/before/different_roles/
---

When a production incident starts, the people who can fix it are usually the same people everyone wants updates from. One engineer is reading traces for a failing model call. A manager asks for an estimate in chat. A support lead asks what to tell customers. Nobody is writing down what was changed and when. The fix slows down, and the postmortem later has gaps.

Google's SRE book and PagerDuty's incident response guide both answer this with named roles. This post covers three of them, the incident commander, the scribe and the communications lead, plus the handover rules that keep them working.

## What the sources say each role does

The [Managing Incidents chapter of the Google SRE book](https://sre.google/sre-book/managing-incidents/) describes an incident commander who "holds the high-level state about the incident", structures the response team and assigns work. It adds a rule worth memorizing: "the commander holds all positions that they have not delegated." It names an operations role and says "The operations team should be the only group modifying the system during an incident." It names a communication role, "the public face of the incident response task force", and a planning role that handles longer-term work such as filing bugs and tracking system changes so they can be reverted.

[PagerDuty's page on incident roles](https://response.pagerduty.com/before/different_roles/) uses similar ideas with different names. It calls the incident commander the "single source of truth" on the current state, and says the commander is not a resolver and delegates repair actions. It defines a scribe who documents the timeline as it unfolds and records key decisions and data for the postmortem. It splits communication into two roles: a customer liaison for public and customer-facing updates, and an internal liaison for stakeholders inside the company. It also describes subject matter experts, who diagnose and fix the affected service, and a deputy who backs up the commander.

## A small working setup

For a team that ships an AI feature, a minimal assignment for a serious incident can look like this:

```text
Incident:   summarization endpoint returning 500s
Commander:  Dana        coordinates and decides, no prod changes
Ops / SME:  Lee, Sam    the only people changing production
Scribe:     Priya       timeline, decisions, commands run
Comms lead: Omar        status page, support, internal updates
Channel:    #inc-summarize-500s
State doc:  link to the shared incident document
```

The names are illustrative. The structure comes from the sources: one commander, a small group allowed to change the system, one person writing things down, and one person talking to everyone outside the response.

These working rules follow from the source material:

- **The commander delegates repair and is not the resolver.** PagerDuty states this directly. If the commander starts fixing things, nobody holds the overall picture.
- **Only the ops group changes production.** The SRE book sets this rule and gives the commander responsibility for the high-level state. Keeping changes within one ops group should make them easier to track; that is an inference from the role structure.
- **The scribe writes the timeline as it happens.** PagerDuty gives the timeline, key decisions and important callouts to the scribe. The SRE book calls keeping a living incident document the commander's most important responsibility. Read together, the commander owns the document and hands the typing to the scribe.
- **The comms lead is the single voice outward.** Stakeholders ask the comms lead, and responders stay on the problem. PagerDuty's customer liaison drafts external messages and posts them after the commander approves. Its internal liaison answers stakeholder questions to keep the main call focused.

## Handover rules

The SRE book calls a clear handoff of the commander role essential. The SRE book describes a clear, live handoff. The outgoing commander states it explicitly, with wording like "You’re now the incident commander, okay?", and does not leave until receiving firm acknowledgment. The rest of the response is then told who leads.

Use the same pattern for every role:

1. The outgoing person states the handover in the incident channel or on the call.
2. The incoming person acknowledges in their own words.
3. The scribe records the change and the time in the timeline.
4. The comms lead tells stakeholders when the commander changes.

PagerDuty adds a structural backup. The deputy acts as a "hot standby" for the commander and must be trained as one. That gives you a ready successor if the commander needs to move into a hands-on role or step away.

## When to declare an incident and assign roles

Roles help only once someone starts them. The SRE book says "It is better to declare an incident early" and suggests declaring one if any of these is true: a second team needs to be involved, the outage is visible to customers, or the issue is still unsolved after an hour's concentrated analysis. Make the first responder the commander until a clear handoff, and leave undelegated roles with the commander. Their first jobs are to open the channel, start the state document and name a scribe.

## Where this advice stops

PagerDuty notes that roles are flexible and that one person may cover several roles in a smaller incident. A single on-call engineer handling a minor alert does not need a separate scribe and comms lead. The sources do not give a team size or severity level at which the full set becomes necessary. Set that threshold yourself and write it down before you need it.

The SRE book also lists practices that make roles stick: prepare procedures beforehand, trust people to work within their role, notice when someone is overloaded and ask for help, and "Use the process routinely so it becomes second nature." It recommends rotating roles so everyone becomes familiar with each one. Practice the structure on smaller incidents and drills, so it already feels normal when a large outage arrives.
