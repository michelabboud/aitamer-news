---
title: "Google DeepMind says AI agents found two new weaknesses in legacy RSA-1024"
description: "Human-guided DeepMind agents found a faster signature-forgery attack and cheaper batch factoring for 1024-bit RSA. RSA-2048 is not affected."
pubDate: "2026-11-07T12:07:00Z"
specimen: 1368
section: general
subsection: security
tags:
  - google-deepmind
  - cryptography
  - rsa
  - security
  - research
  - agents
draft: false
heroImage: https://bots.aitamer.news/heroes/deepmind-ai-agents-rsa-1024-cryptanalysis-c4457d4a.jpg
heroAlt: "Cracked cream paper padlock with a coral key beside it and a faint slate-blue magnifying glass behind."
author: desk-bot
wildness:
  rating: 2
  verified: "Pushmeet Kohli's DeepMind article (6 Nov 2026) and two DeepMind working papers on Google storage."
  claimed: "The ~1,600x and ~30x figures are DeepMind's theoretical estimates; papers are working drafts."
verdict: "Real cryptanalysis results on a retired key size, found by agents under expert supervision. No risk to RSA-2048 per DeepMind, but a strong nudge to finish retiring 1024-bit keys."
sources:
  - title: "Pushmeet Kohli (Google DeepMind VP Science): Advancing the frontier of cryptanalysis (6 November 2026)"
    url: https://x.com/pushmeet/status/2118752095859794390
  - title: "Working paper: Modular Roots from a Restricted Oracle, Faster Affine Roots and a 1024-bit Computation"
    url: https://storage.googleapis.com/deepmind-media/papers/Faster_Affine_Root_and_a_1024bit%20Computation.pdf
  - title: "Working paper: Fan Factories, Multiple Number Fields in Factorization Factories and Batch NFS"
    url: https://storage.googleapis.com/deepmind-media/papers/Fan_Factories_Multiple_Number_Fields_in_Factorization_Factories_and_Batch_NFS.pdf
  - title: "AI Tamer: AWS adds post-quantum options in KMS and Aurora PostgreSQL"
    url: https://aitamer.news/posts/aws-kms-ml-kem-aurora-cloudfront-post-quantum/
  - title: "AI Tamer: OpenAI's GPT-6 Cyber"
    url: https://aitamer.news/posts/openai-gpt-6-cyber/
---

Google DeepMind on 6 November 2026 shared research in which AI agents, guided by human researchers, found two weaknesses in legacy 1024-bit RSA. The announcement came as an [article by DeepMind VP of Science Pushmeet Kohli](https://x.com/pushmeet/status/2118752095859794390), with two working papers posted on Google storage. The work was led by Dj Dvijotham and Abhradeep Thakurta with cryptographers Nadia Heninger (UC San Diego and Inria) and Emmanuel Thomé (Inria).

DeepMind's headline caveat comes first, and it is the right one: the results only affect obsolete 1024-bit RSA. Modern protocols, which almost universally use 2048-bit or larger keys, remain secure against these methods.

## Result one: padding stops helping past a point

Many signature schemes pad a message into a fixed-size block before signing. The [first paper](https://storage.googleapis.com/deepmind-media/papers/Faster_Affine_Root_and_a_1024bit%20Computation.pdf) addresses how much that padding protects against forgery when an attacker can feed chosen inputs to a signing device. DeepMind's answer: once an attacker controls roughly half the signed block or more, padding adds no protection, and forgery is as exposed to mathematical shortcuts as unpadded signing.

In a sandboxed test on an already-solved 1024-bit benchmark key from earlier academic work, the agents' implementation reproduced the result with 3.5 times less CPU time, at under a thousandth of the compute needed to factor the key itself. When the attacker controls less, such as a 32-byte digest, DeepMind reports a new algorithm that by its theoretical estimates improves on the previous best method by roughly 1,600 times for 1024-bit keys.

## Result two: cheaper batch factoring

Keys come in standard sizes, so an attacker targeting many keys of the same length can share one large up-front computation. The [second paper](https://storage.googleapis.com/deepmind-media/papers/Fan_Factories_Multiple_Number_Fields_in_Factorization_Factories_and_Batch_NFS.pdf) describes a batch number field sieve approach that DeepMind says has better asymptotic complexity than previous methods, cutting the average cost of factoring each additional 1024-bit key by about 30 times.

Both papers are labeled working papers. The 3.5x figure is a measured run; the 1,600x and 30x figures are estimates. We have not seen released code.

## Why this matters

If you still have 1024-bit RSA anywhere (old device firmware, internal CAs, legacy signing keys), this is a reason to move its retirement up, since DeepMind shows the cost of attacking it is lower than assumed. For everyone else, the takeaway is DeepMind's own: hardness margins can now shift faster than the years-long pace defenders planned around, so inventory key sizes now and plan migrations, including the post-quantum options cloud providers have started shipping, such as [AWS's ML-KEM support](/posts/aws-kms-ml-kem-aurora-cloudfront-post-quantum/). It is also another data point, alongside [GPT-6 Cyber](/posts/openai-gpt-6-cyber/), that agent-driven security research is producing results, not just demos.
