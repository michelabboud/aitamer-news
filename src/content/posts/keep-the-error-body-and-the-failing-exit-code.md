---
title: Keep the Error Body and the Failing Exit Code
description: Use curl --fail-with-body when a script needs to detect an HTTP error and keep the response text that explains it.
pubDate: "2026-10-07T22:00:00Z"
specimen: 379
section: tools
tags:
  - curl
  - http
  - shell
  - debugging
draft: false
heroImage: https://media.aitamer.news/heroes/keep-the-error-body-and-the-failing-exit-code-ce3aaecc.jpg
heroAlt: A server error flows through a pipe; its message falls into a collection tray while a failure marker stays visible.
author: ari
wildness:
  rating: 1
  verified: The curl manual documents the HTTP failure threshold, saved body, and exit code 22.
  claimed: This combination makes API errors easier to diagnose in scripts.
verdict: Use --fail-with-body when the response body matters during an HTTP failure, and check curl’s exit status before processing the response.
sources:
  - title: curl man page
    url: https://curl.se/docs/manpage.html
---

A server can return an HTTP error along with a useful response body. That body may explain which input was rejected or why a request could not be completed. A script needs the failure signal, while the person investigating the failure needs the text. [`curl --fail-with-body` keeps both](https://curl.se/docs/manpage.html).

## What the option changes

By default, curl does not treat an HTTP error status as a failed transfer. Its `--fail` option changes that behavior for HTTP response codes of 400 or greater, but suppresses the response body. `--fail-with-body` also returns a failure for those responses and still outputs or saves the body. The [curl manual](https://curl.se/docs/manpage.html) says the resulting exit code is 22.

This helps when an API sends a readable error message. Without the body, a failing script may leave you with an exit code and little context from the server. With the body alone, a script may continue as though the request succeeded. The option lets the script react to curl’s exit status while keeping the server’s explanation available.

## How to use it in a script

For a request whose response should appear in the script’s output, the basic command is:

```sh
curl --fail-with-body https://api.example.test/items
```

For a response you want to inspect in a file, add `--output`:

```sh
curl --fail-with-body --output response.json https://api.example.test/items
```

The [manual says](https://curl.se/docs/manpage.html) curl normally writes received data to standard output and that `--output` saves it to a file. In either form, check the command’s exit status before processing the response as a success. A saved file can contain an error response.

If one curl command fetches several URLs, consider `--fail-early` as well. The [manual explains](https://curl.se/docs/manpage.html) that a later successful transfer can otherwise hide an earlier transfer error in curl’s final exit code. `--fail-early` makes curl return on the first detected transfer error.

## What to do

1. Add `--fail-with-body` to a script that needs the server’s error text.
2. Keep the body in the script’s output or save it with `--output`.
3. Branch on curl’s exit status before using the response as successful data.
4. When fetching multiple URLs in one curl command, add `--fail-early` if any failed transfer must fail the command.
