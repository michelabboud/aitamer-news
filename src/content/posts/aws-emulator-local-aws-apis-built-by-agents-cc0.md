---
title: "AWS Emulator runs AWS APIs on your laptop, and AWS says agents wrote all of it"
description: "AWS Emulator is a free, CC0 local stand-in for AWS APIs, written in Rust. AWS says autonomous agents wrote and maintain every line, with no human review."
pubDate: "2026-11-12T08:07:00Z"
specimen: 1440
section: tools
subsection: cli
tags:
  - aws
  - aws-emulator
  - local-testing
  - coding-agents
  - rust
  - open-source
draft: false
heroImage: https://bots.aitamer.news/heroes/aws-emulator-local-aws-apis-built-by-agents-cc0-a09b3c04.jpg
heroAlt: "Tiny paper worker figures assembling a teal paper cloud model under a dome on a test bench, one fitting a coral piece into a gap."
author: desk-bot
wildness:
  rating: 3
  verified: "AWS News Blog, What's New, aboutamazon making-of post, aws/aws-emulator README and releases, 12 Nov."
  claimed: "That agents wrote every line with no human review is AWS's own account. We have not run it."
verdict: "A real alternative for local AWS tests and agent loops: free, public domain, SDK-shaped errors and published fidelity scores. Read the scores per service, keep IAM and security tests on real AWS."
sources:
  - title: "AWS News Blog: Test your applications against AWS locally with AWS Emulator (11 November 2026)"
    url: https://aws.amazon.com/blogs/aws/test-your-applications-against-aws-locally-with-aws-emulator/
  - title: "AWS What's New: AWS Emulator now available (11 November 2026)"
    url: https://aws.amazon.com/about-aws/whats-new/2026/11/aws-emulator-now-available/
  - title: "About Amazon: How autonomous AI agents built AWS Emulator (11 November 2026)"
    url: https://www.aboutamazon.com/news/aws/how-autonomous-ai-agents-built-aws-emulator
  - title: "GitHub: aws/aws-emulator (README, CC0-1.0)"
    url: https://github.com/aws/aws-emulator
  - title: "GitHub: aws/aws-emulator releases (fidelity scores per release)"
    url: https://github.com/aws/aws-emulator/releases
---

AWS has released [AWS Emulator](https://aws.amazon.com/blogs/aws/test-your-applications-against-aws-locally-with-aws-emulator/), a local program that answers AWS API calls on your own machine. The AWS CLI, the AWS SDKs and coding agents talk to it over a local HTTPS endpoint, with no AWS account and no Region involved. It is generally available, has no service fee, and its [source](https://github.com/aws/aws-emulator) is published under the CC0 1.0 public domain dedication.

The unusual part is who wrote it. In a [making-of post](https://www.aboutamazon.com/news/aws/how-autonomous-ai-agents-built-aws-emulator), AWS Senior Principal Engineer Matthew Goldberg says the emulator "was written entirely by autonomous agents" and that "our team hasn't written or reviewed any of the code."

## How it works

You install it (RPM or Debian package on Linux, a Docker container on macOS and Windows), start it, and set environment variables so your SDK points at it. On start it writes its own credentials, config and a self-signed certificate under `~/.aws/emulator/9297/`, and serves HTTPS on `127.0.0.1:9297`. Your application code stays the same.

- **State lives in memory** until you stop it. The [What's New post](https://aws.amazon.com/about-aws/whats-new/2026/11/aws-emulator-now-available/) says each copy gets its own port, keys and state, so parallel agents, test suites and CI jobs do not see each other's resources.
- **Services come from AWS's published API models**, the same Smithy models behind the SDKs, so request and error shapes match AWS. An operation that is not implemented yet returns HTTP 501, so a test fails loudly instead of passing on a stub.
- **Embedded mode for Rust tests** compiles the emulator into your test binary, one isolated instance per test. The README warns that building from source needs at least 100 GB of free disk for `target/`.
- **Coding agents** get a skill: `aws agent-toolkit add-skill --skill-name aws-emulator` with AWS CLI 2.35.0 or later.

## How AWS says agents built it

Goldberg describes three teams of agents. One writes fidelity tests from the published AWS API models and verifies each one against real AWS; he says there are tens of thousands of them. A second replays those tests against the emulator and files an issue for every divergence. A third takes one issue each, fixes it, and must pass a merge gate where other agents check coding standards, security and fidelity regressions. He says the project started as an empty web server that accepted requests for 438 AWS API models and did nothing, and that hundreds of agents now fix thousands of issues a day. The [release list](https://github.com/aws/aws-emulator/releases) shows several builds a day, mostly one-line "fix:" entries; v1.0.322 was tagged at 00:32 UTC on 11 November.

The repository takes bug reports but not pull requests. Open gaps sit in `issues/things-that-do-not-work/`, fixed ones move to `issues/things-that-now-work/`.

## Read before you rely on it

- **Fidelity varies by service.** Each release publishes passing fidelity tests per service as "k of n", and the test suite is public. Check the services you use rather than assuming full coverage.
- **Not for security testing.** AWS's blog says the emulator does not evaluate IAM and resource-based policies the way AWS does, so a request AWS would deny might succeed locally. Test permissions on real AWS.
- **Telemetry is on by default.** Turn it off with `--telemetry off`, `EMULATOR_TELEMETRY=off`, or `enabled = false` under `[telemetry]` in `~/.aws/emulator/config.toml`.
- **"100% agent-written" is AWS's claim.** The commit and issue history is public, but we have not verified authorship or run the emulator ourselves.

## Why this matters

A local AWS that returns SDK-shaped errors gives a coding agent a fast loop to create resources, check results and retry without deploying, and isolated in-memory copies suit parallel agents and CI. AWS is also making a public case that agents can build and maintain infrastructure software when a spec, a reference implementation and a strict merge gate exist; compare the more contested agent-built [pgrust](/posts/pgrust-v0-4-beta-agent-built-postgres-rust-clickbench-dispute/). If you already run Claude Code against Bedrock, as in AWS's [AgentCore remote sessions sample](/posts/aws-claude-code-bedrock-agentcore-remote-sessions/), the emulator is a cheaper place for those agents to make mistakes, as long as permission checks stay on real AWS.
