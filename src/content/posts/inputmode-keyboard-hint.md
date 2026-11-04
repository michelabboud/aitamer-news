---
title: Inputmode Suggests a Keyboard. It Does Not Validate the Value.
description: Use inputmode to make text entry easier, then validate the actual value separately.
pubDate: "2026-11-06T08:30:00Z"
section: dev
tags:
  - html
  - forms
  - mobile
  - validation
  - accessibility
draft: false
heroImage: https://media.aitamer.news/heroes/inputmode-keyboard-hint-96e9bfcf.jpg
heroAlt: A blank paper keyboard leads to an open doorway through which round and triangular tokens pass.
author: mai
wildness:
  rating: 1
  verified: Inputmode hints at an input mechanism; pattern and required provide separate constraints.
  claimed: No additional unverified claims.
verdict: Use inputmode to improve entry, not to enforce the value; validate the submitted data separately.
sources:
  - title: "WHATWG HTML Standard: Input modalities and the inputmode attribute"
    url: https://html.spec.whatwg.org/multipage/interaction.html#attr-inputmode
  - title: "WHATWG HTML Standard: The input element"
    url: https://html.spec.whatwg.org/multipage/input.html
---

A numeric-looking keyboard is a convenience, not a promise about the value that arrives at your server. That distinction is the useful part of `inputmode`: it helps a browser choose an appropriate input interface, but it is not a rule that the entered text must obey.

Suppose an application asks for a six-digit access code. It is an identifier, not a quantity you will add or put through arithmetic. A text input keeps leading zeroes as part of the value, while `inputmode="numeric"` requests a keyboard suited to digit entry on devices that provide one:

```html
<form action="/verify" method="post">
  <label for="code">Six-digit access code</label>
  <input id="code" name="code" type="text"
         inputmode="numeric" pattern="[0-9]{6}"
         required aria-describedby="code-help">
  <p id="code-help">Enter the six digits shown in your message.</p>
  <button type="submit">Verify</button>
</form>
```

The jobs are deliberately separate. `type="text"` makes this a text value. `inputmode="numeric"` is the input hint. `pattern="[0-9]{6}"` supplies a browser-side constraint for exactly six ASCII digits, while `required` rejects an empty value during ordinary interactive constraint validation. The visible instruction tells the person what the pattern expects, rather than leaving them to decode an error.

A user may paste text, use a physical keyboard, or interact through a different input method. A device may also present a keyboard differently from the one you pictured. Test the actual experience on the devices and assistive technologies your audience uses, and do not assume that an input hint blocks other characters.

Browser validation is a helpful first response, not the final decision. It can be bypassed, and requests can be sent independently of the page. On the server, check that the received value is a string of six ASCII digits, then apply the application's real rules: whether the code exists, has expired, and is valid for the current operation. Return a clear error without revealing more than the security design permits.

The pattern in this example is intentionally narrow. If your application accepts digits from other writing systems, or accepts spaces in codes copied from a message, decide how to normalize and validate those values instead of silently relying on this pattern. Also avoid using a numeric hint for a field that routinely requires letters or punctuation the hinted keyboard might make awkward to enter.

Think in layers: choose the control for the data, offer an input hint for convenience, communicate the expected format, and validate what actually arrives. A friendly keyboard is a good start. It is not a gatekeeper.
