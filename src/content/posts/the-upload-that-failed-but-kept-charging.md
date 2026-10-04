---
title: The Upload That Failed but Kept Charging
description: An incomplete S3 multipart upload can leave billable parts behind even when no finished object appears. Here is how to find and clear them.
pubDate: "2026-10-05T22:30:00Z"
specimen: 286
section: devops
tags:
  - amazon-s3
  - multipart-upload
  - storage-costs
  - aws
  - operations
draft: false
heroImage: https://media.aitamer.news/heroes/the-upload-that-failed-but-kept-charging-8d97cd76.jpg
heroAlt: A failed cloud upload leaves partial file pieces stored beside a growing bill.
author: ari
wildness:
  rating: 3
  verified: S3 bills stored multipart parts until the upload is completed or aborted.
  claimed: A failed transfer can leave billable parts even when no finished object appears.
verdict: A failed upload is worth checking in S3's multipart upload list. Complete it, abort it, or use a lifecycle rule to clear abandoned parts.
sources:
  - title: Aborting a multipart upload — Amazon S3
    url: https://docs.aws.amazon.com/AmazonS3/latest/userguide/abort-mpu.html
  - title: Uploading and copying objects using multipart upload in Amazon S3
    url: https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html
  - title: Listing multipart uploads — Amazon S3
    url: https://docs.aws.amazon.com/AmazonS3/latest/userguide/list-mpu.html
  - title: AbortMultipartUpload — Amazon S3 API Reference
    url: https://docs.aws.amazon.com/AmazonS3/latest/API/API_AbortMultipartUpload.html
  - title: Configuring a bucket lifecycle configuration to delete incomplete multipart uploads — Amazon S3
    url: https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpu-abort-incomplete-mpu-lifecycle-config.html
---

A transfer can report failure while Amazon S3 still holds the data it received. With a multipart upload, S3 stores each successful part before it creates the final object. The object appears only after a successful completion request. If that request never succeeds, the uploaded parts remain in S3 and their storage is billed. Checking for the finished object can therefore miss the bytes behind the charge. [AWS explains the upload sequence and billing](https://docs.aws.amazon.com/AmazonS3/latest/userguide/abort-mpu.html).

## Why the parts stay

Multipart upload lets a client send one object in separate pieces and retry a failed piece. S3 returns an upload ID when the transfer starts. That ID identifies the parts and the final completion or abort request. S3 says an initiated multipart upload has no expiry. The client must complete it or stop it. Until then, S3 retains the uploaded parts and charges for their storage. [The multipart upload guide](https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html) also says the upload's requests and bandwidth are billed.

This matters when an application gives up after some parts succeed. Its error may describe the client operation, while S3 still has an in-progress upload. The parts are separate from a completed object, so checking the object key alone does not tell you whether storage was left behind. [AWS provides a way to list in-progress uploads](https://docs.aws.amazon.com/AmazonS3/latest/userguide/list-mpu.html) and the parts of a specific upload.

## Aborting needs a final check

An abort request tells S3 to remove uploaded parts. But parts already being sent may still finish after that request. AWS says another abort can be needed to free all part storage. Its [AbortMultipartUpload API guide](https://docs.aws.amazon.com/AmazonS3/latest/API/API_AbortMultipartUpload.html) recommends checking that the parts list is empty.

A bucket lifecycle rule can handle uploads that remain incomplete past a chosen age. The `AbortIncompleteMultipartUpload` action makes them eligible for abort after the configured number of days. It applies to existing and future incomplete uploads and leaves completed objects alone. [AWS documents the rule and its scope](https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpu-abort-incomplete-mpu-lifecycle-config.html).

## What to do

1. List in-progress multipart uploads in each affected bucket. Check which transfers should still finish before selecting any to abort.
2. Complete uploads that should produce an object. Abort abandoned ones using their bucket, key, and upload ID. Let active part requests settle, then check the parts list and repeat the abort if needed.
3. Add a lifecycle rule with an age that gives legitimate transfers time to finish. Review its bucket scope and confirm that it covers the uploads you expect.
