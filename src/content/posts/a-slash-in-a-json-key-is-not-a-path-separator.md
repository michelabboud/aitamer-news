---
title: A Slash in a JSON Key Is Not a Path Separator
description: A JSON Pointer can resolve successfully while selecting the wrong field. Escape each member name before building the pointer.
pubDate: "2026-10-04T23:00:00Z"
specimen: 240
section: dev
tags:
  - json
  - json-pointer
  - data-parsing
  - standards
draft: false
heroImage: https://media.aitamer.news/heroes/a-slash-in-a-json-key-is-not-a-path-separator-1b3bea50.jpg
heroAlt: A hand holds one key with slash marks beside several branching boxes of different shapes.
author: ari
wildness:
  rating: 3
  verified: RFC 6901 defines ~1 for slash, ~0 for tilde, and the order used to decode them.
  claimed: Two valid pointers can select different fields when a key contains a slash.
verdict: Encode member names one at a time, then verify the value selected by the completed pointer.
sources:
  - title: "RFC 6901: JavaScript Object Notation (JSON) Pointer"
    url: https://www.rfc-editor.org/rfc/rfc6901
---

A JSON member name can contain a slash. In a JSON Pointer, a slash separates reference tokens. That difference matters when a document contains both a literal key and a nested object with similar names. A pointer can resolve successfully while selecting the wrong value.

## How a pointer reads a slash

[RFC 6901](https://www.rfc-editor.org/rfc/rfc6901) defines a pointer as a sequence of tokens, each introduced by a slash. Inside a token, a literal slash is written as `~1`. A literal tilde is written as `~0`. Encode each member name before joining the tokens into a pointer.

Consider this illustrative JSON:

```json
{
  "result": {
    "usage/total": "flat",
    "usage": { "total": "nested" },
    "flag~state": "ready"
  }
}
```

The pointer `/result/usage~1total` selects `"flat"`. The pointer `/result/usage/total` selects `"nested"`. Both resolve, so a successful lookup alone cannot tell you whether the intended member was selected. The pointer `/result/flag~0state` selects `"ready"`. RFC 6901 includes corresponding examples for keys containing slash and tilde.

## Decode in the specified order

A reader splits the pointer into tokens, then decodes each token. [The evaluation rules](https://www.rfc-editor.org/rfc/rfc6901) say to replace `~1` with slash before replacing `~0` with tilde. The order matters for a name containing the literal text `~1`: its encoded token is `~01`, which must decode to `~1`, not to a slash.

The empty pointer refers to the whole document. A pointer containing only `/` refers to a member whose name is empty. Array tokens use zero-based indices, with no leading zeros. Each token has a specific meaning based on the value it addresses.

## What to do

Start with the actual member names in the parsed JSON. Encode each name separately: replace `~` with `~0`, then replace `/` with `~1`. Join the encoded names with a leading slash for each token. Keep the pointer as a pointer string; a URI fragment has its own encoding rules. RFC 6901 also says that JSON alone does not make JSON Pointer the fragment syntax for its media type.

Check the resolved value as well as whether resolution succeeded. Define what happens when a pointer is invalid or a member is missing. [RFC 6901's error section](https://www.rfc-editor.org/rfc/rfc6901) leaves that handling to the application.
