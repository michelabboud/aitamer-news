---
title: Where Should a Modal Dialog Put Focus?
description: Choose a useful starting point and make the return journey work for keyboard users.
pubDate: "2026-11-15T12:30:00Z"
section: dev
tags:
  - html
  - accessibility
  - dialog
  - keyboard
  - javascript
draft: false
heroImage: https://media.aitamer.news/heroes/modal-dialog-keyboard-focus-8c48cb28.jpg
heroAlt: A coral ring highlights a blank field on a cream dialog while a teal arrow loops back to its yellow opening button.
author: mai
wildness:
  rating: 1
  verified: showModal makes the document outside the dialog inert and uses dialog focusing steps.
  claimed: No additional unverified claims.
verdict: Choose initial focus for the task, provide a clear way out, and test the return path.
sources:
  - title: "WHATWG HTML Standard: The dialog element"
    url: https://html.spec.whatwg.org/multipage/interactive-elements.html
  - title: "W3C: Modal dialog pattern"
    url: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
  - title: "MDN: The dialog element"
    url: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog
  - title: "MDN: showModal()"
    url: https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal
---

Opening a dialog changes the user's immediate task. A keyboard user needs to know where they have landed, what they can do there, and where they will return after closing it. Initial focus is part of that journey, not a decorative detail.

A native dialog can be modal or non-modal. Calling `showModal()` opens it as a modal, places it in the top layer, and makes the rest of its document inert. Calling `show()` opens it non-modally, leaving the rest of the page available for interaction. A modal inside an iframe blocks its own document, not the surrounding page.

Consider a confirmation before discarding an unsaved draft. The safer action is a useful initial focus choice because discarding is difficult to undo:

```html
<button type="button" id="open-confirm">Discard draft</button>

<dialog id="confirm" aria-labelledby="confirm-title">
  <h2 id="confirm-title">Discard this draft?</h2>
  <p>Your unsaved changes will be lost.</p>
  <form method="dialog">
    <button value="cancel" autofocus>Keep editing</button>
    <button value="discard">Discard draft</button>
  </form>
</dialog>

<script>
  const dialog = document.querySelector('#confirm');
  document.querySelector('#open-confirm').addEventListener('click', () => {
    dialog.showModal();
  });
  dialog.addEventListener('close', () => {
    if (dialog.returnValue === 'discard') {
      // The application would handle the discard here.
    }
    dialog.returnValue = '';
  });
</script>
```

In a supported browser, a keyboard user can focus the opening button and activate it. The dialog opens with focus on Keep editing. Tab moves through its controls; activating either button closes the dialog. Escape normally closes this modal too. The browser's dialog closing steps attempt to restore the previously focused element, which in this flow is normally the opening button.

The example only reports the chosen outcome to its close handler. An application must implement the actual discard separately. Keeping the destructive operation out of the opening action gives the person an opportunity to review the consequence. The visible heading and warning provide context for that decision, while the two buttons give it a clear outcome.

That return is a workflow to test, not a reason to ignore changes to the page. If the opening control is removed after an action, arrange a logical alternative focus target. If a completed action creates a new item, focusing that item may make more sense than returning to the old button. Avoid moving focus again unnecessarily when the native return already serves the user.

Autofocus should be intentional. A short confirmation may start on its least destructive action; a longer dialog may need focus near its beginning so that important context is not skipped. For lengthy content, consider focusing a suitable element near the start rather than placing focus immediately on a button at the bottom. Give the dialog an accessible name, keep an explicit close or cancel control, and do not put a tabindex on the dialog element itself.

Test opening, Tab and Shift+Tab, Escape, closing, and focus return with the browsers and assistive technologies you support. Do not manually remove the open attribute to close a modal: use a dialog closing mechanism so its modal state is cleaned up.
