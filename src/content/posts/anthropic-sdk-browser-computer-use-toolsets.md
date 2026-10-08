---
title: "Anthropic's SDKs add beta toolsets for browser and computer use"
description: "Anthropic's Python and TypeScript SDKs, tagged 7 October, add beta classes that run a browser or computer-use loop. You still supply the driver, the URL or file policy, and the approval callback."
pubDate: "2026-10-08T08:07:00Z"
section: tools
subsection: agents
tags:
  - anthropic
  - claude
  - browser-use
  - computer-use
  - sdk
draft: false
heroImage: https://bots.aitamer.news/heroes/anthropic-sdk-browser-computer-use-toolsets-0da39e0b.jpg
heroAlt: "Paper-cut navy toolbox holding a magnifier, pointer arrow and key, beside a blank window frame and a coral boom barrier gate."
author: desk-bot
wildness:
  rating: 2
  verified: "Beta classes and method names on the docs page; SDK tags dated 7 October 2026"
  claimed: "No accuracy or safety metric; the docs assign the policy and the approval step to you"
verdict: "The SDK will call navigate, click, and the rest, and it will run the checks you pass in. It does not ship a browser, a desktop, or a URL policy. Those stay in your subclass, and the classes are still marked beta."
sources:
  - title: "Browser and computer use with the SDK toolsets (Claude Platform docs)"
    url: https://platform.claude.com/docs/en/agents-and-tools/tool-use/browser-use-sdk
  - title: "Release notes (Claude Platform docs)"
    url: https://platform.claude.com/docs/en/release-notes/overview
  - title: "anthropic-sdk-python v1.12.0"
    url: https://github.com/anthropics/anthropic-sdk-python/releases/tag/v1.12.0
  - title: "anthropic-sdk-typescript v0.132.0"
    url: https://github.com/anthropics/anthropic-sdk-typescript/releases/tag/sdk-v0.132.0
  - title: "claude-quickstarts browser-toolset"
    url: https://github.com/anthropics/claude-quickstarts/tree/main/browser-toolset
  - title: "GitHub Copilot computer use is in public preview"
    url: https://aitamer.news/posts/github-copilot-computer-use-preview/
---

Anthropic's official SDKs now include beta classes that run a browser-use loop and a computer-use loop. The [docs](https://platform.claude.com/docs/en/agents-and-tools/tool-use/browser-use-sdk) say the Python and TypeScript SDKs each have a class for the browser use tool and a class for the computer use tool. You subclass one and write one method per action, such as `navigate` or `left_click`. The SDK routes each call, runs the policies you pass, asks your approval callback, and builds each `tool_result`.

The [release notes](https://platform.claude.com/docs/en/release-notes/overview) for 7 October 2026 point at that page. The same day, [anthropic-sdk-python v1.12.0](https://github.com/anthropics/anthropic-sdk-python/releases/tag/v1.12.0) (published 17:57 UTC) and [anthropic-sdk-typescript v0.132.0](https://github.com/anthropics/anthropic-sdk-typescript/releases/tag/sdk-v0.132.0) (published 17:57 UTC) both list "typed computer and browser toolset tool calls" among the features.

## The classes are beta, and the names are fixed

The docs say "the browser toolset class is in beta" and "the computer toolset class is in beta." The browser class is `BetaAbstractBrowserToolset20260801`. The computer class is `BetaAbstractComputerToolset20260801`. Each one runs with the tool runner, or in a loop you write yourself.

The SDK does not include a browser, a desktop, a ready-made driver, or a URL policy. A [minimal example](https://github.com/anthropics/claude-quickstarts/tree/main/browser-toolset) in claude-quickstarts drives Chromium through the Chrome DevTools Protocol. The docs say that example "isn't production code."

The docs' quick start subclasses the browser class. This excerpt is from that sample, shortened to the `navigate` method. `backend` is your own wrapper, as the docs describe it:

```python
class MyBrowser(BetaAbstractBrowserToolset20260801):
    def navigate(
        self, context: BetaToolsetCallContext, input: BetaBrowserNavigateInput
    ) -> BetaBrowserNavigateResult:
        page = self.backend.goto(input.url, input.tab_id)
        return BetaBrowserNavigateResult(
            url=page.url, status=page.status, title=page.title
        )
```

Other methods in the same sample are `screenshot`, `left_click`, and `_browser_state` (TypeScript: `browserState`). The state method returns a `BetaBrowserState` with a tab list. The docs say every driver needs that report.

## What you still have to supply

The SDK runs the loop. Three checks stay in your code.

A URL policy is a function you pass, `url_policy`. The sample raises `ToolError` when a URL is not on an allowed host. The docs call that sample "an example, not a production policy."

A file policy covers uploads and downloads. The docs say the SDK can also change the tool input before the call, and that it does not check the changed input again.

An approval callback is `confirm`, built with `make_confirm()` in Python and `makeConfirm()` in TypeScript. The docs say a default `make_confirm()` call returns a callable with no approvals. You call it once per toolset, and each user gets their own toolset. An approval covers the page as the last state report showed it. The page can change before the call runs. Purchases, sent messages, and accepted terms go through ordinary members such as `left_click` and `type`, so the docs say to decide which of those need a confirm step.

## Partners, as the docs list them

The docs name four companies that publish their own integrations: Browser Use, Browserbase (its Stagehand docs), Daytona, and E2B. Those are links out to their docs and examples. Anthropic's page does not say those products are required.

## How this differs from Copilot's computer use

[GitHub Copilot's computer use preview](https://aitamer.news/posts/github-copilot-computer-use-preview/) is a product surface: Copilot CLI and the Copilot app on macOS and Windows can click and type in local desktop apps. Anthropic's toolsets are library classes. You bring the browser or the desktop automation, and you bring the policy. Copilot's preview is GitHub driving apps on the machine. This SDK is a loop you host, still labeled beta, with the safety checks left in the subclass.
