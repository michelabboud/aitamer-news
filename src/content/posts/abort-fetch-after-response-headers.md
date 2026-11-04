---
title: Aborting After Fetch Returns Headers
description: A fulfilled fetch promise does not mean its response body has finished arriving.
pubDate: "2026-11-08T08:30:00Z"
specimen: 1282
section: dev
tags:
  - javascript
  - fetch
  - abortcontroller
  - streams
draft: false
heroImage: https://media.aitamer.news/heroes/abort-fetch-after-response-headers-59a3752f.jpg
heroAlt: A teal paper ribbon runs from a spool into an open envelope in a tray beside a coral stop lever.
author: mai
wildness:
  rating: 1
  verified: Fetch can fulfill before the body arrives; abort can interrupt a subsequent body read.
  claimed: No additional unverified claims.
verdict: Handle failure around both fetch and body consumption, and give each retry a fresh signal.
sources:
  - title: "MDN: Using the Fetch API"
    url: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
  - title: "MDN: AbortController abort()"
    url: https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort
  - title: "MDN: Response text()"
    url: https://developer.mozilla.org/en-US/docs/Web/API/Response/text
  - title: WHATWG Fetch Standard
    url: https://fetch.spec.whatwg.org/
---

A response can have a successful status while its body is still on the way. That timing matters when someone cancels a download: the original fetch promise may already have fulfilled, but the operation reading the body can still fail.

Fetch normally gives JavaScript a response once the status and headers are available, potentially before all body bytes arrive. A fulfilled promise stays fulfilled. Calling an abort controller after that point does not retroactively turn the original promise into a rejection. Instead, aborting can interrupt the remaining body consumption. With the default abort reason, an affected body read rejects with an AbortError.

Imagine a report preview with a Cancel button. The controller belongs to this one attempt, and the body read is inside the same error-handling boundary as the request:

```js
const controller = new AbortController();
const cancelButton = document.querySelector('#cancel');

function cancelReport() {
  controller.abort();
}

async function loadReport() {
  cancelButton.addEventListener('click', cancelReport);
  try {
    const response = await fetch('/report.txt', {
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const report = await response.text();
    document.querySelector('#report').textContent = report;
  } catch (error) {
    if (error?.name === 'AbortError') {
      console.log('Report request canceled');
    } else {
      console.error('Report could not be loaded', error);
    }
  } finally {
    cancelButton.removeEventListener('click', cancelReport);
  }
}

loadReport();
```

If Cancel is clicked while the text is still being read, the body promise can reject. The display assignment happens only after the full text read succeeds. If the request is aborted before the response arrives, the initial fetch can reject instead. The same catch covers both points, but they are not the same promise.

That distinction changes what you can tell the user. Headers may say the report request succeeded, but they do not establish that the whole report was received. If the body read fails, keep the preview in a canceled or incomplete state rather than labeling it ready. The example waits for the complete text before showing it; a progressive preview would need its own policy for marking or removing any partial content already displayed.

Timing is a real boundary, not just an illustration. If the body read completes before the click is handled, the completed result is not undone. If your interface must prevent an old result from replacing a newer one, also track which request is current before updating the display. Aborting is useful, but UI ownership still needs an explicit rule.

The example creates one controller for one attempt. An aborted signal remains aborted, so a retry needs a fresh controller and signal. It also uses the default abort reason; code that supplies a custom reason should not assume every cancellation is identified by the same error name.

Finally, an abort is not proof that the server did no work. For a request that changes data, the server may already have received or processed it. Design retries around the operation's own guarantees, and distinguish a canceled display from a confirmed rollback.
