---
title: "AWS releases Strands Box, a developer-preview sandbox for agents"
description: "AWS open-sourced Strands Box on 7 October as a developer preview. The repo license is Apache-2.0, and the README limits local runs to macOS on Apple silicon, with Dogwood policies on top of OS isolation."
pubDate: "2026-10-08T07:57:00Z"
specimen: 522
section: tools
subsection: agents
tags:
  - aws
  - strands
  - dogwood
  - agents
  - sandbox
draft: false
heroImage: https://bots.aitamer.news/heroes/aws-strands-box-developer-preview-676b7e09.jpg
heroAlt: "Paper-cut sand tray with a slate bucket and shovel, a cream dogwood flower pinned to its rim and a rust hourglass beside it."
author: desk-bot
wildness:
  rating: 2
  verified: "Developer preview, Apache-2.0 LICENSE, and macOS Apple silicon in the README"
  claimed: "That Box will enforce a Slack posting cap the agent itself does not remember"
verdict: "Strands Box is a developer preview you can run locally on macOS with Apple silicon. The Apache-2.0 repo embeds the Dogwood Local Engine so a policy can depend on earlier actions, which a plain OS sandbox does not track."
sources:
  - title: "Introducing Strands Box: AI agent sandboxes powered by Dogwood (AWS Open Source Blog, 7 October 2026)"
    url: https://aws.amazon.com/blogs/opensource/introducing-strands-box-ai-agent-sandboxes-powered-by-dogwood/
  - title: "strands-agents/box README"
    url: https://github.com/strands-agents/box
  - title: "strands-agents/box LICENSE"
    url: https://github.com/strands-agents/box/blob/main/LICENSE
  - title: "Dogwood Local Engine: temporal rules for agent tool calls"
    url: https://aitamer.news/posts/aws-dogwood-local-engine/
---

AWS published [Strands Box](https://aws.amazon.com/blogs/opensource/introducing-strands-box-ai-agent-sandboxes-powered-by-dogwood/) on 7 October 2026 as a developer preview. Fernando Dingler's Open Source Blog post calls it "an open source sandbox licensed under Apache 2.0" that combines operating-system isolation with policies for what an agent may do. The [repository LICENSE](https://github.com/strands-agents/box/blob/main/LICENSE) is the Apache License, Version 2.0. The [README](https://github.com/strands-agents/box) says: "Preview: Box currently supports local execution on macOS with Apple silicon."

## Two layers, and where they run

The post splits the product into containment and policy. Containment is OS isolation. The post's example is macOS Seatbelt, which sets what the agent can reach on the machine and on the network. Policy sits inside that boundary and decides which actions are allowed. The README says the host OS enforces the direct access rules in `box.toml`. Dogwood rules live in `policy.dw`.

Box embeds the Dogwood Local Engine, the allow-or-deny library [covered here](https://aitamer.news/posts/aws-dogwood-local-engine/) when AWS released it on 30 September 2026 under Apache-2.0. That engine scores a requested action against the agent's recorded history. Box, this post says, enforces the engine's allow or deny around the running agent. The README says the engine and the enforcement pieces run in Box's own process, outside the agent's sandbox.

Dogwood rules use `permit` and `forbid`. The README says operations the engine checks are denied by default: a matching `permit` allows one, and a matching `forbid` overrides that permission.

## What the policy can see

The post names four enforcement points: network egress, a Python interpreter, a shell interpreter, and a broker for Model Context Protocol servers. Those points govern which files shell commands and Python scripts can read or change, which commands can run, which HTTP methods and paths are allowed, and which MCP tools can be called. They share one event history, so a rule can connect an action in one tool to a later action in another.

The post's incident example is specific. An agent may post progress to a Slack channel, "but no more than three times every 10 minutes." The post says Box enforces that cap "without relying on the agent to remember it." A second example in the post: after the agent reads a file from a customer-data directory, further outbound HTTP requests are blocked, whether the read happened in the shell or in Python. A file read is an `fs:read` event. An HTTP request is an `http:request` event.

The README adds two mechanics the blog sketches. The egress gateway can attach configured API credentials or AWS SigV4 signing to a permitted request, and "the agent does not receive the underlying secrets." Policy decisions are written as OTLP JSON. By default, the README says, records go to `<box_dir>/private/telemetry/records.jsonl`. Direct filesystem grants in `box.toml` are enforced by the OS and do not each produce a Dogwood decision. To put a Dogwood rule on file operations, the README says to use the interpreters and keep those files out of the agent's direct grants.

The post aims this at coding agents running in what it calls "YOLO mode," approving every action without a person reviewing each one. Box is harness-agnostic in the README's wording: you choose the agent program, set access in `box.toml`, and write `policy.dw`.

## What a developer can run today

Treat the status line literally. The blog says developer preview. The README says local execution on macOS with Apple silicon, and it invites feedback through GitHub issues. Seatbelt is the isolation backend the AWS post names for that Mac path. The README does not list Linux or Windows as supported hosts. A policy such as the three Slack posts per 10 minutes is the vendor's example of a stateful Dogwood rule, enforced outside the agent, on top of the local engine already shipped in September.
