---
title: "One click, two charges: how idempotency makes payment retries safe"
description: "A lost checkout response leaves the payment outcome unclear. An idempotency key lets the client retry the same purchase intent without starting another charge."
pubDate: "2026-10-03T21:00:00Z"
specimen: 191
section: dev
tags: [payments, apis, idempotency, retries]
draft: false
heroImage: https://media.aitamer.news/heroes/one-click-two-charges-how-idempotency-makes-payment-retries--3693d678.jpg
heroAlt: "A coral paper key follows two retry paths through layered checkout drawers to one cream jar, rendered as a calm blue-and-sand paper-cut collage."
author: ari
wildness:
  rating: 3
  verified: "RFC 9110 defines idempotency and its retry semantics."
  claimed: "Stripe and Amazon describe their own key and retry behavior."
verdict: "Give each checkout intent one durable key. Reuse it through retries, and keep the payment outcome tied to the order when a response goes missing."
sources:
  - title: "RFC 9110, Section 9.2.2: Idempotent Methods"
    url: https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2.2
  - title: "Stripe API reference: Idempotent requests"
    url: https://docs.stripe.com/api/idempotent_requests
  - title: "Amazon Builders' Library: Making retries safe with idempotent APIs"
    url: https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/
---

Imagine a customer pressing **Pay** once. The checkout sends a payment request, the processor accepts the charge, and the response disappears before the browser receives it. The customer sees a timeout. A fresh request could now produce a second receipt for the same purchase.

The timeout leaves another possibility open: the first request may never have reached the server. [Amazon describes this uncertainty](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/) for a resource creation request whose response never arrives. The caller needs a way to retry without accidentally creating the resource twice. Checkout has the same problem, with money attached.

## The missing response hides the outcome

From the browser’s point of view, these histories look alike:

- The payment request never ran. A retry is needed to finish the purchase.
- The payment ran, but its response was lost. A new payment attempt could charge the customer again.

A timeout cannot distinguish them. Disabling the Pay button may prevent an extra click while the page is open. It does not tell the client what happened to a request already sent. The retry decision needs a promise from the API: repeated requests for this purchase intent will lead to one payment outcome.

## HTTP defines the limit

[RFC 9110 defines an idempotent method](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2.2) by its intended effect: multiple identical requests have the same intended server effect as one. It identifies PUT, DELETE, and safe methods as idempotent. That property lets a client repeat a request after a communication failure, even when the first response never arrived.

A payment creation endpoint commonly uses POST. The POST method alone gives the client no general promise that an automatic retry is safe. RFC 9110 says a client should avoid automatically retrying a non-idempotent request unless it knows the request’s semantics are idempotent or knows the first request was never applied.

That leaves room for an API contract. A server can make a particular POST operation safe to retry by recognizing attempts that belong to the same purchase intent.

## A key names the purchase intent

[Stripe’s idempotency reference](https://docs.stripe.com/api/idempotent_requests) describes a client-generated key that identifies retries of one request. Stripe says a later request with the same key receives the first request’s saved status and body once endpoint execution has begun. It also compares request parameters and rejects a reused key when they differ.

For an application’s own checkout API, the request could look like this:

```http
POST /orders/<order-id>/payments
Idempotency-Key: <unique-token>
Content-Type: application/json

{"paymentMethod": "<selected-method-token>"}
```

Generate the token when the customer starts this payment attempt. Keep it with that attempt so a timeout, page reload, or worker restart does not silently replace it. Send the same key and the same payment inputs on a retry. Give a deliberately new purchase or a new payment attempt its own key.

The key expresses intent. A hash of the basket cannot always do that. Amazon explains that two requests with identical parameters may represent two resources the caller genuinely wants. It prefers a unique identifier supplied by the caller. The same distinction applies when a customer deliberately buys the same item again.

Stripe recommends keys with enough randomness to avoid collisions and says they should contain no sensitive personal data. An email address or card detail has no place in the key.

## The server has to remember the attempt

The application needs a durable record before it can make that promise. A practical design stores the authenticated customer, operation, idempotency key, order, payment attempt, and the inputs that define the attempt. Put a unique constraint on the customer, operation, and key. Create the local payment attempt and reserve its key in one database transaction.

When the key already exists, compare the new inputs with the recorded ones. Reject a mismatch. For a matching request, return the recorded outcome or the current state of the existing attempt. A concurrent retry must join that attempt or wait for it; it must not start another charge.

Amazon stresses that recording the identifier and making related local changes must be atomic. Otherwise, the server could record a key without its operation, or perform an operation without recording the key. A database transaction can protect local records. It cannot, by itself, include a separate payment processor in that transaction.

## The processor call needs the same protection

Persist a stable downstream idempotency key with the payment attempt and use it on every call to a processor that supports this contract. If the application loses the processor’s response, recovery uses that same downstream key. A fresh processor key would describe a fresh request.

Keep the order’s payment state as a second guard. Once an order is confirmed paid, another key must not start another charge for that order. While an earlier attempt has an unknown outcome, resolve that attempt before accepting a new one. If the processor offers no retry-safe operation, reconcile its records before sending another charge request.

A repeated error can still leave work for the application. Stripe says it saves the first request’s result even when that result is a `500` error. Receiving that error again under the same key does not establish that no charge occurred. The application must inspect its payment state and reconcile an uncertain processor outcome.

## A retry should identify the existing payment

Once the result is known, give a matching retry the same payment identity and an equivalent outcome. While work is still underway, expose the existing attempt as pending and let the client check its status. This gives the checkout a path from “the response disappeared” to “this order is paid” without creating another payment.

Amazon recommends responses with the same meaning for retries of a client request identifier. It points out that a bare “resource already exists” error leaves the caller unsure whether its own earlier request created the resource. Stripe’s contract is more specific: for a saved result, it returns the original status and body.

## The retention window belongs in the contract

A key cannot be assumed to work forever. As of October 2026, Stripe says it may remove keys once they are at least 24 hours old, and using a removed key starts a new request. Amazon suggests limiting retention to the lifetime of the resource plus an interval for late-arriving requests.

Define how long your API recognizes a key and what the client should do after that window. Keep enough order and payment history to identify a completed purchase. When an old attempt is uncertain, check its status and reconcile it before offering another payment attempt. The safe retry pattern is one key per intent, a durable record of that intent, and a clear route to its outcome.
