---
title: Meta opens the Muse gadget SDK code with service-dependent pairing
description: Meta published firmware and device SDKs for Muse gadgets under Apache-2.0, with a short list of third-party exceptions. Every gadget still needs a Meta-issued token and the Muse app, and a backend change already broke voice replies.
pubDate: "2026-10-04T11:00:00Z"
specimen: 222
section: dev
tags:
  - meta
  - muse
  - esp32
  - linux
  - open-source
  - security
draft: false
heroImage: https://media.aitamer.news/heroes/meta-opens-the-muse-gadget-sdk-code-but-pairing-still-runs-through-its-own-service-6018a570.jpg
heroAlt: An open cream paper kit holds a gear and device parts, with a coral thread connecting its blue key to something outside the frame.
author: quill
wildness:
  rating: 3
  verified: Apache-2.0 code, token and Muse app required to pair, system.run runs shell commands as the install account.
  claimed: The README calls the gadgets open source devices you build yourself, built by hackers, just for fun.
verdict: The device code is open under Apache-2.0, apart from listed third-party files. Pairing and replies depend on Meta's service, which already broke voice once. Treat the Linux SDK as remote shell access and give it an account without sudo.
sources:
  - title: facebookincubator/muse-gadget-sdk (README, LICENSE)
    url: https://github.com/facebookincubator/muse-gadget-sdk
  - title: ESP32 Device SDK README
    url: https://github.com/facebookincubator/muse-gadget-sdk/blob/main/esp32/README.md
  - title: Linux Device SDK README
    url: https://github.com/facebookincubator/muse-gadget-sdk/blob/main/linux/README.md
  - title: "Issue 6: Voice PE: every push-to-talk reply fails"
    url: https://github.com/facebookincubator/muse-gadget-sdk/issues/6
  - title: "Pull request 12: Request text replies; drop the server TTS fetch"
    url: https://github.com/facebookincubator/muse-gadget-sdk/pull/12
  - title: Muse Gadgets
    url: https://gadgets.muse.ai
---

Meta published the firmware and device SDKs for Muse gadgets in the GitHub repository [facebookincubator/muse-gadget-sdk](https://github.com/facebookincubator/muse-gadget-sdk). GitHub shows the repository was created on 2026-10-02. The README says the license is Apache-2.0, except for a few listed third-party files. There are no tags. The README's instructions use `main`, so pin a commit for a reproducible build.

## What the repository holds

There are two SDKs. The [ESP32 SDK](https://github.com/facebookincubator/muse-gadget-sdk/blob/main/esp32/README.md) is firmware for off-the-shelf boards. The [Linux SDK](https://github.com/facebookincubator/muse-gadget-sdk/blob/main/linux/README.md) turns "any Linux computer, like a Raspberry Pi, into a Muse gadget."

## What stays on Meta's side

The README says: "Every gadget needs a token to pair." The token comes from [gadgets.muse.ai](https://gadgets.muse.ai), and both SDK READMEs add that this includes gadgets "you build for yourself." Pairing goes through the Muse app on iOS or Android, with Developer mode turned on. The README also asks you to review the Gadget SDK Terms before flashing or pairing.

## What the Linux SDK can do on your machine

The Linux README lists four commands. One is `system.run`. The README defines it as "Runs a shell command and returns its output and exit code." The README states the scope: commands run "with exactly that account's permissions. If it can use sudo, so can Muse." The installer accepts `--run-as` to pick a different account, "such as one without sudo."

Both SDK READMEs say that pairing "has no manufacturer verification and can't prevent an active man-in-the-middle attack. Set it up on a network you trust."

## The backend already broke one feature

[Issue 6](https://github.com/facebookincubator/muse-gadget-sdk/issues/6), opened on 2026-10-02, the day the repository was created, reports that every push-to-talk reply failed with a canned error. The fix, [pull request 12](https://github.com/facebookincubator/muse-gadget-sdk/pull/12), gives the cause: voice turns went "to a voice model that's no longer served." The firmware now requests text replies. The ESP32 README says spoken answers need a text-to-speech API of your choice.

## What the sources do not state

The repository pages do not include source code for the Muse backend or for the Muse Home Link device shown in the README image. They give no unit counts. The content of the Gadget SDK Terms was not reviewed for this post. No independent hands-on test is cited here.

## What to do

- Read the Gadget SDK Terms before you request a token.
- On Linux, install with `--run-as` and an account without sudo.
- Pair only on a network you trust.
- Pin a commit, since there are no tags.
- Watch the issue tracker for service changes that may require SDK updates.
