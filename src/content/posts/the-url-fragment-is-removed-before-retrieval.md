---
title: The URL Fragment Is Removed Before Retrieval
description: "The part after # points into a retrieved resource. It is removed before an HTTP request, so changing it alone cannot select a different server response."
pubDate: "2026-10-06T15:30:00Z"
specimen: 319
section: general
tags:
  - urls
  - http
  - web-standards
  - links
draft: false
heroImage: https://media.aitamer.news/heroes/the-url-fragment-is-removed-before-retrieval-5eba2932.jpg
heroAlt: Scissors cut the fragment from a web address before a server retrieves the page.
author: ari
wildness:
  rating: 3
  verified: The fragment is removed before retrieval and excluded from the HTTP target URI.
  claimed: A visible URL suffix can name a document part without changing the server request.
verdict: Treat the fragment as a client-side pointer into the retrieved material. Use the path or query when the server needs to select a different resource.
sources:
  - title: "RFC 3986: Uniform Resource Identifier (URI): Generic Syntax"
    url: https://www.rfc-editor.org/rfc/rfc3986
  - title: "RFC 9110: HTTP Semantics"
    url: https://www.rfc-editor.org/rfc/rfc9110.html
  - title: "HTML Standard: Scrolling to a fragment"
    url: https://html.spec.whatwg.org/multipage/browsing-the-web.html#scroll-to-fragid
---

A URL such as `https://example.org/guide#setup` looks like one address. It contains a retrieval address and a fragment. The client uses the first part to obtain the resource. It then interprets `setup` in the context of that resource. [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) calls this an indirect reference to a secondary resource. That division explains why changing the text after `#` cannot, by itself, ask a server for different content.

## The number sign marks a separate component

In the generic URL syntax, the first `#` starts the fragment, which runs to the end of the reference. A `?` before it starts the query. The query, together with the path, helps identify the primary resource. The fragment identifies something through that primary resource. The distinction is visible in these illustrative addresses:

- `https://example.org/guide?edition=short#setup`
- `https://example.org/guide?edition=short#troubleshooting`
- `https://example.org/guide?edition=full#setup`

The first two have the same path and query. They differ only in the fragment. The third has a different query, so it can identify a different primary resource. The `?` inside a fragment is simply fragment data; it does not start another query. These rules come from the [query and fragment definitions in RFC 3986](https://www.rfc-editor.org/rfc/rfc3986).

## Retrieval happens without the fragment

The URI standard says the fragment is separated before dereferencing, or accessing, the primary resource. Its identifying information is handled by the user agent. For HTTP, [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html) makes the consequence explicit: the target URI used for the request excludes the reference's fragment. The server receives the request target built from the remaining components.

For the first illustrative address, an HTTP/1.1 request could begin like this:

```http
GET /guide?edition=short HTTP/1.1
Host: example.org
```

The request has no `#setup`. Replacing `#setup` with `#troubleshooting` does not change that request target. A server cannot choose a different response because of that fragment alone, since the fragment is absent from the request. This does not promise identical responses to every request for `/guide?edition=short`. Other request details and server state can affect a response. The narrower point is that the fragment supplies no server selection input through the ordinary HTTP request.

## The retrieved material gives the fragment meaning

A fragment can identify a portion of the primary resource, a view of one of its representations, or another resource described by a representation. Its meaning depends on the media type of the material that could be retrieved. RFC 3986 therefore does not give every `#word` one universal meaning. [Its fragment rules](https://www.rfc-editor.org/rfc/rfc3986) leave the detailed interpretation to the representation.

For an HTML document, a common case is a link to an element whose `id` matches the fragment. The [HTML Standard](https://html.spec.whatwg.org/multipage/browsing-the-web.html#scroll-to-fragid) describes how the document selects that element and scrolls it into view. If no matching part exists, the fragment does not create a missing section or request a substitute from the server. The URL can still contain the fragment even when it points to nothing in the current document.

This arrangement lets an author link directly to a section within a larger document. The server can serve the document as a whole, while the reader's software finds the intended part. That is the purpose of the separation in [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986): fragment handling can vary with the kind of representation without changing the retrieval mechanism.

## A fragment is visible outside the request

Keeping the fragment out of the HTTP request does not make it a secret. [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html) notes that the user agent, extensions, and scripts running with the response can see it. A redirect can also carry it forward. When a redirect's `Location` has no fragment, the client processes the destination as inheriting the original fragment. A fragment from one site can therefore appear on another site's destination URL.

There is a practical diagnostic consequence too. The request target in an ordinary HTTP server log cannot show which fragment selected a section, because that information never arrived in the request target. A link that lands on the wrong heading is usually a question about the returned document and its fragment handling. A link that needs the server to serve another resource needs a change to the part of the URL used for retrieval. These conclusions follow from the [HTTP target URI rule](https://www.rfc-editor.org/rfc/rfc9110.html) and the [HTML fragment algorithm](https://html.spec.whatwg.org/multipage/browsing-the-web.html#scroll-to-fragid).

## What to do

1. Use a fragment when a link should point to a part of material the client can already retrieve. For HTML, give the intended element a stable `id` and link to it with `#id`.
2. Use a path or query when the server must select a different primary resource or response. Changing only the fragment cannot supply that choice to an ordinary HTTP request.
3. When a fragment link fails, check the retrieved document and the target `id`. Then check whether a redirect moved the reader to a document with a different set of targets.
4. Keep private values out of fragments. They are visible to client-side code and can be inherited across redirects. If a redirect must prevent that inheritance, [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html) says its `Location` can include a fragment, including an empty one.
