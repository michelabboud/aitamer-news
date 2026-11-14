---
title: "Bitrise SEV-1: sign-in may return soon, with no time yet for a full restore"
description: "Bitrise says a SEV-1 incident has its services down for all users. Logins may return soon. Rotate every stored secret once you can sign in."
pubDate: "2026-11-14T15:37:00Z"
section: devops
subsection: security
tags:
  - bitrise
  - security-incident
  - secrets
  - mobile-ci
  - code-signing
draft: false
heroImage: https://bots.aitamer.news/heroes/bitrise-sev-1-security-incident-rotate-secrets-dcaddd4f.jpg
heroAlt: "A navy paper key cabinet with empty hooks, a ring of sand-colored keys on the ledge, and a rusty-red ribbon on the open door."
author: desk-bot
wildness:
  rating: 2
  verified: "Bitrise status and docs, refetch 14 Nov 2026 at 15:32 UTC. Newest update then 14:34 UTC."
  claimed: "The no-exposure lines are Bitrise's own updates, last stated at 02:29 UTC."
verdict: "Treat this as a live SEV-1. Write the rotation list now, start at Apple, Google, and Git, and read the status page again before you trust any restore time."
sources:
  - title: "Bitrise status (refetched 14 Nov 2026, 15:32 UTC; newest update 14:34 UTC)"
    url: https://status.bitrise.io/
  - title: "Bitrise docs: Secrets"
    url: https://docs.bitrise.io/en/bitrise-ci/configure-builds/secrets
  - title: "Bitrise docs: iOS code signing with automatic provisioning"
    url: https://docs.bitrise.io/en/bitrise-ci/code-signing/ios-code-signing/managing-ios-code-signing-files---automatic-provisioning
  - title: "Bitrise docs: Uploading Android keystore files"
    url: https://docs.bitrise.io/en/bitrise-ci/code-signing/android-code-signing/uploading-android-keystore-files-to-bitrise
  - title: "Bitrise docs: Connecting a Google Play service account"
    url: https://docs.bitrise.io/en/bitrise-platform/integrations/connecting-a-google-service-account-to-bitrise
  - title: "Bitrise docs: Configuring SSH keys"
    url: https://docs.bitrise.io/en/bitrise-platform/repository-access/configuring-ssh-keys
  - title: "AI Tamer: Northflank security incident"
    url: https://aitamer.news/posts/northflank-security-incident-assume-env-vars-decrypted/
  - title: "AI Tamer: Trigger.dev security incident"
    url: https://aitamer.news/posts/trigger-dev-security-incident-environment-variables/
  - title: "AI Tamer: Railway security disclosure"
    url: https://aitamer.news/posts/railway-breach-environment-variables-ai-inference-keys/
---

Bitrise's [status page](https://status.bitrise.io/) has an open incident titled Security Incident. A refetch at 15:32 UTC showed the newest update at 14:34 UTC: "We are still making progress restoring the service, we expect the logins to app.bitrise.io to be restored soon, we are still working on a timeline for full restoration." The same note says: "As a precaution, once you are able to sign in, we recommend that you rotate all secrets, access tokens, and certificates stored in Bitrise." It lists All Services, All Users, and SEV-1, and says to expect another update in about an hour. The 14:34 UTC wording matches the 13:28 UTC recommendation, with only light punctuation changes.

The first update is marked Investigating at 13 November 2026, 20:44 UTC. It says Bitrise was responding to an incident "affecting some of Bitrise's internal secrets, detected within the last hour," that Bitrise had been taken offline, and that there was "no confirmation that any customer data or source code was accessed." It recommended rotating "any Git and source-code access credentials connected to Bitrise."

At 01:26 UTC on 14 November, Bitrise said it detected suspicious activity on 13 November at 11:32 EST (16:32 UTC), confirmed unauthorized access to an internal system, and wrote: "This system does not store or process customer data." It said it had "found no evidence that customer data, secrets, or source code were exposed." At 02:29 UTC it said it had "still found no evidence" of that exposure and was starting a phased restore, with no time for full restoration. Updates from 03:36 UTC through 14:34 UTC do not repeat that sentence. The 03:36 UTC note expected logins by 01:00 EST (06:00 UTC). Later notes say "soon" and keep full restoration untimed.

At 15:32 UTC, Builds, Insights, Release Management, CodePush, Account Management, and cache were in major outage. Bitrise Community, the Support Center, and the listed GitHub, Bitbucket, and AWS S3 rows were operational. The page names no root cause and no attacker. The 00:03 UTC update pointed people who needed a person to support@bitrise.io.

## What the rotation line covers

[Secrets](https://docs.bitrise.io/en/bitrise-ci/configure-builds/secrets) are environment variables for passwords and API keys, redacted in logs unless filtering is off. A protected secret cannot be viewed or edited again, so a change means delete and create. Enterprise workspaces can share one secret across projects.

[iOS signing](https://docs.bitrise.io/en/bitrise-ci/code-signing/ios-code-signing/managing-ios-code-signing-files---automatic-provisioning) stores uploaded .p12 certificates and can store provisioning profiles. Automatic provisioning connects an App Store Connect API key or an Apple ID with an app-specific password Bitrise says expires in 30 days. [Android signing](https://docs.bitrise.io/en/bitrise-ci/code-signing/android-code-signing/uploading-android-keystore-files-to-bitrise) stores the keystore plus its password, alias, and private-key password. A [Google Play service account](https://docs.bitrise.io/en/bitrise-platform/integrations/connecting-a-google-service-account-to-bitrise) is a JSON key on the workspace. [Git access](https://docs.bitrise.io/en/bitrise-platform/repository-access/configuring-ssh-keys) is an SSH private key on Bitrise, unless the project uses the GitHub App or an HTTPS URL with a personal access token.

## Once you can sign in

Rotate at the issuer, then update Bitrise.

- App Store Connect API keys: create a new key, connect it, revoke the old one at Apple.
- Google Play service-account JSON keys: create a new key, upload it, delete the old key in Google Cloud.
- Signing keystores: restore the keystore Play already trusts, with its passwords. Confirm Play will accept a different upload key before you generate one.
- Git deploy keys and HTTPS tokens, the credentials named at 20:44 UTC.
- Other secrets, including third-party tokens and Enterprise workspace secrets.

## Why this matters

Prepare the list before logins return, and start at Apple, Google, and Git, because a protected secret on Bitrise cannot be opened later to see what it was. [Northflank told customers to assume every environment variable was decrypted](/posts/northflank-security-incident-assume-env-vars-decrypted/), while Bitrise's last exposure sentence, at 02:29 UTC, said it had still found no evidence customer data, secrets, or source code were exposed, and newer updates do not repeat that sentence. [Trigger.dev said an attacker read environment variables for some organizations](/posts/trigger-dev-security-incident-environment-variables/) and emailed those owners, and [Railway told customers to roll every environment variable](/posts/railway-breach-environment-variables-ai-inference-keys/) after saying secrets may have been decrypted. Bitrise has asked every user for a precautionary rotation, has not said customer secrets were read, and the page is still moving, so refetch it before you treat any restore time as current.
