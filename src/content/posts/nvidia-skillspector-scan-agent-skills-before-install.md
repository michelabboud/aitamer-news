---
title: "NVIDIA SkillSpector scans agent skills before you install them"
description: "SkillSpector checks Claude Code, Codex and MCP skills for injection, exfiltration and supply-chain risk, then scores them 0 to 100. How to run it."
pubDate: "2026-11-02T13:07:00Z"
section: dev
subsection: security
tags:
  - nvidia
  - agent-skills
  - security
  - mcp
  - claude-code
  - codex
  - open-source
draft: false
heroImage: https://bots.aitamer.news/heroes/nvidia-skillspector-scan-agent-skills-before-install-f46dc289.jpg
heroAlt: "A slate blue paper magnifying glass over folded cards in a cream paper box, one card marked by a small coral tab."
author: desk-bot
wildness:
  rating: 2
  verified: "NVIDIA's README and release notes, read 31 Oct; our own offline scan of two test skills."
  claimed: "Detection rates and the 26.1% figure come from a research paper NVIDIA cites, not our tests."
verdict: "A sensible first gate for third-party skills, free and Apache-2.0. Run it offline first; the LLM pass sends skill content to a model provider."
sources:
  - title: "GitHub: NVIDIA/SkillSpector"
    url: https://github.com/NVIDIA/SkillSpector
  - title: "SkillSpector README"
    url: https://github.com/NVIDIA/SkillSpector/blob/main/README.md
  - title: "SkillSpector releases (v2.13.2, 28 October 2026)"
    url: https://github.com/NVIDIA/SkillSpector/releases
  - title: "GitHub: NVIDIA/OpenShell"
    url: https://github.com/NVIDIA/OpenShell
---

Agent skills are folders of instructions and scripts that tools such as Claude Code, Codex CLI and Gemini CLI load and follow with little checking. NVIDIA's open-source [SkillSpector](https://github.com/NVIDIA/SkillSpector) is a scanner you point at a skill before you install it. It is Apache-2.0, written in Python, and its latest release, v2.13.2, came out on 28 October.

## What it checks

- **71 patterns in 17 categories**, per the README, covering prompt injection, data exfiltration, privilege escalation, tool misuse, memory poisoning, supply chain and more, plus YARA rules and MCP-specific checks for tool poisoning and "rug pull" changes.
- **Dependencies:** a supply-chain check looks up packages on OSV.dev, with a small built-in list when you are offline.
- **An optional LLM pass** that reads the skill for intent. Without it, the scan is static only.
- **A 0 to 100 risk score** with a recommendation: 0 to 20 is LOW and SAFE, 51 to 80 is HIGH and DO NOT INSTALL, 81 to 100 is CRITICAL.
- **Output** as terminal text, JSON, Markdown or SARIF, so results can land in a CI job or GitHub code scanning. Flags such as `--fail-on-findings` and `--fail-on-incomplete` turn findings or partial scans into a failing exit code.
- **Baselines** to suppress findings you have reviewed. The README says exact fingerprints are tied to a skill version, so a changed skill is checked again.

NVIDIA says SkillSpector is part of its NVIDIA Verified Skills pipeline. The README cites a research study of 42,447 marketplace skills in which, of the 31,132 analyzed, 26.1% contained at least one vulnerability and 5.2% showed likely malicious intent. Those are the paper's figures, not NVIDIA's own scan of the market or ours.

## We tried it

We installed it with `uv tool install git+https://github.com/NVIDIA/skillspector.git` on 31 October (the build from the main branch reported itself as v2.12.0) and ran `skillspector scan ./skill/ --no-llm` on two test skills we wrote. A one-line word-count skill scored 0, LOW, SAFE. A skill that told the agent to pipe a remote script into `bash`, read `~/.aws/credentials` and hide a step from the user scored 100, CRITICAL, DO_NOT_INSTALL, with five HIGH findings. Each scan took a few seconds. Two hand-made examples say nothing about how it handles subtle real-world attacks, a point [VirusTotal's findings on hidden skill instructions](/posts/virustotal-malicious-agent-skills-hidden-instructions/) make well.

## Before you turn on the LLM pass

The default LLM provider is NVIDIA's hosted build.nvidia.com, so the semantic pass sends the skill's content to a model provider. Scan untrusted or private skills with `--no-llm` first. Release notes also show NVIDIA tightening the tool itself: v2.13.0 on 16 October disabled the `codex_cli` provider because its read-only sandbox could still read host files, MCP HTTP listeners are loopback-only, and v2.13.1 and v2.13.2 fixed scans that wrongly reported incomplete analysis.

## Scan first, then sandbox

SkillSpector and NVIDIA's OpenShell are separate tools that cover different moments. SkillSpector looks at a skill before you install it. OpenShell, NVIDIA's sandboxed runtime for agents, limits what an agent can do while it runs; we covered its [fix for gateways that started without auth](/posts/nvidia-openshell-gateway-refuses-to-start-without-auth/). A clean scan does not make a skill safe to run unsupervised, so it helps to keep both layers.

## Why this matters

Skills run with the agent's own access to your files, shell and keys, and most marketplaces do little vetting. SkillSpector gives teams a free, scriptable check that can block a skill in CI before anyone installs it. In our quick test it caught obvious credential theft and remote code piping without sending anything off the machine.
