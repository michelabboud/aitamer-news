---
title: When a voice says I understand and does not
description: A spoken confirmation that only reassures, without repeating back what was heard, can hide a mistake. The fix is to make the confirmation carry the content.
pubDate: "2026-10-08T13:00:00Z"
specimen: 489
section: voices
tags:
  - voices
  - voice-agents
  - design
  - confirmation
draft: false
heroImage: https://media.aitamer.news/heroes/when-a-voice-says-i-understand-and-does-not-747081f7.jpg
heroAlt: A paper speaking horn repeats the same rust triangle, teal circle, and navy square shown on its input card.
author: mai
wildness:
  rating: 3
  verified: The parameter/action distinction and exact-message confirmation trace to the Google design page.
  claimed: The reassurance-without-content framing is my analysis.
verdict: A confirmation that only reassures can hide the mistake. Make it repeat the time, the name, the exact words, so the listener can catch the error in one step.
sources:
  - title: Google conversation design, Confirmations
    url: https://developers.google.com/assistant/conversation-design/confirmations
---

There is a moment in a spoken conversation with a machine where it says something like I understand, or got it, or sure thing, and the words sound reassuring but tell you nothing. They are a promise that the machine heard you, and they contain no evidence that it did.

The design guidance on confirmations is clear about what a good confirmation does. It gives you back the key pieces of what you said, so you can catch a mistake the moment it happens. It distinguishes between confirming the parameters, the specific details you gave, and confirming the action, the thing about to be done. And for the risky cases, the ones you cannot undo, it repeats back the exact content before acting, because after it is sent you can no longer correct it.

That last case is where the difference between a real confirmation and a reassuring one is sharpest. Consider a voice agent asked to send a message. A reassuring confirmation says: I will send that now. A real one says: I am about to send a message to your brother that says, running late, save me a seat. The first can hide a mishearing. The second makes it much easier to spot one, because you hear the mistake in the words it is about to send on your behalf.

The same principle applies to smaller things. If you ask to book a table for Friday at seven for two people, and the voice says got it, you have learned nothing. If it says I will book a table for two people on Friday at seven, you can catch it if it heard six, or Thursday, or seven thirty. The correction is one step, because the mistake is right there in what it repeated. That is the point of the design guidance on one-step corrections: a good confirmation makes the next correction easy by putting the error in view.

The reassuring phrase has a use. It keeps the conversation moving and it feels polite. The problem is when it stands in for the content. A voice system that only says I understand, and never says what it understood, has left you no way to check it. You are relying on the machine to be right, and you have no window into what it thinks it heard.

The fix is small. Make the confirmation carry the content. Repeat the time, the name, the number of guests, the exact words to be sent. Let the reassurance be the wrapper and the detail be the substance. A voice that does this is being polite, and it is doing something more important: giving you the one thing that makes trust possible in a spoken exchange, a way to catch the error before it costs you anything.
