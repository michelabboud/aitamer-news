---
title: "Pgpool-II JVN#22475874: seven CVEs; lead OOB write CVSS 8.7/8.8"
description: "JVN#22475874 (2026-09-29): seven Pgpool-II CVEs; lead CVE-2026-92867 authenticated OOB write (CVSS 4.0 8.7 / 3.0 8.8)—process termination and arbitrary code execution. Fixed in 4.7.3, 4.6.8, 4.5.13, 4.4.18, 4.3.21."
pubDate: 2026-10-01T23:20:00Z
specimen: 141
section: devops
subsection: postgres
tags:
  - pgpool-ii
  - postgresql
  - cve
  - security
  - jvn
  - connection-pooling
  - devops
  - postgres
draft: false
heroImage: https://media.aitamer.news/heroes/pgpool-ii-jvn-22475874.jpg
heroAlt: "Paper-cut collage of a slate-blue shield over pooled connection wires with a coral patch accent beside stacked backend shelves."
author: desk-bot
wildness:
  rating: 5
  verified: "JVN#22475874; CVE-2026-92867 OOB write CVSS4 8.7/CVSS3 8.8 auth ACE; fix 4.7.3/4.6.8/4.5.13/4.4.18/4.3.21"
  claimed: "Pooler companion note is beat context only — not a JVN claim; ≠ shared CVE with PgBouncer"
verdict: "Upgrade Pgpool-II for JVN#22475874—seven CVEs; lead authenticated OOB write with process termination and arbitrary code execution as JVN states."
sources:
  - title: "JVN#22475874: Multiple vulnerabilities in Pgpool-II"
    url: https://jvn.jp/en/jp/JVN22475874/
---

Japan’s **JVN#22475874** (published **2026-09-29**, last updated the same day) reports **multiple vulnerabilities** in **Pgpool-II** from the **Pgpool Global Development Group**, under seven CVE IDs (**CVE-2026-92867** through **CVE-2026-92873**) ([JVN](https://jvn.jp/en/jp/JVN22475874/)).

AI agent stacks often sit behind Postgres connection poolers—the same lane that already includes PgBouncer coverage on this beat. That does **not** equate Pgpool-II with PgBouncer or share these CVE IDs.

## Lead: CVE-2026-92867

| Item | As JVN states |
| --- | --- |
| **Class** | Out-of-bounds Write (**CWE-787**) |
| **CVSS:4.0** | Base **8.7** (`AV:N/AC:L/AT:N/PR:L/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N`) |
| **CVSS:3.0** | Base **8.8** |
| **Impact** | Abnormal process termination, **and arbitrary code execution** |
| **Privileges** | Vector **PR:L** — treat as an **authenticated / low-privilege** network attacker per the advisory score; do not read this as unauthenticated RCE |

JVN’s Impact sentence is the source for “arbitrary code execution” here; the advisory does not spell out further exploitability conditions.

## The other six (advisory one-liners)

| CVE | Class (JVN) | CVSS 4.0 / 3.0 | Impact (JVN) |
| --- | --- | --- | --- |
| **CVE-2026-92868** | Improper Certificate Validation (CWE-295) | **6.9** / **6.5** | Client certificate authentication bypass |
| **CVE-2026-92869** | Out-of-bounds Write (CWE-787) | **7.1** / **6.5** | Abnormal process termination |
| **CVE-2026-92870** | Stack-based Buffer Overflow (CWE-121) | **8.7** / **7.5** | Abnormal process termination |
| **CVE-2026-92871** | NULL Pointer Dereference (CWE-476) | **8.7** / **7.5** | Abnormal termination of the **watchdog** process |
| **CVE-2026-92872** | Insertion of Sensitive Information into Log File (CWE-532) | **5.3** / **4.3** | Cluster information leak |
| **CVE-2026-92873** | Incorrect Implementation of Authentication Algorithm (CWE-303) | **6.9** / **7.3** | Promotion of an arbitrary watchdog node to the leader node |

For **CVE-2026-92870** and the other non-92867 IDs, JVN’s Impact stops at process termination, cert-auth bypass, log leak, or watchdog leader promotion as listed—not RCE.

## Affected ranges (two lists)

**CVE-2026-92867** and **CVE-2026-92869**–**92873** share one list: **4.7.0–4.7.2**, **4.6.0–4.6.7**, **4.5.0–4.5.12**, **4.4.0–4.4.17**, **4.3.0–4.3.20**, plus **all 3.5.x through 4.2.x**.

**CVE-2026-92868** alone: same **4.3–4.7** banded ranges, but the older band is **all 4.0.x through 4.2.x** (not 3.5.x on that CVE’s list). Keep the two affected-range lists separate ([JVN](https://jvn.jp/en/jp/JVN22475874/)).

## Fixed versions and EOL

JVN says these builds address the vulnerabilities:

- **Pgpool-II 4.7.3**
- **Pgpool-II 4.6.8**
- **Pgpool-II 4.5.13**
- **Pgpool-II 4.4.18**
- **Pgpool-II 4.3.21**

Support for **3.5 through 4.2** has ended and **no further fixes** will be released; if you are on a version prior to **4.3**, JVN recommends upgrading to a latest fixed line above ([JVN](https://jvn.jp/en/jp/JVN22475874/)).

Credit on the advisory: **Emond Papegaaij** of Topicus Security reported the issues to the developer and coordinated; Pgpool Global Development Group and **JPCERT/CC** published advisories. Cross-ref: **JVNDB-2026-000140**.

## Who should care

Operators running Pgpool-II on the listed ranges should start at [JVN#22475874](https://jvn.jp/en/jp/JVN22475874/)—upgrade to **4.7.3**, **4.6.8**, **4.5.13**, **4.4.18**, or **4.3.21**, and treat **CVE-2026-92867** as the authenticated OOB path with process termination and arbitrary code execution as JVN writes it, with the other six held to their stated Impact lines.
