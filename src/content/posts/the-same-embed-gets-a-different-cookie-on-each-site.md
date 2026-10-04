---
title: The Same Embed Gets a Different Cookie on Each Site
description: A partitioned cookie lets an embed remember state within one top-level site. The site around the embed becomes part of the cookie’s key.
pubDate: "2026-10-06T14:30:00Z"
specimen: 317
section: general
tags:
  - cookies
  - web-privacy
  - chips
  - embeds
draft: false
heroImage: https://media.aitamer.news/heroes/the-same-embed-gets-a-different-cookie-on-each-site-d4b2d83a.jpg
heroAlt: The same embedded cookie sits inside three different site windows, each with its own setting.
author: ari
wildness:
  rating: 3
  verified: The cookie key includes its host or domain and the top-level site's scheme and registrable domain.
  claimed: One embed can keep separate cookie state for each top-level site that displays it.
verdict: The site around an embed determines which partitioned cookie the browser sends. Check older clients before relying on that separation.
sources:
  - title: CHIPS (Cookies Having Independent Partitioned State) proposal
    url: https://github.com/privacycg/CHIPS
---

A support widget may need to remember a conversation while someone moves through a shop. The [CHIPS proposal](https://github.com/privacycg/CHIPS) uses that example to show why an embedded service needs a cookie within one top-level site. The same service can appear on other sites, where a shared cookie could connect visits across them.

## The key includes the site around the embed

A cookie normally has a host or domain key. Under the proposal, a cookie marked `Partitioned` gets a second key: the site of the top-level URL when the request that set it began. Here, “site” means the URL scheme and registrable domain. The browser sends the cookie only when the current request has the same top-level-site key.

Picture an embed from `red.com` inside `green.com`. A partitioned cookie set there is available to `red.com` when `green.com` is the top-level site. If the person then visits `blue.com`, an embed from `red.com` does not receive `green.com`’s cookie. It can establish separate state for `blue.com`. Returning to `green.com` makes the cookie from that partition available again.

## What the boundary covers

The `Partitioned` attribute is an opt-in instruction in `Set-Cookie`. The design also requires `Secure`, so the cookie is set and sent over secure connections. Its cross-site examples use `SameSite=None`. A support widget can therefore remember a conversation across pages of one top-level site while keeping that cookie out of its embeds on other sites.

The proposal covers cookies. It does not partition local storage, caches, or service workers. It also says older clients may ignore the new attribute. Browser behavior needs checking before a site relies on this boundary.

## What to do

Identify embeds that need a session or preference within the site displaying them. For those cookies, add `Partitioned` and `Secure` to `Set-Cookie`. Use `SameSite=None` when the cookie must be sent in a cross-site context. Then check the embed on two unrelated top-level sites: state should survive navigation within each site, and a cookie from one site should not arrive on the other. Check older clients separately.
