---
title: The URL an Agent Fetches Can Point Inward
description: A user-supplied URL can make a server contact private services. Here is how server-side request forgery works and how to set safe fetch boundaries.
pubDate: "2026-10-06T02:00:00Z"
specimen: 293
section: dev
tags:
  - security
  - ssrf
  - web-development
  - networking
draft: false
heroImage: https://media.aitamer.news/heroes/the-url-an-agent-fetches-can-point-inward-8974ef2c.jpg
heroAlt: A web request from a laptop passes a server boundary toward protected internal systems.
author: ari
wildness:
  rating: 3
  verified: OWASP and MITRE describe user-controlled fetches reaching internal resources.
  claimed: The same request boundary applies to an assistant feature that fetches links.
verdict: Set a destination policy for every server-side fetch, enforce it at connection time, and restrict the fetcher’s network reach.
sources:
  - title: Server Side Request Forgery | OWASP Foundation
    url: https://community.owasp.org/attacks/Server_Side_Request_Forgery
  - title: Server-Side Request Forgery Prevention Cheat Sheet | OWASP
    url: https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html
  - title: "CWE-918: Server-Side Request Forgery | MITRE"
    url: https://cwe.mitre.org/data/definitions/918
---

A person gives an assistant a link and asks for a summary. The assistant passes the link to a service that downloads the page. That service may sit inside a private network. The person who supplied the link may have no direct access to that network, yet the service can make requests from inside it.

This is the opening for server-side request forgery, or SSRF. The attacker controls a destination that a server will contact. [OWASP's attack description](https://community.owasp.org/attacks/Server_Side_Request_Forgery) explains that the destination can be an internal resource rather than a public page. The same pattern can arise in an image importer, a URL preview, or a webhook feature. By that reasoning, an assistant that passes a link to a fetch service faces the same network boundary.

## The server carries the request inward

A fetcher makes a request with its own network reach. If it accepts a user-supplied URL without checking the destination, it can reach places the user cannot. [MITRE's definition of SSRF](https://cwe.mitre.org/data/definitions/918) describes a server that retrieves a URL from an upstream component without ensuring that the request goes to the expected destination.

Suppose a page preview accepts a link that resolves to an internal service. The request comes from the preview server. The internal service sees a request from a system that may be allowed through a firewall. If the preview returns the response, private data can flow back to the person who submitted the link. If the feature sends requests that change state, the damage can extend beyond disclosure. OWASP describes both reading internal resources and sending requests to internal services.

## The inside has several targets

An internal application programming interface may expose administrative functions or data that the public internet cannot reach. A database with an HTTP interface may be reachable only inside a network. OWASP also names cloud instance metadata as a target. In some setups, metadata can include credentials or other sensitive configuration. The result depends on the service, its access controls, and what the fetcher returns. [OWASP lists these targets in its attack description](https://community.owasp.org/attacks/Server_Side_Request_Forgery).

The URL scheme matters too. A client that accepts more than web URLs may handle a file URI and read local files. The [OWASP prevention guide](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html) warns that SSRF is not limited to HTTP. A safe design must define which kinds of request the feature actually needs.

## A familiar-looking URL can lead elsewhere

A check on the text of a URL is fragile. The application may parse a host one way while another component parses it differently. OWASP advises rejecting parser disagreement and, where possible, accepting a host from a known list and building the request in application code. It also advises disabling automatic redirects. A public URL that redirects to an internal destination defeats a check that examined only the first address. [The OWASP prevention guide covers these cases](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html).

Domain names add another step. A name that looks public can resolve to a local or private address. A later resolution can also produce a different answer. The guide calls out this DNS risk and says to check both IPv4 and IPv6 addresses. That makes a single string comparison, or a small list of blocked hostnames, a weak boundary.

## The destination policy follows the feature

Some fetchers only need a known partner service. For them, an explicit list of permitted hosts is practical. The application can accept the minimum input it needs, match it against that list, and construct the scheme, port, path, and request itself. This keeps user-controlled URL parts out of the request. OWASP recommends this approach when the trusted destinations are known.

A general web preview has a different requirement: it must reach public sites that are unknown in advance. OWASP says an allowlist of destinations is often unavailable in that case. The application must then reject private, local, and link-local destinations, including those reached through DNS. It should allow only the protocols the feature needs and disable automatic redirects. Network rules should also prevent the fetcher from contacting internal services. These checks work together because URL filtering alone has gaps. [OWASP sets out both cases and the network controls](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html).

## What to do

1. Find every feature that downloads a user-controlled address. Include imports, previews, image fetches, and callbacks. Treat a link passed through an assistant the same way as one typed into a form.

2. Write down the destinations each feature needs. If the list is fixed, allow only those destinations. Build the outgoing request from validated fields rather than forwarding a complete user URL.

3. For features that must fetch arbitrary public sites, restrict protocols to the ones needed. Resolve hostnames and reject local, private, and link-local addresses in both IP families. Reject a destination if any resolved address is disallowed, and ensure the actual connection uses a vetted address so a later DNS answer cannot change the destination.

4. Turn off automatic redirects. If a feature needs redirects, apply the destination policy to each new target before making the next request. Reject ambiguous URLs that different components parse differently.

5. Limit the fetcher's network access. Deny routes to internal services and metadata endpoints unless the feature has a specific need for them. Application checks and network rules should enforce the same boundary.

6. Test the boundary with direct internal addresses, names that resolve inward, redirects, and unsupported schemes. Confirm that a rejected request never reaches the target. These tests exercise the failure modes described in [OWASP's prevention guide](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html).
