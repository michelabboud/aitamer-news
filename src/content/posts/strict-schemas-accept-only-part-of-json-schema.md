---
title: Strict schemas accept only part of JSON Schema
description: Before you reuse a JSON Schema with strict structured outputs, audit it against the supported keywords and move the rules that do not fit into your own validation code.
pubDate: "2026-10-11T04:00:00Z"
section: dev
tags:
  - structured-outputs
  - json-schema
  - openai
  - validation
  - python
draft: false
heroImage: https://media.aitamer.news/heroes/strict-schemas-accept-only-part-of-json-schema-3f3684f1.jpg
heroAlt: A layered paper schema passes through a blue filter, with unsupported rule slips diverted to a small validation tray.
author: quill
wildness:
  rating: 1
  verified: Keyword lists, size limits and fine-tuned restrictions match the OpenAI guide
  claimed: Strict mode supports a subset of JSON Schema and errors on unsupported schemas
verdict: Solid, documented ground. Reusing a full JSON Schema in strict mode fails on keywords like if/then and allOf; audit first and keep the dropped rules in code.
sources:
  - title: OpenAI Structured Outputs guide
    url: https://developers.openai.com/api/docs/guides/structured-outputs
---

You already have a JSON Schema for the object you want. Maybe it validates API requests, or it ships with an OpenAPI spec. Passing it to an OpenAI model with `strict: true` looks like free reuse. The [Structured Outputs guide](https://developers.openai.com/api/docs/guides/structured-outputs) says strict mode "supports a subset of the JSON Schema language", and that some features are unavailable for performance or technical reasons.

## What the failure looks like

The guide states that sending an unsupported schema with `strict: true` returns an error. That is the easy case. You see it on the first request.

The harder case is the edit you make to get past the error. Delete `if`, `then` and `else` from a schema and the request succeeds, and the business rule those keywords carried is gone. Nothing in the response tells you a rule went missing.

Here is a schema that a validation layer might already use:

```json
{
  "type": "object",
  "properties": {
    "email": { "type": "string", "format": "email" },
    "plan": { "type": "string", "enum": ["free", "pro"] },
    "company": { "type": "string" }
  },
  "required": ["email", "plan"],
  "if": { "properties": { "plan": { "const": "pro" } } },
  "then": { "required": ["company"] }
}
```

It breaks three strict-mode rules. It uses `if` and `then`. It leaves `company` out of `required`. It does not set `additionalProperties: false`.

## The supported subset, per the guide

The guide lists these supported types: string, number, boolean, integer, object, array, enum and `anyOf`. Per type, it names these keywords:

- **String:** `pattern`, and `format` with `date-time`, `time`, `date`, `duration`, `email`, `hostname`, `ipv4`, `ipv6` and `uuid`.
- **Number:** `multipleOf`, `maximum`, `exclusiveMaximum`, `minimum` and `exclusiveMinimum`.
- **Array:** `minItems` and `maxItems`.
- **Object:** `additionalProperties: false` must always be set, and every field must appear in `required`.

It lists `allOf`, `not`, `dependentRequired`, `dependentSchemas`, `if`, `then` and `else` as unsupported. The root must be an object and cannot be an `anyOf`. Each branch inside an `anyOf` must itself follow the subset. Definitions with `$defs` and `$ref` work, and so does recursion.

There are size limits too. The guide allows up to 5,000 object properties in total and up to 10 levels of nesting. Property names, definition names, enum values and const values together are capped at 120,000 characters. Enum properties can hold up to 1,000 values across the whole schema, and a single string enum with more than 250 values is capped at 15,000 characters.

Fine-tuned models get a smaller set. The guide says they also lack `minLength`, `maxLength`, `pattern`, `format`, `minimum`, `maximum`, `multipleOf`, `patternProperties`, `minItems` and `maxItems`.

One gap to note: for other models, the string list names only `pattern` and `format`. The guide does not say plainly whether `minLength` and `maxLength` work outside fine-tuned models. Treat them as unsupported until you confirm otherwise, and enforce lengths in code.

## Audit a schema with an allowlist

A short script catches most problems before you send a request. It walks the schema, flags any keyword outside an allowlist built from the guide, and checks the two object rules.

```python
ALLOWED = {
    "type", "properties", "required", "additionalProperties", "items",
    "enum", "anyOf", "$defs", "$ref", "description",
    "pattern", "format", "multipleOf", "minimum", "maximum",
    "exclusiveMinimum", "exclusiveMaximum", "minItems", "maxItems",
}

def audit(node, path="#"):
    problems = []
    for key, value in node.items():
        if key not in ALLOWED:
            problems.append(f"{path}: unsupported keyword {key}")
        if key in ("properties", "$defs"):
            for name, sub in value.items():
                problems += audit(sub, f"{path}/{key}/{name}")
        elif key == "items":
            problems += audit(value, f"{path}/items")
        elif key == "anyOf":
            for i, sub in enumerate(value):
                problems += audit(sub, f"{path}/anyOf/{i}")
    if node.get("type") == "object":
        if node.get("additionalProperties") is not False:
            problems.append(f"{path}: additionalProperties must be false")
        props = set(node.get("properties", {}))
        missing = props - set(node.get("required", []))
        if missing:
            problems.append(f"{path}: not in required: {sorted(missing)}")
    return problems
```

`description` is on the list because the guide recommends clear descriptions for important keys. Run `audit` on the example and it reports `if`, `then`, the missing `additionalProperties` and `company` missing from `required`. Add a check for an `anyOf` at the root if your schemas use one.

Treat the script as a pre-flight check. The API stays the authority, and the guide can change.

## Move the dropped rules into your code

Rewrite the schema to the subset. The guide says to emulate an optional field with a union that includes `null`, so `company` becomes required and nullable:

```json
{
  "type": "object",
  "properties": {
    "email": { "type": "string", "format": "email" },
    "plan": { "type": "string", "enum": ["free", "pro"] },
    "company": { "type": ["string", "null"] }
  },
  "required": ["email", "plan", "company"],
  "additionalProperties": false
}
```

The conditional rule now lives in a function that runs after parsing:

```python
def check_rules(data):
    errors = []
    if data["plan"] == "pro" and not data["company"]:
        errors.append("company is required on the pro plan")
    return errors
```

Decide what a failed check does: reject the result, ask the model again with the error message, or send it to a person. Whatever you pick, make it explicit.

If you keep the original schema, a full JSON Schema validator can still check its `if` and `then` against the parsed output. That leaves you with two schemas, one that constrains generation and one that validates. The guide recommends generating schemas from your type definitions with the SDK helpers for Pydantic or Zod, or adding CI checks, so the JSON Schema and your code types do not drift apart. With two schemas, that advice matters twice as much.

## Where this stops applying

- These rules describe OpenAI's strict mode. Other providers document their own structured output features, so check their lists instead of assuming this one carries over.
- JSON mode is a different feature. The guide's comparison table says it produces valid JSON without adhering to a schema, so none of these constraints apply there.
- The keyword list can change. Re-read the guide's supported schemas section when you change models or SDK versions.
