---
title: 0.1 + 0.1 + 0.1 Is Not 0.3
description: Why a printed decimal like 0.1 is a rounded picture of a stored binary approximation, and why adding three of them does not give exactly 0.3.
pubDate: "2026-10-20T12:00:00Z"
section: dev
tags:
  - python
  - floating-point
  - numerical-literacy
  - ieee-754
  - programming
draft: false
heroImage: https://media.aitamer.news/heroes/float-sum-decimal-c815fac8.jpg
heroAlt: Three coral paper strips placed end to end extend slightly beyond a single cream strip on a blue backing.
author: mai
wildness:
  rating: 1
  verified: "Python tutorial: 0.1+0.1+0.1 == 0.3 is False. math.isclose: rel_tol default 1e-09; abs_tol default 0."
  claimed: The explanation of display rounding and representation error follows the tutorial.
verdict: A printed float is a rounded picture of a stored approximation. Compare inexact values with isclose, or use decimal for exactness.
sources:
  - title: "Python Tutorial: Floating-Point Arithmetic, Issues and Limitations"
    url: https://docs.python.org/3/tutorial/floatingpoint.html
  - title: "Python Standard Library: math — Mathematical functions"
    url: https://docs.python.org/3/library/math.html
---

The fraction 0.625 looks decimal, and it is: six tenths plus two hundredths plus five thousandths. Computers do not store it that way. They store floating-point numbers as base 2, binary, fractions. The decimal 0.625 happens to equal one half plus one eighth, so it fits neatly into binary. Most decimal fractions do not fit at all, and 0.1 is the famous one that refuses.

In base 10, one third is 0.3333..., and no matter how many digits you write, you never reach exactly one third. In base 2, one tenth is the same kind of thing: an infinitely repeating fraction, 0.0001100110011..., and no finite number of bits reaches it exactly. The machine stops at the nearest representable binary fraction and stores that instead.

The [Python tutorial](https://docs.python.org/3/tutorial/floatingpoint.html) shows why this stays hidden. If Python printed the full decimal value it actually stores for 0.1, you would see 0.1000000000000000055511151231257827... with many more digits after it. That is unhelpful, so Python prints a rounded value instead: 0.1. The display looks exact. The stored value is only close.

The illusion breaks the moment you do arithmetic. Three copies of the approximation do not add to the approximation of three tenths:

```python
0.1 + 0.1 + 0.1 == 0.3
# False
```

The tutorial is explicit that this behavior is inherent to binary floating point, present in Python and in every language that uses the hardware's floating-point arithmetic, even if some hide the difference in their default output.

The right tool depends on what you are comparing. [`math.isclose`](https://docs.python.org/3/library/math.html) decides whether two inexact values are near enough, and it returns True for that sum against 0.3. But isclose is a tolerance check with two knobs that mean specific things. Its default relative tolerance is 1e-09, meaning the two values agree to about nine decimal digits. The absolute tolerance defaults to zero and becomes the deciding factor when you compare against zero itself. Under those defaults, with a relative tolerance below 1 and an absolute tolerance of zero, `isclose(x, 0)` is False for any nonzero x, because the allowed difference is measured relative to the larger absolute value, which is abs(x). To test whether a value is effectively zero you must pass a positive absolute tolerance, as in `abs_tol=1e-12`. The tolerance has to fit the comparison you actually intend. isclose does not make the arithmetic exact, and it is not a promise that every numerical comparison will now behave.

For exact decimal representation, Python offers the `decimal` module, which holds values in a form that can represent decimal fractions exactly. The `fractions` module takes a different route, storing exact rationals as a numerator over a denominator. For most work, binary floats are fine. The lesson is not to avoid them. The lesson is to know that a printed float is a rounded picture of a stored approximation, and to compare with that in mind.
