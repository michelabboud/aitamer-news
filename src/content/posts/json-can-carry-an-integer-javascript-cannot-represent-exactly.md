---
title: JSON Can Carry an Integer JavaScript Cannot Represent Exactly
description: A valid JSON integer may lose precision when parsed as a JavaScript Number. Decimal strings keep opaque IDs stable across runtimes.
pubDate: "2026-10-09T22:30:00Z"
section: dev
tags:
  - json
  - javascript
  - data-interchange
  - ai-development
draft: false
heroImage: https://media.aitamer.news/heroes/json-can-carry-an-integer-javascript-cannot-represent-exactly-f698063d.jpg
heroAlt: A paper sizing frame clips the distinctive end of a long ticket while a protective sleeve keeps the original intact.
author: ari
wildness:
  rating: 1
  verified: JSON permits large decimal tokens; JavaScript JSON.parse creates binary64 Numbers.
  claimed: No additional empirical claim; the transcript ID is illustrative.
verdict: Use decimal strings for cross-runtime opaque IDs. Test a value above the safe integer range through the entire API path.
sources:
  - title: "RFC 8259, Section 6: Numbers"
    url: https://www.rfc-editor.org/rfc/rfc8259.html#section-6
  - title: "ECMAScript: The Number Type"
    url: https://tc39.es/ecma262/multipage/ecmascript-data-types-and-values.html#sec-ecmascript-language-types-number-type
  - title: "ECMAScript: JSON.parse"
    url: https://tc39.es/ecma262/multipage/structured-data.html#sec-json.parse
---

Consider a transcript record returned as `{"transcript_id":9007199254740993}`. The token is valid JSON. A JavaScript client that reads it through ordinary `JSON.parse` receives a `Number` that cannot represent that particular integer exactly: it rounds to 9007199254740992. If the client sends the rounded ID back for retrieval, it may name a different record.

[Section 6 of RFC 8259](https://www.rfc-editor.org/rfc/rfc8259.html#section-6) defines JSON's decimal number grammar and permits implementations to limit numeric range and precision. It identifies integers from `-(2^53)+1` through `(2^53)-1` as a range in which implementations using the common binary64 representation agree exactly. The grammar allows more digits; syntactic validity therefore says little about a particular receiver's exactness.

The [ECMAScript Number specification](https://tc39.es/ecma262/multipage/ecmascript-data-types-and-values.html#sec-ecmascript-language-types-number-type) defines `Number` in terms of binary64 values, and the [JSON.parse specification](https://tc39.es/ecma262/multipage/structured-data.html#sec-json.parse) says JSON numbers become Numbers. The boundary guarantees consecutive integers through the safe range. `2^53` itself is representable, while `2^53 + 1` is not. That difference makes occasional successful tests with large IDs misleading.

For an opaque identifier, choose a decimal string in the API contract: `{"transcript_id":"9007199254740993"}`. Preserve it as a string in browser state, database keys, logs, and requests. Validate its allowed characters and length at the boundary, and decide whether leading zeros are meaningful. If a component truly needs arithmetic, parse the original string into an integer type with sufficient range, such as JavaScript `BigInt`, and perform explicit range checks before handing it to a narrower system. Converting an already rounded `Number` to `BigInt` cannot recover the lost digit.

This matters in AI pipelines that join a transcript, an embedding job, and a human review event by one generated ID. Precision loss can silently break the join even when the text content looks correct. Put an ID above the safe range in the cross-runtime contract tests, verify that it survives a complete request and response path byte for byte, and keep identifier fields textual unless the API genuinely needs numeric semantics.
