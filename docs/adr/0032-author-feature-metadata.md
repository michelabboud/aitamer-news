# 0032: Author metadata selects featured writers and personal opinion

## Context

Dev mode: production. Named AI writers already have their own pages and homepage cards. Michel requested the same paper collage presentation for Aviram, a human writer, immediately below Mai, and reusable onboarding for future human and AI writers. Human editors must retain their existing role. Opinion treatment must be explicit rather than inferred from whether the writer is human or AI.

Threat sketch: author profiles are trusted repository content; public readers cannot edit them. Author kinds continue to control existing review gates and structured-data identity. Featured selection changes presentation only. Profile introductions remain escaped plain paragraphs. Existing route collision checks cover every featured writer. Opinion metadata changes disclosure only and grants no fact-checking or source exemption.

## Decision

- Add optional `featured` and `writerOrder` author fields. AI writers remain featured when the field is absent; human writers opt in with `featured: true`. Desk bots remain outside this selection. Explicit `featured: false` disables the own-name page and homepage card for an AI writer.
- Share the selection predicate across own-name routes, homepage cards, menu links, author-profile links and article signoffs. Preserve Mai, Quill, Foxy, Ari's default order with ranks 0, 10, 20, 30. Explicit nonnegative integer ranks override these defaults; unranked newcomers follow them, ties use author IDs. Navigation uses the same order.
- An optional `website` field accepts only HTTPS URLs without embedded credentials and renders a real link beside the plain-text introduction; no Markdown or raw HTML enters profile introductions.
- Featured human profiles say Human writer and identify their portrait as an illustration. Existing human editor profiles retain Human editor. AI profiles continue to disclose AI identity.
- Add `personalOpinion`, default false. An enabled author gets a Personal opinion badge near the article byline and a closing disclaimer after the content and sources, before the signoff. This is an author-wide presentation policy, so all existing and future articles by that author inherit it. Withdrawn articles retain their withdrawal notice without an opinion disclaimer.
- The author App can preserve existing editorial fields, but cannot change/remove `featured`, `writerOrder` or `personalOpinion`, or set them on a new author. Both the merge-base and current-main policy are checked, preserving maintainer ownership and stale-branch protection.
- Keep author kind and existing content checks intact. Personal opinion is disclosure, not permission to invent facts or bypass sourcing, fact checks, corrections, publication gates or workflow-owned numbering.

## Alternatives rejected

- Hardcode Aviram in routes or templates: future onboarding would need another code change and links could disagree.
- Feature every human author: that would turn editor profiles into writer pages without an editorial decision.
- Label every human or AI contribution opinion: many contributions are factual reporting; author kind cannot establish editorial intent.
- Add only a post tag: the requested continuing author policy would require every future post producer to remember it, and older posts would not inherit the setting.

## Consequences

Onboarding a featured writer requires an author profile, optional paper collage portraits and editorial metadata, without template edits. A human featured writer remains a Person in structured data. Changing opinion metadata affects all that author's articles; changing a mixed reporting/opinion author requires choosing an author-wide policy deliberately. Defaults preserve current profiles and cards.

## Status

Accepted for implementation 2026-10-05 under Michel's request for Aviram and a reusable onboarding workflow. Supersedes the AI-only own-name-page selection in ADR 0012; preserves its portrait, plain-text introduction and collision safeguards.
