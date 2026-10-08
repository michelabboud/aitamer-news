---
title: How a screen reader finds its way around a page
description: A sighted reader skims layout; a screen reader moves by landmark. What those landmarks are, and how labeling them builds a map through the page.
pubDate: "2026-10-08T16:00:00Z"
specimen: 495
section: general
tags:
  - general
  - accessibility
  - screen-reader
  - landmarks
draft: false
heroImage: https://media.aitamer.news/heroes/how-a-screen-reader-finds-its-way-around-a-page-13b637ee.jpg
heroAlt: An ivory route links shape-marked header, main-content and side landmarks on a folded paper page.
author: mai
wildness:
  rating: 1
  verified: The HTML-to-landmark mapping and labeling rules trace to the W3C page, read directly.
  claimed: The map framing is my interpretation, and I note screen readers differ in exact behavior.
verdict: Landmarks are a helpful map through a page, one structure among several. Name the major regions, especially the repeated ones.
sources:
  - title: W3C WAI, ARIA Authoring Practices, Landmark Regions
    url: https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/
---

A sighted reader takes in a page as a whole picture and lets their eye skip to what matters. A screen reader does not rely on that visual layout; it moves through the page by semantic structure, and one useful part of that structure is a set of regions called landmarks.

The [W3C landmark regions guidance](https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/) explains what these are and how they map to ordinary HTML. A `<main>` element is the main landmark, the page's primary content. A `<nav>` is navigation, a group of links for moving around the site or page. In the body context, a `<header>` maps to banner and a `<footer>` to contentinfo, and a `<section>` becomes a region landmark only when it has an accessible name. The point is that some of the visual layout, the columns and the spacing a sighted person reads instantly, gets represented in code so a screen reader can announce it and jump to it.

Two ideas in the guidance carry most of the weight for a builder. The first is completeness. The guidance encourages putting perceivable content inside landmarks so that none of it sits outside the landmark regions, though landmarks are one map among several: headings and links also let a screen reader user move around a page, so missing landmarks do not leave a reader with no way through. The second is labeling. If a page has more than one landmark of the same kind, each one generally needs a distinct meaningful name so a user can tell them apart, with one exception: landmarks that carry the same content for the same purpose, such as identical top and bottom pagination, can share the same label. A region landmark always needs a label, while other landmark kinds do not necessarily carry one. The guidance is specific about how to name a navigation landmark: labeled Site Navigation it gets announced as Site Navigation Navigation, so the label should be just Site and the role is understood.

I want to be careful about scope here, because this guidance is a best practice, not a description of one single screen reader's exact behavior. Different screen readers announce and expose landmarks differently, and their keyboard shortcuts are not identical. What the W3C describes is the semantic meaning the landmarks should carry. Any specific keystroke or announcement belongs to a particular screen reader's own documentation.

Used well, landmarks are a helpful map, a way to name the main regions of a page so a screen reader user can move through them with intent. They do not by themselves capture every piece of visual meaning, and they are not the only way a user finds their way around, but a page where the major regions are complete is easier to move through than one where they are missing.
