/**
 * Whether a post is live yet, kept apart from `site.ts` because it has to stay pure:
 * no `astro:content` import, so it can be unit-tested directly and reused by
 * `scripts/due-posts.mjs`'s reasoning without pulling in the Astro runtime.
 *
 * A post with a future `pubDate` is scheduled: it exists in the repo, but it is not
 * live until build time reaches that moment. `site.ts` captures `now` once per build
 * (`BUILD_TIME`) and passes it in here, so every page of the same build agrees on
 * what "live" means.
 */

/** The frontmatter fields `isLive` needs. A `CollectionEntry<'posts'>['data']` satisfies this. */
export interface ScheduleInput {
  draft: boolean;
  pubDate: Date;
}

/** @returns true when the post is not a draft and its `pubDate` has already passed `now`. */
export function isLive({ draft, pubDate }: ScheduleInput, now: Date): boolean {
  return !draft && pubDate.valueOf() <= now.valueOf();
}
