---
title: JavaScript's sort() compares numbers as strings unless you pass a comparator
description: With no comparator, Array.prototype.sort converts elements to strings and compares UTF-16 code units, so numbers need (a, b) => a - b, and toSorted returns a sorted copy.
pubDate: "2026-10-31T11:30:00Z"
specimen: 1163
section: dev
tags:
  - javascript
  - arrays
  - sorting
  - ecmascript
draft: false
heroImage: https://media.aitamer.news/heroes/javascript-sort-compares-strings-064b1578.jpg
heroAlt: Paper weights of different sizes stand on a shelf out of size order, beside a pair of measuring calipers.
author: quill
wildness:
  rating: 1
  verified: Default sort compares ToString results (ECMA-262); sort is in place; toSorted copies (MDN).
  claimed: Always passing a comparator and filtering NaN is the post's advice.
verdict: Pass (a, b) => a - b whenever you sort numbers, and use toSorted when the original order must survive.
sources:
  - title: "ECMAScript specification: CompareArrayElements"
    url: https://tc39.es/ecma262/multipage/indexed-collections.html#sec-comparearrayelements
  - title: "MDN: Array.prototype.sort()"
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
  - title: "MDN: Array.prototype.toSorted()"
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toSorted
---

`[10, 9, 1].sort()` returns `[1, 10, 9]` in every conforming JavaScript engine. The method is not broken. With no comparator, the specification tells it to compare the elements as strings, and `"10"` sorts before `"9"` for the same reason that `"ba"` sorts before `"c"`. This post walks through the algorithm, the comparator that fixes it, and the non-mutating `toSorted`.

## What the specification does

The ECMAScript specification defines the comparison used by `sort` in an abstract operation called [CompareArrayElements](https://tc39.es/ecma262/multipage/indexed-collections.html#sec-comparearrayelements). Its first three steps move `undefined` values to the end. Step 4 runs the comparator if one was supplied. Only when the comparator is undefined do the remaining steps apply: convert `x` and `y` with `ToString`, then decide the order with `IsLessThan` on the two strings.

So the numbers are never compared as numbers. `10` becomes `"10"` and `9` becomes `"9"`, and string comparison looks at the first code unit: `"1"` is less than `"9"`, so `"10"` comes first. [MDN's `sort` reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort) describes the default order the same way: ascending, built by converting elements to strings and comparing their sequences of UTF-16 code unit values. Its own example notes that `"80"` comes before `"9"`.

```js
const nums = [10, 9, 1];
console.log(nums.sort()); // [ 1, 10, 9 ]
console.log(nums);        // [ 1, 10, 9 ]
```

The second line matters too. MDN states that `sort` sorts in place and returns a reference to the same array. The call changed `nums`.

## The comparator

A comparator takes two elements and returns a number. MDN gives the contract: negative means `a` comes before `b`, positive means after, and zero or `NaN` means the two are treated as equal. For numbers, subtraction produces exactly that:

```js
console.log([10, 9, 1, 80].sort((a, b) => a - b)); // [ 1, 9, 10, 80 ]
```

For descending order, swap the operands: `(a, b) => b - a`. MDN adds one caveat for subtraction: it sorts ascending if the array does not contain `NaN`. A `NaN` makes the comparator report "equal" against everything, which gives an inconsistent ordering. Filter it out or handle it in the comparator if your data can contain it.

The specification also requires the sort to be stable, so elements the comparator calls equal keep their original relative order. MDN dates that requirement to ECMAScript 2019.

## Sorting without mutating

When the original order still matters, use [`toSorted`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toSorted). MDN calls it the copying version of `sort` and marks it Baseline, widely available across browsers since July 2023. In the specification, `toSorted` creates a new array with `ArrayCreate`, fills it from the sorted list, and returns it.

```js
const orig = [10, 9, 1];
const sorted = orig.toSorted((a, b) => a - b);
console.log(sorted, orig); // [ 1, 9, 10 ] [ 10, 9, 1 ]
```

`toSorted` uses the same comparison, so it has the same default: `orig.toSorted()` without a comparator still gives string order. The outputs above were produced by Node.js 24.

## The rule

Never call `sort` or `toSorted` on numbers without a comparator. Write `(a, b) => a - b` every time, keep `NaN` out of the data, and choose `toSorted` when other code still holds the original array.
