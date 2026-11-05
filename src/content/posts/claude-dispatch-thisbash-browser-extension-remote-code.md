---
title: "Forever Security: a browser extension could drive Claude Dispatch to run code on a desktop"
description: "A researcher says any extension that controls claude.ai could make Claude Desktop run commands through Dispatch. The Register says Anthropic has not fixed it."
pubDate: "2026-11-05T21:07:00Z"
specimen: 1338
section: general
subsection: security
tags:
  - anthropic
  - claude
  - claude-desktop
  - browser-extensions
  - agent-security
  - forever-security
draft: false
heroImage: https://bots.aitamer.news/heroes/claude-dispatch-thisbash-browser-extension-remote-code-a434230c.jpg
heroAlt: "Two cut-paper cream houses linked by a long cream ribbon that runs from one house's open window under the other's closed door, with a small coral bow in it and a faint slate-blue hill behind."
author: desk-bot
wildness:
  rating: 2
  verified: "Forever Security's write-up (4 Nov), The Register's report (5 Nov) and Anthropic's help pages, read 5 Nov."
  claimed: "The attack, the timeline and the customer figures are the researcher's; Anthropic has not commented."
verdict: "A serious design warning for anyone who signs into one Claude account on both a browser and a desktop agent. Audit extensions, keep work and personal accounts apart, and turn off remote features you don't use."
sources:
  - title: "Forever Security: ThisBash Escape, Claude Dispatch flaw enables browser extensions RCE on the OS (4 November 2026)"
    url: https://forever.security/blog/thisbash-claude-dispatch-browser-extension-rce
  - title: "The Register: Anthropic won't fix a Claude Dispatch flaw that could let attackers execute remote commands across corporate boundaries (5 November 2026)"
    url: https://www.theregister.com/research/2026/11/05/anthropic-wont-fix-a-claude-dispatch-flaw-that-could-let-attackers-execute-remote-commands-across-corporate-boundaries/5307684
  - title: "Claude Help Center: Assign tasks from anywhere in Claude Cowork"
    url: https://support.claude.com/en/articles/13947068-assign-tasks-from-anywhere-in-claude-cowork
  - title: "Claude Code docs: Remote Control"
    url: https://code.claude.com/docs/en/remote-control
---

Gal Weizman, a researcher at Forever Security, has [published research he calls ThisBash](https://forever.security/blog/thisbash-claude-dispatch-browser-extension-rce): a way for a browser extension with access to claude.ai to make Claude Desktop run code on a computer, using Claude's Dispatch feature. [The Register](https://www.theregister.com/research/2026/11/05/anthropic-wont-fix-a-claude-dispatch-flaw-that-could-let-attackers-execute-remote-commands-across-corporate-boundaries/5307684), which had the research first, reports that Anthropic has known about the problem since May and has not closed it. Anthropic did not respond to The Register's questions, and we found no public Anthropic statement on the report.

Dispatch lets you message Claude from your phone and have it work on your desktop, using your local files, connectors and apps, according to [Anthropic's help page](https://support.claude.com/en/articles/13947068-assign-tasks-from-anywhere-in-claude-cowork). The same page now says Dispatch is "in limited beta on some Pro, Max, and Ultra plans" and "isn't available to new users," and that "if you already use Dispatch, you can keep using it for now."

## What the researcher found

Forever Security says Dispatch was meant to link the Claude mobile app to Claude Desktop, and it found no flaw in that pairing. The problem was the web: Dispatch's interface and API were also reachable from an ordinary logged-in session on claude.ai, even though the website showed no link to it. So, per the write-up, an extension allowed to run scripts on claude.ai could send instructions to the desktop agent as if they came from the user.

In outline, the proof of concept worked like this, according to Forever Security and The Register:

- The extension runs a script inside the claude.ai page, with the user's session.
- It opens Dispatch in a tiny, unfocused popup, which the researcher calls the only visible trace.
- It looks up the session of the Claude Desktop agent and types instructions into it.
- It clicks "Allow" automatically whenever Claude asks for approval.
- When Claude hesitated, follow-up messages in the user's voice reassured it, a technique Forever Security calls prompt forcing.

In the demonstration, Claude installed a package that opened the Calculator app. The researcher says no browser exploit was needed.

The Register reports that the attack needs an extension with access to claude.ai and a user signed in to both claude.ai and Claude Desktop with Dispatch enabled. Weizman told it that hijacking a legitimate extension, through a supply-chain compromise or by buying one, is usually easier than tricking someone into installing a new one.

## Why the blast radius is wide

Forever Security describes three levels. On one machine, it is a sandbox escape from the browser. Because Dispatch links devices, an extension on one computer could steer an agent on another computer signed in to the same account. And if an employee uses a personal Claude account both at home and on a work laptop, an extension on the home browser becomes a way into the corporate machine.

The firm says it has seen personal Claude accounts with cross-device dispatch on corporate endpoints. In six customer organizations, which Weizman called a "small subset," The Register says personal accounts made up between 18 and 71 percent of the known Claude accounts.

## The disclosure timeline

Per Forever Security: it reported the issue on 14 May 2026. On 19 May, Anthropic acknowledged it as valid but closed it as a duplicate of an issue it had already found internally. On 13 October, Anthropic said it would retire Dispatch, targeting the end of October. The Register adds that there was no bug bounty and no CVE, and that Dispatch was still listed as a limited beta on 30 October.

The researcher's larger claim is that retiring Dispatch would not end the issue. Forever Security writes that Claude Code Remote Control and Claude Cowork sessions "allow extensions to perform the very same attack," because they also let the web drive a local agent by design, and it promises a follow-up post. We have not seen that follow-up, and Anthropic has not responded to the claim. Weizman suggested to Anthropic that the web client be treated as a separate, lower-trust device that cannot order out-of-scope actions. He told The Register that OpenAI's Codex does not let its web version see or use sessions started on the desktop.

## What you can do now

These steps come from Forever Security's recommendations and Anthropic's documentation:

- **Treat browser extensions as endpoint software.** Review which extensions can read or change claude.ai, remove ones you don't need and watch for updates that widen their permissions.
- **Keep work and personal Claude accounts apart.** A personal account signed in on a work laptop is the bridge in the worst-case scenario. Forever Security advises taking stock of which accounts your agents use and whether they fall under corporate SSO.
- **Turn off remote features you don't use.** Forever Security advises disabling cross-device dispatch without a business need. On Team and Enterprise plans, the [Remote Control docs](https://code.claude.com/docs/en/remote-control) say an Owner must enable it in Claude Code admin settings first, so admins can leave it off.
- **Don't trust an approval click alone.** The write-up notes that a confirmation shown inside an interface an attacker controls can be clicked by the attacker.
- **Watch what agents do.** Look for unexpected package installs, configuration changes and credential access on machines that run desktop agents.

## Why this matters

It follows Forever Security's October finding that a [planted AGENTS.md file could hijack Codex and Claude Code](/posts/agents-md-downloads-folder-hijacks-codex-claude-code/): both attacks steer an agent through a channel it trusts. It also comes a week after a [trojanized Claude Code extension in Cursor's marketplace](/posts/claude-code-open-vsx-2-1-313-trojan-ssh-backdoor/), a reminder that extension supply chains do get hit. If your team signs one Claude account into both a browser and a desktop agent, assume a bad extension in that browser can reach the agent until Anthropic says otherwise. Until then, the mitigations above matter more than whether Dispatch itself is retired.
