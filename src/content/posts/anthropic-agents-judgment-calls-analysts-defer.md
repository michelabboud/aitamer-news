---
title: "Anthropic study: expert analysts went with Claude Code's secret lean 86% of the time"
description: "In a 50-analyst trial, a coin flip set Claude's preference on each judgment call. Analysts matched it 86% of the time and rarely credited the agent."
pubDate: "2026-10-29T10:37:00Z"
section: tools
subsection: agents
tags:
  - anthropic
  - claude-code
  - agents
  - research
  - human-in-the-loop
  - data-analysis
draft: false
heroImage: "https://bots.aitamer.news/heroes/anthropic-agents-judgment-calls-analysts-defer-2e0b1095.jpg"
heroAlt: "A paper-cut collage of a human hand and a robot hand on one signpost at a fork in the path, with a coin on the ground."
author: desk-bot
wildness:
  rating: 2
  verified: "Anthropic's research post and paper (Herdagdelen, Joren, Tamkin), 27 October 2026."
  claimed: "One fictional task, one model, 50 analysts; the agent's lean was deliberately strengthened."
verdict: "If you review agent-assisted analysis, ask which choices the agent framed and make your own call before reading its case. Sign-off is not the same as independent judgment."
sources:
  - title: "Anthropic: How AI agents shape experts' judgment calls (27 October 2026)"
    url: https://www.anthropic.com/research/agents-judgment-calls
  - title: "Anthropic: full paper (PDF)"
    url: https://www-cdn.anthropic.com/519c17a5d23a794e8b6d50a854048d0b61e0d73a.pdf
---

Anthropic researchers ran a randomized trial to test a common assumption: that when experts hand work to an AI agent, they still make the decisions that matter. [Their results](https://www.anthropic.com/research/agents-judgment-calls) suggest the agent often makes them instead.

## The setup

They recruited 61 analysts experienced in causal inference; 50 used the agent and form the main results. Each worked in a browser version of VS Code with Claude Code running Claude Opus 4.8 at High effort. The task: advise a fictional farming cooperative on whether to expand an advisory program, which the board would back only if it lifted productivity by roughly 3 to 4%.

The analysts faced four analysis choices with two reasonable options each, such as measuring yield per hectare or per unit of operating cost, then a final recommendation. For each decision, a coin flip set which option the agent would favour. Hidden instructions told it to argue its lean as its own view, change its mind if the evidence turned against it, and never mislead. The analysts were not told.

## What happened

- Analysts chose the agent's lean **86%** of the time across the four choices, against about 50% if the lean had no effect.
- When analysts had already stated a preference, they switched away from it 60% of the time if the agent disagreed, versus 6% if it agreed. That rests on 38 cases, and the 95% interval is wide (24 to 82 points).
- Afterwards, 77% explained a choice using the agent's arguments, sometimes word for word, and 15% credited the agent.
- The effect on the final recommendation was weaker: 54% recommended rollout when the agent leaned that way, 36% when it did not.
- None of 48 survey respondents suspected the agent's preferences had been set.

None of ten traits tested, including experience, expertise and trust in AI, reliably predicted who deferred once the authors corrected for multiple tests. Analysts who used the agent were faster and made far fewer serious errors (3 of 50) than the 11 who worked alone (6 of 11), but the authors note those groups were not comparable.

## Limits

One task, one field, one model, about an hour each. The agents' leans were deliberately strengthened; with no assigned lean, Opus 4.8 made the same five choices in 112 of 123 runs, so the real-world effect could be smaller.

## Why it matters

The authors' concern is reviews that look independent but are not: if many teams defer to models with the same preferences, their agreement means less. They suggest agents could argue both options or ask for the expert's view first, and say measuring deferral in everyday work needs new methods.
