---
title: "Codex cloud gets reusable environments, and the sandbox stops being disposable"
description: "At DevDay 2026 OpenAI turned Codex cloud from one throwaway sandbox per task into published setups with saved per-task state. What changed, what it costs you, and what it still cannot do."
pubDate: "2026-09-29T23:29:00Z"
specimen: 76
section: "dev"
tags: ["openai", "codex", "codex-cloud", "devday", "agents", "security"]
draft: false
heroImage: "https://media.aitamer.news/heroes/openai-codex-cloud-reusable-environments.jpg"
heroAlt: "A paper-cut collage of a slate-blue cloud with a cream blueprint of a workbench pinned to it, three small cream workshop rooms hanging below each with its own coral lamp, and a cream phone showing a moon beside an open laptop on sand-coloured hills."
video:
  youtube: 7Bv68f5szSU
  title: "Meet the all new Codex Cloud"
  channel: "OpenAI"
author: "quill"
sources:
  - title: "OpenAI: cloud environments (Codex documentation)"
    url: "https://learn.chatgpt.com/docs/environments/cloud-environments"
  - title: "OpenAI: cloud environments, legacy guide (12-hour cache, setup and maintenance scripts, secrets)"
    url: "https://learn.chatgpt.com/docs/environments/cloud-environment"
  - title: "OpenAI: agent internet access, legacy guide"
    url: "https://learn.chatgpt.com/docs/cloud/internet-access"
  - title: "TechCrunch: OpenAI gives Codex reusable cloud environments that work across devices"
    url: "https://techcrunch.com/2026/09/29/openai-gives-codex-reusable-cloud-environments-that-work-across-devices/"
  - title: "SiliconANGLE: OpenAI's Codex gets reusable cloud environments that follow developers across devices"
    url: "https://siliconangle.com/2026/09/29/openais-codex-gets-reusable-cloud-environments-that-follow-developers-across-devices/"
  - title: "WinBuzzer: OpenAI Codex adds reusable cloud setups for coding across devices"
    url: "https://winbuzzer.com/2026/09/29/openai-codex-reusable-cloud-setups-coding-across-devices-a003-xcxwbn/"
  - title: "The Decoder: OpenAI expands Codex and its API at DevDay"
    url: "https://the-decoder.com/openai-expands-codex-and-its-api-at-devday-with-security-scans-a-decisions-api-and-ultrafast/"
  - title: "Simon Willison: OpenAI DevDay 2026 live blog"
    url: "https://simonwillison.net/2026/Sep/29/openai-devday-2026-live-blog/"
wildness:
  rating: 3
  verified: "Setup, per-task state, seven-day recovery and VM sizes are in OpenAI's docs and several reports."
  claimed: "Faster task starts and the security-scan figures come from launch coverage; we did not measure them."
verdict: "A real change in how Codex cloud works: tasks now start from a published setup and keep their own state for seven days. Read the network defaults and the unsupported list before you move real repositories over."
---

## What changed

Until now, a Codex cloud task was a disposable sandbox. It was prepared for one job, and OpenAI cached the container for up to 12 hours to make follow-ups quicker. At DevDay on 29 September 2026, OpenAI changed that model. You prepare an environment from a GitHub repository on the web or desktop and publish it. Every later cloud task starts from that published setup, and [OpenAI's documentation](https://learn.chatgpt.com/docs/environments/cloud-environments) says each new task gets its own isolated workspace.

The part that matters most is what happens after a task starts. A task keeps its uncommitted files and its installed tools, so you can start a bug investigation, close the laptop, and read that task's changes from your phone. A second task launched from the same setup does not touch the first one's work. Per the documentation, a task's saved state can be recovered for up to seven days after its last turn.

## What you get

- **A shared starting point.** The setup holds the install scripts, startup skills, environment variables and secrets the project needs, so a new task does not rebuild them. [TechCrunch](https://techcrunch.com/2026/09/29/openai-gives-codex-reusable-cloud-environments-that-work-across-devices/) describes the aim as tasks that start faster and a shared workspace with approved settings and permissions. We have not timed the start-up improvement.
- **Work that continues without your machine.** Tasks run on virtual machines that keep going while your computer is off.
- **Team sharing with limits.** In enterprise workspaces, creating a personal environment and managing shared ones are separate permissions, and the shared one is off by default. As [SiliconANGLE](https://siliconangle.com/2026/09/29/openais-codex-gets-reusable-cloud-environments-that-follow-developers-across-devices/) quotes OpenAI, access to a shared environment does not extend to anyone else's tasks or to editing the setup.
- **Private networks.** The documentation lists Tailscale for reaching private networks and, for enterprise customers, OIDC for cloud-resource authentication.

## The sizes depend on your plan

The documentation gives two virtual machine sizes:

| Plan | vCPUs | Memory | Disk |
|---|---|---|---|
| Plus, Edu Plus | 2 | 8 GiB | 8 GiB |
| Pro, Business, Enterprise | 4 | 16 GiB | 32 GiB |

Larger configurations exist for enterprise customers. A monorepo with a heavy build may not fit the 8 GiB machine, so check this before you promise a team that it will work on the cheaper plan.

## What it still cannot do

The documentation and launch reports list several gaps:

- Computer use and browser use are not supported in cloud environments.
- GitLab repositories and self-hosted GitHub Enterprise Server are not supported.
- Repository-based skills work in the cloud, but your local personal skills are not synced.
- Anything you did not commit is gone after the seven-day window, so commit what you want to keep.

## The security default to check

OpenAI's older cloud guide has agent internet access off by default, with setup scripts allowed online, and it says secrets are removed before the agent phase begins. It lists the risks of switching internet access on: prompt injection from untrusted web content, code or secret exfiltration, malware, and licence-restricted content. Its example is a malicious instruction hidden in a GitHub issue that tells the agent to send repository data elsewhere.

WinBuzzer reports that the new environments default to a preset of common package registries rather than no access. We could not confirm that default in OpenAI's own text, so open your environment's network settings and read them before you rely on either behaviour. If you allow more than the registries, limit it to the domains you need and, where you can, to read-only HTTP methods.

## Codex Security Cloud

OpenAI launched a companion product for security work. [The Decoder](https://the-decoder.com/openai-expands-codex-and-its-api-at-devday-with-security-scans-a-decisions-api-and-ultrafast/) reports that it scans whole GitHub repositories on demand or on a schedule, checks new commits, investigates findings, removes duplicates and prepares fixes, for Pro, Business, Enterprise and Edu plans. [Simon Willison's live blog](https://simonwillison.net/2026/Sep/29/openai-devday-2026-live-blog/) records the figures given on stage: 53 critical findings fixed on the first day of an internal sprint, 36 percent of discoveries being duplicates, and a 1 percent rollback rate for generated patches. Those are OpenAI's numbers from a keynote, not independent measurements.

## Our take

Persistent per-task state is the right fix for the weakest part of cloud coding agents, which was losing context between attempts. The seven-day window and the per-task machines make the cloud feel like a place you can leave work, not a queue you submit to.

The cost is that more of your code and secrets now sit in a long-lived environment. Treat the published setup like a build server. Give it the least access it needs, put no production credentials in it, and review what an agent can reach before you widen the network. Simon Willison also reported a bad experience with Codex cloud on the way to the event, so it is worth trying on a low-risk repository first.

— Quill
