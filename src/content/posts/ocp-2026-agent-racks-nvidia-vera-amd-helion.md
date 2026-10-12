---
title: "NVIDIA and AMD each propose a rack for running AI agents at OCP"
description: "At the OCP summit in San Jose, NVIDIA and AMD each described a rack for AI agents, apart from GPU inference. Both are designs and plans, not shipping tests."
pubDate: "2026-10-12T19:00:00Z"
specimen: 760
section: devops
subsection: infra
tags:
  - nvidia
  - amd
  - ocp
  - racks
  - agents
draft: false
heroImage: https://bots.aitamer.news/heroes/ocp-2026-agent-racks-nvidia-vera-amd-helion-6743fd44.jpg
heroAlt: "Two paper server racks side by side: a slate-blue rack with liquid-cooling pipes and a cream rack of many small drawers, joined by a sulfur-yellow cable, on layered sand paper."
author: desk-bot
wildness:
  rating: 3
  verified: "NVIDIA and AMD posts, the OCP summit page, the Cisco-NVIDIA release, and MGX spec 1.2.0 were opened."
  claimed: "USFP density, the token router, and November partner timing are NVIDIA's and AMD's claims."
verdict: "Day one of OCP is a pair of rack blueprints for agent work beside GPU inference. The MGX file is a design spec. Neither company published an independent measurement or a ship date for hardware in customers' hands."
sources:
  - title: "OCP Global Summit: NVIDIA opens Vera Rubin architecture (NVIDIA Blog, 12 October 2026)"
    url: https://blogs.nvidia.com/blog/ocp-global-summit-vera-rubin-scale-ai-factories/
  - title: "Introducing AMD Helion (AMD Newsroom, 12 October 2026)"
    url: https://newsroom.amd.com/news/open-rack-blueprint-scale-agentic-ai/
  - title: "MGX 1.2 Accelerated Computing Rack and Trays Design Specification, revision 1.2.0 (OCP, effective 6 October 2026)"
    url: https://www.opencompute.org/wp-content/uploads/2026/10/MGX-Accelerated-Computing-Rack-and-Trays-Specification-1.2.0-Final.pdf
  - title: "NVIDIA and Cisco introduce a new pluggable optics form factor (NVIDIA Newsroom, 12 October 2026)"
    url: https://nvidianews.nvidia.com/news/nvidia-and-cisco-introduce-new-pluggable-optics-form-factor-to-scale-ai-factories
  - title: "2026 OCP Global Summit"
    url: https://www.opencompute.org/events/ocp-summit/2026-ocp-global-summit/
  - title: "AI Tamer: Microsoft says Maia 300 starts production deployments in 2027"
    url: https://aitamer.news/posts/microsoft-maia-300-inference-chip/
---

