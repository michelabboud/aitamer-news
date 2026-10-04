---
title: An S3 ETag Is Not Always the File's MD5
description: Multipart uploads and some encryption modes produce ETags that cannot be compared with a file's MD5. Use an explicit S3 checksum when verifying object data.
pubDate: "2026-10-05T06:30:00Z"
specimen: 255
section: devops
tags:
  - amazon-s3
  - etag
  - checksums
  - multipart-uploads
draft: false
heroImage: https://media.aitamer.news/heroes/an-s3-etag-is-not-always-the-file-s-md5-f10c0876.jpg
heroAlt: A fingerprint-marked file is shown as unequal to a locked stack of file parts.
author: ari
wildness:
  rating: 2
  verified: AWS documents when ETags equal object MD5 and when multipart uploads or encryption change that.
  claimed: Comparing an ETag with local MD5 outside those conditions can produce a misleading mismatch.
verdict: Use explicit S3 checksums for integrity checks. Compare an ETag with MD5 only when the object's upload method and encryption mode qualify.
sources:
  - title: Checking object integrity for data uploads in Amazon S3
    url: https://docs.aws.amazon.com/AmazonS3/latest/userguide/checking-object-integrity-upload.html
---

An Amazon S3 ETag often looks like an MD5 digest. That makes it tempting to compare an uploaded object's ETag with the MD5 of a local file. [AWS documents](https://docs.aws.amazon.com/AmazonS3/latest/userguide/checking-object-integrity-upload.html) specific cases where that comparison works. Outside those cases, a mismatch does not by itself mean the file was damaged.

## When an ETag matches MD5

For an object created with `PutObject`, `PostObject`, or `CopyObject`, AWS says the ETag is the MD5 digest of the object data when the object is plaintext or uses S3-managed server-side encryption (SSE-S3). The same rule applies to a qualifying upload through the AWS Management Console. In that situation, you can compare the ETag with a locally calculated MD5 of the same data.

## When the shortcut fails

For a multipart upload, the ETag is not the MD5 of the whole file. S3 calculates an MD5 for each part, combines those digests, and adds the part count after a dash in the final ETag. Different part boundaries can therefore produce a different ETag for the same file bytes.

Encryption also matters. AWS says an object encrypted with AWS Key Management Service keys (SSE-KMS) or customer-provided keys (SSE-C) does not get an ETag equal to the MD5 of its object data, even for the listed operations. An object created with `UploadPartCopy` also lacks a whole-object MD5 ETag. [AWS lists these cases together](https://docs.aws.amazon.com/AmazonS3/latest/userguide/checking-object-integrity-upload.html).

## Use an explicit checksum

S3 supports stored checksum values separate from the ETag. You can choose a checksum algorithm for an upload, supply a value, and have S3 compare its calculation with yours. For multipart uploads, distinguish a **full-object checksum**, calculated over all bytes, from a **composite checksum**, calculated from part checksums. AWS supports full-object CRC checksums for multipart uploads. SHA and MD5 checksums for multipart uploads are composite. [The integrity guide](https://docs.aws.amazon.com/AmazonS3/latest/userguide/checking-object-integrity-upload.html) lists the supported combinations and explains how to retrieve stored checksums.

## What to do

1. For new uploads, choose an explicit checksum algorithm and send a precomputed value when you need S3 to validate a value you already trust.
2. For multipart uploads, choose the checksum type deliberately. Use a supported full-object CRC checksum when you need to compare the complete file without tracking part boundaries.
3. For an existing object, retrieve its stored checksum and compare it with a value calculated using the same algorithm and checksum type. Treat an ETag as an MD5 only after confirming that the upload method and encryption mode meet AWS's stated conditions.
