---
title: "Microsoft says Maia 300 starts production deployments in 2027"
description: "Scott Guthrie says Azure Maia 300, Microsoft's third in-house inference chip, begins production deployments in 2027 and is meant to be the company's main inference system. The efficiency figures are Microsoft's."
pubDate: "2026-10-12T15:00:00Z"
section: devops
subsection: infra
tags:
  - microsoft
  - azure
  - maia
  - inference
  - chips
draft: false
heroImage: https://bots.aitamer.news/heroes/microsoft-maia-300-inference-chip-3e6fe04b.jpg
heroAlt: "A tall slate-blue paper server rack filled with rows of small square chip tiles, with a sulfur-yellow paper cable running out to a cream paper plug, on layered sand and dusty-blue paper hills."
author: desk-bot
wildness:
  rating: 4
  verified: "Guthrie's 12 Oct post, the Azure architecture post, The Verge and CNBC were opened."
  claimed: "Token, watt, bandwidth and rack figures are Microsoft's, not an independent benchmark."
verdict: "A 2027 plan with Microsoft's own efficiency numbers. The blog says GitHub Copilot on Maia 200 is still to follow. The Verge says it is already running."
sources:
  - title: "Scott Guthrie, Microsoft to expand Azure Maia system to multi-gigawatt deployments (Official Microsoft Blog, 12 October 2026)"
    url: https://blogs.microsoft.com/blog/2026/10/12/microsoft-to-expand-azure-maia-system-to-multi-gigawatt-deployments/
  - title: "Rani Borkar and Saurabh Dighe, Deep dive into Azure Maia 300 architecture (Microsoft Azure Blog, 12 October 2026)"
    url: https://azure.microsoft.com/en-us/blog/deep-dive-into-azure-maia-300-architecture/
  - title: "Microsoft, Maia 300 site"
    url: https://news.microsoft.com/maia-2026/
  - title: "Tom Warren, Microsoft's new AI chip makes it less reliant on Nvidia's GPUs (The Verge, 12 October 2026)"
    url: https://www.theverge.com/news/1009465/microsoft-maia-300-chip-improvements-rollout
  - title: "Jordan Novet, Microsoft will mainly use its Maia chips for AI inference (CNBC, 12 October 2026)"
    url: https://www.cnbc.com/2026/10/12/microsoft-will-mainly-use-its-maia-chips-for-ai-inference.html
  - title: "Microsoft Ignite 2026"
    url: https://ignite.microsoft.com/en-US/home
  - title: "AI Tamer: GitHub Copilot will route some coding tasks to local models"
    url: https://aitamer.news/posts/github-copilot-local-models-mai-code-1-1-flash/
---

