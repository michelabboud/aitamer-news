---
title: A CSV Export Can Become a Spreadsheet Formula
description: A report cell can become a formula when a spreadsheet opens a CSV file. The right safeguard depends on who will open the export and how.
pubDate: "2026-10-06T05:30:00Z"
specimen: 300
section: general
tags:
  - csv
  - spreadsheets
  - security
  - data-exports
draft: false
heroImage: https://media.aitamer.news/heroes/a-csv-export-can-become-a-spreadsheet-formula-624e2d94.jpg
heroAlt: Rows leave a paper data sheet and enter a spreadsheet beside a shield and three reader silhouettes.
author: ari
wildness:
  rating: 3
  verified: A user-supplied CSV field can be read as a spreadsheet formula.
  claimed: The export risk changes with the spreadsheet, import settings, and downstream use.
verdict: CSV formula injection is a real export risk. Safeguards depend on the spreadsheet, its import settings, and whether the file must preserve exact data for other software.
sources:
  - title: CSV Injection | OWASP Foundation
    url: https://community.owasp.org/attacks/CSV_Injection
  - title: "CWE-1236: Improper Neutralization of Formula Elements in a CSV File | MITRE"
    url: https://cwe.mitre.org/data/definitions/1236.html
  - title: Import or export text (.txt or .csv) files | Microsoft Support
    url: https://support.microsoft.com/en-us/excel/get-started/import-or-export-text-txt-or-csv-files
  - title: Text Import | LibreOffice Help
    url: https://help.libreoffice.org/latest/en-US/text/shared/00/00000208.html
---

An exported report can look like a plain list of names, notes, and totals. One field can still become a spreadsheet formula when someone opens the file. The risk starts when a service places text supplied by another person into a comma-separated values (CSV) export. A spreadsheet then interprets some cell contents as instructions. [OWASP describes this as CSV injection](https://community.owasp.org/attacks/CSV_Injection), also called formula injection.

## How a report cell becomes a formula

Imagine a customer enters `=1+2` as a display name. The name is intended as text. If a report exports that value into a cell and a spreadsheet evaluates it, the cell shows a calculated result. The arithmetic is harmless here. It shows the trust boundary: the person who supplied a name has influenced what the report reader's spreadsheet does. [MITRE's description of the weakness](https://cwe.mitre.org/data/definitions/1236.html) places the fault in a CSV export that fails to neutralize formula elements supplied by a user.

Spreadsheet formulas can do more than arithmetic. MITRE gives a hyperlink formula as an example and lists attempts to read application data or run unauthorized commands among possible consequences. OWASP also describes attempts to extract spreadsheet contents. Those outcomes depend on the formula, the spreadsheet, its settings, and the reader's actions. A formula-shaped cell is a reason to investigate. It does not establish that a computer has been taken over. [MITRE also notes that current Excel versions warn about untrusted content](https://cwe.mitre.org/data/definitions/1236.html).

## The dangerous character may start a new cell

Checking only the first character of the original input misses part of the problem. A CSV file uses separators to divide fields. Quotes control whether a separator belongs inside a field. If an export builds lines by joining strings without handling those rules, text can spill into another cell. A formula marker can then appear at the start of that new cell even when it was buried in the original input. [OWASP calls out separators and quotes](https://community.owasp.org/attacks/CSV_Injection) for this reason.

The familiar markers are `=`, `+`, `-`, and `@`. OWASP also flags tabs, carriage returns, line feeds, and full-width versions of formula characters in some locales. This does not mean every negative number is malicious. It means the exporter needs a deliberate rule for cells that a spreadsheet might treat as formulas. That rule has to account for the final CSV fields, including the separator and quoting rules. [OWASP lists the characters and parsing concern together](https://community.owasp.org/attacks/CSV_Injection).

## The opening method changes the result

CSV is text, but a spreadsheet adds an interpretation step. [Microsoft says Excel automatically opens a CSV into a workbook](https://support.microsoft.com/en-us/excel/get-started/import-or-export-text-txt-or-csv-files) and uses default data format settings when it does. The same help page describes a separate import route through **Data > From Text/CSV**, where the reader can preview the data and choose a delimiter. A file meant for a machine parser may therefore need different handling when people will open it directly in Excel.

[LibreOffice Calc exposes an Evaluate formulas option](https://help.libreoffice.org/latest/en-US/text/shared/00/00000208.html) in its text import settings. Its help says formulas beginning with `=` are evaluated when that option is checked and imported as text when it is cleared. It also offers a Text column type. These controls give the reader a way to preserve data as text. They are settings of the receiving application, so the producer cannot assume every recipient will choose them.

## Escaping has a cost and a limit

One suggested defense is to quote each CSV field, double any quote inside it, and prefix a cell with a single quote so a spreadsheet treats it as text. [OWASP documents that pattern](https://community.owasp.org/attacks/CSV_Injection), but warns that Excel may remove quotes or escape characters when the CSV is saved and reopened. A file that appeared safe on its first opening can therefore need another check after a round trip. MITRE rates the single-quote approach as only moderately effective and says its effect in other spreadsheet products is unclear.

OWASP describes an Excel-specific measure: put a tab before a cell that begins with a formula marker, inside a quoted field. It also says the tab remains in the underlying data. That can change a value used later by software. This is why the destination matters. A spreadsheet export for people may be able to tolerate that extra character. A data interchange file may need the original bytes. [OWASP says there is no universal CSV sanitization strategy](https://community.owasp.org/attacks/CSV_Injection) for all spreadsheet applications and downstream consumers.

## What to do

**If you build an export:** Identify every column that can contain text from users, customers, partners, or imported records. Use a CSV writer that handles separators and quotes as fields. Decide whether the export is for spreadsheet viewing or exact data exchange. For spreadsheet viewing, neutralize formula-shaped cells according to the applications your readers use. Inspect the parsed output for embedded quotes, separators, line breaks, and leading formula markers. Open a sample in each supported spreadsheet, then save and reopen it before calling the rule effective. [OWASP's examples and warning](https://community.owasp.org/attacks/CSV_Injection) explain why both parsing and reopening matter.

**If you receive an export:** Treat unfamiliar CSV files as untrusted input, including files downloaded from a service you use. In Calc, clear **Evaluate formulas** or import suspect columns as **Text**. In Excel, use **Data > From Text/CSV** to inspect the preview and import choices before loading the file. Investigate unexpected formulas and security warnings before proceeding. [LibreOffice's import help](https://help.libreoffice.org/latest/en-US/text/shared/00/00000208.html) and [Microsoft's CSV import guide](https://support.microsoft.com/en-us/excel/get-started/import-or-export-text-txt-or-csv-files) document those controls. A useful report can still carry text that deserves careful handling.
