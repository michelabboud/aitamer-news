---
title: "JetBrains Air Teams: Automations, shared cloud environments, and team projects"
description: "JetBrains (Sep 28, 2026) introduces Air Teams—Automations, shared cloud environments, cloud tasks, and team projects. Already available to business customers; individuals later. Try at air.jetbrains.cloud."
pubDate: 2026-10-02T00:00:00Z
specimen: 145
section: tools
subsection: agents
tags:
  - jetbrains
  - air
  - air-teams
  - automations
  - agents
  - cloud-environments
  - team-projects
  - cloud-tasks
draft: false
heroImage: https://media.aitamer.news/heroes/jetbrains-air-teams.jpg
heroAlt: "Paper-cut collage of shared cloud workspaces and automation lanes feeding team project panels, one coral trigger accent on slate fabric."
author: desk-bot
wildness:
  rating: 3
  verified: "Sep 28: Air Teams = Automations + shared cloud envs + cloud tasks + projects; business now; air.jetbrains.cloud"
  claimed: "JetBrains: 10 Automation templates; mobile soon (not live); business first—no individual GA or pricing"
verdict: "Team layer for agentic work: event/schedule Automations, shared cloud environments, cloud tasks, and projects. Business customers now; individuals later."
sources:
  - title: "Air Teams: Bring Your Best Agentic Workflows to the Whole Team – and Automate Repeatable Work — JetBrains Air Blog"
    url: https://blog.jetbrains.com/air/2026/09/introducing-air-teams/
---

JetBrains’ Air blog on **September 28, 2026** introduces **JetBrains Air Teams**—the **team layer for agentic development**, giving humans and agents shared context, environments, tools, and instructions across the development lifecycle ([blog](https://blog.jetbrains.com/air/2026/09/introducing-air-teams/), Vladimir Gromozdin).

## What Air Teams is

Air Teams has **four parts**, as JetBrains names them:

- **Automations** — agentic workflows that run in the cloud on an **event or a schedule**, for recurring work such as reviews, issue fixes, and dependency updates; they are **shared team assets**
- **Shared cloud environments** — tools, dependencies, and credentials the team sets up once and reuses
- **Cloud tasks** — work that runs in those environments, in parallel, without tying up a laptop
- **Projects** — shared home for members, environments, connectors, and Automations, with shared credits and roles

This is the **team and organization layer**—not the earlier **Air in JetBrains IDEs** early-access story of embedding Air inside the IDE as a multi-agent conduit.

## Automations

An Automation is instructions, an environment, tools (connectors such as Jira, Figma, and Linear), and a trigger (GitHub or Jira event, webhook, or schedule). JetBrains says Air Teams ships with **10 Automation templates**, including code review, bug fixes, dependency upgrades, and documentation maintenance—use one as-is or adapt it.

Control stays with people: every code change arrives as a **pull request**, and an engineer decides whether to merge it. Runs keep the agent’s conversation and tool calls for review when a result looks wrong.

## Shared environments, cloud tasks, and projects

Shared cloud environments live per repository in a team project. Teams pick VM size, domain allowlist, and variables or secrets; setup lives in the repo at **`.air/cloud/startup.sh`**. Air can save a ready environment as a **snapshot**. Shared secrets let teammates and Automations use a value **without seeing it**, as JetBrains states.

Cloud tasks can run local or in the cloud. Cloud runs are not tied to the starting device—you can start and follow them from **Air in JetBrains IDEs or on the web**; JetBrains says phone/mobile follow-up is **coming soon**, not available yet.

Team projects bring members, environments, connectors, and Automations together. Admins manage membership and setup; members use shared environments and create Automations. Project credits and a project service account can keep Automations running even after the creator leaves, as JetBrains describes.

## Availability

**Air Teams is already available to JetBrains business customers**, with plans to expand access to **individual customers later**. JetBrains does not name seat SKUs or dollar pricing in this post. Try it at [air.jetbrains.cloud](https://air.jetbrains.cloud).

## Who should care

Engineering teams on JetBrains commercial plans who want shared agentic workflows—not one-off laptop prompts—should start at the [Air Teams announcement](https://blog.jetbrains.com/air/2026/09/introducing-air-teams/). Treat the ten templates and mobile “soon” as vendor-stated; confirm business eligibility with JetBrains before planning an org rollout.
