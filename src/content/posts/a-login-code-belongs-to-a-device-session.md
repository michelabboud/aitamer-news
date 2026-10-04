---
title: A Login Code Belongs to a Device Session
description: A browserless CLI can ask you to approve access in another browser. The code on your screen identifies the pending session, so check which client you are approving.
pubDate: "2026-10-06T06:30:00Z"
specimen: 302
section: general
tags:
  - oauth
  - device-authorization
  - cli
  - login-security
draft: false
heroImage: https://media.aitamer.news/heroes/a-login-code-belongs-to-a-device-session-ff565b17.jpg
heroAlt: A row of coral code blocks travels from one laptop to a second sign-in window.
author: ari
wildness:
  rating: 2
  verified: RFC 8628 defines paired codes, browser approval, polling, and remote-phishing safeguards.
  claimed: Applying the device pattern to a browserless CLI is an inference from the RFC.
verdict: Approve a device-flow request only when the browser shows the session you started and the code matches the one still visible in your CLI.
sources:
  - title: "RFC 8628: OAuth 2.0 Device Authorization Grant"
    url: https://www.rfc-editor.org/rfc/rfc8628.html
---

A command-line client may need access to an account even when it has no suitable browser for sign-in. The OAuth device authorization flow provides a way to use a browser on another device. The client displays an address and a short code. You visit the address, sign in, and decide whether to approve the request. The client checks with the authorization server for your decision. [RFC 8628](https://www.rfc-editor.org/rfc/rfc8628.html) defines this flow for devices that lack a suitable browser or have limited input. A browserless CLI can use the same pattern.

## The two codes have different jobs

The client starts by asking the authorization server for a device authorization response. That response contains a `user_code`, a `device_code`, a verification address, and a lifetime for the codes. It may also specify how long the client should wait between checks. Both codes belong to this limited-time authorization session. [RFC 8628](https://www.rfc-editor.org/rfc/rfc8628.html) describes the response and its required fields.

The short `user_code` is for you. The CLI shows it alongside the verification address so you can identify its pending request in the browser. The `device_code` is for the client. It sends that code to the server when it checks for a decision. The specification says the device code should stay out of the user-facing instructions to avoid confusion. These roles explain why seeing a code on a screen does not, by itself, tell you who started the request. [RFC 8628](https://www.rfc-editor.org/rfc/rfc8628.html) sets out both the user interaction and the client's token request.

## The browser holds the approval step

After opening the verification address, you authenticate with the authorization server. You enter the code shown by the CLI, then review the request and approve or deny it. The server should explain the action you are taking. Once that interaction ends, you return to the client. Your account credentials go through the browser interaction with the authorization server; the CLI receives the result of the authorization process through its own connection. [RFC 8628](https://www.rfc-editor.org/rfc/rfc8628.html) describes these separate steps.

Some services offer a QR code or another link that already carries the user code. That saves typing, but it also removes the moment when you manually copy the code from the client. The specification still requires the client to display the code. It recommends that the browser show the code and ask you to confirm that it matches the one on the device. For a CLI, the practical check is the same: compare the browser's code with the code still visible in your terminal before approving. [RFC 8628](https://www.rfc-editor.org/rfc/rfc8628.html) explains this shortcut and the matching step.

## The client waits on a schedule

While you use the browser, the client asks the token endpoint whether the request is still pending. A pending response tells it to keep waiting. Approval can lead to an access token. Denial and expiry end that authorization attempt. The client must stop polling after other errors. [RFC 8628](https://www.rfc-editor.org/rfc/rfc8628.html) defines these responses.

Polling has limits. The server may provide a minimum interval. If it does not, the client must wait at least five seconds between requests. A `slow_down` response requires the client to add five seconds to that interval for later requests. After a connection timeout, it must reduce its polling frequency before trying again. These rules give a CLI enough information to wait without repeatedly hammering the token endpoint. The specification also advises clients to start a new authorization request when the user prompts one, rather than automatically restarting after a failed or expired session. [RFC 8628](https://www.rfc-editor.org/rfc/rfc8628.html) gives the timing and restart behavior.

## The code can identify someone else's request

The code identifies a pending authorization session, and that session may have begun on a device you do not control. The specification describes an attack in which someone starts the flow on their own device, then sends another person a message asking them to enter the code. If that person approves, they can grant access to the attacker's client. The recommended safeguard is to confirm that the device requesting access is in your possession. The authorization page should also provide information that helps you recognize the device. [RFC 8628](https://www.rfc-editor.org/rfc/rfc8628.html) calls this remote phishing.

The address matters too. A compromised or malicious client could direct you to the wrong authorization service. Check the browser's address bar before entering account credentials, and read the approval screen before accepting. A familiar-looking code is only useful when it matches a request you started and still have in front of you. [RFC 8628](https://www.rfc-editor.org/rfc/rfc8628.html) discusses the address-bar warning and the need to confirm possession of the requesting device.

## What to do

Start the CLI's sign-in command yourself. Keep its code visible while you open the verification address in a browser. Check the address bar, then compare any code shown by the browser with the one in your terminal. Read which client or device is asking for access and what you are approving. Deny a request you did not start or cannot match to your current session. If the code expires, begin a fresh request from the CLI when you are ready. These steps follow the user checks and session behavior in [RFC 8628](https://www.rfc-editor.org/rfc/rfc8628.html).
