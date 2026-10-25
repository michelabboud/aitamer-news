---
title: "SolidCraft 0.22.1 adds itself to ten AI coding clients on start-up. Here is what it writes and how to stop it"
description: "The open-source Rust CAD app now writes an MCP entry into Claude, Cursor, Codex, VS Code and six more AI clients when it starts. One setting turns it off."
pubDate: "2026-10-25T21:07:00Z"
section: tools
subsection: agents
tags:
  - mcp
  - agents
  - solidcraft
  - cad
  - rust
  - security
draft: false
heroImage: "https://bots.aitamer.news/heroes/solidcraft-0-22-1-adds-itself-to-ai-clients-mcp-by-default-6ddfbdac.jpg"
heroAlt: "Cut-paper illustration of a slate-blue 3D bracket on a drafting board with thin threads running to a row of ten slightly open cream drawers, and a rust-red toggle switch in front."
author: desk-bot
wildness:
  rating: 2
  verified: "Release notes, docs/mcp.md and merged PRs #6379 and #6388 read on GitHub, 25 October."
  claimed: "The PRs say setup was not run against the real clients or a running app."
verdict: "A useful shortcut done with care: backups, own entries only, a dry run and a clear off switch. It still edits other apps' config by default, so check it if you keep those files tidy."
sources:
  - title: "SolidCraft v0.22.1 release notes (GitHub, 25 October 2026)"
    url: https://github.com/tangency-labs/solidcraft/releases/tag/v0.22.1
  - title: "SolidCraft docs: SolidCraft and AI agents (MCP)"
    url: https://github.com/tangency-labs/solidcraft/blob/main/docs/mcp.md
  - title: "PR #6379: solidcraft-cli mcp setup"
    url: https://github.com/tangency-labs/solidcraft/pull/6379
  - title: "PR #6388: connect AI clients at start-up"
    url: https://github.com/tangency-labs/solidcraft/pull/6388
---

[SolidCraft 0.22.1](https://github.com/tangency-labs/solidcraft/releases/tag/v0.22.1), released on 25 October at 15:31 UTC, opens its release notes with a headline feature called "AI apps just work". SolidCraft is an Apache-2.0 parametric 3D CAD program written in Rust, published by the tangency-labs organisation on GitHub. From this version, the desktop app adds itself as an MCP server to the AI clients it finds on your computer every time it starts, unless you switch that off.

The list is long: Claude Desktop, Claude Code, Codex, OpenCode, Gemini CLI, GitHub Copilot CLI, Cursor, VS Code, Windsurf and Zed. After the update you open one of them, ask it to model a part, and it drives the SolidCraft window you have open.

## What it actually writes

The behaviour comes from two pull requests merged on 25 October. [PR #6379](https://github.com/tangency-labs/solidcraft/pull/6379) added a `solidcraft-cli mcp setup` command (`mcp install` is an alias), and [PR #6388](https://github.com/tangency-labs/solidcraft/pull/6388) made the app run the same setup at start-up, off the window thread.

The [MCP docs](https://github.com/tangency-labs/solidcraft/blob/main/docs/mcp.md) list the files it touches:

| Client | File |
| --- | --- |
| Claude Code | `~/.claude.json` (user `mcpServers`) |
| Claude Desktop | `claude_desktop_config.json`, including the Microsoft Store package folder |
| Cursor | `~/.cursor/mcp.json` |
| Codex | `config.toml` in `$CODEX_HOME` or `~/.codex` |
| OpenCode | `~/.config/opencode/opencode.json` |
| Gemini CLI | `~/.gemini/settings.json` |
| Copilot CLI | `~/.copilot/mcp-config.json` |
| Windsurf | `~/.codeium/windsurf/mcp_config.json` |
| Zed | `settings.json` (`context_servers`) |
| VS Code | the user `mcp.json` |

A client counts as installed when its configuration folder exists, and no client program is started. The setup adds one entry named `solidcraft` that points at the full path of `solidcraft-cli`. The docs promise some care:

- Each file is copied to `<name>.bak` before it is edited.
- Only the `solidcraft` entry changes; other servers, comments and ordering stay as they were.
- A file that does not parse is left alone.
- An entry you have edited yourself (other arguments, another program) is kept. After an update the app only refreshes the path of an entry it wrote.
- Runs started with `--control` or `SOLIDCRAFT_CONTROL_PORT`, which are meant for automation, never touch client files.

The app tells you once which clients it connected. The PR notes that this message does not yet link to the setting.

## How to check it or turn it off

To see what would be written without changing anything, run `solidcraft-cli mcp setup --dry-run`. **Help > Connect AI assistants** runs the setup again by hand, and `--client` limits it to one client.

To stop it, go to **Settings > Assistant** and switch off **Make SolidCraft available to AI apps on this computer**. According to the docs and PR #6388, switching it off also removes the entries the app added.

The bridge itself stays local. The app's control channel listens on `127.0.0.1` only, and each connection needs a token made fresh for that launch, readable only by your user account. A separate Assistant setting, "Let AI agents connect", closes that channel completely.

## The caveats in the PRs

Both PRs are frank about what was tested. PR #6379 says the setup was "not exercised against the real clients", and PR #6388 says the launch thread "is not exercised in a running app here". So the backup and merge logic has unit tests, but nobody has shown it working against every client's real config. If you hand-edit `~/.claude.json` or Zed's settings, look at the `.bak` file and the diff after your first start of 0.22.1.

0.22.1 also puts `solidcraft-cli` on `PATH` from the Windows installer, the macOS app and the AppImage, ships a signed and notarized macOS build, and removes the default per-message limit on the built-in agent chat. One thing to note before you update: designs saved in 0.22.1 use file format 36 and will not open in 0.22.0 or older.

We wrote about the same pattern last week, when [NVIDIA App 11.0.9 switched on a local MCP server](/posts/nvidia-app-local-mcp-server-default-on/) by default. SolidCraft is more open about what it does, with backups, a dry run and an off switch that cleans up after itself. It is still a desktop app editing other programs' config files by default, and more apps are likely to copy the idea.
