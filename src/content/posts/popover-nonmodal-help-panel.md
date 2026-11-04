---
title: A Popover Is Not a Modal Dialog
description: Both can appear in the top layer, but their interaction and dismissal rules differ.
pubDate: "2026-11-16T08:30:00Z"
section: dev
tags:
  - html
  - popover
  - dialog
  - accessibility
  - javascript
draft: false
heroImage: https://media.aitamer.news/heroes/popover-nonmodal-help-panel-1fd3046b.jpg
heroAlt: A coral help panel with a paper book floats beside a work surface where a hand continues arranging blank cards.
author: mai
wildness:
  rating: 1
  verified: Popover modes have distinct dismissal rules; a modal dialog makes its document's background inert.
  claimed: No additional unverified claims.
verdict: Choose a popover for non-modal content and a modal dialog when the task requires blocking background interaction.
sources:
  - title: "WHATWG HTML Standard: The popover attribute"
    url: https://html.spec.whatwg.org/multipage/popover.html
  - title: "MDN: Using the Popover API"
    url: https://developer.mozilla.org/en-US/docs/Web/API/Popover_API/Using
  - title: "MDN: Popover attribute"
    url: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/popover
  - title: "MDN: showModal()"
    url: https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal
---

A panel appearing above the page does not necessarily block the page. HTML popovers and modal dialogs can both use the top layer, but they solve different interaction problems. The visual stacking is only part of the story.

A popover is non-modal: opening one does not by itself make the rest of the document inert. A dialog opened with `showModal()` does make the rest of its containing document inert. Choose the latter when the user must address a task before continuing elsewhere, not merely because you want a box to appear above other content.

Here is a small help panel that people can open while working on a page:

```html
<button type="button" popovertarget="format-help">
  Formatting help
</button>

<div id="format-help" popover="auto">
  <h2>Formatting help</h2>
  <p>Use a blank line to separate paragraphs.</p>
  <button type="button" popovertarget="format-help"
          popovertargetaction="hide">Close help</button>
</div>
```

The button targets the panel by ID. Its default action toggles the popover; the button inside explicitly hides it. In supporting browsers, the open panel enters the top layer, rather than being confined by an ancestor's ordinary overflow or positioning. It does not automatically become a dialog just because it is a popover. The element's semantics and the accessibility requirements of the content still matter.

The example uses auto mode. An auto popover supports light dismissal, such as clicking outside it, and responds to close requests such as Escape. Opening another auto popover generally closes the first, although related nested popovers are an exception. An empty popover attribute also selects auto mode.

Manual mode makes a different tradeoff. It does not light-dismiss or respond automatically to close requests, and multiple independent manual popovers can remain open. Provide an explicit way to close one. Hint mode can be light-dismissed and responds to close requests; showing a hint does not itself close auto popovers, but it closes unrelated hints in its stack. A click used to open a hint outside an auto popover can still dismiss that auto popover.

A declarative invoker relationship also helps keyboard navigation and exposes relationships to assistive technology, but it does not supply every behavior needed for an arbitrary widget. A custom menu, for example, needs its own appropriate semantics and keyboard interaction. Test opening, navigation, dismissal, and focus with the browsers and assistive technologies your audience uses.

Support can differ by mode. In browsers without hint support, the value can fall back to manual behavior, so do not rely on hint dismissal without a compatibility strategy. Most importantly, do not use a non-modal popover as if it prevented the user from interacting with the page behind it.
