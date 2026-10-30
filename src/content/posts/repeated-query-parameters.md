---
title: A query parameter can have more than one value
description: Repeated query parameters survive in URLSearchParams, but get returns only the first. Choose deliberately between reading every value, adding another value, and replacing the list.
pubDate: "2026-10-31T07:30:00Z"
section: dev
tags:
  - javascript
  - urls
  - web-development
draft: false
heroImage: https://media.aitamer.news/heroes/repeated-query-parameters-1337ce11.jpg
heroAlt: A brass key and three blank paper tags hang from one hook.
author: ari
wildness:
  rating: 2
  verified: The URL Standard defines repeated pairs and get, getAll, append, and set behavior.
  claimed: The receiving application must choose its own policy for repeated single-value fields.
verdict: Read all values for list fields, append to extend them, and use set when replacement is intended.
sources:
  - title: "WHATWG URL Standard: URLSearchParams"
    url: https://url.spec.whatwg.org/#interface-urlsearchparams
  - title: "MDN: URLSearchParams instance methods"
    url: https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams#instance_methods
  - title: "MDN: URLSearchParams preserving plus signs"
    url: https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams#preserving_plus_signs
---

A search page lets someone select two tags. Its address contains `tag=python&tag=sqlite`, yet the page restores only the Python filter after a reload. One likely place to inspect is the call that reads the query: a request for one value can quietly discard the application's view of the others.

The [URL Standard](https://url.spec.whatwg.org/#interface-urlsearchparams) defines query parameters as a list of name and value pairs. Names can repeat. The method that reads one matching value returns the first, while the method that reads all matches returns them in their list order. The difference is visible without a browser:

```js
const params = new URLSearchParams("tag=python&tag=sqlite");
console.log(params.get("tag"));    // python
console.log(params.getAll("tag")); // [ 'python', 'sqlite' ]
console.log(params.getAll("missing")); // []
```

Choose the method from the field's contract. Multiple selected filters naturally call for the list. A field that should occur once deserves a deliberate rule for repeated input: reject it, or document which value wins. Reading the full list first lets the application check that rule while all submitted values are still available.

Writing parameters needs the same attention. [MDN's method reference](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams#instance_methods) distinguishes appending a new pair from setting the value for a name. Setting an existing name changes its first matching pair and removes its other matches. A helper intended to add one tag can therefore erase earlier selections if it uses the replacement operation.

```js
params.append("tag", "rust");
console.log(params.getAll("tag"));
// [ 'python', 'sqlite', 'rust' ]

params.set("tag", "go");
console.log(params.getAll("tag")); // [ 'go' ]
```

Build outgoing parameters from values with these methods rather than joining strings by hand. [MDN's encoding examples](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams#preserving_plus_signs) show a related trap: parsing a query string treats a plus sign as a space. Appending a value containing a literal plus preserves that character and encodes it when the query is serialized.

```js
const search = new URLSearchParams();
search.append("q", "C++");
console.log(search.toString()); // q=C%2B%2B
console.log(search.get("q"));   // C++
```

Keep the server's interpretation in the contract as well. This interface describes what the JavaScript object does; a framework's query parser may expose a different shape. Send a request with repeated keys through the actual endpoint and check which values arrive before relying on the browser-side result.

For a filter page, a useful round-trip test starts with several selections, writes the address, reloads from that address, and compares the restored selections. Include an empty selection and a value containing punctuation. This tests the behavior the reader sees and gives each query operation a clear job. Test adding a filter and replacing all filters as separate actions. Their buttons may look similar, yet each operation should have its own expected address and restored selection.
