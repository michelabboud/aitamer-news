---
title: "GitHub Copilot dynamic workflows: public preview in CLI, app, and SDK"
description: "GitHub Changelog (Oct 1, 2026): dynamic workflows in public preview for Copilot CLI, app, and SDK—code-defined multi-agent orchestration (sequential/parallel), handoffs, verification, checkpoints. Not computer use."
pubDate: 2026-10-01T23:10:00Z
specimen: 140
section: tools
subsection: cli
tags:
  - github-copilot
  - copilot-cli
  - dynamic-workflows
  - public-preview
  - multi-agent
  - sdk
  - cli
  - agents
  - orchestration
draft: false
heroImage: https://media.aitamer.news/heroes/github-copilot-dynamic-workflows-preview.jpg
heroAlt: "Paper-cut collage of coded workflow steps branching into parallel agent lanes with structured handoff nodes."
author: desk-bot
wildness:
  rating: 4
  verified: "Oct 1 Changelog: public preview; CLI+app+SDK; coded seq/parallel; vs /fleet; all plans; CLI --experimental"
  claimed: "Preview subject to change; Changelog example scenarios illustrative only; CLI needs experimental flag"
verdict: "Coded multi-agent orchestration in public preview across Copilot CLI, app, and SDK—process defined in code, not /fleet delegation or desktop computer use."
sources:
  - title: "Dynamic workflows in Copilot CLI and the Copilot app — GitHub Changelog"
    url: https://github.blog/changelog/2026-10-01-dynamic-workflows-in-copilot-cli-and-the-copilot-app/
---

GitHub’s Changelog for **October 1, 2026** says **dynamic workflows** are available in **public preview** in **GitHub Copilot CLI**, the **GitHub Copilot app**, and the **GitHub Copilot SDK** ([Changelog](https://github.blog/changelog/2026-10-01-dynamic-workflows-in-copilot-cli-and-the-copilot-app/)).

A dynamic workflow is a **program that defines how a task is carried out**—automated steps plus one or more agents, running **one after another, in parallel, or both**. It lives inside a **GitHub Copilot extension**. Preview status can change; treat this as early access, not a finished generally available product.

## What you can orchestrate (as GitHub lists)

GitHub names these capabilities on the Changelog:

- **Run commands, use tools, or call other services**
- **Divide a goal** and run independent tasks in parallel
- **Pass structured results** from one stage to the next
- **Have subagents verify** each other’s findings
- **Ask you for input**, if your client supports it
- **Pause at a checkpoint** so you can review results and resume when ready

You can **author workflows yourself** or **have Copilot write them**; Copilot includes built-in authoring guidance. Dynamic workflows are available on **all Copilot plans**—GitHub publishes no dollar prices in this Changelog.

## Unlike `/fleet`

**Unlike `/fleet`**, where Copilot delegates work to subagents and coordinates them in parallel, a **dynamic workflow carries out a process defined in code** ([Changelog](https://github.blog/changelog/2026-10-01-dynamic-workflows-in-copilot-cli-and-the-copilot-app/)). Do not conflate the two.

## How to turn it on

- **Copilot app:** Dynamic workflows are **always available with no setup required**.
- **Copilot CLI:** In the latest Copilot CLI, enable experimental features with the **`--experimental`** command-line option or **`/experimental on`** in an interactive session; update with **`/update`**.

Ask “What dynamic workflows are available?” to discover what’s on your setup.

## Not computer use, not cloud remote control

**Copilot computer use** is a **separate** public preview—local desktop GUI control on macOS and Windows. Dynamic workflows are **coded multi-agent orchestration** in CLI, app, and SDK. This is also **not** a Manus-style remote or cloud computer you drive from another device.

The Changelog’s “when to use” bullets (incident timelines, release checks, parallel PR review, dual-model comment checks, codebase sweeps, research→plan→change, long pauseable runs) are **illustrative vendor examples**, not verified customer case studies or performance guarantees.

## Who should care

Developers who want **repeatable, code-defined** multi-agent pipelines—with structured handoffs, verification, and pause-resume—should start at the [Oct 1 Changelog](https://github.blog/changelog/2026-10-01-dynamic-workflows-in-copilot-cli-and-the-copilot-app/). Keep **public preview**, use the CLI experimental path if you’re on CLI, and treat example scenarios as illustrations only.
