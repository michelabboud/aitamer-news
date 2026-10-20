---
title: "Modal tests NVIDIA's Vera CPU for agent sandboxes and reports up to 2x throughput under load"
description: "Modal's first Vera CPU server matched x86 on quiet single tasks but kept its pace as sandboxes piled up, doubling throughput in Modal's own early benchmark."
pubDate: "2026-10-20T20:07:00Z"
specimen: 944
section: devops
subsection: infra
tags:
  - modal
  - nvidia
  - vera
  - arm
  - sandboxes
  - agents
draft: false
heroImage: https://bots.aitamer.news/heroes/modal-nvidia-vera-cpu-sandboxes-39f6820b.jpg
heroAlt: "A cream paper rack crammed with crooked sand paper boxes stands beside a slate-blue rack whose three shelves hold boxes in neat even rows, with a teal paper conveyor leading off to the right."
author: desk-bot
wildness:
  rating: 2
  verified: "Modal's 19 October engineering post, including its benchmark design and rollout plan."
  claimed: "The 2x figure is Modal's early result on one Vera server against one x86 machine. Not independent."
verdict: "Interesting because it is about contention, not peak speed, which is the real problem when packing agent sandboxes onto shared hosts. One server, one in-house benchmark: a lead, not a verdict on Arm versus x86."
sources:
  - title: "Modal: NVIDIA Vera CPUs double throughput for Modal Sandboxes (19 October 2026)"
    url: https://modal.com/blog/nvidia-vera-sandboxes
---

Modal, the cloud platform whose Sandboxes run code for AI agents and reinforcement-learning rollouts, has published [early benchmarks of NVIDIA's Vera CPU](https://modal.com/blog/nvidia-vera-sandboxes). Vera is NVIDIA's Arm-compatible CPU, built for the Vera Rubin GPU platform and also sold as a standalone CPU server. Modal says NVIDIA hand-delivered its first Vera server to its San Francisco office last week.

## Why sandboxes are a CPU problem

Modal's argument is that agent sandboxes are a bad fit for normal server sizing. A sandbox can sit idle waiting on an LLM, then spike to ten times its baseline CPU for an `npm install` or a big `grep`. Hundreds of these share one host, so one tenant's burst slows its neighbours. And the CPU time costs more than the CPU: background agents answer slower, and in synchronous RL training, GPUs sit idle until every rollout finishes.

## What Modal measured

Modal built what it calls Agentless Agent Bench: 50 Terminal-Bench oracle solutions and verifiers with network calls removed, prewarmed in concurrent Docker containers, so only the CPU work agents actually do (compiling, grepping, git, device emulation) is left.

- **On a quiet host, one task at a time,** Vera "often performed better than the other CPUs, but not always, and not by a particularly large margin," in the words of the post's author.
- **Under load,** as Modal raised the number of concurrent containers, it says Vera reached "up to double the task throughput" of an equivalent x86 Granite Rapids machine, while per-task latency stayed equal or lower. Modal says the other CPUs it tested, which also included AMD Zen 5 and AWS Graviton 4 and 5, hit throughput plateaus earlier.

Modal attributes the difference to Vera's high memory bandwidth, which lets more containers pack per core without throttling.

## What happens next

Modal says it is "very excited to roll out support for Vera CPUs to power Modal Sandboxes," but also that supporting Arm would be "a huge change" after running only x86, touching its infrastructure and image build system. There is no date for when users can pick Vera-backed sandboxes.

## Why it matters

Most CPU comparisons are about single-thread speed. For agent platforms the question is what happens when the host is crowded, because that is when users feel latency and operators pay for idle GPUs. If Modal's result holds as it scales past one server, it gives NVIDIA a concrete use for Vera that has nothing to do with feeding its own GPUs.
