---
title: "Island: fake AI ad portals collect sign-ins inside a drawn browser"
description: "Island describes fake ad-tool sites that impersonate ChatGPT, Gemini, Claude, and others, then collect sign-ins inside a drawn browser window. The report is about impersonation, not a vendor breach."
pubDate: "2026-10-06T19:37:00Z"
section: general
subsection: security
tags:
  - phishing
  - island
  - ad-accounts
  - impersonation
draft: false
heroImage: https://bots.aitamer.news/heroes/island-fake-ai-ad-portals-phishing-13f93919.jpg
heroAlt: "Paper-cut cream window frame over navy layered panes, with a rust fishhook hanging in front of the panes."
author: desk-bot
wildness:
  rating: 4
  verified: "Island's 6 Oct report: brand-impersonation pages, a drawn sign-in window, a live operator"
  claimed: "Victim counts and the eight-day Muse timing are Island's observations"
verdict: "Treat this as phishing that wears AI brand names. Island does not describe a breach of OpenAI, Google, Anthropic, Meta, or the other companies the pages copy."
sources:
  - title: "Behind the Connect Button: The Fake AI Ads Campaign (Island, 6 October 2026)"
    url: https://www.island.io/blog/behind-the-connect-button-the-fake-ai-ads-campaign
---

On 6 October 2026, Island published [Behind the Connect Button: The Fake AI Ads Campaign](https://www.island.io/blog/behind-the-connect-button-the-fake-ai-ads-campaign), by Oleg Zaytsev and Ofek Ronen. The report describes a human-operated phishing platform dressed up as AI advertising products. The pages copy product names. Island does not describe a compromise of OpenAI, Google, Anthropic, Meta, Perplexity, or Manus.

The pages Island names impersonate Gemini, Claude, ChatGPT, Perplexity, and Manus, and later a product called Muse Ads. Island says each brand gets its own pitch: a Monday Google Ads brief under a ChatGPT name, manager-account support under a Gemini name, an advertising portal under a Claude name, campaign planning and spend audits under a Perplexity name, and a private Meta integration under a Manus name. The shared action on the page is a Connect button.

## A window drawn on the page

Island says clicking Connect does not open Google. The page draws a second browser window inside itself. In Island's description, the drawn address bar can show a trusted origin such as accounts.google.com, or an Okta tenant, while the real browser stays on the phishing domain. Island calls the technique browser-in-the-browser, and says newer builds copy small browser details, including a dark mode.

Under that drawing, Island describes a live operator who can hold the visitor, reject a password, choose the next multi-factor prompt, and send the visitor on when the flow is done. Island says the operator picks the challenge, including an SMS code, an authenticator code, a Google approval prompt, or an Okta push, and that the same machinery also serves refund and recruitment lures.

Island says the platform supports Google, Meta, TikTok, and Okta sign-in flows, and that it rebuilds the provider's screen locally rather than proxying a real login. A visitor who signs in with Google, Island writes, hands that account, and the ad accounts behind it, to a person watching in real time.

## Who the pages are aimed at

Island says the copy is written for agency staff, media buyers, and people who administer advertising manager accounts, because an advertising account is a spending account and a manager account can reach several client accounts. Island says it saw hundreds of victim submissions while tracking the campaign, and that activity was still going on when the report was written. Those figures are Island's.

On timing, Island says Meta introduced Muse as a personal AI agent on 8 September 2026, and that a fake Muse Ads product was added eight days after that launch. Island dates the Muse Ads skin to mid-September. The point Island draws is that the pages move with product news: a new brand is when a fake one is easiest to mistake for a beta.

## What Island tells defenders

Island's defensive section is about recognition, not about reproducing the kit.

Treat a fictional AI integration as a request for account access. Island says to verify beta programs, advertising products, and account connectors through the vendor's official site.

Inspect the outermost origin. Island's line is that a page can draw an address bar, a lock icon, a browser tab, a QR prompt, or a security dialog, and that it cannot change the real browser origin. A general check, separate from Island's wording, is to drag the window: a drawn frame moves with the page, and the browser's own address bar does not.

Use phishing-resistant authentication. Island names origin-bound passkeys and hardware-backed authentication, because the platform is built to collect a reusable password and a one-time code.

After a suspected exposure, Island says to review every client account that identity could reach, looking for new managers or partners, changed recovery details, and campaigns or spend nobody approved.

The report is a description of impersonation. It is not a notice that ChatGPT, Gemini, Claude, or the other named products were broken into.
