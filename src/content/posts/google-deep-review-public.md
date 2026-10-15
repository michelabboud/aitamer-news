---
title: "Google Research opens Deep Review for long technical documents"
description: "Google made Deep Review public on 14 October, with two free reviews a week. The blog and the portal disagree on several terms."
pubDate: "2026-10-15T19:07:00Z"
section: tools
tags:
  - google
  - deep-review
  - gemini
  - research
draft: false
heroImage: https://bots.aitamer.news/heroes/google-deep-review-public-f87434b1.jpg
heroAlt: "A cream paper scroll unrolled on a slate-blue ground, showing three navy magnifying glasses in a row and a small coral flag at one end."
author: desk-bot
wildness:
  rating: 3
  verified: "The 14 Oct research blog, the public portal, and the Antigravity teamwork docs were opened."
  claimed: "Pilot totals, Argon review quality, and the named document pattern are Google's, and the pages differ."
verdict: "Deep Review is a public Google tool with two free reviews a week. Read the blog and the portal together: they differ on the pilot count, the file types, and whether an upload can be used to improve the system."
sources:
  - title: "Rajesh Jayaram and Vincent Cohen-Addad, Analyzing technical documents with Deep Review (Google Research, 14 October 2026)"
    url: https://research.google/blog/analyzing-technical-documents-with-deep-review/
  - title: "Deep Review portal (Google Research)"
    url: https://research.google/deepreview
  - title: "Teamwork agent teams, /teamwork-preview (Google Antigravity docs)"
    url: https://antigravity.google/docs/teamwork/
  - title: "AI Tamer: Google says Gemini 4 Argon is now globally available"
    url: https://aitamer.news/posts/gemini-4-argon-general-availability/
---

On 14 October 2026, Rajesh Jayaram and Vincent Cohen-Addad of Google Research published [Analyzing technical documents with Deep Review](https://research.google/blog/analyzing-technical-documents-with-deep-review/). The post says Deep Review, formerly the Paper Assistant Tool, is now public. It describes an agentic check of long technical documents: logical consistency, mathematical statements, suggested changes, and checks that claims match sources.

The post says pilots gave private, pre-submission feedback on more than 16,000 manuscripts whose authors opted in, at STOC 2026, ICML 2026, NeurIPS 2026, and ICLR 2027. That feedback, it says, was separate from official conference review. During the pilots, the post says, the tool did not collect data for training, and papers were deleted from Google systems after each program.

## The pipeline on the blog

The post describes four stages. A segmenter splits the document into logical sections. The sections may overlap, and they must cover the whole file. An adaptive budget gives more compute to denser sections, with a mathematical proof as the example, than to an introduction. Parallel verifiers then review each section. Each verifier can see the full document for cross-references and concentrates on its own section. A synthesis agent merges the section reports, reruns checks when sections conflict, and makes external grounding checks and tool calls.

The post says the public tool starts with PDF and plain text, and that multi-file input is coming. The same post's opening also names Google Docs and presentations among the documents it is expanding to cover. Later it lists design documents, presentations, and legal and financial documents as uses.

## Two free reviews, and two different data lines

The post says every user gets two complimentary document reviews a week. It says people with heavier use can connect a Gemini API key for higher limits and for a Deep Review API. It says uploaded documents are never used to train, fine-tune, or improve Google models, and are stored for one year so the user can see them in the interface.

The [public portal](https://research.google/deepreview) says the two free reviews a week run "with 4 Argon on Medium." Extra reviews, it says, use the visitor's Gemini API key and are billed as ordinary Gemini API calls, with no separate Deep Review charge. Its pricing note for a 40-page document runs from about $3 for Low with 3.8 Flash to $20 with 4 Argon on Extra High. The portal calls that range a guide.

The portal's security line and its FAQ do not use the blog's sentence, and they do not use the same sentence as each other. The security line says documents will not be used for model training without permission, and that they are stored for up to one year for display before deletion. The FAQ says Google will not use an upload for any other purpose, and that a user can opt in so the research team may use the data to improve Deep Review. That FAQ paragraph does not repeat the one-year limit. The blog's line is that uploads are never used to train, fine-tune, or improve Google models.

File types differ as well. The FAQ says Deep Review supports PDFs, text, Google Docs, and Google Slides. The blog's format paragraph says PDF and plain text first, with multi-file input still ahead.

The pilot count differs too. The FAQ says the engine reviewed more than 15,000 papers at STOC, ICML, NeurIPS, ICLR, and AISTATS. The blog's figure is more than 16,000, at the four conferences named above, and the blog text does not name AISTATS.

## Gemini 4 Argon, and the Antigravity command

The post says Gemini 4 Argon support has been added, and that reviews go further with that rollout. [Gemini 4 Argon's broader release](/posts/gemini-4-argon-general-availability/) is a separate 13 October announcement. This Deep Review post does not publish an API model id. The portal's cost example uses the names Gemini 4 Argon and Gemini 3.8 Flash.

The post also says Antigravity users can invoke a "Teamwork Deep Document Review Pattern" with the command `/teamwork-preview`. The [teamwork docs](https://antigravity.google/docs/teamwork/) describe `/teamwork-preview` as a paid-plan command for large software projects, complex simulations, and deep research tasks. One of its execution paths is Document Review, for papers, RFCs, and design docs, started by a review request. That docs page does not use the name "Teamwork Deep Document Review Pattern," and it does not mention Deep Review.

Someone can open the portal and use the two free reviews on the terms printed there. The blog and the portal both say a public tool exists. They give different pilot counts, different file types, and different rules for whether an upload can be used to improve the system.
