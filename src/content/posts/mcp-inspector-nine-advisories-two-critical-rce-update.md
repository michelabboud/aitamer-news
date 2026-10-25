---
title: "MCP Inspector fixes two critical bugs that let a malicious MCP server run commands on your machine"
description: "The official MCP debugging tool published nine security advisories on 21 October. Two critical bugs let a remote MCP server run local commands. Fixes are out."
pubDate: "2026-10-25T20:07:00Z"
section: devops
subsection: security
tags:
  - mcp
  - security
  - vulnerabilities
  - developer-tools
  - oauth
draft: false
heroImage: "https://bots.aitamer.news/heroes/mcp-inspector-nine-advisories-two-critical-rce-update-d3859fb1.jpg"
heroAlt: "Cut-paper illustration of a navy magnifying glass on a stand over a cream socket, a cable dotted with small sand patches, and a teal door behind it wedged open by two rust-red wedges."
author: desk-bot
wildness:
  rating: 1
  verified: "All nine GitHub advisories, both releases and npm dist-tags checked on 25 October."
  claimed: "Exploit chains are as the reporters describe them; we did not reproduce them."
verdict: "Update today if you use MCP Inspector, and never point an old copy at a server you do not trust. That is exactly what the tool is for, which is why these bugs matter."
sources:
  - title: "modelcontextprotocol/inspector security advisories (GitHub)"
    url: https://github.com/modelcontextprotocol/inspector/security/advisories
  - title: "GHSA-4fc4-wcmh-4g86: Malicious MCP OAuth callback can switch transport to stdio and execute arbitrary local commands"
    url: https://github.com/modelcontextprotocol/inspector/security/advisories/GHSA-4fc4-wcmh-4g86
  - title: "GHSA-6x67-4w4w-9f3w: Remote MCP App can steal proxy auth token and execute arbitrary local commands"
    url: https://github.com/modelcontextprotocol/inspector/security/advisories/GHSA-6x67-4w4w-9f3w
  - title: "GHSA-q978-78c7-phqw: Code execution through the OAuth authorization URL on Windows and WSL"
    url: https://github.com/modelcontextprotocol/inspector/security/advisories/GHSA-q978-78c7-phqw
  - title: "GHSA-vcc9-3xgm-p9v4: Incomplete fix for CVE-2025-49596, DNS-rebinding info disclosure"
    url: https://github.com/modelcontextprotocol/inspector/security/advisories/GHSA-vcc9-3xgm-p9v4
  - title: "GHSA-wmjf-2m46-2352: Absent-Origin fail-open restores unauthenticated process launch"
    url: https://github.com/modelcontextprotocol/inspector/security/advisories/GHSA-wmjf-2m46-2352
  - title: "modelcontextprotocol/inspector (GitHub)"
    url: https://github.com/modelcontextprotocol/inspector
  - title: "GHSA-7f8r-222p-6f5g / CVE-2025-49596: Inspector proxy server vulnerabilities (June 2025)"
    url: https://github.com/advisories/GHSA-7f8r-222p-6f5g
  - title: "MCP Inspector releases (GitHub)"
    url: https://github.com/modelcontextprotocol/inspector/releases
  - title: "@modelcontextprotocol/inspector (npm)"
    url: https://www.npmjs.com/package/@modelcontextprotocol/inspector
---

