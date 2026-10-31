---
title: "CSP Nonces and strict-dynamic: Trust One Script, Not a Host List"
description: How a per-response nonce authorizes inline and external scripts, and how strict-dynamic lets a trusted script vouch for everything it loads.
pubDate: "2026-11-01T10:30:00Z"
specimen: 1187
section: dev
tags:
  - csp
  - security
  - nonce
  - strict-dynamic
  - xss
  - http
draft: false
heroImage: https://media.aitamer.news/heroes/csp-nonces-strict-dynamic-f76ec369.jpg
heroAlt: A sealed envelope with a key pressed into its wax passes a ribbon on to smaller envelopes, while a crossed-out scroll lies aside.
author: mai
wildness:
  rating: 2
  verified: Nonce grammar, strict string matching, and strict-dynamic trust propagation, per CSP3 and MDN.
  claimed: The 'reused nonce is worthless' framing and 'trust one root script' mental model are my own.
verdict: A nonce authorizes one script; strict-dynamic lets that script authorize everything it loads.
sources:
  - title: Content Security Policy Level 3 (W3C)
    url: https://www.w3.org/TR/CSP3/
  - title: "MDN script-src: strict-dynamic"
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src#strict-dynamic
  - title: "MDN script-src: Unsafe inline script (nonces)"
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src#unsafe_inline_script
---

A Content-Security-Policy that says `script-src 'self'` blocks every inline script, because a string of inline JavaScript has no URL for the browser to check against a source list. For a page that needs inline scripts, the modern answer is a nonce: a short random value generated fresh for every response.

The server generates the nonce with a cryptographically secure generator and embeds it twice: once in the CSP header as a source expression, once in the script element as an attribute, and the two must match exactly. [CSP Level 3](https://www.w3.org/TR/CSP3/) defines the nonce as `'nonce-'` followed by a base64 value, and treats nonces as strict string matches: the browser does not decode the value, it only compares the attribute to the policy. [MDN's guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src#unsafe_inline_script) is explicit that the nonce must be generated dynamically and be unique per HTTP request. A nonce that stays the same across responses is not much better than allowing inline scripts outright, because anyone who can read one response can reuse its nonce.

A nonce works for both inline and external scripts: a script element with a `src` and a matching `nonce` attribute is trusted too. The catch is that a nonce only vouches for the script it is attached to. If that script then creates new script elements and loads more JavaScript, the browser has no nonce for those and would block them.

That is the gap `'strict-dynamic'` closes. It says that trust given to a script in the markup, through a nonce or a hash, propagates to every script that script loads. [The MDN strict-dynamic section](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src#strict-dynamic) states that the trust "shall be propagated to all the scripts loaded by that root script." A loader script given a nonce can fetch and run its dependencies without each one needing its own nonce.

In exchange for that propagation, strict-dynamic changes how the browser reads the rest of the directive. Host allowlists and source expressions like `'self'` and `'unsafe-inline'` are ignored. So `script-src 'strict-dynamic' 'nonce-abc' https://trusted.example.com` does not actually allow loading from trusted.example.com unless that script carries a matching nonce or was loaded by a trusted script. The nonce becomes the only real source of trust, and the host list goes inert.

The result is a stronger policy with a simpler mental model: trust one root script per page, let it bring in its own dependencies, and stop maintaining the long list of CDN hosts that older CSPs required. MDN also shows a backwards-compatible deployment trick, where `'unsafe-inline' https:` is kept alongside `'strict-dynamic'` so that older browsers, which ignore the keyword they do not understand, still enforce the allowlist, while CSP3 browsers honor strict-dynamic and ignore it.
