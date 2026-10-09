---
title: An Optional Protobuf Field Can Distinguish Missing From Zero
description: A proto3 scalar getter can return zero for both an omitted field and an explicit zero. Presence tracking makes partial updates behave as intended.
pubDate: "2026-10-09T22:00:00Z"
specimen: 593
section: dev
tags:
  - protocol-buffers
  - apis
  - field-presence
  - ai-development
draft: false
heroImage: https://media.aitamer.news/heroes/an-optional-protobuf-field-can-distinguish-missing-from-zero-23ce193b.jpg
heroAlt: An empty paper recess sits beside a recess holding an explicitly present yellow ring.
author: ari
wildness:
  rating: 1
  verified: Proto3 optional scalars track presence, serialize explicit zero, and merge it.
  claimed: Patch behavior depends on the application contract and every intermediary preserving presence.
verdict: For scalar patch fields, declare explicit presence and branch on the generated presence method. Test omitted, zero, and mixed-client round trips.
sources:
  - title: "Protocol Buffers: Application Note on Field Presence"
    url: https://protobuf.dev/programming-guides/field_presence/
---

A speech-session API receives an update for `silence_timeout_ms`. Suppose its contract says zero disables the timeout and an omitted value leaves the current setting alone. A session currently set to 800 milliseconds reacts differently when a patch explicitly supplies zero or omits the field. An ordinary proto3 `int32` cannot carry that distinction through its generated API.

The [Protocol Buffers field-presence guide](https://protobuf.dev/programming-guides/field_presence/) describes two disciplines. With implicit presence, a basic scalar's default value stands in for absence. An unset integer getter returns zero, and an explicitly set zero is skipped during serialization and message merge. Comparing the getter with zero hides whether the caller supplied that value. A patch built this way cannot set an existing nonzero value to zero through normal protobuf merge behavior.

Declare the patch field with explicit presence:

```proto
syntax = "proto3";
message SessionPatch {
  optional int32 silence_timeout_ms = 1;
}
```

Now the generated API tracks a separate set state. In C++, `patch.has_silence_timeout_ms()` decides whether to apply the update; `patch.silence_timeout_ms()` supplies the value. If the presence check is false, keep the session's setting. If it is true and the getter returns zero, apply zero. Explicitly present defaults are serialized and merged, so a zero can survive a protobuf hop between compatible readers. Use the generated presence method for the target language rather than inferring intent from a getter.

Presence also forces a useful API decision: does "clear the stored override" mean setting the application value to zero, or removing the field's set state? Those are different operations. A service that needs both should define separate patch semantics, such as an explicit clear operation or a field mask, and document their precedence. Repeated fields and maps do not get the same presence distinction from `optional`.

A mixed-client rollout needs care. The guide shows that an older peer using implicit presence can parse an explicit zero and omit it when serializing again, losing the set state even though the wire-format schema change is compatible. Before using a scalar as a partial update, test three paths end to end: omission preserves the old value, explicit zero replaces it, and every intermediary preserves the distinction.
