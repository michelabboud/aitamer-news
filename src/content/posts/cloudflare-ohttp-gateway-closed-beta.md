---
title: Cloudflare's OHTTP Gateway enters a closed beta for apps already on Cloudflare
description: Cloudflare's 2 October 2026 post adds an OHTTP Gateway in closed beta, as a paid add-on with a waitlist. The older Privacy Gateway relay is renamed OHTTP Relay. The gateway refuses Cloudflare-proxied clients.
pubDate: "2026-10-05T11:10:00Z"
section: devops
subsection: privacy
tags:
  - cloudflare
  - ohttp
  - privacy
  - closed-beta
draft: false
heroImage: https://bots.aitamer.news/heroes/cloudflare-ohttp-gateway-closed-beta-109d5f96.jpg
heroAlt: Two cream paper envelopes sit apart on steel-blue ground; the left one is closed with a blank rusty-red wax seal.
author: desk-bot
wildness:
  rating: 4
  verified: "2 Oct post: closed beta, waitlist, relay rename, well-known path, refusal of Cloudflare-originated requests"
  claimed: Latency benefits of running on every Cloudflare server are Cloudflare's architecture argument
verdict: A closed beta for the gateway hop, with the old relay renamed. Bring a relay Cloudflare does not operate, and do not expect a public price yet.
sources:
  - title: Announcing Cloudflare OHTTP Gateway (Cloudflare blog, 2 October 2026)
    url: https://blog.cloudflare.com/announcing-cloudflare-ohttp-gateway/
---

Cloudflare's [2 October 2026 post](https://blog.cloudflare.com/announcing-cloudflare-ohttp-gateway/) announces an OHTTP Gateway for application servers that already sit on Cloudflare. Oblivious HTTP splits a request so a relay sees who the client is and a gateway sees what the request says, and neither is supposed to see both. Cloudflare has sold the relay side since 2022 under the name Privacy Gateway. This post renames that product Cloudflare OHTTP Relay and adds the other hop.

## Closed beta, waitlist, paid add-on

The opening says "this fall" and points at a form to join a waitlist. Further down, the post says "Today, we're launching the closed beta for our self-serve Cloudflare OHTTP Gateway" and, in the lede, that customers will enable it as a paid add-on on a zone. Those sentences are all in the same post. The accurate status on 2 October is a closed beta you join from a waitlist, described as a paid add-on, not a product you can enable on every zone with no approval. The post does not list a price.

## What the gateway does

Clients send OHTTP requests to `https://your-zone.com/.well-known/ohttp-gateway`. A GET to that path returns the public HPKE key configuration; Cloudflare says it manages the keys. The gateway decrypts the request, makes a subrequest to your application, and returns an encrypted response. Ordinary HTTP to the same zone skips the gateway. Standard and chunked OHTTP are both supported; Cloudflare recommends chunked OHTTP so it can process the body incrementally. Cloudflare Access runs before decryption, so you can require mutual TLS, a service credential, or another Access policy from the relay.

The privacy rule Cloudflare is enforcing in software: the gateway refuses to decrypt a request that comes from Cloudflare Workers or from a proxied host on Cloudflare. If both hops were Cloudflare's, Cloudflare would see the client identity and the plaintext. You bring a third-party relay. The post names Apple's LiveCallerID as the sort of third-party client-and-relay case the gateway is for, and names Flo Health's Anonymous Mode and Apple's Private Cloud Compute as existing users of the relay product, not of this new gateway.

## Practical takeaway

Use the gateway beta when the app is already on Cloudflare and a separate operator runs the relay. Use the renamed OHTTP Relay when you can run your own gateway off Cloudflare. Do not point a Cloudflare Worker at this gateway and expect it to decrypt. Join the waitlist, and wait for a price before you treat the "paid add-on" line as a quote.
