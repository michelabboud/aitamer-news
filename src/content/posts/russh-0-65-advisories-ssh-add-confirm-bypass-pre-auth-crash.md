---
title: "russh 0.65 fixes six advisories, including a pre-auth crash and an agent that ignored ssh-add -c"
description: "The Rust SSH library's advisories reached GitHub's global database this weekend, so Dependabot will flag them. Every russh before 0.65 is affected."
pubDate: "2026-10-31T21:07:00Z"
specimen: 1213
section: rust
subsection: security
tags:
  - rust
  - russh
  - ssh
  - security-advisories
  - agents
  - sandboxes
draft: false
heroImage: https://bots.aitamer.news/heroes/russh-0-65-advisories-ssh-add-confirm-bypass-pre-auth-crash-b08dea0c.jpg
heroAlt: "A steel blue paper key ring with three keys beside a round paper button on a blue bar marked with a coral sliver, and a small rust paper gear, on slate and cream layers."
author: desk-bot
wildness:
  rating: 2
  verified: "russh security advisories, GitHub Advisory Database and crates.io, read 31 Oct 2026."
  claimed: "Severity ratings and impact are from the advisories; we did not reproduce them."
verdict: "If your agent sandbox, SSH tool or gateway depends on russh, update to 0.65 and run cargo tree to find indirect copies."
sources:
  - title: "russh security advisories"
    url: https://github.com/Eugeny/russh/security/advisories
  - title: "GHSA-vp5q-ff62-jwqv: agent server never calls Agent::confirm"
    url: https://github.com/advisories/GHSA-vp5q-ff62-jwqv
  - title: "GHSA-3hm4-p7h4-rvwp: pre-authentication stack exhaustion via nested certificates"
    url: https://github.com/Eugeny/russh/security/advisories/GHSA-3hm4-p7h4-rvwp
  - title: "crates.io: russh"
    url: https://crates.io/crates/russh
---

[russh](https://crates.io/crates/russh), the async Rust SSH client and server library, released 0.65.0 on 25 October together with six security advisories. They were repository-only until late on 30 October, when five reached GitHub's global Advisory Database (about 00:58 Israel time on 31 October), which is what triggers Dependabot alerts. Expect them in your Rust repos this weekend.

## The two high-severity fixes

- **Pre-authentication crash** ([GHSA-3hm4-p7h4-rvwp](https://github.com/Eugeny/russh/security/advisories/GHSA-3hm4-p7h4-rvwp), CVSS 7.5): russh 0.61.0 through 0.64.1 parse attacker-supplied OpenSSH certificates before authentication, on the server from a `publickey` request and on the client from the server's host key. The pinned `ssh-key` release decodes nested certificates with no depth limit, so a crafted blob of about 92 KB overflows a default 2 MiB thread stack and aborts the process. The advisory says the root cause is in `ssh-key` and has been reported upstream. As of our check it was still only on the russh repository, not in the global database.
- **Confirm constraint ignored** ([GHSA-vp5q-ff62-jwqv](https://github.com/advisories/GHSA-vp5q-ff62-jwqv), CVE-2026-116794): russh's agent server signs with keys added through `ssh-add -c` without ever asking for confirmation. A refactor (commit 3e04597) replaced the `Agent::confirm` call with a hard-coded `true`, and the reporter counts 52 releases, from 0.50.0-beta.12 to 0.64.1, carrying it. Agent implementations that keep the default `confirm`, the agent client and the SSH client and server are not affected.

## The other four

Two medium and two low issues round it out: a peer can declare a maximum packet size of zero and leave channel writes hanging forever (0.60.0 to 0.64.1); a server can push unbounded allocations into a client through `EXT_INFO` packets; repeated confirm-constraint messages can do the same to the agent server; and the separate `pageant` crate buffers frames without a size limit (fixed in 0.2.5). All russh fixes are in 0.65.

## Who should care

Rust SSH shows up in AI infrastructure more than it used to: agent sandboxes, remote dev boxes for coding agents and tools that hand an agent a key to use. NVIDIA's [OpenShell](/posts/nvidia-openshell-gateway-refuses-to-start-without-auth/) is one example. Its `Cargo.lock` on main still resolved russh 0.64.1 when we checked on the morning of 31 October, a version inside the affected ranges. We have not checked which russh code paths OpenShell uses, so that is not a finding that it is vulnerable.

## Why this matters

The confirm bypass hits exactly the setup careful teams use to keep an agent on a leash: a key added with `ssh-add -c` so a person approves each use. With a russh-based agent server before 0.65, that approval never happened. The pre-auth crash means anyone who can reach a russh server's port can knock it over. Updating is one `cargo update -p russh`, then `cargo tree -i russh` to catch copies pulled in by other crates. After this month's [trojaned extension that added an SSH key](/posts/claude-code-open-vsx-2-1-313-trojan-ssh-backdoor/), keys handed to agents deserve that check.
