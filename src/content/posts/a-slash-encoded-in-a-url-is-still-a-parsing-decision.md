---
title: A Slash Encoded in a URL Is Still a Parsing Decision
description: An encoded slash can be identifier data or a path boundary. Parse URL structure before decoding, and give each routing layer one clear interpretation.
pubDate: "2026-10-09T08:30:00Z"
specimen: 566
section: dev
tags:
  - urls
  - routing
  - percent-encoding
  - ai-applications
draft: false
heroImage: https://media.aitamer.news/heroes/a-slash-encoded-in-a-url-is-still-a-parsing-decision-819d1d3e.jpg
heroAlt: A blue identifier ribbon stays whole while rust matching pieces are separated at a cream paper routing boundary under a magnifier.
author: ari
wildness:
  rating: 1
  verified: RFC 3986 distinguishes reserved delimiters from encoded data and forbids repeated decoding.
  claimed: The transcript route is illustrative; actual proxy and router behavior requires local verification.
verdict: Parse path structure before decoding, define whether encoded slashes are allowed in identifiers, and keep authorization and lookup on the same decoded value.
sources:
  - title: "RFC 3986: Reserved Characters"
    url: https://www.rfc-editor.org/rfc/rfc3986.html#section-2.2
  - title: "RFC 3986: When to Encode or Decode"
    url: https://www.rfc-editor.org/rfc/rfc3986.html#section-2.4
---

A transcript fetch fails only for a customer whose session ID contains a slash. The client requests `/transcripts/acme%2Freview`, intending `acme/review` as one identifier. The gateway treats `%2F` as data, but a downstream router decodes it and matches two path segments. The same request now names a different resource.

The percent sign and two hexadecimal digits encode an octet. In this case `%2F` represents `/`, a reserved character. A literal slash separates path segments; its encoded form can carry a slash as data inside a segment. [RFC 3986's reserved-character rules](https://www.rfc-editor.org/rfc/rfc3986.html#section-2.2) say replacing one with the other can change a URI's interpretation. There is no universal promise that a framework will accept an encoded slash as part of an identifier. That behavior belongs to the route and the layers in front of it.

Order is the critical detail. The URI parser first identifies components, and the path parser determines which literal slashes delimit segments. Only then can an application decode the data inside the chosen component or segment. [RFC 3986's decoding guidance](https://www.rfc-editor.org/rfc/rfc3986.html#section-2.4) warns that decoding before separation can turn data into a delimiter. An authorization check and a handler must use the same interpretation. Checking one segment while the handler sees two can select a transcript outside the intended scope.

A second decode creates another trap. `/transcripts/acme%252Freview` contains `%25`, which decodes to a literal percent sign. After one decode the identifier is `acme%2Freview`. Decode it again and the identifier becomes `acme/review`. RFC 3986 explicitly rules out decoding the same string more than once. This is easy to violate when a proxy, framework, and application each believe they received untouched URL text.

For a path identifier, decide whether a slash is valid data. If it is, use a route that preserves encoded segment boundaries through every intermediary, decode that segment once, and validate the decoded value before lookup. If it is not, reject an encoded slash at the boundary instead of letting another layer decide. Log the raw path and the parsed identifier as separate fields when diagnosing mismatches; never feed the logged identifier back into URL decoding. The useful invariant is simple: routing, authorization, and resource lookup agree on one parsed path.
