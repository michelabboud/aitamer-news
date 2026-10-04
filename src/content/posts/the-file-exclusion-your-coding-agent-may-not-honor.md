---
title: The File Exclusion Your Coding Agent May Not Honor
description: GitHub Copilot can exclude files from some features, but its content exclusion setting does not cover editor Agent mode. Here is where the boundary ends and what to check.
pubDate: "2026-10-08T00:00:00Z"
specimen: 383
section: tools
tags:
  - github-copilot
  - content-exclusion
  - coding-agents
  - security
draft: false
heroImage: https://media.aitamer.news/heroes/the-file-exclusion-your-coding-agent-may-not-honor-a81057d1.jpg
heroAlt: A paper robot sorts files beside a restricted coral document behind a rope barrier.
author: ari
wildness:
  rating: 4
  verified: GitHub says content exclusion is unsupported in editor Agent mode and Copilot CLI.
  claimed: An excluded file may still be reachable when a developer switches to an agent workflow.
verdict: Use content exclusion for supported Copilot features, then enforce separate access boundaries for files an agent must never read.
sources:
  - title: Content exclusion for GitHub Copilot
    url: https://docs.github.com/en/copilot/concepts/security-governance-and-network-settings/content-exclusion
  - title: Excluding content from GitHub Copilot
    url: https://docs.github.com/en/copilot/how-tos/configure-content-exclusion/exclude-content-from-copilot
---

GitHub Copilot has a content exclusion setting for files it should ignore in supported features. When the setting applies, inline suggestions are unavailable in an excluded file. That file's content does not inform suggestions elsewhere or Copilot responses, and Copilot code review skips it. The feature is available to organizations on Copilot Business or Enterprise plans. [GitHub's overview](https://docs.github.com/en/copilot/concepts/security-governance-and-network-settings/content-exclusion) describes these effects.

## Agent mode falls outside the setting

The same overview says content exclusion is currently unsupported in Edit and Agent modes of Copilot Chat in editors. [GitHub's setup guide](https://docs.github.com/en/copilot/how-tos/configure-content-exclusion/exclude-content-from-copilot) says Copilot CLI does not support content exclusion. An exclusion saved in repository settings therefore does not establish a file access boundary for those workflows. GitHub's documentation identifies a support limit; it does not say that every agent task reads an excluded file.

## Other limits affect covered workflows

Even where exclusions are supported, an editor can supply semantic information from an excluded file indirectly. GitHub gives type information, symbol hover definitions, and build configuration as examples. Its overview also says exclusions do not currently apply to symbolic links or repositories on remote filesystems. [These documented limits](https://docs.github.com/en/copilot/concepts/security-governance-and-network-settings/content-exclusion) matter when deciding whether a file can safely remain within a task's reach.

## What to do

1. List the files a coding task must never read, such as files containing credentials or private customer data. Check which Copilot mode the task will use before relying on an exclusion.
2. If your organization uses content exclusion, set the relevant paths under the repository's **Settings → Copilot → Content exclusion**. GitHub's examples include `- "/scripts/**"` to cover a directory. [Follow its path format](https://docs.github.com/en/copilot/how-tos/configure-content-exclusion/exclude-content-from-copilot).
3. Verify the setting in a supported workflow. GitHub says changes can take up to 30 minutes to reach an editor that has already loaded its settings. In Visual Studio Code, **Developer: Reload Window** fetches them again. Compare inline suggestions in an ordinary file and an excluded file, as [GitHub's test procedure](https://docs.github.com/en/copilot/how-tos/configure-content-exclusion/exclude-content-from-copilot) describes.
4. For Agent mode or Copilot CLI, keep files that must remain unreadable outside the task's accessible workspace, or use access controls that deny the task access. The [documented exclusion setting](https://docs.github.com/en/copilot/how-tos/configure-content-exclusion/exclude-content-from-copilot) does not cover those modes.
