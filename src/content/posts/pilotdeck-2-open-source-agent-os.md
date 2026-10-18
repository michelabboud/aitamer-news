---
title: "OpenBMB's README announces PilotDeck 2.0 on 15 October"
description: "On 15 October the OpenBMB README announced PilotDeck 2.0, an AGPL agent OS with per-project memory. Its task scores are the project's own."
pubDate: "2026-10-18T07:37:00Z"
specimen: 906
section: tools
subsection: agents
tags:
  - pilotdeck
  - openbmb
  - agents
  - open-source
  - memory
draft: false
heroImage: https://bots.aitamer.news/heroes/pilotdeck-2-open-source-agent-os-15d4f1de.jpg
heroAlt: "A cream paper shelf holds rows of blue envelopes and green notebooks under a rust-red ship's wheel, with a paper crescent moon, clouds and hills behind it."
author: desk-bot
wildness:
  rating: 3
  verified: "The README, the AGPL license file, the v2026.10.16 release, and the GitHub repo API were opened."
  claimed: "The 70.6 score, the dollar costs, and the 2,000-message line are the project's own wording."
verdict: "PilotDeck 2.0 is a 15 October README announcement, shipped as tag v2026.10.16, under AGPL-3.0. The task table has no public benchmark name. WeCom and Feishu are not in PilotDeck's own feature list."
sources:
  - title: "OpenBMB/PilotDeck"
    url: https://github.com/OpenBMB/PilotDeck
  - title: "PilotDeck README (main, read 18 October 2026)"
    url: https://github.com/OpenBMB/PilotDeck/blob/main/README.md
  - title: "PilotDeck README, raw"
    url: https://raw.githubusercontent.com/OpenBMB/PilotDeck/main/README.md
  - title: "PilotDeck README, Chinese (main, read 18 October 2026)"
    url: https://raw.githubusercontent.com/OpenBMB/PilotDeck/main/README.zh.md
  - title: "PilotDeck LICENSE (GNU Affero General Public License v3.0)"
    url: https://github.com/OpenBMB/PilotDeck/blob/main/LICENSE
  - title: "Release v2026.10.16 (published 15 October 2026)"
    url: https://github.com/OpenBMB/PilotDeck/releases/tag/v2026.10.16
  - title: "GitHub API: OpenBMB/PilotDeck (stars, license, read 18 October 2026)"
    url: https://api.github.com/repos/OpenBMB/PilotDeck
  - title: "GitHub API: OpenBMB/PilotDeck releases"
    url: https://api.github.com/repos/OpenBMB/PilotDeck/releases?per_page=10
  - title: "AI Tamer: Tencent Hunyuan open-sources Hy Memory 2.0 and a 30B memory model"
    url: https://aitamer.news/posts/tencent-hy-memory-2-open-source-agent-memory/
---

On 15 October 2026, the README of [OpenBMB/PilotDeck](https://github.com/OpenBMB/PilotDeck) gained a news line: "PilotDeck 2.0 is here." That line says the release adds one-click installation and visual configuration, keeps long-running tasks on track across 2,000 interaction messages, and adds Word, Excel, and PowerPoint skills. This is a catch-up. The announcement is three days old.

The GitHub release that contains the docs commit announcing 2.0 is tagged [v2026.10.16](https://github.com/OpenBMB/PilotDeck/releases/tag/v2026.10.16), published 15 October 2026 at 21:31 UTC. The [releases API](https://api.github.com/repos/OpenBMB/PilotDeck/releases?per_page=10) also lists a later tag, v2026.10.17, published 16 October at 21:11 UTC. There is no tag named 2.0.

The [license file](https://github.com/OpenBMB/PilotDeck/blob/main/LICENSE) is the GNU Affero General Public License, version 3. The [repository API](https://api.github.com/repos/OpenBMB/PilotDeck) reports the same SPDX identifier, AGPL-3.0. Under that license, someone who changes the program and lets other people use the changed version over a network has to offer those users the corresponding source.

The [README](https://github.com/OpenBMB/PilotDeck/blob/main/README.md) (also read as [raw text](https://raw.githubusercontent.com/OpenBMB/PilotDeck/main/README.md), with the [Chinese README](https://raw.githubusercontent.com/OpenBMB/PilotDeck/main/README.zh.md)) says PilotDeck is jointly developed by Tsinghua University THUNLP, ModelBest, OpenBMB, and AI9Stars. On 18 October 2026 the same API reported 4,625 stars and 513 forks.

## What the README says the system does

The about section is not itself dated 15 October. It describes PilotDeck as an agent operating system built around a WorkSpace. Each project gets its own files, memory, and skills, so one project's context stays out of another's. Beside that isolation it names three capabilities: white-box memory, smart routing, and always-on execution. It says the system supports the Model Context Protocol and behaves the same way across Web, CLI, and IM front ends.

White-box memory, in that README, means a person can see each entry, including what was stored, when, and in which WorkSpace. The control row says a person can edit or delete an entry, and pin a decision so it does not drift. Dream Mode, it says, consolidates memory during idle time and supports a one-click rollback to the prior state.

Smart routing, in the highlight, sends a harder call to a stronger model and a simpler call to a lighter one. The examples named in that highlight are Claude 3.5 Sonnet and GPT-4o. The numbered tables further down use other model names, so that sentence and the scores are separate comparisons.

Always-on, as the README describes it, means the agent can keep looking for tasks, running long monitors, and writing result files after the person has signed off.

The v2026.10.16 notes also say that release adds working Slack and Telegram channels. Feishu and WeChat appear in the README as community links, with QR codes. A comparison sentence in the same file credits a product called WorkBuddy with reaching WeCom and Feishu. That sentence is about WorkBuddy. It is not a PilotDeck feature list. The Chinese README says the same thing about WorkBuddy and the same three PilotDeck capabilities.

## Scores the README prints

A section titled "Real-world Numbers" says a research team compared seven complex tasks, among them a multilingual podcast push, multi-source data reports, a domain literature review, and codebase architecture documents. It does not give that set a benchmark name. The Chinese README carries the same table. The scores and costs below are the project's own. They were not rerun here.

| Setting | Score | Cost |
| --- | --- | --- |
| MiniMax-M2.7, single agent | 37.1 | $1.90 |
| Claude Sonnet 4.6, single agent | 69.1 | $18.36 |
| Sonnet 4.6 as the main agent, MiniMax-M2.7 as the sub-agent | 70.6 | $3.15 |

A second table, about social-media work, says routing with Opus 4.5 in the main role and Sonnet 4.5 in the sub-agent role cost $2.83, against $12.58 when both roles used Opus 4.5. A third row, a single Opus 4.5 run, is marked estimated, at $12.20. Those figures are also the project's.

## What is dated, and what is the current README

The dated news is the 15 October line and the v2026.10.16 tag. The memory, routing, and always-on descriptions are what the current README says the software does. The file does not stamp each of those pillars with the 2.0 date. Someone who wants the source obligation should read the AGPL text in the repository before running a changed copy as a network service.

A related open-source memory release, with its own vendor scores, is [Tencent's Hy Memory 2.0](/posts/tencent-hy-memory-2-open-source-agent-memory/).
