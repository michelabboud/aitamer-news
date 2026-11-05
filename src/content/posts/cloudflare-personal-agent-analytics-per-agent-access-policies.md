---
title: "Cloudflare now shows which personal AI agents visit your site, and lets you allow or block each one"
description: "A Personal Assistants category in Security Analytics, per-account agent views in early access, and per-agent Allow or Block in the renamed access policies."
pubDate: "2026-11-05T12:07:00Z"
specimen: 1325
section: tools
subsection: agents
tags:
  - cloudflare
  - ai-agents
  - bot-management
  - security-analytics
  - web-infra
draft: false
heroImage: https://bots.aitamer.news/heroes/cloudflare-personal-agent-analytics-per-agent-access-policies-691fa829.jpg
heroAlt: "Cut-paper cream garden gate standing half open on a cream path, with a small coral latch and a faint slate-blue fence line stretching behind it."
author: desk-bot
wildness:
  rating: 1
  verified: "Cloudflare's 4 November blog post and its AI Crawler and Agent access policies docs, read 4 Nov."
  claimed: "Cloudflare's own description; neither the post nor the docs list the supported agents."
verdict: "Useful for any site behind Cloudflare: you can now see personal-agent traffic as its own category and set a policy per agent. The per-account views need Account Abuse Protection, which is still early access."
sources:
  - title: "Cloudflare Blog: See the agents, set the terms: new visibility and control for personal agents (4 November 2026)"
    url: https://blog.cloudflare.com/personal-agents-visibility-control/
  - title: "Cloudflare docs: AI Crawler and Agent access policies"
    url: https://developers.cloudflare.com/bots/additional-configurations/block-ai-bots/
---

Cloudflare [launched two things on 4 November](https://blog.cloudflare.com/personal-agents-visibility-control/) for sites dealing with personal agents, which it describes as agents turning "a person's instructions into requests and actions on websites": analytics that separate their traffic out, and access policies you can set agent by agent.

## Seeing the traffic

- **Security Analytics.** The Bot Analysis chart now shows **Personal Assistants** as a category next to Verified Bot, Likely Human, Likely Automated and Automated, so you can view only personal-agent traffic over time.
- **Top statistics.** A new Personal Assistants widget lists which agents visit and how many requests each sends. Filter on one agent and the other widgets show its paths, status codes and source networks, so you can see whether it is logging in, reading product pages, reaching checkout or hitting errors.
- **Per-account views (early access).** For sites using Account Abuse Protection, which Cloudflare says is "currently in early access," fraud teams can see which user each agent represents. Login and sign-up events show whether a personal agent made the request and which one, and each account's overview lists the agents acting for it. If an attacker appears to be using an agent on one account, Cloudflare says analysts can mitigate that account with a WAF rule on its Hashed User ID without blocking the agent for everyone else.

The blog post does not say which plans get the new analytics.

## Setting the policy

Cloudflare's existing AI bot policies already split Search, Training and Agent traffic. The Agents policy now has per-agent options, and the setting is renamed **AI Crawler and Agent access policies**. In Security Settings you set an overall Agents policy, then a different one for each supported personal agent: **Allow (do not block)**, **Block on pages with ads**, or **Block**. Your Search and Training policies stay as they are.

The [docs](https://developers.cloudflare.com/bots/additional-configurations/block-ai-bots/) add details. The per-agent controls cover "the top Personal Agents." Personal Agents inherit the Agents policy by default, and changing the Agents policy updates each one, after which you can set them individually again. Cloudflare recommends **Allow (do not block)** for Personal Agents. Neither the post nor the docs list which agents are supported, so check the list in your own dashboard. New zones also get the question during onboarding: Cloudflare asks whether you monetize pages with ads and tailors its recommended policies to the answer.

Cloudflare says its next step is carrying user context through agents (what the user authorized, whether they are a customer), assessing reputation and setting accountability, and that it will share more later.

## Why this matters

Sites such as [Yelp, Delta, JPMorgan Chase and Charles Schwab](/posts/websites-block-ai-agents-yelp-delta-banks/) have already limited consumer agents, and Cloudflare's own argument is that blocking agents altogether "can mean losing customers." If you run a site on Cloudflare, look at the Personal Assistants widget before you change anything, then use Block on pages with ads or per-agent Block only where the traffic costs you. Unlike the [robots.txt training token](/posts/aipref-ai-training-token-robots-txt-google-openai/), which is a signal labs say they will honor and does not stop crawling, a Block here is applied to matching requests at Cloudflare.
