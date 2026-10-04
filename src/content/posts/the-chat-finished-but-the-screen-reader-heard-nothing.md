---
title: The Chat Finished, but the Screen Reader Heard Nothing
description: A chat needs to announce when a reply starts, finishes, or fails. Short status messages can do that without moving focus.
pubDate: "2026-10-05T21:00:00Z"
specimen: 283
section: dev
tags:
  - accessibility
  - screen-readers
  - chat-interfaces
  - web-development
draft: false
heroImage: https://media.aitamer.news/heroes/the-chat-finished-but-the-screen-reader-heard-nothing-0cb58f7d.jpg
heroAlt: A completed chat interface sends notification symbols toward a listener using a screen reader.
author: ari
wildness:
  rating: 2
  verified: W3C supports status notices without moving focus and live text for progress updates.
  claimed: These patterns apply to chat reply states; the cited W3C pages do not discuss AI chat.
verdict: Give chat users brief, spoken state changes while keeping the finished reply available to read at their own pace.
sources:
  - title: "Understanding Success Criterion 4.1.3: Status Messages"
    url: https://www.w3.org/WAI/WCAG21/Understanding/status-messages.html
  - title: "ARIA22: Using role=status to present status messages"
    url: https://www.w3.org/WAI/WCAG21/Techniques/aria/ARIA22
  - title: "ARIA25: Using an ARIA live region to convey the status of a progress bar"
    url: https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA25
---

A chat can show a finished answer while leaving a screen reader user unsure whether the reply is ready. The visual cue may be a spinner that vanishes, a button that changes, or text that appears elsewhere on the page. [W3C's status message guidance](https://www.w3.org/WAI/WCAG21/Understanding/status-messages.html) covers brief notices about waiting, progress, success, and errors when the page changes without moving focus. Applied to a chat, the start and end of generation are useful status messages.

## Give each state a name

Use a short message when work starts, such as “Writing reply.” Replace it when generation finishes with “Reply ready.” If generation fails, say “Reply failed. Try again.” These phrases tell the user what changed. A disappearing “Writing reply” label alone may give no spoken completion cue. W3C notes that removing a waiting message can leave a user unaware that waiting has ended. [Its guidance explains why an explicit end message matters](https://www.w3.org/WAI/WCAG21/Understanding/status-messages.html).

Put the changing text in a status region. [W3C's `role="status"` technique](https://www.w3.org/WAI/WCAG21/Techniques/aria/ARIA22) says the role has polite live behavior, so assistive technology can announce new status text without moving focus. Keep the message brief and meaningful on its own. The same technique recommends `aria-atomic="true"` when the whole status, including its context, should be announced.

## Keep the reply separate

The finished answer is content the user may want to read at their own pace. Announce that it is ready, then let the user navigate to it. This applies W3C's distinction between a short result notice and the returned content itself: the notice is a status message; the result is separate content. [The guidance uses search results to explain that boundary](https://www.w3.org/WAI/WCAG21/Understanding/status-messages.html).

A visual progress bar needs its own care. [W3C's progress technique](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA25) says changing a progress bar's value alone does not make those changes live announcements. If progress updates matter, provide concise status text alongside the indicator. Avoid turning each piece of generated text into another progress notice. The user needs a clear state, then a readable answer.

## What to do

1. Identify the visible states: working, ready, and failed.
2. Put a persistent, initially empty `role="status"` region in the page before generation starts. Write one short sentence for each state and update that region when the state changes.
3. Leave focus where the user is working. Keep the answer available as ordinary content.
4. Check the flow with a screen reader. Confirm that working and completion are announced, the answer remains navigable, and focus stays put. [W3C's progress technique includes that focus check](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA25).
