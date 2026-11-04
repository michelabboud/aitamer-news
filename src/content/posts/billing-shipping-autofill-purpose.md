---
title: Give Billing and Shipping Fields Their Own Autofill Purpose
description: Autocomplete tokens distinguish address purposes and group repeated fields.
pubDate: "2026-11-12T08:30:00Z"
specimen: 1298
section: dev
tags:
  - html
  - forms
  - autofill
  - accessibility
  - addresses
draft: false
heroImage: https://media.aitamer.news/heroes/billing-shipping-autofill-purpose-1a3052da.jpg
heroAlt: A teal sorter routes colored cards toward a parcel pocket and another pocket beside a folded slip and a coin.
author: mai
wildness:
  rating: 1
  verified: Autocomplete supports shipping and billing purposes and named sections for repeated groups.
  claimed: No additional unverified claims.
verdict: Use distinct address purposes, add named sections for repeated groups, and let people review the results.
sources:
  - title: "WHATWG HTML Standard: Autofilling form controls"
    url: https://html.spec.whatwg.org/multipage/form-control-infrastructure.html
  - title: "MDN: Autocomplete attribute"
    url: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete
---

A checkout form can ask for two postal codes that mean different things. One belongs to the delivery destination; the other belongs to the billing address. Giving both fields the same generic autofill purpose leaves out information the browser could use to distinguish them.

HTML autocomplete tokens can describe both the address purpose and the part of the address a field contains. The shipping and billing tokens identify the purpose. A detail token, such as postal-code or address-level2, identifies the expected value. Put the purpose before the detail token.

Here is a compact two-address example. It uses a multiline street address and separates the locality, postal code, and country name:

```html
<form action="/checkout" method="post">
  <fieldset>
    <legend>Shipping address</legend>
    <label>Street address
      <textarea name="ship_street"
                autocomplete="shipping street-address"></textarea>
    </label>
    <label>City or locality
      <input name="ship_city" autocomplete="shipping address-level2">
    </label>
    <label>Postal code
      <input name="ship_postal" autocomplete="shipping postal-code">
    </label>
    <label>Country
      <input name="ship_country" autocomplete="shipping country-name">
    </label>
  </fieldset>
  <fieldset>
    <legend>Billing address</legend>
    <label>Street address
      <textarea name="bill_street"
                autocomplete="billing street-address"></textarea>
    </label>
    <label>City or locality
      <input name="bill_city" autocomplete="billing address-level2">
    </label>
    <label>Postal code
      <input name="bill_postal" autocomplete="billing postal-code">
    </label>
    <label>Country
      <input name="bill_country" autocomplete="billing country-name">
    </label>
  </fieldset>
  <button type="submit">Continue</button>
</form>
```

The two postal fields now have distinct token lists, even though both request a postal code. The fieldsets and legends also give people a visible explanation of which address they are entering. Names distinguish the submitted form entries; autocomplete tokens describe their intended purposes to autofill tools.

The distinction becomes useful when someone sends a gift to another household but pays with their own billing address. A saved shipping address is not necessarily the right billing address, and the reverse is not necessarily true either. The labels give the person a chance to notice a mismatch before continuing. On the server, keep the two submitted values associated with their respective purposes rather than choosing one merely because both contain postal data.

What if one order has two separate shipping destinations? The shipping purpose alone no longer distinguishes the two groups. Add a named section token as the first token in each list, for example `section-gift1 shipping postal-code` and `section-gift2 shipping postal-code`. Use the same section name across the fields for one destination, and a different name for the other. The order matters: section, purpose, then detail.

Think of a section as the identity of one address group, not as a replacement for the detail tokens. Within the first gift's group, the street, locality and postal code still need their respective purposes. If every field in both groups uses the same section name, the markup no longer expresses that they are separate destinations. Clear labels remain important even when the token lists are correct.

These tokens are hints, not a promise that a browser has saved addresses or will fill each field. Let people review and edit the result, and support manual entry. A same-as-shipping option can also be useful, provided the application handles the resulting values deliberately.

The sample is not a universal address model. Countries use different address components and ordering, and some addresses need additional administrative levels or no postal code. Adapt labels, required fields, and layout to the destinations you support. Validate and process the submitted addresses on the server rather than treating autofill as verification that an address exists or is deliverable.
