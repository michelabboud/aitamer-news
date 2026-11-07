---
title: "HashiCorp's Terraform policy agent is GA: it converts Sentinel and OPA policies, then tests them"
description: "HashiCorp's GA Terraform policy agent turns Sentinel and OPA rules into Terraform policy with tests and reports, using Copilot, Bedrock or LiteLLM."
pubDate: "2026-11-07T11:37:00Z"
section: devops
subsection: infra
tags:
  - hashicorp
  - terraform
  - policy-as-code
  - sentinel
  - opa
  - iac
  - agents
draft: false
heroImage: https://bots.aitamer.news/heroes/terraform-policy-agent-ga-sentinel-opa-conversion-2dfbe11c.jpg
heroAlt: "Old curled cream paper scroll joined by a ribbon to a fresh scroll with a coral wax seal, faint slate-blue paper buildings behind."
author: desk-bot
wildness:
  rating: 2
  verified: "HashiCorp blog of 5 November 2026 plus the terraform-policy-agent repo README."
  claimed: "Conversion quality is HashiCorp's description; output is LLM-generated and can vary by run."
verdict: "A sensible shape for an infra agent: extract intent, generate policy plus tests, validate with real tools, report gaps, publish nothing. Review and advisory mode first are still on you."
sources:
  - title: "HashiCorp: Migrate Sentinel and OPA policies to Terraform policy faster with the Terraform policy agent (5 November 2026)"
    url: https://www.hashicorp.com/en/blog/migrate-sentinel-and-opa-policies-to-terraform-policy-faster
  - title: "GitHub: hashicorp/terraform-policy-agent"
    url: https://github.com/hashicorp/terraform-policy-agent
  - title: "AI Tamer: Cognition open-sources three agent skills that patch PHP2Shell, Node.js and a GitLab RCE"
    url: https://aitamer.news/posts/devin-vulnerability-fixes-agent-skills-php-node-gitlab/
  - title: "AI Tamer: Fail a pull request when prompt tests regress with promptfoo"
    url: https://aitamer.news/posts/fail-a-pull-request-when-prompt-tests-regress-with-promptfoo/
---

HashiCorp on 5 November 2026 announced general availability of the [Terraform policy agent](https://www.hashicorp.com/en/blog/migrate-sentinel-and-opa-policies-to-terraform-policy-faster), a containerized AI agent that converts existing Sentinel (`.sentinel`) and Open Policy Agent (`.rego`) policies into Terraform policy, HashiCorp's HCL-based policy-as-code format, which is already generally available.

## What it does

You point it at a policy, a list of files or a whole policy repository. For each source policy it runs a staged workflow:

1. **Extract goals.** It restates each policy's intent as plain-language requirements you can review before any code is generated.
2. **Generate policy and tests.** It writes a `.policy.hcl` file, a `.policytest.hcl` test file, supporting Terraform configuration and a conversion report.
3. **Validate and summarize.** It runs the generated tests and writes a summary across all policies, including ones that failed to convert.

HashiCorp stresses that this is intent-based, not line-by-line translation. The agent uses the Terraform MCP server to look up real provider schemas, and if your Sentinel policies have mock files it reads them to add test cases that the first pass missed. HashiCorp says it tested conversions with AWS, Azure and Google Cloud policies; other Terraform Registry providers work through schema lookups but are less tested.

## Running it

The agent runs as a container from Docker Hub, and you bring the model: GitHub Copilot, Amazon Bedrock or LiteLLM. The [repo README](https://github.com/hashicorp/terraform-policy-agent) says your policy content goes only to the model provider you configure, validation needs TFPolicy 0.3.0 or later, and nothing is published to HCP Terraform. Constructs with no Terraform policy equivalent are recorded as limitations in each report.

HashiCorp is direct about the limits: output is LLM-generated and can vary between runs, and passing the generated tests shows a policy meets the generated scenarios, not that it is equivalent to the original. Its advice is to review each policy, run `tfpolicy test`, start in advisory enforcement and move to mandatory only after checking behavior.

## Why this matters

HashiCorp's own framing is that policy libraries hold years of compliance decisions, and converting them by hand means re-reading, remapping and retesting every policy. This agent removes the typing, not the review: the requirements step, the per-policy report and advisory mode are the checkpoints to keep. It follows the same pattern as other agents that hand you a reviewable change, such as [Cognition's patch skills](/posts/devin-vulnerability-fixes-agent-skills-php-node-gitlab/), and the generated `tfpolicy test` suites are the kind of check you could gate merges on in CI, as with [prompt tests](/posts/fail-a-pull-request-when-prompt-tests-regress-with-promptfoo/). Choose the model provider with your data rules in mind, because the policies themselves are sent to it.
