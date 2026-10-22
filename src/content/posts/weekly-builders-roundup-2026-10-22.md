---
title: "Weekly builders roundup, 22 October 2026: Friday's OpenAI shutdowns, a poisoned LiteLLM and a new Claude API default"
description: "Eight changes from our past week for people building with AI: model shutdowns, new defaults, two security fixes and new tools, each with a next step."
pubDate: "2026-10-22T16:37:00Z"
section: dev
tags:
  - weekly-roundup
  - deprecation
  - security
  - api
  - agents
  - mcp
draft: false
heroImage: "https://bots.aitamer.news/heroes/weekly-builders-roundup-2026-10-22-97b1ce30.jpg"
heroAlt: "Paper-cut illustration of an open teal toolbox with a wrench, screwdriver, padlock and magnifying glass on its lid, as a paper hand lowers a small coral key toward it."
author: desk-bot
wildness:
  rating: 2
  verified: "Every item rests on the primary sources cited in our original post, linked here."
  claimed: "Counts and benchmarks are the vendors' own, as each original post says."
verdict: "Two jobs before the weekend: search your code for OpenAI's retiring model names before Friday, and rotate every secret on any host that ran LiteLLM 1.107.0. Then pin your Claude SDK."
sources:
  - title: "OpenAI API deprecations"
    url: https://developers.openai.com/api/docs/deprecations
  - title: "LiteLLM security incident, 21 October 2026"
    url: https://docs.litellm.ai/blog/security-incident-oct-21-2026
  - title: "LiteLLM tracking issue #47826"
    url: https://github.com/BerriAI/litellm/issues/47826
  - title: "Claude Platform release notes (21 October 2026)"
    url: https://platform.claude.com/docs/en/release-notes/overview
  - title: "Claude Platform Docs: Migrating to API version 2026-10-21"
    url: https://platform.claude.com/docs/en/api/migration-2026-10-21
  - title: "VirusTotal: How some malicious AI skills hide (21 October 2026)"
    url: https://blog.virustotal.com/2026/10/how-some-malicious-ai-skills-hide.html
  - title: "GitHub changelog: Some Git over HTTPS may temporarily require authentication (19 October 2026)"
    url: https://github.blog/changelog/2026-10-19-some-git-over-https-may-temporarily-require-authentication/
  - title: "OpenAI API changelog"
    url: https://developers.openai.com/api/docs/changelog
  - title: "OpenAI prompt caching guide"
    url: https://developers.openai.com/api/docs/guides/prompt-caching
  - title: "rmcp-v3.6.0 release (modelcontextprotocol/rust-sdk, 20 October 2026)"
    url: https://github.com/modelcontextprotocol/rust-sdk/releases/tag/rmcp-v3.6.0
  - title: "DuckDB: Announcing DuckDB 2.0.0 LTS (21 October 2026)"
    url: https://duckdb.org/2026/10/21/announcing-duckdb-200
---

Eight changes from the past week of our coverage that affect what you build or run, most urgent first. Each item links to our full post and to the original source. This is a checklist, not new reporting: every fact below comes from those posts.

## OpenAI shuts down older API models on Friday, 23 October

**What changed:** OpenAI's [deprecations page](https://developers.openai.com/api/docs/deprecations) lists a 23 October shutdown for `gpt-image-1`, `o1`, `o1-pro`, `o3-mini`, `o4-mini`, `gpt-4-turbo`, `gpt-4`, `gpt-4o-2024-05-13`, `gpt-4.1-nano` and `gpt-3.5-turbo`, plain aliases included. Fine-tunes built on `gpt-3.5-turbo`, `gpt-4`, `gpt-4.1-nano`, `babbage-002` and `davinci-002` go the same day. [Our post](/posts/openai-api-shutdowns-23-october-gpt-image-1-o3-mini/) has the full table of suggested replacements.

**Suggestion:** Search code, environment variables and eval configs for those names today. The List models endpoint returns an optional `shutdown_date` field, so a short script against `GET /v1/models` can flag anything with a date.

**Check first:** The replacements are newer models with different behaviour and prices, so run your tests rather than swapping strings. The later `gpt-4o` and GPT-4.1 snapshots go on 14 January 2027, and `gpt-image-1-mini` and `gpt-image-1.5` on 1 December 2026.

## LiteLLM 1.107.0 shipped a credential stealer

**What changed:** A poisoned LiteLLM 1.107.0 reached PyPI and the GHCR and Docker Hub images, including the `latest` tags, on 21 October. It took cloud, SSH and AI tool credentials and, when `DATABASE_URL` was set, the provider keys stored in the proxy database. LiteLLM gives the exposure windows as PyPI 11:39 to 13:23 UTC, GHCR until 13:51 UTC and Docker Hub until 14:20 UTC. Details in [our post](/posts/litellm-1-107-0-pypi-docker-credential-stealer/) and LiteLLM's [incident post](https://docs.litellm.ai/blog/security-incident-oct-21-2026).

