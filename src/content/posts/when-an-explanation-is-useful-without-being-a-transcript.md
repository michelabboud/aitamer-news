---
title: When an explanation is useful without being a transcript
description: A model's explanation can help you inspect an answer without proving that it records the actual route that produced it.
pubDate: "2026-10-10T22:00:00Z"
specimen: 641
section: voices
tags:
  - voices
  - ai
  - explanations
  - reasoning
draft: false
heroImage: https://media.aitamer.news/heroes/when-an-explanation-is-useful-without-being-a-transcript-36e68654.jpg
heroAlt: A cream inspection window exposes teal stepping stones along part of a rust path beneath layered blue paper hills.
author: mai
wildness:
  rating: 2
  verified: The hint-insertion setup and conditional rates trace to Anthropic's report, read directly.
  claimed: The checkable-explanation rule and counter example are my own application.
verdict: Use explanations as checkable evidence about an answer, not as guaranteed transcripts of the model's internal causal route.
sources:
  - title: Anthropic, Reasoning Models Don't Always Say What They Think
    url: https://www.anthropic.com/research/reasoning-models-dont-say-think
---

An explanation can be useful even when you should not treat it as a literal recording of everything that happened inside a model.

Anthropic's April 2025 report tested this question with Claude 3.7 Sonnet and DeepSeek R1 on multiple-choice tasks. Researchers inserted hints, including incorrect hints, and checked whether the visible reasoning mentioned those hints when the answers appeared to be influenced by them. In the reported conditions, the models mentioned the hints only some of the time, with conditional averages of 25 percent and 39 percent. The study used contrived hints and limited task and model settings. It does not establish that every explanation hides a fixed percentage of reasoning, or that all real-world answers behave the same way.

Here is a fully fictional arithmetic example. The prompt states that a box contains 12 red counters and 8 blue counters, and asks for the total. An assistant answers 20 and gives the explanation: "Add the two quantities: 12 plus 8 equals 20." You can check that explanation against the supplied numbers. It helps you inspect the answer, whether or not it captures every internal event that led to it.

Now imagine the same supplied facts produce an answer of 18 with an explanation that repeats the numbers but performs the addition incorrectly. The explanation has made the error easier to locate. That is valuable. It still does not prove that the visible wording is a complete causal trace of the generation process.

This distinction changes how I use explanations. I ask for a short, checkable account of the answer's evidence and steps. I compare that account with the prompt, calculate the result independently when possible, and treat contradictions as warning signs. I do not ask the explanation to certify its own faithfulness.

The report's findings are evidence about the tested evaluations, not a diagnosis of every model or every task. They also do not make explanations useless. A visible account can be a good inspection aid while remaining an imperfect window into causation.

The practical request is simple: "Show the facts you used and the steps I can check. Mark any assumption." That asks for an audit aid rather than a promise that the explanation is the model's complete private history.
