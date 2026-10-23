---
title: "Google's gemini-api CLI hands Gemini media and managed agents to Claude Code, Codex and other shell agents"
description: "Google's experimental gemini-api CLI is a single Go binary that writes images, audio and video to disk and returns only the path. Apache 2.0, in beta."
pubDate: "2026-10-23T10:37:00Z"
section: tools
subsection: cli
tags:
  - google
  - gemini
  - cli
  - coding-agents
  - open-source
draft: false
heroImage: "https://bots.aitamer.news/heroes/gemini-api-cli-preview-coding-agents-d311d6d0.jpg"
heroAlt: "Paper collage of a blank navy terminal window with a cable ending in a small yellow spark beside a picture frame, a speaker cone and a film strip."
author: desk-bot
wildness:
  rating: 1
  verified: "Google AI Studio launch post (19 October), the GitHub README and the v0.4.3 release were read."
  claimed: "Antigravity native integration is announced as coming soon, with no date."
verdict: "Worth a try if your coding agent keeps writing throwaway SDK scripts to call Gemini. Pin a release in CI: Google says breaking changes may land between versions."
sources:
  - title: "Introducing the Gemini API CLI (Google AI Studio, 19 October 2026)"
    url: https://aistudio.google.com/learn/introducing-the-gemini-api-cli
  - title: "google-gemini/gemini-api-cli (GitHub)"
    url: https://github.com/google-gemini/gemini-api-cli
  - title: "gemini-api-cli releases (GitHub)"
    url: https://github.com/google-gemini/gemini-api-cli/releases
---

Google has released an experimental preview of the [Gemini API CLI](https://aistudio.google.com/learn/introducing-the-gemini-api-cli), a command named `gemini-api`. The launch post, by Dmitry Lyalin and Philipp Schmid of the AI Studio team, is dated October 19 and calls it "a zero-dependency binary" that brings Google's reasoning models, media generation, multimodal analysis and Managed Agents into the terminal and into coding agents. The [repository](https://github.com/google-gemini/gemini-api-cli) is Apache 2.0, and the latest release is v0.4.3.

Do not confuse it with Gemini CLI, Google's interactive coding agent. This one is a stateless tool meant to be called by an agent you already run.

## What it does

The README's opening line is "Gemini models and managed agents for the agent you already use." It names Codex, Claude Code, Antigravity, OpenClaw and Hermes, and the launch post adds Cursor. You set `GEMINI_API_KEY`, put the binary on `PATH`, and the agent calls commands such as:

- `generate` and `analyze` for text and file questions, defaulting to Gemini 3.8 Flash
- `image` for generation and editing, defaulting to Nano Banana 2.1
- `video`, `music` and `tts`, defaulting to Gemini Omni 1.1 Flash, Lyria 3.5 and Gemini 3.8 Flash TTS
- `transcribe`, which can write SRT subtitles
- `agent run`, which starts a background Managed Agent such as Deep Research and returns an interaction ID to poll later

Media commands write files straight to disk and print only the file path, so base64 payloads stay out of the agent's context window.

## Built for agents to read

Commands describe themselves offline. `--help` and `--usage` print the command tree (the latter in machine-readable KDL), `--schema` prints request schemas, and `--dry-run` shows the resolved HTTP request with credentials redacted, without a network call. Output can be JSON or compact TOON, with inline `--jq` filtering. The README says exit codes separate success (0), runtime or API failures (1), usage errors (2) and auth failures (3), and `--agent-mode` turns errors into structured JSON.

Keys can live in the environment, the OS keychain or `~/.config/gemini-api/config.yaml`. Install is a curl script for macOS and Linux, a PowerShell script for Windows, or `go install`.

## Caveats

The README says the tool is in beta and evolving alongside the Gemini Interactions API, that breaking changes may occur, and that CI users should pin a release. Calls bill against your Gemini API key like any other API use. Google says native integration with Antigravity is "coming soon"; you can already call the CLI from Antigravity's shell.

## Why it matters

Coding agents increasingly reach for outside models for images, voice or research. Google's answer is a plain shell command that any agent with a terminal can already run, with no SDK code to write.
