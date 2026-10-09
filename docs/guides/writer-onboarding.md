# Onboarding a human or AI writer

Author profiles are the source of writer identity, presentation and opinion disclosure. Add a profile and approved portrait assets; the shared templates discover them. See [the author metadata decision](../adr/0032-author-feature-metadata.md).

## 1. Agree the writer's identity and scope

Record the public name, biography, introduction, coverage beats and whether this is a human contributor or a named AI writer. Confirm permission to use their name, biography and illustrative portrait. Keep private contact details outside this public repository. A person uses `kind: human`; a named AI uses `kind: ai`. A desk news bot uses `kind: bot` and does not get a featured writer page.

An identity label remains visible beside the writer's portrait and article byline. Humans remain `Person` in structured data; AI writers remain `Organization`. Featuring a human contributor changes their displayed profile role to Human writer; ordinary human editors, including Wiz Cat, retain Human editor.

## 2. Add an author profile

Create `src/content/authors/<id>.md`. Use a unique lowercase hyphenated ID; the filename owns the ID, so do not add `slug`. Avoid existing page, public-directory and redirect names such as `about`, `authors` and `heroes`; a featured name collision fails the build.

For a human writer, use this shape with their actual agreed details:

```yaml
---
name: Writer's public name
kind: human
featured: true
writerOrder: 1
personalOpinion: true
bio: An agreed short biography.
avatar: /authors/writer-id-avatar.jpg
portrait: /authors/writer-id.jpg
portraitAlt: A truthful description of the paper collage illustration.
beats:
  - The writer's agreed subject area
---
The writer's approved introduction, in plain paragraphs.
```

An optional `website` field adds a real external link below the introduction. Use the writer’s approved HTTPS URL without embedded credentials. Keep the introduction itself plain text instead of writing Markdown links.

The illustration files must actually exist under `public/authors/` before publication. Use the house layered paper collage style with slate blue, cream and a restrained coral accent, never a photo or a claim that the illustration depicts a real person. For AI writers, record the writer's chosen depiction and keep the AI disclosure. `portrait` and `portraitAlt` are optional together; without them the layout displays initials. The portrait route accepts `.jpg`, `.png` and `.webp`. The author's Markdown body is displayed as escaped plain paragraphs: formatting and links are not rendered.

Use `kind: ai` for a named AI. AI writers are featured by default even without `featured`; humans must explicitly set `featured: true`. `featured: false` disables the own-name page, homepage card and featured navigation entry, while retaining `/authors/<id>/`. Changing the kind to obtain presentation or a weaker gate is prohibited.

## 3. Choose placement and opinion policy deliberately

`writerOrder` is an optional nonnegative integer used by both homepage writer cards and navigation. Existing defaults are Mai 0, Quill 10, Foxy 20, Ari 30. A writer with `writerOrder: 1` appears immediately after Mai with the current roster. Set another rank for another position. Explicit ranks override default positions; equal ranks sort by author ID. Writers with neither an explicit rank nor an existing default follow ranked writers, sorted by ID. The input collection is never reordered in place.

Editorial placement and opinion policy are maintainer-owned. The author App may preserve these fields in an existing AI/bot profile, but cannot change or remove them or set them on a new profile, including from a stale branch. Adding or changing human profiles also remains maintainer-only.

`personalOpinion` defaults to false for every author kind. Set it to true only when the editorial decision is that every article from this writer is presented as the writer's personal opinion. All existing and future articles inherit the setting without extra post fields. Each visible article receives a Personal opinion badge near the byline and a closing disclaimer after the content and sources, before the signoff and reader interactions. The disclaimer names the author and says these views do not necessarily reflect AI Tamer's views. Withdrawn articles show their withdrawal notice instead.

This author-wide setting is not suitable for a writer who alternates between factual reporting and opinion without accepting that all their pieces will carry the disclosure. Omit it or set false for ordinary factual contributions. Do not infer opinion from `kind: human` or `kind: ai`, and do not automatically add an `opinion` tag to every contribution.

Opinion disclosure grants no exemption from fact checks, source verification, corrections or existing content gates. Opinion statements must be distinguishable from factual claims. Open and verify primary sources for factual claims, represent uncertainty honestly and correct errors. Any existing content-contract exceptions depend on their own requirements; `personalOpinion` does not enable them.

## 4. Submit articles through the normal content workflow

Use the agreed author ID when preparing fields for [the post builder](post-builder.md). Keep publication timestamps in UTC. Choose the article's section/Habitat, attach an uploaded house-style hero (new heroes are stamped with the site mark as the last step: `docs/guides/hero-image-style.txt`) and truthful alt text, and supply the verified sources and editorial fields the builder requires. Reuse the author's ID for every future contribution so their published pieces automatically appear on both their own-name page and author profile.

Writers, desk producers and editors must not assign, reserve or repair specimen numbers or append the specimen ledger. Numbering belongs exclusively to the serialized publication workflow. Changing writer metadata does not change that rule. Keep the Habitat the writer selected; numbering does not classify the article.

## 5. Validate and inspect the rendered pages

Run the normal repository gates for the changed profile and any articles: preflight for changed posts, author checks, post/media checks and the full test suite. Build the site and inspect its generated HTML or preview:

- `/`: the card uses the correct portrait, author kind, placement and latest published piece.
- `/<id>/`: the name, correct human/AI disclosure, introduction, beats and published pieces appear; a future-dated draft does not appear early.
- `/authors/<id>/`: the role is correct and a featured author links to their own page.
- Navigation and `/llms.txt`: the writer's own-name link resolves; ordinary editors keep their profile link.
- An enabled opinion article: the byline badge and closing disclaimer both appear, name the correct writer and stay outside the Markdown body. An ordinary human or AI article has neither.
- Portraits: paths resolve, alt text matches the artwork and the mobile page remains readable.

Open a pull request with the profile, portrait assets, supporting checks and documentation. The repository's normal checked merge and publishing workflow deploys it. Keep failures and unresolved publication evidence in the task record; local file existence or a successful build alone does not prove the writer is live.
