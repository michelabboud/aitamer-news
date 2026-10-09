---
title: An Unknown Protobuf Field Can Survive a Round Trip
description: An older proto3 service can carry a newer binary field through unchanged message handling, but a JSON conversion or field-by-field rebuild can drop it.
pubDate: "2026-10-09T21:30:00Z"
specimen: 592
section: dev
tags:
  - protocol-buffers
  - schema-evolution
  - json
  - ai-infrastructure
draft: false
heroImage: https://media.aitamer.news/heroes/an-unknown-protobuf-field-can-survive-a-round-trip-fafef303.jpg
heroAlt: A cream courier envelope emerges from a teal paper arch with its unfamiliar rust triangular seal intact.
author: ari
wildness:
  rating: 1
  verified: Proto3 retains unknown binary fields; JSON conversion and field-by-field reconstruction lose them.
  claimed: The speech-message example is illustrative; no deployed system was tested.
verdict: Keep pass-through messages in binary form, use message-level copying, and test the full route with a field the older service does not know.
sources:
  - title: "Protocol Buffers: Unknown Fields"
    url: https://protobuf.dev/programming-guides/proto3/#unknowns
---

A new speech service adds `speaker_confidence` to a transcript message. An older routing service knows only `text` and `language`, yet it forwards the message to a newer reviewer. Whether the reviewer receives the confidence value depends on what the older service does between parsing and sending.

In the binary wire format, a protocol buffer field carries a number and value. The older schema has no meaning for the new field number, so it treats that entry as unknown. [The proto3 guide's unknown-fields section](https://protobuf.dev/programming-guides/proto3/#unknowns) says proto3 preserves unknown fields when parsing and includes them in serialized output. An older service can therefore parse a newer binary message and serialize that same message type again without automatically erasing the new field. That is a useful property during a gradual rollout where producers and consumers run different schema versions.

The preservation has a boundary. The guide lists two operations that lose unknown fields: serializing the proto to JSON and iterating through known fields to build a new message. If the routing service writes a JSON event to a queue and later reconstructs a proto, `speaker_confidence` is gone from that path. The same loss occurs if a mapper copies only `text` and `language` into a fresh message. A message-level copy or merge API preserves more than a hand-written list of known fields; the guide recommends APIs such as `CopyFrom()` and `MergeFrom()` for this purpose.

Preservation also does not mean comprehension. The older service cannot validate or apply semantics for `speaker_confidence` merely because it retains the bytes. If a new field is required to make a privacy or safety decision, every service making that decision must understand it before the feature is relied on. Unknown-field retention helps transport an extension; it cannot make old business logic aware of one.

Map the actual route of the message before calling a schema change safe: binary parser, transformation, queue format, logging path, and serializer. Keep binary for a pass-through hop when preserving future fields matters, and test a new-field message through the oldest deployed version of that hop. Check the output with the new schema. A successful parse by the old service alone proves little; the returned value is the evidence that the round trip survived.
