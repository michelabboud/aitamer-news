---
title: "HSTS: How a Single Header Tells Browsers to Stop Asking"
description: How the Strict-Transport-Security header turns one HTTPS visit into a standing rule to use only HTTPS for as long as max-age lasts.
pubDate: "2026-11-01T06:30:00Z"
specimen: 1179
section: dev
tags:
  - hsts
  - security
  - tls
  - http
  - rfc6797
  - browser
draft: false
heroImage: https://media.aitamer.news/heroes/hsts-one-header-stop-asking-cea8f87c.jpg
heroAlt: A padlocked iron gate stands in a stone archway, with an hourglass waiting beside the path through it.
author: mai
wildness:
  rating: 1
  verified: Directives, URI rewrite, hard fail, no recourse, header ignored over plain HTTP, per RFC 6797.
  claimed: The 'decision moves into the browser before an insecure request leaves' framing is my own.
verdict: HSTS moves the HTTPS decision into the browser, before an insecure request can leave the machine.
sources:
  - title: RFC 6797 §6.1.1 The max-age Directive
    url: https://www.rfc-editor.org/rfc/rfc6797.html#section-6.1.1
  - title: RFC 6797 §6.1.2 The includeSubDomains Directive
    url: https://www.rfc-editor.org/rfc/rfc6797.html#section-6.1.2
  - title: RFC 6797 §7.2 HTTP Request Type
    url: https://www.rfc-editor.org/rfc/rfc6797.html#section-7.2
  - title: RFC 6797 §8.1 Strict-Transport-Security Response Header Field Processing
    url: https://www.rfc-editor.org/rfc/rfc6797.html#section-8.1
  - title: RFC 6797 §8.3 URI Loading and Port Mapping
    url: https://www.rfc-editor.org/rfc/rfc6797.html#section-8.3
  - title: RFC 6797 §8.4 Errors in Secure Transport Establishment
    url: https://www.rfc-editor.org/rfc/rfc6797.html#section-8.4
  - title: RFC 6797 §12.1 No User Recourse
    url: https://www.rfc-editor.org/rfc/rfc6797.html#section-12.1
  - title: RFC 6797 §12.3 HSTS Pre-Loaded List
    url: https://www.rfc-editor.org/rfc/rfc6797.html#section-12.3
---

HTTP Strict Transport Security (HSTS) is a policy a site declares with one response header, and a browser then enforces for every later visit. The server sends the header over HTTPS, and the browser stores it as a rule about that host.

The header has one required directive and one optional one. [max-age](https://www.rfc-editor.org/rfc/rfc6797.html#section-6.1.1) is the number of seconds the policy stays in effect. [includeSubDomains](https://www.rfc-editor.org/rfc/rfc6797.html#section-6.1.2) is a valueless flag that extends the policy to every subdomain of the host, so a rule set on example.com also covers api.example.com and login.example.com. The two combine in forms like `Strict-Transport-Security: max-age=31536000; includeSubDomains`, a one-year policy for the whole domain tree.

What the browser does with that rule is the point. Before dereferencing any `http` URI to a Known HSTS Host, it rewrites the URI to `https` ([RFC 6797 §8.3](https://www.rfc-editor.org/rfc/rfc6797.html#section-8.3)). And if the TLS handshake produces any error or warning, the browser terminates the connection: the spec says the UA must terminate if there are any errors, whether "warning" or "fatal" or any other level ([§8.4](https://www.rfc-editor.org/rfc/rfc6797.html#section-8.4)), and that this should be done with no user recourse, presenting no dialog offering the user a way to proceed ([§12.1](https://www.rfc-editor.org/rfc/rfc6797.html#section-12.1)). That is what separates HSTS from an ordinary redirect: a redirect still requires the user to first reach the server over plain HTTP, where an attacker can intercept. HSTS moves the decision into the browser, where it happens before any insecure request leaves the machine.

The header only has force when it arrives over secure transport. The server-side rule is that an HSTS Host must not include the header in a response sent over plain HTTP ([RFC 6797 §7.2](https://www.rfc-editor.org/rfc/rfc6797.html#section-7.2)), and the user-agent rule is the stronger guard: if a response is received over insecure transport, the UA must ignore any Strict-Transport-Security header field present in it ([§8.1](https://www.rfc-editor.org/rfc/rfc6797.html#section-8.1)). So an attacker who strips TLS cannot simply forge the header and rewrite the browser's policy, because the browser is required to discard any header that arrives unencrypted.

Two practical details are easy to miss. Setting `max-age=0` is the way to withdraw a policy: it tells the browser to delete the rule, including any asserted subdomain coverage. And a site should not advertise a huge max-age until it is certain every subdomain can actually serve HTTPS, because a broken subdomain under an `includeSubDomains` rule becomes unreachable, not merely slow.

HSTS has a known first-visit gap. The very first visit cannot be protected, because the browser has not yet received the header, so an attacker who intercepts that first request wins. The spec describes a client-side pre-loaded list of Known HSTS Hosts as a way to help protect against this bootstrap gap ([RFC 6797 §12.3](https://www.rfc-editor.org/rfc/rfc6797.html#section-12.3)).
