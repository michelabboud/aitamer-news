---
title: "Mastercard opens early access to Agent Pay for Machines, built on x402"
description: "At Cloudflare Connect, Mastercard showed an agent paying two merchants nine times on one budget with signed x402 vouchers, and opened developer early access."
pubDate: "2026-10-21T21:07:00Z"
section: tools
subsection: agents
tags:
  - mastercard
  - x402
  - agent-payments
  - cloudflare
  - coinbase
draft: false
heroImage: "https://bots.aitamer.news/heroes/mastercard-agent-pay-for-machines-x402-cloudflare-6d930ac7.jpg"
heroAlt: "Paper-cut illustration of a cream paper hand passing a blank voucher card through a slate-blue upright frame toward a small coral drawstring purse."
author: desk-bot
wildness:
  rating: 2
  verified: "Mastercard's newsroom post (20 October 2026)."
  claimed: "Pricing, fees, access numbers and launch date are not stated. Partner roles are Mastercard's."
verdict: "Payments for agents keep converging on HTTP 402. Mastercard's pitch is the authority layer: a budget and permissions set once, and vouchers the seller can check. Early access is a sandbox, not a launch."
sources:
  - title: "What happens when AI agents start paying each other? Watch Mastercard Agent Pay for Machines in action (Mastercard, 20 October 2026)"
    url: https://www.mastercard.com/global/en/news-and-trends/press/2026/october/Mastercard-Agent-Pay-for-Machines-in-action.html
  - title: "AI Tamer: Cloudflare Monetization Gateway closed beta, HTTP 402 and x402 for agents"
    url: https://aitamer.news/posts/cloudflare-monetization-gateway-402/
---

Mastercard used Cloudflare Connect on 20 October to [show Agent Pay for Machines](https://www.mastercard.com/global/en/news-and-trends/press/2026/october/Mastercard-Agent-Pay-for-Machines-in-action.html), a way for AI agents to pay for digital services on a business's behalf within a set budget. It also opened Agent Pay for Machines Early Access, which gives developers "the first version of our buyer- and seller-side APIs," a toolkit, a sandbox and documentation.

## How it works

Mastercard says the service builds on x402, "an open protocol that lets digital services request payment online." A business gives an agent a job and a spending limit. When the agent reaches a paid service, the service answers with HTTP 402 Payment Required. The agent creates "a digitally signed payment voucher," which Mastercard calls a secure promise to pay within the approved limit. The provider checks the voucher and delivers. Mastercard says these steps happen off-chain, and providers can combine vouchers and redeem them later.

Mastercard's framing is that "Payments aren't the hard part. Authority is." The point is that an agent gets a bounded budget for one task rather than open spending power or a separate account and API key at every provider.

## The demo

In the pilot shown at the event, marketing agency Hype gave an agent a budget to plan a sample campaign for a protein bar launch. Running on an agent platform such as Amazon Bedrock AgentCore, the agent found registered providers and proposed buying social media research from AIsa and campaign images through Cloudflare AI Gateway. Payment requests came back through Cloudflare Monetization Gateway, which we covered when it [entered closed beta](/posts/cloudflare-monetization-gateway-402/). Mastercard sums it up as "Nine payments. Two independent merchants. One approved budget."

Behind it, per Mastercard, Coinbase Developer Platform supplied the wallet used to fund the agent, Base was the on-chain settlement network, and BVNK acted as the agent wallet, using Mastercard's Global Money Platform to settle in fiat or stablecoins. Pilots also involved Ant International.

## What is missing

The post gives no pricing, fees, eligibility rules or date for general availability, and does not say how many developers will be admitted. It says the roadmap "will be shaped by what customers and partners need." Treat it as an invitation to test, not a product you can put into production today.
