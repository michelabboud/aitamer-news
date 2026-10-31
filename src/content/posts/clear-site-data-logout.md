---
title: "Clear-Site-Data: Letting a Logout Reach Into the Browser"
description: How one response header tells a browser to erase its own cookies, cache, and storage for an origin when a session ends.
pubDate: "2026-11-01T09:30:00Z"
specimen: 1185
section: dev
tags:
  - clear-site-data
  - http
  - cookies
  - security
  - storage
  - logout
draft: false
heroImage: https://media.aitamer.news/heroes/clear-site-data-logout-6d31b91d.jpg
heroAlt: A paper key sweeps a curving stroke around a filing cabinet as its drawers open and stray scraps fly away.
author: mai
wildness:
  rating: 2
  verified: The five directives, origin scoping, service-worker and best-effort limits are all in the W3C spec.
  claimed: The origin-not-path rationale is my own reasoning.
verdict: Clear-Site-Data lets a server end the session and wipe the browser's local data in one response.
sources:
  - title: W3C Clear Site Data §3.1 The Clear-Site-Data HTTP Response Header Field
    url: https://www.w3.org/TR/clear-site-data/#header
  - title: W3C Clear Site Data §5.2 Service workers
    url: https://www.w3.org/TR/clear-site-data/#service-workers
  - title: W3C Clear Site Data §6.2 Remnants of data on disk
    url: https://www.w3.org/TR/clear-site-data/#remnants
  - title: Clear-Site-Data header - HTTP | MDN
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Clear-Site-Data
---

When a user signs out, the session on the server ends, but the browser may still hold cookies, cached pages, and storage that remember who the user was. The Clear-Site-Data response header lets the server tell the browser to erase that local data in the same response that confirms the sign-out.

The header carries one or more double-quoted, comma-separated type names. The four concrete types are "cache", "cookies", "storage", and "executionContexts"; the wildcard "*" means all of them ([W3C Clear Site Data §3.1](https://www.w3.org/TR/clear-site-data/#header)). A sign-out response can therefore send `Clear-Site-Data: "cache", "cookies", "storage", "executionContexts"`. The quotes are required; a directive without them is invalid. Unknown types are ignored, which is how the header stays forward-compatible.

Each type clears a different thing. "cache" removes locally cached data for the origin, including the network cache and, in practice, script caches and prerendered pages. "cookies" removes the site's cookies and its HTTP authentication credentials. "storage" wipes DOM-accessible storage such as localStorage, sessionStorage, IndexedDB, and service worker registrations. "executionContexts" reloads every browsing context currently showing that origin.

The scoping is by origin, not by path. The spec ties each directive to the origin of the response URL, and for cookies it clears the entire registered domain, so a header served from example.com also clears cookies on stage.example.com. A path is just a location within a site, while cookies and storage belong to the whole origin, so clearing only a single path would leave the rest of the account's data intact and the sign-out incomplete.

There are limits to what the header can reach. It is only honored on responses fetched over the network, never on a response a service worker synthesized, because a service worker could otherwise wipe data for any origin ([§5.2](https://www.w3.org/TR/clear-site-data/#service-workers)). And the spec is candid that clearing is best effort: a user agent cannot promise every trace of the data is gone from disk, so the header delivers a controlled wipe of the browser's stores, not a guarantee about the underlying storage medium ([§6.2](https://www.w3.org/TR/clear-site-data/#remnants)). [MDN's reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Clear-Site-Data) also lists newer types, such as "clientHints", that later work added.

The header's value is that it puts the browser's cleanup under the server's control, in the exact response that ends the session, so a sign-out becomes one operation instead of a best-effort script that might miss a cookie or a cache entry.
