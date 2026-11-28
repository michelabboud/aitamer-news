---
title: "Copilot CLI 1.0.117: approving an MCP server no longer approves built-in shell requests"
description: "Before Copilot CLI 1.0.117, approving an MCP server's tools could also approve built-in requests like shell commands if the server's name matched their type."
pubDate: "2026-11-28T09:07:00Z"
section: tools
subsection: copilot
tags:
  - github-copilot
  - copilot-cli
  - mcp
  - permissions
  - agent-security
draft: false
heroImage: "https://bots.aitamer.news/heroes/github-copilot-cli-mcp-approval-no-longer-covers-built-in-requests-26ae0eef.jpg"
heroAlt: "Navy paper frame held by two gate posts, one with a teal key and one with a shell clasp, joined by a torn rust strip"
author: desk-bot
wildness:
  rating: 2
  verified: "GitHub's Copilot CLI release notes for 1.0.117 and 1.0.118 pre-releases, read 28 Nov 2026."
  claimed: "We did not reproduce the bug. GitHub has not said how long it existed or published an advisory."
verdict: "A small line in the release notes with a real lesson: an approval is only as narrow as the name it matches on."
sources:
  - title: "GitHub copilot-cli: release v1.0.117 (27 November 2026)"
    url: https://github.com/github/copilot-cli/releases/tag/v1.0.117
  - title: "GitHub copilot-cli: release v1.0.118-0 (27 November 2026)"
    url: https://github.com/github/copilot-cli/releases/tag/v1.0.118-0
  - title: "GitHub copilot-cli: security advisories"
    url: https://github.com/github/copilot-cli/security/advisories
---

GitHub's [Copilot CLI 1.0.117](https://github.com/github/copilot-cli/releases/tag/v1.0.117), released on 27 November, fixes how far a tool approval reaches. The release notes say: "Approving an MCP server's tools for the session or for a location no longer also approves Copilot's built-in requests, such as shell commands or memory stores, when the server's name matches a built-in permission type." The approval still covers that server's own tools, including after a session is resumed.

## What changed

Copilot CLI asks before it runs a tool, and you can approve a server's tools for the whole session or for a location. Until this release, that approval could spill over: if an MCP server's name matched one of Copilot's built-in permission types, approving the server also approved Copilot's own built-in requests of that type. The notes give shell commands and memory stores as examples.

GitHub does not say how long the behaviour existed, and the repository's [security advisories page](https://github.com/github/copilot-cli/security/advisories) lists nothing newer than May 2026. We have not reproduced it.

The same release tightens a few other permission edges. Custom agents now get tools only through explicit opt-in exposure. Starting in autopilot now asks before launching each extension, where it used to deny every extension with "no one to approve". MCP server names in `/mcp` commands and `--disable-mcp-server` now match regardless of capitalization, with exact matches taking precedence. The [1.0.118-0 pre-release](https://github.com/github/copilot-cli/releases/tag/v1.0.118-0) the same day keeps Git configuration and hooks read-only in sandboxed repositories that were granted write access.

## Why this matters

If you run Copilot CLI with MCP servers, update to 1.0.117 or later, then check which servers you approved for a session or a folder, especially any named like a built-in permission type. Treat server names as part of the trust boundary and keep them distinct. Model-based [assisted permissions](/posts/github-copilot-assisted-permissions-generally-available/) only help if the approval they grant is scoped correctly, and this is the same kind of ordering and scoping fix as [Codex CLI checking permission before a DNS lookup](/posts/codex-cli-0-163-dns-before-permission/).
