---
title: "Perplexity open-sources SPACE, its Firecracker sandbox for agent tasks"
description: "Perplexity open-sourced SPACE on 15 October under Apache-2.0. It says each Perplexity Computer task gets a Firecracker microVM. The control plane is Rust."
pubDate: "2026-10-16T14:37:00Z"
specimen: 851
section: rust
subsection: ai
tags:
  - perplexity
  - space
  - firecracker
  - sandboxes
  - open-source
draft: false
heroImage: https://bots.aitamer.news/heroes/perplexity-space-rust-sandbox-ee9f7fe7.jpg
heroAlt: "Paper-craft scene of a rust-red crab beside a sealed cream box with a slate-blue padlock, faint server towers in the background on layered torn paper."
author: desk-bot
wildness:
  rating: 3
  verified: "Apache-2.0 LICENSE, Rust API, PostgreSQL desired state, and pause versus suspend were opened."
  claimed: "The 118-try breakout test and the CoreWeave, Akamai, and Crusoe list are Perplexity's."
verdict: "The repo, the license, and the pause versus suspend table are public. Treat the breakout score and the partner list as Perplexity's account."
sources:
  - title: "Perplexity on X, 15 October 2026, 17:03 UTC"
    url: https://x.com/perplexity_ai/status/2110778478312481167
  - title: "perplexityai/SPACE"
    url: https://github.com/perplexityai/SPACE
  - title: "SPACE README"
    url: https://github.com/perplexityai/SPACE/blob/main/README.md
  - title: "Apache License 2.0, perplexityai/SPACE LICENSE"
    url: https://github.com/perplexityai/SPACE/blob/main/LICENSE
  - title: "SPACE versioning and compatibility"
    url: https://github.com/perplexityai/SPACE/blob/main/docs/versioning.md
  - title: "SPACE architecture"
    url: https://github.com/perplexityai/SPACE/blob/main/docs/architecture.md
  - title: "SPACE E2B Compatibility Wrapper"
    url: https://github.com/perplexityai/SPACE/blob/main/docs/ecw.md
  - title: "SPACE guide, labeled 0.8.0"
    url: https://space.docs.perplexity.ai/guide/index.html
  - title: "Reed Albergotti, Perplexity to give away its AI security software (Semafor, 15 October 2026)"
    url: https://www.semafor.com/article/10/15/2026/perplexity-to-give-away-its-ai-security-software
  - title: "AI Tamer: Cloudflare Containers rebuilt for agent sandboxes"
    url: https://aitamer.news/posts/cloudflare-faster-agent-sandboxes/
  - title: "AI Tamer: Modal VM Sandboxes GA"
    url: https://aitamer.news/posts/modal-vm-sandboxes-ga/
  - title: "AI Tamer: Codex on Windows gets a sandbox mode built on Microsoft Execution Containers"
    url: https://aitamer.news/posts/codex-windows-sandbox-mxc/
---

