---
title: A Passkey Can Find the Account for You
description: Discoverable passkeys let sign-in start with credential selection. The site identifies the account from the response and verifies it.
pubDate: "2026-10-06T07:30:00Z"
specimen: 303
section: general
tags:
  - passkeys
  - webauthn
  - authentication
  - digital-identity
draft: false
heroImage: https://media.aitamer.news/heroes/a-passkey-can-find-the-account-for-you-9254dfab.jpg
heroAlt: A hand selects an account icon as a key leads toward an unlocked account doorway.
author: ari
wildness:
  rating: 2
  verified: WebAuthn permits an empty credential list and returns a user handle for account lookup.
  claimed: A passkey can let you choose an account before entering a username.
verdict: Discoverable credentials change sign-in order. The credential can identify the account, while the site must still verify the signed response.
sources:
  - title: "Web Authentication: An API for accessing Public Key Credentials Level 3"
    url: https://www.w3.org/TR/webauthn-3/
---

A sign-in page can let a person choose a passkey before entering a username. The [WebAuthn specification](https://www.w3.org/TR/webauthn-3/) calls the credential behind this flow a *discoverable credential*. It gives the browser or authenticator enough information to find credentials for the site. After the person chooses one, the site can learn which account it belongs to.

That changes the order of sign-in. A familiar flow asks for an email address, finds the account, and then offers the credentials linked to it. A discoverable passkey lets the credential selection come first. The site still has to check the response before granting access.

## The credential carries an account handle

When a site registers a passkey, WebAuthn associates it with an account. The authenticator creates a private key and gives the site a public key to store with that account. A discoverable credential also carries a *user handle*: an identifier that links it to the account. The handle is meant for the site, rather than for display to a person. The specification says it must not contain a username or email address. [WebAuthn describes the credential and user handle](https://www.w3.org/TR/webauthn-3/).

The site also gives the credential a relying party ID. This is the site's identity for WebAuthn. An authenticator can find discoverable credentials using that ID, even when the site supplies no credential IDs. The credential therefore has a way to answer, in effect, “I belong to an account at this site.” The site can look up the account after the credential responds.

A passkey provider may show a readable account name so the person can choose among credentials. That label helps with selection. It is separate from the user handle that the site uses for account decisions. A person can have more than one discoverable credential for the same site, and the client can present a choice. [The specification describes this selection](https://www.w3.org/TR/webauthn-3/).

## An empty list changes the sign-in order

A site starts authentication by asking WebAuthn for a credential. The request can contain an `allowCredentials` list. If the site already knows the account, it can fill that list with credential IDs registered to the account. A username entered earlier is one way to identify it. [WebAuthn sets out both request paths](https://www.w3.org/TR/webauthn-3/).

For account discovery, the site leaves the list empty. WebAuthn then uses discoverable credentials for that site's ID. If several are available, the browser, device, or authenticator lets the person choose. The selected credential returns an authentication response with a user handle. In this flow, WebAuthn requires the authenticator to return that handle.

The site finds the account named by the handle and checks that the returned credential ID is registered to it. It also checks the challenge, the expected site origin, the relying party ID, and the signature using the stored public key. These checks are why an account name shown in a picker cannot, by itself, sign anyone in. [WebAuthn specifies the server checks](https://www.w3.org/TR/webauthn-3/).

## The visible prompt can take different forms

The interface does not have to look the same everywhere. The WebAuthn use case shows a browser or operating system asking for a device PIN or biometric gesture when a synced passkey is available. It also shows a phone being used when the passkey is unavailable on the computer. A phone can display several identities for the same site so the person can select one. [Those examples are in the specification](https://www.w3.org/TR/webauthn-3/).

A site can also offer passkeys alongside a username field. With conditional mediation, selecting a field marked for WebAuthn can bring up available credentials. The person can choose a credential from the suggestion without typing the username first. The specification describes this as a user choice; the page does not silently select an account and sign in. [WebAuthn describes the conditional prompt](https://www.w3.org/TR/webauthn-3/).

A site may still ask for a username. WebAuthn allows the site to identify the account first and send a list of its registered credential IDs. A discoverable credential works in that flow too. The ability to find an account does not force every site to use a username-free screen. [Both uses are covered by WebAuthn](https://www.w3.org/TR/webauthn-3/).

## The account still belongs to the site

The passkey's account handle does not make the device the account database. During registration, the site stores a credential record under the account, including the credential ID and public key. During a username-free sign-in, it checks that the handle identifies an account containing the returned credential ID. Then it verifies the signed response. [The registration and authentication steps appear in WebAuthn](https://www.w3.org/TR/webauthn-3/).

That division matters if a passkey is missing from a device. A credential must be available through an authenticator or provider before it can be selected. The specification's example moves to an external authenticator when a synced passkey is unavailable on the computer. The site's own sign-in and recovery options determine the other routes it offers. WebAuthn does not promise that every passkey appears on every device.

## What to do

If a site offers passkey creation, add one to the account you intend to use. On the next visit, look for a passkey sign-in button or a passkey suggestion in the sign-in field. Choose the account shown by your device or passkey provider. Complete the device's PIN or biometric prompt. These are the steps illustrated by [WebAuthn's sign-in examples](https://www.w3.org/TR/webauthn-3/).

If no account appears, check whether that passkey is available on the current device or through an external authenticator such as your phone or security key. Use the site's other sign-in route if needed. Before depending on one device, review the site's account recovery choices and the way your passkey provider makes credentials available elsewhere.

For a site building this flow, create discoverable credentials for the accounts that should support it. Start sign-in with an empty `allowCredentials` list when the account is unknown. After selection, map the returned user handle and credential ID to the same stored account, then complete the challenge, origin, relying party ID, user presence, and signature checks. Keep the account label clear in the picker, and give people an understandable route when their passkey is unavailable. [The WebAuthn specification provides the required verification sequence](https://www.w3.org/TR/webauthn-3/).
