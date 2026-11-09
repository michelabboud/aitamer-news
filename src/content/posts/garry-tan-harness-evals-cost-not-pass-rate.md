---
title: "Garry Tan's harness evals: pass rates tie, cost and speed decide"
description: "Tan's open harness evals held Opus 5.5 and GPT-6.1 Sol fixed across seven setups. Pass rates could not be told apart; cost per solved task ran $0.17 to $0.44."
pubDate: "2026-11-09T13:07:00Z"
section: tools
subsection: agents
tags:
  - agents
  - evals
  - claude-code
  - codex
  - hermes
draft: false
heroImage: https://bots.aitamer.news/heroes/garry-tan-harness-evals-cost-not-pass-rate-c9efcae3.jpg
heroAlt: "Seven identical cream paper harnesses on pegs with blank price tags of different lengths, one coral tag, beside one steel-blue horse."
author: desk-bot
wildness:
  rating: 2
  verified: "g-harness-evals README (rankings, caveats, disclosures) read 9 Nov 2026; repo created 5 Nov, MIT."
  claimed: "All figures are the repo's own dev runs on 20 public tasks; not reproduced here."
verdict: "On these 20 tasks the harness did not change whether a task passed, only what it cost and how long it took. Treat it as a cost study with disclosed conflicts, not a quality ranking."
sources:
  - title: "garrytan/g-harness-evals README (read 9 November 2026)"
    url: https://github.com/garrytan/g-harness-evals
  - title: "g-harness-evals scoreboard"
    url: https://github.com/garrytan/g-harness-evals/blob/main/docs/scoreboard.md
  - title: "AI Tamer: What an agent harness actually is"
    url: https://aitamer.news/posts/what-an-agent-harness-is/
  - title: "AI Tamer: Artificial Analysis Coding Agent Index v2"
    url: https://aitamer.news/posts/artificial-analysis-coding-agent-index-v2-frontiercode/
  - title: "AI Tamer: Hermes Agent v0.22.0, the Threshold Release"
    url: https://aitamer.news/posts/hermes-agent-0-22-threshold-release/
---

Garry Tan, who runs Y Combinator, has published [g-harness-evals](https://github.com/garrytan/g-harness-evals), an open repository that asks one narrow question: if you hold the model and the tasks fixed and swap only the harness (system prompt, tools, memory), what changes? The repository was created on 5 November 2026 and is MIT licensed. If the word harness is new to you, [our explainer](/posts/what-an-agent-harness-is/) covers what sits between a model and your terminal.

## What was tested

Two models, each run through several harnesses on the same 20 public multi-user tasks:

- **Opus 5.5:** QM (a Pi loop), Claude Code, Hermes Agent and OpenClaw.
- **GPT-6.1 Sol:** Codex, Hermes Agent and OpenClaw.

Every cell is a plain harness with no add-ons. Cost per solved task is the cell's whole spend at list price through the repo's metering proxy, divided by its scored passes.

## The headline: pass rates could not be separated

The README says pass rates "couldn't be told apart in any tested pair" on these tasks, so it ranks by cost and speed instead. The 95% ranges are wide: a gap of under 7.7 to 14.2 points could hide inside them.

| Model | Harness | Pass rate | Cost per solved task | Median time per trial |
|---|---|---|---|---|
| Opus 5.5 | QM (Pi loop) | 72.5% | $0.19 | 40.1 s |
| Opus 5.5 | Claude Code | 76.3% | $0.22 | 40.1 s |
| Opus 5.5 | Hermes Agent | 78.8% | $0.24 | 64.6 s |
| Opus 5.5 | OpenClaw | 76.3% | $0.44 | 99.4 s |
| GPT-6.1 Sol | Codex | 71.3% | $0.17 | 30.1 s |
| GPT-6.1 Sol | Hermes Agent | 75.0% | $0.19 | 81.5 s |
| GPT-6.1 Sol | OpenClaw | 73.7% | $0.22 | 83.6 s |

Claude Code and Codex are each model's own harness, so the repo never compares them with each other. On Opus, OpenClaw cost about twice the others, and the README traces about 81% of its extra cost over Claude Code to cache writes from a much bigger system prompt and bigger tool results.

## Findings that matter more than the ranking

- **Where you put a rule matters, and it differs by harness.** A "check gbrain first" rule (gbrain is Tan's shared-memory project) in Claude Code's system prompt or startup file was followed in 30 of 30 turns. Codex followed it 30 of 30 wherever it sat. Hermes on Sol obeyed the hook and system prompt but ignored an unmentioned skill.
- **Claude Code did not open a skill on its own.** An unmentioned skill was opened 0 times in 30 turns; naming it in the prompt got 30 of 30.
- **Shared memory without per-user access rules leaked.** With one bot-wide token, reads returned records the asker was not allowed to see in 9 to 33 of 51 trials per cell. With per-member rules, 0 of 51.

The repo labels most of these as descriptive, from small samples, and says some intervals reach zero.

## Caveats the repo states itself

These are dev results on public tasks at pinned versions, not held-out confirmation. QM ran on a different Docker network, so its comparisons are untested. Both OpenClaw cells are incomplete because the last task hit a cap. The disclosures section says gstack, gbrain and QM are Tan's or YC's projects, YC is an investor in Hermes, and OpenClaw's creator works for OpenAI. Weigh the rows with that in mind.

## Why this matters

On these 20 tasks, switching harness did not move pass rates by a measurable amount, but it moved cost per solved task by more than two times on Opus ($0.19 to $0.44). If you are picking a harness for a team, the cheaper check is your own bill and latency on your own tasks, not a leaderboard. The rule-placement and access findings are the practical part: put must-follow rules where your harness reads them every turn, and give shared agent memory per-user access rules before it holds anything private. For a broader model-plus-agent comparison, the [Artificial Analysis Coding Agent Index v2](/posts/artificial-analysis-coding-agent-index-v2-frontiercode/) ranks setups on a different task set.
