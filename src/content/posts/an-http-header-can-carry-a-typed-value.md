---
title: An HTTP Header Can Carry a Typed Value
description: Structured Fields give some HTTP headers a shared way to carry numbers, strings, booleans, and collections. The field definition tells clients how to read them.
pubDate: "2026-10-06T08:30:00Z"
specimen: 305
section: general
tags:
  - http
  - headers
  - standards
  - web-development
draft: false
heroImage: https://media.aitamer.news/heroes/an-http-header-can-carry-a-typed-value-fbe41f0f.jpg
heroAlt: A sealed envelope branches into a number chart, quoted text, a switch and a list of shapes.
author: ari
wildness:
  rating: 2
  verified: Structured Fields define typed items; Priority uses an integer and a boolean in a dictionary.
  claimed: Shared parsing rules help clients agree on a header value's structure.
verdict: A header becomes reliably typed when its field definition names the structure and clients follow the matching parsing rules.
sources:
  - title: "RFC 8941: Structured Field Values for HTTP"
    url: https://www.rfc-editor.org/rfc/rfc8941
  - title: "RFC 9651: Structured Field Values for HTTP"
    url: https://www.rfc-editor.org/rfc/rfc9651.html
  - title: "RFC 9218: Extensible Prioritization Scheme for HTTP"
    url: https://www.rfc-editor.org/rfc/rfc9218.html
---

A header value arrives as bytes. A client still needs to know what those bytes mean. Does a number represent a count? Is a word a string? Where does one list member end and the next begin? [Structured Fields](https://www.rfc-editor.org/rfc/rfc9651.html) give specifications for new HTTP fields a shared set of types and rules for turning them into field values. Clients that implement those rules can parse the same syntax consistently.

The idea began in [RFC 8941](https://www.rfc-editor.org/rfc/rfc8941). Its successor, [RFC 9651](https://www.rfc-editor.org/rfc/rfc9651.html), is the current specification. The newer document keeps the core model and adds dates and display strings. The distinction matters when reading a field definition: a field defined against RFC 8941 cannot simply start using the newer types.

## A field definition supplies the meaning

Structured Fields provide syntax, types, parsing, and serialization. The specification for an individual field supplies its meaning. It says whether the whole value is an Item, List, or Dictionary. It also says which member types are allowed and what to do when a value breaks its own constraints. A field defined as an integer Item, for example, may set a narrower range than the generic integer type allows. These choices belong in the [field definition](https://www.rfc-editor.org/rfc/rfc9651.html).

This applies to fields that explicitly use Structured Fields. Existing HTTP fields retain their own definitions. A parser cannot identify a structured value just because a header contains a comma or an equals sign. It must know the field's specified type before it can interpret those characters under the shared rules. [RFC 9651](https://www.rfc-editor.org/rfc/rfc9651.html) makes that boundary explicit.

## Items carry typed values

An Item can hold an integer, decimal, string, token, byte sequence, or boolean. Under RFC 9651, it can also hold a date or display string. The textual forms help a parser distinguish them. `42` is an integer. `"hello world"` is a string. `?1` means boolean true, and `?0` means false. A bare word such as `tea` is a token. Those forms follow the [type definitions](https://www.rfc-editor.org/rfc/rfc9651.html); the field definition still decides which forms are valid for that field.

The details prevent quiet disagreement. An integer has a defined range. A decimal has limited fractional precision. An ordinary string uses printable ASCII and double quotes; its quotes and backslashes have specific escape rules. For non-ASCII text intended for display, RFC 9651 defines a separate display-string type. Byte sequences use base64 between colons. These are different values in the data model, even though an HTTP field carries each one as text on the wire. [The specification](https://www.rfc-editor.org/rfc/rfc9651.html) defines how to parse and serialize each form.

## Lists and dictionaries give items a shape

A List is an ordered sequence of Items or inner lists. Commas separate its members. The specification's example `sugar, tea, rum` is a List of tokens. An inner list groups Items inside parentheses, with spaces between them. Parameters can attach extra key-value information to an Item or inner list, using semicolons. [RFC 9651](https://www.rfc-editor.org/rfc/rfc9651.html) defines each layer, so a client can preserve the grouping instead of guessing where to split the value.

A Dictionary is an ordered set of named members. Its keys are lowercase, and each value can be an Item or inner list. In the specification's example `a=?0, b, c; foo=bar`, `a` is false. The bare members `b` and `c` are true. The `foo` parameter belongs to `c`. Omitting the value is the serialized form of boolean true for a Dictionary member or parameter. [The dictionary and parameter rules](https://www.rfc-editor.org/rfc/rfc9651.html) explain that compact form.

## Priority shows the types in use

The [Priority header field](https://www.rfc-editor.org/rfc/rfc9218.html) uses a Structured Fields Dictionary. Its `u` member is an integer for urgency. Its `i` member is a boolean indicating whether a response can be processed incrementally. The specification gives `u=5, i` as an example: the urgency is five, and the bare `i` means true. A server may use this signal when scheduling responses; the signal does not guarantee a particular delivery order. This example shows why parsing the types and applying the field's own meaning are separate steps.

## Strict parsing protects a shared interpretation

A Structured Fields parser has defined failure behavior. When syntax parsing fails, a recipient must ignore the entire field value or treat the complete HTTP message as malformed. It cannot keep a convenient fragment and silently discard the rest. Field-specific constraints have their own handling in the field definition. The [strict parsing rules](https://www.rfc-editor.org/rfc/rfc9651.html) aim to keep implementations from accepting different meanings for the same bytes.

Repeated field lines also need care. For a known Structured Field, a parser combines matching lines from the same header or trailer section into one comma-separated value before parsing. That works for List and Dictionary members when each member stays intact. Splitting an individual member across lines can change a string or make another type fail to parse. [RFC 9651](https://www.rfc-editor.org/rfc/rfc9651.html) describes those cases.

## What to do

When consuming a header, first read its field definition. Check whether it opts into Structured Fields, which RFC it references, and whether its top-level value is an Item, List, or Dictionary. Parse the complete field with an implementation of the specified algorithms. Then validate the types, ranges, and meanings required by that particular field. Handle syntax failure as [RFC 9651](https://www.rfc-editor.org/rfc/rfc9651.html) requires, and follow the field definition for its additional constraints.

When defining a new field, state its top-level type, allowed members, meaning, and error handling. Use the shared serializer to produce its value. Include cases with parameters, repeated field lines, and malformed input in interoperability tests. Those steps give senders and clients the same contract for reading the header.
