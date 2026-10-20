---
title: The Bytes at the Start of a File
description: The byte order mark is a signature that U+FEFF becomes at the start of a stream. Its exact bytes depend on the encoding, and whether to use one is the protocol's call.
pubDate: "2026-10-20T12:30:00Z"
section: dev
tags:
  - unicode
  - utf-8
  - utf-16
  - bom
  - encoding
draft: false
heroImage: https://media.aitamer.news/heroes/byte-order-mark-8659234f.jpg
heroAlt: A coral flag marks the beginning of a curling cream paper ribbon carrying blue rectangular tiles.
author: mai
wildness:
  rating: 1
  verified: "Unicode FAQ: FF FE/FE FF = UTF-16; EF BB BF = UTF-8; BOM use depends on protocol."
  claimed: The framing that byte order applies only to multi-byte forms follows the FAQ.
verdict: A BOM is a signature, not a universal requirement. Its bytes follow the encoding, and its use is the protocol's decision.
sources:
  - title: "Unicode FAQ: UTF-8, UTF-16, UTF-32 and BOM"
    url: https://unicode.org/faq/utf_bom.html
---

Open a UTF-16 text file in a hex editor and it may begin with the two bytes FF FE, or FE FF, before any real text. Open a UTF-8 file and it may begin with EF BB BF. These leading bytes are a byte order mark, a signature that the character U+FEFF becomes at the start of a stream. The bytes differ because each encoding form turns the same character into different bytes.

The name byte order mark is only half accurate. For UTF-16 and UTF-32, the code units are two and four bytes long, and the order of those bytes can be big-endian or little-endian. The leading signature tells a reader which order to apply. The [Unicode FAQ](https://unicode.org/faq/utf_bom.html) lists the exact sequences: FE FF signals UTF-16 big-endian, FF FE signals UTF-16 little-endian, and the four-byte forms 00 00 FE FF and FF FE 00 00 signal the two UTF-32 orders.

For UTF-8 the situation is different. UTF-8 is a sequence of single bytes, so there is no byte order to indicate. A BOM in UTF-8 is used only as a signature that the file is UTF-8 rather than some other encoding, and it has nothing to do with byte order.

Whether you should use one depends on the protocol, not on a universal rule. The FAQ's own guidance distinguishes the cases. Some protocols require a BOM on certain Unicode streams, and it names Microsoft's conventions for .txt files as an example. Other protocols permit an optional BOM for untagged plain text. Still others expect specific ASCII characters at the very start of a file, and for those the FAQ says to avoid a UTF-8 BOM because it would interfere, pointing to the #! opening of Unix shell scripts. And where a stream is already declared as UTF-16BE or UTF-16LE, the FAQ says a BOM must not be used at all.

The throughline is simple. A byte order mark is a signature that a particular encoding form is in use. Its exact bytes depend on that form, and whether it is wanted, optional, or forbidden is a decision the surrounding protocol makes.
