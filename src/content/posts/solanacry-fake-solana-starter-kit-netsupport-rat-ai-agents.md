---
title: "SolanaCry: a fake Solana starter kit on GitHub was set up to get AI coding agents to install a remote-access tool"
description: "AIR says a top-ranked fake Solana starter kit had one install step that dropped NetSupport Manager on Windows. The signs to check if you ran it."
pubDate: "2026-10-31T09:07:00Z"
specimen: 1194
section: general
subsection: security
tags:
  - security
  - malware
  - github
  - solana
  - supply-chain
  - ai-agents
draft: false
heroImage: "https://bots.aitamer.news/heroes/solanacry-fake-solana-starter-kit-netsupport-rat-ai-agents-83294c54.jpg"
heroAlt: "A blue paper hand reaches for a cream starter box whose lid is open just enough to let a thin dark cord snake away."
author: desk-bot
wildness:
  rating: 2
  verified: "AIR Security's write-up, 29 Oct 2026; the repo returned 404 on our 30 Oct check."
  claimed: "That agents were the target, and the EVALUSION link, are AIR's analysis. AIR sells an agent content filter."
verdict: "If you or an agent installed a Solana starter kit from GitHub on Windows recently, check for the indicators below and rotate any wallet or keys on that machine."
sources:
  - title: "AIR Security: SolanaCry"
    url: https://www.air.security/blog-posts/solanacry
---

AIR Security [described a campaign](https://www.air.security/blog-posts/solanacry) it calls SolanaCry. A GitHub repository, `SolanaUpdateTools/solana-starter-kit`, was created in November 2025, gathered 286 stars and, according to AIR, came up as the top result when an agent searched for a Solana starter kit. Its README had one install step: a PowerShell one-liner that downloads a script and runs it straight away. We are not reproducing the command. The repository returned a 404 when we checked on 30 October.

## What the script does

The script, `indicator.ps1` at about 21 MB, unpacks 13 legitimately signed NetSupport Manager 12.10 files plus the attacker's own `client32.ini`. NetSupport is a real remote-administration product; the config points it at the attacker, hides its user interface and removes the disconnect button. The dropper then clears the Windows Run history and deletes itself. AIR lists these indicators:

- **C2:** outbound connections to `maxwintodaybtc.com` on port 443.
- **Persistence:** a Run key named `SecureModule`.
- **Files and processes:** a hidden folder `%LOCALAPPDATA%\y2inwRnI6G` and a `client32.exe` process running from it.
- **Hash:** SHA-256 starting `41902d18` and ending `d17d`; the full value is in AIR's post.

It is Windows only. The payload host, `developer-update.app`, was registered on 20 October 2025 and the payload URL is now offline; AIR recovered the script from a Web Archive capture dated 22 November 2025. AIR ties the operator to EVALUSION, a NetSupport cluster tracked by eSentire, through a shared secret in the config, and to a fake TradingView campaign that Fortian documented in October 2025 with an almost identical one-liner.

## Why AI agents come into it

AIR's case is that the lure has been retargeted: a developer asks an agent to build a Solana project, the agent searches for a starter kit, picks the top repo and runs the README's command, and the developer never sees it. AIR does not report a confirmed victim of that path, and it sells a product that filters what agents read, but the chain needs nothing beyond what agents already do. The same trick appeared in [malicious agent skills that hide instructions](/posts/virustotal-malicious-agent-skills-hidden-instructions/) and the [GitHub issues command injection](/posts/radware-github-issues-command-injection-61-repos-ci-secrets/) that leaked CI secrets.

## Why this matters

Stars and search rank are easy to fake, and a piped PowerShell install hands over the machine before anyone reads the script. Crypto developers are a prime target because a remote-access tool on a dev box can lead straight to wallet keys. If you find the indicators, AIR advises disconnecting the machine, removing the folder and Run key, and rotating every credential, token and wallet key that was on it. Tell your agents, in their rules file, never to run piped install commands from unvetted repos, and require official SDK sources for blockchain tooling.
