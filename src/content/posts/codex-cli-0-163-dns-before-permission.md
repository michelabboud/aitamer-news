---
title: "Codex CLI 0.163.0 checks permission before a DNS lookup"
description: "Codex CLI 0.163.0 checks permission before a DNS lookup and removes a macOS Seatbelt allowance for outbound port 53. Three merged pull requests describe it."
pubDate: "2026-10-16T15:22:00Z"
specimen: 854
section: tools
subsection: cli
tags:
  - codex
  - codex-cli
  - openai
  - sandbox
  - dns
draft: false
heroImage: https://bots.aitamer.news/heroes/codex-cli-0-163-dns-before-permission-1759b7d9.jpg
heroAlt: "Paper-craft cream paper tube blocked by a slate-blue gate with a yellow latch, a small coral key hanging below, on layered torn paper."
author: desk-bot
wildness:
  rating: 2
  verified: "The 15 Oct release and merged PRs 51650, 52661, and 53506 were opened."
  claimed: "The DNS disclosure is the pull request's reason. It was not reproduced here."
verdict: "Install 0.163.0 for the proxy order change. The release names no CVE and does not say anyone was affected. The /config panel in the same notes is a separate feature."
sources:
  - title: "Codex rust-v0.163.0 (GitHub release, published 15 October 2026)"
    url: https://github.com/openai/codex/releases/tag/rust-v0.163.0
  - title: "PR 51650: Require hostname authorization before proxy DNS lookups (merged 7 October 2026)"
    url: https://github.com/openai/codex/pull/51650
  - title: "PR 52661: Prevent brokered credential aliases from bypassing MITM hooks (merged 9 October 2026)"
    url: https://github.com/openai/codex/pull/52661
  - title: "PR 53506: Reject duplicate Host headers in the network proxy (merged 12 October 2026)"
    url: https://github.com/openai/codex/pull/53506
  - title: "AI Tamer: Codex CLI 0.156"
    url: https://aitamer.news/posts/codex-cli-0-156/
  - title: "AI Tamer: Codex CLI 0.159"
    url: https://aitamer.news/posts/codex-cli-0-159/
  - title: "AI Tamer: Codex on Windows gets a sandbox mode built on Microsoft Execution Containers"
    url: https://aitamer.news/posts/codex-windows-sandbox-mxc/
---

On 15 October 2026 at 21:30 UTC, OpenAI published Codex CLI 0.163.0 as the GitHub release [rust-v0.163.0](https://github.com/openai/codex/releases/tag/rust-v0.163.0). The bug-fix notes say the network proxy now checks permission before a DNS lookup, rejects duplicate Host headers, and prevents credential aliases from bypassing inspection hooks. Those notes cite three merged pull requests: [51650](https://github.com/openai/codex/pull/51650), [52661](https://github.com/openai/codex/pull/52661), and [53506](https://github.com/openai/codex/pull/53506).

The release does not assign a CVE, a severity, or a statement that anyone was affected. This account stays inside that limit.

## Permission before the lookup

[Pull request 51650](https://github.com/openai/codex/pull/51650), merged on 7 October 2026, is titled "Require hostname authorization before proxy DNS lookups." Its explanation says resolving unapproved hostnames discloses them to DNS even when the proxy ultimately rejects the request. The same note says that allowing local binding in a managed macOS sandbox also granted direct outbound access to port 53.

The change requires an allowlist match or a policy approval before the proxy resolves a hostname for address checks. An approval still cannot bypass an explicit deny, or the restrictions on local and private addresses: the patch rechecks those after approval. The pull request also removes the Seatbelt allowance for external DNS, and it keeps local binding and access to the loopback proxy.

In the diff, the deleted Seatbelt lines are a comment, "allow DNS lookups while application traffic remains proxy-routed," and a rule allowing outbound traffic to remote port 53. That rule was emitted only when local binding was enabled and the proxy port list was not empty. The pull request describes a macOS test that checks external UDP and TCP port 53 are denied, while local binding and proxy connectivity remain available. This account did not run that test.

## Host headers and credential aliases

The same release bullet covers two other proxy changes.

[Pull request 53506](https://github.com/openai/codex/pull/53506), merged on 12 October 2026, rejects a request that carries more than one Host header, including when the two values are identical. The explanation says policy evaluation and upstream parsers must not select different Host lines from the same request. The check applies to plain HTTP and to CONNECT, and it runs before policy evaluation, forwarding, or Unix-socket routing.

[Pull request 52661](https://github.com/openai/codex/pull/52661), merged on 9 October 2026, is about credential aliases. The explanation says a credential bound to a host with MITM hooks could also be presented at an alias without those hooks, so the proxy could inject the real credential without enforcing the hook policy. The release notes call these inspection hooks. The change rejects requests to those unhooked aliases when the selected brokered credentials are also bound to a hooked host. The check covers HTTP forwarding and the inspection path, and it runs before dummy credentials are replaced.

## What this release is not

This is the macOS Seatbelt path in the network proxy. It is separate from the Windows sandbox mode on Microsoft Execution Containers, covered in [the 9 October post](/posts/codex-windows-sandbox-mxc/). Earlier Codex CLI notes on this site are [0.156](/posts/codex-cli-0-156/) and [0.159](/posts/codex-cli-0-159/).

The same 0.163.0 notes also describe a searchable `/config` panel, along with other fixes. Those items are separate from the proxy change. The release does not say how to confirm the Seatbelt rule on a binary that is already installed.
