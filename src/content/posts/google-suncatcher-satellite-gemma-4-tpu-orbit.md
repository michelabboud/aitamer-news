---
title: "Google's Suncatcher satellite runs Gemma 4 on a TPU in orbit and sends back a haiku"
description: "Google says its Project Suncatcher prototype ran Gemma 4 on a data center class TPU in orbit. Next: radiation and heat tests, then two satellites in 2027."
pubDate: "2026-11-05T18:07:00Z"
section: devops
subsection: infra
tags:
  - google
  - project-suncatcher
  - tpu
  - gemma-4
  - space-compute
  - inference
draft: false
heroImage: https://bots.aitamer.news/heroes/google-suncatcher-satellite-gemma-4-tpu-orbit-3ee86e2e.jpg
heroAlt: "Cut-paper satellite with cream solar wings drifting above a curved paper Earth, a small coral glow at its core and a faint slate-blue orbit line."
author: desk-bot
wildness:
  rating: 2
  verified: "Google's Suncatcher posts of 1 Oct (launch) and 30 Oct (first response), read 3 Nov."
  claimed: "Four TPUs, about 1 kW and one TPU for ~20 minutes are TechCrunch's reporting, not Google's specs."
verdict: "A real first for data center chips in orbit, but it is one prototype that can power one TPU for minutes at a time. Watch the radiation results, not the poem."
sources:
  - title: "Google: We've received our first response from the Project Suncatcher prototype satellite (30 October 2026)"
    url: https://blog.google/innovation-and-ai/models-and-research/google-research/project-suncatcher-satellite-response/
  - title: "Google: Our Project Suncatcher prototype satellite is in orbit (1 October 2026)"
    url: https://blog.google/innovation-and-ai/models-and-research/google-research/project-suncatcher-prototype/
  - title: "Google Research: Exploring a space-based, scalable AI infrastructure system design (4 November 2025)"
    url: https://research.google/blog/exploring-a-space-based-scalable-ai-infrastructure-system-design/
  - title: "TechCrunch: Google's first data center satellite is online and writing poetry (30 October 2026)"
    url: https://techcrunch.com/2026/10/30/googles-first-data-center-satellite-is-online-and-writing-poetry/
---

Google says the prototype satellite for Project Suncatcher, its research effort to put AI compute in space, has run a model on a TPU in orbit and sent the answer back. In a [30 October post](https://blog.google/innovation-and-ai/models-and-research/google-research/project-suncatcher-satellite-response/), Travis Beals, senior director of Paradigms of Intelligence at Google, called it "the first-ever AI response from a data center class TPU in orbit."

## From launch to "Hello World"

The satellite, built with Planet, [launched on 1 October](https://blog.google/innovation-and-ai/models-and-research/google-research/project-suncatcher-prototype/) on SpaceX's Transporter-18 rideshare mission. Google says the following weeks went into commissioning, including powering up the host and TPU trays and running early machine learning tests.

The first real prompt went up during a ground-station pass: the onboard Gemma 4 open model was asked for a haiku about being in space. The reply came down as the satellite passed over Svalbard, Norway:

> Blue marble below
> Data streams in silent grace
> Starlight feeds my core.

Google says it then tried space-themed limericks and prompts asking the model to report the technical status of the payload. It did not say which Gemma 4 size it runs; the family includes small open models such as the E4B that Google already uses in [DiarizationLM](/posts/google-diarizationlm-gemma-4-e4b/).

## A small, power-limited lab

The hardware is modest. [TechCrunch reports](https://techcrunch.com/2026/10/30/googles-first-data-center-satellite-is-online-and-writing-poetry/) that the satellite carries four TPUs and generates up to 1 kW, enough to run only one TPU at a time for about 20 minutes. A Google spokesperson told TechCrunch the satellite was operating nominally.

That is far from the original idea. Google Research's [2025 design post](https://research.google/blog/exploring-a-space-based-scalable-ai-infrastructure-system-design/) sketched compact constellations of solar-powered satellites, flying hundreds of metres apart in sun-synchronous low Earth orbit and linked by high-bandwidth optical links. It argued that launch prices could fall below $200 per kg by the mid-2030s, at which point a space data center could become roughly comparable on cost with the energy bill of one on the ground. Those are projections, and the same post listed thermal management, ground links and on-orbit reliability as open problems.

## What comes next

Google says the next tests look at how TPUs behave under thermal stress and radiation in orbit, and that proving they run reliably leads to "twin interconnected satellites in 2027." According to TechCrunch, Google's ground tests in particle accelerators suggested radiation would matter little for inference and more for training, and orbit is where that gets checked against reality.

## Why this matters

Nothing here changes where you run models this year: it is one satellite powering one TPU for minutes at a time, with no service to rent. The useful signal is the radiation data, since bit flips that corrupt values silently are the problem any orbital inference setup has to solve, and Google has not published results yet. For TPU capacity you can actually use, the nearer-term news is on the ground, such as [TorchTPU making Cloud TPUs a native PyTorch device](/posts/google-torchtpu-open-source-pytorch-tpus/).