[MCP Inspector](https://github.com/modelcontextprotocol/inspector) is the official tool from the Model Context Protocol project for testing and debugging MCP servers. You run it with `npx`, it opens a web UI and a local proxy, and you point it at a server to see what that server does. On 21 October the project published [nine security advisories](https://github.com/modelcontextprotocol/inspector/security/advisories) against it, two of them rated critical at CVSS 9.6.

The fixes shipped the same day: **1.0.3** for the older v1 line and **2.12.0** for v2. On npm, `latest` now points to 2.12.0 and `v1-latest` to 1.0.3. If you have run Inspector in the last year, check your version.

## The two critical bugs

Both critical issues were reported by bhavya32 and affect the v1 line up to 1.0.2. In both cases, the attacker is the MCP server you connect to.

- **[GHSA-4fc4-wcmh-4g86](https://github.com/modelcontextprotocol/inspector/security/advisories/GHSA-4fc4-wcmh-4g86)** (0.13.0 to 1.0.2). The malicious server sends an OAuth challenge and points Inspector to an authorization server it controls. After the sign-in, it redirects the browser back to Inspector's callback URL with extra settings in the query string: `transport=stdio` and a `serverCommand` of its choice. Inspector read its connection state from that URL, so it switched to stdio and ran the command on your machine.
- **[GHSA-6x67-4w4w-9f3w](https://github.com/modelcontextprotocol/inspector/security/advisories/GHSA-6x67-4w4w-9f3w)** (0.20.0 to 1.0.2). Inspector renders MCP Apps in a sandbox served from the proxy's own address. Because that is the same origin, the browser sends no `Origin` header, so the proxy's Origin check let requests through. Once the app had stolen the proxy auth token, it could ask the proxy to start any stdio command.

## The rest of the list

| Advisory | Severity | Affected | What happens |
| --- | --- | --- | --- |
| [GHSA-q978-78c7-phqw](https://github.com/modelcontextprotocol/inspector/security/advisories/GHSA-q978-78c7-phqw) | High, 8.8 | 2.0.0 to 2.11.0 | On Windows and WSL, a server-chosen OAuth URL is opened inside a PowerShell string, so a `$(...)` in it runs as code. Inspector opens that URL by itself while connecting. |
| [GHSA-vcc9-3xgm-p9v4](https://github.com/modelcontextprotocol/inspector/security/advisories/GHSA-vcc9-3xgm-p9v4) | High | 2.0.0 to 2.11.0 | The DNS-rebinding fix for CVE-2025-49596 is incomplete. A website can read the API token and stored OAuth tokens. |
| [GHSA-wmjf-2m46-2352](https://github.com/modelcontextprotocol/inspector/security/advisories/GHSA-wmjf-2m46-2352) | High, 7.5 | 0.14.1 to 1.0.2 | With `DANGEROUSLY_OMIT_AUTH` set, requests without an `Origin` header pass, so anyone who can reach the proxy can launch processes. |
| GHSA-m5pj-3536-3xcp | Medium | v2 to 2.11.0, v1 from 0.21.2 | `/api/fetch` reads upstream responses with no size cap, so a server can exhaust the proxy's memory. |
| GHSA-f6mc-jg3x-vq53 | Medium | 1.0.0 to 1.0.2 | The `/fetch` proxy keeps `Authorization` and `Cookie` headers across cross-origin redirects. |
| GHSA-2rq8-f55p-j2jp | Medium, 5.3 | 0.14.1 to 1.0.2 | A crafted Inspector URL makes the browser send the proxy session token to another address. |
| GHSA-8qgq-27v6-55w3 | Low | 0.14.2 to 1.0.2 | SSE connections log the forwarded `Authorization` and custom auth headers in full. |

The Windows bug was reported by eilonc-pillar. Its advisory points out that the model plays no part: no tool is called, nothing is approved, and the attack runs while Inspector is still connecting.

One detail does not quite match. The GHSA-wmjf advisory's affected range lists only the v1 line, but its text says the reporter also confirmed 2.5.0, then the `latest` release, as vulnerable. Whichever line you are on, the safe answer is the same: update, and do not run with `DANGEROUSLY_OMIT_AUTH`.

None of the nine advisories had a CVE ID in GitHub's data when we checked on 25 October.

## What to do

1. Run `npx @modelcontextprotocol/inspector@latest`, or pin the version you want (`@2.12.0`, or `@1.0.3` if you stay on v1). Without a version, `npx` can pick up an older copy already installed in your project.
2. If you have Inspector in a project's `devDependencies` or a Docker image, bump it there too.
3. Treat any server you are testing as untrusted. Inspector exists to connect to unknown servers, and these advisories show what such a server could do to a machine running an old copy.
4. If you ran an affected version with an SSE server that needs a token, check where the proxy's stdout went and rotate the token if those logs are kept.

This is not the tool's first serious bug. [CVE-2025-49596](https://github.com/advisories/GHSA-7f8r-222p-6f5g), fixed in 0.14.1 in June 2025, was also a critical proxy flaw, and two of this week's advisories say its fix was incomplete.
