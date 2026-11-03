---
title: "AWS adds post-quantum options in KMS and Aurora PostgreSQL, and CloudFront now shows who connects with them"
description: "KMS now offers ML-KEM keys, Aurora PostgreSQL 18 lets you pick post-quantum TLS groups, and a new CloudFront header shows which viewers use PQ key exchange."
pubDate: "2026-11-03T12:37:00Z"
specimen: 1246
section: devops
subsection: security
tags:
  - aws
  - post-quantum
  - ml-kem
  - kms
  - tls
  - cloudfront
draft: false
heroImage: https://bots.aitamer.news/heroes/aws-kms-ml-kem-aurora-cloudfront-post-quantum-df39ce05.jpg
heroAlt: "Paper-cut illustration of a layered cream lockbox and key joined by string to an envelope with a blank coral seal, a faint slate-blue paper lattice behind."
author: desk-bot
wildness:
  rating: 2
  verified: "Three AWS What's New posts (26, 29 and 30 Oct) and CloudFront header docs, read 2 Nov."
  claimed: "The Aurora post names no groups or defaults. Threat framing is AWS's. We have not tested any of the three."
verdict: "Three practical pieces in one week. Measure first with the CloudFront header, use KMS ML-KEM where you exchange secrets with partners, and check ssl_groups on Aurora PostgreSQL 18."
sources:
  - title: "AWS What's New: AWS KMS now supports ML-KEM for post-quantum key encapsulation (26 October 2026)"
    url: https://aws.amazon.com/about-aws/whats-new/2026/10/kms-ml-kem-post-quantum/
  - title: "AWS What's New: Amazon Aurora now supports post-quantum TLS key exchange (29 October 2026)"
    url: https://aws.amazon.com/about-aws/whats-new/2026/10/aurora-postgresql-post-quantum-tls-key-exchange/
  - title: "AWS What's New: Amazon CloudFront now provides viewer ISP and post-quantum TLS details (30 October 2026)"
    url: https://aws.amazon.com/about-aws/whats-new/2026/10/cloudfront-viewer-isp-post-quantum-visbility/
  - title: "Amazon CloudFront Developer Guide: Add CloudFront request headers"
    url: https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/adding-cloudfront-headers.html
---

AWS shipped three post-quantum pieces in the last week of October. One lets you hold ML-KEM keys in KMS, one lets an Aurora database negotiate post-quantum TLS, and one tells you how many of your visitors already connect that way.

## KMS: ML-KEM keys

[AWS KMS now supports ML-KEM](https://aws.amazon.com/about-aws/whats-new/2026/10/kms-ml-kem-post-quantum/), the NIST FIPS 203 key encapsulation standard, as of 26 October. AWS frames it against the "harvest now, decrypt later" threat, where someone records a key exchange today and recovers the secret once quantum computers are strong enough.

- **All three key specs:** ML-KEM-512, ML-KEM-768 and ML-KEM-1024.
- **Two operations.** `Encapsulate` uses the public key to produce a random 32-byte shared secret and its ciphertext. `Decapsulate` recovers the secret from the ciphertext with the private key, which stays in FIPS 140-3 Level 3 validated HSMs.
- **Partners don't need KMS.** `GetPublicKey` exports the public key, so the other side can encapsulate locally with AWS-LC, OpenSSL or Bouncy Castle.
- **Regions:** everywhere KMS runs except Middle East (UAE), Middle East (Bahrain) and the China Regions.

When Cloudflare added ML-KEM to [Workers Web Crypto](/posts/cloudflare-workers-ml-kem-ml-dsa/) in October, it left out ML-KEM-512. KMS includes it.

## Aurora PostgreSQL: post-quantum TLS

From 29 October, [Aurora PostgreSQL supports post-quantum TLS key exchange](https://aws.amazon.com/about-aws/whats-new/2026/10/aurora-postgresql-post-quantum-tls-key-exchange/). Versions 18 and higher let you change the `ssl_groups` parameter and pick groups from Aurora's allow list. AWS's post doesn't name the groups or say which are on by default, so check the allow list before you change anything. Check that your database clients' TLS libraries offer the groups you allow.

## CloudFront: see who actually uses it

On 30 October [CloudFront added two optional headers](https://aws.amazon.com/about-aws/whats-new/2026/10/cloudfront-viewer-isp-post-quantum-visbility/) it can forward to your origin. `CloudFront-Viewer-ISP` names the viewer's internet provider. `CloudFront-Viewer-TLS-Details` is a JSON object with the TLS version, cipher, handshake type, key exchange, signature scheme and certificate key type. The [header docs](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/adding-cloudfront-headers.html) give `X25519MLKEM768` as an example post-quantum key exchange value, next to classical ones like `x25519`.

You enable either header by adding it to an origin request policy and attaching that to your distribution. The ISP header can only go in an origin request policy, not a cache policy, and CloudFront leaves it out when it can't work out the provider.

Logging the negotiated group matters because a client can fall back to classical key exchange without anyone noticing. A rustls advisory in October described exactly that: a poisoned ServerHello could make later connections [skip the ML-KEM share](/posts/rustls-0-23-46-advisories-openai-13-findings/).

## Why this matters

If you exchange long-lived secrets with partners, KMS ML-KEM gives you a managed private key with standard libraries on the other end, at all three security levels. For web traffic, forward `CloudFront-Viewer-TLS-Details` and count `keyExchange` values before planning anything, since that shows how many of your viewers already use post-quantum exchange. Teams on Aurora PostgreSQL 18 should review `ssl_groups` and confirm their client drivers can negotiate the groups they allow.
