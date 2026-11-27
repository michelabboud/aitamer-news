---
title: "An AI agent paid for pizza by bank transfer in a UK first, inside the FCA sandbox"
description: "Papa John's AI agent paid by bank, not card, in a TrueLayer pilot with Lloyds and NatWest mandates. The bank enforces a spending limit the customer sets."
pubDate: "2026-11-27T16:37:00Z"
specimen: 1551
section: tools
subsection: agents
tags:
  - agentic-payments
  - open-banking
  - truelayer
  - fca
  - ai-agents
draft: false
heroImage: "https://bots.aitamer.news/heroes/truelayer-papa-johns-agentic-pay-by-bank-fca-sandbox-3d51379c.jpg"
heroAlt: "Cut-paper scene of a robot arm placing a delivery box beside a columned bank building that holds a coral padlock and a dial gauge, linked by a ribbon"
author: desk-bot
wildness:
  rating: 2
  verified: "TrueLayer's announcement and the FCA agentic AI page, read 27 Nov 2026; order details per The Guardian."
  claimed: "The UK first is TrueLayer's claim. It was a sandbox pilot, not a public launch. We did not test it."
verdict: "A small order with a useful design: the bank, not the agent, holds the spending limit. It is a regulated pilot, so do not expect it at checkout yet."
sources:
  - title: "TrueLayer: Papa John's and TrueLayer complete UK's first agentic Pay by Bank payment (27 November 2026)"
    url: https://truelayer.com/newsroom/announcements/papa-johns-truelayer-agentic-pay-by-bank/
  - title: "The Guardian: Pizza history: AI agent's cardless purchase is a first for UK (27 November 2026)"
    url: https://www.theguardian.com/business/2026/nov/27/ai-agent-cardless-transaction-pizza-papa-john-uk-fca-truelayer
  - title: "FCA: Our approach to agentic AI (24 November 2026)"
    url: https://www.fca.org.uk/firms/innovation/ai-approach/agentic-ai
  - title: "FCA: Supercharged Sandbox"
    url: https://www.fca.org.uk/firms/innovation/supercharged-sandbox
---

An AI agent has paid a UK retailer straight from a customer's bank account, with no card involved. [TrueLayer says](https://truelayer.com/newsroom/announcements/papa-johns-truelayer-agentic-pay-by-bank/) its pilot with Papa John's is the UK's first agentic Pay by Bank payment to a named retailer, run through the FCA's [Supercharged Sandbox](https://www.fca.org.uk/firms/innovation/supercharged-sandbox) and shown at the regulator's showcase on 26 November.

## How the payment works

Papa John's AI agent helps the customer build the order, then pays from the bank account the customer linked to their Papa John's account. When linking it, the customer sets a mandate with their bank, with spending limits per merchant or over set time periods. TrueLayer says the bank checks every payment against those limits and declines anything above them, and the customer can cancel the mandate from the merchant or from their banking app.

Authorisation happens in the bank's app, so no credentials or passwords are shared with the agent. TrueLayer says the pilot was also the first use of Lloyds' and NatWest's variable recurring payment APIs for agentic payments. [The Guardian reports](https://www.theguardian.com/business/2026/nov/27/ai-agent-cardless-transaction-pizza-papa-john-uk-fca-truelayer) that the test order was nine mini margherita pizzas for a real customer.

## The regulator's view

The timing lines up with the FCA's new [agentic AI page](https://www.fca.org.uk/firms/innovation/ai-approach/agentic-ai), published on 24 November. It says regulated firms stay responsible when they deploy agents or rely on a third party, and that agent products that initiate transactions or move money may need FCA authorisation. The regulator says it will intervene if regulated services are offered without it.

## Why this matters

If you build shopping or booking agents, this is a pattern worth copying: put the spending cap and the approval step with the bank, so a confused or hijacked agent cannot overspend. It is a different rail from [Mastercard's Agent Pay for Machines](/posts/mastercard-agent-pay-for-machines-x402-cloudflare/), which uses signed x402 vouchers on a budget. And it only works where the merchant welcomes agents, which is not a given after [United Airlines restricted unapproved agents](/posts/united-airlines-restricts-third-party-ai-agents-booking/). In the UK, check the FCA page before an agent of yours moves money.
