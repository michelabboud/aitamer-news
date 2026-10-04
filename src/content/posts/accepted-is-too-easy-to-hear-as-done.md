---
title: “Accepted” Is Too Easy to Hear as “Done”
description: HTTP 202 means a request was accepted while processing remains unfinished. An asynchronous AI job needs a place where people can learn its outcome.
pubDate: "2026-10-07T19:30:00Z"
specimen: 374
section: voices
tags:
  - ai
  - http
  - async-jobs
  - user-experience
draft: false
heroImage: https://media.aitamer.news/heroes/accepted-is-too-easy-to-hear-as-done-4bd25ddb.jpg
heroAlt: A checked intake box leads through a processing line toward a separate completion notice.
author: ari
wildness:
  rating: 2
  verified: RFC 9110 says 202 accepts unfinished processing and recommends a status monitor.
  claimed: Every asynchronous AI job should expose a durable, readable outcome.
verdict: Treat acceptance as a receipt. Give each job a status link and show “Done” only after completion.
sources:
  - title: "RFC 9110, Section 15.3.3: 202 Accepted"
    url: https://www.rfc-editor.org/rfc/rfc9110.html#name-202-accepted
---

An AI task can take longer than the request that starts it. The first response may arrive while the task is still waiting or working. That gap matters because “accepted” sounds reassuring. A person may close the page, use an unfinished result, or assume a missing result is their own mistake.

## What acceptance means

[HTTP 202 Accepted](https://www.rfc-editor.org/rfc/rfc9110.html#name-202-accepted) says the request was accepted for processing. It also says processing has not been completed. The request may never be acted upon. HTTP has no way to send a second status code later for that same asynchronous response.

The distinction is small in the protocol and large in the interface. A successful request to start a task is one event. A successful task is another. A green check beside the first event can erase the second from view. For an AI task that drafts a report, reviews a document, or generates an image, the user needs to know which event the check represents.

## Give the outcome a place to live

The same [202 definition](https://www.rfc-editor.org/rfc/rfc9110.html#name-202-accepted) says the response ought to describe the request’s current status and point to, or include, a status monitor. That is useful guidance for an interface too. Show that the job was received. Give it a stable place where someone can return to learn what happened.

That place should make the states plain: waiting, working, completed, failed, or canceled. The RFC leaves these labels to the product. When work completes, link to the actual result. When it cannot complete, say so and offer a clear next action. If the system has no reliable outcome yet, say that instead of keeping a cheerful spinner forever.

A notification can help, but it should lead back to a durable status page. The notification itself may be missed. The page gives the user a way to check without remembering when they started the task.

## What to do

Return 202 only when the request has actually been accepted for later processing. In that response, provide a job identifier and a link to its status. Make the first screen say “Received” or “In progress.” Reserve “Done” for a confirmed outcome. Keep the status available long enough for the user to return, and make failures visible there.
