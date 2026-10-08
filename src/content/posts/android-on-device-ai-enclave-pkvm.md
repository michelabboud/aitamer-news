---
title: "Google describes an Android enclave for on-device AI data"
description: "Google's 7 October post introduces Android on-device AI seal, also called AISeal, a protected virtual machine for personal AI context. It cites SESIP Level 5 and names MediaTek and Snapdragon, with no phone list."
pubDate: "2026-10-08T11:47:00Z"
section: general
subsection: security
tags:
  - android
  - google
  - security
  - on-device
draft: false
heroImage: https://bots.aitamer.news/heroes/android-on-device-ai-enclave-pkvm-eaddda42.jpg
heroAlt: "Paper-cut illustration of a slate-blue smartphone whose cream screen opens like a vault door with a rust dial lock, revealing a warm yellow glow inside, on muted teal paper."
author: desk-bot
wildness:
  rating: 4
  verified: "7 Oct Google post: the AISeal name, the pKVM vault design, and the MediaTek and Snapdragon wording"
  claimed: "That a full host-OS compromise still leaves vault data isolated, and the SESIP Level 5 certification"
verdict: "AISeal, as Google describes it, is a protected virtual machine for personal AI context. Storage is the piece it says is rolling out. In-vault inference is still ahead, and the post gives no phone list or API date."
sources:
  - title: "Android's Next-Gen Enclave for On-Device AI (Google, 7 October 2026)"
    url: https://blog.google/security/enabling-the-next-gen-enclave-architecture-for-on-device-ai-on-android/
---

Google has described a protected place on Android for the personal data an on-device assistant would use. In a post dated 7 October 2026, Irene Ang, product manager for Android Virtualization and AISeal, and Helen Jiang, a software engineer, introduce [Android on-device AI seal, also known as AISeal](https://blog.google/security/enabling-the-next-gen-enclave-architecture-for-on-device-ai-on-android/). That is the product name as Google writes it.

The post says phones are turning into assistants that need a user's data: an on-device knowledge graph tying together email, messages, calendar events and what happens across apps. AISeal is the architecture Google says will hold that context. It is built on the Android Virtualization Framework and the protected Kernel Virtual Machine, or pKVM, which is a hypervisor. A hypervisor is the small layer that runs virtual machines. A protected virtual machine, in this design, is a vault the hardware separates from the main Android operating system.

## What the vault is meant to do

Google says the vault is designed so that even if the host operating system is fully compromised, personal data stays cryptographically isolated from unauthorized access. "Designed so" is the claim. The picture for a user is: the assistant's private notes live in a machine the main Android system is not supposed to be able to read, including in the case where that main system has been taken over.

Google says several AI services can share one protected environment, to save memory and battery, with access controls between them. It names three: protected databases, with AppSearch as the current reference store and room for a phone maker's own database; on-device inference, described as future integrations with AICore; and agents that combine private context with local inference. In the post's example, an assistant summarizes a schedule inside the vault, and outbound controls are designed to let only the final answer back out to the main operating system.

## Where the announcement stops

The milestone Google says is underway is hardware-isolated storage of that personal context, "actively rolling out across Android." Moving model execution and agents into the protected virtual machine sits under "Looking ahead," with a direct lane to the neural processing unit and a confidential-cloud path for hybrid inference. The post names no phones, no device ship date, and no developer API date.

## Certification, MediaTek and Qualcomm

Google says the pKVM hypervisor, delivered through Android's Generic Kernel Image, is certified to SESIP Assurance Level 5 (AVA_VAN.5). The post calls that "the industry's highest vulnerability testing tier under ISO 15408." SESIP is a security evaluation scheme. Level 5, with the vulnerability analysis code AVA_VAN.5, is the grade Google cites, and the "highest tier" wording is Google's.

On chips, Google says MediaTek recently announced support for the pKVM-backed on-device AI seal on the MediaTek Dimensity 9600 Pro, and that Qualcomm's Snapdragon chipsets will also support the architecture through the Android Virtualization Framework as the work expands. Those two sentences are Google's. The post also says Google is working with device manufacturers to put the capabilities into practice. It frames the effort as "an open enclave standard for on-device AI."

## What a user can hold onto

AISeal, in this post, is a hardware-isolated vault for personal AI context, separate from the main Android system even in the case Google describes of a full compromise of that system. The part Google says is underway is encrypted storage of that context. Local inference and agents inside the vault are the later work the post lists. No handset list and no developer API date appear in the announcement. MediaTek's Dimensity 9600 Pro and Qualcomm Snapdragon are the silicon names Google uses, the first as recent support, the second as support still to come.
