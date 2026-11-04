---
title: A Progress Bar Without a Percentage
description: Use indeterminate progress when work is underway but its extent cannot be measured.
pubDate: "2026-11-16T12:30:00Z"
section: dev
tags:
  - html
  - accessibility
  - progress
  - javascript
draft: false
heroImage: https://media.aitamer.news/heroes/progress-without-percentage-99537623.jpg
heroAlt: A small teal paper shuttle rests on an unmarked cream track beside a yellow gear.
author: mai
wildness:
  rating: 1
  verified: A progress element without a value is indeterminate; its maximum must be greater than zero.
  claimed: No additional unverified claims.
verdict: Show indeterminate progress until a meaningful total is known, then report measured work with an accessible label.
sources:
  - title: "MDN: The progress element"
    url: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/progress
  - title: "WHATWG HTML Standard: Form elements"
    url: https://html.spec.whatwg.org/multipage/form-elements.html
---

A progress indicator can honestly say that work is happening without pretending to know how much remains. In HTML, a progress element without a value is indeterminate. It represents ongoing work without a measurable completion position.

That is different from setting the value to zero. Zero is a measured starting position: it says none of the stated work is complete. An omitted value says the position is unknown. Setting a maximum alone does not turn the indicator into a measured one.

Suppose a document import first discovers the number of records, then processes them. During discovery, show activity without inventing a percentage. Once the application has a trustworthy positive total and a completed count in the same units, update the indicator:

```html
<label for="import-progress">Importing records</label>
<progress id="import-progress">Import in progress</progress>
<p id="import-status">Discovering records...</p>

<script>
  const progress = document.querySelector('#import-progress');
  const status = document.querySelector('#import-status');

  function updateProgress(completed, total) {
    if (!Number.isInteger(total) || total <= 0 ||
        !Number.isInteger(completed) || completed < 0 ||
        completed > total) {
      progress.removeAttribute('value');
      status.textContent = 'Working; total not available.';
      return;
    }
    progress.max = total;
    progress.value = completed;
    status.textContent = `${completed} of ${total} records processed.`;
  }
</script>
```

The function is a display update, not an import implementation. The application must call it with real counts from its own work. For example, if four of ten known records have been processed, the value is four and the maximum is ten. The browser can represent that fraction without the application guessing a completion rate from elapsed time.

A count can be precise about one phase without predicting how long the whole task will take. Records may require different amounts of processing, and a later step may still be necessary. The text alongside the indicator should name what is being counted so that someone reading it can distinguish records processed from an estimate of time remaining.

The label gives the indicator an accessible name. Text between the progress tags is fallback content, not an accessible label, so it does not replace the separate label. Keep the nearby status meaningful too: an animated bar alone does not explain which task is running or whether it has failed.

The maximum must be positive, and the measured value should be between zero and that maximum. The element's minimum is always zero; it does not take a minimum attribute. If the total becomes unknown again, remove the value attribute to return to an indeterminate state. For an operation with zero records, handle the completed empty result explicitly instead of setting the maximum to zero.

The example treats an invalid count as unknown for display purposes. A production importer should also distinguish missing information from an error in its own counting logic. Otherwise, a broken update could leave someone watching an indefinite indicator when the operation has actually failed. Give failure and completion their own clear states.

Finally, a fraction is only as meaningful as its denominator. Ten processed records out of ten discovered records does not necessarily mean the entire import has finished if a separate saving phase remains. Label phases accurately, report errors and completion separately, and test how updates are presented with assistive technology.
