---
title: "A trojanized Claude Code 2.1.313 in Cursor's marketplace planted an SSH backdoor"
description: "Cursor's extension marketplace served a malicious Claude Code 2.1.313 that added an attacker SSH key and reverse tunnel. What Cursor users should check."
pubDate: "2026-10-30T08:37:00Z"
specimen: 1139
section: general
subsection: security
tags:
  - claude-code
  - cursor
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
  verified: "Cursor's notice, OpenSourceMalware's corrected analysis, and our 30 Oct registry and changelog checks."
  claimed: "How the build got into Cursor's marketplace is unexplained, and Anthropic had not commented when we checked."
verdict: "If you use Claude Code in Cursor and installed or updated it on 29 October, check for version 2.1.313 and the svc-telemetry SSH key now. Treat a hit as a compromised machine."
corrections:
  - date: "2026-10-30T11:56:00Z"
    text: "An earlier version of this story said the malicious Claude Code 2.1.313 was published on Open VSX. OpenSourceMalware has since corrected its report after Cursor said the compromise was in the Cursor Marketplace. The Open VSX, npm and Microsoft VS Code Marketplace builds were not affected. We have changed the headline, summary and advice to match."
sources:
  - title: "Trojanized Claude Code Extension Plants an SSH Backdoor (OpenSourceMalware)"
    url: https://opensourcemalware.com/blog/trojanized-claude-code-extension-plants-persistent-ssh-backdoor
  - title: "Security notice: malicious Anthropic.claude-code 2.1.313 in the Cursor Extension Marketplace (Cursor)"
    url: https://cursor.com/blog/claude-code-extension-security-notice
  - title: "Trojanized Claude Code Extension 2.1.313 in Cursor Marketplace Plants SSH Backdoor (Rescana)"
    url: https://www.rescana.com/post/claude-code-extension-2-1-313-cursor-marketplace-trojanized-ssh-backdoor
  - title: "anthropic.claude-code on Open VSX (registry API)"
    url: https://open-vsx.org/api/anthropic/claude-code
  - title: "Claude Code CHANGELOG"
    url: https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md
  - title: "Hacker News: Felix Rieseberg (Anthropic) on the Cursor marketplace incident"
    url: https://news.ycombinator.com/item?id=50304129
  - title: "Connor Jones, Anthropic: That Claude Code extension compromise... couldn't be us (The Register, 30 October 2026)"
    url: https://www.theregister.com/cyber-crime/2026/10/30/anthropic-that-claude-code-extension-compromise-couldnt-be-us/5306682
---

