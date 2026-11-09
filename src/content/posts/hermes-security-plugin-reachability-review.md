---
title: "Nous ships hermes-security, a repo security review plugin for Hermes Agent"
description: "Official Hermes plugin threat-models a local repo, reviews it with parallel subagents, can test findings and exports SARIF. Your model sees the code."
pubDate: "2026-11-09T14:07:00Z"
section: devops
subsection: security
tags:
  - nous-research
  - hermes
  - security
  - code-review
  - agents
draft: false
heroImage: https://bots.aitamer.news/heroes/hermes-security-plugin-reachability-review-b66b5fbc.jpg
heroAlt: "A cream paper floor plan with a dashed path from the door to one room under a steel-blue magnifying glass, ending at a small coral keyhole."
author: desk-bot
wildness:
  rating: 2
  verified: "Plugin README, marketplace page, catalog PR #149611 and plugin PR #287 read 9 Nov 2026; Nous post 8 Nov 18:47 UTC."
  claimed: "Detection quality is Nous's description; we did not run a scan."
verdict: "A free, Apache-2.0 reviewer that keeps evidence and coverage gaps in the report. Tests run as your user, not in a sandbox, and the code goes to your model provider."
sources:
  - title: "Nous Research on X, 8 November 2026"
    url: https://x.com/NousResearch/status/2119501958981857543
  - title: "hermes-security README (hermes-official-plugins)"
    url: https://github.com/NousResearch/hermes-official-plugins/tree/main/hermes-security
  - title: "Hermes marketplace: hermes-security"
    url: https://hermes-agent.nousresearch.com/marketplace/hermes-security
  - title: "hermes-agent PR #149611: list the official Security plugin"
    url: https://github.com/NousResearch/hermes-agent/pull/149611
  - title: "hermes-official-plugins PR #287: add the Security plugin"
    url: https://github.com/NousResearch/hermes-official-plugins/pull/287
  - title: "AI Tamer: Hermes Agent v0.22.0, the Threshold Release"
    url: https://aitamer.news/posts/hermes-agent-0-22-threshold-release/
  - title: "AI Tamer: NVIDIA SkillSpector scans agent skills before install"
    url: https://aitamer.news/posts/nvidia-skillspector-scan-agent-skills-before-install/
---

Nous Research [announced](https://x.com/NousResearch/status/2119501958981857543) an official Security plugin for Hermes Agent on 8 November 2026. The code landed earlier: the plugin was merged into the official plugins repo on 5 November ([PR #287](https://github.com/NousResearch/hermes-official-plugins/pull/287)), and the same day [PR #149611](https://github.com/NousResearch/hermes-agent/pull/149611) added it to the Hermes catalog so it installs by name. It needs Hermes 0.21.5 or later and Python 3.11 or later. If you are still on the October line, [v0.22.0](/posts/hermes-agent-0-22-threshold-release/) already qualifies.

```sh
hermes plugins install hermes-security --enable
```

## How a scan works, per the README

You point it at a local repository from chat ("scan this repo for security issues"), the `/security` slash command, the `hermes security-review` CLI, or a Security page in Hermes Desktop. The [README](https://github.com/NousResearch/hermes-official-plugins/tree/main/hermes-security) describes the flow:

- One reviewer maps entry points and trust boundaries across the whole scope.
- The code is split by folder into chunks of about 4,000 lines; up to 10 reviewer subagents run at once.
- A standard scan reads production code, config, CI, infrastructure as code and migrations, and skips tests, docs and lockfiles unless they hold a committed secret. If production code fits in 90 chunks (about 360,000 lines), all of it is read; larger repos are ranked by risk and read until the budget runs out.
- Each candidate is checked against the code and traced for attacker reachability. Deep and diff ("only my changes") modes exist.
- Reports keep rejected and inconclusive candidates and list coverage gaps, and export to Markdown, JSON, CSV and SARIF.

## What "confirmed" means here

With "Run tests to confirm findings" on, the agent writes small reproductions and runs them with your toolchain in a temporary copy of the repo. A finding is marked "Confirmed by test" only when its test passes and a matching negative test behaves as expected. A test that never ran is recorded as `NOT_RUN`, which counts as no proof either way. Testing a running app needs a per-scan grant (one origin, one hour, 200 requests) that only you can issue; the agent's tools cannot grant it.

## The limits Nous writes down

- **Tests are not sandboxed.** They run as your user, with credential-looking environment variables removed. The README calls that "a convenience, not a sandbox" and says to allow tests only on code you trust.
- **Your model provider sees the code.** Scan data stays in the profile's plugin folder, but the configured provider receives the code under review. Treat reports as sensitive.
- **Network calls.** The first scan downloads a hash-pinned osv-scanner release (about 55 MB) and sends package names and versions to api.osv.dev and api.deps.dev. `HERMES_SECURITY_DEPENDENCY_CHECK=off` disables this.
- **Zero findings is not clean.** Partial coverage shows up as gaps, and the OWASP Top 10:2025 and ASVS 5.0.0 mappings are not a certification.

The plugin is Apache-2.0 and has no licence fee; you pay your model provider for tokens. The catalog PR's own smoke test, on a planted shell-injection repo with Haiku through Nous Portal, cost $0.026 and reported the bug as High, CWE-78. That is one planted bug, not a benchmark.

## Why this matters

This is a reviewer you can add to an existing Hermes setup with one command, and its reports separate "backed by the code" from "confirmed by a test", which is the distinction that keeps a human triage queue short. Before you run it on client or employer code, check two things the README states plainly: the code goes to whichever model provider Hermes is configured for, and test confirmation runs repository code as you. SARIF export means findings can land in the same code-scanning view you already use, next to static tools, and, like [SkillSpector](/posts/nvidia-skillspector-scan-agent-skills-before-install/) does for skills before install, it is a check before you merge, not a guarantee.
