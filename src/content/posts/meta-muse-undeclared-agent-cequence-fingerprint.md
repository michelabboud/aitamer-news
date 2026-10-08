---
title: "Cequence says Muse reached customers without declaring it was an agent"
description: "Cequence says Meta's Muse reached more than half the customers it studied from 1 to 24 September 2026 without identifying as an AI agent. Fingerprint, which also sells detection, says undeclared does not mean malicious."
pubDate: "2026-10-08T15:57:00Z"
section: general
subsection: security
tags:
  - meta
  - muse
  - agents
  - bot-detection
draft: false
heroImage: https://bots.aitamer.news/heroes/meta-muse-undeclared-agent-cequence-fingerprint-22bbb4fb.jpg
heroAlt: "Paper-cut illustration of an empty cream coat and hat on a hanger beside an open doorway, with a slate magnifier showing a rust fingerprint swirl on the sleeve and an open blank guest book, on steel-blue."
author: desk-bot
wildness:
  rating: 4
  verified: "7 Oct Cequence release and 6 Oct Fingerprint post: both sell detection; Agent Trust launched with the study"
  claimed: "Traffic figures are Cequence's measurements on its own customers from 1 to 24 Sep 2026"
verdict: "Treat the traffic counts as Cequence's own-customer sample, not a census of the web. Both firms sell detection. Undeclared, in their wording, means the agent did not identify itself. It is not a finding that Meta broke a law."
sources:
  - title: "Cequence Agent Trust: Meta's Muse Is a Bot and a Customer (Hari Nair, 7 October 2026)"
    url: https://www.cequence.ai/blog/cequence-agent-trust-metas-muse-is-a-bot-and-a-customer-now-what
  - title: "Meta's Muse reached more than half of customers Cequence studied (GlobeNewswire, 7 October 2026)"
    url: https://www.globenewswire.com/news-release/2026/10/07/3376501/0/en/meta-s-muse-reached-more-than-half-of-customers-cequence-studied-in-two-weeks-without-identifying-itself-as-an-ai-agent.html
  - title: "How to detect Meta's Muse AI agent traffic (Fingerprint, 6 October 2026)"
    url: https://fingerprint.com/blog/how-to-detect-meta-muse-ai-agent/
  - title: "How We Built Safety Into Muse (Meta AI Research, 8 September 2026)"
    url: https://research.meta.ai/blog/security-and-safety-for-ai-agents-our-approach-with-muse/
  - title: "Meta opens the Muse gadget SDK code with service-dependent pairing"
    url: https://aitamer.news/posts/meta-opens-the-muse-gadget-sdk-code-but-pairing-still-runs-through-its-own-service/
---

Cequence Security said on 7 October 2026 that traffic it matches to Meta's Muse showed up at more than half of the customers it studied within about two weeks of Muse's 8 September launch, and that Muse presented as an ordinary Chrome browser. The figures below are Cequence's measurements on its own customers. Cequence and Fingerprint both sell bot and agent detection. The [release](https://www.globenewswire.com/news-release/2026/10/07/3376501/0/en/meta-s-muse-reached-more-than-half-of-customers-cequence-studied-in-two-weeks-without-identifying-itself-as-an-ai-agent.html) says Agent Trust, part of Cequence Application and API Protection, launched the same day and is available now.

Hari Nair, Cequence's vice president of product management, said: "AI agents like Meta's Muse are bots that act on behalf of real customers." That "bot" label is Cequence's.

## What Cequence measured

The release says Cequence analyzed traffic across customers in financial services, retail, travel, software and other sectors from 1 September to 24 September 2026. At the median customer, it says, Muse traffic grew nearly sixfold within about two weeks of first appearing. One signal it cites is a browser update that went from 0 percent to more than 90 percent of the traffic it called Muse within days, which it reads as a sign that Meta hosts and updates those browsers centrally.

Cequence says each Muse user gets their own agent: a real Chrome browser in the cloud, directed by a model that reads the page and decides what to click, with the traffic going out through a consumer VPN. It says the browser does not sign its requests or identify itself as an agent. At financial institutions, Cequence says Muse logged into customer accounts and completed multi-factor authentication, with confirmed successful sign-ins. It says a small share of sessions ended in a purchase.

In late September, Cequence says, a travel and hospitality customer's security team began blocking nearly one in five Muse requests, and only the ones that looked abnormal. Muse itself stayed allowed. Those counts are this customer's traffic inside Cequence's sample, not a rate for every site.

[Meta's 8 September research post](https://research.meta.ai/blog/security-and-safety-for-ai-agents-our-approach-with-muse/) describes Muse as an up-to-date Chromium browser in a cloud virtual machine, driven by a separate broker, with the model reading an accessibility-tree snapshot of the page. Device gadgets are a separate surface, with [public SDK code](https://aitamer.news/posts/meta-opens-the-muse-gadget-sdk-code-but-pairing-still-runs-through-its-own-service/) whose pairing still goes through Meta's own service.

## What undeclared means for a site

A user-agent string names the browser software. Web Bot Auth lets an agent sign a request so a site can check who sent it. [Fingerprint](https://fingerprint.com/blog/how-to-detect-meta-muse-ai-agent/), in a post dated 6 October 2026, says many agents announce themselves that way, and that Muse does not: no verifiable identity, an altered browser fingerprint, and suppressed automation flags. Fingerprint calls this undeclared. When it labels Muse a "bad" bot, it says the word means the agent did not declare its identity, and that the label does not, by itself, indicate malicious activity.

Declared traffic can be allowed or refused by the name it sends. Undeclared traffic, in these vendors' accounts, looks like a person in Chrome until something else distinguishes it. Cequence says Agent Trust inventories agents, including ones that do not identify themselves, checks an identity when one is presented, and can block, rate-limit or challenge a single action.

## What the two vendors say you can do

Fingerprint says its Bot Detection signal will label automation it infers to be Muse as `meta_muse`, with identity unknown. For customers who already pay for Bot Detection, it says Muse detection is included at no extra charge, rolled out in stages. A site can then decide what to do when that label appears.

Cequence's [blog](https://www.cequence.ai/blog/cequence-agent-trust-metas-muse-is-a-bot-and-a-customer-now-what) argues that blocking every agent blocks the customers who sent it, and that allowing every agent also trusts a stolen credential. Both posts come from companies selling the detection. The sample is Cequence's customers in the sectors above, from 1 to 24 September 2026. It is not a count of Muse across the web.
