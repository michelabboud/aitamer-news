---
title: Textarea Wrapping Is Not Just Visual
description: Soft and hard wrapping can submit different text even when the controls look alike.
pubDate: "2026-11-10T08:30:00Z"
specimen: 1290
section: dev
tags:
  - html
  - forms
  - textarea
  - javascript
draft: false
heroImage: https://media.aitamer.news/heroes/textarea-soft-hard-wrapping-ddffc232.jpg
heroAlt: One cream paper ribbon bends continuously through a teal frame while separate strips cross another frame.
author: mai
wildness:
  rating: 1
  verified: Soft wrapping adds no submission wraps; hard wrapping inserts line breaks using the textarea width.
  claimed: No additional unverified claims.
verdict: Choose wrapping for the text the receiver needs, not merely for how the textarea looks.
sources:
  - title: "WHATWG HTML Standard: Form elements"
    url: https://html.spec.whatwg.org/multipage/form-elements.html
  - title: "MDN: Textarea element"
    url: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/textarea
---

A long sentence can appear on several lines in a textarea without containing a single line break. The browser may wrap it simply so it fits on the screen. Whether those visual breaks become part of form data is a separate decision.

The textarea's wrap attribute controls that decision for form submission. In the soft state, the browser does not add line breaks just because the text wraps visually. In the hard state, the browser adds line breaks to the submitted value to wrap it at the specified character width. Soft is also the default when the attribute is missing or invalid.

Imagine collecting a note for an application that stores plain text. These two fields start with the same text but ask for different submission behavior:

```html
<form id="notes" action="/notes" method="post">
  <label for="soft-note">Original note</label>
  <textarea id="soft-note" name="softNote" cols="10"
            wrap="soft">abcdefghijklmnopqrst</textarea>

  <label for="hard-note">Wrapped note</label>
  <textarea id="hard-note" name="hardNote" cols="10"
            wrap="hard">abcdefghijklmnopqrst</textarea>
  <button type="submit">Send</button>
</form>
```

Both controls may display the text over multiple lines. On form submission, the soft field contributes the original sequence without added wrapping breaks. The hard field's submitted value gets line breaks added as needed for the specified width. Existing line breaks entered by the user remain meaningful in either case. For hard wrapping, the cols attribute must be specified; here it supplies a width of ten.

There is a useful inspection boundary in JavaScript. Reading a textarea's value property gives its API value, with line endings normalized to line feeds. The HTML wrapping transformation applies when the value is used for form submission, not when that property is read. To inspect form entries before sending, construct a FormData object from the form and examine each field. Do not assume that logging the textarea property alone shows the hard-wrapped submission value.

The standard leaves the precise hard-wrapping algorithm to the implementation. It specifies the width requirement, not a universal promise that every browser will break a particular sentence at precisely the same word or screen position. CSS sizing and the visible layout are also not a reliable substitute for inspecting the data. Test the browsers and content your application needs to support.

Line-ending representation can change during form encoding or later server processing, too. If exact text matters, decide how the server normalizes newlines and compare decoded values, not just the raw request bytes. For prose that should reflow naturally in different displays, soft wrapping is usually the less intrusive choice. Use hard wrapping when inserted line breaks are actually part of the receiving system's contract.
