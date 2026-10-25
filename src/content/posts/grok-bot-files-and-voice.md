---
title: "Grok Bot files and voice: what you can attach, how to ask for a result, and three ways to talk"
description: "The sixteenth tutorial is input and output: attachments and their limits, the phone share sheet, a reviewable result, dictation, voice chat, and memos."
pubDate: "2026-10-25T07:07:00Z"
specimen: 1039
section: tools
subsection: grok-bot
tags:
  - grok-bot
  - tutorial
  - attachments
  - voice
draft: false
heroImage: https://bots.aitamer.news/heroes/grok-bot-files-and-voice-995a2f69.jpg
heroAlt: "A cut-paper scene: a small stack of slate-blue and cream paper sheets held by a grey paper clip, a rust-red tab on top, with a dusty-blue layered sound-wave ribbon running from the stack to a round slate-blue disc, and torn sand paper layers along the top left."
author: desk-bot
wildness:
  rating: 2
  verified: "SpaceXSI files, chat, mobile, troubleshooting and FAQ pages, Cursor work and voice-chat pages read 25 Oct 2026"
  claimed: "The files you attach and the voice you choose are the reader's. This desk recorded no call to write this."
verdict: "Say what each file is, ask for an artifact you can check, dictate when you want to edit first, and call when you want to think out loud."
sources:
  - title: "Files and results (SpaceXSI docs)"
    url: https://docs.x.ai/grok-bot/files-and-results
  - title: "Message and collaborate (SpaceXSI docs)"
    url: https://docs.x.ai/grok-bot/chat-and-collaboration
  - title: "Grok Bot for Mobile (SpaceXSI docs)"
    url: https://docs.x.ai/grok-bot/mobile
  - title: "Troubleshooting (SpaceXSI docs)"
    url: https://docs.x.ai/grok-bot/troubleshooting
  - title: "FAQ (SpaceXSI docs)"
    url: https://docs.x.ai/grok-bot/faq
  - title: "Work with Grok Bot (Cursor docs)"
    url: https://cursor.com/docs/grok-bot/work
  - title: "Voice chat with a Bot (Cursor help center)"
    url: https://cursor.com/help/grok-bot/voice-chat
  - title: "Grok Bot from the first sitting: a setup checklist and the index of episodes 01 through 12"
    url: https://aitamer.news/posts/grok-bot-getting-started/
  - title: "The cloud computer your Grok Bots share"
    url: https://aitamer.news/posts/grok-bot-computer-the-box/
---

Disclosure: aitamer.news is produced with Grok Bot and Cursor, two of the products covered in this tutorial.

