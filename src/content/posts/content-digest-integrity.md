---
title: "Content-Digest: what a checksum proves and what it doesn't"
description: What the Content-Digest header actually protects against, and why a digest is not proof of origin without TLS or a signature.
pubDate: "2026-10-31T09:30:00Z"
section: dev
tags:
  - http
  - content-digest
  - checksum
  - integrity
  - git
  - rfc9530
draft: false
heroImage: https://media.aitamer.news/heroes/content-digest-integrity-ef50f2d8.jpg
heroAlt: A magnifying glass compares matching leaf impressions on two yellow wax seals.
author: mai
wildness:
  rating: 1
  verified: "RFC9530: a digest is an integrity check, not origin proof; SHA-256/512 active, md5/SHA-1 deprecated."
  claimed: Git dedup is logical, not physical; repack can duplicate kept objects; the sanity-check framing is mine.
verdict: Treat an in-band digest as an integrity check, not a trust certificate. Verify the expected digest against a source you already trust.
sources:
  - title: "RFC 9530: Digest Fields"
    url: https://www.rfc-editor.org/rfc/rfc9530.html
  - title: RFC 9530 §6.1 Security Considerations
    url: https://www.rfc-editor.org/rfc/rfc9530.html#section-6.1
  - title: Git Internals - Git Objects
    url: https://git-scm.com/book/en/v2/Git-Internals-Git-Objects
  - title: git-repack Documentation
    url: https://git-scm.com/docs/git-repack
---

A download that arrives corrupted is an annoyance. A download that arrives tampered with is a security problem. HTTP's `Content-Digest` field, standardized in [RFC 9530](https://www.rfc-editor.org/rfc/rfc9530.html), addresses the first case cleanly and is careful to say so about the second.

`Content-Digest` carries a hash of the message content, computed by the sender and available for the receiver to check. It lets a validating endpoint detect that bytes were damaged in transit or rewritten by a buggy intermediary. The field is a dictionary keyed by algorithm, so a sender can attach several digests at once, such as `sha-256` and `sha-512`. The registry marks which algorithms are still considered strong: SHA-256 and SHA-512 are active, while MD5, SHA-1, and the CRC-based algorithms are deprecated and suitable only for catching accidental corruption, not anything adversarial.

The RFC draws a sharp line the reader should not blur ([RFC 9530 §6.1](https://www.rfc-editor.org/rfc/rfc9530.html#section-6.1)). A digest proves nothing about who sent the data. A matching digest means the computed hash values agree: an integrity check whose strength depends on the algorithm and on how trustworthy the expected digest is, not a guarantee that the byte strings are identical. If the digest travels in the same message as the data and the channel is not otherwise protected, an attacker who can change the data can equally change and recompute the digest. Integrity is not authenticity. To establish origin, you combine the digest with TLS or with a signature, such as HTTP Message Signatures, that protects the field value itself.

The same distinction matters for content addressing, where the address of data is its hash. Git is a clear working example: its object store names each object by a hash of its content, so in principle two objects with identical content share a single logical location rather than being treated as two different things. But the identity is of the object, and the object hash is computed over the object header and content together, not the raw file bytes alone. Git's traditional object format uses SHA-1, which the HTTP registry now lists as deprecated for adversarial use; a SHA-256 object format exists as an option for repositories that need it. The deduplication is also a logical property rather than a physical guarantee: packing can leave duplicate objects in certain operations, as when a repack includes objects that also live in `.keep` packs ([git-repack docs](https://git-scm.com/docs/git-repack)).

The takeaway is small and concrete: checksums detect accidents; signatures and TLS establish trust. A `Content-Digest` you fetch alongside the file from the same untrusted server is a sanity check, not a certificate.
