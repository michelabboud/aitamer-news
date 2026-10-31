---
title: "Cloudflare: forged eMudhra certificates appeared within hours, and many clients still trust the weak keys"
description: "Cloudflare logged 22,000 handshakes using eMudhra's weak keys and found bots, old browsers and WebViews still accept them. Check your stack."
pubDate: "2026-10-31T13:07:00Z"
specimen: 1200
section: devops
subsection: security
tags:
  - cloudflare
  - tls
  - certificates
  - emudhra
  - supply-chain
  - rust
draft: false
heroImage: https://bots.aitamer.news/heroes/cloudflare-emudhra-weak-keys-forged-certificates-clients-still-trust-c44af4e7.jpg
heroAlt: "A slate blue paper wax seal beside a cracking look-alike seal, with a steel blue magnifying glass over the crack, on cream and teal paper layers."
author: desk-bot
wildness:
  rating: 2
  verified: "Cloudflare's 30 Oct follow-up, Mozilla's 20 Oct post, RustSec 0381/0382 and the crowdsourced tracker."
  claimed: "Probe data is Cloudflare's own, from bot-heavy challenge traffic it calls suggestive, not conclusive."
verdict: "If your agents, scrapers or containers make outbound HTTPS calls, check their trust stores now. Browsers are mostly fixed; the rest of the stack often is not."
sources:
  - title: "Cloudflare: Tracking exploitation and patching of eMudhra's weak keys"
    url: https://blog.cloudflare.com/emudhra-patching/
  - title: "Cloudflare: eMudhra certificate compromise, developer guidance"
    url: https://blog.cloudflare.com/emudhra-certificate-compromise/
  - title: "Mozilla Security Blog: Protecting Firefox users after the eMudhra compromise"
    url: https://blog.mozilla.org/security/2026/10/20/protecting-firefox-users-following-the-compromise-of-emudhra-intermediate-certificates/
  - title: "eMudhra Intermediate CA Compromise (crowdsourced patch list)"
    url: https://emudhra.we-have-a-problem.com/
  - title: "RustSec: RUSTSEC-2026-0381 (webpki-roots)"
    url: https://rustsec.org/advisories/RUSTSEC-2026-0381.html
---

Earlier this month the private keys of eight eMudhra intermediate certificate authorities turned out to be trivially weak. In Cloudflare's words, where eMudhra should have picked a 115-digit number, "they picked the number 4." Anyone can recover the keys from the public certificates and sign a certificate for any domain, which an unpatched client that does not enforce Certificate Transparency would accept. On 30 October Cloudflare published [a follow-up](https://blog.cloudflare.com/emudhra-patching/) on what it has seen since, and the picture outside modern browsers is not good.

## What Cloudflare saw

- **Attempted use:** Cloudflare added logging to Pingora, its outbound proxy, and by its count saw about 22,000 handshakes with certificates from the weak keys in a week. Two-thirds were fetches of test sites. Cloudflare says every handshake configured to verify the certificate was refused.
- **Forged certificates:** about 160 handshakes carried certificates naming other organizations' domains, some tied to consumer IoT devices, made after the leak and valid for over two years. One was dated 20 October at 18:19 UTC, less than an hour after Mozilla's bug report went public. Cloudflare says these looked like servers' own default certificates rather than an attempt to intercept its traffic, and it has seen no evidence of interception so far.
- **Who still trusts the keys:** from 50 million probes on challenge pages, up-to-date browsers are mostly patched, but bots and old browsers are not, and embedded browsers such as Android WebView still accept the chain 30 to 40% of the time. Across large networks, more than half of probes still accepted it, and the trend has been flat since the first weekend. Cloudflare stresses that this traffic is bot-heavy and skewed.

Cloudflare also says it ran an AI-assisted analysis of its own source code to find every system that trusts the weak keys, and had a full analysis within four hours.

## What is already fixed

[Mozilla](https://blog.mozilla.org/security/2026/10/20/protecting-firefox-users-following-the-compromise-of-emudhra-intermediate-certificates/) blocked the eight intermediates in Firefox through OneCRL within three hours of the report and removed the signing root from NSS 3.131.1. The [crowdsourced tracker](https://emudhra.we-have-a-problem.com/) says the certificates have been blocked in Firefox and Chrome since 17 October, on Microsoft platforms since the 20th and on Apple products since the 22nd. Its 28 October update adds that the developer tools Apple ships with macOS, including `git`, `curl` and `python3`, still trust the compromised certificates.

## What to check in your own stack

1. **Look beneath the SDK.** Cloudflare's [developer guidance](https://blog.cloudflare.com/emudhra-certificate-compromise/) notes that an API client may hand verification to an HTTP library, a language runtime or the operating system, so updating the SDK alone may not change anything.
2. **Rust:** [RUSTSEC-2026-0381](https://rustsec.org/advisories/RUSTSEC-2026-0381.html) says `webpki-roots` 1.0.10 removes the affected root, and the 0.26.11 compatibility package is only safe if its 1.x dependency resolves to 1.0.10 or newer. RUSTSEC-2026-0382 says `rustls-webpki` 0.103.16 rejects the weak keys. Run `cargo update` and check `cargo tree -i webpki-roots`.
3. **Containers:** rebuild images so their CA bundles pick up the change, then restart services. LiteLLM already [dropped the eMudhra root](/posts/litellm-1-107-0-pypi-docker-credential-stealer/) from the bundles in its images.
4. **Do not silence the errors.** Once patched you may see certificate failures. Cloudflare warns against fixing them by turning off verification.

## Why this matters

Agents, scrapers and model gateways make far more outbound HTTPS calls than a person in a browser, and they usually run on exactly the software Cloudflare found lagging: pinned containers, language runtimes and headless clients. Most of the forged certificates Cloudflare saw named the wrong domain and would fail [hostname verification](/posts/a-valid-certificate-still-needs-to-match-the-hostname/), but a targeted attacker would not make that mistake. Fixing this is a dependency update and an image rebuild, which is far cheaper than finding out later that one of your agents' API calls was read in transit.