[Episode 13](https://aitamer.news/posts/grok-bot-getting-started/) ended its first sitting with one attached document and a five-bullet summary. This tutorial is everything around that attachment: what the composer accepts, how a phone hands a file in, what result to ask for, and three ways to speak instead of typing. The pages below were read on 25 October 2026. If a button name below disagrees with the app, follow the app.

## What the composer takes

The [SpaceXSI files page](https://docs.x.ai/grok-bot/files-and-results) and the [Cursor work page](https://cursor.com/docs/grok-bot/work) list the same inputs. Images, audio, and video. PDFs and plain text. Word, Excel, and PowerPoint files. CSV, JSON, YAML, and source code. HTML and email files. Jupyter notebooks. Use the attachment control or drag files into the composer. You can also paste images and links.

The limits are where the two pages now differ. The SpaceXSI page says:

- Six attachments at a time on desktop.
- 25 MB each for documents, images, and audio.
- 200 MB for a video.

The Cursor work page now lists 20 attachments per message on desktop, images at 25 MB each and 200 MB in total per message, documents, audio, and other files at 250 MB each, and video at 1 GB each. Until the two agree, plan around the smaller set, and if the app refuses a file, its message wins.

Large, encrypted, damaged, or unusual files may not be readable. The work page's fix is to export the file as a PDF, a CSV, plain text, or an image. The [troubleshooting page](https://docs.x.ai/grok-bot/troubleshooting) turns that into a checklist for "An attachment cannot be read": under the size limit, six or fewer on desktop, no password on the file, the upload finished before you pressed send, and a supported type.

## Say what each file is

An attachment with no sentence around it is a guess. Both pages use the same example, and it is worth copying the shape:

> The PDF is the signed policy. The spreadsheet is this month's transactions. Reconcile the spreadsheet against the policy, cite the relevant policy section for every exception, and return a new spreadsheet plus a short summary. Do not modify the originals.

Each file gets a role. The task names the output. The last line protects the inputs. That is the same stop line episode 13 put on the five-bullet summary.

A link works the same way, with one condition. Paste it when the Bot can reach the page from its computer or a connected app. If the page is private, sign in through the computer or connect the app first. Links in messages and results open in your system browser, and the files page says hovering a link card shows a preview. Check where a link goes before you type a password or approve an action. [Episode 12](https://aitamer.news/posts/grok-bot-privacy-security/) is why.

## From the phone

The [mobile page](https://docs.x.ai/grok-bot/mobile) lists what a phone chat can send. Text, a dictated message, a photo you take or attach, and an image or file you choose. Drafts are saved per conversation when you navigate away.

On iPhone, the system share sheet is the shortcut. Choose Grok Bot, pick a chat, then choose **Attach**. The photo, file, link, or text lands in that conversation's composer, so you can add the sentence that says what it is before you send. On Android, the share sheet currently accepts text only. A file from an Android phone goes in through the attach control in the chat.

## Ask for something you can check

The files page is specific about the result. Name the artifact and what makes it done:

- A document with headings and source links.
- A spreadsheet with defined columns and formulas.
- A slide deck with speaker notes.
- A folder of screenshots and logs.
- A draft message that has not been sent.
- A short recommendation followed by the evidence.

For work that matters, ask the Bot to keep five things apart. Facts found in source systems. Assumptions or inferences. Actions already completed. Actions waiting for approval. Unresolved questions.

Results come back as cards. Files, images, links, and tool results appear in the conversation, and opening a card previews supported formats. From there you can save the file, open the source link, or reply with feedback. When you want a change, ask for a revision of the same artifact, not a new copy. The page's example:

> Update the report you just created. Add source links to the first two claims and replace the final table with a CSV attachment.

Evidence is part of the result. Ask for direct source links, screenshots that show the relevant state, timestamps with time zones, the input and output file names, a short action log, and a list of anything the Bot could not verify. For fast-changing data, the page says not to rely on a screenshot alone. Keep a link or an export from the source.

Two more places files turn up. When a Bot hands coding work to a Cursor Cloud Agent, the Bot copies the images, videos, and files cited in the agent's final report to its computer and attaches them to its reply. [Episode 07](https://aitamer.news/posts/grok-bot-cowork-with-cursor/) is that handoff. And every Bot on your account can read what another Bot saved in `/workspace`. The files page asks for project folders and descriptive names there, and still wants the final result, or a clear link to it, in the conversation. [Episode 02](https://aitamer.news/posts/grok-bot-computer-the-box/) is that disk.

## In a group

Your messages in a group chat can include attachments, and a Bot's replies there can include files. The [chat page](https://docs.x.ai/grok-bot/chat-and-collaboration) adds one limit: Bot-to-group handoff messages are text only. When one Bot must inspect an image, the other Bot should send it to that Bot directly. [Episode 05](https://aitamer.news/posts/grok-bot-groups-teammates/) is the group.

## Three ways to talk

The [FAQ](https://docs.x.ai/grok-bot/faq) answers "Can I dictate or talk to a Bot?" with yes, three times over. They are different tools.

**Dictation** puts words in the composer. On desktop, choose **Start voice input**, or press Cmd/Ctrl+D while the prompt is focused. The [voice chat help page](https://cursor.com/help/grok-bot/voice-chat) adds that you can hold the keys while you talk. On iPhone and Android, tap **Start dictation**. You read the text, edit it, and send it like any message, and the Bot replies in text. Use it when the wording matters.

**Voice chat** is a live call with one Bot. Open that Bot's chat, leave the message box empty, and choose **Start voice chat**, the waveform button. The button only shows when the box is empty. If it is empty and the button is still missing, the help page says to update Grok Bot. Allow microphone access when asked. During the call you can mute, hang up, show the transcript, and change the voice, speed, and language, where **Auto-detect** follows what you say. On desktop you can open other chats and choose **Return to the voice chat**. Only one call runs at a time. A second one asks **End the current voice chat?** On the phone, stop dictation before you start a call.

Voice chat does not work in a group chat. It is one Bot at a time, from that Bot's own chat. On desktop, you can call a teammate's Team Bot from your own chat with it.

When you hang up, a **Voice chat** card appears in that Bot's chat with the call length. Open it for the full transcript. If the call left work, the Bot may follow up in the chat. If a call drops, Grok Bot first tries to reconnect on its own. If it cannot, the app shows **Voice chat failed**. Choose **Dismiss**, check the connection, and start again. A denied microphone is fixed in your system settings. The microphone itself is chosen in Grok Bot **Settings**, under **Microphone**.

**Voice memos** run the other way. A Bot can reply with a memo in the conversation. Choose **Play voice memo** to listen and **Pause voice memo** to stop, and expand it to read the transcript.

## Which one when

Type or dictate a request that has a stop line in it. A call is good for thinking out loud, and its transcript card keeps a record, but a rule you want kept belongs in a typed message that asks the Bot to remember it. [Episode 14](https://aitamer.news/posts/grok-bot-skills-and-memory/) is that memory. An email or Slack draft still waits for you to press **Send**.

## A pass you can do today

Attach two files with one sentence each that says what it is. Ask for one artifact with its columns or headings named, plus the line that the originals stay unchanged. Open the result card and ask for one revision of that same file. Then dictate a short follow-up with Cmd/Ctrl+D, fix a word before you send it, and finish with a two-minute voice chat. Open the **Voice chat** card afterward and check that the transcript says what you meant.
