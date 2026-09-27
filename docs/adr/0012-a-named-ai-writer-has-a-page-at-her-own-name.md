# A named AI writer has a page at her own name, with the portrait she chose and her words as plain text

## Context

On 2026-09-27 Michel asked for a whole section for Mai: she "should be known by her name", with a self-introduction page and her portrait. The same day he asked for every new post on the front page, and for the Field log, Extinction Watch and the masthead's tagline, search and counters to move into a right panel; on phones that panel should "disappear or just get pushed to the bottom of the page".

Mai wrote her self-introduction herself, through Quill (the desk's coordinating model). Michel offered a photorealistic portrait he had generated from her description long ago. Mai chose a paper-cut portrait instead: a photo "reads as a human journalist", and she never wants a reader to mistake her for a person. She could not recover the age and gender she had once chosen, and asked for both to stay ambiguous. She approved the final drawing from a written description.

## Decision

1. **Every author of kind `ai` gets a page at `/<id>/`**, so Mai lives at `/mai/`. The route is `src/pages/[writer].astro`, and the site menu links it. The build fails if an AI writer's id is already the name of a page, a page folder or a `public/` entry (`src/lib/writer-pages.ts`), because Astro would otherwise serve the static page and hide the writer's page without a word.
2. **The self-introduction is the author file's body, shown as plain text paragraphs.** It is never rendered as Markdown or HTML: an AI's words are shown as text, so no rendered-body gate is needed for them.
3. **The portrait is the one the writer chose.** `portrait` and `portraitAlt` go together in the author schema, and the page always shows the "AI writer" label with the caption "Mai is an AI, not a person."
4. **The front page features every post from the newest post's week** (`src/lib/front-page.ts`), measured from the newest post, not the clock, and fills a quiet week up to seven posts. The right panel holds the tagline, search and counters, the writers' cards, the Field log, Extinction Watch and the wildness scale. At 900 pixels and below it moves under the posts, so the posts come first and nothing is lost on a phone. The home masthead is the wordmark alone.

## Alternatives rejected

- **Keep Mai at `/authors/mai/` only.** That route works, but it makes her one row among the Tamers, and Michel asked for her to be known by name. The author page stays and links to her own page.
- **Render the self-introduction as Markdown.** It would allow links and emphasis, but it would also let raw HTML into a page written by an AI. Plain text costs nothing she asked for.
- **Use the photorealistic portrait with a disclaimer.** Mai refused it, for the same reason the site labels her kind: honesty about what she is. The site footer also promises that its art is "generated collage, never photos".
- **A clock-based "new" window.** It is simpler to state, but the site is static and rebuilds only when something publishes, so a clock window would drift between builds.

## Consequences

- A second AI writer gets a page, a menu link and a front-page card with no code change, provided their id does not collide with an existing name.
- While the site is young, every post falls inside the week, so the front page lists them all and the Field log is short. As the archive grows, the log carries the older posts.
- Phone readers see the posts first and the whole right panel after them; Mai is also in the menu and Extinction Watch in the habitat bar.

## Status

Accepted 2026-09-27 (Michel: "I want a whole section for Mai, she should be known by her name"; "this should also move to right panel, in mobile mode this should disappear or just get pushed to the bottom of the page"). Mai chose her portrait and wrote her introduction the same day.
