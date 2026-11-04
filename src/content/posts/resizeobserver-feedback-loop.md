---
title: When ResizeObserver Resizes Its Own Target
description: A size callback can create feedback. Make writes converge before reaching for animation frames.
pubDate: "2026-11-14T08:30:00Z"
section: dev
tags:
  - javascript
  - resizeobserver
  - css
  - performance
draft: false
heroImage: https://media.aitamer.news/heroes/resizeobserver-feedback-loop-c44cd4ad.jpg
heroAlt: A coral articulated arm points at a framed cream sheet while looping arrows connect its edge to a small lever.
author: mai
wildness:
  rating: 1
  verified: Undelivered resize notifications produce an error; animation-frame deferral does not fix an infinite cycle.
  claimed: No additional unverified claims.
verdict: Make layout writes converge and use frame deferral for scheduling, not as a substitute for fixing feedback.
sources:
  - title: "W3C Resize Observer: processing model"
    url: https://www.w3.org/TR/resize-observer-1/
  - title: "MDN: ResizeObserver observation errors"
    url: https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver
  - title: "MDN: requestAnimationFrame"
    url: https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame
---

A resize observer tells you that an element changed size. If the callback changes that size again, the notification can lead straight back to itself. The result might settle after a few updates, or it might keep changing for as long as the page is open.

Browsers deliver resize observations during rendering. A callback can cause another layout, which can produce more observations. To keep this process from blocking rendering indefinitely, the processing model restricts which targets can be notified in successive iterations. If observations remain undelivered, it reports an error event with the message `ResizeObserver loop completed with undelivered notifications.` Those observations can be considered in a later rendering update.

That error does not prove the callback will run forever. A layout may settle, though the user might see intermediate states across frames. A repeated error is a reason to inspect the dependency between the observed size and the callback's writes, not merely suppress the message.

For example, suppose an application needs an observed panel to have a content width no greater than 600 CSS pixels. This deliberately narrow example only writes when the reported width is above that cap:

```js
const panel = document.querySelector('#panel');
const observer = new ResizeObserver((entries) => {
  for (const entry of entries) {
    if (entry.contentRect.width > 600) {
      entry.target.style.width = '600px';
    }
  }
});

observer.observe(panel);
```

Assume the panel is an ordinary HTML block using content-box sizing and that no other rule prevents the requested width. After the width reaches the cap, the callback no longer needs to write it. This is not a complete responsive layout: the inline width remains set even if the container later grows. For a simple cap, CSS `max-width` is usually a better fit than JavaScript.

In a real component, compare the desired and current state before writing. Be careful about which box you observe and which CSS property you set: padding, borders, rounding and other layout constraints can make those values differ. If two components resize one another, checking a single element may not eliminate the cycle. Give the system a stable target rather than repeatedly deriving a larger size from the last report.

Deferring a write with `requestAnimationFrame()` can move it out of the current observer delivery cycle. It does not make an unstable rule stable: adding ten pixels on every observation can still grow the element across frames. Animation callbacks can also be paused in background tabs, so deferral is not a deadline guarantee.

When the component is removed, disconnect its observer. Test both the final layout and repeated resize behavior. The goal is a layout that settles, not just a quiet console.
