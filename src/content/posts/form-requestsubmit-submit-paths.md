---
title: Two Ways to Submit a Form, Two Different Paths
description: Request a normal submission when validation and submit handlers matter.
pubDate: "2026-11-12T12:30:00Z"
section: dev
tags:
  - html
  - forms
  - javascript
  - validation
draft: false
heroImage: https://media.aitamer.news/heroes/form-requestsubmit-submit-paths-1bb94ec9.jpg
heroAlt: Two paper documents follow paths to one tray, with only the upper path passing through a coral frame and a bell.
author: mai
wildness:
  rating: 1
  verified: Direct submit skips validation and the submit event; requestSubmit uses the submission process.
  claimed: No additional unverified claims.
verdict: Use requestSubmit for a normal submission path; reserve direct submit for an intentional bypass.
sources:
  - title: "WHATWG HTML Standard: The form element"
    url: https://html.spec.whatwg.org/multipage/forms.html
  - title: "WHATWG HTML Standard: Form control infrastructure"
    url: https://html.spec.whatwg.org/multipage/form-control-infrastructure.html
  - title: "MDN: HTMLFormElement requestSubmit()"
    url: https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/requestSubmit
  - title: "MDN: HTMLFormElement submit()"
    url: https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/submit
  - title: "MDN: Form submit event"
    url: https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/submit_event
---

You have a form and want JavaScript to submit it. Two methods appear to fit the job, but they take different paths through the browser's form machinery. Choosing the wrong one can skip both validation and code that was supposed to run before submission.

Calling `form.requestSubmit()` requests a submission through the normal submission process. Ordinarily, the browser performs interactive constraint validation first. If a required field is empty, submission is stopped and the submit event is not fired. If validation passes, the form receives a submit event, which a handler can cancel.

Calling `form.submit()` directly bypasses interactive constraint validation and does not fire a submit event. That is not just a difference in presentation. A form-level handler that prevents navigation or prepares application data will not run on that path.

Imagine a page with an external control that submits a feedback form:

```html
<form id="feedback" action="/feedback" method="post">
  <label for="message">Message</label>
  <input id="message" name="message" required>
  <button id="send" type="submit" name="action" value="send">
    Send feedback
  </button>
</form>
<button id="shortcut" type="button">Send from shortcut</button>

<script>
  const form = document.querySelector('#feedback');
  const send = document.querySelector('#send');

  document.querySelector('#shortcut').addEventListener('click', () => {
    form.requestSubmit(send);
  });

  form.addEventListener('submit', (event) => {
    console.log('Submission requested');
  });
</script>
```

With the message empty, the shortcut requests submission but the required field blocks it. With a value present, the submit event can run and, unless canceled, submission can proceed. The supplied button is the submitter: its name and value can be included, and its submission override attributes can affect the request.

That button matters if a form has more than one action. A preview button and a send button might specify different destinations or contribute different values. Passing the intended button makes the shortcut request the corresponding action. Without an argument, the form itself acts as the submitter, so do not assume a particular button's value or overrides will be used.

The method does not manufacture a click event on the button. If the application has important work only in that button's click handler, move the submission-related work to the form's submit handler instead. The button must also be a submit button owned by this form. An inappropriate element produces a TypeError; a submit button belonging to another form produces a NotFoundError.

There is a second trap in older markup. A control whose name or ID is `submit` can mask the form's submit method, so attempting to call it can produce a not-a-function error. Prefer a different control name. Named controls can shadow other form properties too, so avoid names that collide with the APIs your code uses.

Finally, the normal path is not an unconditional validation guarantee. A form's novalidate attribute or the chosen button's formnovalidate attribute can bypass interactive validation. Server-side validation and authorization remain necessary regardless of which client-side path initiated the request.
