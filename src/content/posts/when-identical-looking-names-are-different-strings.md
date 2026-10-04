---
title: When identical-looking names are different strings
description: A username can have equivalent encodings or resemble another name made from different characters. This explains what Unicode normalization and confusable detection each solve.
pubDate: "2026-10-06T07:00:00Z"
specimen: 210
section: dev
tags:
  - unicode
  - normalization
  - usernames
  - search
  - security
draft: false
heroImage: https://media.aitamer.news/heroes/when-identical-looking-names-are-different-strings-9580aba9.jpg
heroAlt: A cream paper ledger compares two nearly identical paper keys with subtly different notches, linked by a looping thread on a calm blue worktable.
author: ari
wildness:
  rating: 1
  verified: Unicode defines the normalization forms and confusable detection described here.
  claimed: No vendor claims.
verdict: Use a consistent normalization rule for username identity and exact lookup. Check visual confusables separately when registering names or showing search results.
sources:
  - title: "Unicode Standard Annex #15: Normalization Forms"
    url: https://www.unicode.org/reports/tr15/#Norm_Forms
  - title: "Unicode Technical Standard #39: Confusable Detection"
    url: https://www.unicode.org/reports/tr39/#Confusable_Detection
  - title: "Unicode Technical Standard #39: Migrating Persistent Data"
    url: https://www.unicode.org/reports/tr39/#Migration
  - title: "Unicode FAQ: Characters and Combining Marks"
    url: https://www.unicode.org/faq/char_combmark.html
---

A user types a name into search and sees no result. The name on screen appears to match. For a developer, the first useful question is what characters the two strings contain. Two names can look alike because the same character was encoded in different ways. They can also look alike because they contain different characters.

Consider these two name cards:

| Name card A | Name card B |
| --- | --- |
| `paypal` | `pаypаl` |
| Both `a` characters are Latin: `U+0061` | Both `а` characters are Cyrillic: `U+0430` |

The second card follows an example in [Unicode’s confusable detection specification](https://www.unicode.org/reports/tr39/#Confusable_Detection). Unicode identifies the Latin small letter `a` as `U+0061` in its [character FAQ](https://www.unicode.org/faq/char_combmark.html). The security specification identifies the Cyrillic small letter `а` as `U+0430`. The cards may be hard to distinguish by sight, yet their strings differ. That is a different problem from equivalent encodings.

## Normalization handles equivalent encodings

Unicode permits some text to be represented by different sequences of code points that are *canonically equivalent*. For example, the character `Á` can be represented by the single code point `U+00C1` or by `U+0041` followed by `U+0301`, a combining acute accent. Unicode’s [FAQ gives this exact pair](https://www.unicode.org/faq/char_combmark.html). A raw comparison sees different sequences. A comparison after applying the same canonical normalization form sees equivalent results.

[Unicode Standard Annex #15](https://www.unicode.org/reports/tr15/#Norm_Forms) defines the normalization forms. NFC decomposes text canonically, puts combining marks in a defined order, and composes characters where the rules allow it. NFD keeps the canonically decomposed result. Either form can support a consistent comparison if both strings use the same form.

For usernames, one practical policy is to compute an NFC identity key at registration and compute it again for every exact lookup. Enforce uniqueness on that key. Keep the spelling needed for display as a separate value if the product needs to show what the user entered. The key answers whether two accepted inputs identify the same account under the chosen policy.

Unicode also defines compatibility normalization, NFKC and NFKD. It additionally folds the differences between compatibility-equivalent characters. The annex gives examples such as a circled `①` mapping to `1`. It cautions that compatibility normalization can erase distinctions that matter in some text. Choosing NFKC for a username key therefore changes which names your service treats as identical. Make that choice deliberately, especially before accepting existing accounts under a new rule.

## Confusable detection handles visual similarity

The two `paypal` cards present another case. Latin `a` and Cyrillic `а` are different characters. Canonical normalization does not make those names equal. Compatibility normalization is also a defined equivalence process, and it is not a general test of whether two rendered names look alike. Unicode places the `paypal` pair among its [mixed-script confusables](https://www.unicode.org/reports/tr39/#Confusable_Detection).

Unicode’s security specification defines a *skeleton* for comparing potentially confusable strings. When two strings produce the same skeleton under its rules, the mechanism identifies them as confusable. The specification also describes single-script and whole-script confusables. A check that only looks for a mixture of scripts in one name can miss a name written entirely in one script that resembles a name in another.

A match is a signal for a product decision. Unicode notes that its confusable mappings can flag legitimate strings. It says skeletons are for internal testing and are unsuitable as displayed names or as a normalization of identifiers. A service can compare a proposed username against registered names and ask for review, reserve a high-risk spelling, or warn the registrant. Its policy must account for people who use different scripts legitimately. [Unicode’s confusable detection section](https://www.unicode.org/reports/tr39/#Confusable_Detection) explains both the mechanism and those limits.

## Registration and search need explicit rules

At registration, decide which inputs count as the same username. Apply the chosen normalization form before the uniqueness check. Then decide how to handle visually confusable names that remain distinct. If accounts already exist, inspect them for collisions before introducing a new identity key. Two existing names that produce one key require an account decision; an index cannot make that decision.

Search has a different job. An exact username lookup should use the same identity rule as registration, so typing an equivalent encoding finds the intended account. A broader people search can offer visually similar names as additional results. Labeling those results as similar preserves the distinction between an exact identity match and a possible lookalike. This follows from the separate purposes Unicode gives to [normalization](https://www.unicode.org/reports/tr15/#Norm_Forms) and [confusable detection](https://www.unicode.org/reports/tr39/#Confusable_Detection).

If a search index uses compatibility normalization to catch more variants, document what it folds together. Keep the account’s identity key and its display name distinct from that search behavior. Otherwise, a search convenience can quietly become an account identity rule.

There is a maintenance consequence, too. Unicode says confusable mapping data may change between versions. A service that stores skeletons in an index must plan to rebuild that index when it updates the data. [The security specification’s migration guidance](https://www.unicode.org/reports/tr39/#Migration) makes that requirement explicit.

For the next apparently missing username, inspect its code points first. Equivalent sequences call for a consistent normalization and comparison rule. Different characters with similar shapes call for a confusable check and a human-facing policy. The screen alone cannot tell you which case you have.
