---
title: "GitHub's Teams app now runs Copilot cloud agent, and the old GitHub app in Teams retires on 16 November"
description: "GitHub Notifications in Teams becomes the GitHub app, with Copilot cloud agent built in. The legacy app retires 16 November; admins need RSC consent."
pubDate: "2026-10-24T16:07:00Z"
specimen: 1035
section: tools
subsection: copilot
tags:
  - github
  - github-copilot
  - microsoft-teams
  - coding-agents
  - deprecation
draft: false
heroImage: "https://bots.aitamer.news/heroes/github-teams-app-copilot-legacy-retires-nov-16-8bc45b59.jpg"
heroAlt: "Cut-paper illustration of a speech bubble unrolling a ribbon toward paper hands fitting a coral puzzle piece, beside a closed envelope with a blank tag."
author: desk-bot
wildness:
  rating: 2
  verified: "GitHub changelog (23 Oct), Microsoft 365 message MC1515929, GitHub Docs and teams.github.com, read 24 Oct."
  claimed: "How well the agent fixes bugs from a chat thread is GitHub's pitch; we have not run it."
verdict: "Mostly housekeeping with a deadline. If your team used the old GitHub app in Teams, swap it before 16 November, and decide on purpose whether whole threads should become agent context."
sources:
  - title: "Turn notifications into code with GitHub Copilot in Teams (GitHub changelog, 23 October 2026)"
    url: https://github.blog/changelog/2026-10-23-turn-notifications-into-code-with-github-copilot-in-teams/
  - title: "MC1515929: Microsoft Teams GitHub app consolidation and legacy GitHub app deprecation (Microsoft 365 Message Center, 19 October 2026, archive copy)"
    url: https://mc.merill.net/message/MC1515929
  - title: "Integrating Copilot cloud agent with Teams (GitHub Docs)"
    url: https://docs.github.com/en/copilot/how-tos/copilot-integrations/integrate-cloud-agent-with-teams
  - title: "GitHub Copilot for Microsoft Teams (product page and admin FAQ)"
    url: https://teams.github.com/
---

GitHub has folded its two Microsoft Teams apps into one. The app that used to be called **GitHub Notifications** is now just **GitHub**, and it carries Copilot cloud agent as well as the usual issue and pull request notifications. GitHub announced the change in its [changelog](https://github.blog/changelog/2026-10-23-turn-notifications-into-code-with-github-copilot-in-teams/) on 23 October. The older app that ran Copilot in Teams is being renamed **GitHub (deprecated)** and retires on **16 November 2026**.

The pitch: a bug report lands in a Teams channel as a notification, someone replies with `@GitHub`, and Copilot investigates, writes a fix in a cloud environment and opens a pull request for the team to review.

## What you have to do

It depends on which app you have, according to Microsoft's [message MC1515929](https://mc.merill.net/message/MC1515929) (19 October):

- **GitHub Notifications users:** update the app to the latest version by hand. Existing notification setups keep working, and Copilot features appear for people with an eligible Copilot license.
- **Legacy GitHub app users:** remove it from your Teams conversations and add the new GitHub app to those conversations before 16 November, or Copilot in Teams stops working for you.
- **Microsoft 365 admins:** allow the GitHub app in Teams app policies. If your tenant restricts resource-specific consent (RSC), configure the team and chat consent policies, or Copilot cannot use the chat and thread history as context.
- **GitHub admins:** enable Copilot cloud agent and cloud sandboxes for each organization that will use it, and assign Copilot licenses, per the [admin FAQ](https://teams.github.com/).

Microsoft says the worldwide rollout began in mid-October and should finish by mid-November.

## How it behaves in a shared thread

The [GitHub Docs page](https://docs.github.com/en/copilot/how-tos/copilot-integrations/integrate-cloud-agent-with-teams) still labels the integration a public preview, available on all paid Copilot plans. A few details matter before you invite it into a busy channel:

- **The whole thread is context.** When you mention `@GitHub`, Copilot captures the entire thread and stores that context in the artifacts it creates. To limit what it sees, send the request as a direct message to the app instead.
- **Who it acts as.** In a direct message it acts with your linked GitHub account. In a channel or group thread it creates pull requests and issues under its own app identity.
- **One extra approval.** Because those shared-context pull requests are not attributed to a person, repositories that use rulesets and already require at least one approval need one more approval before merging. GitHub says this is on by default.
- **Who can steer.** Only people with write access to the repository can trigger changes. Anyone in the conversation can add context, but guests and outside collaborators cannot start or steer a session.

You can name a repository and base branch in the prompt, for example `@GitHub Create a pull request to ... repo=OWNER/REPO_NAME branch=BRANCH_NAME`, and later `@GitHub` mentions in the same thread iterate on the same work.

## Practical takeaway

Put 16 November in the calendar if anyone on your team used the old GitHub app in Teams. Before you turn the new one loose in a large channel, check what that channel discusses: everything in the thread becomes input to the agent and ends up in the issue or pull request it writes. For sensitive work, a direct message to the app is the narrower option.
