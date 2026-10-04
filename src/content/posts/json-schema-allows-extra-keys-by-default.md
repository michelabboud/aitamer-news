---
title: JSON Schema Allows Extra Keys by Default
description: A list of expected fields does not close a JSON object. Here is how to decide when model-generated objects should reject unknown keys.
pubDate: "2026-10-05T09:00:00Z"
specimen: 260
section: dev
tags:
  - json-schema
  - validation
  - structured-output
  - api-design
draft: false
heroImage: https://media.aitamer.news/heroes/json-schema-allows-extra-keys-by-default-762976d5.jpg
heroAlt: A box of shapes includes a star beyond the shapes listed on a nearby checklist.
author: ari
wildness:
  rating: 2
  verified: JSON Schema permits extra object keys by default and can reject them explicitly.
  claimed: Exact key sets are useful when an application acts on model-generated objects.
verdict: Name required fields and decide whether each object allows extensions. Reject unknown keys at exact contracts, and validate the values the application will use.
sources:
  - title: "JSON Schema: Additional Properties"
    url: https://json-schema.org/understanding-json-schema/reference/object#additionalproperties
  - title: "JSON Schema: Required Properties"
    url: https://json-schema.org/understanding-json-schema/reference/object#requiredproperties
  - title: "JSON Schema: Pattern Properties"
    url: https://json-schema.org/understanding-json-schema/reference/object#patternproperties
  - title: "JSON Schema: Unevaluated Properties"
    url: https://json-schema.org/understanding-json-schema/reference/object#unevaluatedproperties
  - title: "JSON Schema: What is a schema?"
    url: https://json-schema.org/understanding-json-schema/about
---

A model returns an object with the fields your application requested. It also adds a field you did not request. Whether that object passes validation depends on the schema, not on the wording of the request.

In JSON Schema, `properties` describes named fields and their values. It does not, by itself, forbid other fields. The [JSON Schema object reference](https://json-schema.org/understanding-json-schema/reference/object#additionalproperties) says additional properties are allowed by default. That default matters whenever an application treats a model-generated object as a record, a tool argument, or an instruction to another part of the system.

## A field list leaves room for more fields

Consider a model asked to classify a support message. The application expects a category and a short reason:

```json
{
  "type": "object",
  "properties": {
    "category": { "type": "string" },
    "reason": { "type": "string" }
  }
}
```

Under this schema, `{"category":"billing","reason":"Refund request","priority":"urgent"}` is valid if the named values satisfy their schemas. The `priority` field has no rule here. The `properties` keyword ignores names it does not list, and additional properties are allowed unless another rule constrains them. Even the empty object passes this schema. Listing a field does not make it required. These are separate choices in the [object reference](https://json-schema.org/understanding-json-schema/reference/object#additionalproperties).

If the application needs both named fields and no others, say both things:

```json
{
  "type": "object",
  "properties": {
    "category": { "type": "string" },
    "reason": { "type": "string" }
  },
  "required": ["category", "reason"],
  "additionalProperties": false
}
```

Now a missing `reason` fails because of `required`. An unexpected `priority` fails because of `additionalProperties: false`. The [required-properties section](https://json-schema.org/understanding-json-schema/reference/object#requiredproperties) explains the first rule; the [additional-properties section](https://json-schema.org/understanding-json-schema/reference/object#additionalproperties) explains the second. Closing an object does not fill in a missing field, and requiring fields does not close the object.

## Additional properties can be rejected or constrained

`additionalProperties` applies to names absent from `properties` and unmatched by `patternProperties`. Set it to `false` to reject those names. Leave it out to allow them. Give it a schema when extra names are useful but their values still need a rule. For example, `"additionalProperties": {"type":"string"}` allows extra fields with string values and rejects an extra field whose value is a number. The [JSON Schema examples](https://json-schema.org/understanding-json-schema/reference/object#additionalproperties) show each behavior.

A separate `patternProperties` rule can admit families of names. A pattern such as `^label_` can give matching fields a value schema while `additionalProperties: false` rejects names outside the declared fields and that family. Patterns are regular expressions, and the [object reference](https://json-schema.org/understanding-json-schema/reference/object#patternproperties) warns that they are not anchored automatically. Write the pattern to match the names you intend.

Think of `false` as a validation rule. The cited examples show an object with an extra field becoming invalid. They do not describe removing that field. If your application chooses to discard unknown fields, make that a separate, explicit transformation so the accepted record is clear.

## Close objects when the consumer needs an exact contract

Reject unexpected keys when each accepted name has a defined meaning and the consumer is prepared to act on the whole object. Tool arguments are a good example: a field that no handler recognizes should cause a visible validation failure. The same choice suits a fixed record sent to an API or stored for later processing. It exposes a mismatch between the produced object and the receiving contract instead of letting the extra field travel onward unnoticed.

Allow extra keys when extension is part of the contract. A bag of labels or user-defined attributes may need names that cannot be listed in advance. In that case, put the open part in a clearly named nested object and constrain its values. This keeps the fixed fields easy to inspect while giving the flexible fields an explicit home. JSON Schema supports a schema for each additional value, as shown in the [object reference](https://json-schema.org/understanding-json-schema/reference/object#additionalproperties).

Make the decision for each object level. Closing the outer object does not automatically close an object inside one of its properties. If a nested `details` object also needs an exact set of fields, give that object its own `additionalProperties: false`. The rule belongs where the relevant `properties` are declared.

## Schema composition needs a closer look

There is a trap when schemas are combined. `additionalProperties` recognizes properties declared in the same subschema. If one subschema closes an object, a field declared only in another part of an `allOf` combination can still count as additional. The [JSON Schema reference](https://json-schema.org/understanding-json-schema/reference/object#unevaluatedproperties) shows an example that fails for this reason. It also shows `unevaluatedProperties: false`, which can account for properties validated across subschemas. Check the behavior of a composed schema with actual accepted and rejected objects before using it as a boundary.

Field shape is only part of validation. A string can satisfy a string schema while carrying a value that is wrong for the application. The [JSON Schema introduction](https://json-schema.org/understanding-json-schema/about) distinguishes structural checks from semantic checks that application code may need. An exact key list should therefore be one check in the receiving workflow, followed by any checks that depend on what the values mean.

## What to do

1. Write down the fields the consumer reads. Mark which must be present with `required`.
2. For each object, decide whether unknown names have a legitimate use. Add `additionalProperties: false` where the answer is no.
3. Put intentional extensions in a named field or give extra values a schema. Use `patternProperties` only when a naming rule is part of the contract.
4. Validate the model-produced object before using it. Check examples with a missing field, an unknown field, a wrong value type, and an allowed extension.
5. Check nested and composed schemas separately. Then apply the application’s semantic checks to the validated values.
