---
title: parseInt accepts a number at the start of broken input
description: JavaScript can turn a damaged quantity into a plausible integer. Validate the complete text, then check the numeric range before accepting a count from a form or configuration file.
pubDate: "2026-10-31T06:00:00Z"
section: dev
tags:
  - javascript
  - validation
  - parsing
draft: false
heroImage: https://media.aitamer.news/heroes/parseint-broken-input-bc9b3540.jpg
heroAlt: A paper magnifying glass examines the clean beginning of a ticket while its damaged tail lies outside the lens.
author: ari
wildness:
  rating: 2
  verified: The language specification defines prefix parsing and the safe integer check.
  claimed: The accepted spelling and application limit remain choices for each count field.
verdict: Validate the whole spelling, convert it, then enforce the numeric and application limits.
sources:
  - title: "ECMAScript: parseInt"
    url: https://tc39.es/ecma262/multipage/global-object.html#sec-parseint-string-radix
  - title: "ECMAScript: Number.isSafeInteger"
    url: https://tc39.es/ecma262/multipage/numbers-and-dates.html#sec-number.issafeinteger
  - title: "MDN: parseInt"
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/parseInt
---

A quantity field contains `12boxes`, and the application quietly accepts twelve. The conversion succeeded because JavaScript's integer parser consumed the part it understood. For a count that must arrive as plain decimal digits, successful conversion is only one part of deciding whether the input is acceptable.

The [ECMAScript algorithm for parseInt](https://tc39.es/ecma262/multipage/global-object.html#sec-parseint-string-radix) stops when a character no longer belongs to the selected base. Giving it an explicit decimal base makes that base clear; it still accepts a valid beginning followed by other text. That behavior suits extracting an integer prefix from text when the surrounding format permits it.

```js
console.log(parseInt("12boxes", 10)); // 12
console.log(parseInt("12.9", 10));    // 12
console.log(parseInt("1e3", 10));     // 1
```

For a strict count, define the spelling the application accepts before converting it. The following policy accepts zero or a positive decimal integer, with no leading zeroes, spaces, sign, decimal point, or exponent. Other policies are reasonable. A form that accepts surrounding spaces should trim them deliberately before applying its chosen rule.

```js
function parseCount(text) {
  if (typeof text !== "string" || !/^(0|[1-9][0-9]*)$/.test(text)) {
    throw new TypeError("Expected plain decimal digits");
  }
  const count = Number(text);
  if (!Number.isSafeInteger(count)) {
    throw new RangeError("Count exceeds the safe integer range");
  }
  return count;
}

console.log(parseCount("12")); // 12
console.log(parseCount("0"));  // 0
```

The second check protects a different boundary. JavaScript numbers have a limited range in which distinct integers remain distinguishable. [Number.isSafeInteger](https://tc39.es/ecma262/multipage/numbers-and-dates.html#sec-number.issafeinteger) rejects values outside that range. A string made entirely of digits can therefore pass the spelling check and still fail numeric validation. Keep identifiers as strings when arithmetic is unnecessary and their exact spelling matters.

Replacing the parser with a numeric conversion alone leaves the accepted language broad. [MDN's parseInt reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/parseInt) contrasts its prefix behavior with conversion functions. Decide whether a value such as an exponent belongs in your count field before choosing a converter. Otherwise, the converter's rules become an accidental product decision.

Keep the application limit separate too. A safely represented quantity can still exceed the number of seats available, the allowed batch size, or another business limit. Apply that maximum after parsing, with an error that explains the actual restriction to the person submitting the value.

A useful test set includes ordinary counts, zero, an empty field, trailing letters, decimal notation, leading spaces, and an oversized integer. Write down which ones the field accepts. That small list makes later parser changes reviewable and prevents a forgiving conversion from quietly deciding what the field means. Keep the original text available when reporting an error. A message that repeats the submitted value helps someone correct a damaged field instead of wondering why a nearby number was accepted.
