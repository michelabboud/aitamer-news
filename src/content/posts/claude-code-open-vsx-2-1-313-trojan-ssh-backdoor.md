---
title: "A trojanized Claude Code 2.1.313 on Open VSX planted an SSH backdoor"
description: "A malicious anthropic.claude-code 2.1.313 on Open VSX added an attacker SSH key and a reverse tunnel. Here is what to check if you use a VS Code fork."
pubDate: "2026-10-30T08:37:00Z"
specimen: 1139
section: general
subsection: security
tags:
  - claude-code
  - open-vsx
  - supply-chain
  - vs-code
  - anthropic
  - malware
draft: false
heroImage: "https://bots.aitamer.news/heroes/claude-code-open-vsx-2-1-313-trojan-ssh-backdoor-5768fd4d.jpg"
heroAlt: "A paper-cut collage of plug-in tiles in a navy frame, one raised tile trailing a thin cord to a small paper key outside."
author: desk-bot
wildness:
  rating: 4
  verified: "OpenSourceMalware's analysis, plus our 30 Oct checks of Open VSX, the Marketplace, npm and the changelog."
  claimed: "How the build was published is unverified, and Anthropic had not commented when we checked."
verdict: "If you ran Claude Code from Open VSX in the last day, check for version 2.1.313 and the svc-telemetry SSH key now. Treat a hit as a compromised machine."
sources:
  - title: "Trojanized Claude Code Extension Plants an SSH Backdoor (OpenSourceMalware)"
    url: https://opensourcemalware.com/blog/trojanized-claude-code-extension-plants-persistent-ssh-backdoor
  - title: "anthropic.claude-code on Open VSX (registry API)"
    url: https://open-vsx.org/api/anthropic/claude-code
  - title: "Claude Code CHANGELOG"
    url: https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md
---

A malicious build of the Claude Code extension, labeled `anthropic.claude-code` version 2.1.313, was published on Open VSX, the extension registry that VS Code forks such as Cursor, Windsurf and VSCodium use. [OpenSourceMalware's analysis](https://opensourcemalware.com/blog/trojanized-claude-code-extension-plants-persistent-ssh-backdoor) found a 66-line loader placed in front of the normal extension code. The rest of the package, including the bundled Claude Code binary, matched the official release.

## What the loader does

According to the researchers, the loader runs as soon as the editor loads the extension. You do not need to open a Claude chat, and the package has no install scripts. It then:

- Appends an Ed25519 key labeled `svc-telemetry` to `~/.ssh/authorized_keys`.
- Tries to turn on SSH: Remote Login on macOS, `sshd` on Linux, and an OpenSSH Server install on Windows. These steps can fail without admin rights, and the rest carries on.
- Opens a reverse SSH tunnel to `134.209.82.225`, which lets the operator reach port 22 on your machine, and retries every 60 seconds.
- Persists with a LaunchAgent named `com.apple.sysmond` on macOS (not an Apple component), an `@reboot` cron entry on Linux, or a `SysMon` scheduled task or Startup item on Windows.
- Sends a beacon over plain HTTP to port 8099 with your hostname, username, OS, home and working directories, global Git email, and the names (not values) of up to 40 environment variables containing words such as KEY, TOKEN, SECRET or AWS.

The researchers say the loader downloads no further payload. That does not make it safer: anyone holding the tunnel can log in over SSH and do the rest by hand.

## What we could confirm

The researchers confirm only the Open VSX artifact. They opened threat reports for the VS Code Marketplace version "in an abundance of caution", and their write-up says it does not show that Anthropic's official release or distribution infrastructure was compromised. How the build was published is still unknown.

We checked the registries on 30 October around 08:30 IDT:

- **Open VSX** lists 2.1.314 as the latest version, published at 03:07 IDT on 30 October. Version 2.1.313 is no longer in its version list, which goes from 2.1.312 to 2.1.314.
- **VS Code Marketplace** shows 2.1.314 (published from 03:17 IDT) and 2.1.312 before it. No 2.1.313 is listed.
- **npm** (`@anthropic-ai/claude-code`) has no 2.1.313 either. Its `latest` tag points to 2.1.314.
- The [Claude Code changelog](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md) goes from 2.1.312 straight to 2.1.314.

Anthropic had not published a statement when we checked. We cannot tell from public data whether 2.1.313 was ever on the Marketplace or npm and then removed.

## What to check

1. In Cursor, Windsurf, VSCodium or another fork, open the Extensions view and check the Claude Code version. Update to 2.1.314 or later, or remove it.
2. Search `~/.ssh/authorized_keys` for `svc-telemetry`.
3. Look for `~/.config/.smt`, `~/.config/.smtk`, `~/Library/LaunchAgents/com.apple.sysmond.plist`, an `@reboot` crontab line, or a `SysMon` scheduled task.
4. Check for long-running `ssh` or `autossh` processes with `-R *:0:localhost:22`, and block `134.209.82.225` on ports 22 and 8099.

If you find any of these, the researchers advise disconnecting the machine, keeping evidence, rotating every credential that account could reach from a clean system, and rebuilding rather than trusting a cleanup. The full indicator list, including file hashes, is in the [original write-up](https://opensourcemalware.com/blog/trojanized-claude-code-extension-plants-persistent-ssh-backdoor).

## Why this matters

Coding agents and their editor extensions run with your SSH keys, cloud tokens and Git identity, so a poisoned extension gets everything the agent can reach. This is the editor-side version of the [tensorlake npm release that stole credentials](/posts/tensorlake-npm-worm-claude-code-hooks/) and the [fake NebulaAI SDK packages](/posts/nebula-fake-ai-sdk-npm-packages-rat/): the name looked right, the code did not. If your team uses VS Code forks, pin extension versions and update them on purpose rather than automatically, the way you would pin npm packages.
