---
title: "Shared Muse chats can be found through passive DNS, Claroc says, because the title is in the hostname"
description: "Claroc says one passive-DNS query listed 6,800+ Muse share hostnames, each named after its chat. Some it opened held loan, revenue and job-search details."
pubDate: "2026-10-20T15:37:00Z"
section: general
subsection: security
tags:
  - meta
  - muse
  - privacy
  - dns
  - ai-agents
draft: false
heroImage: "https://bots.aitamer.news/heroes/meta-muse-shared-chat-links-passive-dns-57fd60d4.jpg"
heroAlt: "A worn sand paper card cabinet stands on a slate-blue paper street with one drawer pulled open and full of cream cards and a coral card, beside a grey paper lamppost and a row of faint blue houses."
author: desk-bot
wildness:
  rating: 3
  verified: "Claroc's 'GhostShares' write-up and Ars Technica's 20 October report."
  claimed: "The 6,800 count and the sample contents are Claroc's findings, a security vendor."
verdict: "Treat a Muse share link as a public page with a readable name, not a private note. Nobody broke in here; the leak is in how the address is built. Until Meta says otherwise, keep sensitive chats out of share links."
sources:
  - title: "Claroc Research: GhostShares, a shared Muse chat exposed prep for a confidential call (October 2026)"
    url: https://blog.claroc.io/ghostshares-muse-passive-dns/
  - title: "Dan Goodin, Meta Muse exposes users' personal and business secrets when they share conversations (Ars Technica, 20 October 2026)"
    url: https://arstechnica.com/security/2026/10/meta-muse-exposes-users-personal-and-business-secrets-when-they-share-conversations/
  - title: "Meta Help Center: How Muse handles your privacy, safety and security (read 20 October 2026)"
    url: https://www.meta.com/help/artificial-intelligence/1047255454427887/
  - title: "Cequence says Muse reached customers without declaring it was an agent"
    url: https://aitamer.news/posts/meta-muse-undeclared-agent-cequence-fingerprint/
---

When you ask Meta's Muse agent to share a conversation, it publishes the conversation as a page and gives you a link. Anyone with the link can open it without logging in. That part is by design, and plenty of assistants work the same way. What security firm Claroc [reports in a write-up it calls GhostShares](https://blog.claroc.io/ghostshares-muse-passive-dns/) is that you do not need to be sent the link to find one.

## How the pages get found

According to Claroc, Muse builds each share's web address from the conversation's title plus a random ID, as a hostname under Muse's content domain. The random ID is long enough that nobody could guess it. But the first time anyone opens the link, their browser looks up that hostname, and commercial passive-DNS services, which record the lookups their resolvers see, keep it in a searchable index. Title, random ID and all.

Claroc says one search of such a service, about a month after Muse launched on 8 September, returned more than 6,800 share hostnames after it filtered out scan noise. "If you had asked us beforehand, we would have guessed that gathering these would take real effort," the researchers wrote. "It took one query." Claroc also says the public scanning service urlscan.io holds more than 75 saved scans of Muse share pages.

Muse's robots.txt asks search crawlers to stay off share paths, Claroc notes. That does not help here, because no search engine is involved.

## What the pages held

Claroc says it opened only a few hundred, and that most were harmless: small-business pages, listings, event calendars. A minority were not. Described by category only, as Claroc published them, they included notes for a confidential executive-search call with a frontier AI lab, a company revenue review marked for its CEO, a small-business loan application, a to-do list with a bank fraud alert and a partial account number, a property investor's performance report, and a workplace's staff vacation calendar. We are not repeating any title, name or address, and neither did Claroc or Ars.

Claroc says it reported the issue to Meta's bug bounty program on 8 October and has no evidence anyone misused the shares.

## What Meta has said

[Ars Technica](https://arstechnica.com/security/2026/10/meta-muse-exposes-users-personal-and-business-secrets-when-they-share-conversations/) says a Meta representative "didn't immediately have answers" to questions sent by email. Claroc's CTO, Asaf Aprozper, told Ars the company never received a reply from Meta and had concluded "this behavior is by design." We found no Meta statement on this in the reports we read.

## What to do

General advice, not Meta instructions: assume a shared Muse chat is public and has a readable name, and do not share anything by link that you would not post. Meta's [Muse privacy page](https://www.meta.com/help/artificial-intelligence/1047255454427887/) explains deleting messages, side chats and resetting Muse, but says nothing about share links. Claroc quotes a Meta help page saying a shared Meta AI link "doesn't expire," while noting that page covers Meta AI, not Muse. We found no Muse-specific instructions for listing or revoking shares.

For security teams, Claroc's own suggestions (it sells a product in this area) are to find out who uses Muse, add share links to AI usage guidance, and, if nothing else can see it, block Muse's domains on managed devices.

## Why it matters

Ars notes that Muse needs access to most of a user's accounts to work as intended. This finding needs no exploit, only a share someone chose to make and a DNS lookup. It follows earlier Muse questions we covered, such as [Cequence's report](https://aitamer.news/posts/meta-muse-undeclared-agent-cequence-fingerprint/) that Muse reached more than half the customers it studied without identifying as an AI agent.
