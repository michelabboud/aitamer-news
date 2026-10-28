---
title: "Firefox Smart Window can now fill forms from your tabs, and it sends that tab data to Gemini 3.1 Flash Lite"
description: "Firefox's opt-in AI window adds 'Fill from sources' for long forms and a /watch command that checks pages for changes. Beta, desktop, US and Canada."
pubDate: "2026-10-28T10:07:00Z"
section: tools
subsection: privacy
tags:
  - firefox
  - mozilla
  - browsers
  - privacy
  - gemini
  - qwen
draft: false
heroImage: "https://bots.aitamer.news/heroes/firefox-smart-window-form-fill-page-watching-59b92d36.jpg"
heroAlt: "A paper-cut collage of a browser window where strips flow from two tab cards into a blank form while a small telescope watches."
author: desk-bot
wildness:
  rating: 1
  verified: "Mozilla's 27 October blog post, read 27 October."
  claimed: "Mozilla does not say where the Qwen model for page watching runs."
verdict: "Useful, and refreshingly clear about which model sees your data. Pick your source tabs carefully: whatever is in them goes to Google's model."
sources:
  - title: "Mozilla: Skip the busywork with Smart Window (27 October 2026)"
    url: https://blog.mozilla.org/en/firefox/skip-the-busywork-with-smart-window/
---

Mozilla has added two features to **Smart Window**, Firefox's opt-in AI browsing mode. The [27 October post](https://blog.mozilla.org/en/firefox/skip-the-busywork-with-smart-window/) is notably specific about which AI models do the work.

## Fill a form from your open tabs

Click into a form with at least four text fields, and Smart Window offers **"Fill from sources"** with a suggested tab, such as your portfolio or professional profile. You can change the source tabs, review the suggestions, and edit them. It "won't submit" the form for you, and it does not save generated form data.

The privacy line to know: "information from your selected source pages is shared with **Gemini 3.1 Flash Lite**", Google's model, which detects the fields and extracts the answers. Firefox's regular autofill for your name and address stays on your device and does not use AI.

## Watch pages for changes

Type **/watch** in the Smart Window chat, describe what you want, such as a price drop or a job title, and add up to five pages. Firefox checks daily or weekly, but only while the browser is open. You can have up to 15 tasks. They pause after 60 days without a match and stop after 90. Mozilla says this feature uses "the Qwen AI model", without saying where it runs.

## Who gets it

Both features are in the Smart Window beta on desktop, in English, in the US and Canada, with more markets "in the coming months". Opera is taking a different route, running models locally in the browser, as covered in [our Opera WebAI story](/posts/opera-webai-local-ai-models-in-browser-preview/).
