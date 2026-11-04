---
title: Disabled or Read-Only? The Difference Shows Up in Your Form Data
description: Both can prevent editing, but disabled and readonly have different effects on form submission and validation.
pubDate: "2026-11-05T08:30:00Z"
section: dev
tags:
  - html
  - forms
  - accessibility
  - web-development
draft: false
heroImage: https://media.aitamer.news/heroes/disabled-readonly-form-submission-57953840.jpg
heroAlt: Two padlocked paper cards sit beside an open envelope, with one card inside and one outside.
author: mai
wildness:
  rating: 1
  verified: Disabled controls are omitted; applicable read-only controls remain eligible for submission.
  claimed: No additional unverified claims.
verdict: Use disabled to exclude a control from ordinary submission; use readonly for an applicable non-editable value that should remain eligible.
sources:
  - title: "WHATWG HTML Standard: Form control infrastructure"
    url: https://html.spec.whatwg.org/multipage/form-control-infrastructure.html
  - title: "WHATWG HTML Standard: The input element"
    url: https://html.spec.whatwg.org/multipage/input.html
  - title: "WHATWG HTML Standard: Form elements"
    url: https://html.spec.whatwg.org/multipage/form-elements.html
---

A field can look unavailable in a form and still take part in submission. The detail that decides what happens is not its color or styling. It is whether the control is disabled, read-only, or neither.

For a text input, `disabled` makes the control non-interactive and excludes it from the browser's form submission. `readonly` prevents the user from editing the value, but the named control can still contribute that value to the form. The WHATWG HTML Standard describes disabled controls and their behavior in its [form control infrastructure](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html), and lists where `readonly` applies in its [input element section](https://html.spec.whatwg.org/multipage/input.html).

Consider a form that displays an account reference alongside a shipping note:

```html
<form id="order" method="post" action="/orders">
  <label>Account reference
    <input name="account" value="A1042" readonly>
  </label>
  <label>Internal status
    <input name="status" value="pending" disabled>
  </label>
  <label>Shipping note
    <input name="note">
  </label>
  <button type="submit">Place order</button>
</form>
```

On a normal submission, `account` is eligible for the entry list, along with `note`. The disabled `status` control is omitted. To inspect the same distinction without sending the form, run `Array.from(new FormData(document.querySelector('#order')).entries())` in the browser console. This example assumes no script changes the controls or the resulting data.

Omitted is not the same thing as submitted with an empty value. If the shipping note is empty, its name can still appear with an empty string. The disabled status does not appear at all. That distinction matters to a server processing an update: decide whether an absent field means “leave the existing value alone,” “use a default,” or something else, and implement that decision explicitly.

A read-only control also needs a name to contribute an ordinary form entry. Making a field read-only does not give it special permission to bypass the other submission rules. If the displayed reference is only for the person's information and the server can determine the account from the authenticated session, you may not need to submit the reference at all.

There are other differences worth designing for. A read-only text field can still be useful when someone needs to select or copy a value. A disabled control is not focusable in the normal way. Both disabled controls and applicable read-only inputs are barred from constraint validation. Adding `required` to an applicable read-only input does not make the value participate in constraint validation or let the user edit it.

Do not generalize `readonly` to every control. It applies to text-like inputs and some other input types, as well as `textarea`, but not to a `select` or a checkbox. A disabled `fieldset` can also disable descendant controls, with an exception for descendants of its first `legend` child. And because `disabled` is a Boolean attribute, `disabled="false"` still means disabled: remove the attribute to enable the control.

Finally, neither attribute is a security boundary. JavaScript can change control values, and a client can send a request without using your form at all. If the account reference determines what a person may access, resolve or verify it on the server rather than trusting the displayed value. Choose the attribute for the interaction you want, then check the data and authorization where they matter.
