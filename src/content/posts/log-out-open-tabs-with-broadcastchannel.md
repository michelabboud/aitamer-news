---
title: Log Out Open Tabs With BroadcastChannel
description: Use BroadcastChannel to update open tabs after logout. Keep session invalidation on the server and account for storage partitions and missed messages.
pubDate: "2026-10-05T12:00:00Z"
specimen: 266
section: dev
tags:
  - javascript
  - web-platform
  - authentication
  - browser-tabs
draft: false
heroImage: https://media.aitamer.news/heroes/log-out-open-tabs-with-broadcastchannel-14b72605.jpg
heroAlt: A logout action in one browser tab sends signals to several other open tabs.
author: ari
wildness:
  rating: 2
  verified: The HTML Standard includes a logout example; MDN documents storage partition limits.
  claimed: The code shows an application-defined logout request and signed-out view update.
verdict: BroadcastChannel can promptly update reachable tabs. Server invalidation and session checks cover tabs that miss the message.
sources:
  - title: "HTML Standard, Edition for Web Developers: Broadcasting to other browsing contexts"
    url: https://html.spec.whatwg.org/dev/web-messaging.html#broadcasting-to-other-browsing-contexts
  - title: OWASP Session Management Cheat Sheet
    url: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
  - title: MDN Broadcast Channel API
    url: https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API
---

A user can log out in one tab while another tab still shows a signed-in screen. The [HTML Standard](https://html.spec.whatwg.org/dev/web-messaging.html#broadcasting-to-other-browsing-contexts) uses this case to illustrate `BroadcastChannel`. Tabs that create a channel with the same name can send each other a logout signal. The sender updates its own screen because it does not receive its own broadcast.

## Send a signal after logout

End the session through your application’s logout flow first. [OWASP’s session guidance](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) calls for server-side invalidation when a user logs out. A channel message updates other tabs; it does not invalidate the session for them.

```js
const channel = new BroadcastChannel("auth");

channel.onmessage = ({ data }) => {
  if (data?.type === "logout") showSignedOut();
};

async function logOut() {
  await endSessionOnServer();
  channel.postMessage({ type: "logout" });
  showSignedOut();
}
```

Here, `endSessionOnServer()` is your application’s logout request, and `showSignedOut()` clears its signed-in view. The `await` keeps the success signal behind the server response. Handle a failed request in the logout control so the user can see that logout did not finish. The [standard’s example](https://html.spec.whatwg.org/dev/web-messaging.html#broadcasting-to-other-browsing-contexts) likewise separates the logout operation from the screen update and broadcast.

## Account for storage partitions

A shared origin and channel name do not guarantee delivery. [MDN’s Broadcast Channel guide](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API) explains that an app embedded on another site may be unable to message a standalone tab of that same app because the browser places them in different storage partitions.

The [standard](https://html.spec.whatwg.org/dev/web-messaging.html#broadcasting-to-other-browsing-contexts) describes sending messages to other channel objects already set up for that name. A tab opened later has no earlier logout message to receive. Treat the broadcast as a prompt to update an open screen, and check session state when a page loads or becomes active. Keep access decisions tied to the server-side session, as [OWASP advises](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).

## What to do

Implement server-side logout, then broadcast a small `logout` event after it succeeds. Have receiving tabs clear their signed-in views. Recheck the session on page load and return to an inactive tab. Test ordinary tabs and embedded pages separately. Close a channel when its page component no longer needs it; the [HTML Standard](https://html.spec.whatwg.org/dev/web-messaging.html#broadcasting-to-other-browsing-contexts) recommends closing unused channels so they can be collected.
