---
title: Uploaded Is Not Archived
description: Gemini file uploads expire after 48 hours. Products that promise later access need their own source and request records.
pubDate: "2026-10-08T02:00:00Z"
specimen: 387
section: tools
tags:
  - gemini
  - files-api
  - file-storage
  - data-retention
draft: false
heroImage: https://media.aitamer.news/heroes/uploaded-is-not-archived-b560aae7.jpg
heroAlt: An upload screen, hourglass, and separate archive box show the steps after a file upload.
author: ari
wildness:
  rating: 2
  verified: Google documents 48-hour deletion and says user uploads cannot be downloaded.
  claimed: Keep originals and request records when later review is part of the product.
verdict: A Gemini upload supports a current task. Later review requires a source copy and records governed by the product’s own retention policy.
sources:
  - title: Files API | Gemini API | Google AI for Developers
    url: https://ai.google.dev/gemini-api/docs/files
---

Google’s [Files API guide](https://ai.google.dev/gemini-api/docs/files) says uploaded files are stored for 48 hours and then automatically deleted. During that window, an app can retrieve file metadata. It cannot download a user-uploaded file from the API. A saved Gemini file name or URI is therefore a temporary processing reference. It cannot be the sole record of a customer’s document.

## Preserve the source

Imagine a customer uploads a contract, asks for a summary, and returns later to check a clause. If the product has kept only the Gemini reference, the original will be gone when Google deletes the upload. The product then needs a retained copy of the source, or it must ask the customer to upload it again. The choice should follow the product’s retention promise and the customer’s consent.

Keep the original bytes in storage the product controls when later review is part of the service. Give that copy its own stable identifier. Record enough context to identify it: the customer’s file name, media type, upload time, and a checksum. Set access and deletion rules for that copy. Your product owns these storage and access choices.

## Preserve the work

The guide’s example sends a file URI and media type to Gemini. It also shows how to fetch metadata with `files.get` and list uploads with `files.list`. [Those operations](https://ai.google.dev/gemini-api/docs/files) help inspect a current upload. Your product still needs a record of what it did with the file.

For each request, retain the input reference, the instructions sent with it, and the result shown to the customer, subject to the same retention rules. Link these records to the product’s stable source identifier. If the customer disputes a summary, the product can then show which source and request produced it. If a later run is needed, it can create a fresh Gemini upload from the retained source.

## What to do

1. Decide whether the product promises later access to the original. If it does, store the original under an explicit retention policy.
2. Save the product’s source identifier and the Gemini upload metadata separately. Treat the Gemini URI as expiring.
3. Save the request and displayed result with a link to the source record.
4. Test a return visit after the upload has expired. Show the retained source and result, or clearly ask for a new upload.