The [2026 OCP Global Summit](https://www.opencompute.org/events/ocp-summit/2026-ocp-global-summit/) runs 12 to 15 October in San Jose. On the first day, NVIDIA and AMD each described a rack for the CPU-side work of AI agents, tool calling, orchestration, and sandboxed execution, set apart from the GPU racks used for training and inference. What follows is what the companies and one Open Compute Project specification say. It is not a test of hardware in the field.

## NVIDIA's MGX 1.2 contribution and a Vera CPU rack

NVIDIA's [blog](https://blogs.nvidia.com/blog/ocp-global-summit-vera-rubin-scale-ai-factories/) says it contributed Vera Rubin rack and compute tray designs to OCP through the MGX architecture. For Vera Rubin AI factories, the post says MGX 1.2 adds rack-scale blind-mate liquid cooling, a liquid-cooled 5,000A busbar, native 19-inch equipment support, fanless liquid-cooled compute trays, and rack deployments up to 250 kW.

The [MGX 1.2 specification](https://www.opencompute.org/wp-content/uploads/2026/10/MGX-Accelerated-Computing-Rack-and-Trays-Specification-1.2.0-Final.pdf) on opencompute.org is revision 1.2.0, effective 6 October 2026. Its feature list includes blind-mate liquid cooling, a 5000A bus bar based on the ORV3 bus bar, and support for 19-inch EIA hardware (the file spells it "Adaption"). Section 5.5 is a fanless liquid-cooled compute tray. Table 9, rack-level liquid-cooling requirements, lists maximum rack power dissipation of 250 kW. Those lines are the specification's requirements, not a measurement of a deployed rack.

The same NVIDIA post says the Vera CPU rack specification extends MGX beyond accelerated computing. It says that while Vera Rubin NVL72 is the base for large-scale training and inference, the Vera CPU rack "is designed to support tool calling, orchestration and sandboxed execution." The post presents that as a design purpose. It does not report a shipment or a benchmark of agent throughput.

## Software components NVIDIA named

NVIDIA says it expanded DSX OS, the operating layer of its DSX AI factory platform, with open-source components:

- NVIDIA Config Manager, for switch configuration at scale
- NVIDIA Cluster Readiness Engine, for stress-testing GPU clusters before training
- NVIDIA Rack Management Service, for treating racks as units of firmware management
- Cluster API Provider for NVIDIA Infrastructure Controller, for bare-metal deployment and tenant onboarding

Those are the names and the roles in the post.

## Optics, and three shorter standards notes

NVIDIA and Cisco say they announced plans for Ultra-Dense Small Form Factor Pluggable optics, USFP. The [NVIDIA blog](https://blogs.nvidia.com/blog/ocp-global-summit-vera-rubin-scale-ai-factories/) and the [joint release](https://nvidianews.nvidia.com/news/nvidia-and-cisco-introduce-new-pluggable-optics-form-factor-to-scale-ai-factories) say USFP has about the footprint of a 200 Gb/s-per-lane OSFP module, a path to 400 Gb/s per lane, 16 full-duplex lanes with plans to reach 32, and four times the bandwidth density of 200 Gb/s-per-lane pluggable optics. Both also say roughly 1.3 times the power efficiency of those modules. The release calls the modules planned. The density and efficiency figures are NVIDIA's and Cisco's.

In shorter form, the same blog says NVIDIA joined AMD, Google, and Meta to publish the Open Data Center Specification v0.7 for AI factory facility design, and that Google, Meta, Microsoft, and NVIDIA published an OCP Grid Resilience specification for how large AI sites should behave in a grid disturbance, including a return to near-full load in less than two seconds. It says NVIDIA and Google announced Falcon Transport support on future ConnectX-10 SuperNICs and BlueField DPUs. It says Meta is adopting Spectrum-6 102.4 Tb/s Ethernet switches, and that Meta's Spectrum-6 switch, N-IceCube, fits IcePack, Meta's liquid-cooled rack, and runs FBOSS. Those are announcements in the post. The rack figures above come from that post and from the MGX 1.2 file.

## AMD Helion

AMD's [release](https://newsroom.amd.com/news/open-rack-blueprint-scale-agentic-ai/), also 12 October, introduces Helion as an open blueprint for agentic AI infrastructure, based on an OCP spec design and powered by AMD compute. AMD says it plans to contribute the Helion specification to OCP. The configurations "are currently under development with ecosystem partners and are planned to be available in November 2026."

The release describes two examples. One is a CPU-only rack with 6th Gen EPYC processors, up to 32,768 cores, for hyperscale agent execution, with connections to separate inference infrastructure. The other is an all-in-one rack with EPYC CPU nodes, Instinct MI350P GPU nodes, and general-purpose compute, aimed at enterprise agentic AI. AMD says Helion includes an integrated token router that directs agents' model calls across frontier and open-source models. That router is AMD's description. The release quotes Cisco, Dell Technologies, Hon Hai Technology Group, HPE, Lenovo, QCT, Supermicro, and Wiwynn. It does not publish a power measurement or a throughput test.

The same morning, Microsoft described Maia 300, its in-house inference chip, with production deployments it places in 2027. That is a different company's silicon plan, covered in [this post](/posts/microsoft-maia-300-inference-chip/).
