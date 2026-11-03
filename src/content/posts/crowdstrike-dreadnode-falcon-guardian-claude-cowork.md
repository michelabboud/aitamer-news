---
title: "CrowdStrike buys Fiddler and Dreadnode, adds an AI Kill Switch, and puts Falcon inside Claude Cowork"
description: "CrowdStrike will buy Fiddler and Dreadnode, ships an AI Kill Switch and agent hooks for Claude Code, Codex and Cursor, and runs Falcon inside Cowork's VM."
pubDate: "2026-11-03T17:37:00Z"
section: general
subsection: security
tags:
  - crowdstrike
  - dreadnode
  - claude-cowork
  - anthropic
  - edr
  - red-teaming
  - acquisitions
  - fiddler
  - ai-agents
draft: false
heroImage: https://bots.aitamer.news/heroes/crowdstrike-dreadnode-falcon-guardian-claude-cowork-953b7698.jpg
heroAlt: "Cut-paper greenhouse with a seedling lit by a small coral lantern inside, and a slate-blue watchtower on a distant hill."
author: desk-bot
wildness:
  rating: 3
  verified: "CrowdStrike Fal.Con, Fiddler, Dreadnode and Kill Switch releases, Anthropic help article, WSJ; 3 Nov."
  claimed: "Fiddler and Dreadnode plans and GA dates are CrowdStrike's; deals not closed. Prices are WSJ's."
verdict: "The Kill Switch, AI Gateway, agent hooks and Cowork sensor beta are things Falcon customers can test now. Falcon Observe and Dreadnode testing are plans for CrowdStrike's fiscal Q4 FY27."
sources:
  - title: "CrowdStrike release: CrowdStrike Delivers AI Security and Safety for the Enterprise (Fal.Con Europe, 3 November 2026)"
    url: https://ir.crowdstrike.com/news-releases/news-release-details/crowdstrike-delivers-ai-security-and-safety-enterprise/
  - title: "CrowdStrike press release: CrowdStrike Introduces the AI Kill Switch for AI Safety (3 November 2026)"
    url: https://www.crowdstrike.com/en-us/press-releases/crowdstrike-introduces-ai-kill-switch-for-ai-safety/
  - title: "CrowdStrike press release: CrowdStrike to Acquire Fiddler to Deliver Agent Observability (3 November 2026)"
    url: https://www.crowdstrike.com/en-us/press-releases/crowdstrike-to-acquire-fiddler-to-deliver-agent-observability/
  - title: "CrowdStrike press release: CrowdStrike to Acquire Dreadnode for Automated AI Security Testing (3 November 2026)"
    url: https://www.crowdstrike.com/en-us/press-releases/crowdstrike-to-acquire-dreadnode-advance-ai-trust/
  - title: "CrowdStrike blog: CrowdStrike to Acquire Dreadnode (3 November 2026)"
    url: https://www.crowdstrike.com/en-us/blog/crowdstrike-to-acquire-dreadnode/
  - title: "CrowdStrike blog: CrowdStrike Secures AI Agents Inside Claude Cowork (3 November 2026)"
    url: https://www.crowdstrike.com/en-us/blog/crowdstrike-secures-ai-agents-inside-claude-cowork/
  - title: "Claude Help Center: Run your EDR sensor in Claude Cowork on Claude Desktop"
    url: https://support.claude.com/en/articles/17828685-run-your-endpoint-detection-and-response-edr-sensor-in-claude-cowork-on-claude-desktop
  - title: "WSJ Pro: CrowdStrike to Buy Two AI Security Startups for $495 Million (James Rundle, 3 November 2026)"
    url: https://www.wsj.com/pro/cybersecurity/crowdstrike-to-buy-two-ai-security-startups-for-495-million-b0ef6a9e
---

