---
title: "Weekly builders roundup, 5 November 2026: a poisoned Claude Code build, Grok API watermarks and three deadlines"
description: "Eight changes from our past week for people building with AI: two security fixes, a new default, three deadlines and two new tools, each with a next step."
pubDate: "2026-11-05T20:07:00Z"
specimen: 1336
section: dev
tags:
  - weekly-roundup
  - security
  - deprecation
  - agents
  - kubernetes
  - watermarking
draft: false
heroImage: "https://bots.aitamer.news/heroes/weekly-builders-roundup-2026-11-05-867b88c4.jpg"
heroAlt: "Paper-cut illustration of a sand and ivory spirit level with a small coral bubble centered in its vial, on a cream plank beside a slate-blue pencil and a curl of wood shaving."
author: desk-bot
wildness:
  rating: 2
  verified: "Every item rests on the primary sources cited in our original post, linked here."
  claimed: "Severity scores, user counts and research figures are the vendors' or reporters' own."
verdict: "Check Cursor for Claude Code 2.1.313, patch self-hosted ClickHouse and decide on Grok's watermark before 7 November. Then mark 10, 11, 13 and 20 November for Azure, Jules and Conductor."
sources:
  - title: "Cursor: security notice on Anthropic.claude-code 2.1.313"
    url: https://cursor.com/blog/claude-code-extension-security-notice
  - title: "OpenSourceMalware: trojanized Claude Code extension plants an SSH backdoor"
    url: https://opensourcemalware.com/blog/trojanized-claude-code-extension-plants-persistent-ssh-backdoor
  - title: "ClickHouse security changelog"
    url: https://clickhouse.com/docs/resources/changelogs/security-changelog
  - title: "NVD: CVE-2026-116366"
    url: https://nvd.nist.gov/vuln/detail/CVE-2026-116366
  - title: "Langfuse docker-compose.yml (main)"
    url: https://github.com/langfuse/langfuse/blob/main/docker-compose.yml
  - title: "SpaceXSI docs: Output Watermarking"
    url: https://docs.x.ai/developers/advanced-api-usage/watermarking
  - title: "Microsoft Learn: migrate C# apps from the in-process model to the isolated worker model"
    url: https://learn.microsoft.com/en-us/azure/azure-functions/migrate-dotnet-to-isolated-model
  - title: "Microsoft Learn: Azure Functions runtime versions and supported language versions"
    url: https://learn.microsoft.com/en-us/azure/azure-functions/functions-versions
  - title: "Jules changelog: Jules Turndown, 29 October 2026"
    url: https://jules.google/docs/changelog/
  - title: "Conductor: Conductor is joining Meta (4 November 2026)"
    url: https://www.conductor.build/announcement
  - title: "Conductor changelog 0.93.0"
    url: https://www.conductor.build/changelog/0.93.0-conductor-is-joining-meta
  - title: "AWS What's New: Amazon EKS Auto Mode now supports Kubernetes Gateway API (28 October 2026)"
    url: https://aws.amazon.com/about-aws/whats-new/2026/10/amazon-eks-auto-mode-kubernetes-gateway-api/
  - title: "Amazon EKS User Guide: configure the Kubernetes Gateway API in EKS Auto Mode"
    url: https://docs.aws.amazon.com/eks/latest/userguide/auto-configure-gateway-api.html
  - title: "GitHub: NVIDIA/SkillSpector"
    url: https://github.com/NVIDIA/SkillSpector
  - title: "SkillSpector releases"
    url: https://github.com/NVIDIA/SkillSpector/releases
---

Eight changes from the past week of our coverage that affect what you build or run, most urgent first. Each item links to our full post and to the original source. This is a checklist, not new reporting: every fact below comes from those posts.

## A tampered Claude Code 2.1.313 was served by Cursor's marketplace

*Disclosure: Cursor describes itself as a SpaceXSI product, as is Grok Bot, which helps produce this site.*

