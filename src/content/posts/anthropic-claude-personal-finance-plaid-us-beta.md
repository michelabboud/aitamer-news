---
title: "Claude Personal Finance links US banks via Plaid in a Pro/Max/Ultra beta"
description: "Claude Personal Finance is a US beta on Pro, Max and Ultra: read-only bank links via Plaid, up to 24 months of transactions."
pubDate: "2026-11-06T12:07:00Z"
section: tools
tags:
  - anthropic
  - claude
  - personal-finance
  - plaid
  - banking
draft: false
heroImage: https://bots.aitamer.news/heroes/anthropic-claude-personal-finance-plaid-us-beta-84a775cd.jpg
heroAlt: "Cream paper wallet beside a cream paper ledger with a coral seal, and a faint slate-blue bank facade behind."
author: desk-bot
wildness:
  rating: 2
  verified: "Anthropic's Personal Finance article (5 Nov 2026), Claude Help Center setup page, and Plaid's 5 Nov post."
  claimed: "Gradual US rollout and partnership exploration are Anthropic's; we have not used the hub."
verdict: "A read-only money hub for paid US personal plans, not Free, Team or Enterprise. Useful for asking about your own balances; not a broker, and not designed for investment advice."
sources:
  - title: "Anthropic: Introducing Personal Finance in Claude (5 November 2026)"
    url: https://claude.com/resources/articles/introducing-personal-finance-in-claude
  - title: "Claude Help Center: Use Personal Finance in Claude"
    url: https://support.claude.com/en/articles/18185620-use-personal-finance-in-claude
  - title: "Plaid: Plaid Powers Financial Insights In Claude (5 November 2026)"
    url: https://plaid.com/blog/plaid-anthropic-financial-insights-in-claude/
  - title: "AI Tamer: Claude Dashboards and Motion beta"
    url: https://aitamer.news/posts/claude-dashboards-motion-beta/
  - title: "AI Tamer: Claude Duet and Claude Security"
    url: https://aitamer.news/posts/claude-duet-proactive-agent-claude-security-continuous-scans/
  - title: "AI Tamer: OpenAI Dots, always-on agents"
    url: https://aitamer.news/posts/openai-dots-always-on-agents-first-look/
---

Anthropic is rolling out [Personal Finance in Claude](https://claude.com/resources/articles/introducing-personal-finance-in-claude) this week as a US beta on Pro, Max and Ultra. The [Help Center](https://support.claude.com/en/articles/18185620-use-personal-finance-in-claude) says it is available on Claude on the web, Claude Desktop, Claude for iOS and Claude for Android, and that it is not available on Free, Team or Enterprise. Rollout is gradual, so you may not see the sidebar item yet.

## What it connects, and what it does not do

You link US bank, credit card, loan and investment accounts through [Plaid](https://plaid.com/blog/plaid-anthropic-financial-insights-in-claude/). You sign in at your bank through Plaid, so Claude does not ask for or see your bank password. Access is read-only: Personal Finance cannot move, manage or invest your money. Anthropic says it is not designed to give investment advice, has no ads or sponsored recommendations, and does not sell its own credit cards, loans or savings accounts.

For accounts you choose to share, Claude can read bank names; account names, types and last four digits; balances and credit limits; and up to **24 months** of transactions (amount, date, merchant, category and the bank's description), per Help. Anthropic's article says "up to two years"; we prefer Help's 24 months. For loans and investments, Help says Claude reads balances and credit limits, not holdings, trades, rates or terms. You can link up to 16 banks, unlink anytime, or disconnect Claude at my.plaid.com.

## Privacy edges worth knowing

Chats in the Personal Finance hub are not used to train Anthropic's models. Outside the hub, your usual privacy settings apply. Help also notes Personal Finance is not available in [Claude Duet](/posts/claude-duet-proactive-agent-claude-security-continuous-scans/), and that linked accounts cannot be used in scheduled tasks, Cowork tasks or Claude Code.

## Why this matters

Builders who already use Claude for charts and data questions, as in [Dashboards and Motion](/posts/claude-dashboards-motion-beta/), now get a first-party path to real balances without pasting CSV exports into chat. Compared with always-on agent products such as [OpenAI Dots](/posts/openai-dots-always-on-agents-first-look/), this is a narrower, read-only money surface on paid personal plans, not a general agent that acts on your behalf. Anthropic says it is exploring how Claude could work alongside licensed professionals and regulated firms later; treat that as aspirational, not a shipped partnership.
