# Bot posts are judged on their rendered HTML, against an exact allowlist, in the build

## Context

The desk's bots write post bodies from untrusted web content, and the posts tool (atn-mcp) will
publish them through a pull request that the site's checks gate. A Markdown body may carry raw
HTML: the site renders it as written (`SECURITY.md`, "Trust model"), so whatever reaches the body
reaches readers.

The posts tool screens a body before it publishes it, with a Rust pre-filter that parses with
pulldown-cmark 0.13.4 and refuses raw HTML and dangerous link schemes (its plan's D10). The site
renders with satteri 0.10.5, a fork of pulldown-cmark, under Astro 7. Two review rounds of the
pre-filter found bodies the two parsers read differently, each one a `<script>` or a
`javascript:` link on a live page:

1. a leading block that looks like front matter (`---`, a fence, `---`, then `<script>`);
2. a tab before `>` in a blockquote, which satteri keeps as paragraph text where raw HTML then opens;
3. a list item holding only a task marker, where satteri closes the indented fence inside the item and reads the next line as raw HTML;
4. a footnote reference glued to a link (`a[^1][x](javascript:…)`);
5. an image URL with a malformed `%` escape, which satteri's `decodeURI` throws on, failing the build.

Patching corners in the pre-filter does not converge: each fix moves the disagreement, it does
not remove it. The posts MCP plan's Amendment 2 (2026-09-26) decided three layers: the Rust rules
stay as a fast pre-filter; the authoritative check renders with the site's own pipeline and judges
the output; and the same check is a hard gate in the site's build for bot posts. This record is
the site's side of that decision.

## Decision

1. **The check judges the HTML the site renders, not the Markdown.** `scripts/check-rendered-body.mjs`
   renders a post file (front matter and body, exactly as the publisher writes it) through the
   functions Astro's content layer calls for a `.md` entry: `markdownContentEntryType.getEntryInfo`,
   then the renderer from `getRenderFunction(config)`, with the site's `astro.config.mjs` loaded by
   Astro's own config resolver. It parses the result with parse5, a WHATWG-conformant parser,
   inside a whole-document stand-in for the story page (the real ancestor chain,
   `html > body > main#main > article.article > div.article__body`, then a marker for what
   follows), never as a bare fragment: a fragment parse drops a `<body onload=…>` that the browser
   merges into the page. Any parse error, any change to the page's shape (attributes on html, head
   or body; content outside the body's div; the marker moved), and any start or end tag the
   tokenizer saw that the allowlist does not name, even one the tree dropped, is a finding. It
   checks every node against an
   exact allowlist (`scripts/rendered-body-allowlist.mjs`): the Markdown elements with their
   attribute names and value shapes; Shiki's `pre`/`code`/`span` forms for the pinned theme
   (`github-dark`); footnotes and task lists in their exact forms; table alignment; link schemes
   `http`, `https`, `mailto`, `/path` and `#fragment`, judged after entity decoding; images only
   from `https://media.aitamer.news/`, valid for `decodeURI`, never through Astro's image pipeline;
   heading ids in the slugger's shape and never an id the story page, its layout or its scripts
   use. **Unknown means refused**: an element, attribute, style, comment or foreign node nobody
   listed is a finding. A render error is a finding, never a crash.
2. **Untrusted input renders in a child process** with a per-post timeout (`RENDER_TIMEOUT_MS`,
   20 s) and a heap cap (`WORKER_MAX_OLD_SPACE_MB`, 512 MiB), and posts over 512 KiB are refused
   by size. A post that hangs or bloats the renderer is a finding for that post; the worker is
   restarted for the rest. A renderer that cannot start (Astro moved an internal, the config now
   names another processor or Shiki theme) makes every post a finding.
3. **The build gates bot posts only.** `npm run check:posts` runs the check on every post whose
   `author` is an author marked `kind: bot` under `src/content/authors/` (`desk-bot` today), and on
   any post whose author cannot be read. After `npm run build`, `npm run check:bodies:build` checks
   the HTML the build stored for those posts (the bytes that ship) and re-renders **every** `.md`
   post with the checker, failing unless the checker's HTML is identical to the build's. It also parses every built story page and fails unless the story body's ancestors there are exactly the chain the stand-in models (html > body > main > article > div.article__body, with the stand-in's attributes) and the page parses with no error, so a layout change cannot leave the stand-in modelling a page that no longer exists. Both run
   on every pull request (`check-posts.yml`, the required check `check`) and before every deploy
   (`deploy-pages.yml`). Any finding fails the job and nothing deploys.
4. **The posts tool calls the same script** in its own checkout of the site at a pinned commit
   (`--stdin --json`, or a file path), and refuses to validate or publish on any finding.

### What the gate rests on, and what the posts lane must add

The gate decides "bot post" from the `author` field of the post as it stands, and from the author
files that mark `kind: bot`. Two consequences:

- **An empty bot set is a failure, not a pass.** If no author file marks `kind: bot` (a renamed
  field, a moved directory, a deleted file), the gate and the post-build check fail instead of
  checking nothing.
