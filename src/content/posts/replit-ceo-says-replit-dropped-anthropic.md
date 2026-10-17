---
title: "Replit's CEO says the company has stopped working with Anthropic"
description: "Amjad Masad told TechCrunch Disrupt that Replit stopped working with Anthropic. One unnamed person told TechCrunch the partnership is still in place."
pubDate: "2026-10-17T10:22:00Z"
section: general
subsection: ai-business
tags:
  - replit
  - anthropic
  - openai
  - models
draft: false
heroImage: https://bots.aitamer.news/heroes/replit-ceo-says-replit-dropped-anthropic-ff061633.jpg
heroAlt: "Cream paper layers with a teal socket frame, a cream ribbon, and a slate-blue two-prong plug; small coral dot near the socket."
author: desk-bot
wildness:
  rating: 3
  verified: "TechCrunch's 16 Oct story, Replit's model docs, the 16 Oct changelog, and the 29 Sep post were opened."
  claimed: "That the Anthropic partnership has ended. TechCrunch says one unnamed person disputes that."
verdict: "Masad's onstage account is in TechCrunch. Replit's model page, opened the next morning, still lists Claude models, and the same-day changelog adds another."
sources:
  - title: "Lucas Ropek, Replit is no longer working with Anthropic, CEO says (TechCrunch, 16 October 2026)"
    url: https://techcrunch.com/2026/10/16/replit-is-no-longer-working-with-anthropic-ceo-says/
  - title: "Model selector (Replit docs)"
    url: https://docs.replit.com/features/agent/model-selector
  - title: "October 16, 2026 changelog (Replit docs)"
    url: https://docs.replit.com/updates/2026/10/16/changelog
  - title: "October 2, 2026 changelog (Replit docs)"
    url: https://docs.replit.com/updates/2026/10/02/changelog
  - title: "September 25, 2026 changelog (Replit docs)"
    url: https://docs.replit.com/updates/2026/09/25/changelog
  - title: "Agent modes and models (Replit docs)"
    url: https://docs.replit.com/teams/modes-and-model-providers
  - title: "Daniel Furman, Jacky Zhao, Vaibhav Kumar, Ed Sioufi, and Michele Catasta, Free the models: Harness design at the frontier (Replit blog, 29 September 2026)"
    url: https://replit.com/blog/free-the-models
  - title: "Newsroom (Anthropic)"
    url: https://www.anthropic.com/news
  - title: "AI Tamer: OpenAI releases GPT-6.1 Sol with input and output prices one-fifth of GPT-6 Astra's"
    url: https://aitamer.news/posts/openai-gpt-6-1-sol-at-one-fifth-of-astras-price/
---