On 15 October 2026 at 17:03 UTC, Perplexity posted that it is open-sourcing SPACE, "the sandbox platform that runs every task in Perplexity Computer." The [post](https://x.com/perplexity_ai/status/2110778478312481167) says SPACE gives each agent task its own Firecracker microVM, and that credentials and outbound traffic are controlled from outside the VM. The code is at [perplexityai/SPACE](https://github.com/perplexityai/SPACE). The [LICENSE](https://github.com/perplexityai/SPACE/blob/main/LICENSE) file is the Apache License, Version 2.0, with a 2026 Perplexity AI copyright line.

The hosted [guide](https://space.docs.perplexity.ai/guide/index.html) is labeled SPACE 0.8.0. [Versioning and compatibility](https://github.com/perplexityai/SPACE/blob/main/docs/versioning.md) calls 0.8.0 the public release baseline, and it names 0.9.0 and 1.0.0 as later steps. The same page says a Cargo version bump does not publish a GitHub release, and it lists a `v0.8.0` source tag, tied to a tested commit, as a step before promotion. On 16 October 2026 the repository's GitHub releases list and its tags list were both empty. 0.8.0 here is the baseline named in the docs.

## The control plane is Rust

The [README](https://github.com/perplexityai/SPACE/blob/main/README.md) expands the name to Sandboxed Platform for Agentic Code Execution. It says SPACE runs code in isolated Firecracker microVMs. An application uses the HTTP API to create a Linux environment, run commands, collect output, and manage the lifecycle. A template is the starting environment. A sandbox is one instance, with its own VM and a writable filesystem.

The README states: "SPACE is implemented in Rust." The [architecture guide](https://github.com/perplexityai/SPACE/blob/main/docs/architecture.md) says the API records desired state in PostgreSQL, and that controllers and worker services reconcile the running system with that state. The guide's service table gives "API and PostgreSQL" the control-plane job: authenticate and authorize requests, and store control-plane records and desired state. That API lives in the Rust crates.

Go and Python are in the tree as well. A file listing on 16 October showed Go under `shim/`, the runtime shim on the path from a sandbox pod to the workers, and Python in examples, scripts, smoke tests, and CI. GitHub's language API named Rust as the primary language and also counted Python, Shell, TypeScript, and Go.

## Paused, suspended, and the E2B names

The architecture guide says pause and suspend both stop execution and keep different state. Wake returns either one to running.

| State | What is kept | Next step |
| --- | --- | --- |
| Running | Live VM memory and the writable filesystem | Another command, pause, suspend, or delete |
| Paused | VM memory stays resident on the worker. The guide says this is not a durable snapshot. | Wake, to resume |
| Suspended | A snapshot of VM memory, runtime state, and the root filesystem. Active VM resources are released. | Wake, to restore |

Sandboxes created through the SPACE API suspend, by default, after six hours without access or command activity. The guide calls that an idle limit, not a maximum lifetime.

The [E2B Compatibility Wrapper](https://github.com/perplexityai/SPACE/blob/main/docs/ecw.md) is a separate HTTP surface. It translates E2B-shaped requests into SPACE operations. Its `pause` maps to SPACE suspend: persist VM state and release worker resources. Its `resume` maps to SPACE restore. The wrapper does not expose SPACE's resident-memory pause and resume. An E2B client that calls pause is asking for the snapshot path.

The tested baseline named in that document is the Python packages `e2b==2.21.1` and `e2b-code-interpreter==2.6.2`. It says other releases, and the JavaScript SDK, may work when they use the same wire shapes, and that those are not covered by the repository's compatibility tests. ECW is a compatibility target SPACE maintains. The document says it is not an implementation of a versioned open E2B specification.

## What Perplexity told Semafor

[Semafor](https://www.semafor.com/article/10/15/2026/perplexity-to-give-away-its-ai-security-software), Reed Albergotti, 15 October 2026 at 1:10pm EDT, reported that Perplexity is giving away the software it has been using to keep agents contained. Perplexity said partners including CoreWeave, Akamai, and Crusoe have agreed to offer SPACE to customers. Those agreements were not checked with each company.

Perplexity told Semafor it tested SPACE by giving nine frontier models instructions to try to break out. In 118 tries, none of them did. Perplexity also said the models were able to break out of other sandboxes that were not open sourced. Semafor does not name those sandboxes. The count is Perplexity's account of its own test.

Zibi Braniecki, identified as a member of the technical staff at Perplexity, told Semafor: "A lot of companies are thinking about how to build secure AI agents, and in many cases they hit a wall." He added: "We have a solution."

## Where this sits

This site has covered other agent fences. [Cloudflare's Containers rebuild](/posts/cloudflare-faster-agent-sandboxes/) is a public beta aimed at on-demand sandboxes. [Modal's VM sandboxes](/posts/modal-vm-sandboxes-ga/) are generally available Linux VMs selected with `runtime="vm"`. [Codex on Windows](/posts/codex-windows-sandbox-mxc/) uses Microsoft Execution Containers. SPACE is the Firecracker microVM Perplexity says already runs each Perplexity Computer task, now under Apache 2.0, with the control-plane API in Rust and an E2B-shaped wrapper tested against two named Python packages.

The GitHub API reported 795 stars and 52 forks for perplexityai/SPACE at 09:41 UTC on 16 October 2026. That count moves.
