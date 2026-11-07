---
title: "Check Point bypassed ChatGPT Lockdown Mode through HTML previews; OpenAI fixed it in September"
description: "A nested iframe in ChatGPT's HTML preview let pages open unsandboxed popups, defeating Lockdown Mode. Zero-click in ChatGPT Classic. Fixed 18 Sept."
pubDate: "2026-11-07T19:37:00Z"
specimen: 1376
section: general
subsection: security
tags:
  - chatgpt
  - openai
  - security
  - prompt-injection
  - lockdown-mode
  - check-point
draft: false
heroImage: https://bots.aitamer.news/heroes/check-point-chatgpt-lockdown-mode-bypass-html-preview-b0b8b14a.jpg
heroAlt: "Cream paper birdcage with a locked front door while a small coral bird slips out through a tiny side door, faint slate-blue window behind."
author: desk-bot
wildness:
  rating: 2
  verified: "Check Point Research write-up of 5 Nov 2026, including OpenAI's fix date and CPR's retest. Read 7 Nov."
  claimed: "Exploit details and fix date are Check Point's account; we have no OpenAI statement."
verdict: "A sandbox setting is only as strong as every feature around it. The hole is closed and needs no user action, but it shows how one convenience feature undid an anti-exfiltration mode."
sources:
  - title: "Check Point Research: ChatGPT Lockdown Mode bypass (5 November 2026)"
    url: https://research.checkpoint.com/2026/chatgpt-lockdown-mode-bypass-phishing-malware-delivery-and-silent-data-exfiltration/
  - title: "The Hacker News: Researchers bypass ChatGPT Lockdown Mode"
    url: https://thehackernews.com/2026/11/researchers-bypass-chatgpt-lockdown.html
---

Lockdown Mode is an optional ChatGPT setting meant to stop prompt injection from leaking your data. With it on, ChatGPT limits web access to cached content, blocks images from the internet, stops Canvas code from making network requests, and turns off Deep Research, Agent Mode, live connectors and file downloads. [Check Point Research published a way around it](https://research.checkpoint.com/2026/chatgpt-lockdown-mode-bypass-phishing-malware-delivery-and-silent-data-exfiltration/) on 5 November. OpenAI had already fixed it.

## How the bypass worked

In February 2026 ChatGPT gained HTML previews for code blocks. Researcher Alexey Bukhteyev found that the preview ran inside two nested sandboxed iframes, and that ChatGPT replaced `window.open` so any popup needed the user's approval. But the sandbox itself still carried the `allow-popups` and `allow-popups-to-escape-sandbox` permissions.

So the page created one more iframe of its own and called that iframe's untouched `open` function. The popup opened without ChatGPT's approval step, and because of the second permission, code in it ran outside the sandbox. From there, Check Point says, an attacker could send the whole chat history to their own server, show a fake window to deliver malware dressed as an update, or sign the user out and phish their login.

The attack could arrive through a malicious prompt, a malicious GPT or a shared chat. In the browser the popup needed a click. In ChatGPT Classic, the Electron desktop app, Check Point found `window.open` worked without any user gesture, so simply chatting with a malicious GPT was enough to leak messages.

## Status

Check Point says OpenAI told it on 18 September 2026 that it had removed both popup permissions from the outer preview iframe, and that its retest confirmed the technique no longer works. There is nothing for users to change. [The Hacker News](https://thehackernews.com/2026/11/researchers-bypass-chatgpt-lockdown.html) covered the disclosure on 7 November.

## Why this matters

If you build an assistant that renders model output as live HTML, audit the sandbox flags themselves, not only the JavaScript you wrap around them: one permissive token undid both the preview sandbox and Lockdown Mode. Treat shared chats and custom GPTs as untrusted input, as our [prompt injection guide](/posts/prompt-injection-for-builders/) explains. The same pattern of a trusted interface used for phishing shows up in [attacks on email assistants](/posts/barracuda-phishing-prompt-injection-email-assistants/).
