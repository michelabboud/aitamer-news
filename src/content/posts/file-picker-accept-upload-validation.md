---
title: A File Picker Hint Is Not Upload Validation
description: Guide people toward expected files with accept, then validate uploads on the server.
pubDate: "2026-11-10T12:30:00Z"
section: dev
tags:
  - html
  - forms
  - uploads
  - security
  - validation
draft: false
heroImage: https://media.aitamer.news/heroes/file-picker-accept-upload-validation-4c3fe220.jpg
heroAlt: A blank coral document moves from an open cream folder toward a blue inspection gate topped with a magnifier.
author: mai
wildness:
  rating: 1
  verified: Accept guides the picker; server-side validation must not trust the supplied file type alone.
  claimed: No additional unverified claims.
verdict: Use accept for usability and layered server-side controls for upload handling.
sources:
  - title: "WHATWG HTML Standard: The input element"
    url: https://html.spec.whatwg.org/multipage/input.html
  - title: "MDN: Accept attribute"
    url: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/accept
  - title: "MDN: File input"
    url: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/file
  - title: "OWASP: File Upload Cheat Sheet"
    url: https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html
---

A file picker can help someone find the right kind of upload. It cannot promise that the server will receive a safe or even correctly formatted file. The accept attribute is a hint to the browser, not a security boundary.

Suppose a profile page accepts PNG or JPEG images up to five megabytes. The form can make that expectation visible and give the picker matching hints:

```html
<form action="/avatar" method="post" enctype="multipart/form-data">
  <label for="avatar">Profile image</label>
  <p id="avatar-help">Choose a PNG or JPEG, up to 5 MB.</p>
  <input id="avatar" name="avatar" type="file"
         accept="image/png,image/jpeg,.png,.jpg,.jpeg"
         aria-describedby="avatar-help" required>
  <button type="submit">Upload</button>
</form>
```

The comma-separated list contains MIME types and filename extensions. A picker may use these to filter or highlight files, but the interface varies. Some pickers let a person override the filter. A client can also send an HTTP request without using the form at all. The server must therefore make its own decision about the bytes it receives.

For this example, the server can authorize the user, enforce a five-million-byte upload limit, and allow only the intended image formats. Treat the submitted filename and content type as untrusted: a file named like a JPEG, or labeled with a JPEG content type, is not proof that its contents are a valid JPEG. Signature checks can help identify a format, but should not be the only check.

A practical next step is to decode the upload with an up-to-date image library configured for the allowed formats, reject decoding failures, and enforce dimensions and resource limits. If the application needs a normalized avatar, it can re-encode the decoded image and remove unnecessary metadata. Process untrusted files with appropriate isolation: the decoder itself is handling attacker-controlled input.

Store files outside the webroot or on a separate host, using a server-generated name rather than the supplied filename. Control who can upload and retrieve them. If a file is too large or cannot be decoded as an allowed format, reject it and tell the user what to change. Client-side size checks can give quicker feedback, but the server limit remains necessary.

No one check makes an upload harmless. Re-encoding and malware scanning can reduce particular risks, but neither proves the file is free of every threat. Choose defenses for the formats and retrieval paths your application actually supports, and keep the upload policy narrow. The picker is there to help the person; validation and safe handling are the application's responsibility.
