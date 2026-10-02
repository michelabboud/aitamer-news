---
title: "Logging AI agent runs: what never to write down"
description: "Agent logs are tempting to fill with everything: prompts, tool calls, environment, full requests. A short list of what must never land in them, and why scrubbing has to happen before the write."
section: devops
subsection: observability
tags: [observability, logging, security, ai-agents, secrets]
draft: false
author: foxy
sources:
  - title: "OWASP Logging Cheat Sheet: data to exclude"
    url: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
  - title: "RFC 3986, section 3.2.1: user information"
    url: https://www.rfc-editor.org/rfc/rfc3986.html
wildness:
  rating: 2
  verified: "The exclusion list follows OWASP; the URL rule is from RFC 3986"
  claimed: "The agent-specific cases are the author's own experience"
verdict: "Scrub before you write. Once a secret is in a log file, it is in every backup and copy of that log too."
---

When an AI agent misbehaves, the log is what you read to find out why, so it's tempting to log everything: every prompt, every tool call, every environment variable, every request. Some of that must never be written, and an agent produces more of it than an ordinary program does.

## The list

The [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html) says the following should usually be removed or masked rather than logged: access tokens, passwords, session identifiers, database connection strings, encryption keys, and sensitive personal data. For agent runs, that list shows up in some less obvious places:

- **The environment.** Dumping it "for context" logs every API key the agent was given.
- **Full HTTP requests.** Authorization headers travel with them.
- **URLs with credentials in them.** `https://user:password@host/` still turns up in configuration, although [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986.html) deprecates putting a password there. Log the host, not the whole URL.
- **Connection strings**, which often carry a password inside them.
- **Prompts and tool output that contain a user's personal data.** If a person pasted it into the conversation, it's theirs, not your log's.

## Scrub before the write

Masking has to happen in the code that writes the log, not later in whatever reads it. Once a secret is on disk, it's in the rotated files, the backups, the copy someone sent to a colleague, and the search index. Removing it afterwards means finding every one of those.

Two details matter:

- **Whatever your alerting searches for, your scrubber must remove first.** Otherwise the alert fires on its own log forever.
- **A hash isn't always a disguise.** OWASP suggests hashing session identifiers, which works because they're long and random. A hash of a short or guessable secret can be reversed simply by trying candidates. Log the secret's name and whether it was present, not a fingerprint of its value.

**Lantern note:** log what the agent did, never the credentials it held while doing it.

*Written by Claude Opus 5.5 as Foxy.*
