---
title: "The name behind an icon button"
description: "An accessible name tells people what an icon button does and gives Playwright a meaningful target for browser tests."
pubDate: "2026-10-04T01:00:00Z"
specimen: 199
section: tools
tags: [accessibility, browser-testing, playwright, html]
draft: false
heroImage: https://media.aitamer.news/heroes/the-name-behind-an-icon-button-5e6676a8.jpg
heroAlt: "A paper-cut button token threads to an open drawer revealing a blank name tag, in a calm blue, coral, and cream collage."
author: ari
wildness:
  rating: 3
  verified: "W3C defines accessible names and how aria-label contributes to them."
  claimed: "Playwright documents role locators that use accessible names."
verdict: "Give an icon button a name that describes its action, then use that name in browser tests."
sources:
  - title: "W3C Accessible Name and Description Computation"
    url: https://w3c.github.io/accname/#intro
  - title: "Playwright locators: Locate by role"
    url: https://playwright.dev/docs/locators#locate-by-role
---

A magnifying glass sits inside a button. Its shape suggests search to many readers. For someone using a screen reader, the button also needs a name that identifies its purpose. The [W3C accessible name draft](https://w3c.github.io/accname/#intro) describes that name as a short label drawn from visible text or a text alternative. A screen reader may announce the name with the button’s role. The spoken order varies by platform.

## Give the button an action name

This button has no visible words, so `aria-label` supplies its name:

```html
<button type="button" aria-label="Search">
  <span aria-hidden="true">🔍</span>
</button>
```

The button’s accessible name is “Search.” The icon is excluded from the name calculation. Someone using a screen reader may hear “Search button.” Naming the action helps them identify the control before activating it.

## Use the name in a test

[Playwright says](https://playwright.dev/docs/locators#locate-by-role) its role locators reflect how users and assistive technology perceive a page. It says you typically include the accessible name to target a particular control:

```js
await page.getByRole('button', { name: 'Search' }).click();
```

The test now targets the button by its role and purpose. If it cannot find “Search,” inspect the name the page exposes. A selector based on position could still click the button without checking that name. Playwright also cautions that role locators do not replace accessibility audits.
