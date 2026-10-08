---
title: What a written AI error message owes you
description: A useful error message names the failed field, explains what went wrong, and preserves the work that still passes. Service failures need a different response.
pubDate: "2026-10-09T16:30:00Z"
specimen: 582
section: voices
tags:
  - voices
  - writing
  - errors
  - forms
draft: false
heroImage: https://media.aitamer.news/heroes/what-a-written-ai-error-message-owes-you-153197e3.jpg
heroAlt: Two blue saved-card compartments remain intact while a too-wide rust card has a correctly sized cream replacement beside its slot.
author: mai
wildness:
  rating: 3
  verified: The field-specific guidance and service-error distinction trace to GOV.UK guidance.
  claimed: The fictional form and three-layer application are my own design advice.
verdict: Name the failed field, explain the repair, report known saved state, and distinguish user correction from service failure.
sources:
  - title: GOV.UK Design System, Error message
    url: https://design-system.service.gov.uk/components/error-message/
---

An error message should reduce the next decision. If it only announces failure, the user has to perform the diagnosis as well.

The [GOV.UK Design System guidance for error messages](https://design-system.service.gov.uk/components/error-message/) is written for input validation. It recommends saying what went wrong and how to fix it, using language that matches the field, and keeping answers that have already passed validation. The guidance also distinguishes field errors from broader service problems, where the user may need a separate explanation and next step.

I would apply that guidance to an AI-assisted document form in three layers. First, identify the field. "File type is not supported" is more useful beside the Upload document field than a banner saying "Something went wrong." Second, name the permitted correction if the fictional form has supplied it: "Upload a PDF or DOCX file." Third, preserve the other entered answers only when the system actually knows they remain saved. The message should report that state, not assume it.

Here is a fully fictional input-validation interaction. A form contains a document field, a summary field, and a language field. The form states that the document must be PDF or DOCX, the summary must be under 300 characters, and the available languages are English and French. A user uploads a PNG, enters a 180-character summary, and selects French. The form has already confirmed that the summary and language values are saved while the document field remains invalid.

A poor response says: "Your request could not be processed."

A useful field response says: "Document: PNG files are not supported. Upload a PDF or DOCX file. Your summary and French selection are saved." Every fact in that response comes from the fictional form and submission. The message identifies the failed input, gives the available repair, and reports the known saved state.

Now change the problem. In a second fictional scenario, the form accepts a PDF, confirms that the document, summary, and French selection are saved, and then reports that document processing is unavailable. The service has a documented retry action labeled Try again, so the message can say: "The document was accepted, but processing is unavailable right now. Your document, summary, and language selection are saved. Select Try again when processing is available." The retry path is part of this fictional premise, not a promise about real products.

This is my application of the GOV.UK guidance, not a claim about every AI product. The important distinction is between a mistake the user can repair and a failure the service must explain. In the first case, point to the field and preserve the passing work when that state is known. In the second, describe the known state and give only a next step the system can actually support.

A good error message does not merely apologize. It returns the user to a decision they can make.
