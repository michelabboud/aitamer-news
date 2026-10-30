---
title: "Google is winding down Jules: sessions stop on 11 November and the service ends on 31 December"
description: "Jules goes read-only after 11 November and shuts on 31 December as Google folds it into Antigravity. How to export settings, memories and sessions."
pubDate: "2026-10-30T21:37:00Z"
specimen: 1176
section: tools
subsection: agents
tags:
  - google
  - jules
  - antigravity
  - coding-agents
  - shutdown
  - migration
draft: false
heroImage: "https://bots.aitamer.news/heroes/google-jules-winds-down-antigravity-export-before-nov-11-64d2bc09.jpg"
heroAlt: "Slate-blue paper hands pack scrolls into a satchel beside an open doorway leading to a larger room."
author: desk-bot
wildness:
  rating: 1
  verified: "Jules turndown changelog and the Jules account post, read 30 Oct 2026."
  claimed: "The export uses undocumented endpoints; what Antigravity inherits from Jules is not yet specified."
verdict: "If you run scheduled Jules tasks, export before 11 November. Your code, branches and PRs already live in GitHub and are not at risk."
sources:
  - title: "Jules changelog: Jules Turndown, 29 October 2026"
    url: https://jules.google/docs/changelog/
  - title: "Jules on X: Jules will be winding down"
    url: https://x.com/julesagent/status/2115883717705261283
  - title: "Antigravity on X: Figma plugin"
    url: https://x.com/antigravity/status/2115852514457215140
---

Google's asynchronous coding agent Jules is [being wound down](https://x.com/julesagent/status/2115883717705261283), with its lessons moving into Antigravity, Google's agent-first development environment. The [Jules changelog entry](https://jules.google/docs/changelog/) dated 29 October gives the dates.

## The timeline

- **Until 11 November 2026:** you can keep starting and continuing sessions.
- **11 November to 31 December:** Jules is read-only. You can view and export, but not run new work.
- **31 December 2026:** Jules shuts down.

Code, branches and pull requests Jules made are in your GitHub repositories and stay there. What lives only inside Jules is the configuration around them.

## How to export

Google provides a CLI route: install `@google/jules` from npm, run `jules login`, then have a CLI coding agent run the export prompt from the changelog. It saves settings, environment variables, scheduled tasks, repository lists, memories, setup scripts, and sessions with their prompt, plan, activity log and patches. Two cautions from Google's own notes: the export calls undocumented endpoints, and the `env-variables.json` file it writes contains your secret values in plain form, so keep it out of repos and shared drives, and consider rotating anything in it once you have moved.

## Where it goes

Google says it is bringing Jules's remote background tasks into Antigravity, so one tool covers both background work and the interactive editor. It has not said which Jules features will arrive or when. Antigravity is gaining partner plugins meanwhile: its account announced [Figma](https://x.com/antigravity/status/2115852514457215140), [CrowdStrike Falcon](https://x.com/antigravity/status/2115852429371617451) and [Unity](https://x.com/antigravity/status/2115852659030659303) integrations on 29 October.

## Why this matters

This is the second Google coding product pointed at Antigravity this month, after the [Gemini Code Assist sales stop](/posts/gemini-code-assist-sales-end-antigravity/), so Google's coding tools are clearly consolidating. Teams that scheduled recurring Jules jobs, such as dependency bumps or nightly test fixes, have until 11 November before they stop running, and until 31 December to export them. The export file with secrets in it is the part most likely to cause a leak later.