- **The author field is a claim, and the writer controls it.** A posts-App pull request could
  write `author: wiz-cat` on its own post, or edit a human's post, and the gate would skip it. So
  the posts lane guard (the posts MCP plan's task S1, not built yet) must enforce, for any pull
  request by the posts App: every added or changed post has `author: desk-bot` (a bot id) in its
  new version, and no post whose current author is not a bot is changed. If S1 cannot enforce that,
  the gate must instead check **every post such a pull request touches**, whatever author it claims.
  Until S1 lands there is no posts App and no posts lane, so nothing can use the gap.

### The one existing exception

On 2026-09-26, 23 of the site's 25 posts are by `desk-bot`, and one of them,
`made-on-youtube-2026-gemini-ask-studio.md`, embeds two YouTube players as raw `<iframe>`s. It was
written before the `video` front matter field existed; the field holds one video, the post has two.
Moving it is an editorial decision (the posts MCP plan's Q4, Michel's). Until then it is listed in
`GRANDFATHERED_POSTS`, pinned by the SHA-256 of the file **and** by the exact findings it has today
(the two `iframe` elements). Any edit to the file, or any other finding in it, and it is gated in
full. The entry cannot outlive an edit either: when the file's hash no longer matches, when a
listed finding is gone, when the file is gone, or when its author's file under
`src/content/authors/` no longer marks it `kind: bot` (the post's own `author` line is part of the
hashed bytes, so that is the only way its author can stop being a bot), the entry
itself is a finding and the build fails until someone removes it. Nothing may be added to that
list for a new post. The other 22 bot posts, and both human
posts, pass the allowlist as it stands.

## Why the rendered output, not the source

- It removes the whole class of parser disagreements rather than the ones found so far: whatever
  satteri did with a body, only allowed shapes reach the page.
- It is what the reader gets. The source is an input to a program the site does not control line by
  line (satteri, Shiki, Astro's plugins); the output is the thing that is either safe or not.
- The source rules keep their value as a fast pre-filter with line and column errors a bot can act
  on, and as an independent second opinion. They are no longer the authority.

## Why bots only

`SECURITY.md` treats editors as trusted writers: raw HTML in a hand-written post is allowed by
design, and one human post might reasonably use it. The risk this gate answers is a writer that
copies untrusted text from the web, which is what the bots do. A tripwire for every post is still
open (the posts MCP plan's Q4); the check's `--all` mode reports what it would say about the human
posts (today: nothing).

## Version drift

The posts tool pins its checkout of the site, so the renderer it judges with can fall behind the
one that builds `main` (a satteri, Shiki or Astro upgrade, a config change). The build gate catches
that: it runs the same check with the site's current dependencies on every pull request, so a body
the pinned tool passed and the current renderer turns into something else fails before merge. The
post-build comparison catches the gate's own drift: if the checker ever renders differently from
the build (an integration hook, a changed internal, a stale incremental cache), the job fails
instead of vouching for HTML it did not see.

## Alternatives rejected

- **Keep patching the pre-filter.** Two review rounds, a new disagreement each time, no convergence (above).
- **Validate the Markdown syntax tree before rendering** (satteri's mdast or hast before Shiki).
  Closer to the source of truth than the Rust rules, but raw HTML survives as opaque strings in
  those trees, the Shiki and heading-id plugins still change the output afterwards, and it would
  couple the check to satteri's plugin API. Checking the final HTML covers all of it. The cost is
  that the allowlist knows Shiki's output shapes, pinned to one theme; a theme change fails closed
  and is a deliberate edit here.
- **Sanitise instead of refuse** (strip what is not allowed and ship the rest). A bot post that
  needs sanitising is wrong in some way nobody has looked at; silently shipping part of it hides
  that. Refusal sends it back to the tool, where a human can see why.
- **Render with a separate Markdown library in the checker.** That is the pulldown-cmark problem
  again, one level down.
- **Regex over the HTML.** Browsers do not parse HTML with regexes.
- **Gate every post now.** Would fail on the grandfathered post, and changes the trust model for
  human editors; that is Q4, not this task.

## Consequences

- A bot post can use Markdown and nothing else: no raw HTML at all, however harmless, unless it is
  an element the allowlist lists with the attributes Markdown gives it. Images come from the media
  bucket only. A heading titled "Comments" or "Sources title" is refused (its id would clobber the
  page's own); the bot renames the heading.
- A satteri, Shiki or Astro upgrade that changes output, a new Shiki theme, or a new id on the story
  page means a deliberate edit to the allowlist, with a test; until then bot posts fail closed. The
  test `every id the story page … uses is protected` fails when a component adds an id the list
  does not cover.
- The check imports Astro internals by path (`astro/dist/...`); an upgrade that moves them stops the
  worker from starting, which fails every bot post rather than passing any.
- About two seconds added to `check:posts` and one to the job after the build, today.

## Status

Accepted 2026-09-26 (site task S4 of the posts MCP plan, Amendment 2; Michel's delegation to the
coordinator). The grandfather entry is open until Michel decides Q4.
