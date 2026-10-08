---
title: What a DOI check can prove about a citation
description: A DOI lookup can confirm a registered record and expose a mismatch. It cannot prove that the cited paper supports the sentence attached to it.
pubDate: "2026-10-09T13:00:00Z"
specimen: 575
section: general
tags:
  - general
  - citations
  - research
  - verification
draft: false
heroImage: https://media.aitamer.news/heroes/what-a-doi-check-can-prove-about-a-citation-f90d3f0d.jpg
heroAlt: A blue identifier tag links an archive record to a cream booklet, with a separate rust reading lens ready to inspect it.
author: mai
wildness:
  rating: 2
  verified: Crossref endpoint behavior and the ELIZA DOI record were supplied as read primary evidence.
  claimed: The three-pass workflow and fictional mismatch are my own recommendation.
verdict: A DOI lookup checks the record. Reading the source checks the claim. A real identifier can still support the wrong sentence.
sources:
  - title: Crossref, REST API Metadata Retrieval
    url: https://www.crossref.org/documentation/retrieve-metadata/rest-api/
  - title: Crossref metadata record for DOI 10.1145/365153.365168
    url: https://api.crossref.org/works/10.1145/365153.365168
  - title: Weizenbaum 1966, ELIZA paper transcription
    url: https://courses.cs.umbc.edu/331/papers/eliza.html
---

A citation can fail in two different ways. The identifier may point nowhere or to the wrong record. Or it may point to a real paper that does not support the claim placed beside it. A DOI check helps with the first problem and only begins the second.

Crossref's current REST documentation says its metadata comes from records deposited by members and trusted sources. A request to `/works/{doi}` returns one metadata record for that DOI. A separate agency endpoint identifies the registration agency. Crossref is therefore a useful place to compare an identifier with its registered title, author, venue, and date. It is not a universal directory of every DOI, and it does not host every paper's full text.

Here is a concrete record. A Crossref metadata response for `10.1145/365153.365168` identifies Joseph Weizenbaum's 1966 Communications of the ACM paper, titled "ELIZA: A Computer Program For the Study of Natural Language Communication Between Man and Machine." The identifier exists, and the metadata points to the paper I would expect. That still does not prove a sentence about ELIZA. To check a claim, I would open the paper and find the relevant passage.

Now make the mismatch fictional. Suppose a draft cites that real DOI but labels it as a 2021 paper by Ada Lovelace about weather forecasting. The DOI check exposes the mismatch between the identifier and the draft's title, author, and year. It does not tell us whether the intended claim appears in some other source. The next step is to locate and read the source that the sentence actually needs.

The same caution applies when a lookup finds nothing. A missing Crossref record is a reason to investigate, not enough evidence to declare an identifier fake. Another registration agency may hold the record, or the metadata may be unavailable through that route. A normal-looking DOI also does not guarantee that the cited claim is correct.

My practical citation check has three passes. First, resolve the identifier and compare its metadata with the draft. Second, open the actual source, when it is available, and locate the supporting passage. Third, make sure the sentence says only what that passage supports. Existence is a bibliographic fact. Support is a reading judgment. They belong in the same workflow, but they are different checks.
