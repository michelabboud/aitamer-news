---
title: "`oneOf` Means Exactly One Match"
description: A response can satisfy two JSON Schema branches and still fail validation. This example shows how overlapping object shapes cause that result and how to make the branches distinct.
pubDate: "2026-10-05T16:00:00Z"
specimen: 273
section: dev
tags:
  - json-schema
  - validation
  - api-design
  - oneof
draft: false
heroImage: https://media.aitamer.news/heroes/oneof-means-exactly-one-match-ff31650b.jpg
heroAlt: Two overlapping schema cards surround a document marked as invalid for matching both.
author: ari
wildness:
  rating: 2
  verified: The linked JSON Schema references support the validation rules and example.
  claimed: The receipt and invoice response is an illustrative example.
verdict: When object branches overlap, a value matching both fails `oneOf`. Require a distinguishing value or choose `anyOf` when multiple matches are valid.
sources:
  - title: "JSON Schema: Boolean JSON Schema combination, oneOf"
    url: https://json-schema.org/understanding-json-schema/reference/combining#oneOf
  - title: "JSON Schema: Object, required properties"
    url: https://json-schema.org/understanding-json-schema/reference/object#required
  - title: "JSON Schema: Enumerated and constant values"
    url: https://json-schema.org/understanding-json-schema/reference/generic#constant-values
  - title: "JSON Schema: Boolean JSON Schema combination, anyOf"
    url: https://json-schema.org/understanding-json-schema/reference/combining#anyOf
---

## Where the overlap comes from

A `oneOf` schema accepts a value only when [exactly one branch validates](https://json-schema.org/understanding-json-schema/reference/combining#oneOf). Consider a response that can contain a receipt or an invoice:

```json
{
  "oneOf": [
    {
      "type": "object",
      "properties": { "receiptId": { "type": "string" } },
      "required": ["receiptId"]
    },
    {
      "type": "object",
      "properties": { "invoiceId": { "type": "string" } },
      "required": ["invoiceId"]
    }
  ]
}
```

A response such as `{"receiptId":"receipt","invoiceId":"invoice"}` looks plausible. It has both identifiers, and each has the expected type. Yet it fails `oneOf`: the receipt branch accepts it, and the invoice branch accepts it too.

The overlap comes from two [object-schema rules](https://json-schema.org/understanding-json-schema/reference/object#required). `required` says a named property must be present. It does not say other properties must be absent. By default, an object may also contain properties that its branch does not describe. Each branch therefore accepts the other branch's identifier as an extra property.

Neither branch fails on its own. The failure appears when `oneOf` checks how many branches accept the response. Removing one identifier from this example leaves one matching branch. Keeping both produces two matches. The response does not indicate which branch was intended.

## Make each branch identifiable

If the response has distinct kinds, require a `kind` property in each branch and give it a different `const` value:

```json
{
  "oneOf": [
    {
      "type": "object",
      "properties": {
        "kind": { "const": "receipt" },
        "receiptId": { "type": "string" }
      },
      "required": ["kind", "receiptId"]
    },
    {
      "type": "object",
      "properties": {
        "kind": { "const": "invoice" },
        "invoiceId": { "type": "string" }
      },
      "required": ["kind", "invoiceId"]
    }
  ]
}
```

[`const` requires one fixed value](https://json-schema.org/understanding-json-schema/reference/generic#constant-values). With `kind` required, a response cannot satisfy both branches through that property. A response still needs the identifier required by its chosen branch.

A response with both identifiers can still pass this revised schema if its `kind` selects one branch. Extra properties remain allowed. If the response must exclude the unused identifier, add an explicit property constraint to each branch. If a response is meant to satisfy either branch even when both match, [`anyOf` allows one or more matches](https://json-schema.org/understanding-json-schema/reference/combining#anyOf).

## What to do

Check each proposed response against every branch, especially responses containing fields from several branches. For `oneOf`, make the branches mutually exclusive with required fixed values or other explicit constraints. Add examples that should match one branch, both branches, and neither branch, then validate each against the complete schema.
