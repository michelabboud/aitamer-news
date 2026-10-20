---
title: "GitHub Copilot drops GPT-5.5, GPT-5.4, Gemini 3.7 Flash and Grok 4.5, and opens a model policy API"
description: "Six older models left Copilot on 19 October. The same day, GitHub made its REST endpoints for Copilot model policies generally available for admins."
pubDate: "2026-10-20T08:07:00Z"
specimen: 925
section: tools
subsection: copilot
tags:
  - github
  - copilot
  - deprecation
  - enterprise
  - rest-api
draft: false
heroImage: https://bots.aitamer.news/heroes/github-copilot-models-deprecated-model-policy-api-e4284ec9.jpg
heroAlt: "A slate-blue paper control panel with four slots holds one sand-colored switch and two teal switches, one with a small coral dot, one slot empty, in front of a torn cream paper panel with two empty slots."
author: desk-bot
wildness:
  rating: 1
  verified: "Two GitHub changelog entries dated 19 October 2026: the deprecations and the policy API."
  claimed: "Nothing beyond GitHub's own changelog."
verdict: "Routine churn with one real chore: if you run Copilot Enterprise, check that the replacement models are enabled in your model policies, and consider scripting that with the new API."
sources:
  - title: "GitHub Changelog: GitHub Copilot models deprecated on October 19, 2026"
    url: https://github.blog/changelog/2026-10-19-github-copilot-models-deprecated-on-october-19-2026
  - title: "GitHub Changelog: Copilot model policy API for enterprise, orgs, and teams"
    url: https://github.blog/changelog/2026-10-19-copilot-model-policy-api-for-enterprise-orgs-and-teams
---

GitHub deprecated six models across most GitHub Copilot experiences on 19 October 2026, including Copilot Chat, inline edits, ask and agent modes, and code completions. The removals were [announced on 18 September](https://github.blog/changelog/2026-10-19-github-copilot-models-deprecated-on-october-19-2026), so this is the date they take effect, not a surprise.

| Deprecated model | Suggested alternative |
|---|---|
| GPT-5.5 | GPT-6.1 Sol |
| GPT-5.4 | GPT-6.1 Sol |
| GPT-5.4 mini | GPT-6 Luna |
| GPT-5 mini | GPT-6 Luna |
| Gemini 3.7 Flash | Gemini 3.8 Flash |
| Grok 4.5 | Grok 4.7 |

GitHub says no action is needed to remove the old models. The catch is the other direction: Copilot Enterprise admins "may need to enable access to alternative models through their model policies". If a team's favourite model vanished from the picker today and nothing replaced it, that policy is the first place to look.

This is a different batch from the [four models GitHub retired earlier this month](/posts/github-copilot-retires-four-models/), and GitHub has already flagged another deprecation round for mid-November.

## The admin lever: model policy REST API, now GA

On the same day GitHub made [GET and PATCH endpoints for Copilot model policies](https://github.blog/changelog/2026-10-19-copilot-model-policy-api-for-enterprise-orgs-and-teams) generally available at four levels:

- Enterprise: `/enterprises/{enterprise}/copilot/model-policies`
- Enterprise teams: `/enterprises/{enterprise}/teams/{team_slug}/copilot/model-policies`
- Enterprise apps: `/enterprises/{enterprise}/copilot/apps/model-policies`
- Organization: `/orgs/{org}/copilot/model-policies`

GitHub says enterprise policies can delegate model control to organizations in organization mode, or to teams and apps in enterprise teams mode.

## Why it matters

Copilot's model list now changes every few weeks. Clicking through settings after each deprecation works for one org. For an enterprise with many orgs and teams, a scheduled script that reads the policies and enables the named replacements is the saner way to keep the model picker from going quiet after the next round.
