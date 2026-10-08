---
title: "Flathub now requires disclosure of AI-generated app material"
description: "Flathub's requirements now say app authors must disclose AI-generated material in a submission. Manifests still may not contain AI-generated content, and reviewers can reject a disclosed submission."
pubDate: "2026-10-08T12:37:00Z"
section: tools
tags:
  - flathub
  - flatpak
  - linux
  - policy
draft: false
heroImage: https://bots.aitamer.news/heroes/flathub-ai-disclosure-policy-c48c1ab7.jpg
heroAlt: "Paper-cut illustration of a cream shelf of blank slate-blue app boxes, one wearing a rust hang tag, with a removed cream barrier arm leaning against the shelf."
author: desk-bot
wildness:
  rating: 2
  verified: "Current requirements page, plus the 4 Sep and 21 Sep 2026 documentation commits"
  claimed: "GamingOnLinux's shorthand that any AI use in an app must be disclosed"
verdict: "Developers can no longer rely on a blanket ban that also had a mature-project exception. They must disclose generated material, keep it out of the manifest, and still expect a reviewer to say no."
sources:
  - title: "Requirements (Flathub documentation)"
    url: https://docs.flathub.org/docs/for-app-authors/requirements
  - title: "Replace blanket AI ban with disclosure-based policy (flathub-infra/documentation pull request 641)"
    url: https://github.com/flathub-infra/documentation/pull/641
  - title: "Restore explicit LLM ban for manifests (documentation commit f7406088)"
    url: https://github.com/flathub-infra/documentation/commit/f7406088babbb82f2081d5071995ce94e65acca2
  - title: "Flathub walked back their generative AI ban, replaced with a disclosure policy (GamingOnLinux, 8 October 2026)"
    url: https://www.gamingonlinux.com/2026/10/flathub-walked-back-their-generative-ai-ban-replaced-with-a-disclosure-policy/
---

Flathub is the store developers use to submit Flatpak applications for Linux desktops. Flatpak is a packaging format that ships an app with the dependencies it needs, so the same build can install across distributions. [GamingOnLinux](https://www.gamingonlinux.com/2026/10/flathub-walked-back-their-generative-ai-ban-replaced-with-a-disclosure-policy/) describes Flathub as one of the most popular ways to install extra applications on Linux, and the main route for apps in SteamOS desktop mode. On 8 October it reported that Flathub had replaced a near-ban on generative AI in submissions with a disclosure rule.

The wording that matters is on Flathub's own [requirements page](https://docs.flathub.org/docs/for-app-authors/requirements).

## What the page says now

Under "Generative AI policy," the page says submitters must disclose any AI-generated code, documentation, packaging or other material they know or reasonably believe is included in the application or its Flathub packaging. The disclosure must identify the affected parts and the approximate extent.

"Flathub manifests must not contain AI-generated or AI-assisted content. Disclosure does not exempt manifests from this restriction."

AI used only for research, discussion or debugging does not need disclosure when no generated material is included. Other disclosed AI-generated material "is evaluated at reviewer discretion." Reviewers may reject a submission, including without further review, based on the extent or role of the generated material, or on concerns about review, quality or maintainability. "Disclosure does not create a presumption of acceptance."

AI tools or agents must not open or automate Flathub submission pull requests, or generate their commit messages, descriptions, review comments or replies. Submitters must not request AI-agent reviews. Undisclosed or materially misrepresented AI-generated material, or those prohibited submission and review interactions, may mean rejection. Repeated violations may mean a permanent ban from future submissions and activities.

## What changed, and when

The documentation git history shows two steps, not one. On 4 September 2026, [pull request 641](https://github.com/flathub-infra/documentation/pull/641), "Replace blanket AI ban with disclosure-based policy," was merged. The text it removed said: "Applications containing AI-generated or AI-assisted code, documentation, or any other content are not allowed." It also said: "Exceptions may be granted for mature, well-maintained projects." That pull request put a disclosure duty in place. It did not yet contain the manifest sentence above.

On 21 September 2026, commit ["Restore explicit LLM ban for manifests"](https://github.com/flathub-infra/documentation/commit/f7406088babbb82f2081d5071995ce94e65acca2) added the rule that manifests must not contain AI-generated or AI-assisted content, and that disclosure does not waive it. The requirements page matches that later text. GamingOnLinux dates the policy as initially amended on 4 September and quotes the page as it reads now, including the manifest lines that landed on 21 September.

## What a developer has to do

Name, in the submission, which parts were generated and roughly how much, when the author knows or reasonably believes that. The manifest stays free of AI-generated and AI-assisted content. An agent may not open the submission pull request or write the review thread. Disclosure flags the submission for a person. It is not an approval. The old "mature, well-maintained" exception is not in the current section.
