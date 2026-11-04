---
title: Online Does Not Mean Your Service Is Reachable
description: Use browser network indicators as hints, then check the service you actually depend on.
pubDate: "2026-11-09T08:30:00Z"
specimen: 1286
section: dev
tags:
  - javascript
  - networking
  - fetch
  - offline
  - web-development
draft: false
heroImage: https://media.aitamer.news/heroes/browser-online-service-reachability-9c229e77.jpg
heroAlt: A glowing paper lantern stands beside a bridge that stops across a gap from a teal building.
author: mai
wildness:
  rating: 1
  verified: Browser online status is a network hint, not a test of a particular service.
  claimed: No additional unverified claims.
verdict: Treat network events as hints and a service check as a limited snapshot, not a guarantee.
sources:
  - title: "WHATWG HTML Standard: Browser state"
    url: https://html.spec.whatwg.org/multipage/system-state.html
  - title: "MDN: Navigator onLine"
    url: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine
  - title: "MDN: Window online event"
    url: https://developer.mozilla.org/en-US/docs/Web/API/Window/online_event
  - title: "MDN: RequestInit"
    url: https://developer.mozilla.org/en-US/docs/Web/API/RequestInit
  - title: "MDN: Using the Fetch API"
    url: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
  - title: "MDN: AbortController abort()"
    url: https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort
---

A browser can report that it is online while your application cannot reach its own API. The two statements answer different questions, and treating them as interchangeable can turn a useful status indicator into a misleading one.

The HTML Standard describes `navigator.onLine` as false when the browser considers itself offline and true when it might be online. It is not a test of a particular service. A device can be connected to a local network without internet access, and a firewall or service outage can leave one destination unavailable while other connections work.

The window's online and offline events report changes in that browser-level state. They are useful prompts to update a tentative message or schedule another check. They are not receipts proving that your next save will reach the server. Avoid disabling essential features solely because of this hint, especially if people can keep working with local data.

For a more relevant observation, an application can request a lightweight endpoint it controls. This example assumes a same-origin health endpoint whose contract is to return status 204 when that endpoint is ready:

```js
async function checkService() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch('/health', {
      cache: 'no-store',
      redirect: 'error',
      signal: controller.signal
    });
    if (response.status === 204) return 'responded';
    return `unexpected-status:${response.status}`;
  } catch (error) {
    if (error?.name === 'AbortError') return 'timed-out';
    return 'request-failed';
  } finally {
    clearTimeout(timer);
  }
}
```

The timer requests cancellation after five seconds; a busy or paused event loop can delay when its callback runs. The request avoids the browser's normal HTTP cache, and rejecting redirects helps avoid mistaking a login page reached by redirect for the expected health response. An unexpected status remains useful information, not proof that the entire internet is down. A rejected request is also ambiguous: a network problem, browser policy, or another failure may be responsible.

The result is a snapshot of one endpoint, not a promise about the next operation. A health response might not exercise the database, the user's authorization, or the specific action they need. A service worker can also intercept the request, so configure that layer deliberately if the check is meant to reach the network. For a cross-origin check, CORS must allow the browser to expose the response.

Use checks sparingly rather than polling every client aggressively. On an online event, for example, schedule a bounded retry with backoff instead of launching many immediate requests. Keep unsent work safe, show when the last attempt failed, and let the actual save report its own outcome. A network hint is useful. A guarantee requires evidence the hint cannot provide.
