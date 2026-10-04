---
title: A Citation Has Coordinates
description: A useful citation connects a claim to a specific place in a source. Document order, location ranges, and cited text give an application what it needs to make that connection visible.
pubDate: "2026-10-06T14:00:00Z"
specimen: 316
section: models
tags:
  - citations
  - documents
  - model-responses
  - source-verification
draft: false
heroImage: https://media.aitamer.news/heroes/a-citation-has-coordinates-b81b167b.jpg
heroAlt: A highlighted passage in an open paper book connects by a coral dotted path to a map pin.
author: ari
wildness:
  rating: 2
  verified: The guide specifies document indices, location ranges, cited text, and response blocks.
  claimed: A reader-facing citation should connect each claim to its source passage.
verdict: Treat citation data as a route from a claim to a passage. Preserve document order, interpret the range by document type, and let readers inspect the source.
sources:
  - title: Citations — Claude Platform Docs
    url: https://platform.claude.com/docs/en/build-with-claude/citations
---

A model can name a document without showing where its answer came from. A useful citation takes the reader further: it identifies the source and the passage to inspect. [Anthropic’s citations guide](https://platform.claude.com/docs/en/build-with-claude/citations) describes the location data its API returns with cited text.

## The source has an index

Each citation includes a `document_index`. It identifies a document by its position among the document content blocks supplied in the request, including blocks across messages. An application needs to keep that order so it can connect the returned index to the right document. A title can help readers recognize the source, but the guide says titles and context fields are not themselves citable content. The cited material comes from the document’s source content. [Anthropic’s citations guide](https://platform.claude.com/docs/en/build-with-claude/citations) explains both distinctions.

## The location depends on the document

For plain text, a citation carries a character range. For a PDF, it carries a page range. For a custom content document, it carries a range of content blocks. Character and block positions start at zero; page numbers start at one. End positions are exclusive. These details matter when an application turns a returned range into a highlight or a link to the relevant page. [The guide’s citation index rules](https://platform.claude.com/docs/en/build-with-claude/citations) spell out each format.

The API also returns `cited_text`, the passage extracted for the citation. The passage helps a reader inspect the support for a claim. It does not, by itself, settle whether the claim accurately represents that passage. Keep the claim and its citations together: the response can contain several text blocks, each with its own citation list. [Anthropic’s response example](https://platform.claude.com/docs/en/build-with-claude/citations) shows that structure.

## What to do

1. Keep a map from each supplied document’s position to the document the reader can open.
2. Read the citation type before interpreting its range. Use characters for plain text, pages for PDFs, and blocks for custom content.
3. Show the cited passage beside the claim and give the reader a way to reach its source location.
4. Check whether the passage supports the wording of the claim. A valid location pointer makes that check possible; it does not perform the check for you.
