---
title: Make HTML Sinks Reject Ordinary Strings
description: Trusted Types and Content Security Policy can make the browser require a reviewed policy before dynamic HTML reaches an injection sink. Here is how to introduce that boundary.
pubDate: "2026-10-05T13:00:00Z"
specimen: 268
section: dev
tags:
  - web-security
  - trusted-types
  - content-security-policy
  - javascript
  - xss
draft: false
heroImage: https://media.aitamer.news/heroes/make-html-sinks-reject-ordinary-strings-01f2f6c0.jpg
heroAlt: Loose paper fragments stop at a checked security barrier before reaching a web page.
author: ari
wildness:
  rating: 3
  verified: CSP can reject strings at covered sinks and restrict policy names.
  claimed: A trusted value shows a policy ran; safety depends on how that policy sanitizes or constrains its input.
verdict: Use reports to find sink calls, create a narrow sanitizing policy, then enforce both CSP directives. A trusted value records that a policy ran; the policy still needs review.
sources:
  - title: Trusted Types API
    url: https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API
  - title: "Node: textContent property"
    url: https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent
  - title: "Content-Security-Policy: require-trusted-types-for directive"
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/require-trusted-types-for
  - title: "Content-Security-Policy: trusted-types directive"
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/trusted-types
  - title: Content-Security-Policy-Report-Only header
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy-Report-Only
  - title: Prevent DOM-based cross-site scripting vulnerabilities with Trusted Types
    url: https://web.dev/articles/trusted-types
---

A line such as `preview.innerHTML = value` asks the browser to parse `value` as HTML. If an attacker can influence that value, the assignment can create a cross-site scripting risk. The [Trusted Types API](https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API) gives applications a way to pass values through a chosen transformation before they reach sensitive browser APIs. A Content Security Policy (CSP) can make that step mandatory in supporting browsers.

## HTML sinks parse their input

An **HTML sink** is an API that treats its input as markup. `innerHTML`, `insertAdjacentHTML()`, and `document.write()` are examples. Trusted Types also covers sinks for JavaScript and script URLs. The browser expects a different trusted value for each kind: `TrustedHTML`, `TrustedScript`, or `TrustedScriptURL`. The [Trusted Types reference](https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API) lists the direct sinks and the type each one accepts.

When the input is only text, set `textContent`. It sets text without asking the browser to parse an HTML fragment. This also makes the intent of the assignment clear to a reader. MDN [recommends `textContent` for text](https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent) because `innerHTML` handles raw HTML and can expose an application to cross-site scripting.

Some features do need markup. A preview might allow paragraphs and links, for example. In that case, decide which markup is allowed before creating a `TrustedHTML` value. Trusted Types supplies the policy mechanism; the application supplies the transformation. The API does not provide a sanitizer of its own, as the [API guide](https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API) explains.

## Two CSP directives set the boundary

The first directive is `require-trusted-types-for 'script'`. Despite the word `script`, this setting covers DOM injection sinks including HTML sinks. With enforcement enabled and no default policy, an ordinary string assigned to `innerHTML` is rejected with a `TypeError`. A `TrustedHTML` value made by a policy can be accepted. The [directive reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/require-trusted-types-for) shows both outcomes.

The second directive is `trusted-types`. It lists the names of policies that page code may create. If code tries to create a policy with a name outside that list, policy creation fails. This matters because an unrestricted new policy could turn any string into a trusted value. The [policy name directive](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/trusted-types) makes the allowed creation points easier to audit. It does not, by itself, require trusted values at sinks. Use it with `require-trusted-types-for`.

For an application with one reviewed HTML policy, the enforcing response header can contain:

```http
Content-Security-Policy: require-trusted-types-for 'script'; trusted-types app-html
```

That header permits a policy named `app-html` and requires a trusted value at covered sinks. Other CSP rules for the application can appear in the same header. The two Trusted Types directives have distinct jobs: one restricts sink inputs, and the other restricts policy names. [MDN documents both directives](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/trusted-types).

## A policy turns reviewed HTML into a value

Here is a small example. It assumes DOMPurify is loaded and the CSP above is enforced. The policy sanitizes the input, then returns a `TrustedHTML` value for the assignment:

```js
const htmlPolicy = trustedTypes.createPolicy('app-html', {
  createHTML: (input) => DOMPurify.sanitize(input)
});

const untrustedHtml = new URLSearchParams(location.search).get('preview') ?? '';
const preview = document.querySelector('#preview');
preview.innerHTML = htmlPolicy.createHTML(untrustedHtml);
```

The policy's `createHTML` callback returns a string. Calling `htmlPolicy.createHTML()` wraps its result in the trusted type. MDN shows this [policy and sink pattern](https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API). Keep the policy narrow enough to review. A callback that simply returns its input would satisfy the type check while leaving the risky HTML intact. Trusted Types requires a policy decision; it cannot judge whether that decision is safe. The [web.dev guide](https://web.dev/articles/trusted-types) makes that limitation explicit.

## Reports reveal work before enforcement

Enforcement can break a page that still sends strings to covered sinks. Start with a `Content-Security-Policy-Report-Only` header containing `require-trusted-types-for 'script'`, and configure a reporting endpoint. The browser can then report violations while the page continues to work. The [report-only header reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy-Report-Only) explains how to connect `report-to` with a `Reporting-Endpoints` response header.

Review those reports alongside searches for sink calls. Reports show paths that actually ran; code review can find paths that traffic did not exercise. Replace text-only HTML assignments with `textContent`. For required markup, route values through a small policy with suitable sanitization. The [migration guide](https://web.dev/articles/trusted-types) describes this sequence and recommends treating a default policy as a temporary aid for legacy code.

A policy named `default` is a special case. With enforcement active, the browser can send an ordinary string through that policy automatically. This can ease a transition, but it hides the exact call sites that still need explicit trusted values. [MDN recommends](https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API) using the default policy only during that transition. Older browsers may lack Trusted Types enforcement, so keep safe DOM patterns and sanitization in place for them as well; check the [compatibility information](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/require-trusted-types-for) for the browsers you support.

## What to do

1. Find assignments to HTML sinks, including `innerHTML` and `insertAdjacentHTML()`.
2. Use `textContent` wherever the intended output is text.
3. For markup that remains, define a narrowly scoped sanitizing policy and allowlist its name with `trusted-types`.
4. Run `require-trusted-types-for 'script'` in report-only mode with a reporting endpoint. Fix the reported call sites.
5. Enforce both directives. Check that an ordinary string fails at an HTML sink and that the intended `TrustedHTML` value works. Keep reviewing the policy whenever its allowed markup changes.
