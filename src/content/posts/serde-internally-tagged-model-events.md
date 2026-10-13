---
title: Model a tagged stream of model events with serde internally tagged enums
description: "Map a JSON event stream with a \"type\" field onto a Rust enum using #[serde(tag = \"type\")], handle unknown event types, and see why tuple variants fail to compile."
pubDate: "2026-10-14T10:30:00Z"
section: rust
tags:
  - rust
  - serde
  - json
  - streaming
  - enums
draft: false
heroImage: https://media.aitamer.news/heroes/serde-internally-tagged-model-events-c33748ce.jpg
heroAlt: Cream paper packets bearing colored shapes flow toward matching trays, with a pentagon packet in a separate gray tray.
author: quill
wildness:
  rating: 1
  verified: Tuple-variant compile error, serde(other) fallback and alloc note all stated in serde docs.
  claimed: Nothing beyond the serde docs; event names in the examples are illustrative.
verdict: "Use #[serde(tag = \"type\")] with struct, struct-newtype and unit variants, and add a #[serde(other)] unit variant so a new event type does not end your stream."
sources:
  - title: Enum representations, serde documentation
    url: https://serde.rs/enum-representations.html
  - title: Container attributes, serde documentation
    url: https://serde.rs/container-attrs.html
  - title: Variant attributes, serde documentation
    url: https://serde.rs/variant-attrs.html
---

Streaming APIs for language models often send a sequence of JSON objects, each with a `type` field that names the kind of event. One object starts a message, the next carries a piece of text, another announces a tool call, and a last one closes the message. In Rust, the natural home for that shape is an enum, and serde has a representation built for it.

## What the stream looks like

Take a stream like this one, with one JSON object per line. The event names are illustrative. Your provider's API reference has the real ones.

```json
{"type":"message_start","id":"m1","model":"example-model"}
{"type":"text_delta","index":0,"text":"Hel"}
{"type":"tool_call","id":"c1","name":"search"}
{"type":"message_stop"}
```

Every object is flat. The `type` key sits beside the event's own fields. The [serde enum representations page](https://serde.rs/enum-representations.html) calls this the internally tagged representation.

## The enum

```rust
use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct ToolCall {
    id: String,
    name: String,
}

#[derive(Debug, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
enum Event {
    MessageStart { id: String, model: String },
    TextDelta { index: u32, text: String },
    ToolCall(ToolCall),
    MessageStop,
}
```

Parse each line with `serde_json::from_str::<Event>(line)` and `match` on the result.

Two [container attributes](https://serde.rs/container-attrs.html) do the work. `tag = "type"` tells serde to read the variant from the `type` field. `rename_all = "snake_case"` maps `MessageStart` to `message_start`, so the Rust names stay idiomatic while the wire names stay as the provider wrote them.

The variants cover the three shapes the serde documentation says this representation supports: struct variants (`MessageStart`), a newtype variant that wraps a struct (`ToolCall(ToolCall)`), and a unit variant (`MessageStop`). The newtype form helps when the same payload type is reused elsewhere in your code.

## Why tuple variants fail to compile

Suppose you write a compact variant:

```rust
#[derive(Deserialize)]
#[serde(tag = "type")]
enum Event {
    Delta(u32, String),
}
```

The derive refuses it:

```text
error: #[serde(tag = "...")] cannot be used with tuple variants
```

The enum representations page states this directly: internally tagged enums do not support tuple variants, and using the `tag` attribute on an enum that has one is an error at compile time. The reason follows from the shape. A tuple variant's data is a sequence, which JSON writes as an array such as `[0, "Hel"]`. An internally tagged event needs the `type` key inside the content object, and an array has no keys. There is nowhere to put the tag.

The fix is to name the fields: `Delta { index: u32, text: String }`. That also describes the wire format more honestly, since the stream sends named keys.

A related trap gets past the compiler. A newtype variant around a primitive, such as `Text(String)`, compiles. The documentation lists newtype variants "containing structs or maps" as supported, and a string is neither. Deserializing `{"type":"Text"}` into such an enum with serde_json fails at runtime with `invalid type: map, expected a string`. Keep newtype variants for struct or map payloads.

## Event types you have not seen yet

Providers add event types. With the enum above, a line such as `{"type":"ping_v2"}` fails with an `unknown variant` error. If your read loop uses `?`, the whole stream stops on an event you never needed.

Serde has a [variant attribute](https://serde.rs/variant-attrs.html) for this case. The documentation says `#[serde(other)]` picks a variant "if the enum tag is anything other than the tag of one of the other variants in this enum", and that it applies only to a unit variant in an internally or adjacently tagged enum.

```rust
#[derive(Debug, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
enum Event {
    MessageStart { id: String, model: String },
    TextDelta { index: u32, text: String },
    ToolCall(ToolCall),
    MessageStop,
    #[serde(other)]
    Unknown,
}
```

Unrecognised types now land in `Event::Unknown`. Because it is a unit variant, the payload is dropped. You still hold the raw line in your loop, so log it when you hit `Unknown` if you want a record of what you skipped.

Extra keys inside a known event are a separate question. The container attributes page says that for self-describing formats like JSON, unknown fields are ignored by default, so a `message_start` object that gains a new key still parses. Turning that off is the job of `deny_unknown_fields`, and for provider streams you usually want it left off.

## Where this advice stops

- Deserializing an internally tagged enum needs serde's `alloc` feature. The documentation notes it is on by default, so this matters only in builds without an allocator. There, the docs name the default externally tagged form as the only representation that works.
- If the tag and the payload arrive as two sibling keys, such as `{"t": "...", "c": {...}}`, use the adjacently tagged form, `#[serde(tag = "t", content = "c")]`.
- If the objects carry no tag at all, `#[serde(untagged)]` tries each variant in declaration order and keeps the first that deserializes. The container attributes page warns that it gives no informative error when nothing matches, unless you add an `expecting` message.
- The enum should mirror your provider's documented wire format field for field. The names in this article are examples only.
