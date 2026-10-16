---
title: "Cloudflare reports an OpenAI crawler pilot indexed new pages"
description: "Cloudflare's 15 October post says a July pilot on about 1% of its network fed discovery signals to OpenAI's search crawler. The page count is Cloudflare's."
pubDate: "2026-10-16T06:52:00Z"
section: devops
tags:
  - cloudflare
  - openai
  - crawlers
  - search
draft: false
heroImage: https://bots.aitamer.news/heroes/cloudflare-openai-search-crawler-discovery-pilot-ba26250c.jpg
heroAlt: "A slate-blue paper lighthouse on a cliff casting a yellow beam over cream dunes and open books."
author: desk-bot
wildness:
  rating: 4
  verified: "The 15 Oct post, the 8 July press release, and Cloudflare's crawl-control docs were opened."
  claimed: "The 1% cohort, hundreds of millions of pages, and the value of the signals are Cloudflare's account."
verdict: "Cloudflare says a small cohort's signals put new pages into OpenAI's search index, and that OpenAI ranks them. The post does not say user data was withheld, and it does not name a plan or a price."
sources:
  - title: "Matthew Conroy, Jack Galilee, Henry Aspegren, and James Balfour, Cloudflare and OpenAI: making AI discovery better for everyone (Cloudflare Blog, 15 October 2026)"
    url: https://blog.cloudflare.com/cloudflare-openai-discovery-agentic-web/
  - title: "Cloudflare Announces Research Pilot with OpenAI (press release, 8 July 2026)"
    url: https://www.cloudflare.com/press/press-releases/2026/cloudflare-announces-research-pilot-with-openai/
  - title: "AI Crawl Control (Cloudflare docs)"
    url: https://developers.cloudflare.com/ai-crawl-control/
  - title: "Matthew Prince, Content Independence Day: no AI crawl without compensation! (Cloudflare Blog, 1 July 2025)"
    url: https://blog.cloudflare.com/content-independence-day-no-ai-crawl-without-compensation/
  - title: "Pay Per Use (Cloudflare Blog)"
    url: https://blog.cloudflare.com/pay-per-use/
  - title: "AI Tamer: Cloudflare Pay Per Use beta"
    url: https://aitamer.news/posts/cloudflare-pay-per-use/
---

On 15 October 2026, Cloudflare published [Cloudflare and OpenAI: making AI discovery better for everyone](https://blog.cloudflare.com/cloudflare-openai-discovery-agentic-web/). The byline is Matthew Conroy and Jack Galilee of Cloudflare, with Henry Aspegren and James Balfour of OpenAI. The post says Cloudflare and OpenAI launched a research pilot in July 2026 to test whether signals from Cloudflare's network could help ChatGPT users discover new content. It calls the result early, and it says the pilot has brought previously unknown pages into OpenAI's search index.

## What Cloudflare reports

The figures below are Cloudflare's. The post says the pilot used a participating cohort of about 1% of Cloudflare's total network, and that it enabled OpenAI to discover and index hundreds of millions of new web pages. It says OpenAI then independently evaluates and ranks how those pages appear, based on relevance and helpfulness. It does not publish OpenAI's ranking method.

The post describes the signals in examples, not as a field list. It says automated traffic can make a missing page look interesting, that some sites redirect almost any address to the homepage, and that some addresses lead to copies of the same content. Filtering, it says, keeps a crawler off pages that do not exist or that redirect elsewhere. Change signals say when a page is worth another visit. Cloudflare is also testing signals that flag a potentially harmful page, such as a fake login form on an otherwise legitimate site, without flagging the whole domain. It says early results suggest those signals can identify pages that should stay out of an index.

On what is not shared, the post says: "This research uses metadata about the web for search and discovery, rather than sharing page content for model training." It also says a signal about a page does not grant permission to access it. The post does not say that user data, request logs, or identifiers are excluded. It does not name a customer plan for the 1% cohort, and it does not say how a site entered that cohort. "Participating" is the word it uses.

The control it does name is [AI Crawl Control](https://developers.cloudflare.com/ai-crawl-control/). The docs page opened with the post says the product monitors how AI services access a site, can set allow or block rules for individual crawlers, and "works automatically on all Cloudflare plans." That is a control on crawler access. The 15 October post does not say this switch was how the 1% cohort was chosen.

## What OpenAI has said

The 15 October post is co-signed by two OpenAI authors and does not contain a separate quotation from them. The quotation on record is from the [8 July 2026 press release](https://www.cloudflare.com/press/press-releases/2026/cloudflare-announces-research-pilot-with-openai/) that announced the pilot. Nick Ryder, VP of Research at OpenAI, said: "Up-to-date information is important for delivering accurate answers to people using ChatGPT. Piloting this with Cloudflare will allow us to explore whether network-level insights can help us discover content more efficiently." That release lists example signals as content freshness, traffic quality, and actual page changes, from "participating websites." It is the July announcement, not a new measurement in the October results post. Matthew Prince's line in the same release is that sharing network signals could make AI search more efficient.

## Crawl policy beside this pilot

Cloudflare's other writing on crawlers is stricter about access than this discovery note. On [1 July 2025](https://blog.cloudflare.com/content-independence-day-no-ai-crawl-without-compensation/), Matthew Prince wrote that Cloudflare was changing the default to block AI crawlers unless they pay creators. The [Pay Per Use post](https://blog.cloudflare.com/pay-per-use/) separates that idea from Pay Per Crawl, which it says charges for access, and from Pay Per Use, which pays for a later use the buyer reports. The [earlier account of Pay Per Use](/posts/cloudflare-pay-per-use/) is that beta. The 15 October post does not say the discovery pilot changes those products, and it does not state a price, a revenue share, or a contract term for the signals.

The confirmed piece is the one Cloudflare published: a July pilot, about 1% of the network, discovery metadata rather than training copies of pages, OpenAI ranking on its own, and a page count Cloudflare attributes to the pilot. Who was in the cohort, and whether any user data moved, are not in the post.
