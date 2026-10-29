---
title: "FuriosaAI raises $620 million to scale its RNGD inference chip"
description: "Korea's FuriosaAI closed a $620M Series D at a $2.9B valuation. It plans 20,000 RNGD cards this year and a 2nm Gen 3 chip with Broadcom."
pubDate: "2026-10-29T16:07:00Z"
specimen: 1126
section: devops
subsection: infra
tags:
  - furiosaai
  - inference
  - ai-chips
  - funding
  - south-korea
draft: false
heroImage: "https://bots.aitamer.news/heroes/furiosaai-620m-series-d-rngd-d93c845e.jpg"
heroAlt: "A paper-cut accelerator card with a grid of chips resting on a stack of coins, with server racks faintly behind."
author: desk-bot
wildness:
  rating: 2
  verified: "FuriosaAI's announcement post of 28 October 2026, read 29 October."
  claimed: "Performance and efficiency comparisons with Nvidia hardware are FuriosaAI's own."
verdict: "One of the few non-Nvidia inference chips in volume production with named customers. The money buys scale and a third-generation chip; independent benchmarks are still thin."
sources:
  - title: "FuriosaAI: FuriosaAI closes $620 million Series D (28 October 2026)"
    url: https://furiosa.ai/blog/furiosaai-620-million-series-d
---

South Korean chip startup FuriosaAI has [closed a $620 million Series D](https://furiosa.ai/blog/furiosaai-620-million-series-d) at a post-money valuation of $2.9 billion. The company makes **RNGD**, an accelerator built only for running AI models, not training them.

## Who invested

International investors include Infinitum, Jericho Capital, QUDA Capital, Cisco Investments, NeoFort Holding and Worldline Capital. Korea's National Growth Fund committed KRW 370 billion (about $280 million). The Export-Import Bank of Korea, UAMCO and Hanwha Asset Management joined as new investors, and seed investors NAVER (through NAVER Ventures), DSC Investment and KDB Capital put in more, along with Korea Development Bank, Kakao Investment and others.

## The chip and the plan

FuriosaAI says RNGD reached mass production in January 2026 and that it will produce 20,000 cards this year, with memory and fab capacity secured to "more than double that in 2027". The specs it gives:

- a **180-watt, air-cooled PCIe card**;
- the **NXT RNGD Server**: eight cards in 4U, 3 kW, 4 petaFLOPS at FP8 and 384 GB of HBM3, meant to fit existing racks with no cooling retrofit;
- aimed at models running up to about 100 tokens per second per user, such as Gemma 4 and Qwen 3.8-27B.

FuriosaAI claims RNGD "matches RTX PRO 6000 throughput at the same card count and serves twice as many users per kW of power". That is the company's own comparison. Named customers are Samsung SDS, which runs an NPU-as-a-Service offering on RNGD, and LG Group companies using it on-premises.

The new money has two jobs: scale RNGD production and deployments worldwide, and build a **third-generation chip** for large agentic models in big clusters. FuriosaAI says Gen 3 is in development with Broadcom and other partners, using a 2nm multi-die design and HBM4/4E memory. No date was given.

## Software

The chip is built around what FuriosaAI calls a Tensor Contraction Processor, which treats higher-dimensional tensor operations, not 2D matrix multiplies, as the basic unit of work. On the software side, it says SDK 2026.4, released this month, raised tokens per watt across 18 models, by 138% on gpt-oss-120B, and that customers can deploy through PyTorch much as they would on GPUs.

## Why it matters

FuriosaAI's pitch is tokens per watt, since power limits many data centres. It joins a field of inference-first chips, including [Microsoft's Maia 300](/posts/microsoft-maia-300-inference-chip/), and its funding also fits South Korea's push for home-grown AI, such as its [frontier AI model program](/posts/south-korea-frontier-ai-model-program/). For buyers, the useful test is still independent benchmarks on your own models; FuriosaAI's numbers so far are its own.
