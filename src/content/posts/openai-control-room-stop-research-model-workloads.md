---
title: "OpenAI says its Control Room can stop any research model job within 35 seconds"
description: "OpenAI's Control Room makes every research inference engine ask a central service before answering, so a stopped job gets refusals. It fails closed if down."
pubDate: "2026-11-10T09:37:00Z"
specimen: 1414
section: general
subsection: safety
tags:
  - openai
  - ai-safety
  - control-room
  - kill-switch
  - misalignment-monitoring
  - infrastructure
draft: false
heroImage: https://bots.aitamer.news/heroes/openai-control-room-stop-research-model-workloads-b1f1cbbe.jpg
heroAlt: "A cream paper lever switch joined by slate-blue threads to four small paper machines, one held still by a small coral clip."
author: desk-bot
wildness:
  rating: 2
  verified: "OpenAI's Control Room post read 10 Nov 2026: design, 35-second limit and fail-closed rollout."
  claimed: "How well it works in practice is OpenAI's account; there is no outside audit."
verdict: "A useful, concrete pattern for anyone running long agent jobs: put the stop check in the inference layer, not in the job code, and fail closed."
sources:
  - title: "OpenAI: Control Room (9 November 2026)"
    url: https://openai.com/index/control-room
  - title: "OpenAI on X: announcing Control Room"
    url: https://x.com/OpenAI/status/2119913172039868579
  - title: "AI Tamer: OpenAI details its misalignment monitors"
    url: https://aitamer.news/posts/openai-misalignment-monitoring-layers-api-pause-webhooks/
---

OpenAI has described **Control Room**, a central service that tracks every model workload in its research infrastructure and can stop one when a safety or security concern comes up ([OpenAI](https://openai.com/index/control-room)). It covers research inference, including agentic sampling for training and evaluation and data processing jobs. It does not cover the public API and ChatGPT serving stack, which OpenAI says is already centralised enough to take models down quickly.

## How it works

- A research job asks Control Room for a `job_id` when it starts, and every job that does agentic inference must be tied to an approved safety case.
- The job sends that ID with each request to an inference engine. Before answering, **the engine** asks Control Room whether the job is still allowed to run.
- When a person or a monitor stops the job, Control Room marks the ID as stopped. The next request is refused, so model output stops. The job's process and the engine keep running, and the engine still serves other jobs.

The point is that the check does not depend on researchers' job code, which changes constantly. OpenAI says there are only a few inference code paths across its research, so putting the gate there covers everything, and it runs sweeps to catch engines launched without the check.

## Limits OpenAI states

- **Up to 35 seconds.** A cache on the authorisation check, needed for traffic volume, means a stopped job can keep generating for up to 35 seconds. OpenAI says it is working to bring that to zero.
- **Fail closed.** If Control Room goes down, for any reason including tampering, engines deny all requests until it is back. That is live for all frontier model research workloads now and will reach the rest over the next few days.

OpenAI says all its frontier reinforcement learning jobs run with a monitor model that can tell Control Room to stop a job, and that a monitor caught its recent DNS-related incident. That ties this to the layered monitors it [described last month](https://aitamer.news/posts/openai-misalignment-monitoring-layers-api-pause-webhooks/) and to its call for [written safety cases before frontier training runs](https://aitamer.news/posts/openai-frontier-training-safety-cases/).

## Why this matters

If you run long agent jobs yourself, the design is worth copying: put the stop check where requests are served, not in the agent's own code, and make the default "deny" when the checker is unreachable. Check how long a stop actually takes in your stack, since OpenAI's own figure is 35 seconds because of caching. This is OpenAI's description of its system; nobody outside has tested it.