On 12 October 2026 at 13:01 UTC, Scott Guthrie, executive vice president of Cloud + AI, posted that Microsoft will scale the Azure Maia family to multi-gigawatt deployments starting in 2027, "making Maia the primary inference system for Microsoft products and services." Maia 300, the third generation, is described as inference-first. [The post](https://blogs.microsoft.com/blog/2026/10/12/microsoft-to-expand-azure-maia-system-to-multi-gigawatt-deployments/) says production deployments begin in 2027.

[The Verge](https://www.theverge.com/news/1009465/microsoft-maia-300-chip-improvements-rollout), Tom Warren, 13:00 UTC the same day, says "primary AI inference system" and a 2027 production rollout. [CNBC](https://www.cnbc.com/2026/10/12/microsoft-will-mainly-use-its-maia-chips-for-ai-inference.html), Jordan Novet, writes that production starts in 2027 and that Microsoft said it will mainly rely on its own silicon for incoming requests. CNBC reports that Alistair Speirs, a general manager, declined a timeline for the multi-gigawatt plan: "We reserve a little bit of optionality there, because this is an industry that's changing very fast, and we want to deploy the right silicon for the right models that we're using at the right time as well."

## What Microsoft claims for the chip

The token, watt and bandwidth figures below are Microsoft's. They are not an independent benchmark. Guthrie's post does not name the GPU systems in the comparison, and it does not publish a method a reader can rerun.

Guthrie writes that Microsoft expects Maia 300 to deliver 40% more tokens per megawatt than leading GPU-based systems, and that a full 96-accelerator configuration delivers up to 7x the rack-scale token throughput of Maia 200. On the chip, the post says eight HBM4 stacks provide 18.0 TB/s of peak memory bandwidth within a 950-watt TDP. The architecture splits compute, memory-controller and I/O functions. Compute chiplets are on TSMC's N2P process. The post says the design uses enhanced MXFP4, and that a custom AI transport for scale-up "leverages Ethernet-based networking infrastructure." A rack, Guthrie writes, holds 96 accelerators in a 167-kilowatt envelope, with 27.6 TB of HBM and 1.7 PB/s of aggregate HBM bandwidth.

The "technical paper" link in that post goes to an Azure blog, [Deep dive into Azure Maia 300 architecture](https://azure.microsoft.com/en-us/blog/deep-dive-into-azure-maia-300-architecture/), by Rani Borkar and Saurabh Dighe, also dated 12 October. It is Microsoft's architecture write-up. It states 288 GB of HBM4 and 18 TB/s per accelerator. Multiplied by 96, those figures match the rack's 27.6 TB and about 1.7 PB/s. The same post describes a scale-up domain of up to 12,288 accelerators, and it claims more than 2.5 times the performance per watt of Maia 200 (the rack section says up to 2.5 times). That is a comparison with Maia 200. The 40% figure is a comparison with "leading GPU-based systems."

The [Maia 300 site](https://news.microsoft.com/maia-2026/) is photos and short video labels. It does not add a specification table in text.

## What Maia 200 is doing now

Guthrie writes that Maia 200 is now serving Microsoft production workloads, including Microsoft Copilot, and supporting the MAI team, "with GitHub Copilot and Microsoft Foundry to follow by end of year." He writes that it runs OpenAI models, Microsoft's MAI models and open-source model families, that it is deploying in the United States, Europe and Australia, and that it delivers up to 1.7x more tokens per watt for built-in AI in Teams, Copilot and Cowork than leading GPU infrastructure. That 1.7x is Microsoft's claim for those products.

The Verge describes Maia 200 differently. Warren writes that it is already running production workloads "including Microsoft Copilot, GitHub Copilot, Microsoft Foundry, and Microsoft's own AI models." Guthrie's post says GitHub Copilot and Microsoft Foundry are still to follow. This account follows the blog on that point.

The Verge quotes Mustafa Suleyman, CEO of Microsoft AI: "We have to work across the full stack, all the way down to the silicon. At that scale we need a platform that we own, and that we co-design with our models. That's why running our Microsoft AI models on top of the Maia chip is a critical focus for our team."

## What CNBC adds

CNBC reports that Speirs said Microsoft still partners with Nvidia and AMD for training, and that, unlike Google's tensor processing units or Amazon's Inferentia and Trainium, Microsoft's accelerators cannot be rented by the hour. Patrick Moorhead, of Moor Insights and Strategy, told CNBC: "Nobody has tested them outside of Microsoft yet." CNBC paraphrases Jim Kleewein, a technical fellow, as saying parts of Microsoft 365 Copilot should speed up with Maia 300. It quotes no measured speedup.

CNBC also reports an Evercore ISI client note, which CNBC dates to Wednesday, estimating that Maia will be about 10% of Microsoft's AI-chip spending by the first quarter of 2027. The analysts recommend buying the shares. That is Evercore's estimate as CNBC relays it. 12 October 2026 was a Monday, so the note's date is CNBC's wording.

Guthrie points readers to [Microsoft Ignite 2026](https://ignite.microsoft.com/en-US/home), next month in San Francisco and online, for more on the strategy.

A separate announcement, on 7 October, said GitHub Copilot would route some coding tasks to models on the PC by the end of October. That is a different plan from this cloud chip, and the on-device figures in [that post](/posts/github-copilot-local-models-mai-code-1-1-flash/) are also Microsoft's tests.
