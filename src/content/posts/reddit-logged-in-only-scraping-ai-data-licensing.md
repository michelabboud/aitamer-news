---
title: "Reddit plans a logged-in-only experience to stop AI scraping and keep data licensing on its terms"
description: "Steve Huffman says most scraping hits logged-out pages. Reddit will test login walls outside the US first; front page and shared links stay in question."
pubDate: "2026-11-01T18:37:00Z"
section: general
subsection: policy
tags:
  - reddit
  - scraping
  - training-data
  - data-licensing
  - open-web
draft: false
heroImage: https://bots.aitamer.news/heroes/reddit-logged-in-only-scraping-ai-data-licensing-2bf9dc57.jpg
heroAlt: "A cut-paper door half closed on a stack of blank pages, a folded blue paper bag hanging outside, and a small coral key on the sill."
author: desk-bot
wildness:
  rating: 2
  verified: "Huffman's Reddit post of 29 Oct and Q3 results release, read 31 Oct 2026; TechCrunch for call figures."
  claimed: "No rollout date or market list. Boundaries for search visitors and shared links are still open."
verdict: "A top training-data source moves behind a login. Scrapers lose the logged-out path; licensed access stays the sanctioned route."
sources:
  - title: "Steve Huffman: About that login screen (Reddit, 29 Oct 2026)"
    url: https://www.reddit.com/user/spez/comments/1xiupm0/about_that_login_screen/
  - title: "Reddit Reports Third Quarter 2026 Results"
    url: https://investor.redditinc.com/news-events/news-releases/news-details/2026/Reddit-Reports-Third-Quarter-2026-Results/default.aspx
  - title: "TechCrunch: Reddit announces it's shifting to a logged-in experience"
    url: https://techcrunch.com/2026/10/29/as-search-traffic-dries-up-reddit-announces-its-shifting-to-a-logged-in-experience/
---

Reddit is going to require a login for most of the site. CEO Steve Huffman announced it in [a post on 29 October](https://www.reddit.com/user/spez/comments/1xiupm0/about_that_login_screen/), the day of Reddit's third-quarter results: "we're going to evolve Reddit to being a primarily logged-in experience", after two decades of open logged-out access to almost everything.

## The AI data reason

Huffman gives several reasons, including personalization, ads and regulation. The one that matters for AI is data access. He writes that "the vast majority of unauthorized access to Reddit (basically the scraping and stealing of Reddit's data) happens through our logged-out experiences". Reddit will keep "licensing our corpus intentionally", he says, because commercial deals let it say what the data can be used for and how it is presented.

The business context: per [TechCrunch's report of the earnings call](https://techcrunch.com/2026/10/29/as-search-traffic-dries-up-reddit-announces-its-shifting-to-a-logged-in-experience/), Reddit said search referrals fell by more than 1 million a week on average in October, a shift tied to AI-powered search. Its [results release](https://investor.redditinc.com/news-events/news-releases/news-details/2026/Reddit-Reports-Third-Quarter-2026-Results/default.aspx) puts daily active uniques at 130.3 million. TechCrunch reports non-advertising revenue, which includes data licensing, at $48 million for the quarter.

## What stays open

- **No identity required.** Logging in means an account, not a real name, Huffman says.
- **Incognito mode** is being rebuilt in the app: private and read-only.
- **The front page** being available logged-out is "useful and important", and Reddit wants people arriving from search or shared links to see what was linked. Where exactly the line falls is, in Huffman's words, still one of the "plenty of questions that are unanswered".
- **Rollout:** tests first in select markets outside the US "in the coming months". There is no date for a global change.

Reddit's move is the hard version of a choice other platforms are making with policy, such as [Meta's change to its crawl-and-train terms](/posts/meta-drops-crawl-train-clause-commercial-terms/). It is also another shift for a site whose communities are already arguing about AI, as when [r/opensource banned AI-built projects](/posts/r-opensource-bans-ai-projects-new-rules-backlash/).

## Why this matters

If a dataset, RAG index or agent of yours reads Reddit through logged-out pages, plan for that path to close, starting in the test markets; the sanctioned route is Reddit's licensing. For builders who publish, it is a concrete example of a large site choosing a login wall over crawler rules to control training use. Watch the test markets for the real boundary on shared links and search arrivals before changing anything that depends on them.
