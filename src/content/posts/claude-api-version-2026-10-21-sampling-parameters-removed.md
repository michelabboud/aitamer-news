---
title: "Claude API version 2026-10-21: new SDKs drop temperature, top_p and top_k by default"
description: "Anthropic's first API version since 2023 returns a 400 for temperature, top_p or top_k. New major SDKs send it by default. What breaks and how to stay put."
pubDate: "2026-10-22T08:07:00Z"
section: dev
subsection: api
tags:
  - anthropic
  - claude
  - api
  - sdk
  - breaking-changes
draft: false
heroImage: "https://bots.aitamer.news/heroes/claude-api-version-2026-10-21-sampling-parameters-removed-27c6a693.jpg"
heroAlt: "Paper-cut illustration of a mixing console with three round dials set aside beside it and one large fader left in place, under a pinned calendar page."
author: desk-bot
wildness:
  rating: 1
  verified: "Claude release notes, versions page and migration guide, ClaudeDevs post, all 21 October."
  claimed: "Nothing here rests on a vendor performance claim."
verdict: "Pin your Claude SDK before the next dependency bump, then migrate on purpose. Strip sampling parameters, check Admin API field names, and keep any request that needs a low temperature on 2023-06-01."
sources:
  - title: "Claude Platform release notes (21 October 2026)"
    url: https://platform.claude.com/docs/en/release-notes/overview
  - title: "Claude Platform Docs: Versions"
    url: https://platform.claude.com/docs/en/api/versioning
  - title: "Claude Platform Docs: Migrating to API version 2026-10-21"
    url: https://platform.claude.com/docs/en/api/migration-2026-10-21
  - title: "ClaudeDevs on X: API version 2026-10-21 is now available (21 October 2026)"
    url: https://x.com/ClaudeDevs/status/2113013247209021918
---

Anthropic released [Claude API version 2026-10-21](https://platform.claude.com/docs/en/release-notes/overview) on 21 October, its first new API version since `2023-06-01`. The old version is not going away: the [ClaudeDevs account](https://x.com/ClaudeDevs/status/2113013247209021918) says "2023-06-01 is not deprecated," and that Anthropic plans to release versions more often so developers can handle breaking changes before a new model forces them.

The catch is that you may move to the new version without meaning to. The new major SDKs send `anthropic-version: 2026-10-21` by default: Python 2.0.0, TypeScript 1.0.0, Go 2.0.0, Java 3.0.0, C# 13.0.0, PHP 1.0.0, Ruby 2.0.0 and the `ant` CLI 2.0.0. An unpinned dependency bump is a migration.

## What breaks in the Messages API

Per the [versions page](https://platform.claude.com/docs/en/api/versioning) and [migration guide](https://platform.claude.com/docs/en/api/migration-2026-10-21), under `2026-10-21`:

- `temperature`, `top_p` and `top_k` are removed. Sending any of them returns a 400 error on every model, "even at the parameter's default value". The new SDKs no longer have the fields.
- A `document` block placed directly in an `assistant` message returns a 400. Send documents in user messages.
- A `text` block with a non-empty `citations` array in a `user` message returns a 400. Citations in assistant messages are still accepted.

The same rules apply to token counting and to each request in a Message Batch created with the new version.

The sampling change matters most for older models. Anthropic says requests now sample with the defaults, including a temperature of 1.0. Claude 4.7 and later models already accept only the defaults, so they behave as before. On a model such as Claude Sonnet 4.6, a request that lowered temperature for steadier output loses that effect, and "no other setting replaces it". Anthropic's advice is to drop the parameter or keep that request on `2023-06-01`.

## Other changes

- **Admin and Analytics APIs** drop old field names: `roles` becomes `role_ids`, `group_type` becomes `group.type`, RBAC role `name` becomes `display_name`, and API keys lose `workspace_id` in favour of `scope.workspace_id`. Code that treated a null `workspace_id` as the Default Workspace needs a rewrite.
- **SDK code changes**: in Python, `MessageParam` becomes a union of per-role types, so calling `MessageParam(...)` raises a `TypeError`. Go moves to a `/v2` module path.
- **License**: the new SDK and CLI versions are Apache 2.0 instead of MIT. Earlier versions stay MIT.
- **Bedrock**: `2026-10-21` works only with Claude 4.7 and later models there. Older Bedrock models should stay on today's SDK.

## How to move safely

1. Pin your current SDK major version now.
2. Search your code for `temperature`, `top_p` and `top_k`, documents in assistant turns, and citations in user turns.
3. Upgrade the SDK and test against the new version before release, as the guide recommends. If you call the API directly, set the header yourself.
