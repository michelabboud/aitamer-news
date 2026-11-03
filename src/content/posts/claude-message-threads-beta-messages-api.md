---
title: "Claude's Messages API adds message threads: send only the new turn, get a faster first token"
description: "Anthropic's message threads beta keeps a conversation server-side for 5 minutes, so agent loops send only new messages. Prices unchanged; not ZDR eligible."
pubDate: "2026-11-03T07:37:00Z"
section: tools
subsection: agents
tags:
  - anthropic
  - claude-api
  - messages-api
  - agents
  - latency
draft: false
heroImage: https://bots.aitamer.news/heroes/claude-message-threads-beta-messages-api-4727de5c.jpg
heroAlt: "Paper-cut illustration of a cream paper spool with a long thread wound on it and only a short new length unspooling to a needle, one coral bead on the thread and a faint slate-blue clock behind."
author: desk-bot
wildness:
  rating: 2
  verified: "Claude docs page, 2 Nov release notes and Anthropic's launch article, all read 3 Nov."
  claimed: "The ~35% median TTFT drop at 500k to 1M tokens is Anthropic's Claude Code figure. We have not measured it."
verdict: "Worth trying if your agent loops run long and you care about time to first token. Build the replay path first, and skip it if your org needs ZDR or HIPAA readiness."
sources:
  - title: "Claude Docs: Message threads"
    url: https://platform.claude.com/docs/en/build-with-claude/message-threads
  - title: "Claude: Make long-running agents faster with message threads"
    url: https://claude.com/resources/articles/message-threads
  - title: "Claude Platform release notes (2 November 2026)"
    url: https://platform.claude.com/docs/en/release-notes/overview
---

Anthropic has put **message threads** into public beta on the Claude Messages API. The idea is simple: send the full conversation once, then on each later turn send only the new messages plus the `id` of the previous response. The API rebuilds the rest on its side before it calls the model. It shipped on 2 November behind the `message-threads-2026-08-12` beta header, according to the [release notes](https://platform.claude.com/docs/en/release-notes/overview).

## The speed claim

Anthropic's [launch article](https://claude.com/resources/articles/message-threads) gives one number: "With message threads on by default for most Claude Code users, requests with 500k to 1M tokens see median TTFT drop by about 35%." That is a Claude Code measurement from Anthropic, not an independent benchmark. The [docs](https://platform.claude.com/docs/en/build-with-claude/message-threads) explain where the time goes: without a thread, every turn uploads the whole conversation again and the API validates and tokenizes all of it again. Claude still reads the full conversation each turn, so token usage stays the same. The docs say threads "do not change pricing or rate limits."

## How it works

- **Create:** send the first request as usual, with `system` and `tools`, and add `"thread": {"type": "create"}`.
- **Continue:** send only the new messages and `"thread": {"type": "continue", "previous_message_id": "..."}`. Leave `system` and `tools` out; sending either one returns a 400 error.
- **Fixed fields:** `model`, `thinking`, `tool_choice`, the top-level `cache_control` and the set of beta values must match the create request, or you get `thread_fingerprint_mismatch`.
- **Append only:** each response `id` can be continued once. To edit or branch, start a new thread.

The SDKs ship a thread helper that adds the header, builds continue requests and replays the conversation for you when a thread is gone.

## The catches

A thread is best effort. It expires 5 minutes after its last request and is deleted no more than 1 hour after its last use. When it can't be continued, a continue request returns a 404 with `thread_not_found`, and you resend the full conversation in a new create request. The docs are blunt: your application stays the source of truth, so keep your own copy of every message.

Threads do not cache your prompt for you. Prompt caching works as before, with a cap of 4 `cache_control` breakpoints per threaded request. Threads also don't work with Message Batches, token counting, on-demand compaction, most context editing, or organizations with Inference hooks turned on.

On data handling, the docs say threads are **not ZDR eligible** and **not HIPAA eligible**, and organizations with HIPAA readiness enabled get a `thread_unsupported_request` error. Thread contents sit in memory, encrypted under a server-managed key, and are never written to durable storage.

The beta covers every model on the Claude API, Claude Platform on AWS, Claude Models on Google Cloud (Anthropic managed) and Claude in Microsoft Foundry. The release notes don't list Claude in Amazon Bedrock.

OpenAI took a different route on the same problem when it gave the Responses API a [12 hour prompt cache](/posts/openai-12-hour-prompt-caching-responses-api/). Threads shrink the request; they don't change what the model reads, so [budgeting max_tokens against the window you have left](/posts/budget-max-tokens-against-the-context-window-you-have-left/) still applies.

## Why this matters

If your agent loop carries hundreds of thousands of tokens, threads cut the upload and parsing work on every turn without changing token bills, per Anthropic's docs. The cost is a new failure path: threads expire after 5 idle minutes, so replay from your own copy has to work from day one. Teams under ZDR or HIPAA readiness can't use it yet.
