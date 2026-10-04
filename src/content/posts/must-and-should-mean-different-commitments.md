---
title: MUST and SHOULD Mean Different Commitments
description: A guide to requirement words in Internet specifications and the careful judgment a SHOULD exception requires.
pubDate: "2026-10-06T10:30:00Z"
specimen: 309
section: general
tags:
  - internet-standards
  - specifications
  - requirements
  - interoperability
draft: false
heroImage: https://media.aitamer.news/heroes/must-and-should-mean-different-commitments-0d06cff2.jpg
heroAlt: A path forks between a guarded gate with a check mark and a route toward a balance scale.
author: ari
wildness:
  rating: 1
  verified: RFC 2119 permits a carefully weighed exception to SHOULD.
  claimed: Writing down the reasoning makes an exception easier to review.
verdict: A practical explanation of the requirement words, with the limits of a SHOULD exception kept clear.
sources:
  - title: "RFC 2119: Key words for use in RFCs to Indicate Requirement Levels"
    url: https://www.rfc-editor.org/info/rfc2119/
  - title: "RFC 8174: Ambiguity of Uppercase vs Lowercase in RFC 2119 Key Words"
    url: https://www.rfc-editor.org/rfc/rfc8174.html
---

In an Internet Engineering Task Force specification, requirement words can carry defined meanings. [RFC 2119](https://www.rfc-editor.org/info/rfc2119/) explains the words. [RFC 8174](https://www.rfc-editor.org/rfc/rfc8174.html) clarifies that their special meanings apply when they appear in all capitals. Lowercase words keep their ordinary English meanings.

## MUST sets a firm requirement

MUST means an absolute requirement of the specification. MUST NOT means an absolute prohibition. REQUIRED and SHALL have the same defined meaning as MUST; SHALL NOT has the same meaning as MUST NOT. Read the surrounding text and the document’s requirement level as well. RFC 2119 says that level affects the force of these words. [RFC 2119](https://www.rfc-editor.org/info/rfc2119/)

## SHOULD allows a reasoned exception

SHOULD expresses a recommendation that may have a valid exception in a particular circumstance. Before choosing another course, the reader must understand and carefully weigh the full implications. That is a substantial decision. A useful record would name the circumstance, explain why following the recommendation is unsuitable, and describe the likely effects of the alternative. [RFC 2119](https://www.rfc-editor.org/info/rfc2119/)

SHOULD NOT works in the other direction. The discouraged behavior may sometimes be acceptable or useful, but its implications and the particular case need careful consideration before it is implemented. [RFC 2119](https://www.rfc-editor.org/info/rfc2119/)

## MAY leaves a choice

MAY means an item is optional. Implementations can make different choices about including it. RFC 2119 also says each must be prepared to interoperate with an implementation that makes the other choice, apart from the feature the option provides. Optionality therefore still calls for attention to how the two implementations work together. [RFC 2119](https://www.rfc-editor.org/info/rfc2119/)

## These words deserve care

RFC 2119 tells specification authors to use these terms sparingly, where they serve interoperability or limit potentially harmful behavior. It also warns that the security effects of departing from a requirement or recommendation can be subtle. The label is a starting point for reading the surrounding conditions and consequences. [RFC 2119](https://www.rfc-editor.org/info/rfc2119/)

## What to do

1. Check whether the specification uses the capitalized words with their defined meanings. [RFC 8174](https://www.rfc-editor.org/rfc/rfc8174.html)
2. Read each requirement with its conditions and the document’s requirement level. [RFC 2119](https://www.rfc-editor.org/info/rfc2119/)
3. For a SHOULD exception, write down the particular reason and weigh the effects before acting. [RFC 2119](https://www.rfc-editor.org/info/rfc2119/)
4. For a MAY option, check how implementations with different choices will interoperate. [RFC 2119](https://www.rfc-editor.org/info/rfc2119/)
