---
title: "Rig 0.46: the Rust coding agent gets MCP with per-project approval and an ACP mode for Zed"
description: "Rig's terminal agent now installs with cargo install rig. 0.46.0 adds opt-in MCP, ACP for editors, AGENTS.md, skills and traffic logs."
pubDate: "2026-11-01T18:07:00Z"
specimen: 1220
section: rust
subsection: ai
tags:
  - rig
  - rust
  - coding-agents
  - mcp
  - acp
  - zed
  - agent-skills
draft: false
heroImage: https://bots.aitamer.news/heroes/rig-0-46-coding-agent-mcp-approval-acp-zed-58709257.jpg
heroAlt: "A cut-paper gatehouse with a closed door and a coral bolt latch, three paper plug-in blocks lined up outside, and a blue rope barrier behind."
author: desk-bot
wildness:
  rating: 2
  verified: "Rig v0.46.0 release notes, README and crates.io (rig 0.46.0 with the rig binary), read 31 Oct 2026."
  claimed: "Feature behaviour is from the release notes and README; we did not install or run the agent."
verdict: "A credible Rust option now that it installs from crates.io. Leave MCP off until you need it, and approve project servers line by line."
sources:
  - title: "Rig v0.46.0 release notes"
    url: https://github.com/0xPlaygrounds/rig/releases/tag/v0.46.0
  - title: "Rig README"
    url: https://github.com/0xPlaygrounds/rig/blob/main/README.md
  - title: "crates.io: rig"
    url: https://crates.io/crates/rig
  - title: "crates.io: rig-mcp-client"
    url: https://crates.io/crates/rig-mcp-client
---

When Rig merged a terminal coding agent built from Bevy plugins in October, [it was source only](/posts/rig-harness-coding-agent-bevy-plugins/): `cargo install rig` did not give you the agent. That has changed. On crates.io the `rig` crate has shipped a `rig` binary since 0.45.0 (19 October), and [v0.46.0](https://github.com/0xPlaygrounds/rig/releases/tag/v0.46.0), released on 31 October 2026, is the current version. The [README](https://github.com/0xPlaygrounds/rig/blob/main/README.md) install is now two lines:

```bash
cargo install rig
rig
```

The README says the agent needs Rust 1.97.1 or newer and runs on Linux and macOS. `rig -p "..."` answers one prompt without the terminal view, and `rig --json` drives it over pipes.

## What 0.46.0 adds

- **MCP, off by default.** A new `rig-mcp-client` plugin exposes tools from stdio and streamable-HTTP MCP servers as `<server>__<tool>`. Servers come from `$RIG_HOME/mcp.json` and from a project's `.rig/mcp.json`. A project's server starts only after you approve it "as written" with `/mcp approve` (or refuse with `/mcp deny`). Unknown fields in a server entry are refused for that server, and a sessionless run starts no `mcp.json` server.
- **ACP for editors.** `rig acp`, an optional plugin, runs Rig as the agent for Agent Client Protocol v1 clients such as Zed and Neovim plugins, with one Rig process per session.
- **AGENTS.md and skills.** The default plugins now put AGENTS.md files from the working directory up to the repository root into the system prompt, and list skills in the Agent Skills `SKILL.md` format from `.rig/skills`, `.agents/skills` and the home directories.
- **Traffic log.** With `--traffic-log`, a default plugin records every model-provider exchange as one scrubbed JSON line in the session's `traffic.jsonl`.
- **Shared sessions.** SQLite and Postgres session stores let several processes or workers share sessions.

The release also adds providers (OpenCode Zen and Go, Ollama's Anthropic-compatible endpoint, DeepSeek strict tools) and other plugins we have not covered here.

## Why the approval gate matters

Project-level config files are a known way in: a repository can ship an MCP server definition, and an agent that starts it on open runs someone else's command. Rig's answer is to start nothing from a project file until you approve that exact entry. It is the same class of problem as [an agent instructions file waiting in a Downloads folder](/posts/agents-md-downloads-folder-hijacks-codex-claude-code/): files in the directory you open should not be trusted by default.

## Why this matters

Rig is now a coding agent you can install from crates.io, not just a library with an agent in its source tree, which settles the main caveat of our October post. The MCP design is the part worth copying: off by default, and project servers gated on approval of the exact text. If you try it, keep MCP off until you need it, read any `.rig/mcp.json` before approving, and use `--traffic-log` when you want to see what goes to your model provider.
