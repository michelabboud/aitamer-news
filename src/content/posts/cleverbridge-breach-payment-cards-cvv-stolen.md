---
title: "Cleverbridge says attackers copied stored payment card data, and notices list CVV codes"
description: "Software checkout firm Cleverbridge says card data stored on its platform was copied on 4 November. A notice seen by BleepingComputer lists CVV codes."
pubDate: "2026-11-23T09:07:00Z"
section: devops
subsection: security
tags:
  - security
  - data-breach
  - payments
  - saas
draft: false
heroImage: "https://bots.aitamer.news/heroes/cleverbridge-breach-payment-cards-cvv-stolen-df4d28d4.jpg"
heroAlt: "Cut-paper checkout counter where a pale tracing-paper copy of a blank steel blue card is pulled away on a yellow thread, a coral bag and blank receipt nearby"
author: desk-bot
wildness:
  rating: 2
  verified: "Cleverbridge's incident update page, read 23 November 2026, and Malwarebytes' forum statement."
  claimed: "Card fields come from a notice seen by BleepingComputer; Cleverbridge's page does not list them."
verdict: "If you bought software through a Cleverbridge checkout and got a notice, ask your bank for a new card. If you sell through it, prepare for customer questions."
sources:
  - title: "Cleverbridge: Incident update"
    url: https://grow.cleverbridge.com/incident-update
  - title: "BleepingComputer: Cleverbridge warns hackers stole credit card numbers, CVVs in data breach (22 November 2026)"
    url: https://www.bleepingcomputer.com/news/security/cleverbridge-warns-hackers-stole-credit-card-numbers-cvvs-in-data-breach/
  - title: "Malwarebytes forums: Cleverbridge Data Breach (staff reply)"
    url: https://forums.malwarebytes.com/topic/342132-cleverbridge-data-breach/
---

Cleverbridge, which runs checkout, payments and subscriptions for software and SaaS vendors, says [a third party copied payment card data stored on its platform](https://grow.cleverbridge.com/incident-update). It detected the unauthorised activity on **4 November 2026**, took affected systems offline and had them back the same day, but its investigation later found the card data had been copied. It began notifying affected people on **20 November**.

## What was taken

Cleverbridge's public page says only that the data "may include payment card details used to make a purchase through Cleverbridge" and points people to their individual notices. One of those notices, [seen by BleepingComputer](https://www.bleepingcomputer.com/news/security/cleverbridge-warns-hackers-stole-credit-card-numbers-cvvs-in-data-breach/), is more specific: card number, expiry date and the **CVV/CVC security code**, and it says no name, contact or billing details were copied.

The security code is the worrying part. With number, expiry and CVV, a card can be used for online purchases. Card industry rules say merchants should not keep that code after authorising a payment. Cleverbridge has not said why it was available to copy, how the attackers got in, how long they had access or how many people are affected. It says it was not ransomware and no systems were encrypted.

## Who is affected

Because Cleverbridge acts as the seller of record for many software brands, people may not recognise its name on a notice. A Malwarebytes staff member [confirmed on its forum](https://forums.malwarebytes.com/topic/342132-cleverbridge-data-breach/) that Cleverbridge is one of its payment processors and that "only a small subset" of its customers were affected. Cleverbridge has not named the merchants involved. It says it has told data protection authorities, law enforcement and the card networks, and is offering credit or identity monitoring through TransUnion's Cyberscout.

As with the [OpenCode Console breach](/posts/opencode-console-breach-provider-api-keys/), the data sat with a third party you handed it to once, not with the vendor whose product you use. And as [Fireworks AI's later update](/posts/fireworks-ai-breach-update-datasets-model-weights/) showed, the known scope of a breach can grow after the first notice.

## Why this matters

Many indie software makers and SaaS companies sell through merchant-of-record platforms like Cleverbridge so they do not have to handle cards themselves. This shows that the card risk moves with the data, not away from you: your customers will still email you. If you sell through Cleverbridge, ask it whether your customers were affected and prepare a short answer. If you got a notice, the advice is simple: ask your card issuer to replace the card, and treat follow-up emails about the breach as possible phishing.
