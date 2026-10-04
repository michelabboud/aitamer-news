---
title: Verify a Webhook Before Starting the AI Job
description: Check a GitHub webhook signature against the received request body before accepting work. Then check the event, prevent duplicate jobs, and decide what the payload is allowed to trigger.
pubDate: "2026-10-06T05:00:00Z"
specimen: 299
section: dev
tags:
  - webhooks
  - github
  - security
  - ai-jobs
draft: false
heroImage: https://media.aitamer.news/heroes/verify-a-webhook-before-starting-the-ai-job-c266a04d.jpg
heroAlt: A signed webhook request passes a key-shaped check before reaching an AI job.
author: ari
wildness:
  rating: 2
  verified: GitHub documents the signature, headers, event checks, redelivery ID, and response guidance.
  claimed: Verify the received body before enqueueing an AI job, then apply event policy and duplicate handling.
verdict: Signature verification belongs before job acceptance. A matching signature permits the endpoint to evaluate the delivery; event policy and duplicate handling decide whether it starts work.
sources:
  - title: Validating webhook deliveries - GitHub Docs
    url: https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries
  - title: Best practices for using webhooks - GitHub Docs
    url: https://docs.github.com/en/webhooks/using-webhooks/best-practices-for-using-webhooks
  - title: Webhook events and payloads - GitHub Docs
    url: https://docs.github.com/en/webhooks/webhook-events-and-payloads
---

A webhook can start useful work: summarize an issue, review a pull request, or prepare a reply. The receiving endpoint also accepts an HTTP request from anyone who can reach it. Before that request starts an AI job, the endpoint needs to check that the delivery matches the secret configured for its GitHub webhook. GitHub recommends validating the signature before processing the delivery further. [GitHub’s validation guide](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries) describes the check.

## Give the signature check one job

When a webhook has a secret, GitHub uses that secret and the payload to produce an HMAC-SHA256 signature. It sends the result in the `X-Hub-Signature-256` header, prefixed with `sha256=`. Your endpoint calculates its own signature from the secret and the body it received, then compares the two. A match supports the conclusion that the body came through a sender with the secret and was not changed in transit. A failed or missing check means the endpoint should reject the request before it creates work. [GitHub explains the signature format and comparison](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries).

Create a random, high-entropy secret for the webhook. Store it where the receiving service can access it. Keep it out of source code and repositories. GitHub also advises against putting credentials in the payload URL. The URL is an address for delivery; the secret is what the endpoint uses for this check. [GitHub’s validation guide](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries) and [webhook best practices](https://docs.github.com/en/webhooks/using-webhooks/best-practices-for-using-webhooks) cover these choices.

## Check the body that arrived

Read the original request body before a JSON parser, middleware layer, or queue producer changes it. Calculate the HMAC over that body. Parsing JSON and serializing it again can change its bytes even when the data looks equivalent. GitHub’s Python example uses the original request body for the HMAC, and its troubleshooting guide says to check that a proxy or load balancer has not modified the payload or headers before verification. If the server handles character encoding explicitly, GitHub says to use UTF-8 because webhook payloads can contain Unicode. [See the examples and troubleshooting steps](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries).

Check that `X-Hub-Signature-256` is present and has the expected `sha256=` form. Calculate the expected HMAC-SHA256 value with the webhook secret. Compare it with a timing-safe comparison function, after handling malformed values safely. GitHub warns against a plain equality operator and provides examples in several languages. Its older `X-Hub-Signature` header uses SHA-1 for compatibility; GitHub recommends the SHA-256 header. [See GitHub’s validation guide](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries).

Put this check at the entrance to the workflow. A queue message that starts an AI job is already accepted work. Verify first, then decide whether to enqueue. When verification fails, return an error and leave the job queue untouched. A missing signature can also mean the webhook was configured without a secret, according to GitHub’s troubleshooting guidance. Fix that configuration instead of letting unsigned deliveries through. [See GitHub’s troubleshooting guidance](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries).

## Decide which verified events may start work

A valid signature answers a narrow question about the delivered body. It does not decide whether every event deserves an AI job. GitHub recommends checking the event type in `X-GitHub-Event` and the top-level `action` field before processing. For example, a service built to summarize newly opened issues should accept the intended `issues` action and ignore other actions. Subscribe only to the events the service handles. [GitHub’s best practices](https://docs.github.com/en/webhooks/using-webhooks/best-practices-for-using-webhooks) describe both checks.

The signature is calculated from the request body. Treat routing headers and payload fields as inputs to a separate policy decision. Check the repository or installation that the job is allowed to serve, the action it supports, and the data it needs. Issue text may be material for a summary, but its instructions should not define the job’s permissions. GitHub’s [delivery headers and example payload](https://docs.github.com/en/webhooks/webhook-events-and-payloads) show how event names, actions, repositories, and issue content arrive.

## Account for repeated deliveries

GitHub includes an `X-GitHub-Delivery` identifier. Its best-practices guide suggests using that identifier to detect repeated deliveries and notes that a requested redelivery keeps the original value. Record an accepted identifier with the job state so a repeat does not start the same job twice. Decide how an operator can retry a failed job without accidentally duplicating a completed one. [GitHub documents the delivery identifier and redelivery behavior](https://docs.github.com/en/webhooks/using-webhooks/best-practices-for-using-webhooks).

That identifier is useful for duplicate handling, but the signature calculation covers the body, not the identifier header. Do not treat the header alone as proof that a request is fresh. Verification, event policy, and duplicate handling each answer a different question. [GitHub describes the signed content](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries) and [the delivery headers](https://docs.github.com/en/webhooks/webhook-events-and-payloads).

GitHub says an endpoint should return a successful response within 10 seconds or GitHub will consider the delivery failed. Its guide suggests asynchronous processing for longer work. For an AI job, verify and make the acceptance decision promptly, then let a worker do the longer task. Return success only when the endpoint has actually accepted the work under its own policy. [See GitHub’s response guidance](https://docs.github.com/en/webhooks/using-webhooks/best-practices-for-using-webhooks).

## What to do

1. Configure a high-entropy webhook secret and store it securely beside the receiving service. [GitHub’s setup guidance](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries) explains the secret.
2. Capture the received body. Require `X-Hub-Signature-256`, calculate HMAC-SHA256 over that body, and use a timing-safe comparison. Reject missing, malformed, and mismatched signatures before enqueueing a job. [GitHub’s validation guide](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries) supplies examples and a test value.
3. Allow only the event types, actions, and repositories your AI workflow is meant to handle. Record accepted delivery identifiers and define how retries behave. [GitHub’s best practices](https://docs.github.com/en/webhooks/using-webhooks/best-practices-for-using-webhooks) cover event checks and repeat deliveries.
4. Test a valid delivery, a changed body, a missing header, an unsupported action, and a repeated delivery before connecting the endpoint to a job worker. GitHub provides a known secret, payload, and expected signature for checking the core calculation. [See the validation test values](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries).