A malicious build of the Claude Code extension, labeled `anthropic.claude-code` version 2.1.313, was served by Cursor's own VS Code extension marketplace on 29 October, according to [Cursor's security notice](https://cursor.com/blog/claude-code-extension-security-notice) and the corrected [OpenSourceMalware analysis](https://opensourcemalware.com/blog/trojanized-claude-code-extension-plants-persistent-ssh-backdoor). Cursor says the build was not developed by Anthropic and that at most 5,000 of its users were affected. OpenSourceMalware now says the Claude Code builds on Open VSX, npm and Microsoft's VS Code Marketplace are not malicious. Its analysis found a 66-line loader placed in front of the normal extension code. The rest of the package, including the bundled Claude Code binary, matched the official release.

## What the loader does

According to the researchers, the loader runs as soon as the editor loads the extension. You do not need to open a Claude chat, and the package has no install scripts. It then:

- Appends an Ed25519 key labeled `svc-telemetry` to `~/.ssh/authorized_keys`.
- Tries to turn on SSH: Remote Login on macOS, `sshd` on Linux, and an OpenSSH Server install on Windows. These steps can fail without admin rights, and the rest carries on.
- Opens a reverse SSH tunnel to `134.209.82.225`, which lets the operator reach port 22 on your machine, and retries every 60 seconds.
- Persists with a LaunchAgent named `com.apple.sysmond` on macOS (not an Apple component), an `@reboot` cron entry on Linux, or a `SysMon` scheduled task or Startup item on Windows.
- Sends a beacon over plain HTTP to port 8099 with your hostname, username, OS, home and working directories, global Git email, and the names (not values) of up to 40 environment variables containing words such as KEY, TOKEN, SECRET or AWS.

The researchers say the loader downloads no further payload. That does not make it safer: anyone holding the tunnel can log in over SSH and do the rest by hand.

## What we could confirm

OpenSourceMalware first attributed the build to Open VSX, and so did the first version of this story. Its updated post says Cursor told it that the Claude Code extension "in the Cursor Marketplace experienced some form of compromise", and it now lists the npm package, the Open VSX extension and the Microsoft VS Code extension as not malicious. Its write-up also says the artifact does not show that Anthropic's official release or distribution infrastructure was compromised. How the package got into Cursor's marketplace has not been explained.

We checked the public registries on 30 October around 08:30 Israel time, and rechecked Open VSX around 13:55:

- **Open VSX** lists 2.1.314 as the latest version, published at 03:07 Israel time on 30 October. Version 2.1.313 is not in its version list, which goes from 2.1.312 to 2.1.314.
- **VS Code Marketplace** shows 2.1.314 (published from 03:17 Israel time) and 2.1.312 before it. No 2.1.313 is listed.
- **npm** (`@anthropic-ai/claude-code`) has no 2.1.313 either. Its `latest` tag points to 2.1.314.
- The [Claude Code changelog](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md) goes from 2.1.312 straight to 2.1.314.

[Rescana](https://www.rescana.com/post/claude-code-extension-2-1-313-cursor-marketplace-trojanized-ssh-backdoor) found the same: no 2.1.313 on Open VSX, npm or the Microsoft Marketplace. Anthropic had not published a statement when we checked.

## What to check

1. In Cursor, open the Extensions view and check the Claude Code version. If you installed or updated to 2.1.313 from Cursor's marketplace between about 11:27 and 22:35 Israel time on 29 October, follow the steps below even if you have since updated to 2.1.314. Users of VS Code, VSCodium, Windsurf and other editors that install from Open VSX or Microsoft's Marketplace were not served this build, according to OpenSourceMalware's corrected report.
2. Search `~/.ssh/authorized_keys` for `svc-telemetry`.
3. Look for `~/.config/.smt`, `~/.config/.smtk`, `~/Library/LaunchAgents/com.apple.sysmond.plist`, an `@reboot` crontab line, or a `SysMon` scheduled task.
4. Check for long-running `ssh` or `autossh` processes with `-R *:0:localhost:22`, and block `134.209.82.225` on ports 22 and 8099.

If you find any of these, the researchers advise disconnecting the machine, keeping evidence, rotating every credential that account could reach from a clean system, and rebuilding rather than trusting a cleanup. The full indicator list, including file hashes, is in the [original write-up](https://opensourcemalware.com/blog/trojanized-claude-code-extension-plants-persistent-ssh-backdoor).

## Why this matters

Coding agents and their editor extensions run with your SSH keys, cloud tokens and Git identity, so a poisoned extension gets everything the agent can reach. This is the editor-side version of the [tensorlake npm release that stole credentials](/posts/tensorlake-npm-worm-claude-code-hooks/) and the [fake NebulaAI SDK packages](/posts/nebula-fake-ai-sdk-npm-packages-rat/): the name looked right, the code did not. This one came through an editor maker's own marketplace, not the publisher or the main registries. If your team uses Cursor or another VS Code fork, know which marketplace each editor installs from, pin extension versions and update them on purpose rather than automatically, the way you would pin npm packages.

## Update, 30 October 2026: Cursor confirms its marketplace served the build

Cursor published a [security notice](https://cursor.com/blog/claude-code-extension-security-notice) saying the malicious `Anthropic.claude-code` 2.1.313 was available in the Cursor VS Code extension marketplace between about 2:27am and 1:35pm Pacific time on 29 October (11:27 to 22:35 Israel time). It says at most 5,000 users were affected and that it will contact them directly, and that the build was not developed by Anthropic. Disclosure: Cursor [describes itself](https://x.com/cursor_ai/status/2116074289053175808) as a SpaceXSI product, as is Grok Bot, which helps produce this site.

What Cursor adds to the researchers' account:

- **The tunnel mostly failed.** Turning on the local SSH service needs admin rights, which the extension does not have on most macOS and Windows machines, so on those hosts the attacker could not log in through the tunnel. The extension still added the attacker's key, installed persistence and sent host details, so Cursor says to clean up regardless.
- **The attacker's server is down.** Cursor says it worked with the hosting provider to take it offline, so the tunnel and the host-details POST no longer work.
- **The marketplace was rebuilt.** Cursor removed the build, shut the whole marketplace down, rotated its keys, rebuilt it and brought it back online. It says an audit found no other tampered extensions and no evidence that other versions or the official distribution were affected.
- **Uninstalling is not enough.** The payload drops standalone persistence scripts that keep running. Cursor's notice has a one-line check for the `svc-telemetry` key and remediation scripts for macOS and Windows, plus file hashes and the attacker key fingerprint.

Cursor's advice if you installed or updated to 2.1.313 from its marketplace in that window: run the check, isolate any host that shows the payload ran, remove the key, persistence and tunnel processes with the scripts, consider rebuilding, and rotate credentials and sessions from a trusted machine. It notes that the limited environment-variable collection "does not rule out later credential access over the backdoor."

## Update, 30 October 2026: Anthropic says its own systems were not involved

Anthropic has responded to suggestions that the tampered build came from a breach on its side. Felix Rieseberg, a member of Anthropic's technical staff, [wrote](https://news.ycombinator.com/item?id=50304129) that "it wasn't a compromise of Anthropic's systems or employee laptops," that "a malicious actor used access to Cursor's marketplace to publish a tampered copy of the Claude Code extension, which we didn't build or publish," and that versions on Anthropic's official channels are not affected. In the same thread another Anthropic engineer said 2.1.313 was never published on Open VSX, the Microsoft VS Code Marketplace or any Anthropic host, and that Anthropic numbered its next real release 2.1.314 so the two could not be confused.

As [The Register notes](https://www.theregister.com/cyber-crime/2026/10/30/anthropic-that-claude-code-extension-compromise-couldnt-be-us/5306682), neither company has said how the tampered build reached Cursor's marketplace. The checks above are unchanged: they apply to anyone who installed 2.1.313 from Cursor's marketplace in the 29 October window, and not to users of other editors.
