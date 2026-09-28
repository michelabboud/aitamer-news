---
title: "More context isn't automatically better: the rot in a model's working memory"
description: "The context window is a working memory, not a perfect one — accuracy fades as it fills, and \"just give it more text\" quietly stops working."
pubDate: 2026-09-27T22:30:00Z
specimen: 31
section: dev
tags:
  - context-window
  - context-rot
  - long-context
  - llm
  - infrastructure
  - attention
draft: false
heroImage: https://media.aitamer.news/heroes/more-context-isnt-better.jpg
heroAlt: "A paper-cut collage of a crowded worktable seen from above, covered in torn paper sheets; a desk lamp lights one coral sprig at the centre, while two more sit dim at the table's edges."
author: mai
sources:
  - title: "Context windows (Claude Platform Docs)"
    url: https://platform.claude.com/docs/en/build-with-claude/context-windows
  - title: "Long context (Gemini API Docs)"
    url: https://ai.google.dev/gemini-api/docs/long-context
wildness:
  rating: 1
  verified: "\"Context rot\" and the 1M-token ceiling are stated in primary vendor docs I opened directly."
  claimed: "The accuracy claims are each vendor's own description of its models, not independent measurements."
verdict: "The context window is a working memory that degrades as it fills. \"Just give the model more text\" isn't a strategy — curating what's inside matters as much as how much room there is."
---

A language model's context window is often described as its memory, but it is closer to a workbench: the flat surface of text the model can actually see while it answers. What matters about that surface isn't only how big it is. It's how reliably the model can still find things on it once it gets crowded.

## The window is working memory, not memory

Anthropic's documentation draws the line cleanly. The context window is "all the text a language model can reference when generating a response" — different from the enormous corpus the model was trained on. It is, the docs say, a working memory, not the whole store. A larger window lets the model handle longer prompts, but size is not a free upgrade.

The same page names the failure mode directly: as token count grows, accuracy and recall degrade, "a phenomenon known as context rot." The consequence is blunt — curating what is in context matters as much as how much space is available. A model with a million tokens of room is not a model that remembers a million tokens well.

## How big "big" got

The raw numbers are striking. Several current Claude models ship with a 1M-token context window, and a single request can generate up to 128k output tokens. Google puts the ceiling in concrete terms: Gemini was "the first model capable of accepting 1 million tokens," a size the company illustrates as roughly eight average-length English novels.

That scale changed the calculus for builders. Google's long-context guide notes that the old habits — dropping old messages, summarizing, filtering prompts, leaning on retrieval — were workarounds for a window too small to hold the whole problem. With a million tokens, the more direct approach becomes possible: hand the model everything and let it read.

## The catch: finding the needle gets harder

But "hand it everything" has a ceiling of its own, and the vendors are unusually frank about it. Google's guide describes needle-in-a-haystack retrieval as the basic case: a single piece of information, a single needle. There, the model can hit up to 99% accuracy in many cases. The moment there are multiple needles — several specific facts to pull out — accuracy drops, and performance can vary to a wide degree depending on the context.

That's the quiet part of the long-context story. A larger window doesn't remove the retrieval problem; it enlarges the haystack. The tradeoff, as Google frames it, is between getting the right information back and paying for every token you push through to find it. Bigger context doesn't make attention free — it makes it more expensive to be sloppy with.

## The failure is polite, not dramatic

The overflow behavior is worth knowing because it's the one failure a builder will actually hit. Anthropic documents it plainly: if the input alone already exceeds the window, the API returns a 400 error — "prompt is too long" — on every model. And if generation reaches the window's limit mid-answer, Claude 4.5 models and newer stop with a specific reason rather than a crash.

There's a lesson in how polite that is. Context failure doesn't look like a broken model. It looks like a request that got rejected, or an answer that stopped short. The system doesn't scream that you misjudged its memory — it just declines, or trails off, and leaves you to figure out why.

## Who should care

Anyone building on a long-context model should care, because the temptation is to treat the window as infinite and free. It is neither. The million-token window solved the problem of *fits*, not the problem of *finds*. Context rot means a model can hold your entire codebase and still miss the one function that matters — and the fix is curating what goes in, not adding more room.
