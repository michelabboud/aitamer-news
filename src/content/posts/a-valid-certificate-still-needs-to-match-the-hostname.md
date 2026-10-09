---
title: A Valid Certificate Still Needs to Match the Hostname
description: A trusted TLS certificate can belong to the wrong service. Follow the reference hostname into subjectAltName and reject mismatches without Common Name fallback.
pubDate: "2026-10-10T06:00:00Z"
section: devops
tags:
  - tls
  - certificates
  - hostname-verification
  - api-security
draft: false
heroImage: https://media.aitamer.news/heroes/a-valid-certificate-still-needs-to-match-the-hostname-b3d291ea.jpg
heroAlt: A sealed paper certificate accompanies two differently shaped doorways, with an arched identity template fitting only the teal house.
author: ari
wildness:
  rating: 1
  verified: RFC 9525 matches independent reference identities to typed subjectAltName entries.
  claimed: No additional empirical claim; the speech endpoint is an illustrative example.
verdict: Match the intended host to the correct subjectAltName type on every TLS hop; repair routing or certificates rather than disabling name checks.
sources:
  - title: "RFC 9525: Service Identity in TLS"
    url: https://www.rfc-editor.org/rfc/rfc9525.html
---

A speech client is configured to call `https://speech.example/recognize`. The load balancer presents a certificate issued by a trusted authority, within its validity period, for `api.example`. The cryptography can be sound while the service identity is wrong for this request. Accepting that connection would let the client send audio to a host it did not intend to trust.

[RFC 9525](https://www.rfc-editor.org/rfc/rfc9525.html) describes this check as matching a client-side reference identity against an identity presented in the server's leaf certificate. For an ordinary HTTPS URL with a DNS hostname, the reference DNS name comes from the intended URL or another trusted application input. The client constructs it independently of the certificate the server sends. `speech.example` must then match an appropriate `dNSName` entry in the certificate's `subjectAltName` extension. A trusted chain, a current certificate and a matching name are distinct checks; passing one does not substitute for the others.

The difference matters during routing changes. If DNS resolves `speech.example` through a CNAME to `edge.example`, the intermediate DNS name does not automatically become the client's reference identity. If an internal proxy connects to an upstream using a different configured hostname, that hop needs its own identity policy. Taking the name from whatever certificate arrived would let the peer choose the test it must pass.

The certificate's subject Common Name is an unsafe place to rescue a mismatch. RFC 9525 says the Common Name must not identify the service; its free-form text lacks the typing needed for consistent verification. For a URL containing an IP address, the reference identity is an IP address and requires a matching `iPAddress` subjectAltName entry. A `dNSName` entry that merely spells the address as text is a different identifier type. Wildcards have limits too: a presented `*.example` may cover one leftmost label, such as `speech.example`, according to the specified wildcard rules. It does not cover `api.speech.example`.

When the speech endpoint changes, inspect the URL that clients use and the leaf certificate served at that address. Issue a certificate with the needed subjectAltName entries, or change the trusted configuration and certificate together. Keep name verification enabled in SDKs and health checks. A connection that fails because its hostname does not match is reporting a real identity error, even if a certificate viewer calls the chain valid.
