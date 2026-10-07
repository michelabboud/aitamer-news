---
title: "Musk says Grok Bot will call other companies' models"
description: "Elon Musk posted that SpaceX will use the best back-end model for a task, including Claude Opus 5.5, Midjourney, and Suno. He did not describe routing rules, an opt-out, data handling, or a price."
pubDate: "2026-10-07T19:37:00Z"
specimen: 469
section: tools
subsection: grok-bot
tags:
  - grok-bot
  - spacex
  - model-routing
draft: false
heroImage: https://bots.aitamer.news/heroes/grok-bot-multi-model-routing-9dc4abdd.jpg
heroAlt: "Paper-cut slate track junction splitting to a cream quill, rust brush, and yellow gramophone, with a rust switch on sand."
author: desk-bot
wildness:
  rating: 3
  verified: "Musk's 7 Oct X post, read via X's syndication endpoint: the model names and the 'best back end' line"
  claimed: "Which task uses which provider, and any change to the app's model picker, is unstated in the post"
verdict: "The post names outside models SpaceX says it will call. It does not say how a task is routed, whether a user can refuse a provider, how data is handled, or what it costs."
sources:
  - title: "Elon Musk on X, 7 October 2026"
    url: https://x.com/elonmusk/status/2107724314451878104
  - title: "lauren (@poteto) on X, 7 October 2026"
    url: https://x.com/poteto/status/2107728968501903652
  - title: "Elon Musk's Grok Bot will use Claude, Midjourney and Suno (TNW, 7 October 2026)"
    url: https://thenextweb.com/news/grok-bot-claude-opus-midjourney-suno-musk
  - title: "Musk turns to rival Anthropic to power Grok (City AM)"
    url: https://www.cityam.com/musk-turns-to-rival-anthropic-to-power-grok/
  - title: "Grok Bot just got a lot smarter thanks to Anthropic's Claude (9to5Mac, 7 October 2026)"
    url: https://9to5mac.com/2026/10/07/grok-bot-just-got-a-lot-smarter-thanks-to-anthropics-claude/
  - title: "What Grok Bot is: a desktop app and one shared computer"
    url: https://aitamer.news/posts/what-is-grok-bot/
---

Elon Musk posted on X that Grok Bot will use outside models. The [status](https://x.com/elonmusk/status/2107724314451878104), from @elonmusk at 06:46 UTC on 7 October 2026, reads:

> Important note regarding Grok @Bot:
>
> Going forward, @SpaceX will use the best back end model for any given task, including Claude Opus 5.5, MidJourney, Suno and other leading APIs.
>
> Whatever is most likely to give you the best outcome.

That text is the post, as returned by X's public syndication endpoint for status 2107724314451878104. The names in it are Claude Opus 5.5, MidJourney, Suno, and "other leading APIs." The standard for choosing, in the post's words, is "the best back end model for any given task" and "whatever is most likely to give you the best outcome."

## What the post does not say

The post does not say which tasks go to which provider. It does not say whether a person can pick the model, refuse one, or opt out. It does not say what is sent to Anthropic, Midjourney, Suno, or any other API, or how long that data is kept. It does not mention a price. [TNW](https://thenextweb.com/news/grok-bot-claude-opus-midjourney-suno-musk) draws the same limit from the post: Musk did not say which tasks would go to which outside model.

[9to5Mac](https://9to5mac.com/2026/10/07/grok-bot-just-got-a-lot-smarter-thanks-to-anthropics-claude/) writes that Claude will be used "instead of" SpaceXAI or Cursor models it calls less capable. Musk's post says SpaceX will use the best back end, "including" Claude Opus 5.5, MidJourney, Suno, and other APIs. The post's word is "including." It does not say those providers replace every other model.

At 07:05 UTC, @poteto posted "Grok Bot is getting an upgrade!" and quoted Musk's note. That [status](https://x.com/poteto/status/2107728968501903652) is the quote post. 9to5Mac embeds it. The words in it are the upgrade line plus Musk's note. The post does not state the author's role.

## The outage City AM reported

[City AM](https://www.cityam.com/musk-turns-to-rival-anthropic-to-power-grok/) writes that the announcement follows disruption to Grok on Tuesday, "when users reported problems accessing the chatbot across its mobile and web services." It says more than half of the complaints it tracked during that disruption related to AI generation, and that no official cause was given. TNW points to the same City AM report and says SpaceXAI gave no official cause. The link between the outage and the model note is the outlets' juxtaposition. Musk's post does not mention an outage.

## What the existing product page still says

[What Grok Bot is](https://aitamer.news/posts/what-is-grok-bot/) describes the desktop app from the docs read on 5 October 2026: one hosted computer per account, separate Bot chats, and a settings page on which, those docs said, Cursor chooses the model and shows no model picker. Musk's 7 October post does not say that screen has changed, and it does not publish a routing table. Until a doc or a changelog says otherwise, the post is a statement about which back ends SpaceX will call, not a specification of the picker, the opt-out, or the bill.
