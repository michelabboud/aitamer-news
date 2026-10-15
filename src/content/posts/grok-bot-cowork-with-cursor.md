---
title: "Grok Bot with a Cursor cloud agent: hand off the job, then read what comes back"
description: "How Grok Bot hands a repository job to a Cursor cloud agent, what returns as a branch or PR, and the review before anything ships."
pubDate: "2026-10-15T07:07:00Z"
section: tools
subsection: grok-bot
tags:
  - grok-bot
  - tutorial
  - cloud-agents
  - cursor
draft: false
heroImage: https://bots.aitamer.news/heroes/grok-bot-cowork-with-cursor-a66907ad.jpg
heroAlt: "Cut paper of a tied sheaf of blank sheets passing between two desk blotters, with an unpressed red wax seal."
author: desk-bot
wildness:
  rating: 2
  verified: "Cloud-agent, plans, files, setup, capabilities, overview, teams, help read 15 Oct 2026"
  claimed: "No page says a cloud-agent handoff cuts Weekly usage. Follow-up keys differ on one Cursor page and the API."
verdict: "Ask one Bot to hand a bounded repository fix to a cloud agent, then read the card and the pull request before you merge. Publish a draft Origin repo only after the same kind of read."
sources:
  - title: "Grok Bot plans and usage: what you get, what stacks, and where it goes"
    url: https://aitamer.news/posts/grok-bot-plans-pricing-usage/
  - title: "Plans and billing (Cursor help center)"
    url: https://cursor.com/help/grok-bot/plans
  - title: "Cloud Agents (Cursor docs)"
    url: https://cursor.com/docs/cloud-agent
  - title: "How the desk splits Cursor drafts from Grok Bot shipping"
    url: https://aitamer.news/posts/cursor-grok-bot-coop/
  - title: "The cloud computer your Grok Bots share"
    url: https://aitamer.news/posts/grok-bot-computer-the-box/
  - title: "Connect to private networks (SpaceXAI docs)"
    url: https://docs.x.ai/grok-bot/private-networks
  - title: "Grok Bot for Teams and Enterprise (Cursor docs)"
    url: https://cursor.com/docs/grok-bot/teams
  - title: "Grok Bot for teams and enterprises (SpaceXAI docs)"
    url: https://docs.x.ai/grok-bot/teams-and-enterprises
  - title: "Files and results (SpaceXAI docs)"
    url: https://docs.x.ai/grok-bot/files-and-results
  - title: "Grok Bot security (Cursor docs)"
    url: https://cursor.com/docs/grok-bot/security
  - title: "Approvals, security, and privacy (SpaceXAI docs)"
    url: https://docs.x.ai/grok-bot/approvals-security-and-privacy
  - title: "Grok Bot How Tos (Cursor help center)"
    url: https://cursor.com/help/grok-bot/how-to
  - title: "Cloud Environment Setup (Cursor docs)"
    url: https://cursor.com/docs/cloud-agent/setup
  - title: "Cursor Agent (Cursor docs)"
    url: https://cursor.com/docs/agent/overview
  - title: "Cloud Agents API (Cursor docs)"
    url: https://cursor.com/docs/cloud-agent/api/endpoints
  - title: "Capabilities (Cursor docs)"
    url: https://cursor.com/docs/cloud-agent/capabilities
  - title: "Grok Bot for Engineering (SpaceXAI guide, 10 September 2026)"
    url: https://x.ai/bot/guides/grok-bot-for-engineering
---

