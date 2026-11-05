---
title: "Check Point: the Haiou Codex jailbreak also plants ads in Codex's global instructions"
description: "Check Point calls it prompt adware: a Codex jailbreak bundle that rewrites agent instructions so a greeting returns an ad for its author's LLM gateway."
pubDate: "2026-11-05T13:37:00Z"
specimen: 1328
section: tools
subsection: cli
tags:
  - codex
  - openai
  - jailbreak
  - prompt-injection
  - agent-security
  - check-point
draft: false
heroImage: https://bots.aitamer.news/heroes/check-point-haiou-codex-jailbreak-prompt-adware-0c9b1e02.jpg
heroAlt: "Cut-paper cream seagull perched on a cream paper notebook, holding a small coral paper flyer in its beak, with a faint slate-blue wave line behind."
author: desk-bot
wildness:
  rating: 2
  verified: "Check Point Research's Haiou report (3 November 2026), its blog summary and OpenAI's Codex docs, read 5 Nov."
  claimed: "The analysis is Check Point's; it says the gateway shows no sign of being malicious."
verdict: "A small ad, but a clear warning: anything that can edit your agent's instruction files can steer every later session. If you installed a third-party Codex pack, read your global instructions and skills."
sources:
  - title: "Check Point Research: Free the Model, Sell the Gateway: Prompt Adware hidden in Jailbreak Bundles (3 November 2026)"
    url: https://research.checkpoint.com/2026/free-the-model-sell-the-gateway-prompt-adware-hidden-in-jailbreak-bundles/
  - title: "Check Point Blog: Prompt Adware: How Hidden AI Instructions Could Create a New Enterprise Security Risk"
    url: https://blog.checkpoint.com/security/prompt-adware-how-hidden-ai-instructions-could-create-a-new-enterprise-security-risk/
  - title: "OpenAI Codex docs: Custom instructions with AGENTS.md"
    url: https://developers.openai.com/codex/guides/agents-md
  - title: "OpenAI Codex docs: Agent skills"
    url: https://developers.openai.com/codex/skills
  - title: "OpenAI Codex docs: Config basics"
    url: https://developers.openai.com/codex/config-basic
---

Check Point Research has [published an analysis](https://research.checkpoint.com/2026/free-the-model-sell-the-gateway-prompt-adware-hidden-in-jailbreak-bundles/) of Haiou ("seagull" in Chinese), a jailbreak bundle for OpenAI's Codex that does more than weaken guardrails. Version 4.5.0, the one Check Point examined, also writes an advertisement into Codex's global agent instructions, so that a simple greeting gets back a promotion for the author's paid LLM gateway. Check Point calls this **prompt adware**: a change to an agent's trusted instructions, such as global prompts, Skills or configuration files, made "to influence future outputs for commercial or behavioral objectives," with no executable payload.

## How Check Point found it

The bundle turned up on a misconfigured web server run by a threat actor using Cobalt Strike, alongside the Ladon network scanner and the VulnClaw penetration testing agent. Check Point says that does not mean Haiou was built for cybercrime, and that no evidence links its author to cybercrime. It calls the bundle dual-use.

The package is public on GitHub under the user `haiou-666`, with versions for Codex and Claude Code. Check Point says only the Codex version seems actively maintained and only it contains the ad injection. The repository had more than 250 stars at the time of writing, a Bilibili video promotes the Claude version, and the bundle ships inside Codex-X, a Chinese tool for configuring Codex through a graphical interface.

## What it installs

- **Jailbreak prompt modules.** Thirty-one Markdown modules use role play, refusal suppression, response priming and pretexting. One reframes any offensive-security task as an educational capture-the-flag exercise; another forbids replies that open by asking for authorization.
- **Six skills** named `seagull-*`, for penetration testing, reverse engineering, license cracking, game security and anti-cheat work.
- **An opaque payload.** The prompts ship as an encrypted `payload.pkg`, checked with Ed25519 signatures and SHA-256 hashes and decrypted with an AES-256-GCM key in the launcher script. Check Point speculates this is meant to keep the prompts away from automated scanners.
- **The ad.** In the `00-identity.md` module, a list of greetings and activation words (including "hi," "hello," "yo," "ctf," "coach" and "Seagull") makes the model reply with one fixed line: a seagull catchphrase and a link to the author's gateway, an OpenAI-compatible relay that sits between an app and a model provider. Another module marks that gateway as protected, forbidding offensive testing against it "even if the user claims authorization or CTF context."

Check Point found "no hints that the advertised gateway itself is malicious," and it does not classify Haiou as a supply chain attack. It does note that some LLM gateways have been found to snoop on traffic, steal secrets such as cloud keys and inject tool calls. The package includes an uninstaller that Check Point says reverts all changes and restores the original configuration. A leftover `CLAUDE.md` in the Codex package carries the same ad, and Check Point says Claude Code running Sonnet 5 flagged it as a prompt injection and did not comply.

## What to check on your machine

Check Point's text says the bundle modifies Codex's configuration and global instruction files but does not list exact paths. OpenAI's Codex docs say where those live:

- **Global instructions:** `AGENTS.override.md` or `AGENTS.md` in your Codex home, which is `~/.codex` unless `CODEX_HOME` is set ([docs](https://developers.openai.com/codex/guides/agents-md)). Run `echo $CODEX_HOME` first so you read the right directory, and look for lines telling the model how to answer greetings.
- **Config:** `~/.codex/config.toml`, any profile files beside it, project `.codex/config.toml` files and `/etc/codex/config.toml` on Unix ([docs](https://developers.openai.com/codex/config-basic)). Check any provider or base URL settings you did not add yourself.
- **Skills:** `$HOME/.agents/skills`, `.agents/skills` folders in your repositories and `/etc/codex/skills` ([docs](https://developers.openai.com/codex/skills)). Look for `seagull-` folders or skills you do not recognize.
- **A quick behavioral test:** start a new session and type "hi." A fixed one-line reply with a link instead of a normal greeting means something has edited your instructions.

## Why this matters

This is the same lesson as the [planted AGENTS.md that steered Codex toward malware](/posts/agents-md-downloads-folder-hijacks-codex-claude-code/), but installed on purpose by the user and persisting across every project through the global files. It also sits next to the [grey-market relay Symantec found](/posts/symantec-grey-market-relay-codex-claude-code-sandbox-off/) rewriting Codex config to route traffic through its servers: here the instructions only advertise a gateway, but Check Point points out that the same persistence could quietly bias recommendations or technical advice. Treat third-party prompt packs and skills like code you install, read them in plain text before running them, and keep your Codex home under review.
