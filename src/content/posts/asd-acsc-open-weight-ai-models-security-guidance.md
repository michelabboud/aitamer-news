---
title: "ASD's ACSC sets out how to run an open-weight model securely"
description: "On 5 November ASD's ACSC published two papers on open-weight models: inventory them, check hashes and signatures, and approve risky actions outside the model."
pubDate: "2026-11-08T08:37:00Z"
section: devops
subsection: security
tags:
  - open-weights
  - security
  - asd
  - acsc
  - supply-chain
  - agents
draft: false
heroImage: https://bots.aitamer.news/heroes/asd-acsc-open-weight-ai-models-security-guidance-88dfd05b.jpg
heroAlt: "A tied parcel of cream paper sheets stands behind a low cream paper gate with one small coral latch, and a faint slate-blue shelf sits empty behind them."
author: desk-bot
wildness:
  rating: 2
  verified: "ACSC news item and both 5 Nov 2026 guidance pages, opened 8 Nov."
  claimed: "The papers are guidance. We did not run the controls they describe."
verdict: "Use the two papers as an operator checklist: record the model, check the file, and put approval for risky actions outside the model."
sources:
  - title: "ASD's ACSC: New guidance on open-weight AI models"
    url: https://www.cyber.gov.au/news/new-guidance-on-open-weight-ai-models
  - title: "Open-weight AI models: Opportunities and cyber security risks"
    url: https://www.cyber.gov.au/publication/open-weight-ai-models-opportunities-and-cyber-security-risks
  - title: "Selecting, deploying and operating open-weight AI models securely"
    url: https://www.cyber.gov.au/publication/open-weight-ai-models-selecting-deploying-and-operating-open-weight-ai-models-securely
  - title: "AI Tamer: A field guide to ten open-weight model families"
    url: https://aitamer.news/posts/open-weight-model-families/
  - title: "AI Tamer: Your model weights should not execute code"
    url: https://aitamer.news/posts/your-model-weights-shouldn-t-execute-code/
  - title: "AI Tamer: Prompt injection for builders"
    url: https://aitamer.news/posts/prompt-injection-for-builders/
---

On 5 November 2026, the Australian Signals Directorate's Australian Cyber Security Centre [published two papers](https://www.cyber.gov.au/news/new-guidance-on-open-weight-ai-models) for organizations that run open-weight models themselves. Keep a register of approved models and a technical inventory of the versions, artifacts, adapters, dependencies and configurations that are actually deployed. Verify provenance, hashes and signatures, and prefer a weight file that cannot hold executable code. Place inference in its own network segment, authenticate the interfaces, and apply rate limits. Keep the controls that matter outside the model, and require a person to approve high-risk or irreversible actions.

## What the two papers are

The [risks paper](https://www.cyber.gov.au/publication/open-weight-ai-models-opportunities-and-cyber-security-risks) explains what open-weight models are and the risks that follow from weights anyone can copy, modify and redistribute. It defines them as models whose parameters are publicly released, so an organization can download, modify and run them on its own infrastructure. It says genuinely open-source releases, with the data, code and recipes needed to reproduce the model, remain rare, and that most models called open are open-weight only. License terms vary by model and have to be read one at a time. Our [field guide to open-weight families](https://aitamer.news/posts/open-weight-model-families/) makes the same point: a family name does not settle the terms.

The [secure-operation paper](https://www.cyber.gov.au/publication/open-weight-ai-models-selecting-deploying-and-operating-open-weight-ai-models-securely) is the companion for an organization that has decided, or is close to deciding, to run a model itself. It says that choice puts the organization in the role a hosting provider would otherwise fill. Safeguard maintenance, abuse detection, security updates, monitoring and incident response exist in a self-hosted deployment only if the organization builds them.

## Before the file is trusted

The secure-operation paper says the register should record the approved use case, the accountable owner, the risk acceptance decision and the date of the next review. The inventory should be enough to say what is running in which environment, and to support patching, reassessment and incident response.

On the bytes, the risks paper says to obtain models and related components only from approved sources, then "verify available hashes, signatures, provenance information, and scan artefacts and dependencies for known vulnerabilities, malware and signs of tampering before use." Load a new model in a sandbox first, for as long as the source, the deployment and the use require. "Prefer model file formats that cannot contain executable code and avoid formats that serialise arbitrary objects." If custom code is required, review it before it runs, and run it in isolation. That is the same load-time problem as [a checkpoint that executes when it is opened](https://aitamer.news/posts/your-model-weights-shouldn-t-execute-code/).

The secure-operation paper says to establish who developed, modified and distributed the specific version, including fine-tuning, distillation, merging, quantization or conversion. Country of origin is one element of that check. The paper says country of origin is not, by itself, evidence that a model is trustworthy or untrustworthy. Where provenance, documentation or assurance cannot be established to a level that fits the use, it says the model should not be adopted.

## Around the running service

The secure-operation paper says to decide which controls sit outside the model, "covering inputs, outputs, tool use, and approval of high-risk or irreversible actions." The risks paper says to place external controls between the model and sensitive systems, restrict tools and agent permissions to the approved use, and require human approval for high-risk or irreversible actions. Untrusted content should be prevented from modifying system instructions, tool definitions and other trusted context. [Prompt injection work for builders](https://aitamer.news/posts/prompt-injection-for-builders/) is the same boundary: text the model reads can steer a tool call, so the permission has to live in the application.

For the service, the secure-operation paper says to place inference in a separate network segment or security boundary from sensitive systems and data, separate development and production, authenticate administrative and inference interfaces, and enforce multi-factor authentication for administrative access. "Rate limits and resource quotas should be applied to inference interfaces to limit the impact of excessive or abusive use." Log administrative access, security events, prompts, responses and tool use in line with the risk, protect sensitive logs, and keep a tested way to stop the service, revoke credentials and isolate the host.

## Why this matters

Self-hosting moves the provider's job onto the team that runs the model, which is the premise of both papers. The register and the hash check are how you know which file is in production, and a non-executable weight format reduces the risk of code running when the file is loaded. Human approval for irreversible actions belongs outside the model, because a safeguard shipped inside the weights can be removed, and because untrusted text can still steer a tool. The papers are guidance for that operating choice, not a measured result for any one model.
