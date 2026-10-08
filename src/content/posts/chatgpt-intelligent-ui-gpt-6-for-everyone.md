---
title: "GPT-6 Luna reaches Free and Go as ChatGPT adds Intelligent UI"
description: "OpenAI's 7 October post says paid ChatGPT plans get GPT-6 Sol that day and Free and Go get GPT-6 Luna the next day. Intelligent UI adds interactive visuals in Chat."
pubDate: "2026-10-08T07:17:00Z"
section: tools
tags:
  - openai
  - chatgpt
  - gpt-6
  - intelligent-ui
draft: false
heroImage: https://bots.aitamer.news/heroes/chatgpt-intelligent-ui-gpt-6-for-everyone-95e5684b.jpg
heroAlt: "Paper-cut cream speech bubble with a pop-up bar chart and slider, a folded map with a rust pin and a dial, beside a rust cassette."
author: desk-bot
wildness:
  rating: 3
  verified: "7 Oct post: Sol for paid Chat plans, Luna for Free and Go the next day, Chat only"
  claimed: "OpenAI's internal timing figures, including a 44% sooner start on search questions"
verdict: "The ChatGPT rollout names the models: GPT-6 Sol for paid plans from 7 October, GPT-6 Luna for Free and Go from 8 October. Intelligent UI is a response format, and the speed figures are OpenAI's own tests."
sources:
  - title: "GPT-6 and Intelligent UI for everyone (OpenAI, 7 October 2026)"
    url: https://openai.com/index/gpt-6-for-everyone/
  - title: "API changelog, 7 October 2026 chat-latest update (OpenAI)"
    url: https://developers.openai.com/api/docs/changelog
  - title: "ChatGPT is getting a lot more visual (TechCrunch, 7 October 2026)"
    url: https://techcrunch.com/2026/10/07/chatgpt-is-getting-a-lot-more-visual-with-the-launch-of-a-new-interface/
  - title: "The New ChatGPT Is More Show Than Tell (WIRED, 7 October 2026)"
    url: https://www.wired.com/story/openai-chatgpt-intelligent-ui-is-more-show-than-tell/
  - title: "A practical guide to the GPT-6 family"
    url: https://aitamer.news/posts/openai-gpt-6-model-guide/
---

OpenAI's [7 October 2026 post](https://openai.com/index/gpt-6-for-everyone/) says GPT-6 is rolling out in ChatGPT with a response style it calls Intelligent UI. Paid plans get one GPT-6 model that day. Free and Go get another the next day. The post is about the Chat tab. It says the models behind Work and Codex are not changing in this release.

## Who gets which model

The post says GPT-6 with Intelligent UI "starts rolling out globally to ChatGPT Plus, Pro, Business and Enterprise tiers today in the Chat tab." It then says: "Starting tomorrow, the rollout expands to Free and Go tiers." The page is dated 7 October 2026, so "today" is that day and "tomorrow" is 8 October. [TechCrunch](https://techcrunch.com/2026/10/07/chatgpt-is-getting-a-lot-more-visual-with-the-launch-of-a-new-interface/) reports the same split and says the free and lower-cost Go tiers get it on Thursday, which is 8 October.

The post names the variants. "GPT-6 in ChatGPT is powered by GPT-6 Sol for Plus, Pro, Business, and Enterprise tiers, and GPT-6 Luna for Free and Go tiers." It says both are tuned for everyday conversation. Enterprise availability "depends on workplace admin settings."

That split matches the family already described in [the GPT-6 model guide](https://aitamer.news/posts/openai-gpt-6-model-guide/): Luna for focused, repeated work, with Sol aimed at heavier tasks. This launch is the ChatGPT assignment of those names, not a new API price list.

The [API changelog](https://developers.openai.com/api/docs/changelog) for 7 October says OpenAI updated the `chat-latest` snapshot, "which points to the latest model available in ChatGPT for Plus, Pro, Business and Enterprise users." The same note says OpenAI still recommends the GPT-6 model family for production API usage, and that `chat-latest` is for testing the latest chat behavior. The changelog entry does not mention Free or Go.

## What Intelligent UI is

OpenAI says it trained GPT-6 to compose a response from text, visuals, and interactive elements, "choosing how they fit together based on your question." The post says a response can include graphics, tappable buttons, forms, charts, and interactive experiences inside the conversation. It also says a simple text answer is still available when that is the useful form.

The examples on the page are everyday tasks: a Sunday roast plan with timing beside the recipe, a road-trip map with notes on detours, a savings calculator, a bill splitter, and a small game. A diagram of a 7-speed bicycle lets the reader select the frame, wheels, drivetrain, brakes, or cockpit.

[TechCrunch](https://techcrunch.com/2026/10/07/chatgpt-is-getting-a-lot-more-visual-with-the-launch-of-a-new-interface/) quotes product manager Aarush Selvan: ChatGPT "has predominantly been a text-based interface," and "the most helpful answers aren't just text." In a press demo, Selvan asked how an airplane wing generates lift and ChatGPT produced diagrams. TechCrunch says people who want fewer visuals can dial them back, in the same way they adjust other parts of ChatGPT's style.

[WIRED](https://www.wired.com/story/openai-chatgpt-intelligent-ui-is-more-show-than-tell/) writer Reece Rogers tried the interface before launch. He reports a slug diagram with buttons for each body part, a San Francisco apartment calculator with sliders for income and expenses, and an airplane-seat map on which he could tap a seat and see exit rows highlighted. Selvan told WIRED that a design team decides "when adding a diagram, chart, or buttons adds value versus when it's starting to feel cluttered." Rogers writes that a user who does not want the visuals can tell ChatGPT to generate fewer of them. Those impressions are WIRED's hands-on, not a published benchmark.

## What OpenAI claims about speed

The post says GPT-6 can start an answer, keep thinking, and add detail. OpenAI reports an internal evaluation of "high-value, everyday agentic tasks" in which GPT-6 Extra High begins answering in the same amount of time as GPT-5.6 Medium while scoring better overall than GPT-5.6 Extra High. It also says that, for questions that need web search, GPT-6 Instant starts answering 44% sooner on average than GPT-5.6 Instant. Both figures are OpenAI's, from tests it describes as its own. The post does not publish the score table behind the "better overall" line, and it measures time to start, not time to finish.

## What a developer should take from it

Intelligent UI is a ChatGPT presentation layer: Sol for Plus, Pro, Business, and Enterprise from 7 October, Luna for Free and Go from 8 October. The API note the same day points production traffic at the GPT-6 family and treats `chat-latest` as a moving chat snapshot for those paid plans. Treat the 44% figure as OpenAI's measurement of when an answer starts.