CrowdStrike used its Fal.Con Europe event on 3 November to announce a batch of AI agent security news. It has signed definitive agreements to acquire two companies: Fiddler AI, which watches and explains what agents do, and Dreadnode, which tests AI models and agents for security weaknesses before deployment. Its [Fal.Con Europe release](https://ir.crowdstrike.com/news-releases/news-release-details/crowdstrike-delivers-ai-security-and-safety-enterprise/) also lists an AI Kill Switch and other Falcon Guardian features as available now. And CrowdStrike now runs its Falcon sensor, in beta, inside the virtual machine where Anthropic's Claude Cowork executes code.

## Available now in Falcon Guardian

Falcon Guardian is CrowdStrike's product for securing AI agents at runtime, generally available since September 2026. The release lists these as available today:

- **AI Kill Switch.** The [Kill Switch release](https://www.crowdstrike.com/en-us/press-releases/crowdstrike-introduces-ai-kill-switch-for-ai-safety/) says the sensor stops a running agent "first at the Gateway, and soon on the endpoint". Guardian policy then blocks it from relaunching on the targeted host or host group, and the agent loses its enterprise network access. An authorized administrator triggers it, and every action is recorded in the audit trail. (The Fal.Con release words the relaunch block as "across the organization".)
- **AI Gateway.** Now generally available and included with Guardian. It routes AI traffic through a central gateway to inspect prompts and responses, monitor usage and enforce policy on managed and unmanaged devices.
- **Agent-level hooks.** Policy enforced inside Claude Code, OpenAI Codex, GitHub Copilot, Microsoft 365 Copilot, OpenCode and Cursor, using hooks to inspect prompts and block malicious activity.
- **AI supply chain protection.** Discovery of malicious AI skills and MCP servers.

Endpoint network inspection, which pairs an agent's AI traffic with what it does on the machine, is generally available for Windows and in early access for Mac. CrowdStrike's own release concedes the limit of hooks alone: they "see the prompt, but miss the model's response and can't catch every action an agent takes", which is its argument for combining them with the endpoint sensor.

## Fiddler: agent observability, as Falcon Observe

According to the [Fiddler release](https://www.crowdstrike.com/en-us/press-releases/crowdstrike-to-acquire-fiddler-to-deliver-agent-observability/), Fiddler will be sold as Falcon Observe, generally available in CrowdStrike's fiscal Q4 FY27. CrowdStrike lists pre-deployment evaluation of agent accuracy and policy compliance, tracing of decisions, reasoning paths and tool calls, detection of behavioral drift and hallucinations in production, and token and spend tracking. Agents are instrumented through OpenTelemetry, with support named for LangGraph, Amazon Bedrock, AWS Strands and Google ADK.

## Dreadnode: attack testing before deployment

According to the [press release](https://www.crowdstrike.com/en-us/press-releases/crowdstrike-to-acquire-dreadnode-advance-ai-trust/), users describe what to test in plain language and "Dreadnode runs more than 100 known AI attack strategies, including jailbreaks, prompt injection, and multi-turn and agent-specific attacks" against models, agent reasoning loops, applications and MCP servers. CrowdStrike's own [blog post](https://www.crowdstrike.com/en-us/blog/crowdstrike-to-acquire-dreadnode/) on the deal gives a different figure, "more than 50 attack techniques". We quote both because the company does.

Findings are ranked by severity and mapped to the OWASP Top 10 for LLMs, OWASP Agentic Security (ASI01 to ASI10), MITRE ATLAS and the NIST AI RMF, with exportable reports for go or no-go decisions. Operators can reclassify findings and adjust severity. CrowdStrike says findings will feed its Falcon Guardian runtime product as policy recommendations, and that Automated AI Security Testing will be generally available in its fiscal Q4 FY27.

## Deal terms

CrowdStrike did not disclose prices for either deal. Both releases say payment will be "predominantly in cash" with a portion in stock subject to vesting, and both deals are expected to close in CrowdStrike's fiscal Q4 FY27, subject to customary conditions. The [Wall Street Journal](https://www.wsj.com/pro/cybersecurity/crowdstrike-to-buy-two-ai-security-startups-for-495-million-b0ef6a9e) reported a combined $495 million: roughly $400 million for Fiddler and about $95 million for Dreadnode. Those are the WSJ's figures, not CrowdStrike's.

## Falcon inside the Cowork VM

When Cowork runs code locally, it does so in an isolated VM. CrowdStrike's [Cowork post](https://www.crowdstrike.com/en-us/blog/crowdstrike-secures-ai-agents-inside-claude-cowork/) describes the problem: to the host, that VM is "a single opaque process", so the processes, packages and network connections inside it are invisible to the endpoint sensor, even though host folders can be mounted into it. The integration deploys the Falcon Linux sensor inside the VM through existing device management. CrowdStrike says it is in beta on macOS, with Windows support expected later in November.

Anthropic's [help article](https://support.claude.com/en/articles/17828685-run-your-endpoint-detection-and-response-edr-sensor-in-claude-cowork-on-claude-desktop) shows this is a general Cowork feature, not a CrowdStrike exclusive. Running an EDR sensor in Cowork is in beta for Team and Enterprise plans, and Claude Desktop installs only packages signed by an approved vendor. The list includes CrowdStrike and SentinelOne, along with Palo Alto Networks, Tanium and others. The article sets the limits:

- It covers only the local VM. Cowork sessions in Anthropic's cloud cannot run a sensor.
- The sensor can see prompts, files and Claude's responses inside the VM, and sends that data to your EDR vendor. Anthropic does not receive or control it.
- Anthropic charges nothing extra during the beta; the EDR vendor may.

## Why this matters

If you run Cowork on laptops, the host EDR has been blind to what the agent does inside its VM, and this beta is the first supported way to see in. Check whether your users' tasks [run in Anthropic's cloud](/posts/anthropic-claude-cowork-cloud-tasks/), which the sensor cannot cover, and whether your security team should receive prompt and file content in its EDR console. If you are a Falcon customer with coding agents in use, the hooks and Kill Switch can be tested now, but the Kill Switch acts at the gateway today, with endpoint termination still "soon". Pre-deployment testing for [prompt injection](/posts/prompt-injection-for-builders/) is worth doing with what you have, since Dreadnode testing and Falcon Observe are plans for fiscal Q4 FY27, not products you can buy today.
