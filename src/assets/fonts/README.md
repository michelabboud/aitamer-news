# Self-hosted fonts

Downloaded 2026-10-02 from the files Google Fonts served for the site's previous stylesheet URL
(`fonts.googleapis.com/css2?family=Gloock&family=Newsreader:opsz,wght@6..72,500..600&family=Hanken+Grotesk:ital,wght@0,400;0,500;0,600;0,700;1,400&family=IBM+Plex+Mono:wght@400;500;600`),
so the glyphs are identical to what readers got before. `src/styles/fonts.css` declares them.

| Family | Files | Served as | Source | Licence |
|---|---|---|---|---|
| Gloock | `gloock-400-*` | static 400 (gstatic v8) | https://github.com/duartp/gloock | `OFL-gloock.txt` |
| Newsreader | `newsreader-*` | variable, weight 500–600 and optical size 6–72 | http://github.com/productiontype/Newsreader | `OFL-newsreader.txt` |
| Hanken Grotesk | `hanken-grotesk-*`, `-italic-400-*` | variable weight 400–700, italic 400 (gstatic v12) | https://github.com/marcologous/hanken-grotesk | `OFL-hankengrotesk.txt` |
| IBM Plex Mono | `ibm-plex-mono-{400,500,600}-*` | static 400, 500, 600 | https://github.com/IBM/plex | `OFL-ibmplexmono.txt` |

The licence texts are copied from https://github.com/google/fonts (`ofl/<family>/OFL.txt`, main, 2026-10-02).

Only the `latin` and `latin-ext` subsets are kept. A character outside them (Cyrillic, Greek, Vietnamese) falls back
to the system font. Add the subset's file and its `@font-face` block if a post ever needs one.

To update a font, download the new file from its source, replace it here, keep the name, and update the table.
Do not edit a font file in place: replace it with the upstream file, so the licence and the name stay true.
