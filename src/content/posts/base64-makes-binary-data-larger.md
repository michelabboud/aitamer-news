---
title: Base64 Makes Binary Data Larger
description: Base64 turns each three-byte group into four text characters. Padding makes short inputs expand even more.
pubDate: "2026-10-06T09:30:00Z"
specimen: 307
section: general
tags:
  - base64
  - apis
  - encoding
  - data-size
draft: false
heroImage: https://media.aitamer.news/heroes/base64-makes-binary-data-larger-f9ab710d.jpg
heroAlt: Three compact blocks expand into four shape-marked cards and a thicker stack.
author: ari
wildness:
  rating: 1
  verified: RFC 4648 maps three input bytes to four Base64 characters and supplies padding examples.
  claimed: An API text field should be sized for the encoded value, including its final padded group.
verdict: Base64's size increase follows directly from its encoding rule. Count four characters per three input bytes and account for padding at the end.
sources:
  - title: "RFC 4648: The Base16, Base32, and Base64 Data Encodings"
    url: https://www.rfc-editor.org/rfc/rfc4648
---

An API can put binary bytes in a text field by encoding them as Base64. The field then holds more characters than the original data held bytes. [RFC 4648](https://www.rfc-editor.org/rfc/rfc4648) defines the transformation and gives test vectors that make the cost visible.

## Three bytes become four characters

Base64 reads three eight-bit bytes as one 24-bit group. It splits that group into four six-bit values. Each value selects one character from the Base64 alphabet. The [RFC's example](https://www.rfc-editor.org/rfc/rfc4648) encodes `foo` as `Zm9v`: three input bytes become four output characters. The representation has changed so the data can be carried as text.

For complete groups, the count is straightforward: every three input bytes produce four Base64 characters. The encoded text is one third longer by this count. That figure describes the Base64 value itself. It does not tell you the size of a complete API message, which can have other content around the value.

## Short inputs need padding

An input does not have to end after a complete three-byte group. Base64 fills the last output group with `=` characters when needed. The [RFC's test vectors](https://www.rfc-editor.org/rfc/rfc4648) show `f` becoming `Zg==` and `fo` becoming `Zm8=`. Both results take four characters, even though their inputs contain fewer than three bytes.

This is why the one-third increase is a useful rule for complete groups but can understate the increase for a short value. Under [RFC 4648](https://www.rfc-editor.org/rfc/rfc4648), padding is included unless the specification using Base64 explicitly says otherwise. If an API omits padding, its contract must define that choice.

## What to do

First, check whether the API field requires Base64 and which variant it accepts. [RFC 4648](https://www.rfc-editor.org/rfc/rfc4648) also defines a URL-safe alphabet and distinguishes that variant from ordinary Base64. Next, budget four output characters for each complete group of three input bytes, plus a final four-character group when input bytes remain and padding is used. Finally, if the API allows raw binary data, compare that option with the text field before choosing a payload format. The extra Base64 characters are a predictable cost of the text representation.
