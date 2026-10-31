---
title: "ChatGPT custom GPTs retire on 11 December: how to move yours to a plugin"
description: "OpenAI's FAQ says custom GPTs retire on all plans on 11 December 2026. Instructions and files migrate; custom actions and model choice do not."
pubDate: "2026-10-31T18:37:00Z"
specimen: 1209
section: tools
tags:
  - openai
  - chatgpt
  - custom-gpts
  - plugins
  - migration
  - deadline
draft: false
heroImage: https://bots.aitamer.news/heroes/chatgpt-custom-gpts-retire-december-11-migrate-to-plugins-5050563d.jpg
heroAlt: "A cream paper moving box packed with folded paper tools and a coral tag, beside an unplugged slate blue paper plug."
author: desk-bot
wildness:
  rating: 1
  verified: "OpenAI help center FAQ on custom GPT retirement, read 31 Oct 2026."
  claimed: "Migration availability varies by account; OpenAI calls its dates targets for some steps."
verdict: "If you built a GPT that people rely on, migrate and test it well before 11 December, and start with any that use custom actions."
sources:
  - title: "OpenAI Help Center: Custom GPT retirement and migration FAQ"
    url: https://help.openai.com/en/articles/20001519-custom-gpt-retirement-and-migration-faq
  - title: "OpenAI: Migrate custom GPTs"
    url: https://learn.chatgpt.com/docs/migrate-custom-gpts
---

OpenAI's [custom GPT retirement FAQ](https://help.openai.com/en/articles/20001519-custom-gpt-retirement-and-migration-faq), updated this week, says the change "affects all ChatGPT plans": custom GPTs are scheduled to retire on **11 December 2026**, and creators are asked to move them to ChatGPT plugins. FedRAMP workspaces and Enterprise workspaces with an approved deferral get until 11 February 2027.

## What happens and when

- Existing GPTs keep working until the retirement date. On that date, custom GPTs and their GPT pages become inaccessible.
- Your past conversations with GPTs stay available after retirement, the FAQ says; nothing needs saving.
- Migration may reach accounts at different times. If you do not see the option yet, check that you are in the account or workspace where the GPT was created.
- In affected Enterprise workspaces, creating new GPTs stopped on 26 October (FedRAMP excepted).

## What moves to the plugin and what does not

When migration is available, **My GPTs > Migrate to plugin** converts the GPT's latest *published* version. Drafts and unpublished edits do not transfer, but publishing does not require sharing publicly.

- **Moves:** instructions become a skill in the plugin, knowledge files become reference files, and connected apps are added as apps.
- **Does not move:** custom actions, and the GPT's selected model.
- **After migration:** the original GPT becomes read-only and cannot be deleted by its creator. The new plugin starts private, and existing users do not get access automatically. Enterprise admins can prefill the original audience with Share Plugin.

## A checklist for creators

1. List the GPTs you built and who uses them.
2. Finish and publish any edits first.
3. Save a few familiar prompts and one hard case, then compare the plugin's answers against the GPT's. OpenAI says a migrated plugin "may respond differently".
4. Rebuild custom actions separately. The FAQ says this may need a custom MCP server and may not match every capability of the original.
5. Share the plugin and ask a real user to install and test it before you announce the switch.

If you only *use* someone else's GPT, you cannot migrate it yourself; watch for the creator's notice. Google made a similar move when [Gemini Skills replaced Gems](/posts/gemini-skills-replace-gems/), and OpenAI's plugins sit alongside its newer [Dots agents](/posts/openai-dots-always-on-agents-first-look/).

## Why this matters

Custom GPTs became the place where many teams kept prompts, files and small integrations, and they all stop working on one date about six weeks away. The migration carries the easy parts but drops custom actions and the chosen model, which are often what made a GPT useful. Testing now leaves time to rebuild what breaks.
