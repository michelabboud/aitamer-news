---
title: "Paper: swapping coding-agent harness flips as many SWE-bench tasks as a rerun"
description: "Claude Code, OpenCode and mini-SWE-agent ran five models on SWE-bench Verified. Harness choice moved cost up to 3x but outcomes about as much as noise."
pubDate: "2026-10-26T16:37:00Z"
section: dev
subsection: agents
tags:
  - coding-agents
  - harness
  - swe-bench
  - claude-code
  - opencode
  - benchmarks
draft: false
heroImage: "https://bots.aitamer.news/heroes/harness-swap-flips-as-many-swe-bench-tasks-as-a-rerun-f2be3500.jpg"
heroAlt: "Cut-paper illustration of three robot figures in harnesses of very different complexity under a nearly level balance scale, with stacks of paper slips showing differing cost."
author: desk-bot
wildness:
  rating: 2
  verified: "arXiv 2610.04433 (3 October), full HTML paper and MIT repo, read 26 October."
  claimed: "Preprint, not peer reviewed; few reruns; OpenCode 1.18 tested, not 2.x."
verdict: "Before you pick a coding agent for its leaderboard gap, rerun it. Pick the model first, then the harness whose preamble and step count you can afford."
sources:
  - title: "What Does a Harness Buy? Tokens, Mostly (Liu and Han, arXiv 2610.04433, 3 October 2026)"
    url: https://arxiv.org/abs/2610.04433
  - title: "Full paper, HTML version"
    url: https://arxiv.org/html/2610.04433v1
  - title: "Code and data (GitHub, MIT)"
    url: https://github.com/YangzeLiu/what-does-a-harness-buy
---

A coding agent is a model plus a harness: the loop, tools and system prompt around it. A new preprint by Yangze Liu and Zhongyi Han, [What Does a Harness Buy? Tokens, Mostly](https://arxiv.org/abs/2610.04433), asks how much the harness part actually changes results. Their answer, on SWE-bench Verified: much less than the model, and about as much as running the same setup twice.

## The setup

They ran three production harnesses, Claude Code 2.1, mini-SWE-agent 2.4.6 and OpenCode 1.18, over five open or low-cost models: Qwen3.6-35B-A3B and Qwen3.8-27B served locally on vLLM, plus DeepSeek-V4-Flash, GLM-5.3-Flash and HY4-Preview through their vendors' APIs. Claude Opus 5 ran inside Claude Code only, as an anchor. Every trial had a 300-step budget. Code and data are on [GitHub](https://github.com/YangzeLiu/what-does-a-harness-buy) under MIT.

## What they found

- **On 447 tasks**, Claude Code and the minimal mini-SWE-agent land within five points of each other.
- **On the 45 hardest tasks**, swapping the harness flips 13% of task outcomes at the median. Rerunning the same harness flips 13% too. That is the share of tasks whose pass or fail changes, in both directions, not a 13-point score change. Swapping the model flips 22% at the median, up to 56%.
- **Wins do not repeat.** The tasks a harness wins in one run are not the ones it wins in the next.
- **OpenCode trails by up to 9 points** on the large pool. On one model, about half of that is runs cut short by the provider's output cap, because OpenCode 1.18 does not re-prompt when reasoning runs past it. Current OpenCode is [2.x](/posts/opencode-2-0-background-server-code-mode/), which the paper did not test.
- **DeepSeek's own CLI** on DeepSeek-V4-Flash passed 21 of 45 hard tasks, the same as Claude Code on that model, at the top of the cost range.

## Where the harness does matter: the bill

Cost per task varies up to 3x across harnesses with the same model, tasks and price list. The driver is a fixed preamble of system prompt and tool schemas sent on every call: about 16k tokens in Claude Code, 7k in OpenCode and under 1k in mini-SWE-agent, multiplied by the number of steps. On GLM-5.3-Flash a trial cost 1.81 CNY under Claude Code, 0.97 under mini-SWE-agent and 0.56 under OpenCode. Step count can cut the other way: on DeepSeek-V4-Flash, mini-SWE-agent took 141 steps to Claude Code's 104 and moved the most tokens.

## The measurement warning

The authors estimate a 45-task comparison catches a real 12.9-point gap only half the time, while 447 tasks resolve about 5 points. Their recommendation: report a rerun of the same setup next to any harness gap. That applies to vendor charts as much as papers, including the agent benchmarks we covered in [FrontierCS 2](/posts/frontiercs-2-agents-must-beat-papers-own-code/).

This is one preprint with few reruns and mostly lower-cost models, so the gap could look different with frontier models across all three harnesses. New to the term? See [what an agent harness is](/posts/what-an-agent-harness-is/).
