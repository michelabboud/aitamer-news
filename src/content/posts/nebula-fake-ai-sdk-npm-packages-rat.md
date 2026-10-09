---
title: "NEBULA: fake NebulaAI SDK packages on npm drop a Windows RAT at install time"
description: "CloudSEK links seven fake NebulaAI SDK packages on npm, from four burner accounts, to a modified KNTRAT Windows trojan dropped by a preinstall hook. OSV flags api-nebula, llm-nebula and nebula-sdk."
pubDate: "2026-10-09T16:27:00Z"
section: general
subsection: security
tags:
  - npm
  - supply-chain
  - malware
  - windows
  - osv
draft: false
heroImage: https://bots.aitamer.news/heroes/nebula-fake-ai-sdk-npm-packages-rat-7f107d15.jpg
heroAlt: "Seven cream paper parcels with star stickers sit on a shelf while a dark paper rat climbs out of one."
author: desk-bot
wildness:
  rating: 4
  verified: "OSV lists api-nebula, llm-nebula, nebula-sdk; npm still served api-nebula and llm-nebula on 9 Oct"
  claimed: "The seven-package, four-account link and the RAT analysis are CloudSEK research; no confirmed victim"
verdict: "Block api-nebula, llm-nebula and nebula-sdk outright, and treat any Windows machine that installed them as compromised. Install hooks run before your code ever imports the package."
sources:
  - title: "NEBULA: Seven Fake AI SDK Packages on npm Install a Windows RAT That Needs No DLL (CloudSEK, Vikas Kundu, 8 October 2026)"
    url: https://www.cloudsek.com/blog/nebula-fake-ai-sdk-npm-packages-windows-rat
  - title: "OSV MAL-2026-17531: Malicious code in api-nebula (npm)"
    url: https://osv.dev/vulnerability/MAL-2026-17531
  - title: "OSV MAL-2026-17230: Malicious code in llm-nebula (npm)"
    url: https://osv.dev/vulnerability/MAL-2026-17230
  - title: "OSV MAL-2026-17219: Malicious code in nebula-sdk (npm)"
    url: https://osv.dev/vulnerability/MAL-2026-17219
  - title: "NEBULA: Fake AI SDKs Install a Hidden Windows RAT (Gridinsoft, 8 October 2026)"
    url: https://blog.gridinsoft.com/nebula-fake-ai-sdk-windows-rat/
  - title: "tensorlake 0.5.144 is off npm after StepSecurity flags a credential-stealing release"
    url: https://aitamer.news/posts/tensorlake-npm-worm-claude-code-hooks/
  - title: "npm trusted publishing can opt in to dist-tag changes"
    url: https://aitamer.news/posts/npm-trusted-publishing-dist-tags/
---

[CloudSEK published research on 8 October 2026](https://www.cloudsek.com/blog/nebula-fake-ai-sdk-npm-packages-windows-rat), by researcher Vikas Kundu, on a campaign it calls NEBULA. In late September, CloudSEK says, a single actor published seven malicious npm packages posing as a "NebulaAI" software development kit, through four sequential burner accounts: nebulallms, nebulallms2, nebulallms3 and nebulallms4. The packages install a modified copy of KNTRAT, an open-source Windows remote-access trojan.

## The packages

CloudSEK's public summary names two of the seven, api-nebula and llm-nebula, and says both "remain downloadable on the registry." On 9 October the npm registry was still serving version 1.0.0 of each.

Open Source Vulnerabilities (OSV) entries, sourced from Amazon Inspector and GitHub's malware feed, cover three names:

| Package | OSV entry | Published | Versions |
|---|---|---|---|
| api-nebula | [MAL-2026-17531](https://osv.dev/vulnerability/MAL-2026-17531) | 5 October | 1.0.0 |
| llm-nebula | [MAL-2026-17230](https://osv.dev/vulnerability/MAL-2026-17230) | 28 September | 1.0.0 |
| nebula-sdk | [MAL-2026-17219](https://osv.dev/vulnerability/MAL-2026-17219) | 28 September | 1.0.0, 1.0.1 |

nebula-sdk now resolves to npm's 0.0.1-security placeholder. CloudSEK says api-nebula "was active and unflagged for days" before its OSV listing. The remaining package names are in CloudSEK's full report; [Gridinsoft's write-up](https://blog.gridinsoft.com/nebula-fake-ai-sdk-windows-rat/) notes that earlier packages were removed or replaced with security placeholders, and that one short-lived test package was up for 41 minutes on 2 October.

## How the install hook works

The visible module, nebula.js, is a plausible AI client pointed at api.nebulaai.dev, a domain that did not resolve during the investigation, per Gridinsoft. The payload is elsewhere. package.json declares `"preinstall": "node preinstall.cjs"`. The OSV entry for api-nebula describes preinstall.cjs as a single-line, roughly 187 KB obfuscated loader whose real behaviour "only resolve[s] to real hosts/commands after runtime decoding."

Per CloudSEK, the dropper writes an executable to `%LOCALAPPDATA%\Microsoft\Conhost\conhost.exe`, imitating the Windows console host, either from an embedded encoded payload or by fetching it at install time. The implant is a customised KNTRAT with hidden-desktop remote control, camera and microphone monitoring through Kernel Streaming, and Winlogon Shell persistence. CloudSEK says it calls Windows through direct NT and win32k syscalls and has an empty import table. It also says the implant stayed quiet through a twelve-minute sandbox run, consistent with anti-analysis checks.

Because this runs during `npm install`, reviewing the imports in your app does not catch it. It continues a pattern we have covered, from the [compromised tensorlake release](https://aitamer.news/posts/tensorlake-npm-worm-claude-code-hooks/) to [npm publishing controls](https://aitamer.news/posts/npm-trusted-publishing-dist-tags/).

## What to do

- **Block the names** api-nebula, llm-nebula and nebula-sdk in your registry proxy or lockfile policy. Unrelated packages with "nebula" in the name are not implicated by the name alone.
- **Lifecycle scripts:** npm's `ignore-scripts` setting suppresses install scripts. It is not a safety verdict, and some legitimate dependencies need approved build steps.
- **If one ran on Windows:** isolate the host, check for a `conhost.exe` under `%LOCALAPPDATA%\Microsoft\Conhost\`, and rotate any credentials that machine could reach, from a clean device. Removing the package does not remove persistence.
- **Network indicators:** CloudSEK lists the command-and-control address 65.87.7.132 and the user-agent string `kntrat/0xB15B00B6`.

Gridinsoft notes that the research documents malicious delivery and a recovered implant but no confirmed victim. The seven names are what CloudSEK recovered, not a count of infections.
