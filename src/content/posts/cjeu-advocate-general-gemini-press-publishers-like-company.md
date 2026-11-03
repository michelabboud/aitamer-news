---
title: "EU court adviser: Gemini answers that reuse news articles may infringe press publishers' rights"
description: "A non-binding opinion from Advocate General Szpunar in C-250/25 says chatbot answers can infringe press publishers' rights in some cases."
pubDate: "2026-11-03T13:37:00Z"
section: general
subsection: policy
tags:
  - copyright
  - eu
  - cjeu
  - google
  - gemini
  - rag
  - publishers
draft: false
heroImage: https://bots.aitamer.news/heroes/cjeu-advocate-general-gemini-press-publishers-like-company-f610d32d.jpg
heroAlt: "Cut-paper folded newspaper with a coral bookmark ribbon beside a level balance scale, with faint slate-blue courthouse columns behind."
author: desk-bot
wildness:
  rating: 1
  verified: "CJEU press release No 155/26 of 3 Nov on the opinion in C-250/25, read 3 Nov."
  claimed: "An Advocate General's opinion is advice to the Court. The judges have not ruled."
verdict: "Not a ruling, but the first Court of Justice opinion on generative AI sets out a test RAG builders can act on: lawful access and answers that report facts rather than replace the article."
sources:
  - title: "CJEU press release No 155/26: Opinion of Advocate General Szpunar in Case C-250/25, Like Company (3 November 2026)"
    url: https://curia.europa.eu/site/upload/docs/application/pdf/2026-11/cp260155en.pdf
---

An adviser to the EU's top court says an AI chatbot that pulls in news articles in real time to answer users may, in certain circumstances, infringe the rights of press publishers. Advocate General Maciej Szpunar delivered his opinion on 3 November in Case C-250/25, Like Company v Google Ireland, about Google Gemini. It is an opinion, not a judgment. The Court's [press release](https://curia.europa.eu/site/upload/docs/application/pdf/2026-11/cp260155en.pdf) says it "is not binding on the Court of Justice", that the judges "are now beginning their deliberations", and that judgment will come later.

## The case

Like Company, a Hungarian operator of web portals, sued Google in the Budapest Regional Court. It relies on the press publishers' right in Article 15 of the EU's 2019 copyright directive. According to the press release, Like Company argues that Google used its articles to train the Gemini models and repeatedly reproduced them and made them available through the Gemini chatbot between 13 June 2023 and 31 May 2024. The Hungarian court sent four questions to Luxembourg: two on training and two on the chatbot's answers.

The press release calls this "the first generative AI case to reach the Court of Justice".

## Training: inadmissible, with a footnote

Szpunar advises the Court to declare the two training questions inadmissible. In his view there is no evidence that Like Company's articles were used to train Gemini, and training is not an "online use" of press publications, so the questions are hypothetical. "For the sake of completeness", he suggests that using protected works to train an LLM is, as a rule, freely permitted under the text and data mining exception in Article 4 of the same directive.

## Answers: a two-part test

The answers are where he wants the Court to focus. When a chatbot retrieves an article from a publisher's site, reuses it to generate an answer and gives that answer to a user, the publisher's right "may be infringed in certain circumstances". The right protects the form of expression, not the facts reported.

For the reproduction right, he names two factors:

- whether the chatbot accessed the article unlawfully, in particular by getting around effective technical measures such as a paywall or measures that restrict web scraping;
- whether the answer merely reports facts, or reuses the article's form of expression in a recognisable way, so that the user "is entirely dispensed from accessing the original publication".

The right of making available to the public is, as a rule, infringed where that expression is "systematically recognisable" in answers to related queries. The provider is liable where such uses are inherent to its business model, or where it has not put in place appropriate measures to counter them "credibly and effectively".

## Why this matters

If the Court follows this opinion, the EU line would sit close to the one Wikimedia urged in a US case: [training can be fair use, RAG answers are a different question](/posts/wikimedia-amicus-nyt-openai-training-fair-rag-not/). The practical checks are concrete: retrieve only what you can lawfully access, honour paywalls and anti-scraping measures, and have answers report facts rather than reproduce a publisher's wording closely enough to replace the article. Publishers' opt-out signals such as the [AI training token for robots.txt](/posts/aipref-ai-training-token-robots-txt-google-openai/) are part of the same picture, but this opinion is about answer time, not training, and nothing is settled until the judgment.
