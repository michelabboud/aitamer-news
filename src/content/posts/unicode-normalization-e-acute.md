---
title: The Two Ways to Write an é
description: Unicode lets you write é as one precomposed character or as an e plus a combining accent. The two look alike but differ in code points, and normalization gives them a single form.
pubDate: "2026-10-20T13:00:00Z"
specimen: 934
section: dev
tags:
  - unicode
  - normalization
  - nfc
  - nfd
  - text-processing
draft: false
heroImage: https://media.aitamer.news/heroes/unicode-normalization-e-acute-b73dc5cf.jpg
heroAlt: An intact red paper leaf and a matching leaf with a detached tip feed into a blue funnel above one whole leaf.
author: mai
wildness:
  rating: 1
  verified: "UAX #15: NFC is canonical decomposition plus composition; NFD decomposes; W3C recommends NFC."
  claimed: The é decomposition (U+00E9 = U+0065 U+0301) is from UnicodeData.txt, read directly.
verdict: Visually alike text can differ in code points. Normalize to a chosen form before comparing, and know what that form folds.
sources:
  - title: "Unicode Standard Annex #15: Unicode Normalization Forms"
    url: https://www.unicode.org/reports/tr15/
  - title: "Unicode Character Database: UnicodeData.txt"
    url: https://www.unicode.org/Public/UCD/latest/ucd/UnicodeData.txt
---

Unicode gives you two honest ways to write the letter é. You can write the single precomposed character U+00E9, Latin Small Letter E With Acute. Or you can write an ordinary e, U+0065, followed by U+0301, Combining Acute Accent. The [Unicode character database](https://www.unicode.org/Public/UCD/latest/ucd/UnicodeData.txt) records the mapping directly: U+00E9 decomposes to U+0065 U+0301. The two should display the same when rendered correctly, but they are different sequences of code points.

Unicode calls these two canonically equivalent: they represent the same abstract character and should display the same. The visual sameness hides a real difference that shows up the moment you compare strings. An exact codepoint comparison will not see U+00E9 as equal to e plus combining acute, because the code points differ, even though the glyphs look the same. A search that normalizes first can match them.

Normalization exists to give such strings a single form. The [standard](https://www.unicode.org/reports/tr15/) defines four forms, and the two that matter most are NFD and NFC. NFD is canonical decomposition: it breaks characters apart, so é becomes e followed by the combining acute accent. NFC is canonical decomposition followed by canonical composition: it breaks things apart and then recombines what it can, so é becomes the single precomposed U+00E9.

The names carry the direction. The D forms decompose, and the C forms compose afterward. NFC is the form the W3C character model recommends, precisely so that canonically equivalent text does not produce different character sequences across document formats.

The boundary matters as much as the rule. NFC handles canonical equivalence, the kind that says e plus combining acute and precomposed é are the same abstract character. It does not collapse compatibility variants. The ligature ﬁ stays a single character under NFC rather than becoming f plus i, and a superscript ² stays a superscript rather than becoming a plain 2. Those are visually similar to their plain forms, but they are compatibility equivalents, not canonical ones. Only the K forms, NFKC and NFKD, fold them together. So normalization does not make every visually similar string equal. It makes canonically equivalent strings equal, and only the chosen form decides how much further to go.

A few edges are reassuring. Text that is pure ASCII is unaffected by any of the forms. Text in the Latin-1 range, U+0000 to U+00FF, is unaffected by NFC: it is already normalized.

The practical habit follows. If you compare or store text that may arrive from different sources, normalize to a chosen form first. Decide once whether you want composed or decomposed, apply NFC or NFD consistently, and the canonically equivalent strings stop being secretly different. If you need the stronger fold, know that the K forms exist and that they trade away distinctions you might want to keep.
