# Dependency vetting: an HTML parser for the rendered-body gate

- **Date:** 2026-09-26
- **For:** site task S4 of the posts MCP plan (Amendment 2): `scripts/check-rendered-body.mjs` checks a bot post's rendered HTML against an exact allowlist (ADR 0009).
- **Kind:** new direct dependency of the build scripts only. It runs in CI, in the deploy job, on editors' machines and in the posts tool's checkout of the site; never on a server or in the published site.

## The requirement that decides it

The gate must see the tree a browser builds from the post's HTML, not an approximation of it. A regex or a lenient parser reads `<p>x</p><img src=x onerror=…>`, a `<script>` inside a `<p>`, an unquoted or entity-encoded attribute, `java&#x09;script:`, or a stray end tag differently from the browser, and every difference is a bypass. That rules out anything but a parser that implements the WHATWG HTML parsing algorithm (tokenizer and tree construction, fragment parsing with a context element, character references).

What the dependency tree already had (`package-lock.json`, 2026-09-26): no `parse5`, no `hast-util-from-html`, no `htmlparser2`. It has `ultrahtml` and `dom-serializer`/`domhandler` (not spec parsers), and satteri's own `htmlToHast`. The last is rejected on principle: using the renderer's own code to judge the renderer's output would share its mistakes, and it is a native binding whose HTML feature is optional ("only available in builds that include the `from-html` feature").

## Version pinned

- **`parse5@8.0.1`**, pinned exactly (`npm install --save-exact`). npm dist-tag `latest` is 8.0.1 (published 2026-04-19; 8.0.0 on 2025-07-09). ESM-only since 8.0.0, which suits the scripts (all ES modules). Node engine: none declared; its one dependency needs Node ≥ 20.19, below the site's 22.12.
- It brings exactly one package: **`entities@8.1.0`** (by fb55, a parse5 maintainer; the HTML character-reference tables). `npm install` added 2 packages.

## Security and health

- **Advisories:** none published for `parse5` or `entities` in the GitHub Advisory Database (`gh api /advisories?ecosystem=npm&affects=parse5`, and `…affects=entities`, 2026-09-26: empty). `npm audit` after the install: `found 0 vulnerabilities`.
- **Exposure:** it parses HTML the site's own Markdown pipeline produced from a bot's post. The worst case of a parser defect is a wrong verdict (covered by the allowlist's structure: unknown means refused) or a slow check (the parse runs after a render that is already time- and memory-capped in a child process; parse5 is linear in its input).
- **License:** MIT (both packages).
- **Maintenance:** active; repository `inikulin/parse5`, not archived, last push 2026-09-25, about 3,900 stars. Maintainers include fb55 and wooorm (unified/hast).
- **Adoption:** the reference spec-compliant HTML parser in JavaScript; jsdom, `hast-util-from-html` (rehype), Angular and cheerio's spec mode are built on it. It passes the html5lib tree-construction tests.

## Alternatives weighed

| Option | Why not |
|---|---|
| `hast-util-from-html` | Wraps parse5 in the unified ecosystem: seven more packages (`hast-util-from-parse5`, `vfile`, `vfile-location`, `devlop`, …) for a tree shape the checker does not need. |
| satteri's `htmlToHast` | Already installed, but it is the renderer judging itself (above), and an optional native feature. |
| `htmlparser2` / `ultrahtml` | Fast, lenient, not the WHATWG algorithm: they disagree with browsers on exactly the malformed input a bypass is made of. |
| Regex over the HTML | The failure this gate exists to end. |
| No first-party option | The fleet has no HTML parser. |

## Decision

Add `parse5@8.0.1` as an exact direct dependency, used only by `scripts/rendered-body-allowlist.mjs`. Re-check advisories at every phase release (`npm audit`).

## Sources

- npm registry: `npm view parse5 version dist-tags dependencies time`, `npm view entities@8.1.0` (2026-09-26)
- [parse5 releases](https://github.com/inikulin/parse5/releases): 8.0.0 "Switch to ESM-only"; 8.0.1 maintenance
- GitHub Advisory Database via `gh api`, and the repository metadata via `gh api graphql` (2026-09-26)
