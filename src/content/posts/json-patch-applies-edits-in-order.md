---
title: JSON Patch Applies Edits in Order
description: JSON Patch paths are evaluated after each preceding edit. Follow array shifts, moves, and tests step by step to see why changing operation order changes the result.
pubDate: "2026-10-05T08:00:00Z"
specimen: 258
section: dev
tags:
  - json-patch
  - json-pointer
  - http-patch
  - apis
draft: false
heroImage: https://media.aitamer.news/heroes/json-patch-applies-edits-in-order-430c7d7d.jpg
heroAlt: Hands make successive changes to shape cards in a sequence of trays, then inspect the result.
author: ari
wildness:
  rating: 2
  verified: RFC 6902 applies operations in array order to each preceding result.
  claimed: Reordering valid array edits can produce a different final document.
verdict: Treat each operation as an edit to the current document. Recalculate array positions after every step and test the full sequence against a known starting value.
sources:
  - title: "RFC 6902: JavaScript Object Notation (JSON) Patch"
    url: https://www.rfc-editor.org/rfc/rfc6902
  - title: "RFC 6901: JavaScript Object Notation (JSON) Pointer"
    url: https://www.rfc-editor.org/rfc/rfc6901
  - title: "RFC 5789: PATCH Method for HTTP"
    url: https://www.rfc-editor.org/rfc/rfc5789
---

JSON Patch stores edits as an array of operations. The order of that array is part of the instruction. [RFC 6902](https://www.rfc-editor.org/rfc/rfc6902) says to apply each operation to the result of the one before it. A path in the second operation therefore refers to the document after the first edit. This matters most when an edit shifts array positions or changes a value that a later operation expects.

## The path sees the current document

Each operation has an `op` and a `path`. The path uses [JSON Pointer](https://www.rfc-editor.org/rfc/rfc6901), where `/steps/1` selects the element at index 1 inside `steps`. Array indexes start at zero. The path is evaluated when its operation runs. It does not reserve a position in the original document for later use.

JSON Patch defines six operations: `add`, `remove`, `replace`, `move`, `copy`, and `test`. For arrays, `add` inserts an element and shifts later elements right. `remove` deletes an element and shifts later elements left. Those rules in [RFC 6902](https://www.rfc-editor.org/rfc/rfc6902) make order visible even when the paths in two operations look independent.

Start with this document:

```json
{"steps":["draft","review","ship"]}
```

Suppose the goal is to remove `draft` and insert `test` at index 1. Apply the removal first:

```json
[
  {"op":"remove","path":"/steps/0"},
  {"op":"add","path":"/steps/1","value":"test"}
]
```

After the removal, `steps` is `["review","ship"]`. The second operation inserts `test` between those two values. The final array is `["review","test","ship"]`.

Reverse the two operations without changing their paths:

```json
[
  {"op":"add","path":"/steps/1","value":"test"},
  {"op":"remove","path":"/steps/0"}
]
```

The insertion first produces `["draft","test","review","ship"]`. Removing index 0 then produces `["test","review","ship"]`. Both patches are valid for the starting document. They have different results because `/steps/1` names a position in the array as it exists at that moment. The examples follow the array rules in [RFC 6902](https://www.rfc-editor.org/rfc/rfc6902).

## A move recalculates the destination

A `move` operation reads a value from `from`, removes it, then adds it at `path`. [RFC 6902](https://www.rfc-editor.org/rfc/rfc6902) defines it as that remove-then-add sequence. The destination is therefore interpreted after the source has gone.

For example, start with `{"steps":["draft","review","test","ship"]}`. Apply `{"op":"move","from":"/steps/0","path":"/steps/2"}`. Removing `draft` leaves `["review","test","ship"]`. Inserting it at index 2 yields `["review","test","draft","ship"]`. Reading both indexes against the original array would give the wrong answer.

This is especially easy to miss when moving within one array. Write out the intermediate array before deciding which destination index to use. The same rule also means a move can fail if its source does not exist. Its source cannot be an ancestor of its destination, according to [RFC 6902](https://www.rfc-editor.org/rfc/rfc6902).

## A test can stop later edits

Order also controls preconditions. The `test` operation compares the value at a path with a supplied value. If the comparison fails, patch evaluation should terminate and the patch must not be considered successful, as [RFC 6902](https://www.rfc-editor.org/rfc/rfc6902) specifies.

Consider `{"status":"draft"}` and this patch:

```json
[
  {"op":"test","path":"/status","value":"draft"},
  {"op":"replace","path":"/status","value":"ready"}
]
```

The test sees `draft`, so the replacement can run. Reverse the operations and the test sees `ready`; it fails. The order decides whether the patch succeeds, even though both operations use the same path. A `replace` also requires its target to exist. Placing it before an operation that creates the target will fail; placing it after may succeed. These behaviors come from the operation and error rules in [RFC 6902](https://www.rfc-editor.org/rfc/rfc6902).

There is a separate rule for HTTP. When a JSON Patch is sent with HTTP `PATCH`, [RFC 5789](https://www.rfc-editor.org/rfc/rfc5789) requires the server to apply the whole request atomically. If the full patch fails, the server must apply none of its changes. RFC 6902 describes failed evaluation, while RFC 5789 supplies the atomic HTTP rule. For uses outside HTTP, check the patch implementation's failure behavior before relying on rollback.

## What to do

Read a patch from top to bottom against one concrete starting document. After each operation, write down the new document before interpreting the next path. For array edits, check every index after an insertion, removal, or move. Put a `test` before the edit whose starting value it is meant to guard. Then run the complete patch against the expected input and compare the full output with the intended document.

When sending a patch over HTTP, use a conditional request such as `If-Match` when the edits depend on a known resource version. [RFC 5789](https://www.rfc-editor.org/rfc/rfc5789) recommends that approach for patches that need a known starting point. It protects the sequence from being applied to a different document than the one used to calculate its paths.
