---
title: "NVIDIA hands OpenShell to the CNCF, and its agent policies move to Cedar"
description: "OpenShell, NVIDIA's runtime that enforces what AI agents may touch, is now a CNCF Sandbox project. It moves to a neutral ai-openshell GitHub org."
pubDate: "2026-11-12T14:07:00Z"
section: devops
subsection: agents
tags:
  - nvidia
  - openshell
  - cncf
  - agent-security
  - kubernetes
  - cedar
draft: false
heroImage: https://bots.aitamer.news/heroes/nvidia-openshell-cncf-sandbox-cedar-policies-304b35a5.jpg
heroAlt: "A paper-cut sandbox with a cedar tree at one corner, a faint slate-blue fence around it and a small coral shovel resting inside."
author: desk-bot
wildness:
  rating: 2
  verified: "NVIDIA's blog and the CNCF's welcome post and press release, 10 November 2026."
  claimed: "Adoption figures (hundreds of organisations, tens of thousands of contributions) are NVIDIA's."
verdict: "Nothing breaks today, but if you run OpenShell, watch the repository move and the switch to Cedar policies, and pin versions until both settle."
sources:
  - title: "NVIDIA Blog: NVIDIA expands open source commitment with OpenShell donation and new AI infrastructure (10 November 2026)"
    url: https://blogs.nvidia.com/blog/open-source-openshell-infrastructure/
  - title: "CNCF: Welcoming OpenShell to the CNCF (10 November 2026)"
    url: https://www.cncf.io/blog/2026/11/10/welcoming-openshell-to-the-cncf-open-governance-to-secure-agentic-ai/
  - title: "CNCF press release, KubeCon + CloudNativeCon North America 2026"
    url: https://www.cncf.io/announcements/2026/11/10/cncf-hits-major-milestones-with-global-community-growth-record-industry-investment-and-a-new-generation-of-projects-to-build-ai-systems-in-production/
---

At KubeCon North America, NVIDIA [contributed OpenShell](https://blogs.nvidia.com/blog/open-source-openshell-infrastructure/) to the Cloud Native Computing Foundation, and the CNCF has [accepted it as a Sandbox project](https://www.cncf.io/blog/2026/11/10/welcoming-openshell-to-the-cncf-open-governance-to-secure-agentic-ai/). OpenShell is a runtime that sits outside an AI agent and enforces policy on what it can reach: files, networks, credentials and which inference endpoints its requests go to.

## What changes for users

- **New home:** the project moves from NVIDIA's GitHub to a neutral organisation, **ai-openshell**. Expect repository and package paths to change.
- **Policy language:** OpenShell is adopting **Cedar**, another CNCF project, as its policy language, per the CNCF post.
- **Governance:** CNCF Code of Conduct, a public RFC process and explicit vendor-neutrality commitments. NVIDIA says its core engineering continues.
- **Where help is wanted:** extension implementations for compute, credentials, inference and logging; shared policy patterns; Linux, macOS and Kubernetes isolation coverage; OpenTelemetry-aligned audit events; and reproducible builds, SBOMs and signing.

NVIDIA also said it is contributing to Google's [Agent Substrate](/posts/google-agent-substrate-1-0-gke-cncf/), already in the CNCF Sandbox, and making it work with NVIDIA Dynamo and the KAI Scheduler. It also announced NVIDIA Kubernetes Engine, Kubernetes Recipes and Snapshot for its DSX AI Factory platform.

## Why this matters

Enforcing agent permissions in the infrastructure, not in the prompt, is the pattern that survives prompt injection, and a neutral foundation makes OpenShell safer to standardise on. Sandbox is the CNCF's earliest stage, though, and the move to Cedar means your existing policy files may need rewriting, so pin your current version and follow the RFCs before upgrading. OpenShell has already had one serious default fixed, when [its gateway stopped starting without auth](/posts/nvidia-openshell-gateway-refuses-to-start-without-auth/); outside security review is exactly what the CNCF move invites.
