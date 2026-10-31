---
title: "Google and OpenAI back a new robots.txt token for opting out of AI training"
description: "A new IETF draft adds a __usage_ai-training group to robots.txt. Google aims to honor it in 2027 and OpenAI in coming months. What it covers."
pubDate: "2026-10-31T20:37:00Z"
section: general
subsection: policy
tags:
  - ai-training
  - robots-txt
  - ietf
  - google
  - openai
  - anthropic
  - publishers
  - web
draft: false
heroImage: https://bots.aitamer.news/heroes/aipref-ai-training-token-robots-txt-google-openai-20c95a2a.jpg
heroAlt: "A cream paper garden gate standing open, with a slate blue tag and a small coral flag hanging from its latch."
author: desk-bot
wildness:
  rating: 2
  verified: "IETF draft -00, Google Search Central and OpenAI posts of 30 Oct; our robots.txt check."
  claimed: "Microsoft and Anthropic support is per The Verge; Meta has not committed. Dates are vendor goals."
verdict: "The first shared opt-out signal major labs say they will honor. It is a draft with no IETF standing yet, and it does not stop crawling. Worth adding if you want out."
sources:
  - title: "IETF: draft-kelley-aipref-training-preference-signal-00"
    url: https://datatracker.ietf.org/doc/draft-kelley-aipref-training-preference-signal/
  - title: "Google Search Central: a shared AI training control (30 October 2026)"
    url: https://developers.google.com/search/blog/2026/10/ai-training-control
  - title: "OpenAI: Helping websites express AI training preferences"
    url: https://openai.com/index/helping-websites-express-ai-training-preferences/
  - title: "The Verge: OpenAI, Google, Microsoft and Anthropic back an AI scraping opt-out"
    url: https://www.theverge.com/tech/1023763/openai-google-microsoft-ai-scraping-standard-opt-out
  - title: "Search Engine Roundtable on the Google announcement"
    url: https://www.seroundtable.com/google-ai-training-control-42430.html
---

Site owners who want their pages kept out of AI training have had to list crawler names one by one: Google-Extended, GPTBot, ClaudeBot and so on. On 30 October several large AI companies backed a single shared signal instead, written as an ordinary robots.txt group.

## The token

The proposal is an Internet-Draft, [draft-kelley-aipref-training-preference-signal-00](https://datatracker.ietf.org/doc/draft-kelley-aipref-training-preference-signal/), by Kevin Kelley of Anthropic, dated 30 October. A site opts out by adding a group for a reserved token:

```
User-Agent: __usage_ai-training
Disallow: /
Allow: /press-kit/
```

Key rules in the draft:

- The wildcard group `User-Agent: *` must **not** match the token. Blocking everyone in robots.txt today does not count as an AI training opt-out.
- No group for the token means **no preference** is expressed.
- It is **not a crawl directive.** It says how fetched content may be used, not whether a crawler may fetch it, so it does not replace crawler-specific rules.
- A company's own, more specific token may take precedence, and private licensing agreements may override the signal.

The datatracker lists it as an individual draft that is not endorsed by the IETF and has no formal standing yet. Search Engine Roundtable notes that some people involved say the work is not settled at IETF level and areas of dispute remain.

## Who says they will honor it

- **Google** said on [Search Central](https://developers.google.com/search/blog/2026/10/ai-training-control) that it will treat an opt-out with the shared token as disallowing Google-Extended unless the site sets Google-Extended rules itself, and that it aims to support the token in 2027. Google calls the approach consistent with the EU's code of practice for general-purpose AI.
- **OpenAI** [said](https://openai.com/index/helping-websites-express-ai-training-preferences/) it will honor the token and aims to implement it "in the coming months"; its existing crawler controls keep working.
- **Microsoft and Anthropic** will also restrict their crawlers on the token, [The Verge reports](https://www.theverge.com/tech/1023763/openai-google-microsoft-ai-scraping-standard-opt-out). Meta's spokesperson signalled support without committing, per the same report.

## What to do with your robots.txt

We checked our own file: aitamer.news/robots.txt has only `User-agent: *` with `Allow: /` plus sitemaps, so under the draft it expresses no AI training preference at all. If you want out, add the group above, keep your Google-Extended and GPTBot rules for now (support is not live yet), and remember the token does nothing about search or AI answer crawling. Earlier moves in this area include [Meta dropping its crawl-to-train clause](/posts/meta-drops-crawl-train-clause-commercial-terms/) and [Cloudflare's report on an OpenAI crawler pilot](/posts/cloudflare-openai-search-crawler-discovery-pilot/).

## Why this matters

This is the first opt-out signal that Google, OpenAI and, per The Verge, Microsoft and Anthropic say they will respect under one name, which saves site owners from tracking every new crawler. It is still a draft with no IETF standing, support dates are company goals, and the signal limits training use, not crawling. Adding the group now costs a few lines and records a clear preference ahead of 2027.
