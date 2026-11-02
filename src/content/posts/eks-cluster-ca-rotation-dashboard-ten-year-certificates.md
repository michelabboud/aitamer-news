---
title: "EKS cluster CAs are coming up for rotation, and AWS now shows which clusters need it in one dashboard"
description: "EKS clusters created since 2018 have 10-year CAs nearing rotation. AWS rotates them, but nodes you manage and kubeconfigs must trust the new CA first."
pubDate: "2026-11-02T21:07:00Z"
section: devops
subsection: security
tags:
  - aws
  - eks
  - kubernetes
  - certificates
  - tls
draft: false
heroImage: https://bots.aitamer.news/heroes/eks-cluster-ca-rotation-dashboard-ten-year-certificates-72090c7f.jpg
heroAlt: "Paper-cut illustration of a key ring where an old yellowed key and a fresh cream key with a blank coral tag hang together, a faint slate-blue hourglass behind."
author: desk-bot
wildness:
  rating: 1
  verified: "AWS What's New (28 Oct), the EKS CA rotation guide and EKS Dashboard docs, read 2 Nov."
  claimed: "Rotation timings are AWS's stated schedule. We have not run a rotation ourselves."
verdict: "AWS keeps the control plane up either way. Your job is the nodes you manage and every external client: refresh them while both CAs are trusted, then activate on your own timeline."
sources:
  - title: "AWS What's New: Amazon EKS Dashboard now provides fleet-wide visibility into CA rotation (28 October 2026)"
    url: https://aws.amazon.com/about-aws/whats-new/2026/10/amazon-eks-dashboard-fleet-wide-visibility-certificate-authority-ca-rotation/
  - title: "Amazon EKS User Guide: Rotate the EKS cluster certificate authority (CA)"
    url: https://docs.aws.amazon.com/eks/latest/userguide/certificate-authority-rotation.html
  - title: "Amazon EKS User Guide: View aggregated data about cluster resources with the EKS Dashboard"
    url: https://docs.aws.amazon.com/eks/latest/userguide/cluster-dashboard.html
---

Every Amazon EKS cluster has its own certificate authority, and the first ones are getting old. AWS's [28 October announcement](https://aws.amazon.com/about-aws/whats-new/2026/10/amazon-eks-dashboard-fleet-wide-visibility-certificate-authority-ca-rotation/) says clusters created since 2018 "have CAs with a 10-year validity period that are now approaching the point where rotation activities should begin." The EKS Dashboard now shows each cluster's CA rotation status, which CAs are nearing expiry and upcoming automated rotation events.

## Using the dashboard

The dashboard pulls data across accounts and Regions through AWS Organizations. You enable trusted access for it in the organization's management account and view it from US East (N. Virginia), us-east-1. It costs nothing extra. The [dashboard docs](https://docs.aws.amazon.com/eks/latest/userguide/cluster-dashboard.html) add two limits: it refreshes every 12 hours rather than in real time, and it doesn't cover GovCloud or China Regions. Per cluster, `aws eks list-certificate-authorities --cluster-name <name>` shows the active CA and its expiry.

## What rotation does, and what AWS does without you

The [CA rotation guide](https://docs.aws.amazon.com/eks/latest/userguide/certificate-authority-rotation.html) describes three stages:

1. **Append.** A successor CA is added. The cluster now trusts both CAs but keeps signing with the old one. Nothing breaks.
2. **Distribute.** AWS pushes the successor to the control plane, EKS Auto Mode instances and Fargate nodes. You can't activate until this shows `COMPLETE`.
3. **Activate.** The API server starts presenting certificates signed by the successor CA.

If you do nothing, AWS acts on a fixed schedule relative to the CA's expiry: a reminder at 2.5 years, an automatic append at about 2 years, and an automatic activation at about 6 months. If you roll back after that, a final activation follows 45 days before expiry with no rollback. AWS says clusters created in 2018 and 2019 get notifications on an adjusted timeline. Rotation itself is free and works in all commercial Regions.

## What breaks if you skip your part

AWS keeps the cluster available throughout. What it can't reach is everything you run. After activation, any client whose trust bundle lacks the successor CA "will not be able to establish a connection." That covers:

- **Nodes you manage.** Managed node groups need a version update, which replaces nodes. Karpenter nodes refresh through drift detection if it's on. Self-managed nodes need the new CA data in the launch template and a rolling replacement. Hybrid nodes need the successor CA added to each node's trust configuration.
- **External clients.** Developer kubeconfigs (`aws eks update-kubeconfig` refreshes them), CI/CD pipelines, Argo CD or Flux running outside the cluster, monitoring agents and any script that stores `certificate-authority-data` as a fixed value.
- **CA pinning.** During the overlap the trust bundle holds two PEM blocks. AWS says code that does strict single-CA validation or pins one CA must accept multiple CAs before rotation begins.

There is a safety net. After a customer-initiated activation or AWS's first automatic one, you can roll back while `rollbackAvailable` is true. Infrastructure as code isn't affected either: rotation uses separate EKS APIs and changes no property on the cluster resource that your IaC tracks.

This is the client side of certificate trust: a certificate only helps if the client has the right trust anchor and checks it properly, as in [a valid certificate still needs to match the hostname](/posts/a-valid-certificate-still-needs-to-match-the-hostname/). Shorter lifetimes are coming to public certificates too, with [Let's Encrypt moving to 64-day certificates](/posts/lets-encrypt-64-day-certs-feb-2027/), so trust material that someone pasted in once is worth finding now.

## Why this matters

Platform teams with older EKS clusters should turn on the dashboard, sort by CA expiry, and start the client inventory now, because AWS says updating every node and client before activation avoids connectivity interruptions entirely. Search pipelines, secrets and launch templates for stored `certificate-authority-data`, refresh managed node groups, then activate yourself while rollback is still on offer. Auto Mode and Fargate nodes are handled by AWS, but your external clients are not.