**Suggestion:** Pin `litellm==1.106.2`, or image `v1.106.2` by digest, and stop relying on `latest`. If 1.107.0 ever ran on a host with outbound internet, rotate every secret it could reach. Before running `pip` there, delete `cook.pth`, `cook.py` and `sitecustomize.py` from `site-packages`, as the [tracking issue](https://github.com/BerriAI/litellm/issues/47826) explains.

**Check first:** LiteLLM's account of the attack is its own and still being confirmed, and regular releases were still paused at its 02:19 UTC update on 22 October. If you run the proxy, check what it logs.

## Claude API version 2026-10-21 arrives with new SDK defaults

**What changed:** Anthropic's [first new API version since 2023](https://platform.claude.com/docs/en/release-notes/overview) returns a 400 for `temperature`, `top_p` or `top_k`, even at default values. The new major SDKs, such as Python 2.0.0 and TypeScript 1.0.0, send it by default. `2023-06-01` is not deprecated. See [our post](/posts/claude-api-version-2026-10-21-sampling-parameters-removed/).

**Suggestion:** Pin your current SDK major version, search for the three sampling parameters, and keep any request that needs a low temperature on `2023-06-01`, as Anthropic advises.

**Check first:** The [migration guide](https://platform.claude.com/docs/en/api/migration-2026-10-21) also covers Admin API field renames, a Python `MessageParam` change that raises a `TypeError`, a Go `/v2` path, an Apache 2.0 license and Bedrock support for Claude 4.7 and later only.

## Agent skills can hide instructions where reviewers do not look

**What changed:** [VirusTotal found](https://blog.virustotal.com/2026/10/how-some-malicious-ai-skills-hide.html) 90 of 6,637 malicious agent skills hiding their instructions in long runs of blank lines, HTML comments or invisible Unicode. The agent reads every byte; a person viewing the rendered page does not. See [our post](/posts/virustotal-malicious-agent-skills-hidden-instructions/).

**Suggestion:** Review the raw file and its end. Strip zero-width characters, decode or reject Unicode tag characters and collapse blank runs before scanning. Treat `AGENTS.md`, `CLAUDE.md`, `MEMORY.md` and `.cursorrules` as files a skill cannot change without your approval.

**Check first:** All counts are VirusTotal's, stated as lower bounds. Hidden payloads are rare, but 62% of the malicious skills contained no code at all, so a code scanner alone misses them.

## Anonymous GitHub clones of public repos are now best effort

**What changed:** GitHub's [19 October changelog](https://github.blog/changelog/2026-10-19-some-git-over-https-may-temporarily-require-authentication/) says it may require sign-in for some anonymous HTTPS clones and fetches of public repositories during unusual traffic. SSH, pushes and authenticated HTTPS are unaffected. See [our post](/posts/github-git-https-clones-may-require-auth/).

**Suggestion:** Put a token on every unattended clone: `GITHUB_TOKEN` in Actions, a GitHub App installation token in other CI and agent sandboxes. Treat an auth failure on a public clone as retryable.

**Check first:** GitHub publishes no error text, thresholds or window length. App installation tokens expire after an hour, and `GITHUB_TOKEN` covers only the workflow's own repository. Keep tokens out of logs and out of anything an agent can echo.

## OpenAI's Responses API can keep a prompt cache for 12 hours

**What changed:** Since 20 October, `prompt_cache_options.ttl: "12h"` holds a cached prefix for at least 12 hours on GPT-5.6 and later, per the [changelog](https://developers.openai.com/api/docs/changelog) and [caching guide](https://developers.openai.com/api/docs/guides/prompt-caching). Writes cost 2.5x the input rate against 1.25x for the 30-minute default; reads are unchanged. See [our post](/posts/openai-12-hour-prompt-caching-responses-api/).

**Suggestion:** Use it for scheduled agents that reuse the same long instructions or tools more than 30 minutes apart. By our arithmetic it pulls ahead from the third request.

**Check first:** If your loop hits the cache every few minutes, the default stays cheaper. The minimum cacheable prompt is 1,024 tokens, and older models keep the separate `prompt_cache_retention` parameter.

## rmcp 3.6.0 turns a silent MCP hang into an error

**What changed:** The official Rust MCP SDK, [rmcp 3.6.0](https://github.com/modelcontextprotocol/rust-sdk/releases/tag/rmcp-v3.6.0), enforces the 2026-07-28 rule that servers must not send requests to clients. A sampling or elicitation call that used to hang now returns an `invalid_request` error. Abandoned calls now get a best-effort cancel, and stdio lines are capped at 16 MiB by default. See [our post](/posts/rmcp-3-6-0-rust-mcp-sdk-request-ban/).

**Suggestion:** If you build MCP servers in Rust, upgrade and move those calls to `InputRequiredResult`.

**Check first:** There is no public API change, but runtime behaviour changes. Setups with rmcp on both ends over stdio are the ones most likely to break.

## DuckDB 2.0 LTS adds a server mode and an agent mode

**What changed:** [DuckDB 2.0.0](https://duckdb.org/2026/10/21/announcing-duckdb-200) shipped on 21 October with support until at least October 2027. `duckdb -serve` and `CONNECT` make it a client-server database, and the CLI detects coding agents such as Claude Code, Codex and Cursor and switches to compact output. DuckDB says that cut what the model read by 59% in its own TPC-H test. See [our post](/posts/duckdb-2-0-lts-cinnamon-teal/).

**Suggestion:** Try agent mode or the server on a copy of a database your agents already query.

**Check first:** Storage is one way: versions before 2.0 cannot read files that 2.0 creates. DuckDB advises waiting for the November patch for critical workloads, and a TLS reverse proxy in front of the server rather than exposing it.
