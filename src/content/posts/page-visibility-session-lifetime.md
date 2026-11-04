---
title: Page Visibility Is a Signal, Not a Shutdown Hook
description: Pause optional work when a document is hidden, and resume carefully when it becomes visible.
pubDate: "2026-11-15T08:30:00Z"
specimen: 1310
section: dev
tags:
  - javascript
  - browser
  - lifecycle
  - performance
draft: false
heroImage: https://media.aitamer.news/heroes/page-visibility-session-lifetime-a0be2d91.jpg
heroAlt: A visible cream page and a page behind a folded blue screen remain joined by a coral ribbon beside a winding toy.
author: mai
wildness:
  rating: 1
  verified: The document exposes visible and hidden states and fires an event when its visibility changes.
  claimed: No additional unverified claims.
verdict: Use visibility changes to adapt optional work, not to guarantee shutdown detection or final delivery.
sources:
  - title: "WHATWG HTML Standard: Page visibility"
    url: https://html.spec.whatwg.org/multipage/interaction.html
  - title: "MDN: visibilitychange event"
    url: https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event
  - title: "MDN: Document visibilityState"
    url: https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilityState
---

A page can stop being visible without its session being over. Someone may switch tabs to check a message, then return a moment later. Page visibility helps an application respond to that change, but it does not tell the application what the person intends to do next.

The browser exposes the document's current state through `document.visibilityState`. The HTML Standard defines visible and hidden states and fires a visibilitychange event when the state changes. A background tab or a minimized browser window can lead to a hidden state. The event itself does not carry the new state, so read the property when handling it.

A small clock illustrates a practical use. Updating its display every second while the page is hidden is unnecessary. When the page becomes visible, render the current time immediately and restart the interval:

```html
<p>Current time: <time id="clock"></time></p>
<script>
  const clock = document.querySelector('#clock');
  let timer = null;

  function renderTime() {
    clock.textContent = new Date().toLocaleTimeString();
  }

  function updateClockWork() {
    if (document.visibilityState === 'visible') {
      renderTime();
      if (timer === null) timer = setInterval(renderTime, 1000);
    } else if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  }

  document.addEventListener('visibilitychange', updateClockWork);
  updateClockWork();
</script>
```

The initial call matters because an event listener only reacts to later changes. The timer guard avoids starting another interval if the update function runs while one is already active. On return, the clock reads the current time instead of trying to replay every missed tick. A data-driven display could similarly refresh from its source, while handling failures and stale responses.

Choose what to pause based on the task. Decorative animation or optional refreshes may be good candidates. An audio player, an upload, or a collaborative editing session may be expected to continue in the background. Visibility alone is not permission to interrupt work the person still wants.

A transition to hidden can also be a useful opportunity to initiate a small analytics send or save attempt. It is not a reliable declaration that the application has shut down, and neither an event handler nor a network request guarantees final delivery. A browser or operating system can stop a page before asynchronous work completes. Save important changes during normal use, handle errors, and design recovery around what was actually persisted.

Likewise, visible does not prove that the person is watching or interacting. Treat the state as a bounded browser signal: useful for conserving work and refreshing a display, but not evidence of attention or a guaranteed end-of-session notification.
