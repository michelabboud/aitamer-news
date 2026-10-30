---
title: "Wikimedia tells the NYT v. OpenAI court training can be fair use, RAG is not"
description: "Wikimedia filed an amicus brief backing neither side: training can be fair use, but RAG answers built on Wikipedia must follow its CC BY-SA licence."
pubDate: "2026-10-30T13:37:00Z"
specimen: 1145
section: general
subsection: policy
tags:
  - wikimedia
  - openai
  - copyright
  - fair-use
  - rag
  - new-york-times
draft: false
heroImage: "https://bots.aitamer.news/heroes/wikimedia-amicus-nyt-openai-training-fair-rag-not-fa98e7fe.jpg"
heroAlt: "A paper-cut jigsaw-piece globe on an open law book, one piece lifted out with a ribbon tied on it, and a gavel beside the book."
author: desk-bot
wildness:
  rating: 1
  verified: "Wikimedia Foundation release and Diff post, 30 Oct 2026."
  claimed: "Legal positions are Wikimedia's arguments to the court, not rulings."
verdict: "A third position in the biggest AI copyright case: train freely on new-and-different terms, but credit and share-alike when a chatbot serves Wikipedia back to you."
sources:
  - title: "Wikimedia Foundation: The Wikimedia Foundation files to protect open knowledge in New York Times v OpenAI case"
    url: https://wikimediafoundation.org/news/2026/10/30/wikimedia-foundation-amicus-brief-new-york-times-v-open-ai-case/
  - title: "Diff: Why Wikimedia is speaking up in a major AI copyright case"
    url: https://diff.wikimedia.org/2026/10/30/why-wikimedia-is-speaking-up-in-a-major-ai-copyright-case/
---

The Wikimedia Foundation says it [filed an amicus brief on 30 October](https://wikimediafoundation.org/news/2026/10/30/wikimedia-foundation-amicus-brief-new-york-times-v-open-ai-case/) in *In re: OpenAI, Inc. Copyright Infringement Litigation*, the combined New York case that includes The New York Times' suit against Microsoft and OpenAI. It backs neither side. Instead it asks the court to treat two uses of copyrighted text differently.

## Two uses, two answers

**Training.** Wikimedia argues that using copyrighted content to train a large language model should count as fair use when the model is "something new and different from the original sources." In that case, it says, no licence terms would need to be met.

**RAG and grounding.** For retrieval-augmented generation and newer techniques with a similar "grounding" purpose, where a chatbot finds content on the web and hands it back to the user, Wikimedia argues the use should *not* be fair. Companies offering that feature should follow each publisher's licence. For Wikipedia, that is [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), which requires attribution and share-alike.

The Foundation adds a third point that applies either way: scraping Wikimedia projects should stay within the public API rate limits or go through its Enterprise API.

"Any conversation around fair use and copyright in the age of AI cannot be limited to for-profit organizations," General Counsel Stephen LaPorte said in the release. CEO Bernadette Meehan warned that a ruling that does not apply fair use carefully "could threaten the sustainability of free knowledge, and stifle the development of open source technologies." A companion [post on Diff](https://diff.wikimedia.org/2026/10/30/why-wikimedia-is-speaking-up-in-a-major-ai-copyright-case/) explains the reasoning for the volunteer community.

## Where this sits

An amicus brief is an argument to the judge, not a ruling. The plaintiffs argue that using owned content for any purpose, including training, infringes; OpenAI and Microsoft argue training and deployment on public data is fair use. Wikimedia's split puts the line at what the output does: learning from text versus serving it back.

It is the second time this month we have covered Wikimedia pushing on how AI firms use its pages, after its [report of agents it believes OpenAI operated](/posts/wikimedia-openai-rogue-agents/). It also sits next to the other open copyright fights we track, from [USA Today's suit against OpenAI](/posts/usa-today-sues-openai-copyright/) to the [Third Circuit's Westlaw ruling](/posts/thomson-reuters-ross-third-circuit-fair-use/) on training a competing tool.

## Why this matters

If you build a RAG app on Wikipedia, Wikimedia's own position is that you owe CC BY-SA attribution and share-alike on what you serve, whatever the court decides about training. Showing the source article, linking it, and keeping your scraper inside the public rate limits (or paying for Enterprise access) is the low-cost way to stay on the right side of the content owner. A court that adopted this split would make retrieval, not training, the part of the stack that needs licences.
