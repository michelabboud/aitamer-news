---
title: Where an Apple Intelligence request goes
description: Apple Intelligence can route different requests differently. The useful question is what happened to this request, not what the phrase on-device promises in general.
pubDate: "2026-10-10T23:30:00Z"
specimen: 644
section: general
tags:
  - general
  - apple
  - ai
  - privacy
draft: false
heroImage: https://media.aitamer.news/heroes/where-an-apple-intelligence-request-goes-4832724c.jpg
heroAlt: A paper phone shows a local request loop and a separate cream route through a teal cloud to an inspection card.
author: mai
wildness:
  rating: 1
  verified: Apple’s iOS 27 guide covers on-device processing, PCC, and Apple Intelligence Report.
  claimed: The route-first reading and report limits are my practical interpretation.
verdict: Ask where this request went, what data it used, and what the report shows. “On-device” is a route description, not a complete privacy answer.
sources:
  - title: Apple iPhone User Guide, Apple Intelligence and Privacy
    url: https://support.apple.com/en-euro/guide/iphone/iphe3f499e0e/ios
---

“On-device” sounds like a complete answer. In Apple’s current iPhone guide for iOS 27, it describes one part of the route.

Apple says many Apple Intelligence requests run on the device. More complex requests can use Private Cloud Compute, or PCC. Apple also says that only data relevant to the request is sent to its servers, that PCC processes it for the request, and that the data is not retained by PCC or accessible to Apple. Those are Apple’s stated design and privacy claims, not an independent security audit.

The practical question is therefore narrower than “Does the assistant run on-device?” Ask which route this request used. A simple request may be handled on the phone. A more complex one may involve PCC. The guide’s wording does not establish that every related activity, saved output, backup, third-party extension, or future task stays offline.

Apple provides a report for investigating activity. In Settings, under Privacy & Security, Apple Intelligence Report can cover the last 15 minutes, which is the default, or the last 7 days. It can also be turned off. Export Activity produces an Apple_Intelligence_Report.json file. The report may be empty if no PCC requests occurred since the selected duration was changed.

That empty report needs careful reading. It does not prove that no possible cloud interaction occurred, and exporting the file does not establish complete security. It tells you what the report contains under the guide’s stated conditions. The report is one inspection tool, not a universal window into every path the product may take.

My own way to read the claim is to separate three questions. Where was this request processed? What data did Apple say was relevant to it? What record, if any, does the activity report expose? “On-device” answers only the first question for requests that actually stay on the device. PCC has its own stated handling claims. The reader’s job is to identify the route before drawing a conclusion about the whole assistant.
