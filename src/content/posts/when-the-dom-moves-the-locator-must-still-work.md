---
title: When the DOM Moves, the Locator Must Still Work
description: Page structure changes. A locator based on a control’s role and name can keep a browser test focused on the action a person takes.
pubDate: "2026-10-08T03:00:00Z"
specimen: 389
section: tools
tags:
  - browser-automation
  - testing
  - playwright
  - locators
draft: false
heroImage: https://media.aitamer.news/heroes/when-the-dom-moves-the-locator-must-still-work-97ea8317.jpg
heroAlt: A highlighted web button moves between page layouts while a locator keeps pointing to it.
author: ari
wildness:
  rating: 2
  verified: Playwright documents role, label, text, test ID, and DOM-sensitive path locators.
  claimed: A locator based on a control’s meaning can survive changes to its element nesting.
verdict: Locate the action a person can identify. Add context when names repeat, and reserve structural paths for cases where they are necessary.
sources:
  - title: Locators | Playwright
    url: https://playwright.dev/docs/locators
---

## A path depends on page structure

A selector such as `main > div:nth-child(2) > button` describes where a button sits. Add a wrapper or reorder the content, and the selector may stop finding the intended button. [Playwright’s locator guide](https://playwright.dev/docs/locators) warns that long CSS and XPath chains can break when the DOM changes.

The path may work today. Its weakness is that the test depends on the current nesting of elements, even when that nesting has little to do with the action being checked.

## A control has a role and a name

For a Save button, `page.getByRole('button', { name: 'Save' })` describes the control by its role and accessible name. Playwright recommends role locators because they reflect how users and assistive technology perceive a page. For a form field, `getByLabel('Email')` can find the control through its associated label. The [locator guide](https://playwright.dev/docs/locators) shows both approaches.

If the layout changes while the button keeps the same role and name, that locator can still identify it. Playwright also finds the current DOM element each time a locator is used for an action. That matters when a page renders a replacement element between actions.

## Repeated controls need context

A page can have several buttons named Add to cart. Playwright shows how to narrow the search to a particular list item, then find its button. For example, a test can select the item containing a product name before calling `getByRole('button', { name: 'Add to cart' })`. The [filtering examples](https://playwright.dev/docs/locators) use this pattern.

The product name supplies context that a button’s position cannot. If that name changes, the test needs updating too. That failure points to a change in the content the test identifies.

## What to do

1. Start with a role and accessible name for an interactive control.
2. Use an associated label for a form field and text for noninteractive content.
3. Scope repeated controls to the item or section that gives them meaning.
4. Use an explicit test ID when a suitable role or text locator is unavailable. Review any long CSS or XPath chain that depends on element nesting. These choices follow [Playwright’s locator guidance](https://playwright.dev/docs/locators).
