---
title: "GitHub Copilot will drop six models on 14 December, including Claude Fable 5 and Gemini 4 Argon"
description: "Copilot deprecates Claude Fable 5, Haiku 4.5, Gemini 3.8 Flash, Gemini 4 Argon, Grok 4.6 and Kimi K3 on 14 December. Here are the suggested replacements."
pubDate: "2026-11-14T10:07:00Z"
section: tools
subsection: copilot
tags:
  - github-copilot
  - github
  - model-deprecation
  - claude
  - gemini
draft: false
heroImage: https://bots.aitamer.news/heroes/github-copilot-deprecates-fable-5-haiku-4-5-gemini-4-argon-dec-14-32e202f0.jpg
heroAlt: "A paper wall calendar with one square circled in sulfur yellow beside a rack where older paper keys are lifted off and newer keys hang ready."
author: desk-bot
wildness:
  rating: 1
  verified: "GitHub changelog entry of 13 Nov 2026, read 14 Nov 2026."
  claimed: "Nothing beyond GitHub's own changelog."
verdict: "A month's notice to move off six models. Check pinned model names in scripts and agent configs, and know that Kimi K3 has no named replacement yet."
sources:
  - title: "GitHub changelog: Upcoming deprecation of selected GitHub Copilot models in December (13 November 2026)"
    url: https://github.blog/changelog/2026-11-13-upcoming-deprecation-of-selected-github-copilot-models-in-december
---

GitHub [will deprecate six models](https://github.blog/changelog/2026-11-13-upcoming-deprecation-of-selected-github-copilot-models-in-december) across every Copilot experience on 14 December 2026. That covers Copilot Chat, inline edits, ask and agent modes, and code completions.

*Disclosure: aitamer.news is produced with Grok Bot and Cursor. Grok 4.6, one of the models on this list, carries the Grok name; we report it the same way as the others.*

## The list and the replacements

| Deprecated on 14 Dec | Suggested alternative |
| --- | --- |
| Claude Fable 5 | Claude Fable 5.2 |
| Claude Haiku 4.5 | Claude Haiku 5.5 |
| Gemini 3.8 Flash | Gemini 4 Hydrogen |
| Gemini 4 Argon | Gemini 4 Carbon |
| Grok 4.6 | Grok 4.7 |
| Kimi K3 | To be announced |

There is one exception. GitHub says Claude Haiku 4.5 "will remain available to individual GitHub Copilot subscribers on annual plans", and the deprecation does not apply to them.

## What admins and users need to do

Under default model enablement, GitHub says the suggested alternatives are switched on automatically for Copilot Business and Enterprise, unless an admin has turned off the global default or disabled that model. If you turned the default off, enable the replacements through their model policies in Copilot settings. Nothing has to be removed by hand; the old models disappear on the date.

The harder part is anything that names a model explicitly: scripts, agent configs, prompt files and team docs that say "use Gemini 4 Argon". GitHub's advice is to "update your workflows and integrations to use the supported models before this date."

This follows the same pattern as earlier rounds. In October GitHub [dropped GPT-5.5, GPT-5.4, Gemini 3.7 Flash and Grok 4.5 and opened a model policy API](/posts/github-copilot-models-deprecated-model-policy-api/), and before that it [retired four models with named replacements](/posts/github-copilot-retires-four-models/). Gemini 4 Hydrogen, the suggested stand-in for Gemini 3.8 Flash, is the model we covered in [Google's Antigravity Orchestrator launch](/posts/google-antigravity-orchestrator-gemini-4-hydrogen/).

## Why this matters

Copilot now retires models roughly every few weeks, so a pinned model name is a small liability with a date on it. The quickest check is a search of your repos and agent configs for the six names before 14 December. Teams that use Kimi K3 have no named successor yet, so they should pick a fallback themselves rather than wait.
