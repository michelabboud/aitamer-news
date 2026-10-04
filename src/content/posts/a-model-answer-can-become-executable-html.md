---
title: A Model Answer Can Become Executable HTML
description: Generated Markdown can cross a security boundary when an app turns it into HTML. Here is how to render the answer while keeping text, links, and formatting under control.
pubDate: "2026-10-04T14:00:00Z"
specimen: 225
section: dev
tags:
  - security
  - markdown
  - xss
  - web-development
draft: false
heroImage: https://media.aitamer.news/heroes/a-model-answer-can-become-executable-html-00a2b9ae.jpg
heroAlt: Paper answer lines pass through a keyhole in a wall toward a browser page.
author: ari
wildness:
  rating: 2
  verified: OWASP, Marked, and DOMPurify document the relevant rendering and sanitization rules.
  claimed: The article applies those rules to generated Markdown in an app.
verdict: Treat generated Markdown as untrusted. Render plain text as text, and sanitize parsed HTML for the page where it will appear.
sources:
  - title: OWASP Cross Site Scripting Prevention Cheat Sheet
    url: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
  - title: Marked documentation
    url: https://github.com/markedjs/marked
  - title: DOMPurify documentation
    url: https://github.com/cure53/DOMPurify
---

A generated answer often arrives as text. An app may then turn its Markdown into HTML so readers can see headings, links, lists, and code blocks. The security decision happens at that conversion and at the point where the result enters the page. If untrusted content reaches a place that interprets it as markup, it can become cross-site scripting (XSS). [OWASP’s XSS guidance](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html) treats output encoding, HTML sanitization, and the destination in the page as separate parts of the defense.

## Markdown becomes HTML at the renderer

The path is easy to overlook: answer text enters a Markdown parser, the parser produces HTML, and the app inserts that HTML into a page. The answer may contain Markdown syntax, raw HTML, or a link whose destination needs scrutiny. A parser’s job is to produce markup. It does not follow that its output is safe to insert.

[Marked’s own documentation](https://github.com/markedjs/marked) explicitly warns that Marked does not sanitize its output HTML and shows sanitizing the result of `marked.parse()`. That warning is useful beyond one library. Treat every generated answer as untrusted input, including answers that look routine. Review the actual parser and options your app uses, then make the HTML safety step explicit in the rendering path.

## Encoding depends on where text goes

When a value should appear only as text, keep it as text. In browser code, `textContent` places a string in an element without asking the browser to interpret it as HTML. In a server template, use the template system’s escaping for ordinary text. OWASP recommends output encoding when the goal is to display data as entered, and identifies `textContent` as a safe destination for text. [Its context rules](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html) explain why the encoding must match where the value lands.

A title between HTML tags, a quoted attribute, and a URL parameter are different destinations. HTML text encoding does not validate a link destination. URL encoding of a query value does not make a whole URL safe. OWASP calls for URL validation and a safe scheme when an untrusted URL becomes an `href` or `src` value. Keep element and attribute names fixed, and use the appropriate encoding for each value.

Encoding the completed HTML as text would show tags to the reader instead of rendering the intended formatting. That is why an app that displays formatted Markdown needs a separate step for the HTML the parser produces. [OWASP recommends HTML sanitization](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html) when markup must remain functional.

## Sanitize the HTML that will be displayed

A sanitizer examines markup and removes dangerous elements or attributes while retaining permitted formatting. OWASP recommends DOMPurify for this job. Its documented pattern is to pass untrusted HTML to `DOMPurify.sanitize()` and use the cleaned result. [DOMPurify’s documentation](https://github.com/cure53/DOMPurify) also offers an HTML-only profile when SVG and MathML are unnecessary.

For a Markdown view, the practical order is: parse the answer, sanitize the resulting HTML, then insert that result into the intended HTML container. Apply the same rule to streamed answers, saved conversations, previews, and any other view that renders the text. If a view needs plain text, use a text destination instead. This follows [Marked’s parse-then-sanitize example](https://github.com/markedjs/marked) and [OWASP’s distinction between text and HTML destinations](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html).

Keep the allowed markup as narrow as the interface needs. A chat answer may need paragraphs, lists, code, emphasis, and links. It may have no use for embedded forms or other complex HTML. DOMPurify provides configuration for permitted tags and attributes, but those choices should match the content the product actually displays. Its HTML-only profile is one documented way to narrow the accepted markup. [DOMPurify documents both the profile and its configuration options](https://github.com/cure53/DOMPurify).

## Later changes can undo the safety step

Sanitization protects the markup it checks for the destination it was prepared for. Changing the cleaned HTML afterward can undo that protection. A syntax highlighter, link decorator, or custom component that rewrites the string creates another place to examine. Put such transformations before the final sanitization step, or establish that they preserve its guarantees. Both [OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html) and [DOMPurify](https://github.com/cure53/DOMPurify) warn about modifying sanitized output.

Framework escaping also deserves a clear boundary. A framework may safely escape ordinary text while offering a way to insert HTML directly. OWASP names React’s `dangerouslySetInnerHTML` as an example that requires sanitized HTML. A content security policy can add protection, but OWASP describes it as an additional control rather than the primary XSS defense. [The underlying encoding and sanitization still belong in the render path](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html).

## What to do

1. Find every place an answer appears: live output, history, previews, copied excerpts, and shared views. Record whether each place expects plain text or formatted HTML.
2. Use text destinations such as `textContent` when formatting is unnecessary. Use your framework’s ordinary escaped text rendering for text values. [OWASP lists these safer destinations](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html).
3. Where Markdown formatting is required, parse it and sanitize the resulting HTML with a maintained sanitizer before insertion. Configure the allowed markup for that view. [Marked](https://github.com/markedjs/marked) shows this order, and [DOMPurify](https://github.com/cure53/DOMPurify) documents the sanitizer and its HTML-only profile.
4. Check links as URLs, including their schemes, rather than treating attribute encoding as URL validation. Keep attributes and element names under application control. [OWASP separates those requirements](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html).
5. Review every transformation after sanitization and every direct HTML insertion point. Add render tests with unwanted tags, event-handler attributes, and unsafe link destinations. Keep the sanitizer updated as OWASP advises. [The final displayed markup is the boundary that matters](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html).
