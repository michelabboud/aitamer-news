---
title: Undo belongs in the AI editor
description: A generated edit should move from a visible preview to deliberate acceptance and a reversible change. Here is a practical standard for keeping control of your work.
pubDate: "2026-10-06T16:30:00Z"
specimen: 212
section: general
tags:
  - ai-editors
  - undo
  - accessibility
  - design
draft: false
heroImage: https://media.aitamer.news/heroes/undo-belongs-in-the-ai-editor-146d4d53.jpg
heroAlt: A coral paper tile hovers above an open cream drawer, tethered by a looping blue thread to suggest a preview that can be accepted or returned.
author: ari
wildness:
  rating: 3
  verified: W3C submission safeguards and Microsoft AI interaction guidelines were checked directly.
  claimed: The proposed editor workflow is design judgment, not a tested product.
verdict: Inspect the exact change before accepting it. Keep an undo path that restores the old text without discarding later work.
sources:
  - title: "W3C: Understanding Error Prevention (Legal, Financial, Data)"
    url: https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html
  - title: Guidelines for Human-AI Interaction, Table 1
    url: https://www.microsoft.com/en-us/research/wp-content/uploads/2019/01/Guidelines-for-Human-AI-Interaction-camera-ready.pdf#page=3
---

Imagine a marked-up release note. Deleted words are crossed out, proposed words are highlighted, and one **Undo** button sits beside the edit. The writer asked an AI editor to make two paragraphs shorter. The result reads smoothly. It also changes “We plan to ship on Friday, pending final checks” to “The update ships Friday.” That lost condition matters more than the saved words.

The writer needs a clear path through three moments: seeing the proposed change, choosing what to accept, and reversing that choice if it proves wrong. Microsoft researchers’ [human-AI interaction guidelines](https://www.microsoft.com/en-us/research/wp-content/uploads/2019/01/Guidelines-for-Human-AI-Interaction-camera-ready.pdf#page=3) call for easy dismissal and correction when an AI system gets something wrong. They also recommend limiting a service’s scope when the user’s goal is uncertain. An editor can turn those principles into visible controls.

## Preview the change in place

A preview should show the original passage and the proposed passage together. Mark each deletion and insertion. Name the area the edit will affect: the selected sentence, the two chosen paragraphs, or the whole page. If the request was “shorten this paragraph,” a changed heading elsewhere needs to appear in the preview too.

For the release note, the preview exposes the missing condition. The writer can keep the original first sentence, revise the proposed wording, and accept a useful change in the second paragraph. A polished replacement shown by itself makes that decision harder. The reader has to remember every qualification in the original text while judging the new one.

The preview also needs a straightforward **Dismiss** action. Microsoft’s guidelines distinguish dismissal from correction: a person may want to ignore a suggestion, edit it, or recover after accepting it. Those are different decisions. Sending the writer back to the prompt box for every objection makes the document carry the cost of a poor suggestion.

When a request has several plausible meanings, the editor should narrow its action. “Clean this up” might refer to grammar, length, tone, or structure. A bounded proposal gives the writer something specific to inspect. The editor can offer a broader pass after the writer sees the first result.

## Make acceptance a defined event

Acceptance should change only the material shown in the preview. The control should say what will happen, such as “Apply these changes to two paragraphs.” If some proposed changes were rejected, they should stay rejected when the rest are applied.

At that moment, the editor should retain enough information to reverse the accepted change: what the passage said before, what was applied, and where it was applied. The writer should see a clear indication that the change landed. A visible **Undo AI edit** action next to that indication is easier to understand than a general history menu whose next step is uncertain.

This is a proposed design standard. I am not attributing it to any particular product. Its purpose is to make the writer’s decision legible. “Accept” should have one predictable effect. Saving a draft, sharing a page, and publishing it need separate actions.

The distinction becomes sharper when an edit affects stored or consequential information. The W3C’s [guidance on error prevention](https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html) describes safeguards for certain web submissions involving legal commitments, financial transactions, user-controlled stored data, or test responses. Its criterion allows a reversible submission, an opportunity to correct checked errors, or a way to review and correct information before final submission. The guidance explicitly says ordinary document editing does not require confirmation for every save. An AI editor does not inherit a blanket rule to interrupt every keystroke. The useful lesson is to give people a way to inspect and correct a consequential action.

## Undo the accepted edit

Now suppose the writer accepts the shorter release note. Ten minutes later, they add a link in another paragraph. Then they notice that the accepted edit weakened a second qualification. They press **Undo AI edit**.

A good result restores the text changed by that accepted edit and leaves the new link alone. Replacing the entire page with an old snapshot would discard work done since acceptance. The editor needs to treat the accepted change as a distinct action that can be reversed within the current document.

There is a harder case. Suppose the writer manually revises a sentence *inside* the accepted AI passage before pressing Undo. Restoring the old sentence without warning would erase that manual revision. The editor should show the conflict and let the writer choose which wording to keep. It can offer the original text for reference without silently writing over the newer work.

Undo should remain findable after the brief message beside the edit disappears. A history entry labelled with the affected passage and the action taken can help the writer locate the right change. It should be possible to inspect what reversing that entry would do before applying it, especially after further edits. Microsoft’s guidance to support efficient correction includes editing, refining, and recovering when the system is wrong. Recovery has to work after the writer has carried on working.

The same reasoning applies to a failed reversal. If the editor cannot safely identify the affected text, it should say so and present the earlier wording for manual recovery. A button that appears to succeed while leaving part of the generated change behind gives the writer a false account of the document.

## Separate document undo from outside effects

Reversing text in an editor cannot recall a message already sent or remove a copy someone has already read. If acceptance also triggers an outside action, the interface should state that effect before the writer commits to it. Publishing needs its own review and confirmation path. The writer should know whether Undo will change a local draft, a published page, or both.

This boundary also keeps the preview honest. A generated edit might alter a link destination, a heading used for navigation, or a claim that a reader will rely on. The preview should show those changes as changes, even when they occupy only a few characters. Smooth prose is a poor substitute for seeing the exact action being authorized.

## Try the whole path

A practical check for an AI editor takes one sample document and a few minutes:

1. Ask it to revise a selected passage. Check whether the preview shows every changed word and the full area affected.
2. Reject one proposed change and accept another. Check that only the accepted change lands.
3. Make a manual edit elsewhere, then undo the accepted AI edit. Check that the manual edit survives.
4. Repeat with a manual edit inside the accepted passage. Check that the editor presents the conflict before replacing the newer text.
5. Find the accepted change in history and inspect the reversal offered there.

This tests the editing path. It says nothing about the model’s writing quality. A useful sentence can still be the wrong change for a particular document. The writer remains in control when they can see the proposed edit, choose its scope, and recover their earlier work without sacrificing what they wrote afterward.
