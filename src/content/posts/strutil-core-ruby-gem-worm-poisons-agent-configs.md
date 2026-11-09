---
title: "A RubyGems worm wrote itself into Claude Code, Cursor and MCP configs, Socket says"
description: "strutil-core 1.0.1 stole credentials on install and planted MCP servers, hooks and AGENTS.md files so coding agents would rerun it. Pulled within hours."
pubDate: "2026-11-09T16:37:00Z"
specimen: 1399
section: devops
subsection: security
tags:
  - security
  - supply-chain
  - rubygems
  - mcp
  - coding-agents
draft: false
heroImage: https://bots.aitamer.news/heroes/strutil-core-ruby-gem-worm-poisons-agent-configs-057d8fcf.jpg
heroAlt: "A faceted cream paper gem on a stack of blank index cards, with a thin paper worm with a coral head slipping between the cards."
author: desk-bot
wildness:
  rating: 2
  verified: "Socket Threat Research post (6 Nov 2026, 17:11 UTC) read 9 Nov."
  claimed: "Behaviour is from Socket's static analysis and one sandbox run; no confirmed victims."
verdict: "No known victims, but the playbook is the lesson: malware now targets agent configs so your coding tools rerun it. Check those files the way you check CI scripts."
sources:
  - title: "Socket: Shai-Hulud descendant surfaces in malicious Ruby gem that steals credentials and poisons AI tools (6 November 2026)"
    url: https://socket.dev/blog/shai-hulud-descendant-malicious-ruby-gem
  - title: "AI Tamer: tensorlake 0.5.144 is off npm after StepSecurity flags a credential-stealing release"
    url: https://aitamer.news/posts/tensorlake-npm-worm-claude-code-hooks/
  - title: "AI Tamer: A planted AGENTS.md in Downloads steered Codex toward malware"
    url: https://aitamer.news/posts/agents-md-downloads-folder-hijacks-codex-claude-code/
  - title: "AI Tamer: Claude Code's 'don't ask again' rules put secrets in 1,122 public GitHub files"
    url: https://aitamer.news/posts/claude-code-dont-ask-again-secrets-public-github/
---

Socket's threat research team has [analysed](https://socket.dev/blog/shai-hulud-descendant-malicious-ruby-gem) a malicious RubyGems package, `strutil-core`, whose payload does more than steal credentials. It also edits the configuration of AI coding tools so that opening a project in one can run the malware again. Socket published on 6 November; the gem itself went up on 1 November.

## What happened

A new account published a clean `strutil-core` 1.0.0 on 1 November and pushed a malicious 1.0.1 less than two hours later. Socket says its scanner flagged the release 70 seconds after publication, and RubyGems removed both versions about five hours after the malicious one went up. It was a standalone gem, not a hijacked popular package. Socket found no public projects that depended on it and has not confirmed any victims.

The trigger is install time. A native-extension script runs during `gem install` or `bundle install`, downloads the Bun JavaScript runtime and executes a bundled 5.48 MB payload, so no code ever has to `require` the gem. Socket ties the payload to the Miasma family of worms that grew out of the publicly released Shai-Hulud toolkit, the same lineage as the [tensorlake npm release](/posts/tensorlake-npm-worm-claude-code-hooks/) we covered in October.

## The part aimed at coding agents

According to Socket's static analysis, the payload:

- collects cloud, CI, package registry, SSH, AI coding tool and wallet credentials and sends them out;
- adds an MCP server named `workspace-tools` to writable MCP configs on the machine, and `SessionStart` hooks to other tool configs, both pointing back at the payload;
- uses stolen Git credentials to commit files into repositories, including `.claude/settings.json`, `.cursor/mcp.json`, Gemini settings, `CLAUDE.md`, `AGENTS.md` and a `.vscode/tasks.json` task that runs when the folder opens;
- carries republishing code for RubyGems, npm and PyPI;
- runs a monitor that deletes the user's home directory if a stolen GitHub token starts returning 401 or 403.

The generated `AGENTS.md` tells agents to run a setup script before their first command. Socket says whether opening an affected repo actually reruns the worm depends on each tool's workspace trust and approval settings. It is the same idea as the [planted AGENTS.md](/posts/agents-md-downloads-folder-hijacks-codex-claude-code/) that steered Codex last month, now automated and spread through Git.

## What to check

Socket's advice, in short:

1. Search `Gemfile.lock` files, CI caches and container images for `strutil-core`.
2. If you find it, isolate the machine and preserve its data **before** revoking tokens, because of the wiper.
3. Then rotate RubyGems, npm, PyPI, GitHub, GitLab, cloud, SSH, Kubernetes and AI provider credentials that machine could reach.
4. Remove unknown `workspace-tools` MCP entries, `SessionStart` hooks, `.github/init.js`, and unexpected `AGENTS.md`, `CLAUDE.md` or `.vscode/tasks.json` changes from home directories and repos. Inspect them without opening the workspace in an agent.

## Why this matters

Agent instruction files, hooks and MCP configs are now executable surface, and attackers are writing to them on purpose. Treat changes to them in pull requests like changes to CI workflows: review them, and keep your agent's approval prompts on for repos you did not write. For the secrets side of the same problem, see how [Claude Code permission rules leaked secrets](/posts/claude-code-dont-ask-again-secrets-public-github/) into public repos.
