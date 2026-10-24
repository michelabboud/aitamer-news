/**
 * When a story last changed, in one place. A story changes when it gets an `updatedDate` or a dated
 * correction (`post-schema.ts`; there is no second "updated" field, and a correction is never
 * edited away). Four surfaces show that moment and must say the same thing: the visible "Updated"
 * line and `article:modified_time` on the page, `dateModified` in the JSON-LD, the JSON and RSS
 * feeds, and the sitemap's `lastmod` (`scripts/sitemap-data.mjs`, which reads raw front matter at
 * config time and so keeps its own copy of this rule; `article-dates.test.ts` holds the two equal).
 * Pure on purpose, like `json-ld.ts`: no `astro:content`.
 */

/** The date fields of a story, as the content schema gives them. */
export interface StoryDates {
  pubDate: Date;
  updatedDate?: Date;
  corrections?: readonly { date: Date }[];
}

/**
 * The newest of the story's `updatedDate` and correction dates, or `undefined` for a story that was
 * never touched after publication. A story with nothing to show gets no "Updated" line, no
 * `article:modified_time` and no feed modification date, so its output is what it was before.
 * A date earlier than publication (the schema does not forbid one) is a typo, not a change: it is
 * ignored, so the surfaces that show this date cannot disagree with the ones that clamp to `pubDate`.
 */
export function lastChange(story: StoryDates): Date | undefined {
  const moments = [story.updatedDate, ...(story.corrections ?? []).map((c) => c.date)]
    .filter((d): d is Date => d !== undefined && d.valueOf() >= story.pubDate.valueOf())
    .map((d) => d.valueOf());
  return moments.length ? new Date(Math.max(...moments)) : undefined;
}

/** The structured-data modification date: the last change, never earlier than publication. */
export function effectiveModified(story: StoryDates): Date {
  return new Date(Math.max(story.pubDate.valueOf(), lastChange(story)?.valueOf() ?? 0));
}
