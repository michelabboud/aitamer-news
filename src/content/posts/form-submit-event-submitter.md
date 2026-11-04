---
title: Which Button Submitted the Form?
description: SubmitEvent.submitter identifies the initiating control when there is one.
pubDate: "2026-11-13T08:30:00Z"
specimen: 1302
section: dev
tags:
  - html
  - forms
  - javascript
  - events
draft: false
heroImage: https://media.aitamer.news/heroes/form-submit-event-submitter-aa9e2100.jpg
heroAlt: A pointer touches a coral button while it and a teal button connect to the same cream form tray.
author: mai
wildness:
  rating: 1
  verified: The submit event targets the form; submitter identifies an initiating element or can be null.
  claimed: No additional unverified claims.
verdict: Read the submitter for the requested action, handle its absence, and authorize the action on the server.
sources:
  - title: "MDN: SubmitEvent submitter"
    url: https://developer.mozilla.org/en-US/docs/Web/API/SubmitEvent/submitter
  - title: "MDN: Form submit event"
    url: https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/submit_event
  - title: "MDN: FormData constructor"
    url: https://developer.mozilla.org/en-US/docs/Web/API/FormData/FormData
  - title: "WHATWG HTML Standard: The form element"
    url: https://html.spec.whatwg.org/multipage/forms.html
---

A single form can offer several submit actions. An editor might let someone save a draft or publish it. A form-level submit handler receives either action, but how does it know which one was requested?

The submit event targets the form, not the button. That makes sense when you consider that the event describes a form submission rather than an ordinary button click. In a submit handler, `event.target` identifies the form. The separate `event.submitter` property identifies the control that initiated the submission when one is available.

This example uses two named submit buttons. The handler prevents the normal navigation so it can show which action was requested:

```html
<form id="editor" action="/articles" method="post">
  <label for="title">Title</label>
  <input id="title" name="title" required>
  <button type="submit" name="intent" value="draft">Save draft</button>
  <button type="submit" name="intent" value="publish">Publish</button>
</form>
<p id="status" role="status"></p>

<script>
  const form = document.querySelector('#editor');
  const status = document.querySelector('#status');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const button = event.submitter;
    const intent = button?.name === 'intent' ? button.value : null;

    if (intent === 'draft' || intent === 'publish') {
      status.textContent = `Requested action: ${intent}`;
    } else {
      status.textContent = 'No recognized action was selected.';
    }
  });
</script>
```

The example reports an intent; it does not save or publish anything. In an application that sends the form itself, decide explicitly how the selected action travels with the rest of the data. When constructing FormData from a form, you can pass the submitter as the second argument so its eligible name and value are included. A submitter must be a submit button owned by that form; handle an absent submitter separately.

This matters because the two buttons share a name but have different values. A normal submission can include the value of the button that submitted it, rather than treating both buttons as selected. If JavaScript prevents that submission and builds a new request, it must preserve the action deliberately. Otherwise the server could receive the title without enough information to distinguish a draft from a publication request.

Do not assume the property always identifies a button. It can be null when a submission has no initiating button, including a submission requested without a specific submitter. A constructed event can also omit a submitter. The example handles that case without guessing that the person meant to publish.

Keyboard submission deserves testing too. Depending on the form and browser interaction, pressing Enter can activate the form's default submit button. That means the first action in the markup can matter. Choose a safe default and test the keyboard path, not just mouse clicks.

Validation is another boundary. In the example, an empty required title normally stops interactive submission before the submit event reaches the handler. The status message therefore does not replace the browser's validation feedback. If saving incomplete drafts is a requirement, design that action and its validation rules explicitly rather than assuming the handler will always run.

Finally, the button value is client-controlled. If the request reaches a server, validate the requested action and check that the authenticated person is allowed to perform it. The submitter helps the interface describe intent; it is not authorization.