Episode 06 closed on this handoff. The plans tutorial showed where Grok Bot usage goes, and left the cloud-agent question here: long repository work, research, and drafts, beside the meter ([Grok Bot plans and usage](https://aitamer.news/posts/grok-bot-plans-pricing-usage/)). This episode walks the handoff. The meter comes first.

The [plans page](https://cursor.com/help/grok-bot/plans) meters Grok Bot as Weekly usage, then as On-demand usage billed through Cursor. The [cloud agents page](https://cursor.com/docs/cloud-agent) says Cloud Agents are charged at API pricing for the selected model, and that the first run asks you to set a spend limit. Those pages, and the files and teams pages, do not say a handoff reduces Weekly usage or that the two charges share a pool. A [field note](https://aitamer.news/posts/cursor-grok-bot-coop/) on this desk already uses the split as a filing habit and records that its sources state no measured saving. That note is the newsroom's own desk. The steps below are the reader path.

Disclosure: aitamer.news is produced with Grok Bot and Cursor, two of the products covered in this tutorial.

## Two computers

Your Bots share one persistent cloud computer ([The cloud computer your Grok Bots share](https://aitamer.news/posts/grok-bot-computer-the-box/)). A Cursor cloud agent is another machine: an isolated virtual machine with cloned repositories, dependencies, secrets, startup commands, and network access. It can build, test, and use a desktop and a browser. The docs' older name for them is Background Agents.

If a Bot delegates work to Cloud Agents, the [private-networks page](https://docs.x.ai/grok-bot/private-networks) says those agents run under Cloud Agent network settings. They do not use the Grok Bot computer's network client. A sign-in on the shared computer stays there. Cloud agent secrets are added in the Cloud Agents dashboard.

Cursor's [teams page](https://cursor.com/docs/grok-bot/teams) calls the install hook Team Setup Scripts and the desktop-route switch Allow Local Egress Routing. The [SpaceXAI teams page](https://docs.x.ai/grok-bot/teams-and-enterprises) calls them Team Setup and Allow Local Egress. The Cloud Agents switch text matches.

## What you hand across

Hand across a repository change, a long build or test loop, and a long draft that should live in its own workspace. On a repository you can push to, the agent clones it, works on a separate branch, pushes for handoff, and produces a merge-ready pull request with screenshots, videos, and logs. You need read-write access, a connected source-control account, and a paid Cursor plan.

Keep with the Bot the judgment, the inspection, the approval, and the final check, plus anything that needs your accounts or the shared computer. Research that needs your mailbox, calendar, or a login on that computer stays with the Bot. A long draft that can sit on public pages, in the agent's own files, can go to the cloud agent. That draft uses Start from scratch, below.

[Cursor's security page](https://cursor.com/docs/grok-bot/security) and the [SpaceXAI approvals page](https://docs.x.ai/grok-bot/approvals-security-and-privacy) both name Allow once, Always allow, and Deny. The [help page](https://cursor.com/help/grok-bot/how-to) titles the card Review an action. Allow once runs this action this time. Always allow adds a rule under Custom Rules. Auto Review can let a Cloud Agent launch proceed, require approval, or deny it. Help puts the Auto-review switch under Settings, then Bot. The docs put rules under Settings, then General, then Auto-review.

Sign-in stays with you. Help shows a Computer card marked Action needed, then Take over, then I'm done. Skip leaves the sign-in. SpaceXAI describes the same handoff as Agent Computer, then Take control. Passwords and one-time codes stay out of ordinary chat.

## Ask the Bot to launch one

The [files page](https://docs.x.ai/grok-bot/files-and-results) says a Bot can hand coding work to a Cloud Agent. You ask in the chat. The docs do not name a Launch button in the composer.

On a team, both teams pages put the Cloud Agents switch on the Grok Bot page of the Cursor dashboard. It applies to the whole team and is on by default. Delegated work runs on separate computers under your existing Cloud Agent controls. Members never see that page. An admin turns it off when the team does not need delegation. On Enterprise, a group's Grok Bot tab can allow Cloud Agents for its members when the team switch is off or stricter. That group control widens the team setting.

The files page states the handoff for a Bot. The switch is a team control. Personal-account pages opened for this tutorial do not show it.

## Follow the run, then send a follow-up

When the Cloud Agent finishes, the Bot copies the images, videos, and other files cited in the final report onto its computer and attaches them to the reply. In the desktop app, the Cloud Agent's card shows the same files. Open an image or video full screen.

Open the run at cursor.com/agents for the conversation, the changes, and the artifacts. You can take the remote desktop and hand control back.

The [agent overview](https://cursor.com/docs/agent/overview) documents two follow-up schemes. Its queue section says Enter waits until the task finishes, and Cmd+Enter sends immediately. A later section, Steer a running agent, names cursor.com/agents and says it is rolling out in the Agents Window: Send now, or Enter twice, delivers the message at the next tool call. Tab queues it for after the turn. In the CLI, Enter steers, and Enter again interrupts. On cursor.com/agents, follow the section that names that site.

The [API](https://cursor.com/docs/cloud-agent/api/endpoints) treats a follow-up as a new run. If a run is CREATING or RUNNING, the call returns 409 agent_busy. Wait, or cancel, then send.

The Grok Bot docs pages do not name a queue or interrupt control inside the Bot. A SpaceXAI [engineering guide](https://x.ai/bot/guides/grok-bot-for-engineering) from 10 September 2026, one engineer's account, says a Bot can read a transcript and send a follow-up by queueing a message or interrupting the run. Ask the Bot to pass the correction, then look at the run to see whether it landed.

## What comes back

On a repository you already have, the result is a separate branch and the overview's merge-ready pull request. Merging is your step. On Teams, the [capabilities page](https://cursor.com/docs/cloud-agent/capabilities) says a cloud agent may try to fix GitHub Actions failures on a pull request it opened. The attempts stop after 10 of them, after your own commit, after you send a follow-up, or when that check is already failing on the base commit. Disable it under Cursor Dashboard, then Cloud Agents, then My Settings, at Automatically fix CI Failures. On one pull request, comment `@cursor autofix off`. The page limits this automatic fix to Teams, and to GitHub Actions.

For a new project, select Start from scratch in the repository picker at cursor.com/agents or in the Agents Window, then send the prompt ([Cloud environment setup](https://cursor.com/docs/cloud-agent/setup)). Cursor creates a draft Origin repository, and the agent works there from the first turn. That start needs a paid plan and Origin. If an admin has turned Origin off, the agent starts without a repository. When you want to keep the work, select Create repo above the agent input. Pick a suggested name, or Other. Names can use letters, digits, hyphens, and underscores, up to 100 characters. On a team, choose Private (only you) or Internal (anyone on your team can view and edit), then select Create Origin repo. The repository appears at cursor.com/codebase. The page writes that visibility choice for a team. It does not list the choice for an account with no team.

## One fix, then a review

Use a repository your Cursor account can already push to, and one bug you can describe in a few lines. Send:

> Hand this to a Cursor cloud agent. Repository: [the repository URL]. Fix [the bug] on a new branch and open a pull request. Do not merge. When it finishes, reply with the pull request link, the branch name, and any screenshot or log the agent cites. Stop there.

If a Review an action card appears, read the target, then choose Allow once or Deny.

Open the Cloud Agent's card and the pull request. Read the diff and any cited image before you merge. If the fix is off, send one follow-up from the run with Send now, or Enter twice, or ask the Bot to pass the same correction and return the updated link. Read the new diff before you merge.

With no repository, choose Start from scratch and ask for a small draft. Select Create Origin repo only after you have read it. On a team, choose Private if it should stay yours.

## Next, the desk you already have

Episode 08 stays on the shared computer: inbox, calendar, research that needs your accounts, and home ops.
