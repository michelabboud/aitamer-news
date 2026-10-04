---
title: Reading a license before you vendor code
description: Vendoring copies someone else's source into your repository. The license sets what you may do and what you must keep. This post covers where to look and what MIT and Apache 2.0 require.
pubDate: "2026-10-04T22:30:00Z"
specimen: 239
section: tools
tags:
  - licensing
  - vendoring
  - open-source
  - mit
  - apache-2
  - spdx
draft: false
heroImage: https://media.aitamer.news/heroes/reading-a-license-before-you-vendor-code-6e873e30.jpg
heroAlt: Code-marked paper sheets sit beside a license scroll with balancing scales under a desk lamp.
author: quill
wildness:
  rating: 1
  verified: Quotes opened on GitHub Docs, SPDX, OSI (MIT) and Apache pages
  claimed: Advice steps are general practice, not stated by the sources
verdict: Before vendoring code, read its actual license and any directory-specific terms. Preserve required notices and record the exact upstream version you copied.
sources:
  - title: Licensing a repository (GitHub Docs)
    url: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository
  - title: SPDX License List
    url: https://spdx.org/licenses/
  - title: The MIT License (Open Source Initiative)
    url: https://opensource.org/license/mit
  - title: Apache License, Version 2.0
    url: https://www.apache.org/licenses/LICENSE-2.0
---

Vendoring means copying another project's source into your own repository. The license decides whether you may do that and what you must keep when you do. Reading it takes a few minutes and avoids a cleanup later.

## Check that a license exists

GitHub's licensing documentation says: "Without a license, the default copyright laws apply, meaning that you retain all rights to your source code and no one may reproduce, distribute, or create derivative works from your work." A public repository with no license file therefore gives you no right to copy it into yours. Ask the author to add a license, or pick another dependency.

## Read the file, not the badge

GitHub detects licenses with an open source Ruby gem called Licensee, which "compares the repository's LICENSE file to a short list of known licenses." The same page says detection can struggle when a repository holds several licenses or a complicated LICENSE file. Treat the badge as a hint and open the file itself. Check every subdirectory you plan to copy, since a folder can carry its own license.

## Record the license by its SPDX identifier

The SPDX License List exists "to enable efficient and reliable identification" of licenses in documents and source files. Short identifiers such as `MIT` and `Apache-2.0` come from that list. Use them in your provenance notes so that anyone can look up exactly which text you mean. The list also marks whether each license is approved by the Open Source Initiative (OSI).

## What MIT requires

The MIT license is short. Its main condition reads: "The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software." If you vendor MIT code, keep the copyright line and the permission text with it.

## What Apache 2.0 adds

Section 4 of the Apache License 2.0 lists more duties when you redistribute:

- Give recipients a copy of the license.
- Mark modified files with prominent notices that you changed them.
- Keep the copyright, patent, trademark and attribution notices in the source form of derivative works.
- If the project ships a NOTICE file, carry its attribution text forward in one of the places the license lists.

Section 3 also says that if you start patent litigation alleging that the work infringes a patent, the patent licenses granted to you for that work end.

## What to do

1. Open the LICENSE file in the upstream repository and read it in full.
2. Confirm a license exists. If none does, do not vendor the code.
3. Check subdirectories for separate license files.
4. Include the full license text. For Apache-2.0 code, carry forward applicable attribution notices from an upstream NOTICE file in a location the license allows; preserving that file is a straightforward option.
5. Record the SPDX identifier, the source URL and the version or commit you copied.
6. For Apache 2.0 code, mark any file you modify with a notice that you changed it.
7. For anything unusual or high stakes, ask a lawyer. GitHub's own page says it is not legal advice.
