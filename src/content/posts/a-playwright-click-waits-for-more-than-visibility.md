---
title: A Playwright Click Waits for More Than Visibility
description: A visible button can still leave a Playwright click waiting. Learn how stability, enabled state, and pointer events affect the action, and how to diagnose a stalled click.
pubDate: "2026-10-07T15:00:00Z"
specimen: 365
section: tools
tags:
  - playwright
  - browser-testing
  - test-debugging
  - automation
draft: false
heroImage: https://media.aitamer.news/heroes/a-playwright-click-waits-for-more-than-visibility-e5a63281.jpg
heroAlt: A pointer approaches a button beneath transparent layers, with a lock, gear and blocked sign beside it.
author: ari
wildness:
  rating: 2
  verified: Playwright documents visibility, stability, enabled, and pointer-event checks for clicks.
  claimed: A visible button can still leave a click waiting on another actionability check.
verdict: Read the actionability log to identify the failing check, then fix the page state or test setup that keeps the target from receiving a click.
sources:
  - title: Auto-waiting
    url: https://playwright.dev/docs/actionability
  - title: Locator API reference
    url: https://playwright.dev/docs/api/class-locator
  - title: Locators
    url: https://playwright.dev/docs/locators
  - title: Debugging Tests
    url: https://playwright.dev/docs/debug
---

## The click has several gates

A button can appear ready before a browser test can click it. For `locator.click()`, Playwright waits for one matching element that is visible, stable, enabled, and able to receive pointer events. If the required checks do not pass within the timeout, the action fails. Playwright calls these actionability checks. They make the click depend on the page's state when the action runs. [Playwright's actionability guide](https://playwright.dev/docs/actionability) lists the checks.

A visibility assertion answers one useful question. It does not cover the other click conditions. A test can therefore pass `toBeVisible()` and still wait at `click()`. When that happens, the remaining checks offer a better place to look than another visibility assertion. [The actionability guide](https://playwright.dev/docs/actionability) shows the requirements for clicks and visibility assertions.

## Visibility has a precise meaning

Playwright calls an element visible when it has a nonempty bounding box and its computed `visibility` is not `hidden`. An element with `display: none` or zero size fails that check. An element with `opacity: 0` passes it. An invisible-looking element can therefore pass this particular gate. [Playwright's visibility definition](https://playwright.dev/docs/actionability) makes that case explicit.

This matters when a page fades controls in. A visibility check alone does not establish that a fade has finished. The click has another gate for movement: stability. Read the failed action's log before treating every visible control as ready.

## Stability means the target stops moving

For a click, Playwright checks that the element is stable. Its documented rule is a bounding box that stays the same across at least two consecutive animation frames. A button sliding into place may already be visible, yet still fail stability while its position changes. [The stability definition](https://playwright.dev/docs/actionability) explains the frame check.

This distinction helps with menus, expanding panels, and controls that move after content loads. A fixed sleep says only that time passed. The stability check asks whether the target's geometry settled. If the page keeps changing the element's box, increasing the sleep only delays the failure. Inspect the moving element and the page behavior that drives it.

## Enabled covers more than one attribute

Playwright also waits for the target to be enabled. Its definition includes native controls with a `disabled` attribute, controls inside a disabled `fieldset`, and descendants of an element with `aria-disabled="true"`. A button can be visible and motionless while the page keeps it disabled. [The enabled-state rules](https://playwright.dev/docs/actionability) spell out those cases.

Consider a sign-up form that checks a name before enabling its submit button. Playwright's guide uses an example in which a disabled button is replaced by an enabled one after a server check. The click can wait for the enabled target. If the application never reaches that state, investigate why the button stays disabled. [Playwright's example](https://playwright.dev/docs/actionability) describes the replacement.

## Pointer events need a clear path

The last easy-to-miss gate is whether the element receives pointer events at the action point. Playwright checks the hit target there. An overlay can take the click intended for a button even when the button is visible, stable, and enabled. [The receives-events definition](https://playwright.dev/docs/actionability) describes that case.

This check focuses on the point of interaction. A dialog backdrop or a loading layer over the button can change which element receives the event. Look for the covering element and why it remains present. Moving the pointer to a different coordinate may make one test pass while leaving the interaction problem unexplained. Playwright's [click method reference](https://playwright.dev/docs/api/class-locator) says the action scrolls the target into view when needed and clicks its center or a specified position.

## A locator follows the current page

A locator is evaluated when an action uses it. If a page replaces a button during a render, a later action can find the new matching element. Playwright recommends locators based on user-facing attributes, such as a role and accessible name. A precise locator also helps satisfy the click's requirement to resolve to exactly one element. [The locator guide](https://playwright.dev/docs/locators) explains fresh lookup and role-based selection.

The click method can still throw if its element detaches during the action. Read the failure before assuming that a hidden element caused it. [The click reference](https://playwright.dev/docs/api/class-locator) states the detachment behavior.

## What to do

1. Start with a locator that names the intended control, such as `page.getByRole('button', { name: 'Save' })`. Check that it points to the right control when similar buttons exist. [Playwright's locator guide](https://playwright.dev/docs/locators) recommends role and name for this purpose.
2. Read the actionability log when a click stalls. Playwright's Inspector shows whether the target was found, visible, enabled, stable, and scrolled into view. The [debugging guide](https://playwright.dev/docs/debug) explains where those logs appear.
3. Match the fix to the failed gate. Repair the disabled state, moving layout, or covering overlay in the page or test setup. The [actionability guide](https://playwright.dev/docs/actionability) defines what each gate checks.
4. If you need to check readiness without activating the control, use `await button.click({ trial: true })`. The [click reference](https://playwright.dev/docs/api/class-locator) says trial mode performs the actionability checks and skips the click.
5. Keep `force: true` for cases where bypassing a check is intentional. A forced click can skip the check that the target receives click events. Use the [documented force behavior](https://playwright.dev/docs/actionability) to decide whether that matches the interaction being tested.
