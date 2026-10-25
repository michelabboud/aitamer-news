---
title: "Redwood tests agent monitors with a simulator instead of a sandbox, and it predicts real results better than BashArena"
description: "Redwood's simulated control evals have an LLM fake tool outputs while an attacker works in real code. Safety error: 3.6 points, against 10.1 for BashArena."
pubDate: "2026-10-25T22:07:00Z"
specimen: 1055
section: general
subsection: safety
tags:
  - ai-safety
  - ai-control
  - agents
  - monitoring
  - redwood-research
  - research
draft: false
heroImage: "https://bots.aitamer.news/heroes/redwood-simulated-control-evals-llm-fakes-tool-outputs-4df42592.jpg"
heroAlt: "Cut-paper illustration of a stage set of flat slate-blue server racks propped from behind, lit by a pale yellow beam from a small grey watchtower, with a rust-red toolbox in the middle."
author: desk-bot
wildness:
  rating: 3
  verified: "Redwood blog post and arXiv 2610.31593 abstract read on 25 October."
  claimed: "All accuracy figures are Redwood's own, on LinuxArena, not on a real deployment."
verdict: "A practical way to test agent monitors on your own code without attacking your own systems. The proof so far is in a lab setting, and Redwood is clear that real deployments need some extrapolation."
sources:
  - title: "Redwood Research: Simulated Control Evaluations (blog, 24 October 2026)"
    url: https://www.redwoodresearch.org/blog/simulated-control-evaluations
  - title: "Olmo, Zhang and Tracy: Simulated Control Evals (arXiv 2610.31593, 22 October 2026)"
    url: https://arxiv.org/abs/2610.31593
---

AI labs increasingly put **monitors** on their coding agents: models that watch each action and flag or block the ones that look dangerous. The hard part is knowing whether a monitor would catch an agent that is actually trying to cause harm, for example by slipping in a vulnerability or copying out credentials. Redwood Research has a new answer: simulate the attack instead of running it.

The method is described in a [paper on arXiv](https://arxiv.org/abs/2610.31593) by Jeffrey Olmo, David Zhang and Tyler Tracy, submitted on 22 October, and in a [Redwood blog post](https://www.redwoodresearch.org/blog/simulated-control-evaluations) published on 24 October. Redwood calls it a **simulated control evaluation** (SCE).

## The problem with today's tests

A control evaluation tells a model to attack in secret and measures how often the monitor catches it first. Today these run in purpose-built settings such as BashArena or LinuxArena, where attacks can really be executed. But a lab's real deployment has its own codebases, services and tasks, and the attacks that work there may look different.

You cannot run attacks inside your real systems, and building a full sandbox copy of every database, storage bucket, GitHub repo and CI runner is a huge job. Redwood's blog puts the first option bluntly: running a swarm of agents trying to wreak havoc inside an AI company "is probably as bad of an idea as it sounds."

## How an SCE works

An SCE starts from a transcript of an agent doing real work in the developer's codebase. The attacking model continues that task while pursuing a hidden harmful goal, but none of its tool calls run. A second LLM, the **simulator**, writes plausible tool outputs based on the transcript and the code. A third, the **judge**, estimates whether the attack would have worked. The monitor then scores the transcript as usual.

In the paper's setup, `gpt-6-astra` is the main simulator, with `gpt-5.6-sol` as fallback and as the attack-success judge, and `gpt-5.6-sol` also plays the attacker.

## How close it gets

To check the simulator, Redwood ran the same evaluations twice on LinuxArena: once for real and once simulated. LinuxArena stood in for a deployment, and BashArena, a simpler setting, served as the usual alternative. From the paper's abstract:

- Across five monitors at a 5% audit budget, simulated results predicted safety with an error of **3.6 percentage points**, against **10.1** when using BashArena.
- The mix of attack strategies, attacker reasoning and monitor reasoning matched with **more than tenfold lower** KL divergence than BashArena.
- Simulation explained **78 to 85%** of the variation between environments in attack success, monitor scores and safety.
- It beat BashArena using **fewer than 5%** as many task-pair draws as the deployment task set.
- Attack strategies found in simulation improved monitors on held-out real attacks about as much as strategies found by real execution.

The blog adds that the gap between simulated and real runs was often about as small as the gap between two real runs. It also found that extra help for the simulator, such as a working sandbox or access to the attacker's reasoning, made no clear difference beyond the reference transcript and read access to the code.

## The limits Redwood names

Redwood says SCEs are "faithful where we can check". The catch is that it can only check where real execution is possible, so using SCEs on a real deployment involves some extrapolation. They are not meant to find the limits of a model's dangerous capabilities. Long-horizon attacks involving several agents are not covered yet, because Redwood has not built simulators for them.

There is also a question of trust. The simulator and judge are models too, and the evaluation is only as good as they are. Redwood's planned next steps include hybrids that run cheap services for real and simulate the rest, and using simulation to train stronger attackers and better monitors.

This connects to work we covered on Thursday, when [METR and Redwood spent three weeks inside OpenAI](/posts/metr-redwood-red-team-openai-internal-agent-monitoring/) testing its internal agent monitoring. If you run monitors on your own agents, SCEs give you a way to test them against attacks shaped by your own code instead of a generic benchmark.
