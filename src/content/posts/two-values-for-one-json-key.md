---
title: Two Values for One JSON Key
description: A repeated JSON object name can produce different results in different parsers. Here is how to spot the problem and reject it.
pubDate: "2026-10-06T04:00:00Z"
specimen: 297
section: dev
tags:
  - json
  - parsing
  - interoperability
  - validation
draft: false
heroImage: https://media.aitamer.news/heroes/two-values-for-one-json-key-726ae9df.jpg
heroAlt: A magnifying glass reveals duplicate entries in a JSON-like document with conflicting outcomes.
author: ari
wildness:
  rating: 3
  verified: Parsers may keep the last value, reject duplicates, or expose every pair.
  claimed: An escaped spelling can make a repeated name easy to miss in raw text.
verdict: Reject duplicate decoded object names at the first JSON boundary, then test that rule with plain and escaped duplicates.
sources:
  - title: "RFC 8259: The JavaScript Object Notation (JSON) Data Interchange Format"
    url: https://www.rfc-editor.org/rfc/rfc8259.html
  - title: "Python documentation: json"
    url: https://docs.python.org/3/library/json.html
  - title: "Go documentation: encoding/json/v2"
    url: https://pkg.go.dev/encoding/json/v2
---

A JSON object can repeat a name:

```json
{"role": "viewer", "role": "admin"}
```

The [JSON specification](https://www.rfc-editor.org/rfc/rfc8259.html) says object names should be unique. Its grammar still admits the example above. A receiver is left to decide what the repeated name means. That decision can change the value an application sees.

## The same bytes, different answers

The specification describes three observed behaviors. Many implementations keep the last pair. Others reject the object. Some expose every pair. [Python's JSON decoder](https://docs.python.org/3/library/json.html) uses the last value by default, so its ordinary object for this example contains `role: admin`. The [Go `encoding/json/v2` documentation](https://pkg.go.dev/encoding/json/v2) says its decoder rejects duplicate names by default. Those are different answers to identical input.

The difference matters when software passes JSON through more than one component. Imagine a validator rejecting this object while a separate consumer accepts it and keeps `admin`. The rejection only protects the consumer if it prevents the consumer from processing that input. More generally, a check performed on one interpretation cannot establish what another parser will see. This follows from the parser differences; it is not a claim about any particular service.

## Repetition can hide behind escapes

These names look different in the source text:

```json
{"role": "viewer", "\u0072ole": "admin"}
```

After JSON string escapes are decoded, both names are `role`. The [specification's string comparison guidance](https://www.rfc-editor.org/rfc/rfc8259.html) warns that comparing undecoded spellings can give the wrong answer. A duplicate check must compare decoded names within each object, including nested objects. Looking only for repeated character sequences in raw text misses this case.

## What to do

Reject duplicate decoded names when JSON first enters your system. Do this before converting the object into a map that retains one value per name. In Python, `object_pairs_hook` receives each object's ordered pairs and can reject a name it has already seen, as the [decoder documentation](https://docs.python.org/3/library/json.html) explains.

Add test inputs with an ordinary duplicate and an escaped spelling of the same name. Check the actual parser used at every boundary that accepts untrusted JSON. Keep one clear rule across the path: a repeated object name is an error. That gives later code a single mapping to work with.
