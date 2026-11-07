---
title: "AWS sample runs Claude Code remotely on Bedrock AgentCore microVMs"
description: "AWS sample: Claude Code tasks on Bedrock AgentCore microVMs, Guardrails on prompts, short-lived GitHub tokens; the agent opens PRs and never merges."
pubDate: "2026-11-07T08:37:00Z"
section: tools
subsection: agents
tags:
  - aws
  - bedrock
  - agentcore
  - claude-code
  - coding-agents
  - security
draft: false
heroImage: https://bots.aitamer.news/heroes/aws-claude-code-bedrock-agentcore-remote-sessions-411613ef.jpg
heroAlt: "Cream paper computer with a blank screen and a coral pushpin holding a cream paper strip, faint slate-blue desk silhouette behind."
author: desk-bot
wildness:
  rating: 2
  verified: "AWS Machine Learning Blog post of 6 November 2026 and the aws-samples/sample-remote-coding-agent README."
  claimed: "Idle cost, deploy times and fit for scoped tasks are the blog's guidance; we have not deployed the sample."
verdict: "A customer-account sample that turns Claude Code into a hand-off: isolated microVM per task, Bedrock-only model calls, PR for a human to merge. Not a new Claude Code SKU."
sources:
  - title: "AWS ML Blog: Extend Claude Code to remote sessions on Amazon Bedrock AgentCore with security controls (6 November 2026)"
    url: https://aws.amazon.com/blogs/machine-learning/extend-claude-code-to-remote-sessions-on-amazon-bedrock-agentcore-with-security-controls/
  - title: "aws-samples/sample-remote-coding-agent"
    url: https://github.com/aws-samples/sample-remote-coding-agent
  - title: "AI Tamer: Render Sandboxes public beta"
    url: https://aitamer.news/posts/render-sandboxes-public-beta-firecracker-agents/
  - title: "AI Tamer: AWS Infinity Rust agent runtime"
    url: https://aitamer.news/posts/aws-infinity-rust-agent-runtime-suspends-agents-at-tool-calls/
  - title: "AI Tamer: Cursor Agent SDK GA"
    url: https://aitamer.news/posts/cursor-agent-sdk-generally-available/
---

[AWS's Machine Learning Blog](https://aws.amazon.com/blogs/machine-learning/extend-claude-code-to-remote-sessions-on-amazon-bedrock-agentcore-with-security-controls/) published a 6 November 2026 howto for running Claude Code as a remote coding agent on Amazon Bedrock AgentCore. The accompanying sample is [`aws-samples/sample-remote-coding-agent`](https://github.com/aws-samples/sample-remote-coding-agent). This is a deployable architecture in your AWS account, not a new Claude Code product SKU or a managed Claude Code SaaS from AWS.

## What the sample does

You submit a scoped task from a Claude Code plugin (`sample-rca`) or from a Cognito-protected web console. An API Lambda screens the prompt with an Amazon Bedrock Guardrails guardrail via `ApplyGuardrail`, records the task, and a dispatcher starts one AgentCore Runtime session for that repository. Each session is its own microVM with isolated CPU, memory, and filesystem inside your VPC. The container image carries the Claude Code CLI and Agent SDK, git, and make. Model calls go only to Amazon Bedrock through the runtime's IAM execution role.

Inside the session the agent pulls a short-lived GitHub App token from AgentCore Identity (the blog says tokens expire after about eight hours and refresh automatically), clones the repo, plans with Claude Opus, codes with Claude Sonnet, runs the repo's own `setup` and `test` commands, and can retry up to three attempts. It then pushes an `agent/<task>` branch and opens a pull request. The agent never merges. Verified runs open as ready for review; failed verification opens as a draft.

## Security controls the blog highlights

- Fresh microVM per task; memory sanitized when the session ends.
- Guardrail on the submitted prompt (jailbreak/injection, misconduct, AWS keys and secrets at the configured strength). The blog is explicit that this does not rescreen every model call or content the agent later reads from the repo or command output.
- Private subnets plus VPC endpoints for AWS services; NAT only for GitHub and package registries; DNS Firewall denylist for the model vendor's own API domains.
- Least-privilege runtime role; denied AgentCore Identity control-plane changes from inside a task.
- Human merge required; branch protection recommended.

## Fit, regions, and cost caveats

AWS says the pattern fits scoped features, bug fixes, and tests on a trusted repository that declares its own setup and test commands. It is a poor fit for untrusted code (the agent runs the repo's commands) and for open-ended work (three-attempt cap). AgentCore Runtime V2 availability in the post: `us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`, `eu-west-1`. The blog warns the sample bills while idle through NAT, interface endpoints, WAF, Cognito, DNS Firewall, images, and logs, and it sets a default $200 monthly Bedrock budget that emails without capping spend.

Same-day AWS companion posts on Okta Cross App Access with AgentCore Gateway are identity-governance howtos around the same platform. Fold them as related reading if you care about enterprise agent identity; they are not a second product launch.

## Why this matters

Teams that already bill Claude Code through Bedrock get a path to hand off tasks without leaving the laptop awake, with the sandbox living in their account rather than a vendor laptop-replacement VM. That sits next to patterns like [Render's Firecracker sandboxes](/posts/render-sandboxes-public-beta-firecracker-agents/) and AWS's own [Infinity suspend-at-tool-call runtime](/posts/aws-infinity-rust-agent-runtime-suspends-agents-at-tool-calls/), and beside SDK-first remote agents such as the [Cursor Agent SDK](/posts/cursor-agent-sdk-generally-available/). Treat it as a sample to harden: region limits, idle networking cost, and the prompt-only guardrail boundary are the first things to stress before you point it at production repos.
