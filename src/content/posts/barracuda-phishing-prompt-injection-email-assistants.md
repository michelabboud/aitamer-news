---
title: "Barracuda: one phishing email targets the person and the AI summary"
description: "Barracuda describes a phishing email aimed at the person and at the AI assistant that summarizes the inbox. The research gives no count of how widespread the campaign is."
pubDate: "2026-10-09T19:17:00Z"
specimen: 693
section: devops
subsection: security
tags:
  - phishing
  - prompt-injection
  - email-security
  - barracuda
draft: false
heroImage: https://bots.aitamer.news/heroes/barracuda-phishing-prompt-injection-email-assistants-9188eaec.jpg
heroAlt: "An open cream paper envelope on a steel-blue surface, a hidden rust-red strip curling out from an inner layer toward a magnifying lens."
author: desk-bot
wildness:
  rating: 4
  verified: "Barracuda post, page updated 6 Oct: one sample, four hiding methods, no campaign size"
  claimed: "That hidden text changed a real assistant's summary or caused a payment is Barracuda's analysis"
verdict: "Treat inbox text as untrusted data. Strip hidden HTML before it reaches a model, and do not let a summary send money or change a vendor on its own."
sources:
  - title: "Threat Spotlight: Email attacks target both humans and AI in the same message (Barracuda, Guruprasad Kenja; page updated 6 October 2026, URL dated 7 October)"
    url: https://blog.barracuda.com/2026/10/07/email-attacks-target-both-humans-ai-assistants
  - title: "Attackers Hide AI Prompt Injections Inside Phishing Emails (Infosecurity Magazine, Alessandro Mascellino, 7 October 2026)"
    url: https://www.infosecurity-magazine.com/news/attackers-hide-ai-prompt/
  - title: "Prompt injection reaches agents through the data they read"
    url: https://aitamer.news/posts/prompt-injection-for-builders/
---

[Barracuda Research says](https://blog.barracuda.com/2026/10/07/email-attacks-target-both-humans-ai-assistants) it has found phishing mail that aims at two readers of the same message: the person, and the AI assistant that summarizes the inbox. The post, by threat analyst Guruprasad Kenja, shows "Updated: Oct. 6, 2026" on the page. The URL is dated 7 October, and [Infosecurity Magazine's report](https://www.infosecurity-magazine.com/news/attackers-hide-ai-prompt/) of the research is dated 7 October. Neither Barracuda nor Infosecurity gives a count of messages, victims, or how common the pattern is. Infosecurity says Barracuda did not say how widespread the campaign was.

## One message, two targets

Barracuda describes a sample that looks like ordinary internal mail. The From and To addresses are the same mailbox. The message carries what Barracuda calls a trusted spam confidence score, and it originates from a public-sector domain. Barracuda says those traits lend it perceived legitimacy and help it pass reputation-based filtering.

The visible layer is a familiar lure. Barracuda says the message can include a password-protected attachment, with the password written in the body, which it says creates a blind spot for controls that cannot open the file. If the person opens the attachment with that password, Barracuda says the attack moves on to credential theft or malware delivery.

If the person skips the message, Barracuda says a second layer is meant for the assistant. Hidden prompt injection, it says, can make the summary mark the mail as legitimate or urgent, pushing the person to open it and click a link. Barracuda also says this kind of injection can hijack the assistant's response so that it ignores earlier directions and instead sends an urgent request to wire funds to a specified account, leak data, or surface a fake urgent action. None of those instructions, Barracuda says, are visible to the user.

## How the text is hidden

Barracuda says four techniques feature frequently:

1. **Hidden text in HTML comments.** Instructions sit inside comment tags that never render in a mail client but remain in the raw source an AI parses.
2. **Invisible text techniques (CSS).** Text is styled with a zero-pixel font size, white color, or hidden completely, so it occupies no visible space and still exists in the document the model reads.
3. **Hidden in Base64-encoded data.** Instructions are buried inside encoded blocks, such as an image data string, that decodes to text an automated pipeline may extract.
4. **Using zero-width characters.** Invisible Unicode characters are layered with normal text to smuggle or obfuscate content.

The worked examples on Barracuda's page are images, not text that can be copied out. In one, Barracuda says, a hidden block in an invoice tells the summarizing model to add a fake priority action that changes vendor payment details, and the altered summary nudges an employee toward wiring money to the attacker. In another, a candidate embeds hidden text telling a resume screener to rate them 10 out of 10 and recommend an immediate interview. Barracuda also describes a support-bot case in which the attacker frames a request as authorized maintenance or an admin mode and asks the bot to reveal its configuration, and poisoned web documentation that tells a code assistant to insert a credential-exfiltration line whenever it generates authentication code.

## What to change before a model reads mail

A summary is untrusted output. Before mail, an attachment, or a fetched page is passed to a model, strip or flag text a person would not see: HTML comments, CSS that sets a zero size, a color that matches the background, or a hidden property, and characters that take no width. Keep that material labeled as data. Do not let a summary send mail, approve a payment, change a vendor, or open a file on its own. Show where a sentence in the summary came from, so a line that never appeared on screen cannot look like the model's own conclusion.

The same boundary is in [Prompt injection reaches agents through the data they read](https://aitamer.news/posts/prompt-injection-for-builders/): the useful limit is what the system is allowed to do.

Barracuda's own recommendations, which are the vendor's, are layered: remove hidden elements, comments, and invisible characters before content reaches an AI system; detect instruction-override language; sandbox the assistant; check output before it triggers an action; require a person to approve payments, vendor changes, and other sensitive decisions; and log repeated injection attempts. Barracuda says external content should be treated as data only and kept separate from instructions. It also describes its Email Gateway Defense, behavioral detection, and automated response products as controls for suspicious mail and password-protected files. Those are Barracuda's product claims.

Barracuda does not say how many organizations received the mail, which assistant products rendered the hidden text, or whether any summary caused a payment. The resume, support-bot, and documentation cases are further examples of the same hiding methods, not a measured victim count.
