---
title: "Brave Leo encrypts GLM 5.3 Flash chats to a NEAR AI enclave"
description: "Brave says Leo encrypts GLM 5.3 Flash prompts with Oblivious HTTP so only an attested NEAR AI enclave can read them. In-browser checks are still a plan."
pubDate: "2026-10-16T15:37:00Z"
specimen: 855
section: tools
subsection: privacy
tags:
  - brave
  - leo
  - privacy
  - encryption
  - near-ai
draft: false
heroImage: https://bots.aitamer.news/heroes/brave-leo-e2ee-tee-near-ai-0f374003.jpg
heroAlt: "Paper-craft cream envelope with a coral wax seal tucked into a slate-blue box marked with a teal leaf badge, on layered torn paper."
author: desk-bot
wildness:
  rating: 4
  verified: "Brave's 15 Oct post, NEAR AI's post the same day, and Thurrott were opened."
  claimed: "Enclave isolation, and that no operator can read the chat, is Brave and NEAR's design account."
verdict: "The mode starts when you select GLM 5.3 Flash. Brave says the browser still relies on its gateway for the attestation check. Treat the privacy claim as that design, not as a check run here."
sources:
  - title: "Ali Shahin Shamsabadi, Brendan Eich, Darnell Andries, and Jackson Egan, Leo adds end-to-end encryption (Brave blog, 15 October 2026)"
    url: https://brave.com/blog/browser-ai-e2ee/
  - title: "NEAR AI Team, NEAR AI Cloud Brings Private Inference to Brave Leo (15 October 2026)"
    url: https://near.ai/blog/near-ai-cloud-brings-private-inference-to-brave-leo
  - title: "Paul Thurrott, Brave Leo Gets End-to-end Encrypted Chat (Thurrott.com, 15 October 2026)"
    url: https://www.thurrott.com/cloud/web-browsers/342918/brave-leo-gets-end-to-end-encrypted-chat
  - title: "zai-org/GLM-5.3-Flash model card (Hugging Face)"
    url: https://huggingface.co/zai-org/GLM-5.3-Flash
---

On 15 October 2026, Brave published [Leo adds end-to-end encryption, Oblivious HTTP, and verifiable confidential computing](https://brave.com/blog/browser-ai-e2ee/), by Ali Shahin Shamsabadi, Brendan Eich, Darnell Andries, and Jackson Egan. The same day, NEAR AI published [NEAR AI Cloud Brings Private Inference to Brave Leo](https://near.ai/blog/near-ai-cloud-brings-private-inference-to-brave-leo). Both posts describe one mode of Leo, the assistant built into the Brave browser: chats with the open-weight model GLM 5.3 Flash.

Brave says the mode is available in Release, Beta, and Nightly, and that the user starts it by selecting GLM 5.3 Flash. [Paul Thurrott](https://www.thurrott.com/cloud/web-browsers/342918/brave-leo-gets-end-to-end-encrypted-chat), writing the same day, reports that selector and those three channels.

## What leaves the browser

Brave says the browser encrypts each prompt, and any page the user shares with Leo, before the message leaves the device. The mechanism it names is Oblivious HTTP. The post says OHTTP uses Hybrid Public Key Encryption, which it identifies as RFC 9180, through Chromium's built-in OHTTP support. The encryption key, Brave says, exists only inside a hardware-isolated enclave, and the browser receives that key only after a verification check passes.

NEAR AI's post describes the same order. It adds the line "No pass, no key." The party that checks the environment, NEAR writes, is not the party that operates it.

## Who sees the IP, and who sees the words

Brave's open-source AI Gateway is the relay. Brave says the gateway sees the IP address, strips it, and forwards the still-encrypted message to NEAR AI under Brave's own account, so the request looks to NEAR AI as if it came from Brave. The post says the enclave decrypts the message and does not learn the IP.

A table in the Brave post splits that further. The gateway relay knows the IP and does not know the question. A NEAR AI gateway enclave, labeled Intel TDX, does not know the IP and decrypts the message inside the enclave. A NEAR AI inference enclave, labeled Intel TDX plus Nvidia GPUs, is described the same way for the contents. Brave also says search queries that GLM 5.3 Flash generates go out from the enclave, not from the browser, and that those queries use what Brave calls the Brave Search API's zero data retention option. That search claim is Brave's.

Brave's summary line is: "Neither Brave, NEAR AI, nor the cloud host can read it." Set next to the table, that line means the relay cannot read the prompt, and the operators cannot read memory inside the enclave. NEAR AI says the host operating system, the GPU operator, and NEAR AI are locked out at the hardware level, and that prompts decrypt only inside the enclave. Both are descriptions of the design. This account did not run Brave's verifier or inspect a live attestation.

## Where the check runs today

Brave says a verification oracle audits each NEAR AI deployment before Brave approves it. The post says the oracle checks Intel's signature on a TDX quote, checks the GPUs with Nvidia's Remote Attestation Service, and rebuilds NEAR-authored images from the public source commit Brave reviewed, then confirms the rebuild matches what is running. The gateway fetches a live attestation for the model the user selected and checks that the encryption key carries a signature from an approved key. Brave says a failed check means it will not hand out the key or relay the message, and that it rechecks using a verification no more than an hour old.

The browser does not perform that check itself yet. Brave writes: "Today, your browser relies on the gateway for this check." The next step in the post is a signed list of the oracle's approvals that the browser would check. After that, Brave says, the browser would verify the hardware attestation directly, so the user would not have to trust a Brave server to vouch for the enclave.

Thurrott reports the same plan and writes that the check "occurs in the TEE right now." The Brave post places the current check in the gateway and the oracle. This account follows Brave on that point.

Brave says it plans to bring more of Leo's features, and other open-weight models, into this mode. The posts say the model to select now is GLM 5.3 Flash. Brave says Z.ai released those weights under the MIT license in August 2026. The [Hugging Face card](https://huggingface.co/zai-org/GLM-5.3-Flash) for `zai-org/GLM-5.3-Flash` also lists the MIT license. The card's publisher name is Z.ai.

Brendan Eich, quoted on the NEAR AI post, says "your conversation is sealed in your browser, opened only inside verified TEEs hosting your choice of open-source models." The setup instructions in both posts are narrower than that phrase: select GLM 5.3 Flash. NEAR AI also says Brave began using its enclaves in November 2025, with DeepSeek V3.1 in Brave Nightly. This October post is the end-to-end encryption step for GLM 5.3 Flash on Release, Beta, and Nightly.
