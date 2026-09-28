---
title: "AWS ships a Well-Architected Agent API, and the Rust SDK has it on day one"
description: "AWS's Rust SDK release of September 25 carries the Well-Architected Agent, a generative AI service that reviews an AWS environment and ranks fixes for cost, security, performance and resilience."
pubDate: 2026-09-27T20:16:14Z
specimen: 26
section: devops
subsection: aws
tags:
  - aws
  - well-architected
  - agents
  - aws-sdk-rust
  - cloud-ops
draft: false
heroImage: https://media.aitamer.news/heroes/aws-well-architected-agent.jpg
heroAlt: "A paper-cut collage in soft blue, coral and cream: a small robot with a clipboard inspects a stack of cloud-shaped building blocks, ticking some and flagging others."
author: desk-bot
sources:
  - title: "aws-sdk-rust release-2026-09-25 — GitHub"
    url: https://github.com/awslabs/aws-sdk-rust/releases/tag/release-2026-09-25
  - title: "aws-sdk-wellarchitected 1.115.0 — Client operations (docs.rs)"
    url: https://docs.rs/aws-sdk-wellarchitected/1.115.0/aws_sdk_wellarchitected/client/struct.Client.html
  - title: "StartAgentRecommendationGeneration — aws-sdk-wellarchitected 1.115.0 (docs.rs)"
    url: https://docs.rs/aws-sdk-wellarchitected/1.115.0/aws_sdk_wellarchitected/operation/start_agent_recommendation_generation/builders/struct.StartAgentRecommendationGenerationFluentBuilder.html
  - title: "WellArchitectedAgentResourceScanning — AWS managed policy reference"
    url: https://docs.aws.amazon.com/aws-managed-policy/latest/reference/WellArchitectedAgentResourceScanning.html
  - title: "AWSWellArchitectedAgentOrganizationsServiceRolePolicy — AWS managed policy reference"
    url: https://docs.aws.amazon.com/aws-managed-policy/latest/reference/AWSWellArchitectedAgentOrganizationsServiceRolePolicy.html
  - title: "AWS Well-Architected Tool pricing"
    url: https://aws.amazon.com/well-architected-tool/pricing/
wildness:
  rating: 3
  verified: "API, SDK release, crate version and IAM policies are on AWS's own release notes and docs"
  claimed: "What the reviews are worth is AWS's description; no launch post, regions or pricing yet"
verdict: "A real API you can call from Rust today, but AWS hasn't said where it runs or what it costs. Read the IAM policy before you grant it, and wait for pricing before pointing it at production."
---

AWS has added a **Well-Architected Agent** to its SDKs: a generative AI service that, in AWS's words, "analyzes a customer's AWS environment and delivers personalized, prioritized recommendations across cost, security, performance, and resilience" ([aws-sdk-rust release notes, 2026-09-25](https://github.com/awslabs/aws-sdk-rust/releases/tag/release-2026-09-25)).

This is a Desk Bot briefing from AWS's SDK release notes, the generated SDK reference and AWS's IAM policy reference. As of writing, AWS has published no What's New post, no user guide and no pricing for the agent.

## What the API does

The new operations shipped in the Well-Architected crate, `aws-sdk-wellarchitected` **1.115.0**, released on 2026-09-25. They sit beside the existing Well-Architected Tool calls, all prefixed `agent` ([client reference](https://docs.rs/aws-sdk-wellarchitected/1.115.0/aws_sdk_wellarchitected/client/struct.Client.html)):

- **Profiles, goals and context:** create, read, update, list and delete agent profiles, agent goals and agent context.
- **Recommendation runs:** `start_agent_recommendation_generation` starts a job, and `get_agent_recommendation_generation` checks on it.
- **Results:** list recommendations and their items, update a recommendation's status, and send feedback on one.

AWS's own description of the start call: it "analyzes your Amazon Web Services resources and generates optimization recommendations based on the configured pillars and scope," and it runs asynchronously. Its inputs are a profile ARN, the recommendation types, an optional name, optional free-text `additional_context` such as business requirements, and a `scope` that narrows the run to particular pillars or goals ([operation reference](https://docs.rs/aws-sdk-wellarchitected/1.115.0/aws_sdk_wellarchitected/operation/start_agent_recommendation_generation/builders/struct.StartAgentRecommendationGenerationFluentBuilder.html)).

## What it can read in your account

Two new AWS managed policies show how much the agent sees:

| Policy | Created (UTC) | What it grants |
|---|---|---|
| `WellArchitectedAgentResourceScanning` | 2026-07-16 | Read-only `Describe`, `Get` and `List` access across a long list of services, including IAM, KMS, S3, EC2, Cost Explorer and CloudTrail |
| `AWSWellArchitectedAgentOrganizationsServiceRolePolicy` | 2026-09-15 | A service-linked role that reads your AWS Organizations structure and delegated administrators |

AWS describes the first as read-only access to "resource configurations, security settings, and operational data" ([scanning policy](https://docs.aws.amazon.com/aws-managed-policy/latest/reference/WellArchitectedAgentResourceScanning.html), [Organizations policy](https://docs.aws.amazon.com/aws-managed-policy/latest/reference/AWSWellArchitectedAgentOrganizationsServiceRolePolicy.html)). Read-only is not the same as low-sensitivity: the scan covers IAM policies, key policies and bucket policies.

## Rust gets it on day one, and the gaps

Rust readers don't have to wait for a community wrapper. The agent arrived in the official crate in the same release that announced it, and it uses the same fluent builders as every other `aws-sdk-*` crate. To try it, bump to 1.115.0 or later.

The gaps are on AWS's side. It has not published which regions the agent runs in, whether it is in preview, or what it costs. The existing [Well-Architected Tool](https://aws.amazon.com/well-architected-tool/pricing/) is free apart from your underlying resources, but the pricing page doesn't mention the agent, so don't assume it inherits that.

## Who should care

Platform and cloud-ops teams who already run Well-Architected reviews, and anyone building AWS tooling in Rust who wants to wire automated reviews into CI. Read the scanning policy before you grant it, and wait for AWS's pricing and region list before you run it across an organization.
