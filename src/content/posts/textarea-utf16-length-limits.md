---
title: Textarea Limits Count More Than Visible Characters
description: Textarea length limits use UTF-16 code units, with important validation and newline caveats.
pubDate: "2026-11-09T12:30:00Z"
specimen: 1288
section: dev
tags:
  - html
  - forms
  - unicode
  - validation
  - javascript
draft: false
heroImage: https://media.aitamer.news/heroes/textarea-utf16-length-limits-75b5f19d.jpg
heroAlt: A coral paper butterfly made from two interlocking halves sits in a frame beside a tray holding two small blocks.
author: mai
wildness:
  rating: 1
  verified: Textarea length limits use UTF-16 code units and normalize newlines for measurement.
  claimed: No additional unverified claims.
verdict: Explain the counting unit, handle user-edit validation carefully, and enforce the chosen rule on the server.
sources:
  - title: "WHATWG HTML Standard: Form control infrastructure"
    url: https://html.spec.whatwg.org/multipage/form-control-infrastructure.html
  - title: "WHATWG HTML Standard: Form elements"
    url: https://html.spec.whatwg.org/multipage/form-elements.html
  - title: "MDN: Textarea element"
    url: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/textarea
  - title: "MDN: String length"
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/length
  - title: "MDN: Constraint validation"
    url: https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Constraint_validation
---

A text box that allows ten characters can surprise someone who enters an emoji. The browser is not necessarily counting the symbols a person sees. For a textarea, the HTML length limits are measured in UTF-16 code units.

Consider a short feedback field:

```html
<form action="/feedback" method="post">
  <label for="comment">Comment</label>
  <p id="hint">Enter 4 to 10 UTF-16 code units.</p>
  <textarea id="comment" name="comment"
            minlength="4" maxlength="10" required
            aria-describedby="hint"></textarea>
  <button type="submit">Send</button>
</form>
```

The letter A occupies one UTF-16 code unit. The smiling face 😄 is one Unicode code point outside the Basic Multilingual Plane, but it occupies two UTF-16 code units. So a value consisting of A followed by that face has a length of three for these limits, even though someone may see two symbols. Five such faces occupy ten code units.

The distinction matters for both ends of the range. A nonempty user-edited value shorter than the minimum can fail constraint validation. Browsers commonly prevent a user from entering more than the maximum, although the standard permits rather than requires that restriction. The browser's length check is not a count of grapheme clusters, the units people may think of as characters; a visible symbol can contain multiple code points.

A counter can use the textarea's JavaScript value length if it is meant to follow the same code-unit measure. Describe that measure honestly, particularly when a tight limit can affect different scripts or emoji. If the product requirement is instead about perceived characters, define a grapheme-based rule and implement it consistently rather than assuming the native limit provides one.

There is another distinction for multiline text. The textarea's API value normalizes line endings to line feeds for length measurement, so a line break counts as one code unit there. That is not necessarily the number of bytes in the eventual HTTP request or stored representation. A server with a byte limit needs to check bytes separately.

Minimum length does not make the field mandatory. Without the required attribute, an empty value is allowed. With both attributes present, the minimum must not exceed the maximum.

Finally, these are client-side controls, not a server guarantee. The standard's too-short and too-long conditions depend on a value last changed by a user edit; a script can set a value outside the limits without triggering those length violations, even when validity is checked. Requests can also bypass the page entirely. Validate the submitted value on the server using a documented counting and newline policy.
