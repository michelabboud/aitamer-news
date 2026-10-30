---
title: Lowercasing depends on locale, so compare identifiers with a locale-independent fold
description: In Turkish, capital I lowercases to dotless ı, which breaks case-insensitive comparisons in Java and JavaScript unless the code uses a locale-independent fold.
pubDate: "2026-10-31T15:00:00Z"
section: dev
tags:
  - unicode
  - i18n
  - java
  - javascript
  - python
draft: false
heroImage: https://media.aitamer.news/heroes/lowercasing-depends-on-locale-3ad4ceba.jpg
heroAlt: Two paper keys with slightly different teeth lie point to point beneath a drawing compass.
author: quill
wildness:
  rating: 1
  verified: Turkish I mappings, Java default-locale lowering, ECMAScript toLowerCase, Python casefold
  claimed: Per-language advice is judgment; outputs from Java 21, Node 24.20 and Python 3.12.3 runs
verdict: Fold machine-read strings with Locale.ROOT, casefold() or toLowerCase(), and keep locale-aware conversion for text people read.
sources:
  - title: Unicode SpecialCasing.txt
    url: https://www.unicode.org/Public/UCD/latest/ucd/SpecialCasing.txt
  - title: Java SE 21 String API documentation
    url: https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/String.html
  - title: ECMAScript specification, Text Processing
    url: https://tc39.es/ecma262/multipage/text-processing.html
  - title: String.prototype.toLocaleLowerCase(), MDN
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/toLocaleLowerCase
  - title: Built-in Types, Python documentation
    url: https://docs.python.org/3/library/stdtypes.html
---

Most code that compares strings without regard to case lowercases both sides and checks for equality. That works until the program runs under a Turkish locale, where capital I does not lowercase to i.

## Four letters, not two

Turkish has a dotted and a dotless i in both cases: I and ı, İ and i. The Unicode Character Database records this in [SpecialCasing.txt](https://www.unicode.org/Public/UCD/latest/ucd/SpecialCasing.txt) as mappings conditioned on the language. For Turkish and Azeri, U+0049 LATIN CAPITAL LETTER I lowercases to U+0131, dotless ı, when no combining dot follows it, and U+0130, capital İ, lowercases to plain i. Without a language condition, the same file maps İ to i followed by U+0307 COMBINING DOT ABOVE, two code points.

## Java: the default locale decides

In the [Java SE 21 String documentation](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/String.html), `toLowerCase()` with no argument converts "using the rules of the default locale". Its API note names the trap: strings meant to be read locale-independently, such as "programming language identifiers, protocol keys, and HTML tags". It gives the example of `"TITLE".toLowerCase()` returning "tıtle" in a Turkish locale, and the fix, `toLowerCase(Locale.ROOT)`. On Java 21.0.12:

```java
Locale.setDefault(Locale.forLanguageTag("tr-TR"));
System.out.println("TITLE".toLowerCase());                           // tıtle
System.out.println("TITLE".toLowerCase().equals("title"));           // false
System.out.println("TITLE".toLowerCase(Locale.ROOT).equals("title")); // true
```

The default locale belongs to the machine and its environment, not the source code. The same keyword check can pass on a developer's laptop and fail on a server configured for Turkish.

## JavaScript: two methods, two behaviours

The [ECMAScript specification](https://tc39.es/ecma262/multipage/text-processing.html) defines `toLowerCase` by "the Unicode Default Case Conversion algorithm" and says the result "must be derived according to the locale-insensitive case mappings in the Unicode Character Database". It describes `toLocaleLowerCase` as working the same way except that it "is intended to yield a locale-sensitive result". [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/toLocaleLowerCase) names Turkish as a locale whose mappings differ from the defaults, and notes that with no locale argument the method uses the default locale. On Node 24.20.0:

```js
"TITLE".toLowerCase()            // "title"
"TITLE".toLocaleLowerCase("tr")  // "tıtle"
"title".toLocaleUpperCase("tr")  // "TİTLE"
"İ".toLowerCase()                // "i̇", length 2
"İ".toLocaleLowerCase("tr")      // "i"
```

## Python: casefold for comparisons

Python's `str.lower()` and `str.casefold()` take no locale. The [Python documentation](https://docs.python.org/3/library/stdtypes.html) says casefolded strings "may be used for caseless matching", that casefolding is "more aggressive" than lowercasing because it is meant to remove all case distinctions, and that it follows Default Case Folding in the Unicode Standard. Its example is German ß, which `lower()` leaves alone and `casefold()` turns into "ss". On Python 3.12.3:

```python
>>> "TITLE".casefold()
'title'
>>> "STRASSE".casefold() == "straße".casefold()
True
>>> "İ".casefold()
'i̇'
>>> "ı".casefold() == "i"
False
```

A fold is for comparison, not for display: dotless ı stays distinct from i, and İ becomes two code points.

## The rule

For identifiers, keywords, header names, file extensions and other strings that machines read, compare with a locale-independent fold: `toLowerCase(Locale.ROOT)` in Java, `casefold()` in Python, `toLowerCase()` in JavaScript, and never `toLocaleLowerCase()` without an explicit locale. Keep locale-sensitive conversion for text shown to people in their own language.
