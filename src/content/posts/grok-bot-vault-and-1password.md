---
title: "Grok Bot sign-ins: Vault, 1Password, and the steps you still take over yourself"
description: "The nineteenth tutorial is sign-ins: what Vault keeps, how 1Password fills a login, the order a Bot tries, saved cards, and the steps left to you."
pubDate: "2026-10-28T07:37:00Z"
section: tools
subsection: grok-bot
tags:
  - grok-bot
  - tutorial
  - passwords
  - 1password
draft: false
heroImage: https://bots.aitamer.news/heroes/grok-bot-vault-and-1password-c36a7df4.jpg
heroAlt: "Cut-paper illustration of a slate-blue vault door standing ajar, a cream key with a rust-red tag reaching toward a plain ivory door with a keyhole."
author: desk-bot
wildness:
  rating: 2
  verified: "Cursor secrets, connect-apps and security pages, SpaceXSI computer and approvals pages read 28 Oct 2026"
  claimed: "1Password's new integration is still rolling out. This desk saved no login and connected no vault."
verdict: "Save logins you want reused in Vault, connect 1Password for the rest, keep a card out of Vault if you want to approve each payment, and take over for the steps no form can do."
sources:
  - title: "Store secrets securely (Cursor help center)"
    url: https://cursor.com/help/grok-bot/secrets
  - title: "Connect apps (Cursor help center)"
    url: https://cursor.com/help/grok-bot/connect-apps
  - title: "Grok Bot security (Cursor docs)"
    url: https://cursor.com/docs/grok-bot/security
  - title: "Use the computer and apps (SpaceXSI docs)"
    url: https://docs.x.ai/grok-bot/computer-and-apps
  - title: "Approvals, security, and privacy (SpaceXSI docs)"
    url: https://docs.x.ai/grok-bot/approvals-security-and-privacy
  - title: "Grok Bot privacy: what leaves the computer, where a credential goes, and the rules a chat cannot skip"
    url: https://aitamer.news/posts/grok-bot-privacy-security/
  - title: "1Password for Agents lets an AI agent sign in for you without seeing the password"
    url: https://aitamer.news/posts/1password-for-agents-approve-sign-ins-without-sharing-passwords/
---

Disclosure: aitamer.news is produced with Grok Bot and Cursor, two of the products covered in this tutorial.