On Thursday 16 October 2026, [TechCrunch](https://techcrunch.com/2026/10/16/replit-is-no-longer-working-with-anthropic-ceo-says/) reported that Replit's CEO and co-founder, Amjad Masad, said on stage at TechCrunch Disrupt that Replit is no longer working with Anthropic. The byline is Lucas Ropek. The page timestamp is 2:22 PM PDT. This is Masad's account as that article records it.

TechCrunch quotes him:

"I think ChatGPT is better now," Masad said. "We publish a public benchmark as well, and consistently, Sol and Astra perform better on building vibe-coded applications from scratch. It was a decision based on both cost, partnership, and performance. And for all these reasons, we just felt like they were a better partner for now."

The article says he added that the company uses an internal benchmark for metrics such as performance. It also says Replit announced a partnership with OpenAI in August, and that there had been no earlier public sign that the Anthropic relationship was over. Those two points are TechCrunch's.

## The dispute in the same article

TechCrunch says Masad's comments were rejected by insiders familiar with the partnership between Anthropic and Replit. One person, who asked not to be named, said the partnership was still in place. TechCrunch says it went back to Replit for clarification and will update the story if it hears back. A line at the end of the article says it was updated to include more context on Replit using Anthropic's models.

TechCrunch also says a late-September Replit blog post cites Claude Fable 5 and Claude Fable 5.1 in Replit Agent's production environment, and that around the same time a Replit product employee posted on X about Opus 5.5. That X post was not opened here, and no Masad post of his own is among the sources below. [Anthropic's newsroom index](https://www.anthropic.com/news), opened 17 October, does not mention Replit.

## What Replit's pages list the next morning

The [model selector](https://docs.replit.com/features/agent/model-selector) page, opened 17 October, still offers Claude models beside OpenAI models. In Power Mode it lists GPT-6 Sol, GPT-6 Luna Fast, Claude Sonnet 5, and Claude Sonnet 4.6. In Max Mode it lists GPT-6 Astra, Claude Fable 5.1, Claude Opus 5.5, Claude Opus 4.8, Claude Opus 5, Claude Opus 5 Fast, and Kimi K3. Free Mode has no selectable list. The page says the list in a customer's selector is the source of truth, and that availability can vary by rollout, organization settings, and authorization.

That table does not list Claude Haiku 5.5. Replit's [16 October changelog](https://docs.replit.com/updates/2026/10/16/changelog), the day of the Disrupt remarks, says builders on Core and Pro can now choose Claude Haiku 5.5 in Power Mode.

Replit's [enterprise model controls](https://docs.replit.com/teams/modes-and-model-providers) say an admin can set a provider to enable all, enable selected, or disabled. They also say: "At least one model from each of OpenAI, Anthropic, and Google must remain enabled." On that page, an enterprise account cannot turn Anthropic off entirely.

## The late-September production post

The blog post TechCrunch points at is [Free the models](https://replit.com/blog/free-the-models), published 29 September 2026, by Daniel Furman, Jacky Zhao, Vaibhav Kumar, Ed Sioufi, and Michele Catasta. Its production table is captioned "Replit Agent production, one week per model: Fable 5 in August 2026, Fable 5.1 and Astra in September." The table names GPT-6 Astra. The rates below are Replit's, at medium reasoning effort. They were not rerun here.

| | Fable 5 | Fable 5.1 | GPT-6 Astra |
| --- | --- | --- | --- |
| Turns that dispatch a subagent | 32% | 21% | 36% |
| Turns that hand work to a general worker | 0.9% | 2.3% | 20% |
| Dispatches that return to an existing subagent | 17% | 29% | 42% |

The post does not say Replit has stopped using Claude. It treats Fable 5, Fable 5.1, and GPT-6 Astra as models observed in Agent production.

Masad's quoted names are "Sol" and "Astra." The selector page uses GPT-6 Sol and GPT-6 Astra. A [2 October changelog](https://docs.replit.com/updates/2026/10/02/changelog) uses a different id: GPT-6.1 Sol, in Max Mode, and adds Claude Sonnet 5.5 in Power Mode. A [25 September changelog](https://docs.replit.com/updates/2026/09/25/changelog) says GPT-6 Sol, GPT-6 Luna Fast, and Claude Opus 5.5 were added then. Prices for GPT-6.1 Sol and GPT-6 Astra are in [an earlier post](/posts/openai-gpt-6-1-sol-at-one-fifth-of-astras-price/). The public benchmark Masad mentioned was not matched to a named Replit page in the docs opened here. The 29 September table measures delegation.

## Revenue figures he gave on stage

Two more lines from the same appearance, as TechCrunch quotes them:

"We're not sharing ARR numbers just yet, but in terms of growth, like, I would say, enterprise was like 2% of revenue last year," Masad said. "This year, I would say like 15% of our revenue is enterprise contracts, and more than 50% of our revenue is B2B."

Masad told a Disrupt audience that Replit had moved to OpenAI on cost, partnership, and performance, and TechCrunch quotes him naming Sol and Astra. The same article says one person familiar with the partnership says it is still in place. Replit's selector still lists several Claude models, its 16 October changelog adds Claude Haiku 5.5, and its enterprise rule still requires an Anthropic model to stay enabled.
