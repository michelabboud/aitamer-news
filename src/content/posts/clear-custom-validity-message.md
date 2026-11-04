---
title: Clear That Custom Validity Message
description: A custom error stays in place until your code clears it, even after the value changes.
pubDate: "2026-11-13T12:30:00Z"
specimen: 1304
section: dev
tags:
  - html
  - forms
  - javascript
  - validation
  - accessibility
draft: false
heroImage: https://media.aitamer.news/heroes/clear-custom-validity-message-df61132f.jpg
heroAlt: A paper hand lifts a coral tag away from a cream form card with a teal field.
author: mai
wildness:
  rating: 1
  verified: A nonempty custom validity message persists until replaced or cleared with an empty string.
  claimed: No additional unverified claims.
verdict: Update custom validity when values change, clear resolved errors, and keep server checks independent.
sources:
  - title: "MDN: HTMLInputElement setCustomValidity()"
    url: https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/setCustomValidity
  - title: "MDN: HTMLFormElement reportValidity()"
    url: https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/reportValidity
  - title: "MDN: HTMLFormElement checkValidity()"
    url: https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/checkValidity
  - title: "MDN: Element input event"
    url: https://developer.mozilla.org/en-US/docs/Web/API/Element/input_event
  - title: "WHATWG HTML Standard: The form element"
    url: https://html.spec.whatwg.org/multipage/forms.html
---

A person fixes a form field, tries again, and receives the same error. The value now meets the rule, but the browser still considers the control invalid. One possible cause is a custom validity message that the application set and never cleared.

Calling `setCustomValidity()` with a nonempty message gives the control a custom error. The message does not disappear automatically just because the value changes. To remove that custom error, call the method again with an empty string. Clearing it removes the custom error, not every other constraint on the field.

Suppose a workshop registration accepts even numbers of seats because seats are arranged in pairs. The number input has native minimum and maximum constraints; the script adds the pairing rule:

```html
<form id="booking" action="/booking" method="post">
  <label for="seats">Seats, in pairs</label>
  <input id="seats" name="seats" type="number"
         min="2" max="10" step="1" required>
  <button type="submit">Book</button>
  <button id="check" type="button">Check entry</button>
</form>

<script>
  const form = document.querySelector('#booking');
  const seats = document.querySelector('#seats');

  function updateSeatValidity() {
    const number = seats.valueAsNumber;
    const oddInteger = Number.isInteger(number) && number % 2 !== 0;
    seats.setCustomValidity(oddInteger ? 'Choose seats in pairs.' : '');
  }

  seats.addEventListener('input', updateSeatValidity);
  document.querySelector('#check').addEventListener('click', () => {
    updateSeatValidity();
    form.reportValidity();
  });
  updateSeatValidity();
</script>
```

If someone enters three, the handler sets the custom message. When they change it to four, the handler clears that message. If the value is empty or outside the allowed range, the browser's other constraints can still make it invalid. The label explains the pairing requirement before an error occurs.

For example, clearing the pairing message after an empty edit does not satisfy the required constraint. Likewise, an even number above the maximum still fails the range rule. Keeping the custom rule focused on odd integers lets the browser's native constraints handle those separate cases instead of displaying an inaccurate pairing message for every invalid value.

The separate check button calls the form's `reportValidity()` method. It checks the associated controls and returns a boolean; for invalid events that are not canceled, the browser reports the problem to the user. It does not submit the form. Normal interactive submission can also report a validation problem and stop before the submit event.

For a programmatic answer without the browser's reporting step, use `checkValidity()`. It also returns a boolean and fires invalid events on invalid controls, so it is not entirely free of event side effects. Neither method clears a custom message for you.

The input handler covers user edits, but assigning a value from JavaScript does not itself fire an input event. If another part of the application changes the field programmatically, call the update function as part of that change. Consider form resets and restored values in the same way, and test the complete flow.

This timing matters when an application fills a previously invalid field on the person's behalf. If it changes three seats to four without updating custom validity, the old message can still prevent submission. Recalculate the rule when the value is changed, not only when the person presses the check button.

Finally, client-side validation improves feedback but does not establish a trustworthy booking. The server must independently check the submitted number and current availability.
