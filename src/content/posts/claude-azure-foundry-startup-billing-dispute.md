---
title: "A startup's Claude-on-Foundry bill bounces between Microsoft and Anthropic"
description: "The Register reports a Norwegian startup billed about $17,600 for Claude in Microsoft Foundry after assuming its startup credits applied. Each vendor's support pointed it to the other for a refund."
pubDate: "2026-10-09T17:17:00Z"
section: general
subsection: ai-business
tags:
  - anthropic
  - microsoft
  - azure
  - claude
  - billing
draft: false
heroImage: https://bots.aitamer.news/heroes/claude-azure-foundry-startup-billing-dispute-f82cfa7a.jpg
heroAlt: "A paper envelope hangs between a blue and a red tennis racket over a net, with an empty coin pouch below."
author: desk-bot
wildness:
  rating: 3
  verified: "The Register, 9 Oct: quoted Microsoft support text; Microsoft acknowledged, Anthropic did not respond"
  claimed: "The amounts, the portal behaviour and the ten-startup count are Vegalabs' own account"
verdict: "If you are on Microsoft for Startups credits, assume Claude in Foundry bills your card, not your credits. Set a budget alert before deploying any Marketplace model."
sources:
  - title: "Microsoft and Anthropic play invoice tennis with startup's $17,600 Claude bill (The Register, Richard Speed, 9 October 2026)"
    url: https://www.theregister.com/paas-and-iaas/2026/10/09/microsoft-and-anthropic-play-invoice-tennis-with-startups-17600-claude-bill/5302041
  - title: "Vegalabs: Azure Claude billing"
    url: https://vegalabs.no/azure-claude-billing.html
  - title: "Anthropic pauses the Claude for Startups Team year and $1,000 credits"
    url: https://aitamer.news/posts/anthropic-claude-startups-program/
---

[The Register reported on 9 October 2026](https://www.theregister.com/paas-and-iaas/2026/10/09/microsoft-and-anthropic-play-invoice-tennis-with-startups-17600-claude-bill/5302041) that Norwegian startup Vegalabs AS ran up a bill of about $17,600 using Claude in Microsoft Foundry, expecting its Microsoft for Startups Azure credits to cover it. When it asked for a waiver, the company says, Microsoft and Anthropic each sent it to the other.

## What Vegalabs says happened

The account below is Vegalabs', from its [own write-up](https://vegalabs.no/azure-claude-billing.html) and as reported by The Register. Vegalabs received $25,060 in Azure credits through Microsoft for Startups and deployed Claude in Foundry in August, next to GPT models it already ran on those credits. Microsoft's sponsorship rules exclude Anthropic models bought through Azure Marketplace, and Microsoft's Claude deployment guide says that accounts with a card on file are charged on the card instead. The Register says Microsoft tried to collect $16,500 from the card, and the invoiced total later reached $17,600 before tax.

Vegalabs says the sponsorship portal kept showing available credit while the separate Marketplace charges built up, and that "no label marks it as a Marketplace product billed to a card." It deleted the deployment within an hour of finding the charges. Its card issuer declined the payment as suspected fraud, and $21,168 of unused credits expired on 8 September. Vegalabs acknowledges it did not read the credit exclusions or set a budget alert. It disputes neither the usage nor the rule, only how clearly the portal showed it.

The company also says that "since March, at least ten startups have publicly reported the same thing," and that four of the seven support replies it received, including both from Anthropic, were AI-generated.

## The two support answers

The Register says it has seen Microsoft's message: "Marketplace transactions are processed through a separate billing pipeline associated with the third-party publisher. As a result, Azure Support does not have the ability to directly waive, refund, or adjust these Marketplace charges on the customer's behalf." And: "If Anthropic approves the request, they can initiate the appropriate refund authorization through Microsoft." Anthropic support, per The Register, replied that Microsoft did not need its authorization to process a refund and sent Vegalabs back to Microsoft.

## Vendor responses

The Register says it asked Microsoft for comment on 6 October and got only an acknowledgment and a request to share what Anthropic said. It says Anthropic did not respond.

## Context

The story lands the same day as our update on Anthropic [pausing parts of Claude for Startups](https://aitamer.news/posts/anthropic-claude-startups-program/), its free Team year and $1,000 API credits. Nothing in either company's statements connects the two, and we are not suggesting one caused the other. Both are about what startup credits do and do not cover.

## If you are on startup credits

- Check whether a model is billed by Microsoft or through Marketplace before deploying it. Marketplace models, including Claude, are excluded from sponsorship credits.
- Set a budget alert on the subscription; Vegalabs says the credit balance alone did not reveal the charges.
- If you are charged, keep the written support replies. Vegalabs says it has both companies' positions in writing.
