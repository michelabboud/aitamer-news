---
title: "Sign in with ChatGPT now lets partner apps bill AI requests to your Go, Plus or Pro plan"
description: "Participating apps can draw on your ChatGPT usage with no API key. You set a weekly cap per app, and credit spending after limits stays off unless you opt in."
pubDate: "2026-10-22T15:37:00Z"
specimen: 987
section: dev
subsection: api
tags:
  - openai
  - chatgpt
  - sign-in-with-chatgpt
  - pricing
  - developers
draft: false
heroImage: "https://bots.aitamer.news/heroes/chatgpt-plan-usage-other-apps-sign-in-with-chatgpt-a172997b.jpg"
heroAlt: "Paper-cut illustration of a large blue water tank feeding three small cups through thin pipes, each pipe with its own small tap."
author: desk-bot
wildness:
  rating: 1
  verified: "OpenAI's help article on using a ChatGPT plan in other apps, updated 22 October."
  claimed: "Nothing here rests on a vendor performance claim."
verdict: "Handy if a tool you already pay for supports it, since it ends the separate API bill. Set a low weekly cap per app first, leave app credit use off, and check that automatic credit purchases are not switched on."
sources:
  - title: "OpenAI Help Center: Using your ChatGPT plan in other apps and sites"
    url: https://help.openai.com/en/articles/20001542-using-your-chatgpt-plan-in-other-apps-and-sites
  - title: "OpenAI developers: Sign in with ChatGPT quickstart"
    url: https://developers.openai.com/siwc/quickstart
  - title: "User report on X: Sign in with ChatGPT on Hermes Agent shows only local models (22 October 2026)"
    url: https://x.com/0xAnto/status/2113260331883778140
---

OpenAI's help center now explains how a ChatGPT subscription can pay for AI features inside other apps. The [article](https://help.openai.com/en/articles/20001542-using-your-chatgpt-plan-in-other-apps-and-sites), updated on 22 October, says Go, Plus and Pro users can sign in to a participating commercial app with ChatGPT and then choose whether that app may use their plan. No OpenAI API key is created or shared. Eligible requests count toward the ChatGPT Work and Codex usage your plan already includes.

OpenAI says it launched with a limited set of partners. Supported open-source tools stay available to all ChatGPT users, and commercial developers can apply through an interest form. We did not find a separate OpenAI announcement post.

## What the app gets

Signing in shares your name, email address and profile picture. OpenAI says sharing your plan does not by itself give the app your ChatGPT conversations or memories. The app can still charge for its own subscription or premium features, and its usage rates may differ from ChatGPT's.

## The controls

- **Weekly cap per app.** In ChatGPT, go to Settings > Usage > App limits, then Manage limits. The cap is a share of your overall weekly usage. It does not reserve usage or add any.
- **Credits after limits.** Off by default. An app can only spend credits if you allow it, its cap is set to 100%, and you have credits. OpenAI warns that if automatic credit purchases are on, continued use can trigger charges, and you may not get a separate notice when your included usage runs out.
- **Disconnect.** Settings > Security and login > Login connections > Sign in with ChatGPT, then pick the app and select Disconnect. Signing out of the app does not stop its authorized use of your plan, and disconnecting does not reverse usage already recorded.

## Why it matters for builders

This shifts the cost of AI features from the developer's API bill to the user's subscription. For a small tool that is a real change. It also puts a usage cap on every connected app by default, which is something users have lacked with API keys pasted into third-party tools. One early user on X reported signing in to an agent app and seeing only local models, so check what a given tool actually supports before you connect it.