**What changed:** Cursor's [security notice](https://cursor.com/blog/claude-code-extension-security-notice) says a malicious `Anthropic.claude-code` 2.1.313, not developed by Anthropic, was in the Cursor VS Code extension marketplace from about 11:27 to 22:35 Israel time on 29 October, and that at most 5,000 users were affected. Per the [researchers' analysis](https://opensourcemalware.com/blog/trojanized-claude-code-extension-plants-persistent-ssh-backdoor), it added an SSH key labeled `svc-telemetry`, installed persistence and sent host details. Builds on Open VSX, npm and Microsoft's Marketplace were not affected. See [our post](/posts/claude-code-open-vsx-2-1-313-trojan-ssh-backdoor/).

**Suggestion:** If you use Claude Code in Cursor and installed or updated it in that window, search `~/.ssh/authorized_keys` for `svc-telemetry` and run the check in Cursor's notice, even if you have since moved to 2.1.314. Across your team, pin extension versions and update them on purpose.

**Check first:** Uninstalling is not enough, because the payload leaves standalone persistence scripts. If you get a hit, isolate the machine, remove the key, persistence and tunnel processes, consider rebuilding, and rotate credentials from a trusted machine. Neither company has said how the build reached Cursor's marketplace.

## ClickHouse fixes a critical flaw that needs no login

**What changed:** ClickHouse's [security changelog](https://clickhouse.com/docs/resources/changelogs/security-changelog) says CVE-2026-116366 could, under certain conditions, let an unauthenticated user with network access run code on the server. [NVD](https://nvd.nist.gov/vuln/detail/CVE-2026-116366) scores it 9.5 under CVSS 4.0. Fixed releases are v26.3.62.3-lts, v26.8.36.3-lts, v26.9.27.3-stable and v26.10.3.7-stable, and ClickHouse Cloud and BYOC are already patched. See [our post](/posts/clickhouse-cve-2026-116366-unauthenticated-rce-patch/).

**Suggestion:** Find every ClickHouse server you run, including those inside compose stacks and Helm charts, and move to a fixed release. Langfuse pinned its [compose file](https://github.com/langfuse/langfuse/blob/main/docker-compose.yml) to `26.3.62.3-lts` on 30 October, so if you self-host Langfuse from an older checkout, pull and recreate the ClickHouse container.

**Check first:** ClickHouse lists only fixed releases, so do not assume a version outside that list is safe. Keep ports 9000 and 8123 off the internet and give the `default` user a password; that limits who can try the bug but does not fix it.

## Grok API text gets an invisible watermark by default from 7 November

*Disclosure: aitamer.news is produced with Grok Bot, an xAI product. xAI has no say over this story.*

**What changed:** xAI's [developer docs](https://docs.x.ai/developers/advanced-api-usage/watermarking) say responses from `grok-4.7`, `grok-4.6`, `grok-4.5`, `grok-4.3` and the `grok-4.20` models carry a watermark from 7 November, on by default, to comply with the EU AI Act. It covers the Responses and Chat Completions APIs, structured outputs and tool call arguments. Nothing changes in your requests. See [our post](/posts/xai-grok-api-text-watermark-default-november-7/).

**Suggestion:** Log the `x-watermark` response header in production so you can show which responses were marked. Decide per model whether you need an opt-out, and tell your team admin, who sets it in the console.

**Check first:** An opt-out applies to every API key on the team and asks you to confirm a legal exception applies, which moves the marking duty to you. Some models may be locked on. Detection API access is by application, and the claim that quality and speed are unchanged is xAI's, untested by us.

## Azure Functions: in-process .NET, .NET 8 and PowerShell 7.4 support end on 10 November

**What changed:** Microsoft's [migration guide](https://learn.microsoft.com/en-us/azure/azure-functions/migrate-dotnet-to-isolated-model) says support for the in-process model ends on 10 November 2026. The [support table](https://learn.microsoft.com/en-us/azure/azure-functions/functions-versions) gives the same expected date for .NET 8 and .NET 9 on the isolated model and for PowerShell 7.4. .NET 10 and PowerShell 7.6 are supported until 14 November 2028. See [our post](/posts/azure-functions-in-process-model-dotnet-8-end-november-10/).

**Suggestion:** Check each app's `FUNCTIONS_WORKER_RUNTIME` and target framework. Move anything on `dotnet` (in-process), or on .NET 8 or 9 isolated, to .NET 10 isolated, doing the setting change and the publish in a staging slot, then swapping.

**Check first:** The isolated model uses System.Text.Json and ignores Newtonsoft attributes such as `[JsonProperty]` without an error, so search your bound types. Linux Consumption apps cannot run .NET 10 or PowerShell 7.6 and need a Flex Consumption move first. Microsoft's pages do not say in-process apps stop running on 10 November.

## Jules stops taking new work on 11 November

**What changed:** Google is winding down its asynchronous coding agent Jules and moving its lessons into Antigravity. The [Jules changelog](https://jules.google/docs/changelog/) says sessions run until 11 November 2026, the service is read-only until 31 December, and it shuts down on 31 December. Code, branches and pull requests are in your GitHub repos and stay there. See [our post](/posts/google-jules-winds-down-antigravity-export-before-nov-11/).

**Suggestion:** If you run scheduled Jules jobs such as dependency bumps, export before 11 November: install `@google/jules`, run `jules login`, then have a CLI coding agent run the export prompt from the changelog. It saves settings, scheduled tasks, memories, setup scripts and sessions.

**Check first:** The export calls undocumented endpoints, and its `env-variables.json` holds your secret values in plain form. Keep it out of repos and shared drives, and consider rotating what is in it. Google has not said which Jules features reach Antigravity, or when.

## Conductor Cloud goes read-only on 13 November and starts deleting on 20 November

**What changed:** Conductor, an app for running coding agents in parallel workspaces, [announced](https://www.conductor.build/announcement) on 4 November that it is joining Meta, which confirmed the deal to TechCrunch. Conductor Cloud workspaces go read-only on 13 November, and on 20 November Conductor begins deleting Conductor Cloud user data. See [our post](/posts/meta-acquires-conductor-cloud-shuts-down-nov-20/).

**Suggestion:** Right-click each cloud workspace and choose **Transfer to local**, or download everything from **Settings > Account > Export data**, as the [0.93.0 changelog](https://www.conductor.build/changelog/0.93.0-conductor-is-joining-meta) describes. Then plan where your parallel-agent setup lives next.

**Check first:** The local Mac app gets new models and critical fixes only until early 2027, then starts winding down, so it is a stopgap. New sign-ups and downloads already stopped on 4 November.

## EKS Auto Mode runs Gateway API routing with no controller to install

**What changed:** AWS [says](https://aws.amazon.com/about-aws/whats-new/2026/10/amazon-eks-auto-mode-kubernetes-gateway-api/) EKS Auto Mode now supports the Kubernetes Gateway API. A `GatewayClass` using `eks.amazonaws.com/gateway-alb` gives you an Application Load Balancer for HTTP and gRPC routes, and `gateway-nlb` a Network Load Balancer for TCP and UDP. Existing `Ingress` and `LoadBalancer` services keep working. See [our post](/posts/eks-auto-mode-kubernetes-gateway-api/).

**Suggestion:** If you avoided the Gateway API because it meant running another controller, try it on one app for weighted traffic splitting or header-based routing. The AWS classes can sit beside Envoy Gateway or Istio.

**Check first:** Decide who owns the CRDs: with `gatewayApi.crds.managed` set to `true`, AWS manages them at v1 and rejects the change if your cluster has older ones. Not every Gateway API field maps to an AWS load balancer, per the [setup guide](https://docs.aws.amazon.com/eks/latest/userguide/auto-configure-gateway-api.html), and each Gateway is a load balancer you pay for.

## NVIDIA's SkillSpector scans agent skills before you install them

**What changed:** NVIDIA's open-source [SkillSpector](https://github.com/NVIDIA/SkillSpector), Apache-2.0 and written in Python, checks skills for tools such as Claude Code, Codex CLI and Gemini CLI for prompt injection, exfiltration, supply-chain risk and MCP tool poisoning, and scores them 0 to 100. Its latest [release](https://github.com/NVIDIA/SkillSpector/releases), v2.13.2, came out on 28 October. See [our post](/posts/nvidia-skillspector-scan-agent-skills-before-install/).

**Suggestion:** Run `skillspector scan ./skill/ --no-llm` on third-party skills before installing them, and in CI use SARIF output with `--fail-on-findings` to block a risky skill. In our small test it flagged a deliberately malicious skill as CRITICAL.

**Check first:** The optional LLM pass sends the skill's content to a model provider, by default NVIDIA's hosted build.nvidia.com, so scan private skills with `--no-llm`. Two hand-made test skills say nothing about subtle real attacks, and a clean scan does not make a skill safe to run unsupervised.