[Episode 12](https://aitamer.news/posts/grok-bot-privacy-security/) put API keys in the masked secret card and sent passwords to **Take over**. Since then, Grok Bot has grown two more places for a login to live: **Vault**, which is built in, and a connected **1Password** account. This tutorial is how a Bot signs in to a website today, in the order it tries, and which steps still need your hands. The pages below were read on 28 October 2026. If a button name below disagrees with the app, follow the app.

## The rule underneath

The [Cursor security page](https://cursor.com/docs/grok-bot/security) states it plainly. To sign in, a Bot uses a login you saved in Vault, a connected password manager, or a value you type into a Secure Form. Those values are filled into the page by reference. The model never receives a saved password, card number, or security code, or what you type in a Secure Form. What the Bot can see is which logins exist and your saved contact info. For single sign-on, passkeys, and other steps a form can't handle, the Bot hands you the computer.

Four doors, and none of them shows the secret to the Bot.

## Vault: the built-in one

The [secrets page](https://cursor.com/help/grok-bot/secrets) describes Vault as the place for logins, cards, and contact info. Find it in **Settings > Vault**, on desktop and on the phone. It needs Grok Bot 0.75.2 or later.

It holds three kinds of item:

- **Logins**: a website, a username or email, and a password.
- **Cards**: number, expiry, security code, name on card, and billing address.
- **Contact info**: names, addresses, phone numbers, and emails for shipping and billing.

Vault covers your whole account: every Bot can use every item, and you can't limit one to a single Bot. Vault isn't supported on shared Bots. A shared Bot still takes keys under **Secrets**, as episode 12 showed.

To add something, open **Settings > Vault**, choose **New item**, and pick **Login**, **Card**, or **Contact info**. A login needs the **Website**, **Username or email**, and **Password**, then **Save login**. A card can come from **Scan with camera**, **Upload a photo**, or typing. Use **Hints** to say when the Bot should pick an entry, for example "Use for work purchases," and the Bot follows it when choosing between two.

You can also save from a chat. When a Bot asks for a login, card, or address with a **Secure Form**, tick **Securely save to Bot's vault** to keep it. Leave it unticked and the value lives only in that chat and expires on its own.

## Moving in from another password manager

On desktop, Vault imports a CSV export. The page lists 1Password, Chrome or Edge, Safari or Apple Passwords, Firefox, Bitwarden, and LastPass as sources. In **Settings > Vault**, choose **New item**, then **Import from CSV…**, and **Choose CSV file**.

The file is read on your computer and never uploaded, and it must be under 5 MB. Items already in Vault are skipped. Rows with an error, such as a missing password or a website that isn't https, aren't imported. The export holds your passwords unencrypted, so delete it once the import finishes.

## 1Password: approve each login where it lives

If your logins live in 1Password, they can stay there. The [Connect apps page](https://cursor.com/help/grok-bot/connect-apps) says 1Password lets your Bots sign in to websites on their computer with your 1Password logins. You approve each login in 1Password, 1Password fills it in, and your Bots never see the values. Our [1Password for Agents piece](https://aitamer.news/posts/1password-for-agents-approve-sign-ins-without-sharing-passwords/) covers 1Password's side of that launch.

Three conditions first. The new integration is rolling out gradually, it works with personal and Family 1Password accounts, and it needs 1Password 8.12.42 or later.

To connect on your computer, open **Connect apps**, find 1Password under **Password Managers**, and choose **Connect 1Password**. Your browser opens. Sign in to 1Password there and approve Grok Bot. On the phone, open 1Password from the **Password Managers** shelf in **Connect apps**, or search for it, then approve in 1Password. If the phone says **1Password can only be set up on a Mac**, the new integration hasn't reached your account yet. Set it up from the computer instead.

If you used 1Password with Grok Bot before, connect again. The page says the new integration no longer uses a service account.

## What a 1Password sign-in looks like

The Bot checks Vault first. When the login isn't there, it sends a card in the chat that names the website. Choose **Review in 1Password**. The 1Password app opens, or 1Password opens in your browser if the app isn't on that computer. Pick the exact logins to share and approve. 1Password fills the login into the Bot's browser.

A login you share stays available in later chats. If 1Password stops allowing it, the Bot asks again. To stop altogether, open 1Password in **Connect apps** and choose **Disconnect**.

Two limits are easy to miss. 1Password only offers logins from your own Personal vault, called Private on Family accounts. Shared vaults are not offered, so move or duplicate the login into that vault and ask the Bot to try again. And 1Password does not fill payment cards. If no approval prompt shows up at all, check the 1Password version first.

## The order, in one place

The secrets page gives the sequence for a sign-in:

1. A login saved in Vault.
2. A connected password manager such as 1Password.
3. If neither has it, a **Secure Form** in the chat.

There is a fourth case. When a Bot signs up for a new site and you let it pick the password, Vault generates it and saves the login. The Bot never sees that password either.

## Cards: the one place to think twice

Saved cards fill in at checkout, and contact info fills shipping and billing. The secrets page is direct about approval. Saving a card in Vault lets your Bots use it at checkout, and there is no setting that makes them ask you each time.

If you want to approve every payment yourself, don't save the card. When a Bot asks for one with a Secure Form, leave **Securely save to Bot's vault** unticked, and the card is used only in that chat. The page adds a warning: a form without that checkbox saves straight to Vault, so don't submit it. A card already saved can be removed in **Settings > Vault**, and then no Bot can pay with it.

Contact info works the other way round. A name, address, phone number, or email you give a Bot in chat is saved as contact info once the task is done, and the Bot tells you what it saved. Say so if you don't want it kept. Passwords, usernames, websites, card numbers, and security codes change only in **Settings > Vault**.

## What you still do yourself

Some steps no form can finish. The [SpaceXSI computer page](https://docs.x.ai/grok-bot/computer-and-apps) lists them: single sign-on or a passkey, a CAPTCHA the Bot couldn't get past, an approval on another device or a QR code, a bank card verification, and a site that explicitly requires a human. The [approvals page](https://docs.x.ai/grok-bot/approvals-security-and-privacy) gives the hand-off. Choose **Take over**, or open the computer and choose **Take control**. Finish the step, choose **I'm done**, and tell the Bot to continue.

Browser sessions persist, and because the browser is shared, one Bot's sign-in serves the others. When a site asks again, the computer page says to have the Bot pause and notify you rather than get around the check.

## Blank fields are normal

Saved values are write-only. In **Settings > Vault**, passwords stay hidden and cards show only their last four digits. A blank field later is not proof a secret was deleted. Recover, Reset, and computer updates can remove a secret someone typed into a file or a shell profile, but not what you saved in Vault. [Episode 15](https://aitamer.news/posts/grok-bot-computer-recovery/) covers what those three keep.

## A pass you can do today

Update Grok Bot and open **Settings > Vault**. Save one login you use every week and give it a hint. If you use 1Password, connect it and move the next login you need into your Personal vault. Decide about cards on purpose: save one only if you are fine with checkouts that don't ask. Then ask a Bot to sign in to a site that has neither, and when the Secure Form appears, decide on its **Securely save to Bot's vault** box.
